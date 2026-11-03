<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy`

- **Bloque:** Farmacia (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)
- **Operaciones:** 39 (39 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 4 · MEDIO 14 · BAJO 21
- **Tablas distintas que tocan:** 39
- **Respuestas de error y detalle contractual:** `openapi/endpoints/pharmacy.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/pharmacies` | Alta de farmacia con licencia inicial | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 2 | GET | `/pharmacies/{pharmacyId}/categories` | Categorías de la farmacia (sólo su personal) | BAJO | 2 | SECURITY_ADMIN, PHARMACY_STAFF |
| 3 | POST | `/pharmacies/{pharmacyId}/categories` | Crear una categoría de la farmacia | MEDIO | 2 | SECURITY_ADMIN, PHARMACY_STAFF |
| 4 | DELETE | `/pharmacies/{pharmacyId}/categories/{categoryId}` | Eliminar una categoría de la farmacia | ALTO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 5 | PATCH | `/pharmacies/{pharmacyId}/categories/{categoryId}` | Renombrar una categoría de la farmacia | MEDIO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 6 | POST | `/pharmacies/{pharmacyId}/categories/bulk` | Cargar categorías en lote, con vista previa | BAJO | 0 | SECURITY_ADMIN, PHARMACY_STAFF |
| 7 | POST | `/pharmacies/{pharmacyId}/integration-connections` | Establecer conexión de integración externa | MEDIO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 8 | POST | `/pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings` | Mapear producto a código de proveedor externo | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 9 | DELETE | `/pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings/{mappingId}` | Deshacer un vínculo con un código de proveedor externo | ALTO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 10 | PATCH | `/pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings/{mappingId}` | Corregir un vínculo con un código de proveedor externo | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 11 | PATCH | `/pharmacies/{pharmacyId}/inventory` | Guardar el inventario declarado de varios productos (todo o nada) | BAJO | 1 | SECURITY_ADMIN, PHARMACY_STAFF |
| 12 | POST | `/pharmacies/{pharmacyId}/licenses/{licenseId}/verify` | Verificar licencia y aprobar farmacia | MEDIO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 13 | POST | `/pharmacies/{pharmacyId}/on-call-shifts/{shiftId}/cancel` | Cancelar un turno de guardia (deja de publicarse) | BAJO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 14 | GET | `/pharmacies/{pharmacyId}/opening-hours` | Horario declarado de las sedes: 24 h y turnos vigentes y próximos | BAJO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 15 | POST | `/pharmacies/{pharmacyId}/price-lists` | Crear lista de precios (pública / por aseguradora) | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 16 | POST | `/pharmacies/{pharmacyId}/price-lists/{priceListId}/close` | Cerrar/expirar lista de precios | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 17 | POST | `/pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` | Fijar/versionar precio de producto | MEDIO | 5 | SECURITY_ADMIN, PHARMACY_STAFF |
| 18 | POST | `/pharmacies/{pharmacyId}/prices/bulk` | Cargar precios de venta en lote, con vista previa | BAJO | 0 | SECURITY_ADMIN, PHARMACY_STAFF |
| 19 | POST | `/pharmacies/{pharmacyId}/products` | Publicar producto en catálogo con identificadores | ALTO | 20 | SECURITY_ADMIN, PHARMACY_STAFF |
| 20 | DELETE | `/pharmacies/{pharmacyId}/products/{productId}` | Retirar (soft-delete) producto del catálogo | MEDIO | 6 | SECURITY_ADMIN, PHARMACY_STAFF |
| 21 | PATCH | `/pharmacies/{pharmacyId}/products/{productId}` | Editar un producto del catálogo de la farmacia | ALTO | 22 | SECURITY_ADMIN, PHARMACY_STAFF |
| 22 | POST | `/pharmacies/{pharmacyId}/products/bulk` | Cargar productos en lote, con vista previa | BAJO | 0 | SECURITY_ADMIN, PHARMACY_STAFF |
| 23 | POST | `/pharmacies/{pharmacyId}/projections` | Proyectar catálogo y precios a read-model | BAJO | 2 | SECURITY_ADMIN, PHARMACY_STAFF |
| 24 | POST | `/pharmacies/{pharmacyId}/sites` | Registrar sede dispensadora | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 25 | POST | `/pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts` | Registrar un turno de guardia de la sede | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 26 | PUT | `/pharmacies/{pharmacyId}/sites/{siteId}/open-24h` | Declarar si la sede abre las 24 horas | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 27 | POST | `/pharmacies/{pharmacyId}/sites/bulk` | Cargar sucursales (sedes de venta) en lote, con vista previa | BAJO | 0 | SECURITY_ADMIN, PHARMACY_STAFF |
| 28 | GET | `/pharmacy/catalog-products` | Buscar en el catálogo universal de medicamentos | BAJO | 4 | sesión (sin roles) |
| 29 | GET | `/pharmacy/pharmacies` | Listar farmacias publicadas del tenant activo | BAJO | 4 | sesión (sin roles) |
| 30 | GET | `/pharmacy/pharmacies/{id}` | Consultar el perfil de una farmacia | BAJO | 9 | sesión (sin roles) |
| 31 | GET | `/pharmacy/pharmacies/{id}/contacts` | Representante legal y gerencias de la farmacia (sólo su personal) | BAJO | 10 | sesión (sin roles) |
| 32 | GET | `/pharmacy/pharmacies/{id}/licenses` | Licencias de la farmacia (sólo su personal) | BAJO | 5 | sesión (sin roles) |
| 33 | GET | `/pharmacy/pharmacies/{id}/summary` | Resumen del catálogo de la farmacia (sólo su personal) | BAJO | 8 | sesión (sin roles) |
| 34 | GET | `/pharmacy/products` | Buscar productos publicados por texto, medicamento o farmacia | BAJO | 8 | sesión (sin roles) |
| 35 | GET | `/pharmacy/sites` | Listar sedes publicadas, sueltas | BAJO | 7 | sesión (sin roles) |
| 36 | GET | `/pharmacy/sites/{siteId}/prices` | Consultar los precios públicos vigentes de una sede | BAJO | 6 | sesión (sin roles) |
| 37 | GET | `/public/medications` | Vitrina pública de medicamentos con disponibilidad por farmacia | BAJO | 9 | pública |
| 38 | GET | `/public/medications/{conceptId}/availability` | Farmacias que publican un medicamento, con precio y distancia | BAJO | 9 | pública |
| 39 | GET | `/public/pharmacies/open-now` | Farmacias abiertas ahora: 24 h o de turno vigente | BAJO | 6 | pública |

---

## 1. POST /pharmacies

- **Origen:** CONTRATO
- **Nombre:** Alta de farmacia con licencia inicial
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createPharmacy` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:285`

### Qué es y para qué sirve (negocio)

Alta de farmacia con licencia inicial. Caso de uso UC-24-01: Alta de farmacia con licencia inicial (DRAFT / PENDING). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies` la atiende `PharmacyController.createPharmacy` (src/modules/pharmacy/controllers/pharmacy.controller.ts:285). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreatePharmacyDto` (12 campos, 5 obligatorios). Delega en `PharmaciesService.createPharmacy`. Crea filas en pharmacy.pharmacies, pharmacy.pharmacy_licenses, pharmacy.pharmacy_product_categories. Lee pharmacy.pharmacies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:285` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacies` | ESCRIBE | CREA | DIRECTA | PharmacyController.createPharmacy → PharmaciesService.createPharmacy → PharmaciesRepository.create | `src/modules/pharmacy/repositories/pharmacies.repository.ts:98` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyController.createPharmacy → PharmaciesService.createPharmacy → PharmaciesRepository.findByTenantAndCode | `src/modules/pharmacy/repositories/pharmacies.repository.ts:93` |
| `pharmacy.pharmacy_licenses` | ESCRIBE | CREA | DIRECTA | PharmacyController.createPharmacy → PharmaciesService.createPharmacy → PharmacyLicensesRepository.create | `src/modules/pharmacy/repositories/pharmacy-licenses.repository.ts:76` |
| `pharmacy.pharmacy_product_categories` | ESCRIBE | CREA | POR_SQL | PharmacyController.createPharmacy → PharmaciesService.createPharmacy → PharmacyCategoriesService.provisionDefaults → PharmacyCatalogRepository.insertMissingCategories | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:126` |

### Cuerpo — DTO `CreatePharmacyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario de la farmacia | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:85` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la farmacia por tenant | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:97` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Razón social | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:106` |
| `tradeName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre comercial | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:115` |
| `isRetail` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Tenant no público / farmacia interna | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:126` |
| `license` | `InitialLicenseDto` | Sí | — | `@ValidateNested()` `@Type(() => InitialLicenseDto)` | Licencia inicial de la farmacia | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:137` |
| `license.licenseNumber` | `string` | Sí | longitud máxima 200 | — | Número de licencia | sin fuente |
| `license.issuingAuthorityTenantId` | `string` | No | formato uuid | — | Tenant de la autoridad emisora | sin fuente |
| `license.jurisdictionConceptId` | `string` | No | formato uuid | — | Concept id de la jurisdicción | sin fuente |
| `license.validFrom` | `string` | No | formato date | — | Inicio de vigencia | sin fuente |
| `license.validTo` | `string` | No | formato date | — | Fin de vigencia | sin fuente |
| `license.evidenceFileId` | `string` | No | formato uuid | — | Archivo de evidencia de la licencia | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "license": {
    "licenseNumber": "valor-ejemplo"
  }
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "tradeName": "Nombre de ejemplo",
  "isRetail": false,
  "license": {
    "licenseNumber": "valor-ejemplo",
    "issuingAuthorityTenantId": "00000000-0000-4000-8000-000000000001",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
    "validFrom": "2026-07-31",
    "validTo": "2026-07-31",
    "evidenceFileId": "00000000-0000-4000-8000-000000000001"
  }
}
```

</details>

### Respuesta — `Promise<PharmacyResponseDto>` · DTO `PharmacyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:18` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:24` |
| `legalName` | `string` | Sí | — | — | Valor de legal name mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:30` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:36` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/pharmacy/dto/responses.dto.ts:45` |
| `licenseId` | `string` | Sí | formato uuid | — | Id de la licencia inicial creada | `src/modules/pharmacy/dto/responses.dto.ts:54` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:60` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una farmacia con ese código en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:130` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-01`

---

## 2. GET /pharmacies/{pharmacyId}/categories

- **Origen:** CONTRATO
- **Nombre:** Categorías de la farmacia (sólo su personal)
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.listCategories` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:106`

### Qué es y para qué sirve (negocio)

Categorías de la farmacia (sólo su personal). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacies/{pharmacyId}/categories` la atiende `PharmacyController.listCategories` (src/modules/pharmacy/controllers/pharmacy.controller.ts:106). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyCategoriesService.list`. Lee pharmacy.pharmacy_product_categories, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:106` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyController.listCategories → PharmacyCategoriesService.list → PharmacyCatalogRepository.listCategories | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:55` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.listCategories → PharmacyCategoriesService.list → PharmacyCatalogRepository.countLiveProductsByCategory | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyCategoryListDto>` · DTO `PharmacyCategoryListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyCategoryItemDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:793` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:785` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:786` |
| `items[].productCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:787` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /pharmacies/{pharmacyId}/categories

- **Origen:** CONTRATO
- **Nombre:** Crear una categoría de la farmacia
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createCategory` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:117`

### Qué es y para qué sirve (negocio)

Crear una categoría de la farmacia. Caso de uso P47 D8: Categorías de la vitrina (409 con nombre repetido o con productos vivos). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/categories` la atiende `PharmacyController.createCategory` (src/modules/pharmacy/controllers/pharmacy.controller.ts:117). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyCategoryNameDto` (1 campo, 1 obligatorio). Delega en `PharmacyCategoriesService.create`. Crea filas en pharmacy.pharmacy_product_categories. Lee pharmacy.pharmacy_product_categories.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:117` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_product_categories` | ESCRIBE | CREA | DIRECTA | PharmacyController.createCategory → PharmacyCategoriesService.create → PharmacyCatalogRepository.createCategory | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:102` |
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyController.createCategory → PharmacyCategoriesService.create → PharmacyCatalogRepository.findCategoryByKey | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:89` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyCategoryNameDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(CATEGORY_NAME_MAX)` | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:34` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<PharmacyCategoryItemDto>` · DTO `PharmacyCategoryItemDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:785` |
| `name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:786` |
| `productCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:787` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una categoría con ese nombre |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `P47 D8`

---

## 4. DELETE /pharmacies/{pharmacyId}/categories/{categoryId}

- **Origen:** CONTRATO
- **Nombre:** Eliminar una categoría de la farmacia
- **Bloque:** Farmacia
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.deleteCategory` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:163`

### Qué es y para qué sirve (negocio)

Eliminar una categoría de la farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`DELETE /pharmacies/{pharmacyId}/categories/{categoryId}` la atiende `PharmacyController.deleteCategory` (src/modules/pharmacy/controllers/pharmacy.controller.ts:163). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyCategoriesService.remove`. Actualiza pharmacy.pharmacy_products. Borra de pharmacy.pharmacy_product_categories. Lee pharmacy.pharmacy_product_categories, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:163` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, categoryId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:163` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_product_categories` | BORRA | BORRA | POR_TIPO | PharmacyController.deleteCategory → PharmacyCategoriesService.remove | `src/modules/pharmacy/services/pharmacy-categories.service.ts:160` |
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyController.deleteCategory → PharmacyCategoriesService.remove → PharmacyCategoriesService.requireCategory → PharmacyCatalogRepository.findCategory | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:77` |
| `pharmacy.pharmacy_products` | ESCRIBE | ACTUALIZA | POR_SQL | PharmacyController.deleteCategory → PharmacyCategoriesService.remove → PharmacyCatalogRepository.detachCategoryFromRetired | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:180` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.deleteCategory → PharmacyCategoriesService.remove → PharmacyCatalogRepository.countLiveProductsByCategory | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `categoryId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/pharmacy/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Categoría no encontrada |
| 409 | `CONFLICT` | ConflictException: La categoría tiene productos: páselos a otra antes de eliminarla |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. PATCH /pharmacies/{pharmacyId}/categories/{categoryId}

- **Origen:** CONTRATO
- **Nombre:** Renombrar una categoría de la farmacia
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.renameCategory` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:139`

### Qué es y para qué sirve (negocio)

Renombrar una categoría de la farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`PATCH /pharmacies/{pharmacyId}/categories/{categoryId}` la atiende `PharmacyController.renameCategory` (src/modules/pharmacy/controllers/pharmacy.controller.ts:139). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyCategoryNameDto` (1 campo, 1 obligatorio). Delega en `PharmacyCategoriesService.rename`. Actualiza pharmacy.pharmacy_product_categories. Lee pharmacy.pharmacy_product_categories, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, categoryId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:139` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_product_categories` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.renameCategory → PharmacyCategoriesService.rename | `src/modules/pharmacy/services/pharmacy-categories.service.ts:123` |
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyController.renameCategory → PharmacyCategoriesService.rename → PharmacyCatalogRepository.findCategoryByKey | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:89` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.renameCategory → PharmacyCategoriesService.rename → PharmacyCatalogRepository.countLiveProductsByCategory | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `categoryId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyCategoryNameDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(CATEGORY_NAME_MAX)` | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:34` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<PharmacyCategoryItemDto>` · DTO `PharmacyCategoryItemDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:785` |
| `name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:786` |
| `productCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:787` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Categoría no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una categoría con ese nombre |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /pharmacies/{pharmacyId}/categories/bulk

- **Origen:** CONTRATO
- **Nombre:** Cargar categorías en lote, con vista previa
- **Bloque:** Farmacia
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyBulkController.bulkCategories` — `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:53`

### Qué es y para qué sirve (negocio)

Cargar categorías en lote, con vista previa. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/categories/bulk` la atiende `PharmacyBulkController.bulkCategories` (src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `BulkRequestDto` (3 campos, 2 obligatorios). Delega en `PharmacyBulkService.run`. No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: las categorías por `PharmacyCategoriesService.create`, las mismas tablas que la ruta unitaria..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:53` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: las categorías por `PharmacyCategoriesService.create`, las mismas tablas que la ruta unitaria.. _(manual, 2026-10-30; fuente: `src/modules/pharmacy/services/bulk/categories.bulk-handler.ts`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `BulkRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mode` | `string` | Sí | valores: CREATE, UPDATE, UPSERT | `@IsIn(BULK_MODES)` | — | `src/common/dto/bulk-load.dto.ts:50` |
| `dryRun` | `boolean` | No | — | `@ValidateIf((_body: unknown, value: unknown) => value !== undefined)` `@IsStrictBoolean()` | — | `src/common/dto/bulk-load.dto.ts:61` |
| `rows` | `array<object>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(BULK_MAX_ROWS)` `@IsObject({ each: true })` `@Type(() => Object)` | — | `src/common/dto/bulk-load.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

</details>

### Respuesta — `Promise<BulkResponseDto>` · DTO `BulkResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dryRun` | `boolean` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:144` |
| `results` | `array<BulkRowResultDto>` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:150` |
| `results[].row` | `number` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:109` |
| `results[].outcome` | `string` | Sí | valores: CREATED, UPDATED, REJECTED, UNCHANGED | — | — | `src/common/dto/bulk-load.dto.ts:115` |
| `results[].id` | `string` | No | formato uuid | — | — | `src/common/dto/bulk-load.dto.ts:121` |
| `results[].errors` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:127` |
| `results[].errors[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].errors[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].errors[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |
| `results[].warnings` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:135` |
| `results[].warnings[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].warnings[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].warnings[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: dryRun debe ser true o false |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DryRunRollback: {await withWarnings(tx, ctx, handler, { outcome: 'UNCHANGED'…}; DryRunRollback: {outcome} |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.spec.ts:87` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyBulkController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /pharmacies/{pharmacyId}/integration-connections

- **Origen:** CONTRATO
- **Nombre:** Establecer conexión de integración externa
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createConnection` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:466`

### Qué es y para qué sirve (negocio)

Establecer conexión de integración externa. Caso de uso UC-24-07: Establecer conexión de integración. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/integration-connections` la atiende `PharmacyController.createConnection` (src/modules/pharmacy/controllers/pharmacy.controller.ts:466). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreateConnectionDto` (9 campos, 1 obligatorio). Delega en `PharmacyIntegrationService.createConnection`. Crea filas en pharmacy.pharmacy_integration_connections. Lee pharmacy.pharmacy_integration_connections, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:466` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:466` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_integration_connections` | ESCRIBE | CREA | DIRECTA | PharmacyController.createConnection → PharmacyIntegrationService.createConnection → PharmacyIntegrationConnectionsRepository.create | `src/modules/pharmacy/repositories/pharmacy-integration-connections.repository.ts:90` |
| `pharmacy.pharmacy_integration_connections` | LEE | LEE | DIRECTA | PharmacyController.createConnection → PharmacyIntegrationService.createConnection → PharmacyIntegrationConnectionsRepository.findByPharmacyAndConnection | `src/modules/pharmacy/repositories/pharmacy-integration-connections.repository.ts:78` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyController.createConnection → PharmacyIntegrationService.createConnection → PharmacyReferencesRepository.findPharmacySiteInPharmacy | `src/modules/pharmacy/repositories/pharmacy-references.repository.ts:20` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateConnectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `integrationMode` | `string` | Sí | valores: REALTIME, BATCH | `@IsIn(['REALTIME', 'BATCH'])` | Modo de integración | `src/modules/pharmacy/dto/create-connection.dto.ts:18` |
| `connectionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Conexión de integración externa registrada; si se omite, la fila se auto-referencia | `src/modules/pharmacy/dto/create-connection.dto.ts:30` |
| `pharmacySiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede a la que aplica la conexión | `src/modules/pharmacy/dto/create-connection.dto.ts:41` |
| `inventoryAuthorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la autoridad de inventario | `src/modules/pharmacy/dto/create-connection.dto.ts:52` |
| `supportsStockQuery` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Soporta consulta de stock | `src/modules/pharmacy/dto/create-connection.dto.ts:60` |
| `supportsPriceQuery` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Soporta consulta de precio | `src/modules/pharmacy/dto/create-connection.dto.ts:68` |
| `supportsReservation` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Soporta reserva | `src/modules/pharmacy/dto/create-connection.dto.ts:76` |
| `supportsDispenseConfirmation` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Soporta confirmación de dispensación | `src/modules/pharmacy/dto/create-connection.dto.ts:84` |
| `manualFallbackAllowed` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Permite fallback manual | `src/modules/pharmacy/dto/create-connection.dto.ts:92` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "integrationMode": "REALTIME"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "integrationMode": "REALTIME",
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "inventoryAuthorityConceptId": "00000000-0000-4000-8000-000000000001",
  "supportsStockQuery": true,
  "supportsPriceQuery": true,
  "supportsReservation": true,
  "supportsDispenseConfirmation": true,
  "manualFallbackAllowed": true
}
```

</details>

### Respuesta — `Promise<ConnectionResponseDto>` · DTO `ConnectionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:260` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy/dto/responses.dto.ts:266` |
| `connectionId` | `string` | Sí | formato uuid | — | Identificador asociado a connection. | `src/modules/pharmacy/dto/responses.dto.ts:272` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:278` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:284` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una conexión para esa integración |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:222` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-07`

---

## 8. POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings

- **Origen:** CONTRATO
- **Nombre:** Mapear producto a código de proveedor externo
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.mapProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:483`

### Qué es y para qué sirve (negocio)

Mapear producto a código de proveedor externo. Caso de uso UC-24-08: Mapear producto a código externo. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings` la atiende `PharmacyController.mapProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:483). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreateMappingDto` (4 campos, 2 obligatorios). Delega en `PharmacyIntegrationService.mapProduct`. Crea filas en pharmacy.pharmacy_external_product_mappings. Lee pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_integration_connections, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:483` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, connectionId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:483` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_external_product_mappings` | ESCRIBE | CREA | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyExternalProductMappingsRepository.create | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:87` |
| `pharmacy.pharmacy_external_product_mappings` | LEE | LEE | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyIntegrationService.assertProductFree → PharmacyExternalProductMappingsRepository.findByConnectionAndProduct | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:47` |
| `pharmacy.pharmacy_integration_connections` | LEE | LEE | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyIntegrationService.requireConnection → PharmacyIntegrationConnectionsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-integration-connections.repository.ts:69` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyIntegrationService.requireMappableProduct → PharmacyProductsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `connectionId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateMappingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto a mapear | `src/modules/pharmacy/dto/create-mapping.dto.ts:21` |
| `externalProductCode` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Código de producto en el sistema externo | `src/modules/pharmacy/dto/create-mapping.dto.ts:33` |
| `externalUnitCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de unidad en el sistema externo | `src/modules/pharmacy/dto/create-mapping.dto.ts:45` |
| `mappingVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión del mapeo | `src/modules/pharmacy/dto/create-mapping.dto.ts:54` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "externalProductCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "externalProductCode": "CODIGO_EJEMPLO",
  "externalUnitCode": "CODIGO_EJEMPLO",
  "mappingVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<MappingResponseDto>` · DTO `MappingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:293` |
| `pharmacyIntegrationConnectionId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:299` |
| `pharmacyProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:305` |
| `externalProductCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/responses.dto.ts:311` |
| `externalUnitCode` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/responses.dto.ts:317` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/pharmacy/dto/responses.dto.ts:326` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/responses.dto.ts:332` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada; ResourceNotFoundException: Producto no encontrado |
| 409 | `CONFLICT` | ConflictException: El producto ya está mapeado en esta conexión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El producto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:233` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-08`

---

## 9. DELETE /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings/{mappingId}

- **Origen:** CONTRATO
- **Nombre:** Deshacer un vínculo con un código de proveedor externo
- **Bloque:** Farmacia
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.unmapProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:538`

### Qué es y para qué sirve (negocio)

Deshacer un vínculo con un código de proveedor externo. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`DELETE /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings/{mappingId}` la atiende `PharmacyController.unmapProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:538). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyIntegrationService.unmapProduct`. Borra de pharmacy.pharmacy_external_product_mappings. Lee pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_integration_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:538` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, connectionId, mappingId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:538` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_external_product_mappings` | BORRA | BORRA | POR_TIPO | PharmacyController.unmapProduct → PharmacyIntegrationService.unmapProduct → PharmacyExternalProductMappingsRepository.remove | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:67` |
| `pharmacy.pharmacy_external_product_mappings` | LEE | LEE | DIRECTA | PharmacyController.unmapProduct → PharmacyIntegrationService.unmapProduct → PharmacyIntegrationService.requireMapping → PharmacyExternalProductMappingsRepository.findInConnection | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:59` |
| `pharmacy.pharmacy_integration_connections` | LEE | LEE | DIRECTA | PharmacyController.unmapProduct → PharmacyIntegrationService.unmapProduct → PharmacyIntegrationService.requireConnection → PharmacyIntegrationConnectionsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-integration-connections.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `connectionId` | path | Sí | `string` | — |
| `mappingId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MappingResponseDto>` · DTO `MappingResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:293` |
| `pharmacyIntegrationConnectionId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:299` |
| `pharmacyProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:305` |
| `externalProductCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/responses.dto.ts:311` |
| `externalUnitCode` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/responses.dto.ts:317` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/pharmacy/dto/responses.dto.ts:326` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/responses.dto.ts:332` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada; ResourceNotFoundException: Vínculo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:259` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. PATCH /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings/{mappingId}

- **Origen:** CONTRATO
- **Nombre:** Corregir un vínculo con un código de proveedor externo
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.updateMapping` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:506`

### Qué es y para qué sirve (negocio)

Corregir un vínculo con un código de proveedor externo. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`PATCH /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings/{mappingId}` la atiende `PharmacyController.updateMapping` (src/modules/pharmacy/controllers/pharmacy.controller.ts:506). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `UpdateMappingDto` (3 campos, 0 obligatorios). Delega en `PharmacyIntegrationService.updateMapping`. Actualiza pharmacy.pharmacy_external_product_mappings. Lee pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_integration_connections, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:506` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, connectionId, mappingId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:506` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_external_product_mappings` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.updateMapping → PharmacyIntegrationService.updateMapping | `src/modules/pharmacy/services/pharmacy-integration.service.ts:271` |
| `pharmacy.pharmacy_external_product_mappings` | LEE | LEE | DIRECTA | PharmacyController.updateMapping → PharmacyIntegrationService.updateMapping → PharmacyIntegrationService.requireMapping → PharmacyExternalProductMappingsRepository.findInConnection | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:59` |
| `pharmacy.pharmacy_integration_connections` | LEE | LEE | DIRECTA | PharmacyController.updateMapping → PharmacyIntegrationService.updateMapping → PharmacyIntegrationService.requireConnection → PharmacyIntegrationConnectionsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-integration-connections.repository.ts:69` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.updateMapping → PharmacyIntegrationService.updateMapping → PharmacyIntegrationService.requireMappableProduct → PharmacyProductsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `connectionId` | path | Sí | `string` | — |
| `mappingId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateMappingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyProductId` | `string` | No | formato uuid | `@ValidateIf((dto: UpdateMappingDto) => dto.pharmacyProductId !== undefined)` `@IsUUID()` | Producto al que pasa el vínculo (activo, de la farmacia) | `src/modules/pharmacy/dto/update-mapping.dto.ts:26` |
| `externalProductCode` | `string` | No | longitud mínima 1; longitud máxima 200 | `@ValidateIf((dto: UpdateMappingDto) => dto.externalProductCode !== undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Código de producto en el sistema externo | `src/modules/pharmacy/dto/update-mapping.dto.ts:39` |
| `externalUnitCode` | `object` | No | longitud máxima 100; admite null | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Unidad del sistema externo que equivale a una del producto; null la borra | `src/modules/pharmacy/dto/update-mapping.dto.ts:54` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "externalProductCode": "CODIGO_EJEMPLO",
  "externalUnitCode": {}
}
```

</details>

### Respuesta — `Promise<MappingResponseDto>` · DTO `MappingResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:293` |
| `pharmacyIntegrationConnectionId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:299` |
| `pharmacyProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/responses.dto.ts:305` |
| `externalProductCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/responses.dto.ts:311` |
| `externalUnitCode` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/responses.dto.ts:317` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/pharmacy/dto/responses.dto.ts:326` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/responses.dto.ts:332` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada; ResourceNotFoundException: Vínculo no encontrado; ResourceNotFoundException: Producto no encontrado |
| 409 | `CONFLICT` | ConflictException: El producto ya está mapeado en esta conexión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El producto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.BAD_REQUEST} |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:251` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. PATCH /pharmacies/{pharmacyId}/inventory

- **Origen:** CONTRATO
- **Nombre:** Guardar el inventario declarado de varios productos (todo o nada)
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.updateInventory` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:180`

### Qué es y para qué sirve (negocio)

Guardar el inventario declarado de varios productos (todo o nada). Caso de uso P47 D7: Existencias declaradas de varios productos, todo o nada. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`PATCH /pharmacies/{pharmacyId}/inventory` la atiende `PharmacyController.updateInventory` (src/modules/pharmacy/controllers/pharmacy.controller.ts:180). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyUpdateInventoryDto` (5 campos, 2 obligatorios). Delega en `PharmacyProductsService.updateInventory`. Lee pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:180` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.updateInventory → PharmacyProductsService.updateInventory | `src/modules/pharmacy/services/pharmacy-products.service.ts:366` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyUpdateInventoryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `lines` | `array<PharmacyInventoryLineDto>` | Sí | mínimo 1 elemento(s); máximo 500 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(INVENTORY_LINES_MAX)` `@ValidateNested({ each: true })` `@Type(() => InventoryLineDto)` | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:85` |
| `lines[].productId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:46` |
| `lines[].stock` | `number` | No | mínimo 0; máximo 1000000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(STOCK_MAX)` | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:54` |
| `lines[].minStock` | `number` | No | mínimo 0; máximo 1000000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(STOCK_MAX)` | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:62` |
| `lines[].inStock` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:68` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "stock": 1,
      "minStock": 1,
      "inStock": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<InventoryUpdatedDto>` · DTO `InventoryUpdatedDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `updated` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-management.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El inventario tiene líneas inválidas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `P47 D7`

---

## 12. POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar licencia y aprobar farmacia
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.verifyLicense` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:302`

### Qué es y para qué sirve (negocio)

Verificar licencia y aprobar farmacia. Caso de uso UC-24-03: Verificar licencia y aprobar farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify` la atiende `PharmacyController.verifyLicense` (src/modules/pharmacy/controllers/pharmacy.controller.ts:302). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyVerifyLicenseDto` (3 campos, 0 obligatorios). Delega en `PharmaciesService.verifyLicense`. Actualiza pharmacy.pharmacy_licenses. Lee community.public_profiles, pharmacy.pharmacy_licenses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:302` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, licenseId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:302` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | POR_SQL | PharmacyController.verifyLicense → PharmaciesService.verifyLicense → PharmaciesRepository.findTenantShowcaseId | `src/modules/pharmacy/repositories/pharmacies.repository.ts:76` |
| `pharmacy.pharmacy_licenses` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.verifyLicense → PharmaciesService.verifyLicense | `src/modules/pharmacy/services/pharmacies.service.ts:186` |
| `pharmacy.pharmacy_licenses` | LEE | LEE | DIRECTA | PharmacyController.verifyLicense → PharmaciesService.verifyLicense → PharmacyLicensesRepository.findById | `src/modules/pharmacy/repositories/pharmacy-licenses.repository.ts:59` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `licenseId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyVerifyLicenseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `approve` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | true (por defecto) verifica; false rechaza la licencia | `src/modules/pharmacy/dto/verify-license.dto.ts:17` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia usado en la verificación | `src/modules/pharmacy/dto/verify-license.dto.ts:28` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo del rechazo (si aplica) | `src/modules/pharmacy/dto/verify-license.dto.ts:40` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "approve": true,
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/pharmacy/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Licencia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La licencia no está pendiente de verificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:137` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-03`

---

## 13. POST /pharmacies/{pharmacyId}/on-call-shifts/{shiftId}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar un turno de guardia (deja de publicarse)
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.cancelOnCallShift` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:265`

### Qué es y para qué sirve (negocio)

Cancelar un turno de guardia (deja de publicarse). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/on-call-shifts/{shiftId}/cancel` la atiende `PharmacyController.cancelOnCallShift` (src/modules/pharmacy/controllers/pharmacy.controller.ts:265). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyOpeningHoursService.cancelShift`. Lee pharmacy.pharmacy_on_call_shifts, pharmacy.pharmacy_sites, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:265` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, shiftId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:265` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_on_call_shifts` | LEE | LEE | DIRECTA | PharmacyController.cancelOnCallShift → PharmacyOpeningHoursService.cancelShift → PharmacyOnCallShiftsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:66` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyController.cancelOnCallShift → PharmacyOpeningHoursService.cancelShift → PharmacySitesRepository.findById | `src/modules/pharmacy/repositories/pharmacy-sites.repository.ts:59` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyController.cancelOnCallShift → PharmacyOpeningHoursService.cancelShift → PharmacyOpeningHoursService.timeZonesOf → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:330` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `shiftId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OnCallShiftDto>` · DTO `PharmacyOnCallShiftDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:71` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:75` |
| `startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:79` |
| `endsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:83` |
| `startsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:87` |
| `endsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:91` |
| `timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:95` |
| `source` | `string` | Sí | valores: PHARMACY, PLATFORM | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:99` |
| `status` | `string` | Sí | valores: ACTIVE, CANCELLED | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:103` |
| `current` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El turno ya terminó o ya estaba cancelado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/pharmacy-on-call-shifts.int-spec.ts:444` |
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:111` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /pharmacies/{pharmacyId}/opening-hours

- **Origen:** CONTRATO
- **Nombre:** Horario declarado de las sedes: 24 h y turnos vigentes y próximos
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.getOpeningHours` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:203`

### Qué es y para qué sirve (negocio)

Horario declarado de las sedes: 24 h y turnos vigentes y próximos. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacies/{pharmacyId}/opening-hours` la atiende `PharmacyController.getOpeningHours` (src/modules/pharmacy/controllers/pharmacy.controller.ts:203). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyOpeningHoursService.getOpeningHours`. Lee pharmacy.pharmacy_on_call_shifts, pharmacy.pharmacy_sites, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:203` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:203` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_on_call_shifts` | LEE | LEE | DIRECTA | PharmacyController.getOpeningHours → PharmacyOpeningHoursService.getOpeningHours → PharmacyOnCallShiftsRepository.findUpcomingBySites | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:79` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyController.getOpeningHours → PharmacyOpeningHoursService.getOpeningHours → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:79` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyController.getOpeningHours → PharmacyOpeningHoursService.getOpeningHours → PharmacyOpeningHoursService.timeZonesOf → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:330` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOpeningHoursDto>` · DTO `PharmacyOpeningHoursDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:139` |
| `asOf` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:143` |
| `sites` | `array<PharmacySiteOpeningHoursDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:147` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:115` |
| `sites[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:119` |
| `sites[].timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:123` |
| `sites[].open24h` | `boolean` | Sí | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:127` |
| `sites[].shifts` | `array<PharmacyOnCallShiftDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:131` |
| `sites[].shifts[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:71` |
| `sites[].shifts[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:75` |
| `sites[].shifts[].startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:79` |
| `sites[].shifts[].endsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:83` |
| `sites[].shifts[].startsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:87` |
| `sites[].shifts[].endsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:91` |
| `sites[].shifts[].timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:95` |
| `sites[].shifts[].source` | `string` | Sí | valores: PHARMACY, PLATFORM | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:99` |
| `sites[].shifts[].status` | `string` | Sí | valores: ACTIVE, CANCELLED | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:103` |
| `sites[].shifts[].current` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/pharmacy-on-call-shifts.int-spec.ts:347` |
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:76` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /pharmacies/{pharmacyId}/price-lists

- **Origen:** CONTRATO
- **Nombre:** Crear lista de precios (pública / por aseguradora)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createPriceList` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:407`

### Qué es y para qué sirve (negocio)

Crear lista de precios (pública / por aseguradora). Caso de uso UC-24-05: Crear lista de precios (pública / por aseguradora). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/price-lists` la atiende `PharmacyController.createPriceList` (src/modules/pharmacy/controllers/pharmacy.controller.ts:407). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreatePriceListDto` (8 campos, 2 obligatorios). Delega en `PharmacyPricingService.createPriceList`. Crea filas en pharmacy.pharmacy_price_lists. Lee insurance.insurance_carriers, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:407` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:407` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PharmacyController.createPriceList → PharmacyPricingService.createPriceList → PharmacyReferencesRepository.isRegisteredInsurer | `src/modules/pharmacy/repositories/pharmacy-references.repository.ts:46` |
| `pharmacy.pharmacy_price_lists` | ESCRIBE | CREA | DIRECTA | PharmacyController.createPriceList → PharmacyPricingService.createPriceList → PharmacyPriceListsRepository.create | `src/modules/pharmacy/repositories/pharmacy-price-lists.repository.ts:73` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyController.createPriceList → PharmacyPricingService.createPriceList → PharmacyPriceListsRepository.findByPharmacyAndCode | `src/modules/pharmacy/repositories/pharmacy-price-lists.repository.ts:68` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyController.createPriceList → PharmacyPricingService.createPriceList → PharmacyReferencesRepository.findPharmacySiteInPharmacy | `src/modules/pharmacy/repositories/pharmacy-references.repository.ts:20` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePriceListDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de lista por farmacia | `src/modules/pharmacy/dto/create-price-list.dto.ts:28` |
| `priceListType` | `string` | Sí | valores: PUBLIC, INSURER | `@IsIn(['PUBLIC', 'INSURER'])` | Tipo de lista de precios | `src/modules/pharmacy/dto/create-price-list.dto.ts:38` |
| `pharmacySiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede a la que aplica la lista | `src/modules/pharmacy/dto/create-price-list.dto.ts:49` |
| `insurerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant aseguradora (obligatorio si tipo INSURER) | `src/modules/pharmacy/dto/create-price-list.dto.ts:60` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la moneda | `src/modules/pharmacy/dto/create-price-list.dto.ts:71` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/pharmacy/dto/create-price-list.dto.ts:82` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/pharmacy/dto/create-price-list.dto.ts:90` |
| `publicVisibility` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Visible públicamente | `src/modules/pharmacy/dto/create-price-list.dto.ts:98` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "priceListType": "PUBLIC"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "priceListType": "PUBLIC",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "insurerTenantId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "publicVisibility": true
}
```

</details>

### Respuesta — `Promise<PriceListResponseDto>` · DTO `PriceListResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:176` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy/dto/responses.dto.ts:182` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:188` |
| `priceListType` | `string` | Sí | formato uuid | — | Concept id del tipo | `src/modules/pharmacy/dto/responses.dto.ts:194` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:200` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:206` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una lista con ese código en la farmacia |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa; PreconditionFailedException: Una lista por aseguradora requiere insurerTenantId |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:189` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-05`

---

## 16. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar/expirar lista de precios
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.closePriceList` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:449`

### Qué es y para qué sirve (negocio)

Cerrar/expirar lista de precios. Caso de uso UC-24-10: Cerrar/expirar lista de precios. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:70`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close` la atiende `PharmacyController.closePriceList` (src/modules/pharmacy/controllers/pharmacy.controller.ts:449). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyPricingService.closePriceList`. Actualiza pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices. Lee pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:449` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, priceListId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:449` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_price_lists` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.closePriceList → PharmacyPricingService.closePriceList | `src/modules/pharmacy/services/pharmacy-pricing.service.ts:299` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyController.closePriceList → PharmacyPricingService.closePriceList → PharmacyPriceListsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-price-lists.repository.ts:59` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.closePriceList → PharmacyPricingService.closePriceList | `src/modules/pharmacy/services/pharmacy-pricing.service.ts:309` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyController.closePriceList → PharmacyPricingService.closePriceList → PharmacyProductPricesRepository.findActiveByList | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:115` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `priceListId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/pharmacy/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lista de precios no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La lista de precios no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:211` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-10`

---

## 17. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices

- **Origen:** CONTRATO
- **Nombre:** Fijar/versionar precio de producto
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.versionPrice` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:426`

### Qué es y para qué sirve (negocio)

Fijar/versionar precio de producto. Caso de uso UC-24-06: Fijar/versionar precio. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` la atiende `PharmacyController.versionPrice` (src/modules/pharmacy/controllers/pharmacy.controller.ts:426). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreatePriceDto` (6 campos, 2 obligatorios). Delega en `PharmacyPricingService.versionPrice`. Crea filas en pharmacy.pharmacy_product_prices. Actualiza pharmacy.pharmacy_product_prices. Lee pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:426` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, priceListId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:426` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyController.versionPrice → PharmacyPricingService.versionPrice → PharmacyPriceListsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-price-lists.repository.ts:59` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.versionPrice → PharmacyPricingService.versionPrice | `src/modules/pharmacy/services/pharmacy-pricing.service.ts:216` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | CREA | DIRECTA | PharmacyController.versionPrice → PharmacyPricingService.versionPrice → PharmacyProductPricesRepository.create | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:123` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyController.versionPrice → PharmacyPricingService.versionPrice → PharmacyProductPricesRepository.findActiveByListAndProduct | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:90` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.versionPrice → PharmacyPricingService.versionPrice → PharmacyProductsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `priceListId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePriceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto al que se fija el precio | `src/modules/pharmacy/dto/create-price.dto.ts:14` |
| `unitAmount` | `number` | Sí | mínimo 0 | `@IsNumber({ maxDecimalPlaces: 6 })` `@Min(0)` | Importe unitario | `src/modules/pharmacy/dto/create-price.dto.ts:22` |
| `taxAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 6 })` `@Min(0)` | Impuesto | `src/modules/pharmacy/dto/create-price.dto.ts:31` |
| `patientAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 6 })` `@Min(0)` | Importe a cargo del paciente | `src/modules/pharmacy/dto/create-price.dto.ts:43` |
| `insurerAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 6 })` `@Min(0)` | Importe a cargo de la aseguradora | `src/modules/pharmacy/dto/create-price.dto.ts:55` |
| `minimumQuantity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 6 })` `@Min(0)` | Cantidad mínima | `src/modules/pharmacy/dto/create-price.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "unitAmount": 12.5
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "unitAmount": 12.5,
  "taxAmount": 1.5,
  "patientAmount": 5,
  "insurerAmount": 7.5,
  "minimumQuantity": 1
}
```

</details>

### Respuesta — `Promise<PriceResponseDto>` · DTO `PriceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:215` |
| `pharmacyPriceListId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy price list. | `src/modules/pharmacy/dto/responses.dto.ts:221` |
| `pharmacyProductId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy product. | `src/modules/pharmacy/dto/responses.dto.ts:227` |
| `versionNumber` | `number` | Sí | — | — | Nº de versión de este precio | `src/modules/pharmacy/dto/responses.dto.ts:233` |
| `unitAmount` | `string` | Sí | — | — | Importe unitario | `src/modules/pharmacy/dto/responses.dto.ts:239` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:245` |
| `effectiveFrom` | `string` | Sí | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:251` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lista de precios no encontrada; ResourceNotFoundException: Producto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La lista de precios no está activa; PreconditionFailedException: El producto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:200` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-06`

---

## 18. POST /pharmacies/{pharmacyId}/prices/bulk

- **Origen:** CONTRATO
- **Nombre:** Cargar precios de venta en lote, con vista previa
- **Bloque:** Farmacia
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyBulkController.bulkPrices` — `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:89`

### Qué es y para qué sirve (negocio)

Cargar precios de venta en lote, con vista previa. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/prices/bulk` la atiende `PharmacyBulkController.bulkPrices` (src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:89). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `BulkRequestDto` (3 campos, 2 obligatorios). Delega en `PharmacyBulkService.run`. No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: los precios del producto por `PharmacyProductsService.updateProduct`, las mismas tablas que la ruta unitaria..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:89` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: los precios del producto por `PharmacyProductsService.updateProduct`, las mismas tablas que la ruta unitaria.. _(manual, 2026-10-30; fuente: `src/modules/pharmacy/services/bulk/prices.bulk-handler.ts`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `BulkRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mode` | `string` | Sí | valores: CREATE, UPDATE, UPSERT | `@IsIn(BULK_MODES)` | — | `src/common/dto/bulk-load.dto.ts:50` |
| `dryRun` | `boolean` | No | — | `@ValidateIf((_body: unknown, value: unknown) => value !== undefined)` `@IsStrictBoolean()` | — | `src/common/dto/bulk-load.dto.ts:61` |
| `rows` | `array<object>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(BULK_MAX_ROWS)` `@IsObject({ each: true })` `@Type(() => Object)` | — | `src/common/dto/bulk-load.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

</details>

### Respuesta — `Promise<BulkResponseDto>` · DTO `BulkResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dryRun` | `boolean` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:144` |
| `results` | `array<BulkRowResultDto>` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:150` |
| `results[].row` | `number` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:109` |
| `results[].outcome` | `string` | Sí | valores: CREATED, UPDATED, REJECTED, UNCHANGED | — | — | `src/common/dto/bulk-load.dto.ts:115` |
| `results[].id` | `string` | No | formato uuid | — | — | `src/common/dto/bulk-load.dto.ts:121` |
| `results[].errors` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:127` |
| `results[].errors[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].errors[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].errors[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |
| `results[].warnings` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:135` |
| `results[].warnings[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].warnings[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].warnings[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: dryRun debe ser true o false |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DryRunRollback: {await withWarnings(tx, ctx, handler, { outcome: 'UNCHANGED'…}; DryRunRollback: {outcome} |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.spec.ts:89` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyBulkController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /pharmacies/{pharmacyId}/products

- **Origen:** CONTRATO
- **Nombre:** Publicar producto en catálogo con identificadores
- **Bloque:** Farmacia
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.publishProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:343`

### Qué es y para qué sirve (negocio)

Publicar producto en catálogo con identificadores. Caso de uso UC-24-04: Publicar producto con identificadores (GTIN/NDC). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/products` la atiende `PharmacyController.publishProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:343). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyCreateProductDto` (26 campos, 1 obligatorio). Delega en `PharmacyProductsService.publishProduct`. Crea filas en pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_identifiers, pharmacy.pharmacy_product_images, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products. Actualiza pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products. Borra de pharmacy.pharmacy_product_images. Lee common.file_versions, common.files, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_categories, pharmacy.pharmacy_product_images, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:343` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:343` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyCatalogRepository.lockCatalogPriceList | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:251` |
| `pharmacy.pharmacy_price_lists` | ESCRIBE | CREA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyCatalogRepository.createCatalogPriceList | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:269` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyCatalogRepository.lockCatalogPriceList | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:256` |
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyCategoriesService.resolveByName → PharmacyCatalogRepository.findCategoryByKey | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:89` |
| `pharmacy.pharmacy_product_identifiers` | ESCRIBE | CREA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductIdentifiersRepository.create | `src/modules/pharmacy/repositories/pharmacy-product-identifiers.repository.ts:54` |
| `pharmacy.pharmacy_product_images` | BORRA | BORRA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → PharmacyCatalogRepository.replaceImages | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:219` |
| `pharmacy.pharmacy_product_images` | ESCRIBE | CREA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → PharmacyCatalogRepository.replaceImages | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:224` |
| `pharmacy.pharmacy_product_images` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → PharmacyCatalogRepository.findImageFileIds | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:199` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice | `src/modules/pharmacy/services/pharmacy-products.service.ts:585` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | CREA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyProductPricesRepository.create | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:123` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyProductPricesRepository.findActiveByListAndProduct | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:90` |
| `pharmacy.pharmacy_products` | ESCRIBE | CREA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsRepository.create | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:121` |
| `pharmacy.pharmacy_products` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.applyCatalogFields | `src/modules/pharmacy/services/pharmacy-products.service.ts:454` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsRepository.findByPharmacyAndCode | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:89` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:187` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:81` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:81` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyCreateProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `productCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de producto por farmacia | `src/modules/pharmacy/dto/create-product.dto.ts:91` |
| `catalogProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Producto del catálogo universal de medicamentos (id de `GET /pharmacy/catalog-products`). Con él, marca, genérico, concentración, forma, presentación, receta y el medicamento del vademécum los deriva el servidor y mandarlos es un 400. | `src/modules/pharmacy/dto/create-product.dto.ts:105` |
| `catalogPresentationCode` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Presentación elegida del producto del catálogo (su `code`: CN, CUM…). Sólo con `catalogProductId`. | `src/modules/pharmacy/dto/create-product.dto.ts:116` |
| `medicationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del medicamento | `src/modules/pharmacy/dto/create-product.dto.ts:124` |
| `manufacturerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant fabricante | `src/modules/pharmacy/dto/create-product.dto.ts:132` |
| `brandName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Marca comercial | `src/modules/pharmacy/dto/create-product.dto.ts:141` |
| `genericName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre genérico | `src/modules/pharmacy/dto/create-product.dto.ts:150` |
| `strengthText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Concentración (texto libre) | `src/modules/pharmacy/dto/create-product.dto.ts:162` |
| `dosageFormConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la forma farmacéutica | `src/modules/pharmacy/dto/create-product.dto.ts:173` |
| `packageSizeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Tamaño de empaque (texto libre) | `src/modules/pharmacy/dto/create-product.dto.ts:185` |
| `requiresPrescription` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Requiere receta | `src/modules/pharmacy/dto/create-product.dto.ts:193` |
| `coldChainRequired` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Requiere cadena de frío | `src/modules/pharmacy/dto/create-product.dto.ts:201` |
| `identifiers` | `array<ProductIdentifierDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ProductIdentifierDto)` | Identificadores (GTIN/NDC) | `src/modules/pharmacy/dto/create-product.dto.ts:214` |
| `identifiers[].identifierType` | `string` | No | valores: GTIN, NDC | `@IsIn(['GTIN', 'NDC'])` | Tipo de identificador | `src/modules/pharmacy/dto/create-product.dto.ts:39` |
| `identifiers[].identifierValue` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Valor del identificador | `src/modules/pharmacy/dto/create-product.dto.ts:48` |
| `identifiers[].assigningAuthorityTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant de la autoridad que asigna el identificador | `src/modules/pharmacy/dto/create-product.dto.ts:59` |
| `identifiers[].validFrom` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/pharmacy/dto/create-product.dto.ts:67` |
| `identifiers[].validTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/pharmacy/dto/create-product.dto.ts:75` |
| `unitPrice` | `number \| string` | No | — | `@IsOptional()` `@IsCatalogMoney()` | Precio de venta en bolivianos (número o texto decimal, hasta 2 decimales). Se versiona en la lista pública `CATALOGO` de la farmacia. | `src/modules/pharmacy/dto/create-product.dto.ts:230` |
| `category` | `string` | No | longitud mínima 1; longitud máxima 60 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(CATEGORY_NAME_MAX)` | Categoría de la vitrina, por nombre (sin distinguir mayúsculas ni tildes). Tiene que ser una de `GET /pharmacies/{pharmacyId}/categories`: otra es 422. | `src/modules/pharmacy/dto/create-product.dto.ts:242` |
| `description` | `string` | No | longitud mínima 1; longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(DESCRIPTION_MAX)` | Descripción para el paciente | `src/modules/pharmacy/dto/create-product.dto.ts:253` |
| `inStock` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | `false` = «no lo tengo» (sin conteo). Junto con `stock` es 422: dirían dos cosas a la vez. | `src/modules/pharmacy/dto/create-product.dto.ts:265` |
| `status` | `string` | No | valores: PUBLISHED, DRAFT | `@IsOptional()` `@IsIn(['PUBLISHED', 'DRAFT'])` | Estado: `PUBLISHED` (por defecto) o `DRAFT` (sólo lo ve la farmacia). `WITHDRAWN` no vale en el alta. | `src/modules/pharmacy/dto/create-product.dto.ts:275` |
| `stock` | `number` | No | mínimo 0; máximo 1000000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(STOCK_MAX)` | Existencias declaradas (sin ellas el producto queda «sin conteo») | `src/modules/pharmacy/dto/create-product.dto.ts:288` |
| `minStock` | `number` | No | mínimo 0; máximo 1000000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(STOCK_MAX)` | Umbral de alerta (sin él, 5) | `src/modules/pharmacy/dto/create-product.dto.ts:300` |
| `imageFileIds` | `array<string>` | No | formato uuid; máximo 3 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_PRODUCT_IMAGES)` `@ArrayUnique()` `@IsUUID('all', { each: true })` | Hasta 3 imágenes (ids de `POST /common/files/upload`, categoría IMAGE, subidas por quien publica) | `src/modules/pharmacy/dto/create-product.dto.ts:314` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "productCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "productCode": "CODIGO_EJEMPLO",
  "catalogProductId": "00000000-0000-4000-8000-000000000001",
  "catalogPresentationCode": "CODIGO_EJEMPLO",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "manufacturerTenantId": "00000000-0000-4000-8000-000000000001",
  "brandName": "Nombre de ejemplo",
  "genericName": "Nombre de ejemplo",
  "strengthText": "valor-ejemplo",
  "dosageFormConceptId": "00000000-0000-4000-8000-000000000001",
  "packageSizeText": "valor-ejemplo",
  "requiresPrescription": true,
  "coldChainRequired": true,
  "identifiers": [
    {
      "identifierType": "GTIN",
      "identifierValue": "valor-ejemplo",
      "assigningAuthorityTenantId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31",
      "validTo": "2026-07-31"
    }
  ],
  "unitPrice": 12.5,
  "category": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "inStock": true,
  "status": "PUBLISHED",
  "stock": 1,
  "minStock": 1,
  "imageFileIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<ProductResponseDto>` · DTO `ProductResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:108` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy/dto/responses.dto.ts:114` |
| `productCode` | `string` | Sí | — | — | Valor de product code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:120` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:126` |
| `identifierCount` | `number` | Sí | — | — | Nº de identificadores registrados | `src/modules/pharmacy/dto/responses.dto.ts:132` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:138` |
| `warnings` | `array<ProductWarningDto>` | No | — | — | Avisos sobre el producto guardado, calculados con lo que quedó (también lo derivado del catálogo oficial): `MEDICATION_NOT_LINKED` si pide receta y no tiene medicamento. Ausente si no hay ninguno. | `src/modules/pharmacy/dto/responses.dto.ts:146` |
| `warnings[].field` | `string` | No | — | — | Campo al que se refiere el aviso. | `src/modules/pharmacy/dto/responses.dto.ts:155` |
| `warnings[].reason` | `string` | No | — | — | Código estable del aviso. | `src/modules/pharmacy/dto/responses.dto.ts:161` |
| `warnings[].message` | `string` | No | — | — | El aviso en castellano, para mostrarlo tal cual. | `src/modules/pharmacy/dto/responses.dto.ts:167` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: catalogPresentationCode sólo se manda junto con catalogProductId; BadRequestException: {supplied.join(', ')} vienen del catálogo oficial y no se mandan con catalogProductId; BadRequestException: El producto tiene más de una presentación: mande catalogPresentationCode; BadRequestException: catalogPresentationCode no es una presentación de ese producto; BadRequestException: unitPrice debe ser un importe positivo con hasta 2 decimales |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Producto del catálogo no encontrado; ResourceNotFoundException: {labels.notFound} |
| 409 | `CONFLICT` | ConflictException: Ya existe un producto con ese código en la farmacia; ConflictException: Ya cargó ese producto y presentación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa; PreconditionFailedException: El registro sanitario de ese producto no está vigente; PreconditionFailedException: La categoría no es una de las de su farmacia; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: La imagen del producto no es un archivo de imagen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:156` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-04`

---

## 20. DELETE /pharmacies/{pharmacyId}/products/{productId}

- **Origen:** CONTRATO
- **Nombre:** Retirar (soft-delete) producto del catálogo
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.retireProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:390`

### Qué es y para qué sirve (negocio)

Retirar (soft-delete) producto del catálogo. Caso de uso UC-24-09: Retirar (soft-delete) producto en cascada. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`DELETE /pharmacies/{pharmacyId}/products/{productId}` la atiende `PharmacyController.retireProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:390). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyProductsService.retireProduct`. Actualiza pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products. Lee pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:390` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, productId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:390` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_external_product_mappings` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyProductsService.retireInTx | `src/modules/pharmacy/services/pharmacy-products.service.ts:772` |
| `pharmacy.pharmacy_external_product_mappings` | LEE | LEE | DIRECTA | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyProductsService.retireInTx → PharmacyExternalProductMappingsRepository.findActiveByProduct | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:76` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyProductsService.retireInTx | `src/modules/pharmacy/services/pharmacy-products.service.ts:762` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyProductsService.retireInTx → PharmacyProductPricesRepository.findActiveByProduct | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:103` |
| `pharmacy.pharmacy_products` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyProductsService.retireInTx | `src/modules/pharmacy/services/pharmacy-products.service.ts:752` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyProductsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `productId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/pharmacy/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Producto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El producto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:178` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-09`

---

## 21. PATCH /pharmacies/{pharmacyId}/products/{productId}

- **Origen:** CONTRATO
- **Nombre:** Editar un producto del catálogo de la farmacia
- **Bloque:** Farmacia
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.updateProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:362`

### Qué es y para qué sirve (negocio)

Editar un producto del catálogo de la farmacia. Caso de uso P47 §2-5: Editar datos descriptivos (no en uno del catálogo universal), precio, categoría, descripción, existencias o «hay / no hay», estado e imágenes (null borra lo que lo admite). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`PATCH /pharmacies/{pharmacyId}/products/{productId}` la atiende `PharmacyController.updateProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:362). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyUpdateProductDto` (14 campos, 0 obligatorios). Delega en `PharmacyProductsService.updateProduct`. Crea filas en pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_images, pharmacy.pharmacy_product_prices. Actualiza pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products. Borra de pharmacy.pharmacy_product_images. Lee common.file_versions, common.files, pharmacy.pharmacies, pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_categories, pharmacy.pharmacy_product_images, pharmacy.pharmacy_product_prices y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:362` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, productId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:362` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyCatalogRepository.lockCatalogPriceList | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:251` |
| `pharmacy.pharmacy_external_product_mappings` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.retireInTx | `src/modules/pharmacy/services/pharmacy-products.service.ts:772` |
| `pharmacy.pharmacy_external_product_mappings` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.retireInTx → PharmacyExternalProductMappingsRepository.findActiveByProduct | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:76` |
| `pharmacy.pharmacy_price_lists` | ESCRIBE | CREA | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyCatalogRepository.createCatalogPriceList | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:269` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyCatalogRepository.lockCatalogPriceList | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:256` |
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyReadService.toCatalogDtos → PharmacyCatalogRepository.findCategoriesByIds | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:68` |
| `pharmacy.pharmacy_product_images` | BORRA | BORRA | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → PharmacyCatalogRepository.replaceImages | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:219` |
| `pharmacy.pharmacy_product_images` | ESCRIBE | CREA | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.replaceImages → PharmacyCatalogRepository.replaceImages | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:224` |
| `pharmacy.pharmacy_product_images` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyReadService.toCatalogDtos → PharmacyCatalogRepository.findImageFileIds | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:199` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.retireInTx | `src/modules/pharmacy/services/pharmacy-products.service.ts:762` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | CREA | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.applyCatalogFields → PharmacyProductsService.setCatalogPrice → PharmacyProductPricesRepository.create | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:123` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsService.retireInTx → PharmacyProductPricesRepository.findActiveByProduct | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:103` |
| `pharmacy.pharmacy_products` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.updateProduct → PharmacyProductsService.updateProduct | `src/modules/pharmacy/services/pharmacy-products.service.ts:305` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:80` |
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → MedicationCatalogResolver.link → MedicationCatalogResolver.isMedication → MedicationCatalogResolver.options → MedicationCatalogResolver.read → DynamicEnumsService.readEnum → DynamicEnumsService.definitionForTarget → SystemContextRepository.findEnumBindingByTarget | `src/modules/system_context/repositories/system-context.repository.ts:582` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → MedicationCatalogResolver.link → MedicationCatalogResolver.isMedication → MedicationCatalogResolver.options → MedicationCatalogResolver.read → DynamicEnumsService.readEnum → SystemContextRepository.findEnumDefinitionByCode | `src/modules/system_context/repositories/system-context.repository.ts:244` |
| `system_context.dynamic_enum_options` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → MedicationCatalogResolver.link → MedicationCatalogResolver.isMedication → MedicationCatalogResolver.options → MedicationCatalogResolver.read → DynamicEnumsService.readEnum → SystemContextRepository.findEnumOptions | `src/modules/system_context/repositories/system-context.repository.ts:436` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → MedicationCatalogResolver.link → MedicationCatalogResolver.isMedication → MedicationCatalogResolver.options → MedicationCatalogResolver.read → DynamicEnumsService.readEnum → SystemContextRepository.findPublishedEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:393` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyReadService.toCatalogDtos → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:348` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → MedicationCatalogResolver.link → MedicationCatalogResolver.isMedication → MedicationCatalogResolver.options → MedicationCatalogResolver.read → DynamicEnumsService.readEnum → SystemContextRepository.findSpanishDisplays | `src/modules/system_context/repositories/system-context.repository.ts:456` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `productId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyUpdateProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `brandName` | `string` | No | longitud mínima 1; longitud máxima 300; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Marca comercial; `null` la borra | `src/modules/pharmacy/dto/update-product.dto.ts:49` |
| `genericName` | `string` | No | longitud mínima 1; longitud máxima 300; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Nombre genérico; `null` lo borra | `src/modules/pharmacy/dto/update-product.dto.ts:65` |
| `strengthText` | `string` | No | longitud mínima 1; longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Concentración (texto libre); `null` la borra | `src/modules/pharmacy/dto/update-product.dto.ts:81` |
| `packageSizeText` | `string` | No | longitud mínima 1; longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Tamaño de empaque (texto libre); `null` lo borra | `src/modules/pharmacy/dto/update-product.dto.ts:97` |
| `requiresPrescription` | `boolean` | No | admite null | `@IsOptional()` `@IsStrictBoolean()` | Requiere receta; `null` lo borra | `src/modules/pharmacy/dto/update-product.dto.ts:109` |
| `medicationConceptId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | Medicamento del catálogo `medication` con que se receta; `null` lo desvincula. Fuera de ese catálogo es 422. | `src/modules/pharmacy/dto/update-product.dto.ts:128` |
| `unitPrice` | `number \| string` | No | — | `@IsOptional()` `@IsCatalogMoney()` | Precio de venta en bolivianos (número o texto decimal, hasta 2 decimales); `null` lo quita. Se versiona en la lista pública `CATALOGO`. | `src/modules/pharmacy/dto/update-product.dto.ts:144` |
| `category` | `string` | No | longitud mínima 1; longitud máxima 60; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(CATEGORY_NAME_MAX)` | Categoría por nombre (una de la farmacia; otra es 422); `null` la quita | `src/modules/pharmacy/dto/update-product.dto.ts:158` |
| `description` | `string` | No | longitud mínima 1; longitud máxima 2000; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(DESCRIPTION_MAX)` | Descripción para el paciente; `null` la borra | `src/modules/pharmacy/dto/update-product.dto.ts:171` |
| `inStock` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | `false` = «no lo tengo»; `true` vuelve a tenerlo (si el conteo estaba en 0 queda «sin conteo»). Junto con `stock` es 422. | `src/modules/pharmacy/dto/update-product.dto.ts:180` |
| `status` | `string` | No | valores: PUBLISHED, DRAFT, WITHDRAWN | `@IsOptional()` `@IsIn(CATALOG_STATUSES)` | `PUBLISHED`, `DRAFT` o `WITHDRAWN` (retira como el DELETE). Un retirado sólo acepta volver a `PUBLISHED`/`DRAFT`. | `src/modules/pharmacy/dto/update-product.dto.ts:190` |
| `stock` | `number` | No | mínimo 0; máximo 1000000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(STOCK_MAX)` | — | `src/modules/pharmacy/dto/update-product.dto.ts:198` |
| `minStock` | `number` | No | mínimo 0; máximo 1000000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(STOCK_MAX)` | — | `src/modules/pharmacy/dto/update-product.dto.ts:206` |
| `imageFileIds` | `array<string>` | No | formato uuid; máximo 3 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_PRODUCT_IMAGES)` `@ArrayUnique()` `@IsUUID('all', { each: true })` | Las imágenes, completas y en orden: reemplaza las anteriores. Hasta 3; una nueva tiene que ser un archivo IMAGE subido por quien edita. | `src/modules/pharmacy/dto/update-product.dto.ts:220` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "brandName": "Nombre de ejemplo",
  "genericName": "Nombre de ejemplo",
  "strengthText": "valor-ejemplo",
  "packageSizeText": "valor-ejemplo",
  "requiresPrescription": true,
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "unitPrice": 12.5,
  "category": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "inStock": true,
  "status": "PUBLISHED",
  "stock": 1,
  "minStock": 1,
  "imageFileIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<PharmacyProductReadDto>` · DTO `PharmacyProductReadDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:357` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:363` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:369` |
| `productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:375` |
| `brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:381` |
| `genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:387` |
| `strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:393` |
| `packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:399` |
| `dosageForm` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:405` |
| `dosageForm.code` | `string` | No | — | — | — | sin fuente |
| `dosageForm.display` | `string` | No | — | — | — | sin fuente |
| `medication` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:412` |
| `medication.code` | `string` | No | — | — | — | sin fuente |
| `medication.display` | `string` | No | — | — | — | sin fuente |
| `requiresPrescription` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:418` |
| `unitPrice` | `string` | No | admite null | — | Precio vigente (lista `CATALOGO`, o el menor de sus listas públicas de mostrador). Texto exacto; `null` = sin precio. | `src/modules/pharmacy/dto/read-responses.dto.ts:432` |
| `currency` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:436` |
| `inStock` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:440` |
| `category` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:444` |
| `description` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:448` |
| `status` | `string` | No | valores: PUBLISHED, DRAFT, WITHDRAWN | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:456` |
| `stock` | `number` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:460` |
| `minStock` | `number` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:464` |
| `outOfStockDeclared` | `boolean` | No | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:471` |
| `imageFileIds` | `array<string>` | No | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:475` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: {changed.join(', ')} vienen del catálogo oficial y no se editan; BadRequestException: medicationConceptId viene del catálogo oficial y no se cambia; BadRequestException: unitPrice debe ser un importe positivo con hasta 2 decimales |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Producto no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El producto no está activo; PreconditionFailedException: Ese medicamento no está en el catálogo con que se receta; PreconditionFailedException: La categoría no es una de las de su farmacia; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: La imagen del producto no es un archivo de imagen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:167` |

### Flujos

- Módulo Pharmacy (24) — etapa `P47 §2-5`

---

## 22. POST /pharmacies/{pharmacyId}/products/bulk

- **Origen:** CONTRATO
- **Nombre:** Cargar productos en lote, con vista previa
- **Bloque:** Farmacia
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyBulkController.bulkProducts` — `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:71`

### Qué es y para qué sirve (negocio)

Cargar productos en lote, con vista previa. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/products/bulk` la atiende `PharmacyBulkController.bulkProducts` (src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:71). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `BulkRequestDto` (3 campos, 2 obligatorios). Delega en `PharmacyBulkService.run`. No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: los productos por `PharmacyProductsService.updateProduct` (y sus precios por el manejador de precios), las mismas tablas que la ruta unitaria..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:71` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: los productos por `PharmacyProductsService.updateProduct` (y sus precios por el manejador de precios), las mismas tablas que la ruta unitaria.. _(manual, 2026-10-30; fuente: `src/modules/pharmacy/services/bulk/products.bulk-handler.ts`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `BulkRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mode` | `string` | Sí | valores: CREATE, UPDATE, UPSERT | `@IsIn(BULK_MODES)` | — | `src/common/dto/bulk-load.dto.ts:50` |
| `dryRun` | `boolean` | No | — | `@ValidateIf((_body: unknown, value: unknown) => value !== undefined)` `@IsStrictBoolean()` | — | `src/common/dto/bulk-load.dto.ts:61` |
| `rows` | `array<object>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(BULK_MAX_ROWS)` `@IsObject({ each: true })` `@Type(() => Object)` | — | `src/common/dto/bulk-load.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

</details>

### Respuesta — `Promise<BulkResponseDto>` · DTO `BulkResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dryRun` | `boolean` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:144` |
| `results` | `array<BulkRowResultDto>` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:150` |
| `results[].row` | `number` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:109` |
| `results[].outcome` | `string` | Sí | valores: CREATED, UPDATED, REJECTED, UNCHANGED | — | — | `src/common/dto/bulk-load.dto.ts:115` |
| `results[].id` | `string` | No | formato uuid | — | — | `src/common/dto/bulk-load.dto.ts:121` |
| `results[].errors` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:127` |
| `results[].errors[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].errors[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].errors[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |
| `results[].warnings` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:135` |
| `results[].warnings[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].warnings[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].warnings[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: dryRun debe ser true o false |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DryRunRollback: {await withWarnings(tx, ctx, handler, { outcome: 'UNCHANGED'…}; DryRunRollback: {outcome} |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.spec.ts:88` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyBulkController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /pharmacies/{pharmacyId}/projections

- **Origen:** CONTRATO
- **Nombre:** Proyectar catálogo y precios a read-model
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.projectCatalog` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:568`

### Qué es y para qué sirve (negocio)

Proyectar catálogo y precios a read-model. Caso de uso UC-24-11: Proyectar catálogo y precios a read-model. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:71`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/projections` la atiende `PharmacyController.projectCatalog` (src/modules/pharmacy/controllers/pharmacy.controller.ts:568). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyCatalogService.projectCatalog`. Lee pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:568` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:568` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyController.projectCatalog → PharmacyCatalogService.projectCatalog → PharmacyProductPricesRepository.findActiveByProduct | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:103` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.projectCatalog → PharmacyCatalogService.projectCatalog → PharmacyProductsRepository.findByPharmacyAndStatus | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CatalogProjectionDto>` · DTO `CatalogProjectionDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy/dto/responses.dto.ts:389` |
| `productCount` | `number` | Sí | — | — | Nº de productos activos proyectados | `src/modules/pharmacy/dto/responses.dto.ts:395` |
| `entries` | `array<CatalogEntryDto>` | Sí | — | — | Valor de entries mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:401` |
| `entries[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy/dto/responses.dto.ts:362` |
| `entries[].productCode` | `string` | Sí | — | — | Valor de product code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:368` |
| `entries[].brandName` | `string` | No | — | — | Valor de brand name mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:374` |
| `entries[].prices` | `array<CatalogPriceDto>` | Sí | — | — | Valor de prices mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:380` |
| `entries[].prices[].priceListId` | `string` | Sí | formato uuid | — | Identificador asociado a price list. | `src/modules/pharmacy/dto/responses.dto.ts:341` |
| `entries[].prices[].unitAmount` | `string` | Sí | — | — | Valor de unit amount mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:347` |
| `entries[].prices[].versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:353` |
| `projectedAt` | `string` | Sí | formato date-time | — | Valor de projected at mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:407` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:244` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-11`

---

## 24. POST /pharmacies/{pharmacyId}/sites

- **Origen:** CONTRATO
- **Nombre:** Registrar sede dispensadora
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createSite` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:326`

### Qué es y para qué sirve (negocio)

Registrar sede dispensadora. Caso de uso UC-24-02: Registrar sede dispensadora (requiere farmacia ACTIVE). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/sites` la atiende `PharmacyController.createSite` (src/modules/pharmacy/controllers/pharmacy.controller.ts:326). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyCreateSiteDto` (8 campos, 3 obligatorios). Delega en `PharmacySitesService.createSite`. Crea filas en pharmacy.pharmacy_sites. Lee pharmacy.pharmacy_sites, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:326` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:326` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_sites` | ESCRIBE | CREA | DIRECTA | PharmacyController.createSite → PharmacySitesService.createSite → PharmacySitesRepository.create | `src/modules/pharmacy/repositories/pharmacy-sites.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyController.createSite → PharmacySitesService.createSite → PharmacySitesRepository.findByPharmacyAndCode | `src/modules/pharmacy/repositories/pharmacy-sites.repository.ts:68` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyController.createSite → PharmacySitesService.createSite → PharmacyReferencesRepository.practiceSiteBelongsToTenant | `src/modules/pharmacy/repositories/pharmacy-references.repository.ts:32` |
| `practice.practices` | LEE | LEE | DIRECTA | PharmacyController.createSite → PharmacySitesService.createSite → PharmacyReferencesRepository.practiceSiteBelongsToTenant | `src/modules/pharmacy/repositories/pharmacy-references.repository.ts:34` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyCreateSiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede física (practice.practice_sites) | `src/modules/pharmacy/dto/create-site.dto.ts:22` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de sede por farmacia | `src/modules/pharmacy/dto/create-site.dto.ts:34` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Nombre de la sede | `src/modules/pharmacy/dto/create-site.dto.ts:43` |
| `pharmacySiteTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de sede | `src/modules/pharmacy/dto/create-site.dto.ts:54` |
| `dispensingModeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del modo de dispensación | `src/modules/pharmacy/dto/create-site.dto.ts:65` |
| `controlledSubstanceCapabilityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de capacidad de sustancias controladas | `src/modules/pharmacy/dto/create-site.dto.ts:76` |
| `homeDeliveryAvailable` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Ofrece entrega a domicilio | `src/modules/pharmacy/dto/create-site.dto.ts:84` |
| `pickupAvailable` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | Ofrece retiro en tienda | `src/modules/pharmacy/dto/create-site.dto.ts:92` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "pharmacySiteTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dispensingModeConceptId": "00000000-0000-4000-8000-000000000001",
  "controlledSubstanceCapabilityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeDeliveryAvailable": true,
  "pickupAvailable": true
}
```

</details>

### Respuesta — `Promise<SiteResponseDto>` · DTO `SiteResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:69` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | sin fuente |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:81` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:93` |
| `operationalStatus` | `string` | Sí | — | — | Valor de operational status mantenido por la instancia. | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una sede con ese código en la farmacia |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:149` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-02`

---

## 25. POST /pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts

- **Origen:** CONTRATO
- **Nombre:** Registrar un turno de guardia de la sede
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createOnCallShift` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:242`

### Qué es y para qué sirve (negocio)

Registrar un turno de guardia de la sede. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts` la atiende `PharmacyController.createOnCallShift` (src/modules/pharmacy/controllers/pharmacy.controller.ts:242). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyCreateOnCallShiftDto` (2 campos, 2 obligatorios). Delega en `PharmacyOpeningHoursService.createShift`. Crea filas en pharmacy.pharmacy_on_call_shifts. Lee pharmacy.pharmacy_on_call_shifts, pharmacy.pharmacy_sites, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:242` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, siteId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:242` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_on_call_shifts` | ESCRIBE | CREA | DIRECTA | PharmacyController.createOnCallShift → PharmacyOpeningHoursService.createShift → PharmacyOnCallShiftsRepository.create | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:122` |
| `pharmacy.pharmacy_on_call_shifts` | LEE | LEE | DIRECTA | PharmacyController.createOnCallShift → PharmacyOpeningHoursService.createShift → PharmacyOnCallShiftsRepository.findOverlapping | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:112` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyController.createOnCallShift → PharmacyOpeningHoursService.createShift → PharmacyOpeningHoursService.requireSite → PharmacySitesRepository.findById | `src/modules/pharmacy/repositories/pharmacy-sites.repository.ts:59` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyController.createOnCallShift → PharmacyOpeningHoursService.createShift → PharmacyOpeningHoursService.timeZonesOf → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:330` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyCreateOnCallShiftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `startsAt` | `string` | Sí | patrón runtime ISO_INSTANT_WITH_OFFSET | `@IsString()` `@Matches(ISO_INSTANT_WITH_OFFSET, { message: 'startsAt debe ser ISO-8601 con desplazamiento explícito (Z o ±hh:mm)', })` | Inicio, ISO-8601 con desplazamiento obligatorio (p. ej. `2026-10-26T20:00:00-04:00`) | `src/modules/pharmacy/dto/opening-hours.dto.ts:50` |
| `endsAt` | `string` | Sí | patrón runtime ISO_INSTANT_WITH_OFFSET | `@IsString()` `@Matches(ISO_INSTANT_WITH_OFFSET, { message: 'endsAt debe ser ISO-8601 con desplazamiento explícito (Z o ±hh:mm)', })` | Fin (exclusivo), ISO-8601 con desplazamiento obligatorio. Como mucho 72 h después del inicio | `src/modules/pharmacy/dto/opening-hours.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "startsAt": "2026-10-26T20:00:00-04:00",
  "endsAt": "2026-10-27T08:00:00-04:00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "startsAt": "2026-10-26T20:00:00-04:00",
  "endsAt": "2026-10-27T08:00:00-04:00"
}
```

</details>

### Respuesta — `Promise<OnCallShiftDto>` · DTO `PharmacyOnCallShiftDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:71` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:75` |
| `startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:79` |
| `endsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:83` |
| `startsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:87` |
| `endsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:91` |
| `timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:95` |
| `source` | `string` | Sí | valores: PHARMACY, PLATFORM | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:99` |
| `status` | `string` | Sí | valores: ACTIVE, CANCELLED | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:103` |
| `current` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La fecha del turno no es válida; PreconditionFailedException: {WINDOW_MESSAGES[problem]} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/pharmacy-on-call-shifts.int-spec.ts:250` |
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:104` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. PUT /pharmacies/{pharmacyId}/sites/{siteId}/open-24h

- **Origen:** CONTRATO
- **Nombre:** Declarar si la sede abre las 24 horas
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.setOpen24h` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:219`

### Qué es y para qué sirve (negocio)

Declarar si la sede abre las 24 horas. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`PUT /pharmacies/{pharmacyId}/sites/{siteId}/open-24h` la atiende `PharmacyController.setOpen24h` (src/modules/pharmacy/controllers/pharmacy.controller.ts:219). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacySetOpen24hDto` (1 campo, 1 obligatorio). Delega en `PharmacyOpeningHoursService.setOpen24h`. Actualiza pharmacy.pharmacy_sites. Lee pharmacy.pharmacy_on_call_shifts, pharmacy.pharmacy_sites, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:219` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, siteId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:219` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_on_call_shifts` | LEE | LEE | DIRECTA | PharmacyController.setOpen24h → PharmacyOpeningHoursService.setOpen24h → PharmacyOnCallShiftsRepository.findUpcomingBySites | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:79` |
| `pharmacy.pharmacy_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.setOpen24h → PharmacyOpeningHoursService.setOpen24h | `src/modules/pharmacy/services/pharmacy-opening-hours.service.ts:184` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyController.setOpen24h → PharmacyOpeningHoursService.setOpen24h → PharmacyOpeningHoursService.requireSite → PharmacySitesRepository.findById | `src/modules/pharmacy/repositories/pharmacy-sites.repository.ts:59` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyController.setOpen24h → PharmacyOpeningHoursService.setOpen24h → PharmacyOpeningHoursService.timeZonesOf → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:330` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacySetOpen24hDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `open24h` | `boolean` | Sí | admite null | `@ValidateIf((dto: SetOpen24hDto) => dto.open24h !== null)` `@IsStrictBoolean()` | `true`: abre las 24 h · `false`: no · `null`: retira la declaración (vuelve a «no declarado») | `src/modules/pharmacy/dto/opening-hours.dto.ts:33` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "open24h": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "open24h": true
}
```

</details>

### Respuesta — `Promise<SiteOpeningHoursDto>` · DTO `PharmacySiteOpeningHoursDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:115` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:119` |
| `timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:123` |
| `open24h` | `boolean` | Sí | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:127` |
| `shifts` | `array<PharmacyOnCallShiftDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:131` |
| `shifts[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:71` |
| `shifts[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:75` |
| `shifts[].startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:79` |
| `shifts[].endsAt` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:83` |
| `shifts[].startsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:87` |
| `shifts[].endsAtLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:91` |
| `shifts[].timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:95` |
| `shifts[].source` | `string` | Sí | valores: PHARMACY, PLATFORM | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:99` |
| `shifts[].status` | `string` | Sí | valores: ACTIVE, CANCELLED | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:103` |
| `shifts[].current` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/pharmacy-on-call-shifts.int-spec.ts:264` |
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:89` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /pharmacies/{pharmacyId}/sites/bulk

- **Origen:** CONTRATO
- **Nombre:** Cargar sucursales (sedes de venta) en lote, con vista previa
- **Bloque:** Farmacia
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyBulkController.bulkSites` — `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:109`

### Qué es y para qué sirve (negocio)

Cargar sucursales (sedes de venta) en lote, con vista previa. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/sites/bulk` la atiende `PharmacyBulkController.bulkSites` (src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:109). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `BulkRequestDto` (3 campos, 2 obligatorios). Delega en `PharmacyBulkService.run`. No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: las sedes por `PharmacySitesService.updateSite` y el alta de sede por `PharmacyProvisioningService`, las mismas tablas que la ruta unitaria..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts:109` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: El controlador delega en `PharmacyBulkService.run` pasando el manejador como argumento y el generador no sigue esa llamada. Sí escribe: las sedes por `PharmacySitesService.updateSite` y el alta de sede por `PharmacyProvisioningService`, las mismas tablas que la ruta unitaria.. _(manual, 2026-10-30; fuente: `src/modules/pharmacy/services/bulk/sites.bulk-handler.ts`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `BulkRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mode` | `string` | Sí | valores: CREATE, UPDATE, UPSERT | `@IsIn(BULK_MODES)` | — | `src/common/dto/bulk-load.dto.ts:50` |
| `dryRun` | `boolean` | No | — | `@ValidateIf((_body: unknown, value: unknown) => value !== undefined)` `@IsStrictBoolean()` | — | `src/common/dto/bulk-load.dto.ts:61` |
| `rows` | `array<object>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(BULK_MAX_ROWS)` `@IsObject({ each: true })` `@Type(() => Object)` | — | `src/common/dto/bulk-load.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

</details>

### Respuesta — `Promise<BulkResponseDto>` · DTO `BulkResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dryRun` | `boolean` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:144` |
| `results` | `array<BulkRowResultDto>` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:150` |
| `results[].row` | `number` | Sí | — | — | — | `src/common/dto/bulk-load.dto.ts:109` |
| `results[].outcome` | `string` | Sí | valores: CREATED, UPDATED, REJECTED, UNCHANGED | — | — | `src/common/dto/bulk-load.dto.ts:115` |
| `results[].id` | `string` | No | formato uuid | — | — | `src/common/dto/bulk-load.dto.ts:121` |
| `results[].errors` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:127` |
| `results[].errors[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].errors[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].errors[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |
| `results[].warnings` | `array<BulkRowErrorDto>` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:135` |
| `results[].warnings[].field` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:88` |
| `results[].warnings[].reason` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:94` |
| `results[].warnings[].message` | `string` | No | — | — | — | `src/common/dto/bulk-load.dto.ts:100` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: dryRun debe ser true o false |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DryRunRollback: {await withWarnings(tx, ctx, handler, { outcome: 'UNCHANGED'…}; DryRunRollback: {outcome} |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-bulk.controller.spec.ts:90` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyBulkController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. GET /pharmacy/catalog-products

- **Origen:** CONTRATO
- **Nombre:** Buscar en el catálogo universal de medicamentos
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.searchCatalogProducts` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:196`

### Qué es y para qué sirve (negocio)

Buscar en el catálogo universal de medicamentos. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/catalog-products` la atiende `PharmacyReadController.searchCatalogProducts` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:196). Exige sesión; el controlador no declara roles. Delega en `MedicineCatalogSearchService.search`. Lee terminology.catalog_concepts, terminology.code_system_versions, terminology.code_systems, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:187` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:114` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:114` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `search` | query | No | `string` | Nombre, principio activo, ATC, titular o nº de registro (mínimo 2 letras) |
| `source` | query | No | `string` | — |
| `atc` | query | No | `string` | ATC nivel 5 exacto |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CatalogProductPageDto>` · DTO `PharmacyCatalogProductPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyCatalogProductDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:193` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:129` |
| `items[].source` | `string` | Sí | valores: agemed, cima, invima, anvisa | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:132` |
| `items[].sourceName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:135` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:141` |
| `items[].display` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:144` |
| `items[].holder` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:147` |
| `items[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:150` |
| `items[].dosageForm` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:153` |
| `items[].requiresPrescription` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:159` |
| `items[].generic` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:162` |
| `items[].activeIngredients` | `array<CatalogIngredientDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:165` |
| `items[].activeIngredients[].name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:80` |
| `items[].activeIngredients[].amount` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:83` |
| `items[].activeIngredients[].unit` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:86` |
| `items[].atc` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:168` |
| `items[].presentations` | `array<CatalogPresentationDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:171` |
| `items[].presentations[].code` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:95` |
| `items[].presentations[].name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:98` |
| `items[].presentations[].gtin` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:104` |
| `items[].presentations[].active` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:107` |
| `items[].regulatoryStatus` | `string` | Sí | valores: ACTIVE, INACTIVE, SUSPENDED, REVOKED | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:174` |
| `items[].selectable` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:180` |
| `items[].photo` | `CatalogPhotoDto` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:183` |
| `items[].photo.url` | `string` | No | — | — | — | sin fuente |
| `items[].photo.thumbUrl` | `object` | No | admite null | — | — | sin fuente |
| `items[].photo.attribution` | `string` | No | — | — | — | sin fuente |
| `items[].sourceUrl` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:186` |
| `limit` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:196` |
| `truncated` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/catalog-product.dto.ts:202` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:48` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. GET /pharmacy/pharmacies

- **Origen:** CONTRATO
- **Nombre:** Listar farmacias publicadas del tenant activo
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.listPharmacies` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:67`

### Qué es y para qué sirve (negocio)

Listar farmacias publicadas del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/pharmacies` la atiende `PharmacyReadController.listPharmacies` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:67). Exige sesión; el controlador no declara roles. Delega en `PharmacyReadService.listPharmacies`. Lee pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:48` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findActiveProductOwners | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:176` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:79` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:348` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyDirectoryResponseDto>` · DTO `PharmacyDirectoryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyDirectoryItemDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:146` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:89` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:95` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:101` |
| `items[].legalName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:107` |
| `items[].type` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:113` |
| `items[].type.code` | `string` | No | — | — | — | sin fuente |
| `items[].type.display` | `string` | No | — | — | — | sin fuente |
| `items[].siteCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:119` |
| `items[].productCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:125` |
| `items[].homeDeliveryAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:131` |
| `items[].pickupAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:137` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:152` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /pharmacy/pharmacies/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil de una farmacia
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.getPharmacy` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:75`

### Qué es y para qué sirve (negocio)

Consultar el perfil de una farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/pharmacies/{id}` la atiende `PharmacyReadController.getPharmacy` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:75). Exige sesión; el controlador no declara roles. Delega en `PharmacyReadService.getPharmacy`. Lee common.addresses, common.identifiers, directory.tenant_affiliation_documents, directory.tenants, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, practice.practice_sites y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:75` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findHeadquartersAddress | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:404` |
| `common.identifiers` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findIdentifiers | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:390` |
| `directory.tenant_affiliation_documents` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findActiveAffiliationDocuments | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:377` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:366` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:65` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadRepository.findActiveProductOwners | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:176` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:79` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:330` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:348` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyDetailDto>` · DTO `PharmacyDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:89` |
| `code` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:95` |
| `name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:101` |
| `legalName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:107` |
| `type` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:113` |
| `type.code` | `string` | No | — | — | — | sin fuente |
| `type.display` | `string` | No | — | — | — | sin fuente |
| `siteCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:119` |
| `productCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:125` |
| `homeDeliveryAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:131` |
| `pickupAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:137` |
| `sites` | `array<PharmacySiteReadDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:176` |
| `sites[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:32` |
| `sites[].code` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:38` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:44` |
| `sites[].addressText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:50` |
| `sites[].latitude` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:56` |
| `sites[].longitude` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:62` |
| `sites[].dispensingMode` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:68` |
| `sites[].dispensingMode.code` | `string` | No | — | — | — | sin fuente |
| `sites[].dispensingMode.display` | `string` | No | — | — | — | sin fuente |
| `sites[].homeDeliveryAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:74` |
| `sites[].pickupAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:80` |
| `taxId` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:185` |
| `companyType` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:200` |
| `companyType.code` | `string` | No | — | — | — | sin fuente |
| `companyType.display` | `string` | No | — | — | — | sin fuente |
| `legalAddressText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:208` |
| `headquarters` | `PharmacyGeoPointDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:214` |
| `headquarters.latitude` | `number` | No | — | — | — | sin fuente |
| `headquarters.longitude` | `number` | No | — | — | — | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Farmacia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. GET /pharmacy/pharmacies/{id}/contacts

- **Origen:** CONTRATO
- **Nombre:** Representante legal y gerencias de la farmacia (sólo su personal)
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.getContacts` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:121`

### Qué es y para qué sirve (negocio)

Representante legal y gerencias de la farmacia (sólo su personal). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/pharmacies/{id}/contacts` la atiende `PharmacyReadController.getContacts` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:121). Exige sesión; el controlador no declara roles. Delega en `PharmacyStaffReadService.getContacts`. Lee common.contact_points, common.identifiers, directory.tenant_legal_representatives, directory.tenant_memberships, pharmacy.pharmacies, profiles.persons, terminology.catalog_concepts, terminology.value_set_members y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:121` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → ContactPointsRepository.findAllCurrentByOwners | `src/modules/common/repositories/contact-points.repository.ts:96` |
| `common.identifiers` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → IdentifiersRepository.findByIds | `src/modules/common/repositories/identifiers.repository.ts:104` |
| `directory.tenant_legal_representatives` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → DirectoryTenantLegalRepository.listLegalRepsByTenant | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:84` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → PharmacyStaffReadService.requireStaffPharmacy → PharmacyReadRepository.findByIdInTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:361` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → DirectoryTenantLegalRepository.findPersonsByIds | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:167` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:438` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:612` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:121` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyContactsResponseDto>` · DTO `PharmacyContactsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `legalRepresentative` | `PharmacyContactPersonDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:341` |
| `legalRepresentative.role` | `string` | No | — | — | — | sin fuente |
| `legalRepresentative.fullName` | `string` | No | — | — | — | sin fuente |
| `legalRepresentative.email` | `object` | No | admite null | — | — | sin fuente |
| `legalRepresentative.phone` | `object` | No | admite null | — | — | sin fuente |
| `executives` | `array<PharmacyContactPersonDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:348` |
| `executives[].role` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:310` |
| `executives[].fullName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:316` |
| `executives[].email` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:322` |
| `executives[].phone` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:328` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:235` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /pharmacy/pharmacies/{id}/licenses

- **Origen:** CONTRATO
- **Nombre:** Licencias de la farmacia (sólo su personal)
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.listLicenses` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:92`

### Qué es y para qué sirve (negocio)

Licencias de la farmacia (sólo su personal). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/pharmacies/{id}/licenses` la atiende `PharmacyReadController.listLicenses` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:92). Exige sesión; el controlador no declara roles. Delega en `PharmacyStaffReadService.listLicenses`. Lee directory.tenant_memberships, pharmacy.pharmacies, pharmacy.pharmacy_licenses, pharmacy.pharmacy_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:92` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyStaffReadService.requireStaffPharmacy → PharmacyReadRepository.findByIdInTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:361` |
| `pharmacy.pharmacy_licenses` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyReadRepository.findLicenses | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:420` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyReadRepository.findSitesByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:433` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:348` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyLicenseListResponseDto>` · DTO `PharmacyLicenseListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyLicenseDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:294` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:223` |
| `items[].type` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:229` |
| `items[].type.code` | `string` | No | — | — | — | sin fuente |
| `items[].type.display` | `string` | No | — | — | — | sin fuente |
| `items[].number` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:235` |
| `items[].siteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:241` |
| `items[].siteName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:247` |
| `items[].jurisdiction` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:253` |
| `items[].jurisdiction.code` | `string` | No | — | — | — | sin fuente |
| `items[].jurisdiction.display` | `string` | No | — | — | — | sin fuente |
| `items[].validFrom` | `object` | No | formato date; admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:259` |
| `items[].validTo` | `object` | No | formato date; admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:265` |
| `items[].daysToExpiry` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:273` |
| `items[].verificationStatus` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:279` |
| `items[].verificationStatus.code` | `string` | No | — | — | — | sin fuente |
| `items[].verificationStatus.display` | `string` | No | — | — | — | sin fuente |
| `items[].evidenceFileId` | `object` | No | formato uuid; admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:285` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:300` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:226` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /pharmacy/pharmacies/{id}/summary

- **Origen:** CONTRATO
- **Nombre:** Resumen del catálogo de la farmacia (sólo su personal)
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.getSummary` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:105`

### Qué es y para qué sirve (negocio)

Resumen del catálogo de la farmacia (sólo su personal). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/pharmacies/{id}/summary` la atiende `PharmacyReadController.getSummary` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:105). Exige sesión; el controlador no declara roles. Delega en `PharmacyStaffReadService.getSummary`. Lee audit.audit_log, directory.tenant_memberships, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_categories, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:105` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyCatalogRepository.findRecentActivity | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:355` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyStaffReadService.requireStaffPharmacy → PharmacyReadRepository.findByIdInTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:361` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyCatalogRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:300` |
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyCatalogRepository.listCategories | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:55` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyCatalogRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:300` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary | `src/modules/pharmacy/services/pharmacy-staff-read.service.ts:215` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyCatalogRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:300` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacySummaryDto>` · DTO `PharmacySummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `published` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:770` |
| `drafts` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:771` |
| `withdrawn` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:772` |
| `outOfStock` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:773` |
| `lowStock` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:774` |
| `inventoryValue` | `string` | Sí | — | — | Valor del inventario, decimal en texto | `src/modules/pharmacy/dto/read-responses.dto.ts:776` |
| `byCategory` | `array<PharmacyCategoryCountDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:778` |
| `byCategory[].category` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:758` |
| `byCategory[].count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:759` |
| `recentActivity` | `array<PharmacyRecentActivityDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:780` |
| `recentActivity[].id` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:750` |
| `recentActivity[].at` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:751` |
| `recentActivity[].kind` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:752` |
| `recentActivity[].text` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:753` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. GET /pharmacy/products

- **Origen:** CONTRATO
- **Nombre:** Buscar productos publicados por texto, medicamento o farmacia
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.searchProducts` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:208`

### Qué es y para qué sirve (negocio)

Buscar productos publicados por texto, medicamento o farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/products` la atiende `PharmacyReadController.searchProducts` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:208). Exige sesión; el controlador no declara roles. Delega en `PharmacyStaffReadService.listManagedProducts`, `PharmacyReadService.searchProducts`. Lee directory.tenant_memberships, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_categories, pharmacy.pharmacy_product_images, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:208` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyStaffReadService.listManagedProducts → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyReadService.searchProducts → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:48` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PharmacyReadController.searchProducts → PharmacyStaffReadService.listManagedProducts → PharmacyReadService.toCatalogDtos → PharmacyCatalogRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:300` |
| `pharmacy.pharmacy_product_categories` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyStaffReadService.listManagedProducts → PharmacyReadService.toCatalogDtos → PharmacyCatalogRepository.findCategoriesByIds | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:68` |
| `pharmacy.pharmacy_product_images` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyStaffReadService.listManagedProducts → PharmacyReadService.toCatalogDtos → PharmacyCatalogRepository.findImageFileIds | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:199` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PharmacyReadController.searchProducts → PharmacyStaffReadService.listManagedProducts → PharmacyReadService.toCatalogDtos → PharmacyCatalogRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:300` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyStaffReadService.listManagedProducts → PharmacyReadRepository.findCatalogProducts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:145` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyStaffReadService.listManagedProducts → PharmacyReadService.toCatalogDtos → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:348` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `search` | query | No | `string` | Texto a buscar en marca, genérico o código de producto |
| `conceptId` | query | No | `string` | Medicamento del vademécum (medication_concept_id) |
| `pharmacyId` | query | No | `string` | Sólo lo publicado por esta farmacia (carril A, H5) |
| `managed` | query | No | `string` | P47: con `true` (y `pharmacyId`) lista TODO el catálogo de esa farmacia —borradores y retirados— con estado, existencias, umbral e imágenes. Sólo su personal; cualquier otro, 404. |
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyProductSearchResponseDto>` · DTO `PharmacyProductSearchResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyProductReadDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:484` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:357` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:363` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:369` |
| `items[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:375` |
| `items[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:381` |
| `items[].genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:387` |
| `items[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:393` |
| `items[].packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:399` |
| `items[].dosageForm` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:405` |
| `items[].dosageForm.code` | `string` | No | — | — | — | sin fuente |
| `items[].dosageForm.display` | `string` | No | — | — | — | sin fuente |
| `items[].medication` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:412` |
| `items[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].requiresPrescription` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:418` |
| `items[].unitPrice` | `string` | No | admite null | — | Precio vigente (lista `CATALOGO`, o el menor de sus listas públicas de mostrador). Texto exacto; `null` = sin precio. | `src/modules/pharmacy/dto/read-responses.dto.ts:432` |
| `items[].currency` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:436` |
| `items[].inStock` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:440` |
| `items[].category` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:444` |
| `items[].description` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:448` |
| `items[].status` | `string` | No | valores: PUBLISHED, DRAFT, WITHDRAWN | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:456` |
| `items[].stock` | `number` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:460` |
| `items[].minStock` | `number` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:464` |
| `items[].outOfStockDeclared` | `boolean` | No | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:471` |
| `items[].imageFileIds` | `array<string>` | No | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:475` |
| `limit` | `number` | Sí | — | — | Tope aplicado al listado | `src/modules/pharmacy/dto/read-responses.dto.ts:490` |
| `truncated` | `boolean` | Sí | — | — | true si quedaron productos fuera del tope. Se declara, no se calla | `src/modules/pharmacy/dto/read-responses.dto.ts:499` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: managed es true o false; BadRequestException: managed=true necesita pharmacyId: es el catálogo de una farmacia |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:143` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. GET /pharmacy/sites

- **Origen:** CONTRATO
- **Nombre:** Listar sedes publicadas, sueltas
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.listSites` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:143`

### Qué es y para qué sirve (negocio)

Listar sedes publicadas, sueltas. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/sites` la atiende `PharmacyReadController.listSites` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:143). Exige sesión; el controlador no declara roles. Delega en `PharmacyReadService.listSites`. Lee common.addresses, pharmacy.pharmacies, pharmacy.pharmacy_on_call_shifts, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, practice.practice_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:143` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findAddresses | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:339` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:48` |
| `pharmacy.pharmacy_on_call_shifts` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadRepository.findCurrentOnCallShifts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:316` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadRepository.findActiveProductOwners | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:176` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:79` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:330` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:348` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `search` | query | No | `string` | Texto a buscar en el nombre de la farmacia o la sede |
| `lat` | query | No | `string` | Latitud WGS84 desde donde medir distancia (va con lng) |
| `lng` | query | No | `string` | Longitud WGS84 desde donde medir distancia (va con lat) |
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |
| `openNow` | query | No | `string` | P34: `true` deja sólo las sedes abiertas ahora (24 h declaradas o de turno vigente) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacySiteListResponseDto>` · DTO `PharmacySiteListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacySiteListItemDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:739` |
| `items[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:656` |
| `items[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:662` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:668` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:674` |
| `items[].addressText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:680` |
| `items[].latitude` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:686` |
| `items[].longitude` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:692` |
| `items[].distanceKm` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:699` |
| `items[].homeDeliveryAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:705` |
| `items[].pickupAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:711` |
| `items[].productCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:717` |
| `items[].open24h` | `boolean` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:723` |
| `items[].onCallUntil` | `string` | No | formato date-time; admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:730` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:745` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: openNow debe ser `true` o `false` |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/pharmacy-on-call-shifts.int-spec.ts:487` |
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:57` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. GET /pharmacy/sites/{siteId}/prices

- **Origen:** CONTRATO
- **Nombre:** Consultar los precios públicos vigentes de una sede
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.getSitePrices` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:275`

### Qué es y para qué sirve (negocio)

Consultar los precios públicos vigentes de una sede. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/sites/{siteId}/prices` la atiende `PharmacyReadController.getSitePrices` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:275). Exige sesión; el controlador no declara roles. Delega en `PharmacyReadService.getSitePrices`. Lee pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:275` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:275` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:65` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:270` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:297` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findSellableProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:208` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findActiveSiteById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:94` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:348` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `product` | query | No | `string` | Producto puntual, si se acota |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacySitePricesResponseDto>` · DTO `PharmacySitePricesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:613` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:619` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:625` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:631` |
| `items` | `array<PharmacySitePriceDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:637` |
| `items[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:508` |
| `items[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:514` |
| `items[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:520` |
| `items[].genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:526` |
| `items[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:532` |
| `items[].packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:538` |
| `items[].medication` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:544` |
| `items[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].requiresPrescription` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:550` |
| `items[].priceListId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:556` |
| `items[].priceListCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:562` |
| `items[].currency` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:568` |
| `items[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].unitAmount` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:574` |
| `items[].taxAmount` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:580` |
| `items[].patientAmount` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:586` |
| `items[].minimumQuantity` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:592` |
| `items[].effectiveFrom` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:598` |
| `items[].effectiveTo` | `string` | No | formato date-time; admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:604` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:643` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sede de farmacia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. GET /public/medications

- **Origen:** CONTRATO
- **Nombre:** Vitrina pública de medicamentos con disponibilidad por farmacia
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyPublicController.listMedications` — `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:149`

### Qué es y para qué sirve (negocio)

Vitrina pública de medicamentos con disponibilidad por farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /public/medications` la atiende `PharmacyPublicController.listMedications` (src/modules/pharmacy/controllers/pharmacy-public.controller.ts:149). Es una ruta pública: no exige token. Delega en `PharmacyMarketplaceService.listMedications`. Lee common.addresses, community.public_profiles, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, terminology.catalog_concepts y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:149` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto a buscar en principio activo, marca o código ATC |
| `group` | query | No | `string` | Grupo terapéutico ATC de primer nivel, tal como lo lista `groups` |
| `lat` | query | No | `string` | Latitud WGS84 desde donde medir distancias (va con lng) |
| `lng` | query | No | `string` | Longitud WGS84 desde donde medir distancias (va con lat) |
| `radiusKm` | query | No | `string` | Radio en km; sólo se aplica si viajó el origen |
| `limit` | query | No | `string` | Tope de tarjetas (máx. 60) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicMedicationPageDto>` · DTO `PublicMedicationPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PublicMedicationCardDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:105` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:29` |
| `items[].atcCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:35` |
| `items[].genericName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:41` |
| `items[].therapeuticGroup` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:47` |
| `items[].brands` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:53` |
| `items[].presentations` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:59` |
| `items[].requiresPrescription` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:65` |
| `items[].priceFrom` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:71` |
| `items[].priceTo` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:77` |
| `items[].currency` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:83` |
| `items[].pharmacyCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:89` |
| `items[].nearestKm` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:96` |
| `total` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:111` |
| `groups` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:117` |
| `generatedAt` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:123` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. GET /public/medications/{conceptId}/availability

- **Origen:** CONTRATO
- **Nombre:** Farmacias que publican un medicamento, con precio y distancia
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyPublicController.getAvailability` — `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:204`

### Qué es y para qué sirve (negocio)

Farmacias que publican un medicamento, con precio y distancia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /public/medications/{conceptId}/availability` la atiende `PharmacyPublicController.getAvailability` (src/modules/pharmacy/controllers/pharmacy-public.controller.ts:204). Es una ruta pública: no exige token. Delega en `PharmacyMarketplaceService.getAvailability`. Lee common.addresses, community.public_profiles, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, terminology.catalog_concepts y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:204` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:204` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:204` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:124` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conceptId` | path | Sí | `string` | — |
| `lat` | query | No | `string` | Latitud WGS84 del origen |
| `lng` | query | No | `string` | Longitud WGS84 del origen |
| `radiusKm` | query | No | `string` | Radio en km |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicMedicationAvailabilityDto>` · DTO `PublicMedicationAvailabilityDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `medication` | `PublicMedicationCardDto` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:225` |
| `medication.conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:29` |
| `medication.atcCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:35` |
| `medication.genericName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:41` |
| `medication.therapeuticGroup` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:47` |
| `medication.brands` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:53` |
| `medication.presentations` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:59` |
| `medication.requiresPrescription` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:65` |
| `medication.priceFrom` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:71` |
| `medication.priceTo` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:77` |
| `medication.currency` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:83` |
| `medication.pharmacyCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:89` |
| `medication.nearestKm` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:96` |
| `offers` | `array<PublicMedicationOfferDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:231` |
| `offers[].pharmacySlug` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:132` |
| `offers[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:138` |
| `offers[].addressText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:144` |
| `offers[].city` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:150` |
| `offers[].latitude` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:156` |
| `offers[].longitude` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:162` |
| `offers[].distanceKm` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:168` |
| `offers[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:174` |
| `offers[].presentation` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:180` |
| `offers[].price` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:186` |
| `offers[].currency` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:192` |
| `offers[].inStock` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:198` |
| `offers[].homeDelivery` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:204` |
| `offers[].pickup` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:210` |
| `offers[].requiresPrescription` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:216` |
| `generatedAt` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/public-marketplace.dto.ts:237` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Medicamento no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /public/pharmacies/open-now

- **Origen:** CONTRATO
- **Nombre:** Farmacias abiertas ahora: 24 h o de turno vigente
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyPublicController.openNow` — `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:87`

### Qué es y para qué sirve (negocio)

Farmacias abiertas ahora: 24 h o de turno vigente. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /public/pharmacies/open-now` la atiende `PharmacyPublicController.openNow` (src/modules/pharmacy/controllers/pharmacy-public.controller.ts:87). Es una ruta pública: no exige token. Delega en `PharmacyOpeningHoursService.openNow`. Lee common.addresses, community.public_profiles, pharmacy.pharmacies, pharmacy.pharmacy_on_call_shifts, pharmacy.pharmacy_sites, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:87` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:87` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | PharmacyPublicController.openNow → PharmacyOpeningHoursService.openNow → PharmacyOnCallShiftsRepository.findOpenNow | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:170` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PharmacyPublicController.openNow → PharmacyOpeningHoursService.openNow → PharmacyOnCallShiftsRepository.findOpenNow | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:170` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PharmacyPublicController.openNow → PharmacyOpeningHoursService.openNow → PharmacyOnCallShiftsRepository.findOpenNow | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:170` |
| `pharmacy.pharmacy_on_call_shifts` | LEE | LEE | POR_SQL | PharmacyPublicController.openNow → PharmacyOpeningHoursService.openNow → PharmacyOnCallShiftsRepository.findOpenNow | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:170` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PharmacyPublicController.openNow → PharmacyOpeningHoursService.openNow → PharmacyOnCallShiftsRepository.findOpenNow | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:170` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PharmacyPublicController.openNow → PharmacyOpeningHoursService.openNow → PharmacyOnCallShiftsRepository.findOpenNow | `src/modules/pharmacy/repositories/pharmacy-on-call-shifts.repository.ts:170` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `mode` | query | No | `string` | `any` (por defecto): 24 h o de turno · `24h`: sólo 24 h · `on-call`: sólo de turno |
| `city` | query | No | `string` | Ciudad de la sede (sin distinguir mayúsculas) |
| `lat` | query | No | `string` | Latitud WGS84 para ordenar por distancia (va con lng) |
| `lng` | query | No | `string` | Longitud WGS84 para ordenar por distancia (va con lat) |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `string` | Tamaño de página (por defecto 20, máx. 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicOpenNowPageDto>` · DTO `PublicOpenNowPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PublicOpenNowItemDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:227` |
| `items[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:175` |
| `items[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:179` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:183` |
| `items[].pharmacySlug` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:187` |
| `items[].addressText` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:191` |
| `items[].city` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:195` |
| `items[].latitude` | `number` | No | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:199` |
| `items[].longitude` | `number` | No | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:203` |
| `items[].distanceKm` | `number` | No | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:207` |
| `items[].open24h` | `boolean` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:211` |
| `items[].onCall` | `PublicOnCallNowDto` | No | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:215` |
| `items[].onCall.startsAt` | `string` | No | formato date-time | — | — | sin fuente |
| `items[].onCall.endsAt` | `string` | No | formato date-time | — | — | sin fuente |
| `items[].onCall.endsAtLocal` | `string` | No | — | — | — | sin fuente |
| `items[].onCall.source` | `string` | No | valores: PHARMACY, PLATFORM | — | — | sin fuente |
| `items[].timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:219` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:231` |
| `asOf` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:235` |
| `asOfLocal` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:239` |
| `timeZone` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/opening-hours.dto.ts:243` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: mode debe ser uno de: {OPEN_NOW_MODES.join(', ')}; BadRequestException: lat y lng van juntos: mande ambos para ordenar por distancia, o ninguno |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/pharmacy-on-call-shifts.int-spec.ts:188` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

