<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy`

- **Bloque:** Farmacia (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)
- **Operaciones:** 24 (24 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 11 · BAJO 13
- **Tablas distintas que tocan:** 31
- **Respuestas de error y detalle contractual:** `openapi/endpoints/pharmacy.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/pharmacies` | Alta de farmacia con licencia inicial | MEDIO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 2 | GET | `/pharmacies/{pharmacyId}/categories` | Categorías de la farmacia (sólo su personal) | BAJO | 2 | SECURITY_ADMIN, PHARMACY_STAFF |
| 3 | POST | `/pharmacies/{pharmacyId}/integration-connections` | Establecer conexión de integración externa | MEDIO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 4 | POST | `/pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings` | Mapear producto a código de proveedor externo | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 5 | POST | `/pharmacies/{pharmacyId}/licenses/{licenseId}/verify` | Verificar licencia y aprobar farmacia | MEDIO | 2 | SECURITY_ADMIN, PHARMACY_STAFF |
| 6 | POST | `/pharmacies/{pharmacyId}/price-lists` | Crear lista de precios (pública / por aseguradora) | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 7 | POST | `/pharmacies/{pharmacyId}/price-lists/{priceListId}/close` | Cerrar/expirar lista de precios | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 8 | POST | `/pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` | Fijar/versionar precio de producto | MEDIO | 5 | SECURITY_ADMIN, PHARMACY_STAFF |
| 9 | POST | `/pharmacies/{pharmacyId}/products` | Publicar producto en catálogo con identificadores | MEDIO | 7 | SECURITY_ADMIN, PHARMACY_STAFF |
| 10 | DELETE | `/pharmacies/{pharmacyId}/products/{productId}` | Retirar (soft-delete) producto del catálogo | MEDIO | 6 | SECURITY_ADMIN, PHARMACY_STAFF |
| 11 | PATCH | `/pharmacies/{pharmacyId}/products/{productId}` | Editar los datos descriptivos de un producto del catálogo | MEDIO | 3 | SECURITY_ADMIN, PHARMACY_STAFF |
| 12 | POST | `/pharmacies/{pharmacyId}/projections` | Proyectar catálogo y precios a read-model | BAJO | 2 | SECURITY_ADMIN, PHARMACY_STAFF |
| 13 | POST | `/pharmacies/{pharmacyId}/sites` | Registrar sede dispensadora | MEDIO | 4 | SECURITY_ADMIN, PHARMACY_STAFF |
| 14 | GET | `/pharmacy/catalog-products` | Buscar en el catálogo universal de medicamentos | BAJO | 4 | sesión (sin roles) |
| 15 | GET | `/pharmacy/pharmacies` | Listar farmacias publicadas del tenant activo | BAJO | 4 | sesión (sin roles) |
| 16 | GET | `/pharmacy/pharmacies/{id}` | Consultar el perfil de una farmacia | BAJO | 9 | sesión (sin roles) |
| 17 | GET | `/pharmacy/pharmacies/{id}/contacts` | Representante legal y gerencias de la farmacia (sólo su personal) | BAJO | 10 | sesión (sin roles) |
| 18 | GET | `/pharmacy/pharmacies/{id}/licenses` | Licencias de la farmacia (sólo su personal) | BAJO | 5 | sesión (sin roles) |
| 19 | GET | `/pharmacy/pharmacies/{id}/summary` | Resumen del catálogo de la farmacia (sólo su personal) | BAJO | 3 | sesión (sin roles) |
| 20 | GET | `/pharmacy/products` | Buscar productos publicados por texto, medicamento o farmacia | BAJO | 3 | sesión (sin roles) |
| 21 | GET | `/pharmacy/sites` | Listar sedes publicadas, sueltas | BAJO | 6 | sesión (sin roles) |
| 22 | GET | `/pharmacy/sites/{siteId}/prices` | Consultar los precios públicos vigentes de una sede | BAJO | 6 | sesión (sin roles) |
| 23 | GET | `/public/medications` | Vitrina pública de medicamentos con disponibilidad por farmacia | BAJO | 11 | pública |
| 24 | GET | `/public/medications/{conceptId}/availability` | Farmacias que publican un medicamento, con precio y distancia | BAJO | 11 | pública |

---

## 1. POST /pharmacies

- **Origen:** CONTRATO
- **Nombre:** Alta de farmacia con licencia inicial
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createPharmacy` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:104`

### Qué es y para qué sirve (negocio)

Alta de farmacia con licencia inicial. Caso de uso UC-24-01: Alta de farmacia con licencia inicial (DRAFT / PENDING). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies` la atiende `PharmacyController.createPharmacy` (src/modules/pharmacy/controllers/pharmacy.controller.ts:104). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreatePharmacyDto` (12 campos, 5 obligatorios). Delega en `PharmaciesService.createPharmacy`. Crea filas en pharmacy.pharmacies, pharmacy.pharmacy_licenses. Lee pharmacy.pharmacies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacies` | ESCRIBE | CREA | DIRECTA | PharmacyController.createPharmacy → PharmaciesService.createPharmacy → PharmaciesRepository.create | `src/modules/pharmacy/repositories/pharmacies.repository.ts:76` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyController.createPharmacy → PharmaciesService.createPharmacy → PharmaciesRepository.findByTenantAndCode | `src/modules/pharmacy/repositories/pharmacies.repository.ts:71` |
| `pharmacy.pharmacy_licenses` | ESCRIBE | CREA | DIRECTA | PharmacyController.createPharmacy → PharmaciesService.createPharmacy → PharmacyLicensesRepository.create | `src/modules/pharmacy/repositories/pharmacy-licenses.repository.ts:76` |

### Cuerpo — DTO `CreatePharmacyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario de la farmacia | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:85` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la farmacia por tenant | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:97` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Razón social | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:106` |
| `tradeName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre comercial | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:115` |
| `isRetail` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Tenant no público / farmacia interna | `src/modules/pharmacy/dto/create-pharmacy.dto.ts:126` |
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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:72` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-01`

---

## 2. GET /pharmacies/{pharmacyId}/categories

- **Origen:** CONTRATO
- **Nombre:** Categorías de la farmacia (sólo su personal)
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.listCategories` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:93`

### Qué es y para qué sirve (negocio)

Categorías de la farmacia (sólo su personal). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacies/{pharmacyId}/categories` la atiende `PharmacyController.listCategories` (src/modules/pharmacy/controllers/pharmacy.controller.ts:93). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyStaffReadService.listCategories`. Lee directory.tenant_memberships, pharmacy.pharmacies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:93` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyController.listCategories → PharmacyStaffReadService.listCategories → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyController.listCategories → PharmacyStaffReadService.listCategories → PharmacyStaffReadService.requireStaffPharmacy → PharmacyReadRepository.findByIdInTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:246` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyCategoryListDto>` · DTO `PharmacyCategoryListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:715` |

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

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /pharmacies/{pharmacyId}/integration-connections

- **Origen:** CONTRATO
- **Nombre:** Establecer conexión de integración externa
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createConnection` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:285`

### Qué es y para qué sirve (negocio)

Establecer conexión de integración externa. Caso de uso UC-24-07: Establecer conexión de integración. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/integration-connections` la atiende `PharmacyController.createConnection` (src/modules/pharmacy/controllers/pharmacy.controller.ts:285). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreateConnectionDto` (9 campos, 1 obligatorio). Delega en `PharmacyIntegrationService.createConnection`. Crea filas en pharmacy.pharmacy_integration_connections. Lee pharmacy.pharmacy_integration_connections, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:285` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:285` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `integrationMode` | `string` | Sí | valores: REALTIME, BATCH | `@IsIn(['REALTIME', 'BATCH'])` | Modo de integración | `src/modules/pharmacy/dto/create-connection.dto.ts:17` |
| `connectionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Conexión de integración externa registrada; si se omite, la fila se auto-referencia | `src/modules/pharmacy/dto/create-connection.dto.ts:29` |
| `pharmacySiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede a la que aplica la conexión | `src/modules/pharmacy/dto/create-connection.dto.ts:40` |
| `inventoryAuthorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la autoridad de inventario | `src/modules/pharmacy/dto/create-connection.dto.ts:51` |
| `supportsStockQuery` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Soporta consulta de stock | `src/modules/pharmacy/dto/create-connection.dto.ts:59` |
| `supportsPriceQuery` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Soporta consulta de precio | `src/modules/pharmacy/dto/create-connection.dto.ts:67` |
| `supportsReservation` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Soporta reserva | `src/modules/pharmacy/dto/create-connection.dto.ts:75` |
| `supportsDispenseConfirmation` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Soporta confirmación de dispensación | `src/modules/pharmacy/dto/create-connection.dto.ts:83` |
| `manualFallbackAllowed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permite fallback manual | `src/modules/pharmacy/dto/create-connection.dto.ts:91` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:231` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy/dto/responses.dto.ts:237` |
| `connectionId` | `string` | Sí | formato uuid | — | Identificador asociado a connection. | `src/modules/pharmacy/dto/responses.dto.ts:243` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:249` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:255` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:164` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-07`

---

## 4. POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings

- **Origen:** CONTRATO
- **Nombre:** Mapear producto a código de proveedor externo
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.mapProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:302`

### Qué es y para qué sirve (negocio)

Mapear producto a código de proveedor externo. Caso de uso UC-24-08: Mapear producto a código externo. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings` la atiende `PharmacyController.mapProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:302). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreateMappingDto` (4 campos, 2 obligatorios). Delega en `PharmacyIntegrationService.mapProduct`. Crea filas en pharmacy.pharmacy_external_product_mappings. Lee pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_integration_connections, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:302` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, connId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:302` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_external_product_mappings` | ESCRIBE | CREA | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyExternalProductMappingsRepository.create | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:70` |
| `pharmacy.pharmacy_external_product_mappings` | LEE | LEE | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyExternalProductMappingsRepository.findByConnectionAndProduct | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:47` |
| `pharmacy.pharmacy_integration_connections` | LEE | LEE | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyIntegrationConnectionsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-integration-connections.repository.ts:69` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.mapProduct → PharmacyIntegrationService.mapProduct → PharmacyProductsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `connId` | path | Sí | `string` | — |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:264` |
| `pharmacyIntegrationConnectionId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy integration connection. | `src/modules/pharmacy/dto/responses.dto.ts:270` |
| `pharmacyProductId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy product. | `src/modules/pharmacy/dto/responses.dto.ts:276` |
| `externalProductCode` | `string` | Sí | — | — | Valor de external product code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:282` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/pharmacy/dto/responses.dto.ts:291` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:297` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada; ResourceNotFoundException: Producto no encontrado |
| 409 | `CONFLICT` | ConflictException: El producto ya está mapeado en esta conexión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no está activa; PreconditionFailedException: La conexión no soporta consulta de stock ni de precio; PreconditionFailedException: El producto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:175` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-08`

---

## 5. POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar licencia y aprobar farmacia
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.verifyLicense` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:121`

### Qué es y para qué sirve (negocio)

Verificar licencia y aprobar farmacia. Caso de uso UC-24-03: Verificar licencia y aprobar farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify` la atiende `PharmacyController.verifyLicense` (src/modules/pharmacy/controllers/pharmacy.controller.ts:121). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyVerifyLicenseDto` (3 campos, 0 obligatorios). Delega en `PharmaciesService.verifyLicense`. Actualiza pharmacy.pharmacy_licenses. Lee pharmacy.pharmacy_licenses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, licenseId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:121` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_licenses` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.verifyLicense → PharmaciesService.verifyLicense | `src/modules/pharmacy/services/pharmacies.service.ts:181` |
| `pharmacy.pharmacy_licenses` | LEE | LEE | DIRECTA | PharmacyController.verifyLicense → PharmaciesService.verifyLicense → PharmacyLicensesRepository.findById | `src/modules/pharmacy/repositories/pharmacy-licenses.repository.ts:59` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `licenseId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyVerifyLicenseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `approve` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true (por defecto) verifica; false rechaza la licencia | `src/modules/pharmacy/dto/verify-license.dto.ts:22` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia usado en la verificación | `src/modules/pharmacy/dto/verify-license.dto.ts:33` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo del rechazo (si aplica) | `src/modules/pharmacy/dto/verify-license.dto.ts:45` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:79` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-03`

---

## 6. POST /pharmacies/{pharmacyId}/price-lists

- **Origen:** CONTRATO
- **Nombre:** Crear lista de precios (pública / por aseguradora)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createPriceList` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:226`

### Qué es y para qué sirve (negocio)

Crear lista de precios (pública / por aseguradora). Caso de uso UC-24-05: Crear lista de precios (pública / por aseguradora). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/price-lists` la atiende `PharmacyController.createPriceList` (src/modules/pharmacy/controllers/pharmacy.controller.ts:226). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreatePriceListDto` (8 campos, 2 obligatorios). Delega en `PharmacyPricingService.createPriceList`. Crea filas en pharmacy.pharmacy_price_lists. Lee insurance.insurance_carriers, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:226` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:226` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `publicVisibility` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Visible públicamente | `src/modules/pharmacy/dto/create-price-list.dto.ts:98` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:147` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy/dto/responses.dto.ts:153` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:159` |
| `priceListType` | `string` | Sí | formato uuid | — | Concept id del tipo | `src/modules/pharmacy/dto/responses.dto.ts:165` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:171` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/pharmacy/dto/responses.dto.ts:177` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:131` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-05`

---

## 7. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar/expirar lista de precios
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.closePriceList` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:268`

### Qué es y para qué sirve (negocio)

Cerrar/expirar lista de precios. Caso de uso UC-24-10: Cerrar/expirar lista de precios. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close` la atiende `PharmacyController.closePriceList` (src/modules/pharmacy/controllers/pharmacy.controller.ts:268). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyPricingService.closePriceList`. Actualiza pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices. Lee pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:268` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, priceListId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:268` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:153` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-10`

---

## 8. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices

- **Origen:** CONTRATO
- **Nombre:** Fijar/versionar precio de producto
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.versionPrice` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:245`

### Qué es y para qué sirve (negocio)

Fijar/versionar precio de producto. Caso de uso UC-24-06: Fijar/versionar precio. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` la atiende `PharmacyController.versionPrice` (src/modules/pharmacy/controllers/pharmacy.controller.ts:245). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `CreatePriceDto` (6 campos, 2 obligatorios). Delega en `PharmacyPricingService.versionPrice`. Crea filas en pharmacy.pharmacy_product_prices. Actualiza pharmacy.pharmacy_product_prices. Lee pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:245` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, priceListId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:245` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:186` |
| `pharmacyPriceListId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy price list. | `src/modules/pharmacy/dto/responses.dto.ts:192` |
| `pharmacyProductId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy product. | `src/modules/pharmacy/dto/responses.dto.ts:198` |
| `versionNumber` | `number` | Sí | — | — | Nº de versión de este precio | `src/modules/pharmacy/dto/responses.dto.ts:204` |
| `unitAmount` | `string` | Sí | — | — | Importe unitario | `src/modules/pharmacy/dto/responses.dto.ts:210` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/pharmacy/dto/responses.dto.ts:216` |
| `effectiveFrom` | `string` | Sí | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:222` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:142` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-06`

---

## 9. POST /pharmacies/{pharmacyId}/products

- **Origen:** CONTRATO
- **Nombre:** Publicar producto en catálogo con identificadores
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.publishProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:162`

### Qué es y para qué sirve (negocio)

Publicar producto en catálogo con identificadores. Caso de uso UC-24-04: Publicar producto con identificadores (GTIN/NDC). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/products` la atiende `PharmacyController.publishProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:162). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyCreateProductDto` (18 campos, 1 obligatorio). Delega en `PharmacyProductsService.publishProduct`. Crea filas en pharmacy.pharmacy_product_identifiers, pharmacy.pharmacy_products. Lee pharmacy.pharmacy_products, terminology.catalog_concepts, terminology.code_system_versions, terminology.code_systems, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:162` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:162` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_product_identifiers` | ESCRIBE | CREA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductIdentifiersRepository.create | `src/modules/pharmacy/repositories/pharmacy-product-identifiers.repository.ts:54` |
| `pharmacy.pharmacy_products` | ESCRIBE | CREA | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsRepository.create | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:121` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsRepository.findByPharmacyAndCode | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:89` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:184` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:81` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:81` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | PharmacyController.publishProduct → PharmacyProductsService.publishProduct → PharmacyProductsService.deriveFromCatalog → MedicineCatalogRepository.findProductById → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:185` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyCreateProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `productCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de producto por farmacia | `src/modules/pharmacy/dto/create-product.dto.ts:78` |
| `catalogProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Producto del catálogo universal de medicamentos (id de `GET /pharmacy/catalog-products`). Con él, marca, genérico, concentración, forma, presentación, receta y el medicamento del vademécum los deriva el servidor y mandarlos es un 400. | `src/modules/pharmacy/dto/create-product.dto.ts:92` |
| `catalogPresentationCode` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Presentación elegida del producto del catálogo (su `code`: CN, CUM…). Sólo con `catalogProductId`. | `src/modules/pharmacy/dto/create-product.dto.ts:103` |
| `medicationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del medicamento | `src/modules/pharmacy/dto/create-product.dto.ts:111` |
| `manufacturerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant fabricante | `src/modules/pharmacy/dto/create-product.dto.ts:119` |
| `brandName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Marca comercial | `src/modules/pharmacy/dto/create-product.dto.ts:128` |
| `genericName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre genérico | `src/modules/pharmacy/dto/create-product.dto.ts:137` |
| `strengthText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Concentración (texto libre) | `src/modules/pharmacy/dto/create-product.dto.ts:149` |
| `dosageFormConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la forma farmacéutica | `src/modules/pharmacy/dto/create-product.dto.ts:160` |
| `packageSizeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Tamaño de empaque (texto libre) | `src/modules/pharmacy/dto/create-product.dto.ts:172` |
| `requiresPrescription` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere receta | `src/modules/pharmacy/dto/create-product.dto.ts:180` |
| `coldChainRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere cadena de frío | `src/modules/pharmacy/dto/create-product.dto.ts:188` |
| `identifiers` | `array<ProductIdentifierDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ProductIdentifierDto)` | Identificadores (GTIN/NDC) | `src/modules/pharmacy/dto/create-product.dto.ts:201` |
| `identifiers[].identifierType` | `string` | No | valores: GTIN, NDC | `@IsIn(['GTIN', 'NDC'])` | Tipo de identificador | `src/modules/pharmacy/dto/create-product.dto.ts:26` |
| `identifiers[].identifierValue` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Valor del identificador | `src/modules/pharmacy/dto/create-product.dto.ts:35` |
| `identifiers[].assigningAuthorityTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant de la autoridad que asigna el identificador | `src/modules/pharmacy/dto/create-product.dto.ts:46` |
| `identifiers[].validFrom` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/pharmacy/dto/create-product.dto.ts:54` |
| `identifiers[].validTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/pharmacy/dto/create-product.dto.ts:62` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: catalogPresentationCode sólo se manda junto con catalogProductId; BadRequestException: {supplied.join(', ')} vienen del catálogo oficial y no se mandan con catalogProductId; BadRequestException: El producto tiene más de una presentación: mande catalogPresentationCode; BadRequestException: catalogPresentationCode no es una presentación de ese producto |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Producto del catálogo no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un producto con ese código en la farmacia; ConflictException: Ya cargó ese producto y presentación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La farmacia no está activa; PreconditionFailedException: El registro sanitario de ese producto no está vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:98` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-04`

---

## 10. DELETE /pharmacies/{pharmacyId}/products/{productId}

- **Origen:** CONTRATO
- **Nombre:** Retirar (soft-delete) producto del catálogo
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.retireProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:209`

### Qué es y para qué sirve (negocio)

Retirar (soft-delete) producto del catálogo. Caso de uso UC-24-09: Retirar (soft-delete) producto en cascada. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`DELETE /pharmacies/{pharmacyId}/products/{productId}` la atiende `PharmacyController.retireProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:209). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyProductsService.retireProduct`. Actualiza pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products. Lee pharmacy.pharmacy_external_product_mappings, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:209` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, productId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:209` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_external_product_mappings` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.retireProduct → PharmacyProductsService.retireProduct | `src/modules/pharmacy/services/pharmacy-products.service.ts:433` |
| `pharmacy.pharmacy_external_product_mappings` | LEE | LEE | DIRECTA | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyExternalProductMappingsRepository.findActiveByProduct | `src/modules/pharmacy/repositories/pharmacy-external-product-mappings.repository.ts:59` |
| `pharmacy.pharmacy_product_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.retireProduct → PharmacyProductsService.retireProduct | `src/modules/pharmacy/services/pharmacy-products.service.ts:423` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyController.retireProduct → PharmacyProductsService.retireProduct → PharmacyProductPricesRepository.findActiveByProduct | `src/modules/pharmacy/repositories/pharmacy-product-prices.repository.ts:103` |
| `pharmacy.pharmacy_products` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.retireProduct → PharmacyProductsService.retireProduct | `src/modules/pharmacy/services/pharmacy-products.service.ts:413` |
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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:120` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-09`

---

## 11. PATCH /pharmacies/{pharmacyId}/products/{productId}

- **Origen:** CONTRATO
- **Nombre:** Editar los datos descriptivos de un producto del catálogo
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.updateProduct` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:181`

### Qué es y para qué sirve (negocio)

Editar los datos descriptivos de un producto del catálogo. Caso de uso P47 §2: Editar marca, genérico, concentración, empaque y receta de un producto activo (null borra el dato). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`PATCH /pharmacies/{pharmacyId}/products/{productId}` la atiende `PharmacyController.updateProduct` (src/modules/pharmacy/controllers/pharmacy.controller.ts:181). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyUpdateProductDto` (5 campos, 0 obligatorios). Delega en `PharmacyProductsService.updateProduct`. Actualiza pharmacy.pharmacy_products. Lee pharmacy.pharmacy_products, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:181` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId, productId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:181` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacy_products` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyController.updateProduct → PharmacyProductsService.updateProduct | `src/modules/pharmacy/services/pharmacy-products.service.ts:255` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyProductsRepository.findById | `src/modules/pharmacy/repositories/pharmacy-products.repository.ts:80` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyController.updateProduct → PharmacyProductsService.updateProduct → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:233` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |
| `productId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyUpdateProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `brandName` | `string` | No | longitud mínima 1; longitud máxima 300; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Marca comercial; `null` la borra | `src/modules/pharmacy/dto/update-product.dto.ts:35` |
| `genericName` | `string` | No | longitud mínima 1; longitud máxima 300; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Nombre genérico; `null` lo borra | `src/modules/pharmacy/dto/update-product.dto.ts:51` |
| `strengthText` | `string` | No | longitud mínima 1; longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Concentración (texto libre); `null` la borra | `src/modules/pharmacy/dto/update-product.dto.ts:67` |
| `packageSizeText` | `string` | No | longitud mínima 1; longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Tamaño de empaque (texto libre); `null` lo borra | `src/modules/pharmacy/dto/update-product.dto.ts:83` |
| `requiresPrescription` | `boolean` | No | admite null | `@IsOptional()` `@IsBoolean()` | Requiere receta; `null` lo borra | `src/modules/pharmacy/dto/update-product.dto.ts:95` |

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
  "requiresPrescription": true
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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: {changed.join(', ')} vienen del catálogo oficial y no se editan |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Producto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El producto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:109` |

### Flujos

- Módulo Pharmacy (24) — etapa `P47 §2`

---

## 12. POST /pharmacies/{pharmacyId}/projections

- **Origen:** CONTRATO
- **Nombre:** Proyectar catálogo y precios a read-model
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.projectCatalog` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:320`

### Qué es y para qué sirve (negocio)

Proyectar catálogo y precios a read-model. Caso de uso UC-24-11: Proyectar catálogo y precios a read-model. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/projections` la atiende `PharmacyController.projectCatalog` (src/modules/pharmacy/controllers/pharmacy.controller.ts:320). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyCatalogService.projectCatalog`. Lee pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:320` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:320` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy/dto/responses.dto.ts:354` |
| `productCount` | `number` | Sí | — | — | Nº de productos activos proyectados | `src/modules/pharmacy/dto/responses.dto.ts:360` |
| `entries` | `array<CatalogEntryDto>` | Sí | — | — | Valor de entries mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:366` |
| `entries[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy/dto/responses.dto.ts:327` |
| `entries[].productCode` | `string` | Sí | — | — | Valor de product code mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:333` |
| `entries[].brandName` | `string` | No | — | — | Valor de brand name mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:339` |
| `entries[].prices` | `array<CatalogPriceDto>` | Sí | — | — | Valor de prices mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:345` |
| `entries[].prices[].priceListId` | `string` | Sí | formato uuid | — | Identificador asociado a price list. | `src/modules/pharmacy/dto/responses.dto.ts:306` |
| `entries[].prices[].unitAmount` | `string` | Sí | — | — | Valor de unit amount mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:312` |
| `entries[].prices[].versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:318` |
| `projectedAt` | `string` | Sí | formato date-time | — | Valor de projected at mantenido por la instancia. | `src/modules/pharmacy/dto/responses.dto.ts:372` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:186` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-11`

---

## 13. POST /pharmacies/{pharmacyId}/sites

- **Origen:** CONTRATO
- **Nombre:** Registrar sede dispensadora
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyController.createSite` — `src/modules/pharmacy/controllers/pharmacy.controller.ts:145`

### Qué es y para qué sirve (negocio)

Registrar sede dispensadora. Caso de uso UC-24-02: Registrar sede dispensadora (requiere farmacia ACTIVE). Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/pharmacy/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacies/{pharmacyId}/sites` la atiende `PharmacyController.createSite` (src/modules/pharmacy/controllers/pharmacy.controller.ts:145). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `PharmacyCreateSiteDto` (8 campos, 3 obligatorios). Delega en `PharmacySitesService.createSite`. Crea filas en pharmacy.pharmacy_sites. Lee pharmacy.pharmacy_sites, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy/controllers/pharmacy.controller.ts:145` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy/controllers/pharmacy.controller.ts:145` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `homeDeliveryAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Ofrece entrega a domicilio | `src/modules/pharmacy/dto/create-site.dto.ts:84` |
| `pickupAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Ofrece retiro en tienda | `src/modules/pharmacy/dto/create-site.dto.ts:92` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy.controller.spec.ts:91` |

### Flujos

- Módulo Pharmacy (24) — etapa `UC-24-02`

---

## 14. GET /pharmacy/catalog-products

- **Origen:** CONTRATO
- **Nombre:** Buscar en el catálogo universal de medicamentos
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.searchCatalogProducts` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:184`

### Qué es y para qué sirve (negocio)

Buscar en el catálogo universal de medicamentos. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/catalog-products` la atiende `PharmacyReadController.searchCatalogProducts` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:184). Exige sesión; el controlador no declara roles. Delega en `MedicineCatalogSearchService.search`. Lee terminology.catalog_concepts, terminology.code_system_versions, terminology.code_systems, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:184` |
| `terminology.code_system_versions` | LEE | LEE | POR_SQL | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:107` |
| `terminology.code_systems` | LEE | LEE | POR_SQL | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:107` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | PharmacyReadController.searchCatalogProducts → MedicineCatalogSearchService.search → MedicineCatalogRepository.search → MedicineCatalogRepository.hydrate | `src/modules/pharmacy/repositories/medicine-catalog.repository.ts:185` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:42` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /pharmacy/pharmacies

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
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:45` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findActiveProductOwners | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:139` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:76` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.listPharmacies → PharmacyReadService.listPharmacies → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:233` |

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

## 16. GET /pharmacy/pharmacies/{id}

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
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:75` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findHeadquartersAddress | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:289` |
| `common.identifiers` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findIdentifiers | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:275` |
| `directory.tenant_affiliation_documents` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findActiveAffiliationDocuments | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:262` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:251` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:62` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadRepository.findActiveProductOwners | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:139` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:76` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:215` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.getPharmacy → PharmacyReadService.getPharmacy → PharmacyReadService.resolveLegalProfile → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:233` |

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

## 17. GET /pharmacy/pharmacies/{id}/contacts

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
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:121` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → ContactPointsRepository.findAllCurrentByOwners | `src/modules/common/repositories/contact-points.repository.ts:96` |
| `common.identifiers` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → IdentifiersRepository.findByIds | `src/modules/common/repositories/identifiers.repository.ts:104` |
| `directory.tenant_legal_representatives` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → DirectoryTenantLegalRepository.listLegalRepsByTenant | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:84` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → PharmacyStaffReadService.requireStaffPharmacy → PharmacyReadRepository.findByIdInTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:246` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → DirectoryTenantLegalRepository.findPersonsByIds | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:167` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | PharmacyReadController.getContacts → PharmacyStaffReadService.getContacts → DirectoryReadService.readRepresentation → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:148` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /pharmacy/pharmacies/{id}/licenses

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
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:92` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyStaffReadService.requireStaffPharmacy → PharmacyReadRepository.findByIdInTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:246` |
| `pharmacy.pharmacy_licenses` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyReadRepository.findLicenses | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:305` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyReadRepository.findSitesByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:318` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.listLicenses → PharmacyStaffReadService.listLicenses → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:233` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:139` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /pharmacy/pharmacies/{id}/summary

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

`GET /pharmacy/pharmacies/{id}/summary` la atiende `PharmacyReadController.getSummary` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:105). Exige sesión; el controlador no declara roles. Delega en `PharmacyStaffReadService.getSummary`. Lee directory.tenant_memberships, pharmacy.pharmacies, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:105` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyStaffReadService.requireStaffPharmacy → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary → PharmacyStaffReadService.requireStaffPharmacy → PharmacyReadRepository.findByIdInTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:246` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.getSummary → PharmacyStaffReadService.getSummary | `src/modules/pharmacy/services/pharmacy-staff-read.service.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacySummaryDto>` · DTO `PharmacySummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `published` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:699` |
| `drafts` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:700` |
| `withdrawn` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:701` |
| `outOfStock` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:702` |
| `lowStock` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:703` |
| `inventoryValue` | `string` | Sí | — | — | Valor del inventario, decimal en texto | `src/modules/pharmacy/dto/read-responses.dto.ts:705` |
| `byCategory` | `array<PharmacyCategoryCountDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:707` |
| `byCategory[].category` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:688` |
| `byCategory[].count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:689` |
| `recentActivity` | `array<PharmacyRecentActivityDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:709` |
| `recentActivity[].id` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:680` |
| `recentActivity[].at` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:681` |
| `recentActivity[].kind` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:682` |
| `recentActivity[].text` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:683` |

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

## 20. GET /pharmacy/products

- **Origen:** CONTRATO
- **Nombre:** Buscar productos publicados por texto, medicamento o farmacia
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.searchProducts` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:196`

### Qué es y para qué sirve (negocio)

Buscar productos publicados por texto, medicamento o farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/products` la atiende `PharmacyReadController.searchProducts` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:196). Exige sesión; el controlador no declara roles. Delega en `PharmacyReadService.searchProducts`. Lee pharmacy.pharmacies, pharmacy.pharmacy_products, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyReadService.searchProducts → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:45` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyReadService.searchProducts → PharmacyReadRepository.findActiveProducts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:110` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.searchProducts → PharmacyReadService.searchProducts → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:233` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `search` | query | No | `string` | Texto a buscar en marca, genérico o código de producto |
| `conceptId` | query | No | `string` | Medicamento del vademécum (medication_concept_id) |
| `pharmacyId` | query | No | `string` | Sólo lo publicado por esta farmacia (carril A, H5) |
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyProductSearchResponseDto>` · DTO `PharmacyProductSearchResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyProductReadDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:427` |
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
| `limit` | `number` | Sí | — | — | Tope aplicado al listado | `src/modules/pharmacy/dto/read-responses.dto.ts:433` |
| `truncated` | `boolean` | Sí | — | — | true si quedaron productos fuera del tope. Se declara, no se calla | `src/modules/pharmacy/dto/read-responses.dto.ts:442` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:107` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. GET /pharmacy/sites

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

`GET /pharmacy/sites` la atiende `PharmacyReadController.listSites` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:143). Exige sesión; el controlador no declara roles. Delega en `PharmacyReadService.listSites`. Lee common.addresses, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, practice.practice_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:143` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findAddresses | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:224` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:45` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadRepository.findActiveProductOwners | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:139` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:76` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:215` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.listSites → PharmacyReadService.listSites → PharmacyReadService.resolveSiteContext → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:233` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `search` | query | No | `string` | Texto a buscar en el nombre de la farmacia o la sede |
| `lat` | query | No | `string` | Latitud WGS84 desde donde medir distancia (va con lng) |
| `lng` | query | No | `string` | Longitud WGS84 desde donde medir distancia (va con lat) |
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacySiteListResponseDto>` · DTO `PharmacySiteListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacySiteListItemDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:669` |
| `items[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:599` |
| `items[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:605` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:611` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:617` |
| `items[].addressText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:623` |
| `items[].latitude` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:629` |
| `items[].longitude` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:635` |
| `items[].distanceKm` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:642` |
| `items[].homeDeliveryAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:648` |
| `items[].pickupAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:654` |
| `items[].productCount` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:660` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:675` |

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
| CONTROLADOR | `src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts:51` |

### Flujos

- Módulo Pharmacy (24) — etapa `ctrl:PharmacyReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /pharmacy/sites/{siteId}/prices

- **Origen:** CONTRATO
- **Nombre:** Consultar los precios públicos vigentes de una sede
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyReadController.getSitePrices` — `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:238`

### Qué es y para qué sirve (negocio)

Consultar los precios públicos vigentes de una sede. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/sites/{siteId}/prices` la atiende `PharmacyReadController.getSitePrices` (src/modules/pharmacy/controllers/pharmacy-read.controller.ts:238). Exige sesión; el controlador no declara roles. Delega en `PharmacyReadService.getSitePrices`. Lee pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:238` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy/controllers/pharmacy-read.controller.ts:238` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:62` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:173` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:200` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findActiveProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:155` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findActiveSiteById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:91` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyReadController.getSitePrices → PharmacyReadService.getSitePrices → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:233` |

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
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:556` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:562` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:568` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:574` |
| `items` | `array<PharmacySitePriceDto>` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:580` |
| `items[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:451` |
| `items[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:457` |
| `items[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:463` |
| `items[].genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:469` |
| `items[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:475` |
| `items[].packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:481` |
| `items[].medication` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:487` |
| `items[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].requiresPrescription` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:493` |
| `items[].priceListId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:499` |
| `items[].priceListCode` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:505` |
| `items[].currency` | `PharmacyConceptDto` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:511` |
| `items[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].unitAmount` | `string` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:517` |
| `items[].taxAmount` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:523` |
| `items[].patientAmount` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:529` |
| `items[].minimumQuantity` | `object` | No | admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:535` |
| `items[].effectiveFrom` | `string` | Sí | formato date-time | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:541` |
| `items[].effectiveTo` | `string` | No | formato date-time; admite null | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:547` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy/dto/read-responses.dto.ts:586` |

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

## 23. GET /public/medications

- **Origen:** CONTRATO
- **Nombre:** Vitrina pública de medicamentos con disponibilidad por farmacia
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyPublicController.listMedications` — `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:64`

### Qué es y para qué sirve (negocio)

Vitrina pública de medicamentos con disponibilidad por farmacia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /public/medications` la atiende `PharmacyPublicController.listMedications` (src/modules/pharmacy/controllers/pharmacy-public.controller.ts:64). Es una ruta pública: no exige token. Delega en `PharmacyMarketplaceService.listMedications`. Lee common.addresses, community.public_profiles, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:64` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:64` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | PharmacyPublicController.listMedications → PharmacyMarketplaceService.listMedications → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |

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

## 24. GET /public/medications/{conceptId}/availability

- **Origen:** CONTRATO
- **Nombre:** Farmacias que publican un medicamento, con precio y distancia
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyPublicController.getAvailability` — `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:119`

### Qué es y para qué sirve (negocio)

Farmacias que publican un medicamento, con precio y distancia. Dentro del módulo (descripción del modelo, en inglés): «A pharmacy is an independent data-owning organization even when physically located inside a hospital, office or nursing facility.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_24_pharmacy.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /public/medications/{conceptId}/availability` la atiende `PharmacyPublicController.getAvailability` (src/modules/pharmacy/controllers/pharmacy-public.controller.ts:119). Es una ruta pública: no exige token. Delega en `PharmacyMarketplaceService.getAvailability`. Lee common.addresses, community.public_profiles, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:119` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conceptId | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:119` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:119` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | PharmacyPublicController.getAvailability → PharmacyMarketplaceService.getAvailability → PharmacyMarketplaceRepository.findPublishedOffers | `src/modules/pharmacy/repositories/pharmacy-marketplace.repository.ts:116` |

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

