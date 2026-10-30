<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `medical_centers`

- **Bloque:** —
- **Operaciones:** 2 (2 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 2
- **Tablas distintas que tocan:** 11
- **Respuestas de error y detalle contractual:** `openapi/endpoints/medical-centers.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/medical-centers/search` | Buscar centros médicos por procedimientos | BAJO | 7 | sesión (sin roles) |
| 2 | GET | `/medical-centers/search/for-my-orders` | Buscar centros médicos para mis órdenes | BAJO | 11 | PATIENT |

---

## 1. GET /medical-centers/search

- **Origen:** CONTRATO
- **Nombre:** Buscar centros médicos por procedimientos
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalCentersController.search` — `src/modules/medical_centers/controllers/medical-centers.controller.ts:45`

### Qué es y para qué sirve (negocio)

Buscar centros médicos por procedimientos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /medical-centers/search` la atiende `MedicalCentersController.search` (src/modules/medical_centers/controllers/medical-centers.controller.ts:45). Exige sesión; el controlador no declara roles. Delega en `MedicalCentersSearchService.search`. Lee billing.service_catalog, common.addresses, practice.healthcare_services, practice.practice_sites, practice.practices, terminology.catalog_concepts, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/medical_centers/controllers/medical-centers.controller.ts:45` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/medical_centers/controllers/medical-centers.controller.ts:45` |
| PARAMETRO_QUERY | procedureConceptIds (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalCentersController.search → MedicalCentersSearchService.search → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:47` |
| `common.addresses` | LEE | LEE | DIRECTA | MedicalCentersController.search → MedicalCentersSearchService.search → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:73` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | MedicalCentersController.search → MedicalCentersSearchService.search → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:38` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | MedicalCentersController.search → MedicalCentersSearchService.search → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:51` |
| `practice.practices` | LEE | LEE | DIRECTA | MedicalCentersController.search → MedicalCentersSearchService.search → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | MedicalCentersController.search → MedicalCentersSearchService.search → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:76` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | MedicalCentersController.search → MedicalCentersSearchService.search → MedicalCentersSearchService.searchAll → ProcedureReferenceReader.referencesFor | `src/modules/billing/services/procedure-reference.reader.ts:78` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `lat` | query | No | `number` | — |
| `lng` | query | No | `number` | — |
| `includePartial` | query | No | `boolean` | Por defecto solo los centros que ofrecen todo lo pedido (`complete: true`). |
| `procedureConceptIds` | query | Sí | `string` | Conceptos de procedimiento separados por coma (uuid). |
| `specialty` | query | No | `string` | — |
| `city` | query | No | `string` | — |
| `offset` | query | No | `number` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalCenterPageDto>` · DTO `MedicalCenterPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MedicalCenterItemDto>` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:212` |
| `items[].practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:179` |
| `items[].practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:181` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:183` |
| `items[].addressText` | `string` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:185` |
| `items[].latitude` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:187` |
| `items[].longitude` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:189` |
| `items[].distanceKm` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:191` |
| `items[].complete` | `boolean` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:193` |
| `items[].missingProcedureConceptIds` | `array<string>` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:196` |
| `items[].offers` | `array<MedicalCenterOfferDto>` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:199` |
| `items[].offers[].procedureConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:155` |
| `items[].offers[].procedureDisplay` | `string` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:157` |
| `items[].offers[].price` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:159` |
| `items[].offers[].currencyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:161` |
| `items[].offers[].referencePrice` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:163` |
| `items[].offers[].referenceUnit` | `string` | Sí | valores: UMA, USD; admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:170` |
| `items[].offers[].overMargin` | `boolean` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:173` |
| `items[].totalPrice` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:201` |
| `items[].practitionerWorksHere` | `boolean` | No | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:203` |
| `items[].suggestedByPractitioner` | `boolean` | No | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:205` |
| `total` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:214` |
| `limit` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:216` |
| `offset` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:218` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_centers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:527` |
| CONTROLADOR | `src/modules/medical_centers/controllers/medical-centers.controller.spec.ts:37` |

### Flujos

- Centros médicos — búsqueda por procedimientos — etapa `ctrl:MedicalCentersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /medical-centers/search/for-my-orders

- **Origen:** CONTRATO
- **Nombre:** Buscar centros médicos para mis órdenes
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalCentersController.searchForMyOrders` — `src/modules/medical_centers/controllers/medical-centers.controller.ts:62`

### Qué es y para qué sirve (negocio)

Buscar centros médicos para mis órdenes.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /medical-centers/search/for-my-orders` la atiende `MedicalCentersController.searchForMyOrders` (src/modules/medical_centers/controllers/medical-centers.controller.ts:62). Exige sesión con alguno de los roles PATIENT. Delega en `MedicalCentersForMyOrdersService.searchForOrders`. Lee billing.service_catalog, clinical.service_requests, common.addresses, practice.healthcare_services, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.patient_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/medical_centers/controllers/medical-centers.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_QUERY | serviceRequestIds (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:47` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → OwnServiceRequestsRepository.findOwned | `src/modules/medical_centers/repositories/own-service-requests.repository.ts:67` |
| `common.addresses` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:73` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → PractitionerAffiliationsRepository.findActiveSites | `src/modules/medical_centers/repositories/practitioner-affiliations.repository.ts:38` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:51` |
| `practice.practices` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:56` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → PractitionerAffiliationsRepository.findActiveSites | `src/modules/medical_centers/repositories/practitioner-affiliations.repository.ts:29` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → OwnServiceRequestsRepository.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → OwnServiceRequestsRepository.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → MedicalCentersSearchService.searchAll → MedicalCenterOffersRepository.findSiteOffers | `src/modules/medical_centers/repositories/medical-center-offers.repository.ts:76` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | MedicalCentersController.searchForMyOrders → MedicalCentersForMyOrdersService.searchForOrders → MedicalCentersSearchService.searchAll → ProcedureReferenceReader.referencesFor | `src/modules/billing/services/procedure-reference.reader.ts:78` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `lat` | query | No | `number` | — |
| `lng` | query | No | `number` | — |
| `includePartial` | query | No | `boolean` | Por defecto solo los centros que ofrecen todo lo pedido (`complete: true`). |
| `serviceRequestIds` | query | Sí | `string` | Ids de órdenes de servicio del titular, separados por coma. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalCenterPageDto>` · DTO `MedicalCenterPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MedicalCenterItemDto>` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:212` |
| `items[].practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:179` |
| `items[].practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:181` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:183` |
| `items[].addressText` | `string` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:185` |
| `items[].latitude` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:187` |
| `items[].longitude` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:189` |
| `items[].distanceKm` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:191` |
| `items[].complete` | `boolean` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:193` |
| `items[].missingProcedureConceptIds` | `array<string>` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:196` |
| `items[].offers` | `array<MedicalCenterOfferDto>` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:199` |
| `items[].offers[].procedureConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:155` |
| `items[].offers[].procedureDisplay` | `string` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:157` |
| `items[].offers[].price` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:159` |
| `items[].offers[].currencyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:161` |
| `items[].offers[].referencePrice` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:163` |
| `items[].offers[].referenceUnit` | `string` | Sí | valores: UMA, USD; admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:170` |
| `items[].offers[].overMargin` | `boolean` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:173` |
| `items[].totalPrice` | `number` | Sí | admite null | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:201` |
| `items[].practitionerWorksHere` | `boolean` | No | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:203` |
| `items[].suggestedByPractitioner` | `boolean` | No | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:205` |
| `total` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:214` |
| `limit` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:216` |
| `offset` | `number` | Sí | — | — | — | `src/modules/medical_centers/dto/medical-center-search.dto.ts:218` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_centers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:947` |
| CONTROLADOR | `src/modules/medical_centers/controllers/medical-centers.controller.spec.ts:38` |

### Flujos

- Centros médicos — búsqueda por procedimientos — etapa `ctrl:MedicalCentersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

