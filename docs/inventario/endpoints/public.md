<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `public`

- **Bloque:** —
- **Operaciones:** 4 (4 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 4
- **Tablas distintas que tocan:** 14
- **Respuestas de error y detalle contractual:** `openapi/endpoints/public.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/public/profiles/f/{slug}/branch-availability` | Disponibilidad de una receta en las sucursales de una farmacia | BAJO | 12 | pública |
| 2 | GET | `/public/profiles/f/{slug}/branches` | Sucursales de una farmacia, desde su ficha pública | BAJO | 6 | pública |
| 3 | GET | `/public/profiles/f/{slug}/products` | Productos que ofrece una farmacia, desde su ficha pública | BAJO | 9 | pública |
| 4 | GET | `/public/profiles/o/{slug}/services` | Servicios que ofrece una organización, desde su ficha pública | BAJO | 4 | pública |

---

## 1. POST /public/profiles/f/{slug}/branch-availability

- **Origen:** CONTRATO
- **Nombre:** Disponibilidad de una receta en las sucursales de una farmacia
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicCatalogController.pharmacyBranchAvailability` — `src/modules/public/presentation/controllers/public-catalog.controller.ts:102`

### Qué es y para qué sirve (negocio)

Disponibilidad de una receta en las sucursales de una farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /public/profiles/f/{slug}/branch-availability` la atiende `PublicCatalogController.pharmacyBranchAvailability` (src/modules/public/presentation/controllers/public-catalog.controller.ts:102). Es una ruta pública: no exige token. Valida el cuerpo como `PublicPrescriptionAvailabilityDto` (3 campos, 1 obligatorio). Delega en `PublicPharmacyBranchesService.availability`. Lee common.addresses, community.public_profiles, directory.branches, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/public/presentation/controllers/public-catalog.controller.ts:102` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/public/presentation/controllers/public-catalog.controller.ts:102` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicCatalogRepository.findVisibleProfileBySlug | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:79` |
| `directory.branches` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesRepository.findInStockMatches | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:119` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesRepository.findInStockMatches | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:119` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesRepository.findInStockMatches | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:119` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesRepository.findInStockMatches | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:119` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesRepository.findInStockMatches | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:119` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesRepository.findInStockMatches | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:119` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranchAvailability → PublicPharmacyBranchesService.availability → PublicPharmacyBranchesRepository.findInStockMatches | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:119` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo — DTO `PublicPrescriptionAvailabilityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<string>` | Sí | longitud máxima PRESCRIPTION_ITEM_MAX_LENGTH; mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(PRESCRIPTION_MAX_ITEMS)` `@IsString({ each: true })` `@MaxLength(PRESCRIPTION_ITEM_MAX_LENGTH, { each: true })` | Texto libre: una receta de papel no trae ids de producto. Vacíos y repetidos (sin tildes) se ignoran. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:42` |
| `lat` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf((dto: PublicPrescriptionAvailabilityDto) => dto.lng !== undefined)` `@Type(() => Number)` `@IsNumber()` `@IsLatitude()` | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:50` |
| `lng` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf((dto: PublicPrescriptionAvailabilityDto) => dto.lat !== undefined)` `@Type(() => Number)` `@IsNumber()` `@IsLongitude()` | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:58` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "items": [
    "Paracetamol 500 mg",
    "Losartán"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "items": [
    "Paracetamol 500 mg",
    "Losartán"
  ],
  "lat": -17.78,
  "lng": -63.18
}
```

</details>

### Respuesta — `Promise<PublicBranchAvailabilityResponseDto>` · DTO `PublicBranchAvailabilityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PublicBranchAvailabilityDto>` | Sí | — | — | Ya ordenadas: completas primero, después la más cercana. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:193` |
| `items[].branch` | `PublicPharmacyBranchDto` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:165` |
| `items[].branch.id` | `string` | Sí | formato uuid | — | La sede (`pharmacy.pharmacy_sites`): la clave de la sucursal. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:74` |
| `items[].branch.slug` | `string` | Sí | — | — | El slug de la ficha pública; todas las sedes de un tenant lo comparten. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:78` |
| `items[].branch.name` | `string` | Sí | — | — | «Farmacorp · San Miguel». | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:82` |
| `items[].branch.siteName` | `string` | Sí | — | — | Sólo la sucursal («San Miguel»). | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:86` |
| `items[].branch.city` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:89` |
| `items[].branch.addressText` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:92` |
| `items[].branch.phone` | `string` | Sí | admite null | — | Siempre `null` por ahora: la sede no tiene teléfono en el modelo. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:96` |
| `items[].branch.openingHours` | `string` | Sí | admite null | — | Siempre `null` por ahora: no hay horario estructurado; ver `description`. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:100` |
| `items[].branch.description` | `string` | Sí | admite null | — | Lo que la cadena escribió de esa sucursal (horario, piso…), P54. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:104` |
| `items[].branch.locationUrl` | `string` | Sí | admite null | — | Enlace de mapa `http(s)` que pegó la cadena, P54. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:108` |
| `items[].branch.location` | `PublicGeoPointDto` | Sí | — | — | Sin punto no hay pin ni distancia. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:112` |
| `items[].branch.location.lat` | `number` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:64` |
| `items[].branch.location.lng` | `number` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:67` |
| `items[].branch.locationAccuracy` | `string` | Sí | admite null | — | Siempre `null` por ahora: el modelo no guarda la precisión del punto. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:116` |
| `items[].branch.isCurrent` | `boolean` | Sí | — | — | `true` sólo si la cadena tiene una única sucursal: es la de la ficha. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:120` |
| `items[].matches` | `array<PublicBranchMatchDto>` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:168` |
| `items[].matches[].term` | `string` | Sí | — | — | Lo que la persona escribió. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:143` |
| `items[].matches[].genericName` | `string` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:146` |
| `items[].matches[].brandName` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:149` |
| `items[].matches[].presentation` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:152` |
| `items[].matches[].price` | `string` | Sí | admite null | — | Texto exacto; `null` si no hay precio publicado. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:156` |
| `items[].matches[].currency` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:159` |
| `items[].missing` | `array<string>` | Sí | — | — | Los renglones que no tiene o tiene agotados. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:172` |
| `items[].complete` | `boolean` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:175` |
| `items[].totalAmount` | `string` | Sí | admite null | — | Suma exacta de lo encontrado; `null` si no hay nada, falta un precio o mezclan monedas. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:179` |
| `items[].currency` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:182` |
| `items[].distanceKm` | `number` | Sí | admite null | — | En línea recta, una decimal; `null` sin ubicación de origen o sin punto. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:186` |
| `count` | `number` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:196` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:199` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/public.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Public catalog module — etapa `ctrl:PublicCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /public/profiles/f/{slug}/branches

- **Origen:** CONTRATO
- **Nombre:** Sucursales de una farmacia, desde su ficha pública
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicCatalogController.pharmacyBranches` — `src/modules/public/presentation/controllers/public-catalog.controller.ts:82`

### Qué es y para qué sirve (negocio)

Sucursales de una farmacia, desde su ficha pública.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /public/profiles/f/{slug}/branches` la atiende `PublicCatalogController.pharmacyBranches` (src/modules/public/presentation/controllers/public-catalog.controller.ts:82). Es una ruta pública: no exige token. Delega en `PublicPharmacyBranchesService.branches`. Lee common.addresses, community.public_profiles, directory.branches, pharmacy.pharmacies, pharmacy.pharmacy_sites, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/public/presentation/controllers/public-catalog.controller.ts:82` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/public/presentation/controllers/public-catalog.controller.ts:82` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranches → PublicPharmacyBranchesService.branches → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranches → PublicPharmacyBranchesService.branches → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicCatalogRepository.findVisibleProfileBySlug | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:79` |
| `directory.branches` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranches → PublicPharmacyBranchesService.branches → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranches → PublicPharmacyBranchesService.branches → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranches → PublicPharmacyBranchesService.branches → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyBranches → PublicPharmacyBranchesService.branches → PublicPharmacyBranchesService.loadBranchesWithTenant → PublicPharmacyBranchesRepository.findPublicSites | `src/modules/public/infrastructure/repositories/public-pharmacy-branches.repository.ts:52` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicPharmacyBranchPageDto>` · DTO `PublicPharmacyBranchPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PublicPharmacyBranchDto>` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:126` |
| `items[].id` | `string` | Sí | formato uuid | — | La sede (`pharmacy.pharmacy_sites`): la clave de la sucursal. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:74` |
| `items[].slug` | `string` | Sí | — | — | El slug de la ficha pública; todas las sedes de un tenant lo comparten. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:78` |
| `items[].name` | `string` | Sí | — | — | «Farmacorp · San Miguel». | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:82` |
| `items[].siteName` | `string` | Sí | — | — | Sólo la sucursal («San Miguel»). | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:86` |
| `items[].city` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:89` |
| `items[].addressText` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:92` |
| `items[].phone` | `string` | Sí | admite null | — | Siempre `null` por ahora: la sede no tiene teléfono en el modelo. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:96` |
| `items[].openingHours` | `string` | Sí | admite null | — | Siempre `null` por ahora: no hay horario estructurado; ver `description`. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:100` |
| `items[].description` | `string` | Sí | admite null | — | Lo que la cadena escribió de esa sucursal (horario, piso…), P54. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:104` |
| `items[].locationUrl` | `string` | Sí | admite null | — | Enlace de mapa `http(s)` que pegó la cadena, P54. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:108` |
| `items[].location` | `PublicGeoPointDto` | Sí | — | — | Sin punto no hay pin ni distancia. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:112` |
| `items[].location.lat` | `number` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:64` |
| `items[].location.lng` | `number` | Sí | — | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:67` |
| `items[].locationAccuracy` | `string` | Sí | admite null | — | Siempre `null` por ahora: el modelo no guarda la precisión del punto. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:116` |
| `items[].isCurrent` | `boolean` | Sí | — | — | `true` sólo si la cadena tiene una única sucursal: es la de la ficha. | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:120` |
| `nextCursor` | `string` | Sí | admite null | — | Siempre `null`: la lista entera entra en una página (tope 200). | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:130` |
| `totalHint` | `number` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:133` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/public/presentation/dto/public-pharmacy-branches.dto.ts:136` |

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

## 3. GET /public/profiles/f/{slug}/products

- **Origen:** CONTRATO
- **Nombre:** Productos que ofrece una farmacia, desde su ficha pública
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicCatalogController.pharmacyProducts` — `src/modules/public/presentation/controllers/public-catalog.controller.ts:62`

### Qué es y para qué sirve (negocio)

Productos que ofrece una farmacia, desde su ficha pública.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /public/profiles/f/{slug}/products` la atiende `PublicCatalogController.pharmacyProducts` (src/modules/public/presentation/controllers/public-catalog.controller.ts:62). Es una ruta pública: no exige token. Delega en `PublicCatalogService.pharmacyProducts`. Lee community.public_profiles, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/public/presentation/controllers/public-catalog.controller.ts:62` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/public/presentation/controllers/public-catalog.controller.ts:62` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogService.typeProfile → PublicCatalogRepository.findVisibleProfileBySlug | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:79` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:161` |

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

## 4. GET /public/profiles/o/{slug}/services

- **Origen:** CONTRATO
- **Nombre:** Servicios que ofrece una organización, desde su ficha pública
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicCatalogController.organizationServices` — `src/modules/public/presentation/controllers/public-catalog.controller.ts:48`

### Qué es y para qué sirve (negocio)

Servicios que ofrece una organización, desde su ficha pública.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /public/profiles/o/{slug}/services` la atiende `PublicCatalogController.organizationServices` (src/modules/public/presentation/controllers/public-catalog.controller.ts:48). Es una ruta pública: no exige token. Delega en `PublicCatalogService.organizationServices`. Lee billing.service_catalog, community.public_profiles, practice.practices, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/public/presentation/controllers/public-catalog.controller.ts:48` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/public/presentation/controllers/public-catalog.controller.ts:48` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogRepository.findOfferedServices | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:110` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogService.typeProfile → PublicCatalogRepository.findVisibleProfileBySlug | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:79` |
| `practice.practices` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogRepository.findOfferedServices | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:110` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogRepository.findOfferedServices | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:110` |

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

