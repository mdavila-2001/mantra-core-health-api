<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `directory`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 23 (23 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 9 · MEDIO 5 · BAJO 9
- **Tablas distintas que tocan:** 24
- **Respuestas de error y detalle contractual:** `openapi/endpoints/directory.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/tenants` | Listado paginado de organizaciones | BAJO | 1 | SUPERADMIN, SECURITY_ADMIN |
| 2 | POST | `/admin/tenants` | Aprovisionar un tenant raíz con su membership owner | MEDIO | 13 | SUPERADMIN |
| 3 | PUT | `/admin/tenants/{tenantId}/public-profile` | Completar la ficha pública de una organización verificada | MEDIO | 3 | SUPERADMIN, SECURITY_ADMIN |
| 4 | POST | `/admin/tenants/{tenantId}/suspend` | Suspender un tenant con cascada de revocación | MEDIO | 6 | SUPERADMIN |
| 5 | POST | `/admin/tenants/{tenantId}/verification` | Verificar y activar un tenant | MEDIO | 7 | SECURITY_ADMIN |
| 6 | GET | `/tenants/{tenantId}` | Ficha de una organización | BAJO | 2 | sesión (sin roles) |
| 7 | PATCH | `/tenants/{tenantId}` | Editar los datos de la propia organización | ALTO | 5 | sesión (sin roles) |
| 8 | GET | `/tenants/{tenantId}/branches` | Sucursales de la organización | BAJO | 3 | sesión (sin roles) |
| 9 | POST | `/tenants/{tenantId}/branches` | Crear una branch / sede física con geolocalización | ALTO | 4 | sesión (sin roles) |
| 10 | PATCH | `/tenants/{tenantId}/branches/{branchId}` | Editar una sucursal | ALTO | 3 | sesión (sin roles) |
| 11 | GET | `/tenants/{tenantId}/child-tenants` | Sub-organizaciones de una organización | BAJO | 2 | sesión (sin roles) |
| 12 | POST | `/tenants/{tenantId}/child-tenants` | Crear una organización hija / sub-tenant | MEDIO | 13 | SECURITY_ADMIN |
| 13 | GET | `/tenants/{tenantId}/logo` | Logo de la propia organización | BAJO | 3 | sesión (sin roles) |
| 14 | PUT | `/tenants/{tenantId}/logo` | Cambiar o quitar el logo como administrador de la organización | ALTO | 7 | sesión (sin roles) |
| 15 | GET | `/tenants/{tenantId}/logo/content` | Imagen del logo para miembros de la organización | BAJO | 5 | sesión (sin roles) |
| 16 | GET | `/tenants/{tenantId}/memberships` | Plantilla de la organización | BAJO | 2 | sesión (sin roles) |
| 17 | POST | `/tenants/{tenantId}/memberships` | Incorporar un usuario al tenant (membership) | ALTO | 2 | sesión (sin roles) |
| 18 | GET | `/tenants/{tenantId}/memberships/{membershipId}/branch-assignments` | Sucursales asignadas a una membresía | BAJO | 3 | sesión (sin roles) |
| 19 | POST | `/tenants/{tenantId}/memberships/{membershipId}/branch-assignments` | Asignar la membresía a una branch | ALTO | 5 | sesión (sin roles) |
| 20 | POST | `/tenants/{tenantId}/memberships/{membershipId}/offboard` | Revocar / offboarding de un miembro | ALTO | 4 | sesión (sin roles) |
| 21 | PATCH | `/tenants/{tenantId}/memberships/{membershipId}/role` | Cambiar rol / scope de la membresía | ALTO | 2 | sesión (sin roles) |
| 22 | POST | `/tenants/{tenantId}/memberships/{membershipId}/transfer` | Transferir la membresía entre branches | ALTO | 6 | sesión (sin roles) |
| 23 | GET | `/tenants/me` | Las organizaciones del actor, con su rol en cada una | BAJO | 12 | sesión (sin roles) |

---

## 1. GET /admin/tenants

- **Origen:** CONTRATO
- **Nombre:** Listado paginado de organizaciones
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminTenantsController.searchTenants` — `src/modules/directory/controllers/admin-tenants.controller.ts:71`

### Qué es y para qué sirve (negocio)

Listado paginado de organizaciones. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /admin/tenants` la atiende `AdminTenantsController.searchTenants` (src/modules/directory/controllers/admin-tenants.controller.ts:71). Exige sesión con alguno de los roles SUPERADMIN, SECURITY_ADMIN. Delega en `DirectoryReadService.searchTenants`. Lee directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPERADMIN, SECURITY_ADMIN | `src/modules/directory/controllers/admin-tenants.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | DIRECTA | AdminTenantsController.searchTenants → DirectoryReadService.searchTenants → DirectoryReadService.pageOfTenants → TenantsRepository.searchPage | `src/modules/directory/repositories/tenants.repository.ts:126` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto a buscar en el código, la razón social o el nombre comercial |
| `status` | query | No | `string` | Concepto de estado al que acotar |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Tope de resultados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchTenantsResponseDto>` · DTO `SearchTenantsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TenantListItemDto>` | Sí | — | — | Organizaciones de esta página, ordenadas por código. | `src/modules/directory/dto/directory-read.dto.ts:74` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la organización. | `src/modules/directory/dto/directory-read.dto.ts:17` |
| `items[].code` | `string` | Sí | — | — | Código único de la organización. | `src/modules/directory/dto/directory-read.dto.ts:23` |
| `items[].legalName` | `string` | Sí | — | — | Razón social. | `src/modules/directory/dto/directory-read.dto.ts:29` |
| `items[].tradeName` | `string` | No | — | — | Nombre comercial, si lo tiene. | `src/modules/directory/dto/directory-read.dto.ts:35` |
| `items[].tenantTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de organización. | `src/modules/directory/dto/directory-read.dto.ts:41` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la organización. | `src/modules/directory/dto/directory-read.dto.ts:47` |
| `items[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | Estado de verificación de la documentación. | `src/modules/directory/dto/directory-read.dto.ts:53` |
| `items[].parentTenantId` | `string` | No | formato uuid; admite null | — | Organización madre, si es una sub-organización. | `src/modules/directory/dto/directory-read.dto.ts:59` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la organización. | `src/modules/directory/dto/directory-read.dto.ts:65` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/directory/dto/directory-read.dto.ts:80` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/directory/dto/directory-read.dto.ts:86` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/directory/dto/directory-read.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/admin-tenants.controller.spec.ts:62` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:AdminTenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /admin/tenants

- **Origen:** CONTRATO
- **Nombre:** Aprovisionar un tenant raíz con su membership owner
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminTenantsController.provision` — `src/modules/directory/controllers/admin-tenants.controller.ts:111`

### Qué es y para qué sirve (negocio)

Aprovisionar un tenant raíz con su membership owner. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /admin/tenants` la atiende `AdminTenantsController.provision` (src/modules/directory/controllers/admin-tenants.controller.ts:111). Exige sesión con alguno de los roles SUPERADMIN. Valida el cuerpo como `CreateTenantDto` (53 campos, 4 obligatorios). Delega en `DirectoryTenantsService.provision`. Crea filas en common.addresses, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.tenant_memberships, directory.tenants, insurance.insurance_brokers, insurance.insurance_carriers y 2 más. Lee directory.tenants, practice.practice_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPERADMIN | `src/modules/directory/controllers/admin-tenants.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → TenantTypeProfileService.materializePayerHeadquarters → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:119` |
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitSitesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:72` |
| `diagnostic_units.diagnostic_units` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:83` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenants` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantsRepository.create | `src/modules/directory/repositories/tenants.repository.ts:131` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantsRepository.findByCode | `src/modules/directory/repositories/tenants.repository.ts:76` |
| `insurance.insurance_brokers` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → CatalogRepository.createBroker | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:256` |
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → CatalogRepository.createCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:62` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitProvisioningService.createPracticeSite → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitProvisioningService.createPracticeSite → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | AdminTenantsController.provision → DirectoryTenantsService.provision → TenantTypeProfileService.assertConceptsExist → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |

### Cuerpo — DTO `CreateTenantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único global del tenant | `src/modules/directory/dto/create-tenant.dto.ts:31` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Razón social / nombre legal | `src/modules/directory/dto/create-tenant.dto.ts:40` |
| `ownerUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario que será owner inicial del tenant | `src/modules/directory/dto/create-tenant.dto.ts:50` |
| `tradeName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre comercial | `src/modules/directory/dto/create-tenant.dto.ts:59` |
| `tenantType` | `string` | Sí | valores: PROVIDER, PAYER, BROKER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER | `@IsIn(TENANT_TYPE_CODES)` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos (PAYER el bloque `payer`, BROKER el bloque `broker`; el resto —PROVIDER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER— país y jurisdicción). Esta puerta administrativa no acepta todavía el bloque `diagnosticUnit` de DIAGNOSTIC_CENTER: la unidad diagnóstica se materializa con sus valores por defecto. | `src/modules/directory/dto/create-tenant.dto.ts:76` |
| `tenantTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de tenant. Escotilla para tipos fuera del catálogo interno; si viene `tenantType`, este campo se ignora. | `src/modules/directory/dto/create-tenant.dto.ts:89` |
| `legalEntityType` | `string` | No | valores: UNIPERSONAL, SRL, LTDA, SA, SOCIEDAD_COLECTIVA, COMANDITA_SIMPLE, COMANDITA_ACCIONES, SUCURSAL_EXTRANJERA, BR_LTDA, BR_SA, BR_MEI, BR_EI, BR_SLU, BR_FILIAL_EST, US_LLC, US_CORP, US_SOLE_PROP, US_LLP, US_BRANCH, AR_SAS, MX_S_RL | `@IsOptional()` `@IsIn(LEGAL_ENTITY_TYPE_CODES)` | Tipo societario del diccionario internacional (BO/BR/US/AR/MX). Si viene, se ignora `legalEntityTypeConceptId`. | `src/modules/directory/dto/create-tenant.dto.ts:104` |
| `legalEntityTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de entidad legal | `src/modules/directory/dto/create-tenant.dto.ts:116` |
| `dataResidencyRegionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la región de residencia de datos | `src/modules/directory/dto/create-tenant.dto.ts:127` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/directory/dto/create-tenant.dto.ts:136` |
| `payer` | `PayerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PayerProfileDto)` | — | `src/modules/directory/dto/create-tenant.dto.ts:146` |
| `payer.carrierCode` | `string` | No | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:37` |
| `payer.sigla` | `string` | No | longitud mínima 1; longitud máxima 20 | `@IsString()` `@MinLength(1)` `@MaxLength(20)` | Sigla de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:50` |
| `payer.address` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Dirección de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:59` |
| `payer.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | Latitud de la casa matriz (-90 a 90); va junto con longitude o no va | `src/common/dto/tenant-type-profile.dto.ts:85` |
| `payer.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | Longitud de la casa matriz (-180 a 180); va junto con latitude o no va | `src/common/dto/tenant-type-profile.dto.ts:102` |
| `payer.regulatorIdentifier` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Identificador ante el regulador de seguros | `src/common/dto/tenant-type-profile.dto.ts:114` |
| `payer.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/tenant-type-profile.dto.ts:122` |
| `broker` | `BrokerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => BrokerProfileDto)` | — | `src/modules/directory/dto/create-tenant.dto.ts:156` |
| `broker.id` | `string` | No | formato uuid | — | — | sin fuente |
| `broker.brokerCode` | `string` | No | — | — | — | sin fuente |
| `broker.legalName` | `string` | No | — | — | — | sin fuente |
| `broker.licenseNumber` | `string` | No | admite null | — | — | sin fuente |
| `broker.jurisdiction` | `InsuranceConceptDto` | No | admite null | — | — | sin fuente |
| `broker.jurisdiction.code` | `string` | No | — | — | — | sin fuente |
| `broker.jurisdiction.display` | `string` | No | — | — | — | sin fuente |
| `broker.status` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `broker.status.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `broker.status.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `broker.verification` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `broker.verification.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `broker.verification.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `broker.independent` | `boolean` | No | — | — | — | sin fuente |
| `broker.currentCarrierCount` | `number` | No | — | — | — | sin fuente |
| `broker.createdAt` | `string` | No | formato date-time | — | — | sin fuente |
| `broker.agreements` | `array<BrokerAgreementDto>` | No | — | — | — | sin fuente |
| `broker.agreements[].id` | `string` | No | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:314` |
| `broker.agreements[].insuranceCarrierId` | `string` | No | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:318` |
| `broker.agreements[].carrierLegalName` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:322` |
| `broker.agreements[].agreementCode` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:326` |
| `broker.agreements[].commissionModel` | `InsuranceConceptDto` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:330` |
| `broker.agreements[].commissionModel.code` | `string` | No | — | — | — | sin fuente |
| `broker.agreements[].commissionModel.display` | `string` | No | — | — | — | sin fuente |
| `broker.agreements[].effectiveFrom` | `string` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:334` |
| `broker.agreements[].effectiveTo` | `string` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:338` |
| `broker.agreements[].status` | `InsuranceConceptDto` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:342` |
| `broker.agreements[].status.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `broker.agreements[].status.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `broker.agreements[].current` | `boolean` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:353` |
| `broker.agreements[].contractFileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:357` |
| `broker.publicProfileId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/create-tenant.dto.ts:165` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/create-tenant.dto.ts:173` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "tradeName": "Nombre de ejemplo",
  "tenantType": "PROVIDER",
  "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalEntityType": "SRL",
  "legalEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "payer": {
    "carrierCode": "CODIGO_EJEMPLO",
    "sigla": "BUPA",
    "address": "valor-ejemplo",
    "latitude": -17.7833,
    "longitude": -63.1821,
    "regulatorIdentifier": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "broker": {
    "id": "00000000-0000-4000-8000-000000000001",
    "brokerCode": "CODIGO_EJEMPLO",
    "legalName": "Nombre de ejemplo",
    "licenseNumber": "valor-ejemplo",
    "jurisdiction": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "status": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "verification": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "independent": true,
    "currentCarrierCount": 1,
    "createdAt": "2026-07-31T12:00:00.000Z",
    "agreements": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
        "carrierLegalName": "Nombre de ejemplo",
        "agreementCode": "CODIGO_EJEMPLO",
        "commissionModel": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "effectiveFrom": "valor-ejemplo",
        "effectiveTo": "valor-ejemplo",
        "status": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "current": true,
        "contractFileId": "00000000-0000-4000-8000-000000000001"
      }
    ],
    "publicProfileId": "00000000-0000-4000-8000-000000000001"
  },
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TenantResponseDto>` · DTO `TenantResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:15` |
| `legalName` | `string` | Sí | — | — | Valor de legal name mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del tenant | `src/modules/directory/dto/tenant-response.dto.ts:30` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/directory/dto/tenant-response.dto.ts:39` |
| `parentTenantId` | `string` | No | formato uuid | — | Tenant padre si es sub-tenant | `src/modules/directory/dto/tenant-response.dto.ts:48` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/directory/dto/tenant-response.dto.ts:54` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El código de tenant ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un tenant de tipo PAYER exige el bloque `payer`; PreconditionFailedException: Un tenant de tipo BROKER exige el bloque `broker`; PreconditionFailedException: Un tenant de tipo {tenantType} exige país y jurisdicción; PreconditionFailedException: El tipo societario pertenece al derecho de {entry!.countryIso} y no coincide con el país declarado; PreconditionFailedException: El bloque `payer` sólo corresponde a un tenant de tipo PAYER; PreconditionFailedException: El bloque `broker` sólo corresponde a un tenant de tipo BROKER; PreconditionFailedException: El bloque `diagnosticUnit` sólo corresponde a un tenant de tipo DIAGNOSTIC_CENTER; PreconditionFailedException: El tipo de unidad diagnóstica declarado no es válido; PreconditionFailedException: Las sucursales sólo se declaran en una unidad de laboratorio clínico; PreconditionFailedException: Alguna modalidad declarada no pertenece al catálogo de modalidades diagnósticas; PreconditionFailedException: Los conceptos declarados no existen en el catálogo de terminología |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/admin-tenants.controller.spec.ts:37` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:AdminTenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. PUT /admin/tenants/{tenantId}/public-profile

- **Origen:** CONTRATO
- **Nombre:** Completar la ficha pública de una organización verificada
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminTenantsController.updatePublicProfile` — `src/modules/directory/controllers/admin-tenants.controller.ts:159`

### Qué es y para qué sirve (negocio)

Completar la ficha pública de una organización verificada. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /admin/tenants/{tenantId}/public-profile` la atiende `AdminTenantsController.updatePublicProfile` (src/modules/directory/controllers/admin-tenants.controller.ts:159). Exige sesión con alguno de los roles SUPERADMIN, SECURITY_ADMIN. Valida el cuerpo como `UpdateTenantPublicProfileDto` (5 campos, 0 obligatorios). Delega en `DirectoryTenantsService.updatePublicProfile`. Actualiza community.public_profiles. Lee community.public_profiles, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPERADMIN, SECURITY_ADMIN | `src/modules/directory/controllers/admin-tenants.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/admin-tenants.controller.ts:159` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | AdminTenantsController.updatePublicProfile → DirectoryTenantsService.updatePublicProfile → PublicProfileProjectionService.updateOrganizationShowcase | `src/modules/community/services/public-profile-projection.service.ts:202` |
| `community.public_profiles` | LEE | LEE | DIRECTA | AdminTenantsController.updatePublicProfile → DirectoryTenantsService.updatePublicProfile → PublicProfileProjectionService.updateOrganizationShowcase → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminTenantsController.updatePublicProfile → DirectoryTenantsService.updatePublicProfile → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateTenantPublicProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `displayName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre visible en el directorio público | `src/modules/directory/dto/update-tenant-public-profile.dto.ts:35` |
| `headline` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Titular corto: qué es el centro en una línea | `src/modules/directory/dto/update-tenant-public-profile.dto.ts:45` |
| `biography` | `string` | No | longitud máxima 5000 | `@IsOptional()` `@IsString()` `@MaxLength(5000)` | Presentación pública del centro | `src/modules/directory/dto/update-tenant-public-profile.dto.ts:52` |
| `avatarFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo del logo, ya subido | `src/modules/directory/dto/update-tenant-public-profile.dto.ts:61` |
| `coverFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de la portada, ya subido | `src/modules/directory/dto/update-tenant-public-profile.dto.ts:75` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarFileId": "00000000-0000-4000-8000-000000000001",
  "coverFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TenantResponseDto>` · DTO `TenantResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:15` |
| `legalName` | `string` | Sí | — | — | Valor de legal name mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del tenant | `src/modules/directory/dto/tenant-response.dto.ts:30` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/directory/dto/tenant-response.dto.ts:39` |
| `parentTenantId` | `string` | No | formato uuid | — | Tenant padre si es sub-tenant | `src/modules/directory/dto/tenant-response.dto.ts:48` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/directory/dto/tenant-response.dto.ts:54` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado; ResourceNotFoundException: Esta organización todavía no tiene vitrina pública: se proyecta al verificarla |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:AdminTenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /admin/tenants/{tenantId}/suspend

- **Origen:** CONTRATO
- **Nombre:** Suspender un tenant con cascada de revocación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminTenantsController.suspend` — `src/modules/directory/controllers/admin-tenants.controller.ts:179`

### Qué es y para qué sirve (negocio)

Suspender un tenant con cascada de revocación. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /admin/tenants/{tenantId}/suspend` la atiende `AdminTenantsController.suspend` (src/modules/directory/controllers/admin-tenants.controller.ts:179). Exige sesión con alguno de los roles SUPERADMIN. Valida el cuerpo como `SuspendTenantDto` (1 campo, 1 obligatorio). Delega en `DirectoryTenantsService.suspend`. Actualiza directory.branches, directory.tenant_memberships, directory.tenants. Lee directory.branches, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPERADMIN | `src/modules/directory/controllers/admin-tenants.controller.ts:179` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/admin-tenants.controller.ts:179` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branches` | ESCRIBE | ACTUALIZA | POR_TIPO | AdminTenantsController.suspend → DirectoryTenantsService.suspend | `src/modules/directory/services/directory-tenants.service.ts:546` |
| `directory.branches` | LEE | LEE | DIRECTA | AdminTenantsController.suspend → DirectoryTenantsService.suspend → BranchesRepository.findByTenantAndStatus | `src/modules/directory/repositories/branches.repository.ts:71` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | AdminTenantsController.suspend → DirectoryTenantsService.suspend | `src/modules/directory/services/directory-tenants.service.ts:556` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AdminTenantsController.suspend → DirectoryTenantsService.suspend → TenantMembershipsRepository.findByTenantAndStatus | `src/modules/directory/repositories/tenant-memberships.repository.ts:126` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | AdminTenantsController.suspend → DirectoryTenantsService.suspend | `src/modules/directory/services/directory-tenants.service.ts:537` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminTenantsController.suspend → DirectoryTenantsService.suspend → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `SuspendTenantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Motivo de la suspensión (queda en auditoría) | `src/modules/directory/dto/suspend-tenant.dto.ts:16` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/directory/dto/status-result.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tenant no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/admin-tenants.controller.spec.ts:52` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:AdminTenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /admin/tenants/{tenantId}/verification

- **Origen:** CONTRATO
- **Nombre:** Verificar y activar un tenant
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminTenantsController.verify` — `src/modules/directory/controllers/admin-tenants.controller.ts:130`

### Qué es y para qué sirve (negocio)

Verificar y activar un tenant. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /admin/tenants/{tenantId}/verification` la atiende `AdminTenantsController.verify` (src/modules/directory/controllers/admin-tenants.controller.ts:130). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `VerifyTenantDto` (2 campos, 0 obligatorios). Delega en `DirectoryTenantsService.verify`. Crea filas en community.public_profiles. Actualiza community.public_profiles, directory.tenants, pharmacy.pharmacies. Lee community.public_profiles, directory.tenants, pharmacy.pharmacies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/directory/controllers/admin-tenants.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/admin-tenants.controller.ts:130` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | AdminTenantsController.verify → DirectoryTenantsService.verify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | AdminTenantsController.verify → DirectoryTenantsService.verify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | AdminTenantsController.verify → DirectoryTenantsService.verify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | AdminTenantsController.verify → DirectoryTenantsService.verify | `src/modules/directory/services/directory-tenants.service.ts:276` |
| `directory.tenants` | LEE | LEE | DIRECTA | AdminTenantsController.verify → DirectoryTenantsService.verify → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `pharmacy.pharmacies` | ESCRIBE | ACTUALIZA | POR_TIPO | AdminTenantsController.verify → DirectoryTenantsService.verify | `src/modules/directory/services/directory-tenants.service.ts:321` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | AdminTenantsController.verify → DirectoryTenantsService.verify | `src/modules/directory/services/directory-tenants.service.ts:316` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyTenantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del país confirmado | `src/modules/directory/dto/verify-tenant.dto.ts:15` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la jurisdicción confirmada | `src/modules/directory/dto/verify-tenant.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TenantResponseDto>` · DTO `TenantResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:15` |
| `legalName` | `string` | Sí | — | — | Valor de legal name mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del tenant | `src/modules/directory/dto/tenant-response.dto.ts:30` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/directory/dto/tenant-response.dto.ts:39` |
| `parentTenantId` | `string` | No | formato uuid | — | Tenant padre si es sub-tenant | `src/modules/directory/dto/tenant-response.dto.ts:48` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/directory/dto/tenant-response.dto.ts:54` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tenant no está pendiente de verificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-center-registration.int-spec.ts:118` |
| CONTROLADOR | `src/modules/directory/controllers/admin-tenants.controller.spec.ts:45` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:AdminTenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /tenants/{tenantId}

- **Origen:** CONTRATO
- **Nombre:** Ficha de una organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.getTenant` — `src/modules/directory/controllers/tenants.controller.ts:138`

### Qué es y para qué sirve (negocio)

Ficha de una organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}` la atiende `TenantsController.getTenant` (src/modules/directory/controllers/tenants.controller.ts:138). Exige sesión; el controlador no declara roles. Delega en `DirectoryReadService.getTenantById`. Lee directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:138` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:138` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.getTenant → DirectoryReadService.getTenantById → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.getTenant → DirectoryReadService.getTenantById → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TenantDetailResponseDto>` · DTO `TenantDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `legalEntityTypeConceptId` | `string` | Sí | formato uuid | — | Forma jurídica. | `src/modules/directory/dto/directory-read.dto.ts:101` |
| `countryConceptId` | `string` | No | formato uuid | — | País de constitución. | `src/modules/directory/dto/directory-read.dto.ts:107` |
| `jurisdictionConceptId` | `string` | No | formato uuid | — | Jurisdicción bajo la que opera. | `src/modules/directory/dto/directory-read.dto.ts:113` |
| `dataResidencyRegionConceptId` | `string` | No | formato uuid | — | Región donde residen sus datos. | `src/modules/directory/dto/directory-read.dto.ts:119` |
| `currencyConceptId` | `string` | No | formato uuid | — | Moneda con la que opera. | `src/modules/directory/dto/directory-read.dto.ts:125` |
| `timeZone` | `string` | No | — | — | Zona horaria de la organización. | `src/modules/directory/dto/directory-read.dto.ts:131` |
| `updatedAt` | `string` | Sí | formato date-time | — | Última modificación del registro. | `src/modules/directory/dto/directory-read.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:131` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. PATCH /tenants/{tenantId}

- **Origen:** CONTRATO
- **Nombre:** Editar los datos de la propia organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.updateTenant` — `src/modules/directory/controllers/tenants.controller.ts:123`

### Qué es y para qué sirve (negocio)

Editar los datos de la propia organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /tenants/{tenantId}` la atiende `TenantsController.updateTenant` (src/modules/directory/controllers/tenants.controller.ts:123). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateTenantDto` (8 campos, 0 obligatorios). Delega en `DirectoryTenantsService.updateTenant`. Actualiza directory.tenants, insurance.insurance_carriers. Lee directory.tenant_memberships, directory.tenants, insurance.insurance_carriers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.updateTenant → DirectoryTenantsService.updateTenant → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.updateTenant → DirectoryTenantsService.updateTenant | `src/modules/directory/services/directory-tenants.service.ts:389` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.updateTenant → DirectoryTenantsService.updateTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `insurance.insurance_carriers` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.updateTenant → DirectoryTenantsService.updateTenant | `src/modules/directory/services/directory-tenants.service.ts:406` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | TenantsController.updateTenant → DirectoryTenantsService.updateTenant → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateTenantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `legalName` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(300)` | — | `src/modules/directory/dto/my-organizations.dto.ts:301` |
| `tradeName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/directory/dto/my-organizations.dto.ts:310` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/directory/dto/my-organizations.dto.ts:321` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/my-organizations.dto.ts:329` |
| `payer` | `UpdatePayerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => UpdatePayerProfileDto)` | — | `src/modules/directory/dto/my-organizations.dto.ts:339` |
| `payer.sigla` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | — | `src/modules/directory/dto/my-organizations.dto.ts:251` |
| `payer.address` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/directory/dto/my-organizations.dto.ts:260` |
| `payer.regulatorIdentifier` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/directory/dto/my-organizations.dto.ts:269` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "legalName": "Nombre de ejemplo",
  "tradeName": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "payer": {
    "sigla": "BUPA",
    "address": "valor-ejemplo",
    "regulatorIdentifier": "valor-ejemplo"
  }
}
```

</details>

### Respuesta — `Promise<TenantResponseDto>` · DTO `TenantResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:15` |
| `legalName` | `string` | Sí | — | — | Valor de legal name mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del tenant | `src/modules/directory/dto/tenant-response.dto.ts:30` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/directory/dto/tenant-response.dto.ts:39` |
| `parentTenantId` | `string` | No | formato uuid | — | Tenant padre si es sub-tenant | `src/modules/directory/dto/tenant-response.dto.ts:48` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/directory/dto/tenant-response.dto.ts:54` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /tenants/{tenantId}/branches

- **Origen:** CONTRATO
- **Nombre:** Sucursales de la organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.listBranches` — `src/modules/directory/controllers/tenants.controller.ts:166`

### Qué es y para qué sirve (negocio)

Sucursales de la organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/branches` la atiende `TenantsController.listBranches` (src/modules/directory/controllers/tenants.controller.ts:166). Exige sesión; el controlador no declara roles. Delega en `DirectoryReadService.listBranches`. Lee directory.branches, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:166` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:166` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branches` | LEE | LEE | DIRECTA | TenantsController.listBranches → DirectoryReadService.listBranches → BranchesRepository.findByTenant | `src/modules/directory/repositories/branches.repository.ts:102` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.listBranches → DirectoryReadService.listBranches → DirectoryReadService.forkForReadableTenant → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.listBranches → DirectoryReadService.listBranches → DirectoryReadService.forkForReadableTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListBranchesResponseDto>` · DTO `ListBranchesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BranchListItemDto>` | Sí | — | — | Sucursales, ordenadas por código. | `src/modules/directory/dto/directory-read.dto.ts:287` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la sucursal. | `src/modules/directory/dto/directory-read.dto.ts:230` |
| `items[].code` | `string` | Sí | — | — | Código de la sucursal dentro de la organización. | `src/modules/directory/dto/directory-read.dto.ts:236` |
| `items[].name` | `string` | Sí | — | — | Nombre de la sucursal. | `src/modules/directory/dto/directory-read.dto.ts:242` |
| `items[].branchTypeConceptId` | `string` | No | formato uuid | — | Tipo de sucursal. | `src/modules/directory/dto/directory-read.dto.ts:248` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la sucursal. | `src/modules/directory/dto/directory-read.dto.ts:254` |
| `items[].timeZone` | `string` | No | — | — | Zona horaria de la sucursal. | `src/modules/directory/dto/directory-read.dto.ts:260` |
| `items[].description` | `string` | No | — | — | Alta de la sucursal. | `src/modules/directory/dto/directory-read.dto.ts:266` |
| `items[].locationUrl` | `string` | No | — | — | — | `src/modules/directory/dto/directory-read.dto.ts:269` |
| `items[].latitude` | `number` | No | — | — | — | `src/modules/directory/dto/directory-read.dto.ts:272` |
| `items[].longitude` | `number` | No | — | — | — | `src/modules/directory/dto/directory-read.dto.ts:275` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/directory/dto/directory-read.dto.ts:278` |
| `count` | `number` | Sí | — | — | Cuántas sucursales trae la respuesta. | `src/modules/directory/dto/directory-read.dto.ts:293` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:140` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /tenants/{tenantId}/branches

- **Origen:** CONTRATO
- **Nombre:** Crear una branch / sede física con geolocalización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.createBranch` — `src/modules/directory/controllers/tenants.controller.ts:234`

### Qué es y para qué sirve (negocio)

Crear una branch / sede física con geolocalización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/branches` la atiende `TenantsController.createBranch` (src/modules/directory/controllers/tenants.controller.ts:234). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateBranchDto` (8 campos, 2 obligatorios). Delega en `DirectoryBranchesService.create`. Crea filas en directory.branches. Lee directory.branches, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:234` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:234` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branches` | ESCRIBE | CREA | DIRECTA | TenantsController.createBranch → DirectoryBranchesService.create → BranchesRepository.create | `src/modules/directory/repositories/branches.repository.ts:76` |
| `directory.branches` | LEE | LEE | DIRECTA | TenantsController.createBranch → DirectoryBranchesService.create → BranchesRepository.findByTenantAndCode | `src/modules/directory/repositories/branches.repository.ts:62` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.createBranch → DirectoryBranchesService.create → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.createBranch → DirectoryBranchesService.create → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateBranchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código de la sede, único dentro del tenant | `src/modules/directory/dto/create-branch.dto.ts:29` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Nombre de la sede | `src/modules/directory/dto/create-branch.dto.ts:38` |
| `branchType` | `string` | No | valores: CLINIC, OFFICE | `@IsOptional()` `@IsIn(['CLINIC', 'OFFICE'])` | Tipo de sede | `src/modules/directory/dto/create-branch.dto.ts:49` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/directory/dto/create-branch.dto.ts:58` |
| `latitude` | `number` | No | mínimo -90; máximo 90 | `@IsOptional()` `@IsNumber()` `@Min(-90)` `@Max(90)` | Latitud geográfica | `src/modules/directory/dto/create-branch.dto.ts:73` |
| `longitude` | `number` | No | mínimo -180; máximo 180 | `@IsOptional()` `@IsNumber()` `@Min(-180)` `@Max(180)` | Longitud geográfica | `src/modules/directory/dto/create-branch.dto.ts:88` |
| `description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción: horario, piso… | `src/modules/directory/dto/create-branch.dto.ts:97` |
| `locationUrl` | `string` | No | longitud máxima 2000; patrón runtime /^https?:\/\//i | `@IsOptional()` `@IsString()` `@MaxLength(2000)` `@Matches(/^https?:\/\//i, { message: 'locationUrl debe ser http o https' })` | Enlace de ubicación (http/https) | `src/modules/directory/dto/create-branch.dto.ts:107` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "branchType": "CLINIC",
  "timeZone": "America/La_Paz",
  "latitude": -12.0464,
  "longitude": -77.0428,
  "description": "Texto descriptivo de ejemplo",
  "locationUrl": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<BranchResponseDto>` · DTO `BranchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/branch-response.dto.ts:9` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/directory/dto/branch-response.dto.ts:15` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/directory/dto/branch-response.dto.ts:21` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/directory/dto/branch-response.dto.ts:27` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado de la branch | `src/modules/directory/dto/branch-response.dto.ts:36` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/directory/dto/branch-response.dto.ts:42` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Mismo valor que `status`: la forma del listado, que el front reutiliza. | `src/modules/directory/dto/branch-response.dto.ts:46` |
| `branchTypeConceptId` | `string` | No | formato uuid | — | — | `src/modules/directory/dto/branch-response.dto.ts:49` |
| `timeZone` | `string` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:52` |
| `description` | `string` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:55` |
| `locationUrl` | `string` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:58` |
| `latitude` | `number` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:61` |
| `longitude` | `number` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:64` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una branch con ese código en el tenant |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tenant no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:68` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. PATCH /tenants/{tenantId}/branches/{branchId}

- **Origen:** CONTRATO
- **Nombre:** Editar una sucursal
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.updateBranch` — `src/modules/directory/controllers/tenants.controller.ts:253`

### Qué es y para qué sirve (negocio)

Editar una sucursal. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /tenants/{tenantId}/branches/{branchId}` la atiende `TenantsController.updateBranch` (src/modules/directory/controllers/tenants.controller.ts:253). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateBranchDto` (5 campos, 0 obligatorios). Delega en `DirectoryBranchesService.update`. Actualiza directory.branches. Lee directory.branches, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:253` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, branchId | `src/modules/directory/controllers/tenants.controller.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branches` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.updateBranch → DirectoryBranchesService.update | `src/modules/directory/services/directory-branches.service.ts:126` |
| `directory.branches` | LEE | LEE | DIRECTA | TenantsController.updateBranch → DirectoryBranchesService.update → BranchesRepository.findById | `src/modules/directory/repositories/branches.repository.ts:53` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.updateBranch → DirectoryBranchesService.update → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `branchId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateBranchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(300)` | — | `src/modules/directory/dto/update-branch.dto.ts:24` |
| `description` | `object` | No | longitud máxima 1000; admite null | `@ValidateIf((_o, v) => v !== null)` `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/directory/dto/update-branch.dto.ts:31` |
| `locationUrl` | `object` | No | longitud máxima 2000; patrón runtime /^https?:\/\//i; admite null | `@ValidateIf((_o, v) => v !== null)` `@IsOptional()` `@IsString()` `@MaxLength(2000)` `@Matches(/^https?:\/\//i, { message: 'locationUrl debe ser http o https' })` | — | `src/modules/directory/dto/update-branch.dto.ts:39` |
| `latitude` | `object` | No | mínimo -90; máximo 90; admite null | `@ValidateIf((_o, v) => v !== null)` `@IsOptional()` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/directory/dto/update-branch.dto.ts:47` |
| `longitude` | `object` | No | mínimo -180; máximo 180; admite null | `@ValidateIf((_o, v) => v !== null)` `@IsOptional()` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/directory/dto/update-branch.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "description": {},
  "locationUrl": {},
  "latitude": {},
  "longitude": {}
}
```

</details>

### Respuesta — `Promise<BranchResponseDto>` · DTO `BranchResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/branch-response.dto.ts:9` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/directory/dto/branch-response.dto.ts:15` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/directory/dto/branch-response.dto.ts:21` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/directory/dto/branch-response.dto.ts:27` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado de la branch | `src/modules/directory/dto/branch-response.dto.ts:36` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/directory/dto/branch-response.dto.ts:42` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Mismo valor que `status`: la forma del listado, que el front reutiliza. | `src/modules/directory/dto/branch-response.dto.ts:46` |
| `branchTypeConceptId` | `string` | No | formato uuid | — | — | `src/modules/directory/dto/branch-response.dto.ts:49` |
| `timeZone` | `string` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:52` |
| `description` | `string` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:55` |
| `locationUrl` | `string` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:58` |
| `latitude` | `number` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:61` |
| `longitude` | `number` | No | — | — | — | `src/modules/directory/dto/branch-response.dto.ts:64` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sucursal no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /tenants/{tenantId}/child-tenants

- **Origen:** CONTRATO
- **Nombre:** Sub-organizaciones de una organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.listChildTenants` — `src/modules/directory/controllers/tenants.controller.ts:148`

### Qué es y para qué sirve (negocio)

Sub-organizaciones de una organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/child-tenants` la atiende `TenantsController.listChildTenants` (src/modules/directory/controllers/tenants.controller.ts:148). Exige sesión; el controlador no declara roles. Delega en `DirectoryReadService.listChildTenants`. Lee directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:148` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.listChildTenants → DirectoryReadService.listChildTenants → DirectoryReadService.forkForReadableTenant → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.listChildTenants → DirectoryReadService.listChildTenants → DirectoryReadService.forkForReadableTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchTenantsResponseDto>` · DTO `SearchTenantsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TenantListItemDto>` | Sí | — | — | Organizaciones de esta página, ordenadas por código. | `src/modules/directory/dto/directory-read.dto.ts:74` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la organización. | `src/modules/directory/dto/directory-read.dto.ts:17` |
| `items[].code` | `string` | Sí | — | — | Código único de la organización. | `src/modules/directory/dto/directory-read.dto.ts:23` |
| `items[].legalName` | `string` | Sí | — | — | Razón social. | `src/modules/directory/dto/directory-read.dto.ts:29` |
| `items[].tradeName` | `string` | No | — | — | Nombre comercial, si lo tiene. | `src/modules/directory/dto/directory-read.dto.ts:35` |
| `items[].tenantTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de organización. | `src/modules/directory/dto/directory-read.dto.ts:41` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la organización. | `src/modules/directory/dto/directory-read.dto.ts:47` |
| `items[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | Estado de verificación de la documentación. | `src/modules/directory/dto/directory-read.dto.ts:53` |
| `items[].parentTenantId` | `string` | No | formato uuid; admite null | — | Organización madre, si es una sub-organización. | `src/modules/directory/dto/directory-read.dto.ts:59` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la organización. | `src/modules/directory/dto/directory-read.dto.ts:65` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/directory/dto/directory-read.dto.ts:80` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/directory/dto/directory-read.dto.ts:86` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/directory/dto/directory-read.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:162` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /tenants/{tenantId}/child-tenants

- **Origen:** CONTRATO
- **Nombre:** Crear una organización hija / sub-tenant
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.createChild` — `src/modules/directory/controllers/tenants.controller.ts:216`

### Qué es y para qué sirve (negocio)

Crear una organización hija / sub-tenant. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/child-tenants` la atiende `TenantsController.createChild` (src/modules/directory/controllers/tenants.controller.ts:216). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateChildTenantDto` (51 campos, 4 obligatorios). Delega en `DirectoryTenantsService.createChild`. Crea filas en common.addresses, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.tenant_memberships, directory.tenants, insurance.insurance_brokers, insurance.insurance_carriers y 2 más. Lee directory.tenants, practice.practice_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/directory/controllers/tenants.controller.ts:216` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:216` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → TenantTypeProfileService.materializePayerHeadquarters → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:119` |
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitSitesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:72` |
| `diagnostic_units.diagnostic_units` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:83` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenants` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantsRepository.create | `src/modules/directory/repositories/tenants.repository.ts:131` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `insurance.insurance_brokers` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → CatalogRepository.createBroker | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:256` |
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → CatalogRepository.createCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:62` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitProvisioningService.createPracticeSite → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitProvisioningService.createPracticeSite → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TenantsController.createChild → DirectoryTenantsService.createChild → TenantTypeProfileService.assertConceptsExist → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateChildTenantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único global del sub-tenant | `src/modules/directory/dto/create-child-tenant.dto.ts:31` |
| `legalName` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Razón social / nombre legal del sub-tenant | `src/modules/directory/dto/create-child-tenant.dto.ts:43` |
| `adminUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario administrador inicial del sub-tenant | `src/modules/directory/dto/create-child-tenant.dto.ts:53` |
| `tenantType` | `string` | Sí | valores: PROVIDER, PAYER, BROKER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER | `@IsIn(TENANT_TYPE_CODES)` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos (PAYER el bloque `payer`, BROKER el bloque `broker`; el resto —PROVIDER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER— país y jurisdicción). Esta puerta administrativa no acepta todavía el bloque `diagnosticUnit` de DIAGNOSTIC_CENTER: la unidad diagnóstica se materializa con sus valores por defecto. | `src/modules/directory/dto/create-child-tenant.dto.ts:73` |
| `tenantTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de tenant. Si viene `tenantType`, se ignora. | `src/modules/directory/dto/create-child-tenant.dto.ts:85` |
| `legalEntityType` | `string` | No | valores: UNIPERSONAL, SRL, LTDA, SA, SOCIEDAD_COLECTIVA, COMANDITA_SIMPLE, COMANDITA_ACCIONES, SUCURSAL_EXTRANJERA, BR_LTDA, BR_SA, BR_MEI, BR_EI, BR_SLU, BR_FILIAL_EST, US_LLC, US_CORP, US_SOLE_PROP, US_LLP, US_BRANCH, AR_SAS, MX_S_RL | `@IsOptional()` `@IsIn(LEGAL_ENTITY_TYPE_CODES)` | Tipo societario del diccionario internacional (BO/BR/US/AR/MX). Si viene, se ignora `legalEntityTypeConceptId`. | `src/modules/directory/dto/create-child-tenant.dto.ts:100` |
| `legalEntityTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de entidad legal | `src/modules/directory/dto/create-child-tenant.dto.ts:112` |
| `dataResidencyRegionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Región de residencia de datos (por defecto hereda la del padre) | `src/modules/directory/dto/create-child-tenant.dto.ts:124` |
| `payer` | `PayerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PayerProfileDto)` | — | `src/modules/directory/dto/create-child-tenant.dto.ts:134` |
| `payer.carrierCode` | `string` | No | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:37` |
| `payer.sigla` | `string` | No | longitud mínima 1; longitud máxima 20 | `@IsString()` `@MinLength(1)` `@MaxLength(20)` | Sigla de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:50` |
| `payer.address` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Dirección de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:59` |
| `payer.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | Latitud de la casa matriz (-90 a 90); va junto con longitude o no va | `src/common/dto/tenant-type-profile.dto.ts:85` |
| `payer.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | Longitud de la casa matriz (-180 a 180); va junto con latitude o no va | `src/common/dto/tenant-type-profile.dto.ts:102` |
| `payer.regulatorIdentifier` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Identificador ante el regulador de seguros | `src/common/dto/tenant-type-profile.dto.ts:114` |
| `payer.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/tenant-type-profile.dto.ts:122` |
| `broker` | `BrokerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => BrokerProfileDto)` | — | `src/modules/directory/dto/create-child-tenant.dto.ts:144` |
| `broker.id` | `string` | No | formato uuid | — | — | sin fuente |
| `broker.brokerCode` | `string` | No | — | — | — | sin fuente |
| `broker.legalName` | `string` | No | — | — | — | sin fuente |
| `broker.licenseNumber` | `string` | No | admite null | — | — | sin fuente |
| `broker.jurisdiction` | `InsuranceConceptDto` | No | admite null | — | — | sin fuente |
| `broker.jurisdiction.code` | `string` | No | — | — | — | sin fuente |
| `broker.jurisdiction.display` | `string` | No | — | — | — | sin fuente |
| `broker.status` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `broker.status.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `broker.status.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `broker.verification` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `broker.verification.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `broker.verification.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `broker.independent` | `boolean` | No | — | — | — | sin fuente |
| `broker.currentCarrierCount` | `number` | No | — | — | — | sin fuente |
| `broker.createdAt` | `string` | No | formato date-time | — | — | sin fuente |
| `broker.agreements` | `array<BrokerAgreementDto>` | No | — | — | — | sin fuente |
| `broker.agreements[].id` | `string` | No | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:314` |
| `broker.agreements[].insuranceCarrierId` | `string` | No | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:318` |
| `broker.agreements[].carrierLegalName` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:322` |
| `broker.agreements[].agreementCode` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:326` |
| `broker.agreements[].commissionModel` | `InsuranceConceptDto` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:330` |
| `broker.agreements[].commissionModel.code` | `string` | No | — | — | — | sin fuente |
| `broker.agreements[].commissionModel.display` | `string` | No | — | — | — | sin fuente |
| `broker.agreements[].effectiveFrom` | `string` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:334` |
| `broker.agreements[].effectiveTo` | `string` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:338` |
| `broker.agreements[].status` | `InsuranceConceptDto` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:342` |
| `broker.agreements[].status.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `broker.agreements[].status.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `broker.agreements[].current` | `boolean` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:353` |
| `broker.agreements[].contractFileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:357` |
| `broker.publicProfileId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/create-child-tenant.dto.ts:153` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/create-child-tenant.dto.ts:161` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER",
  "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalEntityType": "SRL",
  "legalEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "payer": {
    "carrierCode": "CODIGO_EJEMPLO",
    "sigla": "BUPA",
    "address": "valor-ejemplo",
    "latitude": -17.7833,
    "longitude": -63.1821,
    "regulatorIdentifier": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "broker": {
    "id": "00000000-0000-4000-8000-000000000001",
    "brokerCode": "CODIGO_EJEMPLO",
    "legalName": "Nombre de ejemplo",
    "licenseNumber": "valor-ejemplo",
    "jurisdiction": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "status": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "verification": {
      "code": "CARRIER_ACTIVE",
      "display": "Aseguradora activa"
    },
    "independent": true,
    "currentCarrierCount": 1,
    "createdAt": "2026-07-31T12:00:00.000Z",
    "agreements": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
        "carrierLegalName": "Nombre de ejemplo",
        "agreementCode": "CODIGO_EJEMPLO",
        "commissionModel": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "effectiveFrom": "valor-ejemplo",
        "effectiveTo": "valor-ejemplo",
        "status": {
          "code": "CARRIER_ACTIVE",
          "display": "Aseguradora activa"
        },
        "current": true,
        "contractFileId": "00000000-0000-4000-8000-000000000001"
      }
    ],
    "publicProfileId": "00000000-0000-4000-8000-000000000001"
  },
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TenantResponseDto>` · DTO `TenantResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:15` |
| `legalName` | `string` | Sí | — | — | Valor de legal name mantenido por la instancia. | `src/modules/directory/dto/tenant-response.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del tenant | `src/modules/directory/dto/tenant-response.dto.ts:30` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/directory/dto/tenant-response.dto.ts:39` |
| `parentTenantId` | `string` | No | formato uuid | — | Tenant padre si es sub-tenant | `src/modules/directory/dto/tenant-response.dto.ts:48` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/directory/dto/tenant-response.dto.ts:54` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant padre no encontrado |
| 409 | `CONFLICT` | ConflictException: El código de tenant ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tenant padre no está activo; PreconditionFailedException: Un tenant de tipo PAYER exige el bloque `payer`; PreconditionFailedException: Un tenant de tipo BROKER exige el bloque `broker`; PreconditionFailedException: Un tenant de tipo {tenantType} exige país y jurisdicción; PreconditionFailedException: El tipo societario pertenece al derecho de {entry!.countryIso} y no coincide con el país declarado; PreconditionFailedException: El bloque `payer` sólo corresponde a un tenant de tipo PAYER; PreconditionFailedException: El bloque `broker` sólo corresponde a un tenant de tipo BROKER; PreconditionFailedException: El bloque `diagnosticUnit` sólo corresponde a un tenant de tipo DIAGNOSTIC_CENTER; PreconditionFailedException: El tipo de unidad diagnóstica declarado no es válido; PreconditionFailedException: Las sucursales sólo se declaran en una unidad de laboratorio clínico; PreconditionFailedException: Alguna modalidad declarada no pertenece al catálogo de modalidades diagnósticas; PreconditionFailedException: Los conceptos declarados no existen en el catálogo de terminología |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:61` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /tenants/{tenantId}/logo

- **Origen:** CONTRATO
- **Nombre:** Logo de la propia organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrganizationLogoController.get` — `src/modules/directory/controllers/organization-logo.controller.ts:23`

### Qué es y para qué sirve (negocio)

Logo de la propia organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/logo` la atiende `OrganizationLogoController.get` (src/modules/directory/controllers/organization-logo.controller.ts:23). Exige sesión; el controlador no declara roles. Delega en `OrganizationLogoService.get`. Lee community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/organization-logo.controller.ts:23` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/organization-logo.controller.ts:23` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | OrganizationLogoController.get → OrganizationLogoService.get → PublicProfileProjectionService.getOrganizationLogo → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | OrganizationLogoController.get → OrganizationLogoService.get → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | OrganizationLogoController.get → OrganizationLogoService.get → OrganizationLogoService.assertTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:OrganizationLogoController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. PUT /tenants/{tenantId}/logo

- **Origen:** CONTRATO
- **Nombre:** Cambiar o quitar el logo como administrador de la organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrganizationLogoController.set` — `src/modules/directory/controllers/organization-logo.controller.ts:32`

### Qué es y para qué sirve (negocio)

Cambiar o quitar el logo como administrador de la organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /tenants/{tenantId}/logo` la atiende `OrganizationLogoController.set` (src/modules/directory/controllers/organization-logo.controller.ts:32). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SetOrganizationLogoDto` (1 campo, 1 obligatorio). Delega en `OrganizationLogoService.set`. Crea filas en community.public_profiles. Actualiza community.public_profiles. Lee common.file_versions, common.files, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/organization-logo.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/organization-logo.controller.ts:32` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | OrganizationLogoController.set → OrganizationLogoService.set → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | OrganizationLogoController.set → OrganizationLogoService.set → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | OrganizationLogoController.set → OrganizationLogoService.set → PublicProfileProjectionService.setOrganizationLogo | `src/modules/community/services/public-profile-projection.service.ts:105` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | OrganizationLogoController.set → OrganizationLogoService.set → PublicProfileProjectionService.setOrganizationLogo → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | OrganizationLogoController.set → OrganizationLogoService.set → PublicProfileProjectionService.setOrganizationLogo → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | OrganizationLogoController.set → OrganizationLogoService.set → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | OrganizationLogoController.set → OrganizationLogoService.set → OrganizationLogoService.assertTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetOrganizationLogoDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `object` | Sí | formato uuid; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsUUID()` | — | `src/modules/directory/dto/set-organization-logo.dto.ts:9` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": {}
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: El logo debe ser una imagen de sensibilidad NORMAL; PreconditionFailedException: El logo supera los 2 MB |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:OrganizationLogoController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /tenants/{tenantId}/logo/content

- **Origen:** CONTRATO
- **Nombre:** Imagen del logo para miembros de la organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrganizationLogoController.content` — `src/modules/directory/controllers/organization-logo.controller.ts:49`

### Qué es y para qué sirve (negocio)

Imagen del logo para miembros de la organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/logo/content` la atiende `OrganizationLogoController.content` (src/modules/directory/controllers/organization-logo.controller.ts:49). Exige sesión; el controlador no declara roles. Delega en `OrganizationLogoService.content`. Lee common.file_versions, common.files, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/organization-logo.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/organization-logo.controller.ts:49` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | OrganizationLogoController.content → OrganizationLogoService.content → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | OrganizationLogoController.content → OrganizationLogoService.content → AttachableFileService.assertUsableForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.public_profiles` | LEE | LEE | DIRECTA | OrganizationLogoController.content → OrganizationLogoService.content → OrganizationLogoService.get → PublicProfileProjectionService.getOrganizationLogo → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | OrganizationLogoController.content → OrganizationLogoService.content → OrganizationLogoService.get → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | OrganizationLogoController.content → OrganizationLogoService.content → OrganizationLogoService.get → OrganizationLogoService.assertTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada; ResourceNotFoundException: La organización no tiene logo; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: El logo debe ser una imagen de sensibilidad NORMAL |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:OrganizationLogoController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /tenants/{tenantId}/memberships

- **Origen:** CONTRATO
- **Nombre:** Plantilla de la organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.listMemberships` — `src/modules/directory/controllers/tenants.controller.ts:176`

### Qué es y para qué sirve (negocio)

Plantilla de la organización. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/memberships` la atiende `TenantsController.listMemberships` (src/modules/directory/controllers/tenants.controller.ts:176). Exige sesión; el controlador no declara roles. Delega en `DirectoryReadService.listMemberships`. Lee directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:176` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:176` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.listMemberships → DirectoryReadService.listMemberships → TenantMembershipsRepository.findPageByTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:189` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.listMemberships → DirectoryReadService.listMemberships → DirectoryReadService.forkForReadableTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `status` | query | No | `string` | Concepto de estado al que acotar |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchMembershipsResponseDto>` · DTO `SearchMembershipsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MembershipListItemDto>` | Sí | — | — | Membresías de esta página, de la más antigua a la más reciente. | `src/modules/directory/dto/directory-read.dto.ts:203` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la membresía. | `src/modules/directory/dto/directory-read.dto.ts:146` |
| `items[].userId` | `string` | Sí | formato uuid | — | Usuario que la ostenta. | `src/modules/directory/dto/directory-read.dto.ts:152` |
| `items[].tenantRoleConceptId` | `string` | Sí | formato uuid | — | Rol de negocio en la organización. | `src/modules/directory/dto/directory-read.dto.ts:158` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la membresía. | `src/modules/directory/dto/directory-read.dto.ts:164` |
| `items[].accessScopeConceptId` | `string` | No | formato uuid | — | Alcance de acceso concedido. | `src/modules/directory/dto/directory-read.dto.ts:170` |
| `items[].primaryBranchId` | `string` | No | formato uuid; admite null | — | Sucursal principal, si la tiene. | `src/modules/directory/dto/directory-read.dto.ts:176` |
| `items[].startDate` | `string` | No | formato date-time; admite null | — | Inicio de la relación. | `src/modules/directory/dto/directory-read.dto.ts:182` |
| `items[].endDate` | `string` | No | formato date-time; admite null | — | Fin de la relación, si terminó. | `src/modules/directory/dto/directory-read.dto.ts:188` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la membresía. | `src/modules/directory/dto/directory-read.dto.ts:194` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/directory/dto/directory-read.dto.ts:209` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/directory/dto/directory-read.dto.ts:215` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/directory/dto/directory-read.dto.ts:221` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:258` |
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:149` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /tenants/{tenantId}/memberships

- **Origen:** CONTRATO
- **Nombre:** Incorporar un usuario al tenant (membership)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.invite` — `src/modules/directory/controllers/tenants.controller.ts:270`

### Qué es y para qué sirve (negocio)

Incorporar un usuario al tenant (membership). Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/memberships` la atiende `TenantsController.invite` (src/modules/directory/controllers/tenants.controller.ts:270). Exige sesión; el controlador no declara roles. Valida el cuerpo como `DirectoryCreateMembershipDto` (4 campos, 1 obligatorio). Delega en `DirectoryMembershipsService.invite`. Crea filas en directory.tenant_memberships. Lee directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:270` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/directory/controllers/tenants.controller.ts:270` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantsController.invite → DirectoryMembershipsService.invite → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.invite → DirectoryMembershipsService.invite → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `DirectoryCreateMembershipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario a incorporar al tenant | `src/modules/directory/dto/create-membership.dto.ts:20` |
| `role` | `string` | No | valores: OWNER, ADMIN, STAFF | `@IsOptional()` `@IsIn(['OWNER', 'ADMIN', 'STAFF'])` | Rol dentro del tenant | `src/modules/directory/dto/create-membership.dto.ts:31` |
| `accessScope` | `string` | No | valores: ALL_TENANT, BRANCH | `@IsOptional()` `@IsIn(['ALL_TENANT', 'BRANCH'])` | Scope de acceso | `src/modules/directory/dto/create-membership.dto.ts:42` |
| `primaryBranchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Branch primaria opcional | `src/modules/directory/dto/create-membership.dto.ts:53` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "role": "OWNER",
  "accessScope": "ALL_TENANT",
  "primaryBranchId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<MembershipResponseDto>` · DTO `MembershipResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/membership-response.dto.ts:9` |
| `currentTierId` | `string` | No | formato uuid | — | Identificador asociado a current tier. | sin fuente |
| `pointsBalance` | `string` | Sí | — | — | Saldo de puntos | sin fuente |
| `lifetimePoints` | `string` | Sí | — | — | Puntos acumulados de por vida | sin fuente |
| `alreadyEnrolled` | `boolean` | Sí | — | — | true si ya estaba inscrito: la inscripción es idempotente | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma; ForbiddenException: Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee |
| 409 | `CONFLICT` | ConflictException: El usuario ya tiene una membresía activa en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:75` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /tenants/{tenantId}/memberships/{membershipId}/branch-assignments

- **Origen:** CONTRATO
- **Nombre:** Sucursales asignadas a una membresía
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.listBranchAssignments` — `src/modules/directory/controllers/tenants.controller.ts:201`

### Qué es y para qué sirve (negocio)

Sucursales asignadas a una membresía. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` la atiende `TenantsController.listBranchAssignments` (src/modules/directory/controllers/tenants.controller.ts:201). Exige sesión; el controlador no declara roles. Delega en `DirectoryReadService.listBranchAssignments`. Lee directory.branch_memberships, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:201` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, membershipId | `src/modules/directory/controllers/tenants.controller.ts:201` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | TenantsController.listBranchAssignments → DirectoryReadService.listBranchAssignments → BranchMembershipsRepository.findByMembership | `src/modules/directory/repositories/branch-memberships.repository.ts:78` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.listBranchAssignments → DirectoryReadService.listBranchAssignments → TenantMembershipsRepository.findByIdInTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:60` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.listBranchAssignments → DirectoryReadService.listBranchAssignments → DirectoryReadService.forkForReadableTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `membershipId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListBranchAssignmentsResponseDto>` · DTO `ListBranchAssignmentsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BranchAssignmentListItemDto>` | Sí | — | — | Asignaciones, de la más reciente a la más antigua. | `src/modules/directory/dto/directory-read.dto.ts:335` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la asignación. | `src/modules/directory/dto/directory-read.dto.ts:302` |
| `items[].branchId` | `string` | Sí | formato uuid | — | Sucursal asignada. | `src/modules/directory/dto/directory-read.dto.ts:308` |
| `items[].localRoleConceptId` | `string` | No | formato uuid | — | Rol local en esa sucursal. | `src/modules/directory/dto/directory-read.dto.ts:314` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la asignación. | `src/modules/directory/dto/directory-read.dto.ts:320` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la asignación. | `src/modules/directory/dto/directory-read.dto.ts:326` |
| `count` | `number` | Sí | — | — | Cuántas asignaciones trae la respuesta. | `src/modules/directory/dto/directory-read.dto.ts:341` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada; ResourceNotFoundException: Membresía no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:175` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar la membresía a una branch
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.assignBranch` — `src/modules/directory/controllers/tenants.controller.ts:287`

### Qué es y para qué sirve (negocio)

Asignar la membresía a una branch. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` la atiende `TenantsController.assignBranch` (src/modules/directory/controllers/tenants.controller.ts:287). Exige sesión; el controlador no declara roles. Valida el cuerpo como `BranchAssignmentDto` (2 campos, 1 obligatorio). Delega en `DirectoryMembershipsService.assignBranch`. Crea filas en directory.branch_memberships. Actualiza directory.tenant_memberships. Lee directory.branch_memberships, directory.branches, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:287` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, membershipId | `src/modules/directory/controllers/tenants.controller.ts:287` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | ESCRIBE | CREA | DIRECTA | TenantsController.assignBranch → DirectoryMembershipsService.assignBranch → BranchMembershipsRepository.create | `src/modules/directory/repositories/branch-memberships.repository.ts:61` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | TenantsController.assignBranch → DirectoryMembershipsService.assignBranch → BranchMembershipsRepository.findByMembershipBranchStatus | `src/modules/directory/repositories/branch-memberships.repository.ts:49` |
| `directory.branches` | LEE | LEE | DIRECTA | TenantsController.assignBranch → DirectoryMembershipsService.assignBranch → DirectoryMembershipsService.requireBranchInTenant → BranchesRepository.findById | `src/modules/directory/repositories/branches.repository.ts:53` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.assignBranch → DirectoryMembershipsService.assignBranch | `src/modules/directory/services/directory-memberships.service.ts:234` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.assignBranch → DirectoryMembershipsService.assignBranch → DirectoryMembershipsService.requireActiveMembership → TenantMembershipsRepository.findByIdInTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `membershipId` | path | Sí | `string` | — |

### Cuerpo — DTO `BranchAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `branchId` | `string` | Sí | formato uuid | `@IsUUID()` | Branch a la que se asigna la membresía | `src/modules/directory/dto/branch-assignment.dto.ts:17` |
| `localRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del rol local en la branch | `src/modules/directory/dto/branch-assignment.dto.ts:28` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "branchId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "branchId": "00000000-0000-4000-8000-000000000001",
  "localRoleConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<BranchMembershipResponseDto>` · DTO `BranchMembershipResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/branch-membership-response.dto.ts:9` |
| `tenantMembershipId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant membership. | `src/modules/directory/dto/branch-membership-response.dto.ts:15` |
| `branchId` | `string` | Sí | formato uuid | — | Identificador asociado a branch. | `src/modules/directory/dto/branch-membership-response.dto.ts:21` |
| `localRole` | `string` | No | formato uuid | — | Concept id del rol local | `src/modules/directory/dto/branch-membership-response.dto.ts:30` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/directory/dto/branch-membership-response.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Membresía no encontrada; ResourceNotFoundException: Branch no encontrada |
| 409 | `CONFLICT` | ConflictException: La membresía ya está asignada a esa branch |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La membresía no está activa; PreconditionFailedException: La branch no pertenece al tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:82` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /tenants/{tenantId}/memberships/{membershipId}/offboard

- **Origen:** CONTRATO
- **Nombre:** Revocar / offboarding de un miembro
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.offboard` — `src/modules/directory/controllers/tenants.controller.ts:351`

### Qué es y para qué sirve (negocio)

Revocar / offboarding de un miembro. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/memberships/{membershipId}/offboard` la atiende `TenantsController.offboard` (src/modules/directory/controllers/tenants.controller.ts:351). Exige sesión; el controlador no declara roles. Delega en `DirectoryMembershipsService.offboard`. Actualiza directory.branch_memberships, directory.tenant_memberships. Lee directory.branch_memberships, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:351` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, membershipId | `src/modules/directory/controllers/tenants.controller.ts:351` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.offboard → DirectoryMembershipsService.offboard | `src/modules/directory/services/directory-memberships.service.ts:428` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | TenantsController.offboard → DirectoryMembershipsService.offboard → BranchMembershipsRepository.findByMembershipAndStatus | `src/modules/directory/repositories/branch-memberships.repository.ts:39` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.offboard → DirectoryMembershipsService.offboard | `src/modules/directory/services/directory-memberships.service.ts:417` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.offboard → DirectoryMembershipsService.offboard → DirectoryMembershipsService.requireActiveMembership → TenantMembershipsRepository.findByIdInTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `membershipId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/directory/dto/status-result.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma; ForbiddenException: Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Membresía no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La membresía no está activa; PreconditionFailedException: No se puede quitar al último OWNER de la organización: designe otro OWNER primero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:117` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. PATCH /tenants/{tenantId}/memberships/{membershipId}/role

- **Origen:** CONTRATO
- **Nombre:** Cambiar rol / scope de la membresía
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.changeRole` — `src/modules/directory/controllers/tenants.controller.ts:328`

### Qué es y para qué sirve (negocio)

Cambiar rol / scope de la membresía. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /tenants/{tenantId}/memberships/{membershipId}/role` la atiende `TenantsController.changeRole` (src/modules/directory/controllers/tenants.controller.ts:328). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ChangeMembershipRoleDto` (2 campos, 0 obligatorios). Delega en `DirectoryMembershipsService.changeRole`. Actualiza directory.tenant_memberships. Lee directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:328` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, membershipId | `src/modules/directory/controllers/tenants.controller.ts:328` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.changeRole → DirectoryMembershipsService.changeRole | `src/modules/directory/services/directory-memberships.service.ts:369` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.changeRole → DirectoryMembershipsService.changeRole → DirectoryMembershipsService.requireActiveMembership → TenantMembershipsRepository.findByIdInTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `membershipId` | path | Sí | `string` | — |

### Cuerpo — DTO `ChangeMembershipRoleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `role` | `string` | No | valores: OWNER, ADMIN, STAFF | `@IsOptional()` `@IsIn(['OWNER', 'ADMIN', 'STAFF'])` | Nuevo rol de tenant | `src/modules/directory/dto/change-membership-role.dto.ts:19` |
| `accessScope` | `string` | No | valores: ALL_TENANT, BRANCH | `@IsOptional()` `@IsIn(['ALL_TENANT', 'BRANCH'])` | Nuevo scope de acceso | `src/modules/directory/dto/change-membership-role.dto.ts:30` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "role": "OWNER",
  "accessScope": "ALL_TENANT"
}
```

</details>

### Respuesta — `Promise<MembershipResponseDto>` · DTO `MembershipResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/directory/dto/membership-response.dto.ts:9` |
| `currentTierId` | `string` | No | formato uuid | — | Identificador asociado a current tier. | sin fuente |
| `pointsBalance` | `string` | Sí | — | — | Saldo de puntos | sin fuente |
| `lifetimePoints` | `string` | Sí | — | — | Puntos acumulados de por vida | sin fuente |
| `alreadyEnrolled` | `boolean` | Sí | — | — | true si ya estaba inscrito: la inscripción es idempotente | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma; ForbiddenException: Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Membresía no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Debe indicar un nuevo rol o scope; PreconditionFailedException: La membresía no está activa; PreconditionFailedException: No se puede quitar al último OWNER de la organización: designe otro OWNER primero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:106` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /tenants/{tenantId}/memberships/{membershipId}/transfer

- **Origen:** CONTRATO
- **Nombre:** Transferir la membresía entre branches
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.transfer` — `src/modules/directory/controllers/tenants.controller.ts:310`

### Qué es y para qué sirve (negocio)

Transferir la membresía entre branches. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/memberships/{membershipId}/transfer` la atiende `TenantsController.transfer` (src/modules/directory/controllers/tenants.controller.ts:310). Exige sesión; el controlador no declara roles. Valida el cuerpo como `TransferMembershipDto` (2 campos, 2 obligatorios). Delega en `DirectoryMembershipsService.transfer`. Crea filas en directory.branch_memberships. Actualiza directory.branch_memberships, directory.tenant_memberships. Lee directory.branch_memberships, directory.branches, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:310` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, membershipId | `src/modules/directory/controllers/tenants.controller.ts:310` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.transfer → DirectoryMembershipsService.transfer | `src/modules/directory/services/directory-memberships.service.ts:301` |
| `directory.branch_memberships` | ESCRIBE | CREA | DIRECTA | TenantsController.transfer → DirectoryMembershipsService.transfer → BranchMembershipsRepository.create | `src/modules/directory/repositories/branch-memberships.repository.ts:61` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | TenantsController.transfer → DirectoryMembershipsService.transfer → BranchMembershipsRepository.findByMembershipBranchStatus | `src/modules/directory/repositories/branch-memberships.repository.ts:49` |
| `directory.branches` | LEE | LEE | DIRECTA | TenantsController.transfer → DirectoryMembershipsService.transfer → DirectoryMembershipsService.requireBranchInTenant → BranchesRepository.findById | `src/modules/directory/repositories/branches.repository.ts:53` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantsController.transfer → DirectoryMembershipsService.transfer | `src/modules/directory/services/directory-memberships.service.ts:313` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.transfer → DirectoryMembershipsService.transfer → DirectoryMembershipsService.requireActiveMembership → TenantMembershipsRepository.findByIdInTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `membershipId` | path | Sí | `string` | — |

### Cuerpo — DTO `TransferMembershipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fromBranchId` | `string` | Sí | formato uuid | `@IsUUID()` | Branch de origen (se cierra su asignación) | `src/modules/directory/dto/transfer-membership.dto.ts:17` |
| `toBranchId` | `string` | Sí | formato uuid | `@IsUUID()` | Branch de destino (nueva asignación activa) | `src/modules/directory/dto/transfer-membership.dto.ts:27` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fromBranchId": "00000000-0000-4000-8000-000000000001",
  "toBranchId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fromBranchId": "00000000-0000-4000-8000-000000000001",
  "toBranchId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/directory/dto/status-result.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Membresía no encontrada; ResourceNotFoundException: Branch no encontrada; ResourceNotFoundException: No hay asignación activa en la branch de origen |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La membresía no está activa; PreconditionFailedException: La branch no pertenece al tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/directory/controllers/tenants.controller.spec.ts:94` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /tenants/me

- **Origen:** CONTRATO
- **Nombre:** Las organizaciones del actor, con su rol en cada una
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantsController.listMyTenants` — `src/modules/directory/controllers/tenants.controller.ts:104`

### Qué es y para qué sirve (negocio)

Las organizaciones del actor, con su rol en cada una. Dentro del módulo (descripción del modelo, en inglés): «Models each client organization and its sites, and keeps every organization's data strictly isolated.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_04_directory.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/me` la atiende `TenantsController.listMyTenants` (src/modules/directory/controllers/tenants.controller.ts:104). Exige sesión; el controlador no declara roles. Delega en `DirectoryReadService.listMyTenants`. Lee common.addresses, common.contact_points, common.identifiers, directory.tenant_legal_representatives, directory.tenant_memberships, directory.tenants, insurance.insurance_carriers, profiles.persons y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/directory/controllers/tenants.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → ContactPointsRepository.findAllCurrentByOwners | `src/modules/common/repositories/contact-points.repository.ts:96` |
| `common.identifiers` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → IdentifiersRepository.findByIds | `src/modules/common/repositories/identifiers.repository.ts:104` |
| `directory.tenant_legal_representatives` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → DirectoryTenantLegalRepository.listLegalRepsByTenant | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:84` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → TenantMembershipsRepository.findActiveByUser | `src/modules/directory/repositories/tenant-memberships.repository.ts:99` |
| `directory.tenants` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → CatalogRepository.findCarrierByTenantId | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:49` |
| `profiles.persons` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → DirectoryTenantLegalRepository.findPersonsByIds | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:167` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | TenantsController.listMyTenants → DirectoryReadService.listMyTenants → DirectoryReadService.loadRepresentation → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyOrganizationsResponseDto>` · DTO `MyOrganizationsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyOrganizationDto>` | Sí | — | — | Sus organizaciones, de la más recientemente creada a la más antigua. | `src/modules/directory/dto/my-organizations.dto.ts:235` |
| `items[].myRoleConceptId` | `string` | Sí | formato uuid | — | Concepto del rol de la membresía activa (owner/admin/staff) | `src/modules/directory/dto/my-organizations.dto.ts:161` |
| `items[].canAdminister` | `boolean` | Sí | — | — | Verdadero para owner y admin de la organización | `src/modules/directory/dto/my-organizations.dto.ts:169` |
| `items[].isVerified` | `boolean` | Sí | — | — | Verdadero cuando la plataforma verificó la organización | `src/modules/directory/dto/my-organizations.dto.ts:183` |
| `items[].payer` | `PayerOrganizationProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PayerOrganizationProfileDto)` | Datos propios de la aseguradora. Presente sólo si el tenant es `PAYER`. | `src/modules/directory/dto/my-organizations.dto.ts:192` |
| `items[].payer.carrierCode` | `string` | No | — | — | Código de la aseguradora | `src/modules/directory/dto/my-organizations.dto.ts:25` |
| `items[].payer.regulatorIdentifier` | `string` | No | — | — | Identificador ante el regulador de seguros | `src/modules/directory/dto/my-organizations.dto.ts:31` |
| `items[].payer.sigla` | `string` | No | — | — | Sigla de la aseguradora | `src/modules/directory/dto/my-organizations.dto.ts:37` |
| `items[].payer.address` | `string` | No | — | — | Dirección de la aseguradora | `src/modules/directory/dto/my-organizations.dto.ts:43` |
| `items[].payer.latitude` | `number` | No | — | — | Latitud de la casa matriz (-90 a 90) | `src/modules/directory/dto/my-organizations.dto.ts:53` |
| `items[].payer.longitude` | `number` | No | — | — | Longitud de la casa matriz (-180 a 180) | `src/modules/directory/dto/my-organizations.dto.ts:59` |
| `items[].legalRepresentative` | `OrganizationContactPersonDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OrganizationContactPersonDto)` | Quién representa legalmente a la organización (subtarea 1.4). Va al nivel de la organización y no dentro de `payer` porque no es un dato de aseguradora: el registro de procesos pide el mismo bloque para farmacia, laboratorio e imagenología. | `src/modules/directory/dto/my-organizations.dto.ts:205` |
| `items[].legalRepresentative.role` | `string` | No | — | — | Rol canónico del contacto dentro de la organización | `src/modules/directory/dto/my-organizations.dto.ts:83` |
| `items[].legalRepresentative.fullName` | `string` | No | — | — | Nombre completo del contacto | `src/modules/directory/dto/my-organizations.dto.ts:93` |
| `items[].legalRepresentative.name` | `string` | No | — | — | Nombre de pila, si se declaró en partes | `src/modules/directory/dto/my-organizations.dto.ts:105` |
| `items[].legalRepresentative.middleName` | `string` | No | — | — | Segundo nombre, si se declaró | `src/modules/directory/dto/my-organizations.dto.ts:109` |
| `items[].legalRepresentative.lastName` | `string` | No | — | — | Apellido paterno, si se declaró en partes | `src/modules/directory/dto/my-organizations.dto.ts:115` |
| `items[].legalRepresentative.motherLastName` | `string` | No | — | — | Apellido materno, si se declaró | `src/modules/directory/dto/my-organizations.dto.ts:119` |
| `items[].legalRepresentative.email` | `string` | No | formato email | — | Correo de contacto | `src/modules/directory/dto/my-organizations.dto.ts:125` |
| `items[].legalRepresentative.phone` | `string` | No | — | — | Celular o teléfono de contacto | `src/modules/directory/dto/my-organizations.dto.ts:131` |
| `items[].legalRepresentative.idNumber` | `string` | No | — | — | Documento de identidad declarado | `src/modules/directory/dto/my-organizations.dto.ts:137` |
| `items[].executives` | `array<OrganizationContactPersonDto>` | No | — | `@IsOptional()` `@ValidateNested({ each: true })` `@Type(() => OrganizationContactPersonDto)` | Las gerencias de contacto declaradas, en orden canónico (general, comercial, marketing). | `src/modules/directory/dto/my-organizations.dto.ts:215` |
| `items[].executives[].role` | `string` | No | — | — | Rol canónico del contacto dentro de la organización | `src/modules/directory/dto/my-organizations.dto.ts:83` |
| `items[].executives[].fullName` | `string` | No | — | — | Nombre completo del contacto | `src/modules/directory/dto/my-organizations.dto.ts:93` |
| `items[].executives[].name` | `string` | No | — | — | Nombre de pila, si se declaró en partes | `src/modules/directory/dto/my-organizations.dto.ts:105` |
| `items[].executives[].middleName` | `string` | No | — | — | Segundo nombre, si se declaró | `src/modules/directory/dto/my-organizations.dto.ts:109` |
| `items[].executives[].lastName` | `string` | No | — | — | Apellido paterno, si se declaró en partes | `src/modules/directory/dto/my-organizations.dto.ts:115` |
| `items[].executives[].motherLastName` | `string` | No | — | — | Apellido materno, si se declaró | `src/modules/directory/dto/my-organizations.dto.ts:119` |
| `items[].executives[].email` | `string` | No | formato email | — | Correo de contacto | `src/modules/directory/dto/my-organizations.dto.ts:125` |
| `items[].executives[].phone` | `string` | No | — | — | Celular o teléfono de contacto | `src/modules/directory/dto/my-organizations.dto.ts:131` |
| `items[].executives[].idNumber` | `string` | No | — | — | Documento de identidad declarado | `src/modules/directory/dto/my-organizations.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/directory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/organization-headquarters-location.int-spec.ts:272` |
| INTEGRACION | `test/integration/organization-legal-representative.int-spec.ts:650` |

### Flujos

- Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías) — etapa `ctrl:TenantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

