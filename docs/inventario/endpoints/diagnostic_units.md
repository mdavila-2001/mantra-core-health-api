<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostic_units`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 47 (47 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 15 · MEDIO 16 · BAJO 16
- **Tablas distintas que tocan:** 47
- **Respuestas de error y detalle contractual:** `openapi/endpoints/diagnostic-units.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/diagnostic-equipment/{id}` | Detalle de un equipo con su sala (F5a) | BAJO | 12 | sesión (sin roles) |
| 2 | PATCH | `/diagnostic-equipment/{id}` | Actualizar estado/calibración de un equipo | ALTO | 14 | sesión (sin roles) |
| 3 | GET | `/diagnostic-equipment/{id}/mwl-station` | Estación MWL del equipo (F5a) | BAJO | 11 | sesión (sin roles) |
| 4 | POST | `/diagnostic-equipment/{id}/resource` | Crear el recurso agendable del equipo (F5a) | ALTO | 16 | sesión (sin roles) |
| 5 | DELETE | `/diagnostic-results/me/orders/{orderId}/booking` | Cancel the appointment of my order | MEDIO | 12 | PATIENT |
| 6 | POST | `/diagnostic-results/me/orders/{orderId}/booking` | Book my order at a center, confirmed | MEDIO | 26 | PATIENT |
| 7 | GET | `/diagnostic-results/me/orders/{orderId}/booking-options` | Centers that perform the study of my order | BAJO | 23 | PATIENT |
| 8 | DELETE | `/diagnostic-study-offerings/{id}` | Retirar (soft-delete) una oferta de estudio | MEDIO | 3 | SECURITY_ADMIN |
| 9 | POST | `/diagnostic-unit-accreditations/{id}/renew` | Renovar/registrar acreditación con evidencia | MEDIO | 4 | SECURITY_ADMIN |
| 10 | PATCH | `/diagnostic-unit-sites/{siteId}` | Actualizar un sitio operativo de la unidad | MEDIO | 3 | SECURITY_ADMIN |
| 11 | POST | `/diagnostic-unit-sites/{siteId}/equipment` | Registrar equipamiento y calibración del sitio | MEDIO | 5 | SECURITY_ADMIN |
| 12 | GET | `/diagnostic-units` | Listar unidades diagnósticas publicadas | BAJO | 5 | sesión (sin roles) |
| 13 | POST | `/diagnostic-units` | Alta de unidad diagnóstica con sitios y acreditaciones | MEDIO | 4 | SECURITY_ADMIN |
| 14 | GET | `/diagnostic-units/{id}` | Consultar el perfil de una unidad diagnóstica | BAJO | 10 | sesión (sin roles) |
| 15 | POST | `/diagnostic-units/{id}/accreditations` | Registrar una acreditación con evidencia | MEDIO | 3 | SECURITY_ADMIN |
| 16 | GET | `/diagnostic-units/{id}/administration` | Consola de administración de una unidad diagnóstica | BAJO | 11 | SECURITY_ADMIN |
| 17 | POST | `/diagnostic-units/{id}/practitioner-assignments` | Asignar un especialista a la unidad/sitio | MEDIO | 6 | SECURITY_ADMIN |
| 18 | POST | `/diagnostic-units/{id}/price-schedules` | Crear un cronograma de precios | MEDIO | 4 | SECURITY_ADMIN |
| 19 | POST | `/diagnostic-units/{id}/reproject` | Reconstruir la proyección del perfil público | BAJO | 1 | SECURITY_ADMIN |
| 20 | POST | `/diagnostic-units/{id}/sites` | Registrar un sitio operativo de la unidad | MEDIO | 2 | SECURITY_ADMIN |
| 21 | PUT | `/diagnostic-units/{id}/specialties` | Declarar las especialidades de la unidad | MEDIO | 4 | SECURITY_ADMIN |
| 22 | POST | `/diagnostic-units/{id}/study-offerings` | Publicar oferta de estudio con componentes (panel) | MEDIO | 5 | SECURITY_ADMIN |
| 23 | POST | `/diagnostic-units/{id}/verify-and-publish` | Verificar la unidad y publicar su perfil público | MEDIO | 9 | SECURITY_ADMIN |
| 24 | POST | `/diagnostic-units/{unitId}/equipment` | Register a device (a production line) | ALTO | 13 | sesión (sin roles) |
| 25 | DELETE | `/diagnostic-units/{unitId}/equipment/{equipmentId}` | Remove a device registered by mistake | ALTO | 13 | sesión (sin roles) |
| 26 | PATCH | `/diagnostic-units/{unitId}/equipment/{equipmentId}` | Mark a device operational or not | ALTO | 16 | sesión (sin roles) |
| 27 | PUT | `/diagnostic-units/{unitId}/equipment/{equipmentId}` | Edit a device: name, maker, serial, modality | ALTO | 13 | sesión (sin roles) |
| 28 | GET | `/diagnostic-units/{unitId}/schedule` | Schedule, studies and equipment of a center | BAJO | 12 | sesión (sin roles) |
| 29 | PUT | `/diagnostic-units/{unitId}/schedule` | Publish the whole schedule of a center | ALTO | 16 | sesión (sin roles) |
| 30 | GET | `/diagnostic-units/{unitId}/study-availability` | Free starts of a study in a center | BAJO | 12 | sesión (sin roles) |
| 31 | GET | `/diagnostic-units/administration` | Listar las unidades del tenant, publicadas o no | BAJO | 5 | SECURITY_ADMIN |
| 32 | GET | `/diagnostic-units/me/bookings` | Appointments booked at my center, by start | BAJO | 13 | sesión (sin roles) |
| 33 | GET | `/diagnostic-units/me/schedule` | Schedule, studies and equipment of my center | BAJO | 12 | sesión (sin roles) |
| 34 | GET | `/diagnostic-units/search` | Buscar centros de diagnóstico, laboratorio e imagen | BAJO | 10 | sesión (sin roles) |
| 35 | GET | `/diagnostics/lab/catalog` | Catálogo de análisis (LOINC) con componentes y precio sugerido | BAJO | 13 | sesión (sin roles) |
| 36 | POST | `/diagnostics/lab/catalog/import` | Sumar análisis del catálogo, con sus componentes y precio sugerido | ALTO | 17 | sesión (sin roles) |
| 37 | GET | `/diagnostics/lab/categories` | Categorías del laboratorio, con su conteo | BAJO | 7 | sesión (sin roles) |
| 38 | POST | `/diagnostics/lab/categories` | Crear una categoría (409 si el nombre ya existe, sin importar mayúsculas) | ALTO | 8 | sesión (sin roles) |
| 39 | DELETE | `/diagnostics/lab/categories/{id}` | Eliminar una categoría (409 mientras agrupe servicios no retirados) | ALTO | 8 | sesión (sin roles) |
| 40 | PATCH | `/diagnostics/lab/categories/{id}` | Renombrar una categoría (409 si el nombre ya existe) | ALTO | 8 | sesión (sin roles) |
| 41 | GET | `/diagnostics/lab/services` | Catálogo de servicios del laboratorio | BAJO | 7 | sesión (sin roles) |
| 42 | POST | `/diagnostics/lab/services` | Dar de alta un servicio con su precio | ALTO | 10 | sesión (sin roles) |
| 43 | DELETE | `/diagnostics/lab/services/{id}` | Retirar un servicio (no se borra) | ALTO | 8 | sesión (sin roles) |
| 44 | PATCH | `/diagnostics/lab/services/{id}` | Editar un servicio (un precio nuevo es una versión nueva) | ALTO | 10 | sesión (sin roles) |
| 45 | POST | `/diagnostics/lab/services/import` | Carga masiva por código, fila por fila | ALTO | 11 | sesión (sin roles) |
| 46 | POST | `/price-schedules/{scheduleId}/study-prices` | Fijar/versionar el precio de un estudio (append-only) | MEDIO | 6 | SECURITY_ADMIN |
| 47 | POST | `/study-prices/{priceId}/close` | Cerrar una versión de precio vigente | MEDIO | 4 | SECURITY_ADMIN |

---

## 1. GET /diagnostic-equipment/{id}

- **Origen:** CONTRATO
- **Nombre:** Detalle de un equipo con su sala (F5a)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticEquipmentController.detail` — `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:34`

### Qué es y para qué sirve (negocio)

Detalle de un equipo con su sala (F5a). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-equipment/{id}` la atiende `DiagnosticEquipmentController.detail` (src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:34). Exige sesión; el controlador no declara roles. Delega en `EquipmentF5aService.detail`. Lee delegated_access.organization_user_assignments, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:34` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticEquipmentRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:62` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:270` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:76` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:53` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.detail → EquipmentF5aService.detail → EquipmentF5aService.view | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:269` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:501` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:DiagnosticEquipmentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. PATCH /diagnostic-equipment/{id}

- **Origen:** CONTRATO
- **Nombre:** Actualizar estado/calibración de un equipo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticEquipmentController.updateEquipment` — `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:70`

### Qué es y para qué sirve (negocio)

Actualizar estado/calibración de un equipo. Caso de uso UC-23-09: Actualizar estado/calibración de equipo. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /diagnostic-equipment/{id}` la atiende `DiagnosticEquipmentController.updateEquipment` (src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:70). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateEquipmentDto` (8 campos, 0 obligatorios). Delega en `DiagnosticEquipmentService.updateEquipment`. Crea filas en messaging.domain_events, messaging.outbox_messages. Lee delegated_access.organization_user_assignments, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces y 4 más. Publica diagnostic_units.equipment.located, diagnostic_units.equipment.status_changed.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:70` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticEquipmentRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:62` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:270` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:76` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.announceChanges → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.announceChanges → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.announceChanges → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:53` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `diagnostic_units.equipment.located` | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:229` |
| Evento de dominio | `diagnostic_units.equipment.status_changed` | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:242` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateEquipmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careSpaceId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostic_units/dto/equipment.dto.ts:102` |
| `aeTitle` | `string` | No | longitud máxima 16; admite null | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/diagnostic_units/dto/equipment.dto.ts:109` |
| `stationName` | `string` | No | longitud máxima 16; admite null | `@IsOptional()` `@IsString()` `@MaxLength(16)` | — | `src/modules/diagnostic_units/dto/equipment.dto.ts:116` |
| `manufacturer` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Fabricante | `src/modules/diagnostic_units/dto/equipment.dto.ts:125` |
| `model` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Modelo | `src/modules/diagnostic_units/dto/equipment.dto.ts:134` |
| `lastCalibrationAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Última calibración | `src/modules/diagnostic_units/dto/equipment.dto.ts:147` |
| `nextCalibrationDueAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Próxima calibración | `src/modules/diagnostic_units/dto/equipment.dto.ts:160` |
| `operationalStatusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado operativo (concept id) | `src/modules/diagnostic_units/dto/equipment.dto.ts:171` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "aeTitle": "valor-ejemplo",
  "stationName": "Nombre de ejemplo",
  "manufacturer": "valor-ejemplo",
  "model": "valor-ejemplo",
  "lastCalibrationAt": "2026-07-31T12:00:00.000Z",
  "nextCalibrationDueAt": "2026-07-31T12:00:00.000Z",
  "operationalStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<EquipmentResponseDto>` · DTO `EquipmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:162` |
| `diagnosticUnitSiteId` | `string` | Sí | formato uuid | — | Identificador asociado a diagnostic unit site. | `src/modules/diagnostic_units/dto/responses.dto.ts:168` |
| `operationalStatus` | `string` | Sí | formato uuid | — | Concept id de estado operativo | `src/modules/diagnostic_units/dto/responses.dto.ts:177` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | F5a: sala del equipo. | `src/modules/diagnostic_units/dto/responses.dto.ts:181` |
| `aeTitle` | `string` | No | admite null | — | F5a: DICOM AE Title. | `src/modules/diagnostic_units/dto/responses.dto.ts:185` |
| `stationName` | `string` | No | admite null | — | F5a: DICOM Station Name. | `src/modules/diagnostic_units/dto/responses.dto.ts:189` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El AE Title ya está en uso en la sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sala es de otra sede; PreconditionFailedException: El espacio no aloja equipos; PreconditionFailedException: AE Title inválido (≤ 16 caracteres ASCII, sin barra invertida) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:458` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-09`

---

## 3. GET /diagnostic-equipment/{id}/mwl-station

- **Origen:** CONTRATO
- **Nombre:** Estación MWL del equipo (F5a)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticEquipmentController.mwlStation` — `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:60`

### Qué es y para qué sirve (negocio)

Estación MWL del equipo (F5a). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-equipment/{id}/mwl-station` la atiende `DiagnosticEquipmentController.mwlStation` (src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:60). Exige sesión; el controlador no declara roles. Delega en `EquipmentF5aService.mwlStation`. Lee delegated_access.organization_user_assignments, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:60` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticEquipmentRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:62` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:270` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:76` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:53` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.mwlStation → EquipmentF5aService.mwlStation → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:520` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:DiagnosticEquipmentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /diagnostic-equipment/{id}/resource

- **Origen:** CONTRATO
- **Nombre:** Crear el recurso agendable del equipo (F5a)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticEquipmentController.createResource` — `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:44`

### Qué es y para qué sirve (negocio)

Crear el recurso agendable del equipo (F5a). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-equipment/{id}/resource` la atiende `DiagnosticEquipmentController.createResource` (src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:44). Exige sesión; el controlador no declara roles. Delega en `EquipmentF5aService.createResource`. Crea filas en messaging.domain_events, messaging.outbox_messages, scheduling.schedulable_resources. Lee delegated_access.organization_user_assignments, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces y 5 más. Publica diagnostic_units.equipment.resource_linked.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:44` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticEquipmentRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:62` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:270` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:76` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:53` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource → EquipmentF5aService.authorize → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `scheduling.schedulable_resources` | ESCRIBE | CREA | POR_SQL | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:125` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | DiagnosticEquipmentController.createResource → EquipmentF5aService.createResource | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:108` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `diagnostic_units.equipment.resource_linked` | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:147` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El equipo ya tiene un recurso agendable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:529` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:DiagnosticEquipmentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. DELETE /diagnostic-results/me/orders/{orderId}/booking

- **Origen:** CONTRATO
- **Nombre:** Cancel the appointment of my order
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrderBookingController.cancel` — `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:87`

### Qué es y para qué sirve (negocio)

Cancel the appointment of my order. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostic-results/me/orders/{orderId}/booking` la atiende `OrderBookingController.cancel` (src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:87). Exige sesión con alguno de los roles PATIENT. Delega en `CancelOrderBookingUseCase.execute`. Actualiza scheduling.appointment_bookings, scheduling.bookable_slots. Lee clinical.diagnostic_reports, clinical.service_requests, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_versions, diagnostics.service_request_performer_events, profiles.patient_profiles, profiles.person_account_links, scheduling.appointment_bookings y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: orderId | `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:87` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `clinical.service_requests` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderPatientRepository.lockOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:98` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `diagnostics.service_request_performer_events` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.findDiagnosticOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:70` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.ownPatientProfileId | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:48` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.ownPatientProfileId | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:43` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → CenterBookingsRepository.cancel | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:190` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → CenterBookingsRepository.findForOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:84` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → CenterBookingsRepository.cancel | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:197` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → CenterBookingsRepository.findForOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:84` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | OrderBookingController.cancel → CancelOrderBookingUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.findDiagnosticOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:70` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `orderId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden no encontrada; ResourceNotFoundException: La orden no tiene cita |
| 409 | `CONFLICT` | ConflictException: Esta orden ya tiene su resultado: no hace falta reservar. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Ese turno ya pasó. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:OrderBookingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /diagnostic-results/me/orders/{orderId}/booking

- **Origen:** CONTRATO
- **Nombre:** Book my order at a center, confirmed
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrderBookingController.book` — `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:66`

### Qué es y para qué sirve (negocio)

Book my order at a center, confirmed. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-results/me/orders/{orderId}/booking` la atiende `OrderBookingController.book` (src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:66). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `BookOrderDto` (3 campos, 2 obligatorios). Delega en `BookOrderUseCase.execute`. Crea filas en scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources. Actualiza scheduling.bookable_slots. Lee clinical.diagnostic_reports, clinical.service_request_components, clinical.service_requests, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: orderId | `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:66` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `clinical.service_request_components` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderQuoteService.pricerFor → OrderPatientRepository.orderedComponents | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:109` |
| `clinical.service_requests` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderPatientRepository.lockOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:98` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderQuoteService.pricerFor → CenterStudiesRepository.findParts | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:95` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `diagnostics.service_request_performer_events` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.findDiagnosticOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:70` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | OrderBookingController.book → BookOrderUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.ownPatientProfileId | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:48` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | OrderBookingController.book → BookOrderUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.ownPatientProfileId | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:43` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterBookingsRepository.insertBooking | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:159` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterBookingsRepository.findForOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:84` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterBookingsRepository.takeSlot | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:114` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterBookingsRepository.takeSlot | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:136` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterBookingsRepository.findForOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:84` |
| `scheduling.schedulable_resources` | ESCRIBE | CREA | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterScheduleRepository.createResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:143` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterBookingsRepository.lockResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:100` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderBookingAccessService.ownOrder → OrderPatientRepository.findDiagnosticOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:70` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | OrderBookingController.book → BookOrderUseCase.execute → OrderQuoteService.pricerFor → CenterStudiesRepository.findParts | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:95` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `orderId` | path | Sí | `string` | — |

### Cuerpo — DTO `BookOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:8` |
| `siteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | The site (branch) chosen; absent, the main site. | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:16` |
| `startAt` | `string` | Sí | — | `@IsISO8601()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:20` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-11-05T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-11-05T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<OrderAppointmentDto>` · DTO `OrderAppointmentDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:25` |
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:26` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:27` |
| `addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:28` |
| `startAt` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:29` |
| `endAt` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:30` |
| `studyName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:31` |
| `price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:32` |
| `currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:33` |
| `preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/order-booking.dto.ts:34` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden no encontrada; ResourceNotFoundException: Centro no encontrado; ResourceNotFoundException: Sucursal no encontrada; ResourceNotFoundException: El centro no hace ese estudio |
| 409 | `CONFLICT` | ConflictException: Esta orden ya tiene su resultado: no hace falta reservar.; ConflictException: Esta orden ya tiene un turno. Cancélelo para elegir otro.; ConflictException: Ese horario se acaba de ocupar. Elija otro. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:OrderBookingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /diagnostic-results/me/orders/{orderId}/booking-options

- **Origen:** CONTRATO
- **Nombre:** Centers that perform the study of my order
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrderBookingController.bookingOptions` — `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:51`

### Qué es y para qué sirve (negocio)

Centers that perform the study of my order. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/orders/{orderId}/booking-options` la atiende `OrderBookingController.bookingOptions` (src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:51). Exige sesión con alguno de los roles PATIENT. Delega en `GetBookingOptionsUseCase.execute`. Lee clinical.diagnostic_reports, clinical.service_request_components, clinical.service_requests, common.addresses, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings y 15 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: orderId | `src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts:51` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `clinical.service_request_components` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderQuoteService.pricerFor → OrderPatientRepository.orderedComponents | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:109` |
| `clinical.service_requests` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderBookingAccessService.ownOrder → OrderPatientRepository.findDiagnosticOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:70` |
| `common.addresses` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderPatientRepository.homeOf | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:148` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterStudiesRepository.findPublishedByConcept | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:122` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderQuoteService.pricerFor → CenterStudiesRepository.findParts | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:95` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterStudiesRepository.findPublishedByConcept | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:122` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterStudiesRepository.findPublishedByConcept | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:122` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterStudiesRepository.findPublishedByConcept | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:122` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderBookingAccessService.ownOrder → OrderPatientRepository.hasReleasedResult | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:123` |
| `diagnostics.service_request_performer_events` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderBookingAccessService.ownOrder → OrderPatientRepository.findDiagnosticOrder | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:70` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderBookingAccessService.ownOrder → OrderPatientRepository.ownPatientProfileId | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:48` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderBookingAccessService.ownOrder → OrderPatientRepository.ownPatientProfileId | `src/modules/diagnostic_units/center-schedule/infrastructure/order-patient.repository.ts:43` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → GetBookingOptionsUseCase.optionAt → CenterAvailabilityService.startsFor → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → GetBookingOptionsUseCase.optionAt → CenterAvailabilityService.startsFor → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → CenterStudiesRepository.findPublishedByConcept | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:122` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | OrderBookingController.bookingOptions → GetBookingOptionsUseCase.execute → GetBookingOptionsUseCase.options → OrderQuoteService.pricerFor → CenterStudiesRepository.findParts | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:95` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `orderId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OrderBookingOptionsDto>` · DTO `OrderBookingOptionsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:38` |
| `studyCode` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:39` |
| `studyName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:40` |
| `modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:41` |
| `modalityLabel` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:42` |
| `options` | `array<OrderBookingOptionDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:44` |
| `options[].unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:9` |
| `options[].unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:10` |
| `options[].siteId` | `string` | Sí | formato uuid; admite null | — | The site (branch) of this option: each site has its schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:18` |
| `options[].siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:19` |
| `options[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:20` |
| `options[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:21` |
| `options[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:22` |
| `options[].distanceKm` | `number` | Sí | admite null | — | Straight line from the patient home; `null` if a location is missing. | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:29` |
| `options[].nextStartAt` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:30` |
| `options[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:31` |
| `options[].operationalEquipment` | `number` | Sí | — | — | Patients per slot for the modality. | `src/modules/diagnostic_units/center-schedule/presentation/dto/booking-options.dto.ts:33` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden no encontrada; ResourceNotFoundException: Sucursal no encontrada |
| 409 | `CONFLICT` | ConflictException: Esta orden ya tiene su resultado: no hace falta reservar. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Esta orden no es de un estudio que se reserve en un centro. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:OrderBookingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. DELETE /diagnostic-study-offerings/{id}

- **Origen:** CONTRATO
- **Nombre:** Retirar (soft-delete) una oferta de estudio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticPricingController.retireOffering` — `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87`

### Qué es y para qué sirve (negocio)

Retirar (soft-delete) una oferta de estudio. Caso de uso UC-23-08: Retirar (soft-delete) oferta. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostic-study-offerings/{id}` la atiende `DiagnosticPricingController.retireOffering` (src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticStudiesService.retireOffering`. Actualiza diagnostic_units.diagnostic_study_offerings. Lee diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticPricingController.retireOffering → DiagnosticStudiesService.retireOffering | `src/modules/diagnostic_units/services/diagnostic-studies.service.ts:165` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticPricingController.retireOffering → DiagnosticStudiesService.retireOffering → DiagnosticUnitScopeService.offering → DiagnosticStudyOfferingsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:99` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticPricingController.retireOffering → DiagnosticStudiesService.retireOffering → DiagnosticUnitScopeService.offering → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/diagnostic_units/dto/responses.dto.ts:261` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La oferta ya está retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-08`

---

## 9. POST /diagnostic-unit-accreditations/{id}/renew

- **Origen:** CONTRATO
- **Nombre:** Renovar/registrar acreditación con evidencia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitAccreditationsController.renew` — `src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36`

### Qué es y para qué sirve (negocio)

Renovar/registrar acreditación con evidencia. Caso de uso UC-23-11: Renovar acreditación. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-unit-accreditations/{id}/renew` la atiende `DiagnosticUnitAccreditationsController.renew` (src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RenewAccreditationDto` (4 campos, 0 obligatorios). Delega en `DiagnosticUnitsService.renewAccreditation`. Crea filas en diagnostic_units.diagnostic_unit_accreditations. Actualiza diagnostic_units.diagnostic_unit_accreditations. Lee diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_unit_accreditations` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitAccreditationsController.renew → DiagnosticUnitsService.renewAccreditation | `src/modules/diagnostic_units/services/diagnostic-units.service.ts:446` |
| `diagnostic_units.diagnostic_unit_accreditations` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitAccreditationsController.renew → DiagnosticUnitsService.renewAccreditation → DiagnosticUnitAccreditationsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-accreditations.repository.ts:75` |
| `diagnostic_units.diagnostic_unit_accreditations` | LEE | LEE | DIRECTA | DiagnosticUnitAccreditationsController.renew → DiagnosticUnitsService.renewAccreditation → DiagnosticUnitScopeService.accreditation → DiagnosticUnitAccreditationsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-accreditations.repository.ts:61` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitAccreditationsController.renew → DiagnosticUnitsService.renewAccreditation → DiagnosticUnitScopeService.accreditation → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RenewAccreditationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accreditationNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Nuevo nº de acreditación | `src/modules/diagnostic_units/dto/accreditation.dto.ts:96` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nuevo archivo de evidencia | `src/modules/diagnostic_units/dto/accreditation.dto.ts:107` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Nueva vigencia desde | `src/modules/diagnostic_units/dto/accreditation.dto.ts:120` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Nueva vigencia hasta | `src/modules/diagnostic_units/dto/accreditation.dto.ts:133` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "accreditationNumber": "valor-ejemplo",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AccreditationResponseDto>` · DTO `AccreditationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:198` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | sin fuente |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:207` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-11`

---

## 10. PATCH /diagnostic-unit-sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Actualizar un sitio operativo de la unidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitSitesController.updateSite` — `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49`

### Qué es y para qué sirve (negocio)

Actualizar un sitio operativo de la unidad. Caso de uso UC-23-02: Actualizar sitio. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /diagnostic-unit-sites/{siteId}` la atiende `DiagnosticUnitSitesController.updateSite` (src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateSiteDto` (4 campos, 0 obligatorios). Delega en `DiagnosticUnitsService.updateSite`. Actualiza diagnostic_units.diagnostic_unit_sites. Lee diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitSitesController.updateSite → DiagnosticUnitsService.updateSite | `src/modules/diagnostic_units/services/diagnostic-units.service.ts:201` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitSitesController.updateSite → DiagnosticUnitsService.updateSite → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitSitesController.updateSite → DiagnosticUnitsService.updateSite → DiagnosticUnitScopeService.site → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateSiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `siteRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del sitio (concept id) | `src/modules/diagnostic_units/dto/site.dto.ts:70` |
| `accessionPrefix` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Prefijo de accesión | `src/modules/diagnostic_units/dto/site.dto.ts:79` |
| `sampleCollectionAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Toma de muestras disponible | `src/modules/diagnostic_units/dto/site.dto.ts:87` |
| `imagingAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Imagenología disponible | `src/modules/diagnostic_units/dto/site.dto.ts:95` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "siteRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "accessionPrefix": "valor-ejemplo",
  "sampleCollectionAvailable": true,
  "imagingAvailable": true
}
```

</details>

### Respuesta — `Promise<SiteResponseDto>` · DTO `SiteResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:66` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | sin fuente |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | sin fuente |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:78` |
| `operationalStatus` | `string` | Sí | — | — | Valor de operational status mantenido por la instancia. | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-02`

---

## 11. POST /diagnostic-unit-sites/{siteId}/equipment

- **Origen:** CONTRATO
- **Nombre:** Registrar equipamiento y calibración del sitio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitSitesController.addEquipment` — `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67`

### Qué es y para qué sirve (negocio)

Registrar equipamiento y calibración del sitio. Caso de uso UC-23-09: Registrar equipamiento. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-unit-sites/{siteId}/equipment` la atiende `DiagnosticUnitSitesController.addEquipment` (src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateEquipmentDto` (8 campos, 1 obligatorio). Delega en `DiagnosticEquipmentService.addEquipment`. Crea filas en diagnostic_units.diagnostic_equipment. Actualiza diagnostic_units.diagnostic_unit_sites. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment → DiagnosticEquipmentRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:85` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment → DiagnosticEquipmentRepository.findBySerial | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:71` |
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment | `src/modules/diagnostic_units/services/diagnostic-equipment.service.ts:102` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment → DiagnosticUnitScopeService.site → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateEquipmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `equipmentTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de equipo (concept id) | `src/modules/diagnostic_units/dto/equipment.dto.ts:18` |
| `manufacturer` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Fabricante | `src/modules/diagnostic_units/dto/equipment.dto.ts:27` |
| `model` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Modelo | `src/modules/diagnostic_units/dto/equipment.dto.ts:36` |
| `serialNumber` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nº de serie | `src/modules/diagnostic_units/dto/equipment.dto.ts:45` |
| `modalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Modalidad (concept id) | `src/modules/diagnostic_units/dto/equipment.dto.ts:56` |
| `lastCalibrationAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Última calibración | `src/modules/diagnostic_units/dto/equipment.dto.ts:69` |
| `nextCalibrationDueAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Próxima calibración | `src/modules/diagnostic_units/dto/equipment.dto.ts:82` |
| `operationalStatusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado operativo (concept id) | `src/modules/diagnostic_units/dto/equipment.dto.ts:93` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "equipmentTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "equipmentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "manufacturer": "valor-ejemplo",
  "model": "valor-ejemplo",
  "serialNumber": "valor-ejemplo",
  "modalityConceptId": "00000000-0000-4000-8000-000000000001",
  "lastCalibrationAt": "2026-07-31T12:00:00.000Z",
  "nextCalibrationDueAt": "2026-07-31T12:00:00.000Z",
  "operationalStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<EquipmentResponseDto>` · DTO `EquipmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:162` |
| `diagnosticUnitSiteId` | `string` | Sí | formato uuid | — | Identificador asociado a diagnostic unit site. | `src/modules/diagnostic_units/dto/responses.dto.ts:168` |
| `operationalStatus` | `string` | Sí | formato uuid | — | Concept id de estado operativo | `src/modules/diagnostic_units/dto/responses.dto.ts:177` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | F5a: sala del equipo. | `src/modules/diagnostic_units/dto/responses.dto.ts:181` |
| `aeTitle` | `string` | No | admite null | — | F5a: DICOM AE Title. | `src/modules/diagnostic_units/dto/responses.dto.ts:185` |
| `stationName` | `string` | No | admite null | — | F5a: DICOM Station Name. | `src/modules/diagnostic_units/dto/responses.dto.ts:189` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un equipo con ese número de serie en el sitio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sitio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-09`

---

## 12. GET /diagnostic-units

- **Origen:** CONTRATO
- **Nombre:** Listar unidades diagnósticas publicadas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.list` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:86`

### Qué es y para qué sirve (negocio)

Listar unidades diagnósticas publicadas. Caso de uso Directorio P3: Listar unidades activas y verificadas del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units` la atiende `DiagnosticUnitsController.list` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:86). Exige sesión; el controlador no declara roles. Delega en `DiagnosticUnitsReadService.list`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:84` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findActiveOfferings | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:96` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findActiveSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:56` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findVisibleByTenant | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:26` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticUnitDirectoryResponseDto>` · DTO `DiagnosticUnitDirectoryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DiagnosticUnitDirectoryItemDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:48` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:15` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:18` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:21` |
| `items[].type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:24` |
| `items[].type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `items[].type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `items[].siteCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:27` |
| `items[].equipmentCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:30` |
| `items[].studyCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:33` |
| `items[].acceptsExternalOrders` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:36` |
| `items[].walkInAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:39` |
| `items[].homeCollectionAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:42` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:51` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:56` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `Directorio P3`

---

## 13. POST /diagnostic-units

- **Origen:** CONTRATO
- **Nombre:** Alta de unidad diagnóstica con sitios y acreditaciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.create` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:183`

### Qué es y para qué sirve (negocio)

Alta de unidad diagnóstica con sitios y acreditaciones. Caso de uso UC-23-01: Alta de unidad con sitios (1..N) y acreditaciones (0..N). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units` la atiende `DiagnosticUnitsController.create` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:183). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDiagnosticUnitDto` (19 campos, 2 obligatorios). Delega en `DiagnosticUnitsService.create`. Crea filas en diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units. Lee diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:183` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_unit_accreditations` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.create → DiagnosticUnitsService.create → DiagnosticUnitAccreditationsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-accreditations.repository.ts:75` |
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.create → DiagnosticUnitsService.create → DiagnosticUnitSitesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:72` |
| `diagnostic_units.diagnostic_units` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.create → DiagnosticUnitsService.create → DiagnosticUnitsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:83` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.create → DiagnosticUnitsService.create → DiagnosticUnitsRepository.findByCode | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:78` |

### Cuerpo — DTO `CreateDiagnosticUnitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Se ignora como propietario: la unidad pertenece al tenant activo (X-Tenant-Id). Si se envía y no coincide, responde 404. | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:116` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código único de la unidad en el tenant | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:128` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre de la unidad | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:137` |
| `diagnosticUnitTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de unidad (concept id) | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:148` |
| `ownershipTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de propiedad (concept id) | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:159` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Practice asociado | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:167` |
| `primaryPracticeSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio principal del practice | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:178` |
| `acceptsExternalOrders` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Acepta órdenes externas | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:186` |
| `sites` | `array<CreateUnitSiteDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CreateUnitSiteDto)` | Sitios operativos (1..N) | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:199` |
| `sites[].practiceSiteId` | `string` | No | formato uuid | `@IsUUID()` | Sitio del practice donde opera la unidad | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:24` |
| `sites[].siteRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del sitio (concept id) | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:35` |
| `sites[].accessionPrefix` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Prefijo de accesión del sitio | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:47` |
| `sites[].sampleCollectionAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Toma de muestras disponible | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:55` |
| `sites[].imagingAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Imagenología disponible | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:63` |
| `accreditations` | `array<CreateUnitAccreditationDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CreateUnitAccreditationDto)` | Acreditaciones (0..N) | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:212` |
| `accreditations[].accreditationConceptId` | `string` | No | formato uuid | `@IsUUID()` | Tipo de acreditación (concept id) | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:76` |
| `accreditations[].accreditationNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Nº de acreditación | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:85` |
| `accreditations[].issuerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant emisor | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:93` |
| `accreditations[].evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia | `src/modules/diagnostic_units/dto/create-diagnostic-unit.dto.ts:101` |

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
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "diagnosticUnitTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "ownershipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "primaryPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "acceptsExternalOrders": true,
  "sites": [
    {
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "siteRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "accessionPrefix": "valor-ejemplo",
      "sampleCollectionAvailable": true,
      "imagingAvailable": true
    }
  ],
  "accreditations": [
    {
      "accreditationConceptId": "00000000-0000-4000-8000-000000000001",
      "accreditationNumber": "valor-ejemplo",
      "issuerTenantId": "00000000-0000-4000-8000-000000000001",
      "evidenceFileId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<DiagnosticUnitResponseDto>` · DTO `DiagnosticUnitResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:15` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:21` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id de estado de verificación | `src/modules/diagnostic_units/dto/responses.dto.ts:30` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | `src/modules/diagnostic_units/dto/responses.dto.ts:36` |
| `publicProfileId` | `string` | No | formato uuid | — | Perfil público asignado | `src/modules/diagnostic_units/dto/responses.dto.ts:45` |
| `siteCount` | `number` | Sí | — | — | Nº de sitios creados en el alta | `src/modules/diagnostic_units/dto/responses.dto.ts:51` |
| `accreditationCount` | `number` | Sí | — | — | Nº de acreditaciones creadas en el alta | `src/modules/diagnostic_units/dto/responses.dto.ts:57` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada |
| 409 | `CONFLICT` | ConflictException: El código ya existe en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:94` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-01`

---

## 14. GET /diagnostic-units/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil de una unidad diagnóstica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.getById` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153`

### Qué es y para qué sirve (negocio)

Consultar el perfil de una unidad diagnóstica. Caso de uso Directorio P3: Perfil con sedes, equipos, oferta, precios públicos y acreditaciones vigentes. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/{id}` la atiende `DiagnosticUnitsController.getById` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153). Exige sesión; el controlador no declara roles. Delega en `DiagnosticUnitsReadService.getById`. Lee common.addresses, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findAddresses | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:76` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:84` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findActiveOfferings | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:96` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_unit_accreditations` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findCurrentAccreditations | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:142` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findActiveSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:56` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findVisibleById | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:43` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findPracticeSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:161` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticUnitDetailDto>` · DTO `DiagnosticUnitDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:15` |
| `code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:18` |
| `name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:21` |
| `type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:24` |
| `type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `siteCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:27` |
| `equipmentCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:30` |
| `studyCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:33` |
| `acceptsExternalOrders` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:36` |
| `walkInAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:39` |
| `homeCollectionAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:42` |
| `sites` | `array<DiagnosticUnitSiteDetailDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:188` |
| `sites[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:57` |
| `sites[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:60` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:63` |
| `sites[].role` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:66` |
| `sites[].role.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `sites[].role.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `sites[].sampleCollectionAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:69` |
| `sites[].imagingAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:72` |
| `sites[].latitude` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:76` |
| `sites[].longitude` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:80` |
| `equipment` | `array<DiagnosticEquipmentDetailDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:191` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:86` |
| `equipment[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:89` |
| `equipment[].type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:92` |
| `equipment[].type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `equipment[].type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `equipment[].manufacturer` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:95` |
| `equipment[].model` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:98` |
| `equipment[].modality` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:101` |
| `equipment[].modality.code` | `string` | No | — | — | — | sin fuente |
| `equipment[].modality.display` | `string` | No | — | — | — | sin fuente |
| `equipment[].operationalStatus` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:104` |
| `equipment[].operationalStatus.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `equipment[].operationalStatus.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `equipment[].lastCalibrationAt` | `object` | No | formato date-time; admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:107` |
| `equipment[].nextCalibrationDueAt` | `object` | No | formato date-time; admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:110` |
| `studies` | `array<DiagnosticStudyDetailDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:194` |
| `studies[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:131` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:134` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:137` |
| `studies[].description` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:140` |
| `studies[].siteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:143` |
| `studies[].modality` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:146` |
| `studies[].modality.code` | `string` | No | — | — | — | sin fuente |
| `studies[].modality.display` | `string` | No | — | — | — | sin fuente |
| `studies[].preparationInstructions` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:149` |
| `studies[].expectedDurationMinutes` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:152` |
| `studies[].expectedTurnaroundMinutes` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:155` |
| `studies[].requiresMedicalOrder` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:158` |
| `studies[].prices` | `array<DiagnosticPublicPriceDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:161` |
| `studies[].prices[].amount` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:116` |
| `studies[].prices[].currency` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:119` |
| `studies[].prices[].currency.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `studies[].prices[].currency.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `studies[].prices[].scheduleCode` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:122` |
| `studies[].prices[].siteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:125` |
| `accreditations` | `array<DiagnosticAccreditationDetailDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:197` |
| `accreditations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:167` |
| `accreditations[].type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:170` |
| `accreditations[].type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `accreditations[].type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `accreditations[].number` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:173` |
| `accreditations[].siteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:176` |
| `accreditations[].validFrom` | `object` | No | formato date; admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:179` |
| `accreditations[].validTo` | `object` | No | formato date; admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:182` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad diagnóstica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-catalog-import.int-spec.ts:184` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:63` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `Directorio P3`

---

## 15. POST /diagnostic-units/{id}/accreditations

- **Origen:** CONTRATO
- **Nombre:** Registrar una acreditación con evidencia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.addAccreditation` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311`

### Qué es y para qué sirve (negocio)

Registrar una acreditación con evidencia. Caso de uso UC-23-11: Registrar acreditación con evidencia. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/accreditations` la atiende `DiagnosticUnitsController.addAccreditation` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DiagnosticUnitsCreateAccreditationDto` (7 campos, 1 obligatorio). Delega en `DiagnosticUnitsService.addAccreditation`. Crea filas en diagnostic_units.diagnostic_unit_accreditations. Lee diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_unit_accreditations` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.addAccreditation → DiagnosticUnitsService.addAccreditation → DiagnosticUnitAccreditationsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-accreditations.repository.ts:75` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.addAccreditation → DiagnosticUnitsService.addAccreditation → DiagnosticUnitScopeService.siteOfUnit → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.addAccreditation → DiagnosticUnitsService.addAccreditation → DiagnosticUnitsService.loadActiveUnit → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DiagnosticUnitsCreateAccreditationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accreditationConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de acreditación (concept id) | `src/modules/diagnostic_units/dto/accreditation.dto.ts:22` |
| `diagnosticUnitSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de la unidad | `src/modules/diagnostic_units/dto/accreditation.dto.ts:30` |
| `accreditationNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Nº de acreditación | `src/modules/diagnostic_units/dto/accreditation.dto.ts:39` |
| `issuerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant emisor | `src/modules/diagnostic_units/dto/accreditation.dto.ts:47` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia | `src/modules/diagnostic_units/dto/accreditation.dto.ts:55` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Vigente desde | `src/modules/diagnostic_units/dto/accreditation.dto.ts:68` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Vigente hasta | `src/modules/diagnostic_units/dto/accreditation.dto.ts:81` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "accreditationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "accreditationConceptId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "accreditationNumber": "valor-ejemplo",
  "issuerTenantId": "00000000-0000-4000-8000-000000000001",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AccreditationResponseDto>` · DTO `AccreditationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:198` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | sin fuente |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:207` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:160` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-11`

---

## 16. GET /diagnostic-units/{id}/administration

- **Origen:** CONTRATO
- **Nombre:** Consola de administración de una unidad diagnóstica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.getForAdministration` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170`

### Qué es y para qué sirve (negocio)

Consola de administración de una unidad diagnóstica. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/{id}/administration` la atiende `DiagnosticUnitsController.getForAdministration` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsAdminReadService.getById`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_practitioner_assignments, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:84` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findPriceSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:109` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findOfferings | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:97` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:122` |
| `diagnostic_units.diagnostic_unit_accreditations` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findAccreditations | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:134` |
| `diagnostic_units.diagnostic_unit_practitioner_assignments` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findPractitionerAssignments | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:146` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findSites | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:71` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:62` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findPracticeSites | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:174` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findRoleAssignments | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:165` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getForAdministration → DiagnosticUnitsAdminReadService.getById → DiagnosticUnitsAdminReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:191` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticUnitAdminDetailDto>` · DTO `DiagnosticUnitAdminDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:14` |
| `code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:17` |
| `name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:20` |
| `type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:23` |
| `type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `status` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:26` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `verificationStatus` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:30` |
| `verificationStatus.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `verificationStatus.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `publiclyListed` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:39` |
| `siteCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:42` |
| `studyCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:45` |
| `equipmentCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:48` |
| `acceptsExternalOrders` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:52` |
| `walkInAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:55` |
| `homeCollectionAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:59` |
| `sites` | `array<DiagnosticUnitAdminSiteDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:345` |
| `sites[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:75` |
| `sites[].practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:78` |
| `sites[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:81` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:84` |
| `sites[].role` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:87` |
| `sites[].role.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `sites[].role.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `sites[].accessionPrefix` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:90` |
| `sites[].sampleCollectionAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:94` |
| `sites[].imagingAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:97` |
| `sites[].status` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:100` |
| `sites[].status.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `sites[].status.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `equipment` | `array<DiagnosticUnitAdminEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:349` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:106` |
| `equipment[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:109` |
| `equipment[].type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:112` |
| `equipment[].type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `equipment[].type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `equipment[].manufacturer` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:115` |
| `equipment[].model` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:118` |
| `equipment[].serialNumber` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:121` |
| `equipment[].modality` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:125` |
| `equipment[].modality.code` | `string` | No | — | — | — | sin fuente |
| `equipment[].modality.display` | `string` | No | — | — | — | sin fuente |
| `equipment[].operationalStatus` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:129` |
| `equipment[].operationalStatus.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `equipment[].operationalStatus.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `equipment[].lastCalibrationAt` | `object` | No | formato date-time; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:133` |
| `equipment[].nextCalibrationDueAt` | `object` | No | formato date-time; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:137` |
| `equipment[].daysToCalibration` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:147` |
| `studies` | `array<DiagnosticUnitAdminStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:353` |
| `studies[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:194` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:197` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:200` |
| `studies[].description` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:203` |
| `studies[].siteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:207` |
| `studies[].modality` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:211` |
| `studies[].modality.code` | `string` | No | — | — | — | sin fuente |
| `studies[].modality.display` | `string` | No | — | — | — | sin fuente |
| `studies[].specimenType` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:215` |
| `studies[].specimenType.code` | `string` | No | — | — | — | sin fuente |
| `studies[].specimenType.display` | `string` | No | — | — | — | sin fuente |
| `studies[].preparationInstructions` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:219` |
| `studies[].expectedDurationMinutes` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:223` |
| `studies[].expectedTurnaroundMinutes` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:227` |
| `studies[].requiresMedicalOrder` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:230` |
| `studies[].requiresPriorAuthorization` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:235` |
| `studies[].homeCollectionEligible` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:239` |
| `studies[].status` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:242` |
| `studies[].status.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `studies[].status.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `studies[].prices` | `array<DiagnosticUnitAdminPriceDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:246` |
| `studies[].prices[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:153` |
| `studies[].prices[].scheduleId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:156` |
| `studies[].prices[].scheduleCode` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:159` |
| `studies[].prices[].schedulePublic` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:162` |
| `studies[].prices[].versionNumber` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:165` |
| `studies[].prices[].baseAmount` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:168` |
| `studies[].prices[].patientAmount` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:171` |
| `studies[].prices[].insurerAmount` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:174` |
| `studies[].prices[].currency` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:178` |
| `studies[].prices[].currency.code` | `string` | No | — | — | — | sin fuente |
| `studies[].prices[].currency.display` | `string` | No | — | — | — | sin fuente |
| `studies[].prices[].effectiveFrom` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:181` |
| `studies[].prices[].effectiveTo` | `object` | No | formato date-time; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:185` |
| `studies[].prices[].status` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:188` |
| `studies[].prices[].status.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `studies[].prices[].status.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `accreditations` | `array<DiagnosticUnitAdminAccreditationDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:357` |
| `accreditations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:252` |
| `accreditations[].siteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:256` |
| `accreditations[].type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:259` |
| `accreditations[].type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `accreditations[].type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `accreditations[].number` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:262` |
| `accreditations[].evidenceFileId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:266` |
| `accreditations[].validFrom` | `object` | No | formato date; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:270` |
| `accreditations[].validTo` | `object` | No | formato date; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:274` |
| `accreditations[].daysToExpiry` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:277` |
| `accreditations[].verificationStatus` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:281` |
| `accreditations[].verificationStatus.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `accreditations[].verificationStatus.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `staff` | `array<DiagnosticUnitAdminStaffDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:361` |
| `staff[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:287` |
| `staff[].practitionerRoleAssignmentId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:290` |
| `staff[].practitionerProfileId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:294` |
| `staff[].practitionerName` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:297` |
| `staff[].siteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:301` |
| `staff[].assignmentRole` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:305` |
| `staff[].assignmentRole.code` | `string` | No | — | — | — | sin fuente |
| `staff[].assignmentRole.display` | `string` | No | — | — | — | sin fuente |
| `staff[].specialty` | `DiagnosticConceptDto` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:309` |
| `staff[].specialty.code` | `string` | No | — | — | — | sin fuente |
| `staff[].specialty.display` | `string` | No | — | — | — | sin fuente |
| `staff[].mayValidateResults` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:318` |
| `staff[].maySignReports` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:321` |
| `staff[].validFrom` | `object` | No | formato date; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:325` |
| `staff[].validTo` | `object` | No | formato date; admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:329` |
| `staff[].status` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:332` |
| `staff[].status.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `staff[].status.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad diagnóstica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:83` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:DiagnosticUnitsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /diagnostic-units/{id}/practitioner-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar un especialista a la unidad/sitio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.assignPractitioner` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293`

### Qué es y para qué sirve (negocio)

Asignar un especialista a la unidad/sitio. Caso de uso UC-23-10: Asignar especialista. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/practitioner-assignments` la atiende `DiagnosticUnitsController.assignPractitioner` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerAssignmentDto` (8 campos, 1 obligatorio). Delega en `DiagnosticUnitsService.assignPractitioner`. Crea filas en diagnostic_units.diagnostic_unit_practitioner_assignments, diagnostic_units.diagnostic_unit_specialties. Lee diagnostic_units.diagnostic_unit_practitioner_assignments, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_unit_specialties, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_unit_practitioner_assignments` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.assignPractitioner → DiagnosticUnitsService.assignPractitioner → DiagnosticUnitPractitionerAssignmentsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-practitioner-assignments.repository.ts:95` |
| `diagnostic_units.diagnostic_unit_practitioner_assignments` | LEE | LEE | DIRECTA | DiagnosticUnitsController.assignPractitioner → DiagnosticUnitsService.assignPractitioner → DiagnosticUnitPractitionerAssignmentsRepository.findActiveOverlap | `src/modules/diagnostic_units/repositories/diagnostic-unit-practitioner-assignments.repository.ts:75` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.assignPractitioner → DiagnosticUnitsService.assignPractitioner → DiagnosticUnitScopeService.siteOfUnit → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_unit_specialties` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.assignPractitioner → DiagnosticUnitsService.assignPractitioner → DiagnosticUnitSpecialtiesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-specialties.repository.ts:73` |
| `diagnostic_units.diagnostic_unit_specialties` | LEE | LEE | DIRECTA | DiagnosticUnitsController.assignPractitioner → DiagnosticUnitsService.assignPractitioner → DiagnosticUnitSpecialtiesRepository.findOpenByConcept | `src/modules/diagnostic_units/repositories/diagnostic-unit-specialties.repository.ts:55` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.assignPractitioner → DiagnosticUnitsService.assignPractitioner → DiagnosticUnitsService.loadActiveUnit → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePractitionerAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerRoleAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Asignación de rol del profesional (RRHH) | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:15` |
| `diagnosticUnitSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de la unidad | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:23` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Especialidad aportada (concept id) | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:34` |
| `assignmentRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol de la asignación (concept id) | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:45` |
| `mayValidateResults` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Puede validar resultados | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:53` |
| `maySignReports` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Puede firmar informes | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:61` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Vigente desde | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:74` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Vigente hasta | `src/modules/diagnostic_units/dto/create-practitioner-assignment.dto.ts:87` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "assignmentRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "mayValidateResults": true,
  "maySignReports": true,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AssignmentResponseDto>` · DTO `AssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:216` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | `src/modules/diagnostic_units/dto/responses.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El profesional ya tiene una asignación activa en ese rol/sitio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:149` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-10`

---

## 18. POST /diagnostic-units/{id}/price-schedules

- **Origen:** CONTRATO
- **Nombre:** Crear un cronograma de precios
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.createSchedule` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275`

### Qué es y para qué sirve (negocio)

Crear un cronograma de precios. Caso de uso UC-23-06: Crear cronograma de precios. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/price-schedules` la atiende `DiagnosticUnitsController.createSchedule` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePriceScheduleDto` (9 campos, 1 obligatorio). Delega en `DiagnosticPricingService.createSchedule`. Crea filas en diagnostic_units.diagnostic_price_schedules. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.createSchedule → DiagnosticPricingService.createSchedule → DiagnosticPriceSchedulesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:92` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticUnitsController.createSchedule → DiagnosticPricingService.createSchedule → DiagnosticPriceSchedulesRepository.findByCode | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:78` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.createSchedule → DiagnosticPricingService.createSchedule → DiagnosticUnitScopeService.siteOfUnit → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.createSchedule → DiagnosticPricingService.createSchedule → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePriceScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código único del cronograma en la unidad | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:25` |
| `priceScheduleTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de cronograma (concept id) | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:36` |
| `diagnosticUnitSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de la unidad | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:44` |
| `insurerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant aseguradora | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:52` |
| `brokerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant broker | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:60` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Moneda (concept id) | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:68` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Vigente desde | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:81` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Vigente hasta | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:94` |
| `publicVisibility` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Visible al público | `src/modules/diagnostic_units/dto/create-price-schedule.dto.ts:102` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "priceScheduleTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "insurerTenantId": "00000000-0000-4000-8000-000000000001",
  "brokerTenantId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "publicVisibility": true
}
```

</details>

### Respuesta — `Promise<PriceScheduleResponseDto>` · DTO `PriceScheduleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:114` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:120` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | `src/modules/diagnostic_units/dto/responses.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El código de cronograma ya existe en la unidad |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:138` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-06`

---

## 19. POST /diagnostic-units/{id}/reproject

- **Origen:** CONTRATO
- **Nombre:** Reconstruir la proyección del perfil público
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.reproject` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329`

### Qué es y para qué sirve (negocio)

Reconstruir la proyección del perfil público. Caso de uso UC-23-12: Reconstruir proyección del perfil público. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:70`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/reproject` la atiende `DiagnosticUnitsController.reproject` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsService.reproject`. Lee diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.reproject → DiagnosticUnitsService.reproject → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReprojectResultDto>` · DTO `ReprojectResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `diagnosticUnitId` | `string` | Sí | formato uuid | — | Identificador asociado a diagnostic unit. | `src/modules/diagnostic_units/dto/responses.dto.ts:246` |
| `projected` | `boolean` | Sí | — | — | true si se (re)proyectó el perfil público | `src/modules/diagnostic_units/dto/responses.dto.ts:252` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:170` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-12`

---

## 20. POST /diagnostic-units/{id}/sites

- **Origen:** CONTRATO
- **Nombre:** Registrar un sitio operativo de la unidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.addSite` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202`

### Qué es y para qué sirve (negocio)

Registrar un sitio operativo de la unidad. Caso de uso UC-23-02: Registrar sitio operativo. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/sites` la atiende `DiagnosticUnitsController.addSite` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AddSiteDto` (5 campos, 1 obligatorio). Delega en `DiagnosticUnitsService.addSite`. Crea filas en diagnostic_units.diagnostic_unit_sites. Lee diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.addSite → DiagnosticUnitsService.addSite → DiagnosticUnitSitesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:72` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.addSite → DiagnosticUnitsService.addSite → DiagnosticUnitsService.loadActiveUnit → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AddSiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sitio del practice donde opera la unidad | `src/modules/diagnostic_units/dto/site.dto.ts:20` |
| `siteRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del sitio (concept id) | `src/modules/diagnostic_units/dto/site.dto.ts:31` |
| `accessionPrefix` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Prefijo de accesión | `src/modules/diagnostic_units/dto/site.dto.ts:40` |
| `sampleCollectionAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Toma de muestras disponible | `src/modules/diagnostic_units/dto/site.dto.ts:48` |
| `imagingAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Imagenología disponible | `src/modules/diagnostic_units/dto/site.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "siteRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "accessionPrefix": "valor-ejemplo",
  "sampleCollectionAvailable": true,
  "imagingAvailable": true
}
```

</details>

### Respuesta — `Promise<SiteResponseDto>` · DTO `SiteResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:66` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | sin fuente |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | sin fuente |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:78` |
| `operationalStatus` | `string` | Sí | — | — | Valor de operational status mantenido por la instancia. | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:103` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-02`

---

## 21. PUT /diagnostic-units/{id}/specialties

- **Origen:** CONTRATO
- **Nombre:** Declarar las especialidades de la unidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.setSpecialties` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237`

### Qué es y para qué sirve (negocio)

Declarar las especialidades de la unidad. Caso de uso UC-23-04: Declarar especialidades (upsert + soft-close). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostic-units/{id}/specialties` la atiende `DiagnosticUnitsController.setSpecialties` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SetSpecialtiesDto` (3 campos, 2 obligatorios). Delega en `DiagnosticUnitsService.setSpecialties`. Crea filas en diagnostic_units.diagnostic_unit_specialties. Actualiza diagnostic_units.diagnostic_unit_specialties. Lee diagnostic_units.diagnostic_unit_specialties, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_unit_specialties` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitsController.setSpecialties → DiagnosticUnitsService.setSpecialties | `src/modules/diagnostic_units/services/diagnostic-units.service.ts:304` |
| `diagnostic_units.diagnostic_unit_specialties` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.setSpecialties → DiagnosticUnitsService.setSpecialties → DiagnosticUnitSpecialtiesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-specialties.repository.ts:73` |
| `diagnostic_units.diagnostic_unit_specialties` | LEE | LEE | DIRECTA | DiagnosticUnitsController.setSpecialties → DiagnosticUnitsService.setSpecialties → DiagnosticUnitSpecialtiesRepository.findOpenForUnit | `src/modules/diagnostic_units/repositories/diagnostic-unit-specialties.repository.ts:43` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.setSpecialties → DiagnosticUnitsService.setSpecialties → DiagnosticUnitsService.loadActiveUnit → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SetSpecialtiesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specialties` | `array<SpecialtyItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => SpecialtyItemDto)` | Conjunto vigente de especialidades | `src/modules/diagnostic_units/dto/specialties.dto.ts:43` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Especialidad (concept id) | `src/modules/diagnostic_units/dto/specialties.dto.ts:19` |
| `specialties[].isPrimary` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Especialidad primaria de la unidad | `src/modules/diagnostic_units/dto/specialties.dto.ts:27` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "specialties": [
    {
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "specialties": [
    {
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "isPrimary": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<SpecialtiesResultDto>` · DTO `SpecialtiesResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `active` | `number` | Sí | — | — | Nº de especialidades vigentes tras el cambio | `src/modules/diagnostic_units/dto/responses.dto.ts:231` |
| `closed` | `number` | Sí | — | — | Nº de especialidades cerradas (soft) | `src/modules/diagnostic_units/dto/responses.dto.ts:237` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: A lo sumo una especialidad puede ser primaria; PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:116` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-04`

---

## 22. POST /diagnostic-units/{id}/study-offerings

- **Origen:** CONTRATO
- **Nombre:** Publicar oferta de estudio con componentes (panel)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.createOffering` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255`

### Qué es y para qué sirve (negocio)

Publicar oferta de estudio con componentes (panel). Caso de uso UC-23-05: Publicar oferta con componentes (panel). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/study-offerings` la atiende `DiagnosticUnitsController.createOffering` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateStudyOfferingDto` (19 campos, 3 obligatorios). Delega en `DiagnosticStudiesService.createOffering`. Crea filas en diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings. Lee diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_study_components` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticStudyComponentsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-components.repository.ts:52` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:125` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticStudyOfferingsRepository.findByStudyCode | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:108` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticUnitScopeService.siteOfUnit → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateStudyOfferingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `studyCode` | `string` | Sí | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código del estudio en la unidad | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:69` |
| `studyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Estudio (concept id) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:76` |
| `displayName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre visible del estudio | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:85` |
| `diagnosticUnitSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de la unidad donde se ofrece | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:96` |
| `modalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Modalidad (concept id) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:107` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Zona anatómica (concept id) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:118` |
| `specimenTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de muestra (concept id) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:129` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | Descripción | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:137` |
| `preparationInstructions` | `string` | No | — | `@IsOptional()` `@IsString()` | Instrucciones de preparación | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:145` |
| `expectedDurationMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Duración esperada (min) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:154` |
| `expectedTurnaroundMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Turnaround esperado (min) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:163` |
| `requiresMedicalOrder` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere orden médica | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:171` |
| `requiresPriorAuthorization` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere autorización previa | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:179` |
| `homeCollectionEligible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Elegible para toma domiciliaria | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:187` |
| `components` | `array<StudyComponentDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => StudyComponentDto)` | Componentes del panel (0..N) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:200` |
| `components[].componentOfferingId` | `string` | No | formato uuid | `@IsUUID()` | Oferta que actúa como componente | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:26` |
| `components[].componentRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del componente (concept id) | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:37` |
| `components[].quantity` | `string` | No | — | `@IsOptional()` `@IsString()` | Cantidad | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:45` |
| `components[].ordinal` | `number` | No | — | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden en el panel | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:54` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "studyCode": "CODIGO_EJEMPLO",
  "studyConceptId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "studyCode": "CODIGO_EJEMPLO",
  "studyConceptId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "modalityConceptId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "preparationInstructions": "valor-ejemplo",
  "expectedDurationMinutes": 1,
  "expectedTurnaroundMinutes": 1,
  "requiresMedicalOrder": true,
  "requiresPriorAuthorization": true,
  "homeCollectionEligible": true,
  "components": [
    {
      "componentOfferingId": "00000000-0000-4000-8000-000000000001",
      "componentRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "quantity": "1",
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<StudyOfferingResponseDto>` · DTO `StudyOfferingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:87` |
| `studyCode` | `string` | Sí | — | — | Valor de study code mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:93` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | `src/modules/diagnostic_units/dto/responses.dto.ts:99` |
| `componentCount` | `number` | Sí | — | — | Nº de componentes del panel | `src/modules/diagnostic_units/dto/responses.dto.ts:105` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El código de estudio ya existe en la unidad |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa; PreconditionFailedException: Un panel no puede referenciarse a sí mismo como componente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:127` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-05`

---

## 23. POST /diagnostic-units/{id}/verify-and-publish

- **Origen:** CONTRATO
- **Nombre:** Verificar la unidad y publicar su perfil público
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.verifyAndPublish` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220`

### Qué es y para qué sirve (negocio)

Verificar la unidad y publicar su perfil público. Caso de uso UC-23-03: Verificar y publicar perfil público. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/verify-and-publish` la atiende `DiagnosticUnitsController.verifyAndPublish` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsService.verifyAndPublish`. Crea filas en community.public_profiles. Actualiza community.public_profiles, diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_specialties, diagnostic_units.diagnostic_units. Lee community.public_profiles, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:390` |
| `community.public_profiles` | LEE | LEE | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:348` |
| `diagnostic_units.diagnostic_unit_accreditations` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → DiagnosticUnitAccreditationsRepository.verifyOpenForUnit | `src/modules/diagnostic_units/repositories/diagnostic-unit-accreditations.repository.ts:98` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → DiagnosticUnitSitesRepository.countActiveForUnit | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:58` |
| `diagnostic_units.diagnostic_unit_specialties` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → DiagnosticUnitSpecialtiesRepository.verifyOpenForUnit | `src/modules/diagnostic_units/repositories/diagnostic-unit-specialties.repository.ts:93` |
| `diagnostic_units.diagnostic_units` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish | `src/modules/diagnostic_units/services/diagnostic-units.service.ts:248` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → DiagnosticUnitsService.loadActiveUnit → DiagnosticUnitScopeService.unit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → DiagnosticUnitsService.assertLaboratoryMayOperate | `src/modules/diagnostic_units/services/diagnostic-units.service.ts:512` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticUnitResponseDto>` · DTO `DiagnosticUnitResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:15` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:21` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id de estado de verificación | `src/modules/diagnostic_units/dto/responses.dto.ts:30` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | `src/modules/diagnostic_units/dto/responses.dto.ts:36` |
| `publicProfileId` | `string` | No | formato uuid | — | Perfil público asignado | `src/modules/diagnostic_units/dto/responses.dto.ts:45` |
| `siteCount` | `number` | Sí | — | — | Nº de sitios creados en el alta | `src/modules/diagnostic_units/dto/responses.dto.ts:51` |
| `accreditationCount` | `number` | Sí | — | — | Nº de acreditaciones creadas en el alta | `src/modules/diagnostic_units/dto/responses.dto.ts:57` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa; PreconditionFailedException: La unidad no tiene ningún sitio activo para publicar; PreconditionFailedException: El laboratorio no se publica hasta que la plataforma verifique a su organización con la matrícula del SEPREC, la licencia de funcionamiento y el certificado del SEDES |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/laboratory-registration.int-spec.ts:540` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:109` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-03`

---

## 24. POST /diagnostic-units/{unitId}/equipment

- **Origen:** CONTRATO
- **Nombre:** Register a device (a production line)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.addEquipment` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:131`

### Qué es y para qué sirve (negocio)

Register a device (a production line). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{unitId}/equipment` la atiende `CenterScheduleController.addEquipment` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:131). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CenterEquipmentInputDto` (4 campos, 1 obligatorio). Delega en `ManageCenterEquipmentUseCase.create`. Crea filas en diagnostic_units.diagnostic_equipment. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, scheduling.appointment_bookings, scheduling.bookable_slots y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: unitId | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | ESCRIBE | CREA | DIRECTA | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:76` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:69` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → GetCenterScheduleUseCase.staffUnit → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.addEquipment → ManageCenterEquipmentUseCase.create → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unitId` | path | Sí | `string` | — |
| `siteId` | query | No | `string` | `diagnostic_unit_sites.id`; absent, the main site. |

### Cuerpo — DTO `CenterEquipmentInputDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:20` |
| `manufacturer` | `string` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:26` |
| `serialNumber` | `string` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:32` |
| `modalityCode` | `string` | No | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | `@IsOptional()` `@IsIn(MODALITY_CODES)` | `null`: an analyzer, which never limits appointments. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Ecógrafo sala 2"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Ecógrafo sala 2",
  "manufacturer": "valor-ejemplo",
  "serialNumber": "valor-ejemplo",
  "modalityCode": "ECO"
}
```

</details>

### Respuesta — `Promise<CenterScheduleViewDto>` · DTO `CenterScheduleViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:52` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:53` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | The site this schedule and equipment belong to. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:60` |
| `siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:61` |
| `sites` | `array<CenterSiteDto>` | Sí | — | — | Main site first. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:63` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | `diagnostic_unit_sites.id`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:43` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:44` |
| `sites[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:45` |
| `sites[].main` | `boolean` | Sí | — | — | The main site: the one used without `siteId`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:47` |
| `kind` | `string` | Sí | valores: LABORATORY, IMAGING | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:65` |
| `schedule` | `SaveCenterScheduleDto` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:67` |
| `schedule.general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `schedule.general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `schedule.modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `schedule.modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `schedule.modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `schedule.studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `schedule.studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `schedule.studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `schedule.equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `schedule.equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `schedule.equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<CenterStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:68` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:11` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:12` |
| `studies[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:13` |
| `studies[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:14` |
| `studies[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:16` |
| `studies[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:17` |
| `equipment` | `array<CenterEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:69` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:21` |
| `equipment[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:22` |
| `equipment[].manufacturer` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:23` |
| `equipment[].model` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:24` |
| `equipment[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | — | `null`: does not limit appointments (an analyzer). | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:30` |
| `equipment[].status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:31` |
| `equipment[].glossaryConceptId` | `string` | Sí | admite null | — | Always `null` for now. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:37` |
| `updatedAt` | `string` | Sí | admite null | — | `null` while the center has never published a schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:75` |
| `bookingsWithoutEquipment` | `number` | No | — | — | Future bookings left without an operational device. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:79` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada; ResourceNotFoundException: Sucursal no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El centro no tiene una sucursal activa donde registrar el equipo.; PreconditionFailedException: El catálogo todavía no tiene un tipo de equipo para esa modalidad. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. DELETE /diagnostic-units/{unitId}/equipment/{equipmentId}

- **Origen:** CONTRATO
- **Nombre:** Remove a device registered by mistake
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.removeEquipment` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:165`

### Qué es y para qué sirve (negocio)

Remove a device registered by mistake. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostic-units/{unitId}/equipment/{equipmentId}` la atiende `CenterScheduleController.removeEquipment` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:165). Exige sesión; el controlador no declara roles. Delega en `ManageCenterEquipmentUseCase.remove`. Borra de diagnostic_units.diagnostic_equipment. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, scheduling.appointment_bookings, scheduling.bookable_slots y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:165` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: unitId, equipmentId | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:165` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | BORRA | BORRA | POR_TIPO | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:131` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → ManageCenterEquipmentUseCase.ownDevice | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:175` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → ManageCenterEquipmentUseCase.ownDevice | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:179` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → GetCenterScheduleUseCase.staffUnit → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.removeEquipment → ManageCenterEquipmentUseCase.remove → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unitId` | path | Sí | `string` | — |
| `equipmentId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CenterScheduleViewDto>` · DTO `CenterScheduleViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:52` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:53` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | The site this schedule and equipment belong to. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:60` |
| `siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:61` |
| `sites` | `array<CenterSiteDto>` | Sí | — | — | Main site first. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:63` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | `diagnostic_unit_sites.id`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:43` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:44` |
| `sites[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:45` |
| `sites[].main` | `boolean` | Sí | — | — | The main site: the one used without `siteId`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:47` |
| `kind` | `string` | Sí | valores: LABORATORY, IMAGING | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:65` |
| `schedule` | `SaveCenterScheduleDto` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:67` |
| `schedule.general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `schedule.general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `schedule.modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `schedule.modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `schedule.modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `schedule.studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `schedule.studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `schedule.studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `schedule.equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `schedule.equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `schedule.equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<CenterStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:68` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:11` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:12` |
| `studies[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:13` |
| `studies[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:14` |
| `studies[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:16` |
| `studies[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:17` |
| `equipment` | `array<CenterEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:69` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:21` |
| `equipment[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:22` |
| `equipment[].manufacturer` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:23` |
| `equipment[].model` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:24` |
| `equipment[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | — | `null`: does not limit appointments (an analyzer). | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:30` |
| `equipment[].status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:31` |
| `equipment[].glossaryConceptId` | `string` | Sí | admite null | — | Always `null` for now. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:37` |
| `updatedAt` | `string` | Sí | admite null | — | `null` while the center has never published a schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:75` |
| `bookingsWithoutEquipment` | `number` | No | — | — | Future bookings left without an operational device. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:79` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada; ResourceNotFoundException: Equipo no encontrado; ResourceNotFoundException: Sucursal no encontrada |
| 409 | `CONFLICT` | ConflictException: El equipo ya tiene registros asociados: márquelo «Fuera de servicio» en lugar de quitarlo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. PATCH /diagnostic-units/{unitId}/equipment/{equipmentId}

- **Origen:** CONTRATO
- **Nombre:** Mark a device operational or not
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.setEquipmentStatus` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:114`

### Qué es y para qué sirve (negocio)

Mark a device operational or not. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /diagnostic-units/{unitId}/equipment/{equipmentId}` la atiende `CenterScheduleController.setEquipmentStatus` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:114). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SetEquipmentStatusDto` (1 campo, 1 obligatorio). Delega en `SetEquipmentStatusUseCase.execute`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza diagnostic_units.diagnostic_equipment. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, messaging.outbox_messages, scheduling.appointment_bookings y 5 más. Publica diagnostic_units.equipment.located, diagnostic_units.equipment.status_changed.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: unitId, equipmentId | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:114` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | ESCRIBE | ACTUALIZA | POR_TIPO | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute | `src/modules/diagnostic_units/center-schedule/application/set-equipment-status.use-case.ts:62` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute | `src/modules/diagnostic_units/center-schedule/application/set-equipment-status.use-case.ts:43` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute | `src/modules/diagnostic_units/center-schedule/application/set-equipment-status.use-case.ts:47` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → GetCenterScheduleUseCase.staffUnit → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → EquipmentF5aService.announceChanges → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → EquipmentF5aService.announceChanges → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → EquipmentF5aService.announceChanges → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.setEquipmentStatus → SetEquipmentStatusUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `diagnostic_units.equipment.located` | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:229` |
| Evento de dominio | `diagnostic_units.equipment.status_changed` | `src/modules/diagnostic_units/services/equipment-f5a.service.ts:242` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unitId` | path | Sí | `string` | — |
| `equipmentId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetEquipmentStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | `@IsIn(EQUIPMENT_STATUSES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/equipment-status.dto.ts:12` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "OPERATIONAL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "OPERATIONAL"
}
```

</details>

### Respuesta — `Promise<CenterScheduleViewDto>` · DTO `CenterScheduleViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:52` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:53` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | The site this schedule and equipment belong to. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:60` |
| `siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:61` |
| `sites` | `array<CenterSiteDto>` | Sí | — | — | Main site first. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:63` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | `diagnostic_unit_sites.id`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:43` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:44` |
| `sites[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:45` |
| `sites[].main` | `boolean` | Sí | — | — | The main site: the one used without `siteId`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:47` |
| `kind` | `string` | Sí | valores: LABORATORY, IMAGING | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:65` |
| `schedule` | `SaveCenterScheduleDto` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:67` |
| `schedule.general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `schedule.general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `schedule.modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `schedule.modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `schedule.modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `schedule.studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `schedule.studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `schedule.studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `schedule.equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `schedule.equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `schedule.equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<CenterStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:68` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:11` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:12` |
| `studies[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:13` |
| `studies[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:14` |
| `studies[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:16` |
| `studies[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:17` |
| `equipment` | `array<CenterEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:69` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:21` |
| `equipment[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:22` |
| `equipment[].manufacturer` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:23` |
| `equipment[].model` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:24` |
| `equipment[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | — | `null`: does not limit appointments (an analyzer). | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:30` |
| `equipment[].status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:31` |
| `equipment[].glossaryConceptId` | `string` | Sí | admite null | — | Always `null` for now. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:37` |
| `updatedAt` | `string` | Sí | admite null | — | `null` while the center has never published a schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:75` |
| `bookingsWithoutEquipment` | `number` | No | — | — | Future bookings left without an operational device. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:79` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada; ResourceNotFoundException: Equipo no encontrado; ResourceNotFoundException: Sucursal no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. PUT /diagnostic-units/{unitId}/equipment/{equipmentId}

- **Origen:** CONTRATO
- **Nombre:** Edit a device: name, maker, serial, modality
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.editEquipment` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:148`

### Qué es y para qué sirve (negocio)

Edit a device: name, maker, serial, modality. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostic-units/{unitId}/equipment/{equipmentId}` la atiende `CenterScheduleController.editEquipment` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:148). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CenterEquipmentInputDto` (4 campos, 1 obligatorio). Delega en `ManageCenterEquipmentUseCase.update`. Actualiza diagnostic_units.diagnostic_equipment. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, scheduling.appointment_bookings, scheduling.bookable_slots y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: unitId, equipmentId | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:148` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | ESCRIBE | ACTUALIZA | POR_TIPO | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:108` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → ManageCenterEquipmentUseCase.ownDevice | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:175` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → ManageCenterEquipmentUseCase.ownDevice | `src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts:179` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → GetCenterScheduleUseCase.staffUnit → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.editEquipment → ManageCenterEquipmentUseCase.update → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unitId` | path | Sí | `string` | — |
| `equipmentId` | path | Sí | `string` | — |

### Cuerpo — DTO `CenterEquipmentInputDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:20` |
| `manufacturer` | `string` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:26` |
| `serialNumber` | `string` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:32` |
| `modalityCode` | `string` | No | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | `@IsOptional()` `@IsIn(MODALITY_CODES)` | `null`: an analyzer, which never limits appointments. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-equipment.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Ecógrafo sala 2"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Ecógrafo sala 2",
  "manufacturer": "valor-ejemplo",
  "serialNumber": "valor-ejemplo",
  "modalityCode": "ECO"
}
```

</details>

### Respuesta — `Promise<CenterScheduleViewDto>` · DTO `CenterScheduleViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:52` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:53` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | The site this schedule and equipment belong to. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:60` |
| `siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:61` |
| `sites` | `array<CenterSiteDto>` | Sí | — | — | Main site first. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:63` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | `diagnostic_unit_sites.id`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:43` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:44` |
| `sites[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:45` |
| `sites[].main` | `boolean` | Sí | — | — | The main site: the one used without `siteId`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:47` |
| `kind` | `string` | Sí | valores: LABORATORY, IMAGING | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:65` |
| `schedule` | `SaveCenterScheduleDto` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:67` |
| `schedule.general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `schedule.general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `schedule.modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `schedule.modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `schedule.modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `schedule.studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `schedule.studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `schedule.studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `schedule.equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `schedule.equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `schedule.equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<CenterStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:68` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:11` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:12` |
| `studies[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:13` |
| `studies[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:14` |
| `studies[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:16` |
| `studies[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:17` |
| `equipment` | `array<CenterEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:69` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:21` |
| `equipment[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:22` |
| `equipment[].manufacturer` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:23` |
| `equipment[].model` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:24` |
| `equipment[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | — | `null`: does not limit appointments (an analyzer). | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:30` |
| `equipment[].status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:31` |
| `equipment[].glossaryConceptId` | `string` | Sí | admite null | — | Always `null` for now. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:37` |
| `updatedAt` | `string` | Sí | admite null | — | `null` while the center has never published a schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:75` |
| `bookingsWithoutEquipment` | `number` | No | — | — | Future bookings left without an operational device. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:79` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada; ResourceNotFoundException: Equipo no encontrado; ResourceNotFoundException: Sucursal no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo todavía no tiene un tipo de equipo para esa modalidad. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. GET /diagnostic-units/{unitId}/schedule

- **Origen:** CONTRATO
- **Nombre:** Schedule, studies and equipment of a center
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.schedule` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:83`

### Qué es y para qué sirve (negocio)

Schedule, studies and equipment of a center. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/{unitId}/schedule` la atiende `CenterScheduleController.schedule` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:83). Exige sesión; el controlador no declara roles. Delega en `GetCenterScheduleUseCase.forUnit`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, scheduling.appointment_bookings, scheduling.bookable_slots y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: unitId | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:83` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → GetCenterScheduleUseCase.staffUnit → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.schedule → GetCenterScheduleUseCase.forUnit → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unitId` | path | Sí | `string` | — |
| `siteId` | query | No | `string` | `diagnostic_unit_sites.id`; absent, the main site. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CenterScheduleViewDto>` · DTO `CenterScheduleViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:52` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:53` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | The site this schedule and equipment belong to. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:60` |
| `siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:61` |
| `sites` | `array<CenterSiteDto>` | Sí | — | — | Main site first. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:63` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | `diagnostic_unit_sites.id`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:43` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:44` |
| `sites[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:45` |
| `sites[].main` | `boolean` | Sí | — | — | The main site: the one used without `siteId`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:47` |
| `kind` | `string` | Sí | valores: LABORATORY, IMAGING | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:65` |
| `schedule` | `SaveCenterScheduleDto` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:67` |
| `schedule.general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `schedule.general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `schedule.modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `schedule.modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `schedule.modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `schedule.studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `schedule.studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `schedule.studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `schedule.equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `schedule.equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `schedule.equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<CenterStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:68` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:11` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:12` |
| `studies[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:13` |
| `studies[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:14` |
| `studies[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:16` |
| `studies[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:17` |
| `equipment` | `array<CenterEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:69` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:21` |
| `equipment[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:22` |
| `equipment[].manufacturer` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:23` |
| `equipment[].model` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:24` |
| `equipment[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | — | `null`: does not limit appointments (an analyzer). | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:30` |
| `equipment[].status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:31` |
| `equipment[].glossaryConceptId` | `string` | Sí | admite null | — | Always `null` for now. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:37` |
| `updatedAt` | `string` | Sí | admite null | — | `null` while the center has never published a schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:75` |
| `bookingsWithoutEquipment` | `number` | No | — | — | Future bookings left without an operational device. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:79` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada; ResourceNotFoundException: Sucursal no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. PUT /diagnostic-units/{unitId}/schedule

- **Origen:** CONTRATO
- **Nombre:** Publish the whole schedule of a center
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.saveSchedule` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:93`

### Qué es y para qué sirve (negocio)

Publish the whole schedule of a center. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostic-units/{unitId}/schedule` la atiende `CenterScheduleController.saveSchedule` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:93). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SaveCenterScheduleDto` (38 campos, 22 obligatorios). Delega en `SaveCenterScheduleUseCase.execute`. Crea filas en scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates. Actualiza scheduling.schedule_templates. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, scheduling.appointment_bookings, scheduling.bookable_slots y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: unitId | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:93` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → GetCenterScheduleUseCase.staffUnit → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | ESCRIBE | CREA | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterScheduleRepository.createResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:143` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterBookingsRepository.lockResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:100` |
| `scheduling.schedule_rules` | ESCRIBE | CREA | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterScheduleRepository.insertTemplate | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:237` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | ESCRIBE | ACTUALIZA | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterScheduleRepository.retireTemplates | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:194` |
| `scheduling.schedule_templates` | ESCRIBE | CREA | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterScheduleRepository.insertTemplate | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:219` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.saveSchedule → SaveCenterScheduleUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unitId` | path | Sí | `string` | — |
| `siteId` | query | No | `string` | `diagnostic_unit_sites.id`; absent, the main site. |

### Cuerpo — DTO `SaveCenterScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "general": {
    "windows": [
      {
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "12:00"
      }
    ],
    "slotMinutes": 30
  },
  "modalities": [
    {
      "modalityCode": "ECO",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00"
          }
        ],
        "slotMinutes": 30
      }
    }
  ],
  "studies": [
    {
      "studyCode": "STUDY-ECO-OBSTETRICA",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00"
          }
        ],
        "slotMinutes": 30
      }
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "general": {
    "windows": [
      {
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "12:00",
        "slotMinutes": 5,
        "gapMinutes": 1
      }
    ],
    "slotMinutes": 30
  },
  "modalities": [
    {
      "modalityCode": "ECO",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00",
            "slotMinutes": 5,
            "gapMinutes": 1
          }
        ],
        "slotMinutes": 30
      }
    }
  ],
  "studies": [
    {
      "studyCode": "STUDY-ECO-OBSTETRICA",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00",
            "slotMinutes": 5,
            "gapMinutes": 1
          }
        ],
        "slotMinutes": 30
      }
    }
  ],
  "equipment": [
    {
      "equipmentId": "00000000-0000-4000-8000-000000000001",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00",
            "slotMinutes": 5,
            "gapMinutes": 1
          }
        ],
        "slotMinutes": 30
      }
    }
  ]
}
```

</details>

### Respuesta — `Promise<CenterScheduleViewDto>` · DTO `CenterScheduleViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:52` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:53` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | The site this schedule and equipment belong to. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:60` |
| `siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:61` |
| `sites` | `array<CenterSiteDto>` | Sí | — | — | Main site first. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:63` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | `diagnostic_unit_sites.id`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:43` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:44` |
| `sites[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:45` |
| `sites[].main` | `boolean` | Sí | — | — | The main site: the one used without `siteId`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:47` |
| `kind` | `string` | Sí | valores: LABORATORY, IMAGING | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:65` |
| `schedule` | `SaveCenterScheduleDto` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:67` |
| `schedule.general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `schedule.general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `schedule.modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `schedule.modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `schedule.modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `schedule.studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `schedule.studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `schedule.studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `schedule.equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `schedule.equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `schedule.equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<CenterStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:68` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:11` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:12` |
| `studies[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:13` |
| `studies[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:14` |
| `studies[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:16` |
| `studies[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:17` |
| `equipment` | `array<CenterEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:69` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:21` |
| `equipment[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:22` |
| `equipment[].manufacturer` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:23` |
| `equipment[].model` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:24` |
| `equipment[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | — | `null`: does not limit appointments (an analyzer). | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:30` |
| `equipment[].status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:31` |
| `equipment[].glossaryConceptId` | `string` | Sí | admite null | — | Always `null` for now. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:37` |
| `updatedAt` | `string` | Sí | admite null | — | `null` while the center has never published a schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:75` |
| `bookingsWithoutEquipment` | `number` | No | — | — | Future bookings left without an operational device. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:79` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada; ResourceNotFoundException: Sucursal no encontrada |
| 409 | `CONFLICT` | ConflictException: Hay 1 turno reservado que quedaría fuera del horario nuevo. / Hay {affected} turnos reservados que quedarían fuera del horario nuevo. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El horario tiene datos incompletos. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /diagnostic-units/{unitId}/study-availability

- **Origen:** CONTRATO
- **Nombre:** Free starts of a study in a center
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `StudyAvailabilityController.studyAvailability` — `src/modules/diagnostic_units/center-schedule/presentation/study-availability.controller.ts:24`

### Qué es y para qué sirve (negocio)

Free starts of a study in a center. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/{unitId}/study-availability` la atiende `StudyAvailabilityController.studyAvailability` (src/modules/diagnostic_units/center-schedule/presentation/study-availability.controller.ts:24). Exige sesión; el controlador no declara roles. Delega en `GetStudyAvailabilityUseCase.execute`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, scheduling.appointment_bookings, scheduling.bookable_slots y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/study-availability.controller.ts:24` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_QUERY | studyCode (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: unitId | `src/modules/diagnostic_units/center-schedule/presentation/study-availability.controller.ts:24` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterScheduleRepository.findUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:71` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterAvailabilityService.startsFor → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterAvailabilityService.startsFor → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | StudyAvailabilityController.studyAvailability → GetStudyAvailabilityUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unitId` | path | Sí | `string` | — |
| `siteId` | query | No | `string` | `diagnostic_unit_sites.id`; absent, the main site. |
| `studyCode` | query | Sí | `string` | — |
| `from` | query | No | `string` | ISO instant; defaults to now. |
| `to` | query | No | `string` | ISO instant; defaults to from + 14 days. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StudyAvailabilityDto>` · DTO `StudyAvailabilityDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:35` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:37` |
| `studyCode` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:38` |
| `origin` | `string` | Sí | valores: STUDY, MODALITY, GENERAL | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:40` |
| `items` | `array<StudyStartDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:41` |
| `items[].startAt` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:27` |
| `items[].endAt` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:28` |
| `items[].remaining` | `number` | Sí | — | — | Places left in this slot. | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:29` |
| `items[].capacity` | `number` | Sí | — | — | Patients per slot. | `src/modules/diagnostic_units/center-schedule/presentation/dto/study-availability.dto.ts:30` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Centro no encontrado; ResourceNotFoundException: Sucursal no encontrada; ResourceNotFoundException: El centro no hace ese estudio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Pida una ventana de hasta {MAX_WINDOW_DAYS} días, con «to» posterior a «from». |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:StudyAvailabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. GET /diagnostic-units/administration

- **Origen:** CONTRATO
- **Nombre:** Listar las unidades del tenant, publicadas o no
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.listForAdministration` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:105`

### Qué es y para qué sirve (negocio)

Listar las unidades del tenant, publicadas o no. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/administration` la atiende `DiagnosticUnitsController.listForAdministration` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:105). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsAdminReadService.list`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.listForAdministration → DiagnosticUnitsAdminReadService.list → DiagnosticUnitsAdminReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:84` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.listForAdministration → DiagnosticUnitsAdminReadService.list → DiagnosticUnitsAdminReadRepository.findOfferings | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:97` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.listForAdministration → DiagnosticUnitsAdminReadService.list → DiagnosticUnitsAdminReadRepository.findSites | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:71` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.listForAdministration → DiagnosticUnitsAdminReadService.list → DiagnosticUnitsAdminReadRepository.findByTenant | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:47` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.listForAdministration → DiagnosticUnitsAdminReadService.list → DiagnosticUnitsAdminReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts:191` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticUnitAdminListDto>` · DTO `DiagnosticUnitAdminListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DiagnosticUnitAdminItemDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:66` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:14` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:17` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:20` |
| `items[].type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:23` |
| `items[].type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `items[].type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `items[].status` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:26` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `items[].verificationStatus` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:30` |
| `items[].verificationStatus.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `items[].verificationStatus.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `items[].publiclyListed` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:39` |
| `items[].siteCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:42` |
| `items[].studyCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:45` |
| `items[].equipmentCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:48` |
| `items[].acceptsExternalOrders` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:52` |
| `items[].walkInAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:55` |
| `items[].homeCollectionAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:59` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/administration-read.dto.ts:69` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:71` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:DiagnosticUnitsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /diagnostic-units/me/bookings

- **Origen:** CONTRATO
- **Nombre:** Appointments booked at my center, by start
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.myBookings` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:73`

### Qué es y para qué sirve (negocio)

Appointments booked at my center, by start. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/me/bookings` la atiende `CenterScheduleController.myBookings` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:73). Exige sesión; el controlador no declara roles. Delega en `ListCenterBookingsUseCase.execute`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, profiles.persons, scheduling.appointment_bookings y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → GetCenterScheduleUseCase.myUnit → CenterScheduleRepository.findUnitOfTenant | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:83` |
| `profiles.persons` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → ListCenterBookingsUseCase.forSite → CenterBookingsRepository.listForResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:213` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → ListCenterBookingsUseCase.forSite → CenterBookingsRepository.listForResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:213` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → ListCenterBookingsUseCase.forSite → CenterBookingsRepository.listForResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:213` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.myBookings → ListCenterBookingsUseCase.execute → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | query | No | `string` | `diagnostic_unit_sites.id`; absent, the main site. |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CenterBookingsDto>` · DTO `CenterBookingsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CenterBookingDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:53` |
| `items[].bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:18` |
| `items[].orderId` | `string` | Sí | admite null | — | `null` for a booking made outside the order flow. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:24` |
| `items[].patientName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:25` |
| `items[].studyName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:26` |
| `items[].startsAt` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:27` |
| `items[].endsAt` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:28` |
| `items[].siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:29` |
| `items[].status` | `string` | Sí | valores: REQUESTED, PENDING_CONFIRMATION, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:40` |
| `items[].equipmentId` | `string` | Sí | formato uuid; admite null | — | Device (production line) that attends it; `null` when no open line can. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:48` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-bookings.dto.ts:54` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Su organización no tiene un centro de diagnóstico con agenda.; ResourceNotFoundException: Sucursal no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Pida una ventana de hasta 31 días, con «to» posterior a «from». |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /diagnostic-units/me/schedule

- **Origen:** CONTRATO
- **Nombre:** Schedule, studies and equipment of my center
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CenterScheduleController.mySchedule` — `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:64`

### Qué es y para qué sirve (negocio)

Schedule, studies and equipment of my center. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/me/schedule` la atiende `CenterScheduleController.mySchedule` (src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:64). Exige sesión; el controlador no declara roles. Delega en `GetCenterScheduleUseCase.forMe`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, scheduling.appointment_bookings, scheduling.bookable_slots y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterScheduleRepository.findEquipment | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:262` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → GetCenterScheduleUseCase.myUnit → CenterScheduleRepository.findUnitOfTenant | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:83` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → GetCenterScheduleUseCase.view → CenterBookingsRepository.findOccupying | `src/modules/diagnostic_units/center-schedule/infrastructure/center-bookings.repository.ts:66` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterScheduleRepository.findResource | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:118` |
| `scheduling.schedule_rules` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterScheduleRepository.findTemplateRules | `src/modules/diagnostic_units/center-schedule/infrastructure/center-schedule.repository.ts:174` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CenterScheduleController.mySchedule → GetCenterScheduleUseCase.forMe → CenterContextService.load → CenterStudiesRepository.findForUnit | `src/modules/diagnostic_units/center-schedule/infrastructure/center-studies.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | query | No | `string` | `diagnostic_unit_sites.id`; absent, the main site. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CenterScheduleViewDto>` · DTO `CenterScheduleViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:52` |
| `unitName` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:53` |
| `siteId` | `string` | Sí | formato uuid; admite null | — | The site this schedule and equipment belong to. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:60` |
| `siteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:61` |
| `sites` | `array<CenterSiteDto>` | Sí | — | — | Main site first. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:63` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | `diagnostic_unit_sites.id`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:43` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:44` |
| `sites[].addressText` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:45` |
| `sites[].main` | `boolean` | Sí | — | — | The main site: the one used without `siteId`. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:47` |
| `kind` | `string` | Sí | valores: LABORATORY, IMAGING | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:65` |
| `schedule` | `SaveCenterScheduleDto` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:67` |
| `schedule.general` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:61` |
| `schedule.general.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.general.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.general.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.general.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.general.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.general.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.general.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.modalities` | `array<ModalityScheduleDto>` | Sí | máximo MODALITY_CODES.length elemento(s) | `@IsArray()` `@ArrayMaxSize(MODALITY_CODES.length)` `@ValidateNested({ each: true })` `@Type(() => ModalityScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:68` |
| `schedule.modalities[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | `@IsIn(MODALITY_CODES)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:23` |
| `schedule.modalities[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:28` |
| `schedule.modalities[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.modalities[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.modalities[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.modalities[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.studies` | `array<StudyScheduleDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => StudyScheduleDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:75` |
| `schedule.studies[].studyCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:36` |
| `schedule.studies[].schedule` | `ScheduleBlockDto` | Sí | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:41` |
| `schedule.studies[].schedule.windows` | `array<ScheduleWindowDto>` | Sí | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | `number` | Sí | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.studies[].schedule.windows[].startTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.studies[].schedule.windows[].endTime` | `string` | Sí | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.studies[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.studies[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.studies[].schedule.slotMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `schedule.equipment` | `array<EquipmentScheduleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => EquipmentScheduleDto)` | Devices with a shift of their own; the rest follow their study. Omitted = none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:87` |
| `schedule.equipment[].equipmentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:48` |
| `schedule.equipment[].schedule` | `ScheduleBlockDto` | No | — | `@ValidateNested()` `@Type(() => ScheduleBlockDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule.dto.ts:53` |
| `schedule.equipment[].schedule.windows` | `array<ScheduleWindowDto>` | No | máximo 28 elemento(s) | `@IsArray()` `@ArrayMaxSize(28)` `@ValidateNested({ each: true })` `@Type(() => ScheduleWindowDto)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:62` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | `number` | No | mínimo 1; máximo 7 | `@IsInt()` `@Min(1)` `@Max(7)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:22` |
| `schedule.equipment[].schedule.windows[].startTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:26` |
| `schedule.equipment[].schedule.windows[].endTime` | `string` | No | patrón ^([01]\d\|2[0-3]):[0-5]\d$; patrón runtime HH_MM | `@Matches(HH_MM)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:30` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | This window's appointment length; absent, the block's. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:41` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | `number` | No | mínimo 0; máximo 120 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(120)` | Rest after each appointment; absent, none. | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:52` |
| `schedule.equipment[].schedule.slotMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/schedule-block.dto.ts:68` |
| `studies` | `array<CenterStudyDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:68` |
| `studies[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:11` |
| `studies[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:12` |
| `studies[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:13` |
| `studies[].price` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:14` |
| `studies[].currency` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:16` |
| `studies[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:17` |
| `equipment` | `array<CenterEquipmentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:69` |
| `equipment[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:21` |
| `equipment[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:22` |
| `equipment[].manufacturer` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:23` |
| `equipment[].model` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:24` |
| `equipment[].modalityCode` | `string` | Sí | valores: ECO, RX, RM, TC, MG, DXA, LAB; admite null | — | `null`: does not limit appointments (an analyzer). | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:30` |
| `equipment[].status` | `string` | Sí | valores: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE | — | — | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:31` |
| `equipment[].glossaryConceptId` | `string` | Sí | admite null | — | Always `null` for now. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:37` |
| `updatedAt` | `string` | Sí | admite null | — | `null` while the center has never published a schedule. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:75` |
| `bookingsWithoutEquipment` | `number` | No | — | — | Future bookings left without an operational device. | `src/modules/diagnostic_units/center-schedule/presentation/dto/center-schedule-view.dto.ts:79` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Su organización no tiene un centro de diagnóstico con agenda.; ResourceNotFoundException: Sucursal no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:CenterScheduleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. GET /diagnostic-units/search

- **Origen:** CONTRATO
- **Nombre:** Buscar centros de diagnóstico, laboratorio e imagen
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.search` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129`

### Qué es y para qué sirve (negocio)

Buscar centros de diagnóstico, laboratorio e imagen. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/search` la atiende `DiagnosticUnitsController.search` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129). Exige sesión; el controlador no declara roles. Delega en `DiagnosticUnitsSearchService.searchCoverage`, `DiagnosticUnitsSearchService.search`. Lee common.addresses, community.service_reviews, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findAddresses | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:76` |
| `community.service_reviews` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → CommunityRatingsService.ratingsByProfiles → ReviewsRepository.averageByTargets | `src/modules/community/repositories/reviews.repository.ts:307` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:84` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.restrictions → DiagnosticUnitsReadRepository.findUnitIdsWithInsurerAgreement | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:283` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsReadRepository.findOfferedConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:252` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findCurrentPricesForSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:334` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findActiveSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:56` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsReadRepository.countVisible | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:210` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findPracticeSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:161` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto a buscar en nombre o código |
| `tenantId` | query | No | `string` | — |
| `kind` | query | No | `string` | — |
| `studyCode` | query | No | `string` | Código del estudio buscado |
| `studyConceptIds` | query | No | `string` | Conceptos de estudio separados por coma (uuid). Activa la búsqueda por cobertura. |
| `lat` | query | No | `number` | — |
| `lng` | query | No | `number` | — |
| `insurerTenantId` | query | No | `string` | — |
| `homeCollection` | query | No | `boolean` | — |
| `walkIn` | query | No | `boolean` | — |
| `acceptsExternalOrders` | query | No | `boolean` | — |
| `maxAmount` | query | No | `number` | Tope del importe publicado |
| `minRating` | query | No | `number` | Nota mínima (0 a 5) |
| `limit` | query | No | `number` | — |
| `offset` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchDiagnosticUnitsResponseDto>` · DTO `SearchDiagnosticUnitsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DiagnosticUnitSearchItemDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:308` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:15` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:18` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:21` |
| `items[].type` | `DiagnosticConceptDto` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:24` |
| `items[].type.code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:6` |
| `items[].type.display` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:9` |
| `items[].siteCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:27` |
| `items[].equipmentCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:30` |
| `items[].studyCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:33` |
| `items[].acceptsExternalOrders` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:36` |
| `items[].walkInAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:39` |
| `items[].homeCollectionAvailable` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/directory-read.dto.ts:42` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:210` |
| `items[].rating` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:214` |
| `items[].ratingCount` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:218` |
| `items[].minAmount` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:222` |
| `items[].minAmountCurrency` | `object` | No | admite null | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:230` |
| `items[].cities` | `array<string>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:242` |
| `items[].complete` | `boolean` | No | — | — | Solo con `studyConceptIds`: ofrece todos los estudios pedidos | `src/modules/diagnostic_units/dto/catalog.dto.ts:255` |
| `items[].missingStudyConceptIds` | `array<string>` | No | — | — | Solo con `studyConceptIds`: los estudios pedidos que no ofrece | `src/modules/diagnostic_units/dto/catalog.dto.ts:264` |
| `items[].distanceKm` | `number` | No | admite null | — | Solo con `studyConceptIds`: km en línea recta desde `lat`/`lng` hasta la sede principal | `src/modules/diagnostic_units/dto/catalog.dto.ts:277` |
| `items[].addressText` | `string` | No | admite null | — | Solo con `studyConceptIds`: dirección de la sede principal | `src/modules/diagnostic_units/dto/catalog.dto.ts:285` |
| `items[].latitude` | `number` | No | admite null | — | Solo con `studyConceptIds`: latitud de la sede principal | `src/modules/diagnostic_units/dto/catalog.dto.ts:293` |
| `items[].longitude` | `number` | No | admite null | — | Solo con `studyConceptIds`: longitud de la sede principal | `src/modules/diagnostic_units/dto/catalog.dto.ts:301` |
| `total` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:312` |
| `limit` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:316` |
| `offset` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/catalog.dto.ts:320` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:178` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:DiagnosticUnitsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. GET /diagnostics/lab/catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo de análisis (LOINC) con componentes y precio sugerido
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.studyCatalogItems` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:77`

### Qué es y para qué sirve (negocio)

Catálogo de análisis (LOINC) con componentes y precio sugerido. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/catalog` la atiende `LabPortalServicesController.studyCatalogItems` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:77). Exige sesión; el controlador no declara roles. Delega en `LabPortalStudyCatalogService.catalog`. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts, terminology.concept_designations y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:110` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:110` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | LabPortalServicesController.studyCatalogItems → LabPortalStudyCatalogService.catalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabCatalogDto>` · DTO `LabCatalogDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sections` | `array<LabCatalogSectionDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:68` |
| `sections[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:55` |
| `sections[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:56` |
| `sections[].items` | `array<LabCatalogItemDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:57` |
| `sections[].items[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:31` |
| `sections[].items[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:32` |
| `sections[].items[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:33` |
| `sections[].items[].loinc` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:34` |
| `sections[].items[].specimen` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:35` |
| `sections[].items[].sampleType` | `string` | Sí | valores: BLOOD, URINE, STOOL, FLUID, SWAB, OTHER | — | What is drawn from the patient, to browse by sample type | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:40` |
| `sections[].items[].suggestedPrice` | `LabSuggestedPriceDto` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:42` |
| `sections[].items[].suggestedPrice.source` | `string` | Sí | valores: INLASA, FONASA | — | — | sin fuente |
| `sections[].items[].suggestedPrice.sourceCode` | `string` | Sí | — | — | — | sin fuente |
| `sections[].items[].suggestedPrice.sourceName` | `string` | Sí | — | — | — | sin fuente |
| `sections[].items[].suggestedPrice.priceBs` | `string` | Sí | — | — | — | sin fuente |
| `sections[].items[].offeredServiceId` | `string` | Sí | formato uuid; admite null | — | The lab service already made from this item, if any | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:49` |
| `sections[].items[].components` | `array<LabCatalogComponentDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:51` |
| `sections[].items[].components[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:20` |
| `sections[].items[].components[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:21` |
| `sections[].items[].components[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:22` |
| `sections[].items[].components[].loinc` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:23` |
| `sections[].items[].components[].unit` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:24` |
| `sections[].items[].components[].suggestedPrice` | `LabSuggestedPriceDto` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:26` |
| `sections[].items[].components[].suggestedPrice.source` | `string` | Sí | valores: INLASA, FONASA | — | — | sin fuente |
| `sections[].items[].components[].suggestedPrice.sourceCode` | `string` | Sí | — | — | — | sin fuente |
| `sections[].items[].components[].suggestedPrice.sourceName` | `string` | Sí | — | — | — | sin fuente |
| `sections[].items[].components[].suggestedPrice.priceBs` | `string` | Sí | — | — | — | sin fuente |
| `sampleTypes` | `array<LabSampleTypeDto>` | Sí | — | — | Sample types in display order (blood first) | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:73` |
| `sampleTypes[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:61` |
| `sampleTypes[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:62` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:74` |
| `priceRule` | `string` | Sí | — | — | How suggested prices were chosen | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:76` |
| `catalogVersion` | `string` | Sí | admite null | — | Version of the LOINC study catalog loaded in this database (laboratorio.json), or null when only the basic boot análisis are there: no sections, LOINC nor components until `yarn catalog:studies:load` runs | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:83` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-catalog-import.int-spec.ts:40` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:58` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /diagnostics/lab/catalog/import

- **Origen:** CONTRATO
- **Nombre:** Sumar análisis del catálogo, con sus componentes y precio sugerido
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.importCatalog` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:86`

### Qué es y para qué sirve (negocio)

Sumar análisis del catálogo, con sus componentes y precio sugerido. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/catalog/import` la atiende `LabPortalServicesController.importCatalog` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:86). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabCatalogImportDto` (2 campos, 1 obligatorio). Delega en `LabPortalStudyCatalogService.importCatalog`. Crea filas en diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts, terminology.concept_designations y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.importOne → LabPortalStudyCatalogService.add → LabPortalPricingService.setPrice → LabPortalPricingService.ensureSchedule → DiagnosticPriceSchedulesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:92` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.importOne → DiagnosticStudyComponentsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-components.repository.ts:52` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.importOne → LabPortalStudyCatalogService.add → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:125` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.importOne → LabPortalStudyCatalogService.add → LabPortalPricingService.setPrice → DiagnosticStudyPricesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:132` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |
| `terminology.concept_designations` | LEE | LEE | POR_SQL | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:110` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:110` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | LabPortalServicesController.importCatalog → LabPortalStudyCatalogService.importCatalog → LabPortalStudyCatalogService.read → StudyCatalogRepository.findPage | `src/modules/study_catalog/repositories/study-catalog.repository.ts:138` |

### Cuerpo — DTO `LabCatalogImportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conceptIds` | `array<string>` | Sí | formato uuid; mínimo 1 elemento(s); máximo 600 elemento(s) | `@IsArray()` `@ArrayMinSize(1, { message: 'Elija al menos un análisis.' })` `@ArrayMaxSize(600, { message: 'Hasta 600 análisis por vez.' })` `@IsUUID('loose', { each: true })` | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:95` |
| `skipComponentIds` | `array<string>` | No | formato uuid; máximo 5000 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(5000, { message: 'Hasta 5000 componentes por vez.' })` `@IsUUID('loose', { each: true })` | Components the lab does not offer: no service is made for them. Absent or empty: every component of each chosen análisis | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:107` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "conceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "conceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "skipComponentIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<LabCatalogImportResultDto>` · DTO `LabCatalogImportResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `created` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:124` |
| `republished` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:125` |
| `linked` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:126` |
| `skipped` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:127` |
| `rejected` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:128` |
| `rows` | `array<LabCatalogImportRowDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:130` |
| `rows[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:111` |
| `rows[].outcome` | `string` | Sí | valores: CREATED, LINKED, REPUBLISHED, SKIPPED, REJECTED | — | LINKED: a free-form service with the same code now points to the catalog item | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:117` |
| `rows[].serviceId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:119` |
| `rows[].reason` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-catalog.dto.ts:120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-catalog-import.int-spec.ts:122` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:59` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. GET /diagnostics/lab/categories

- **Origen:** CONTRATO
- **Nombre:** Categorías del laboratorio, con su conteo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.listCategories` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:176`

### Qué es y para qué sirve (negocio)

Categorías del laboratorio, con su conteo. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/categories` la atiende `LabPortalServicesController.listCategories` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:176). Exige sesión; el controlador no declara roles. Delega en `LabPortalCategoriesService.list`. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:176` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.listCategories → LabPortalCategoriesService.list → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.listCategories → LabPortalCategoriesService.list → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.listCategories → LabPortalCategoriesService.list → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.listCategories → LabPortalCategoriesService.list → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.listCategories → LabPortalCategoriesService.list → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.listCategories → LabPortalCategoriesService.list → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.listCategories → LabPortalCategoriesService.list → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabCategoryPageDto>` · DTO `LabCategoryPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LabCategoryDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:84` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:75` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:76` |
| `items[].serviceCount` | `number` | Sí | — | — | Services of the category that are not withdrawn | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:80` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:85` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:54` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /diagnostics/lab/categories

- **Origen:** CONTRATO
- **Nombre:** Crear una categoría (409 si el nombre ya existe, sin importar mayúsculas)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.createCategory` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:183`

### Qué es y para qué sirve (negocio)

Crear una categoría (409 si el nombre ya existe, sin importar mayúsculas). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/categories` la atiende `LabPortalServicesController.createCategory` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:183). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabCategoryNameDto` (1 campo, 1 obligatorio). Delega en `LabPortalCategoriesService.create`. Crea filas en diagnostic_units.diagnostic_service_categories. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:183` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create | `src/modules/diagnostic_units/services/lab-portal-categories.service.ts:71` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.createCategory → LabPortalCategoriesService.create → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Cuerpo — DTO `LabCategoryNameDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud máxima 60; patrón runtime /\S/ | `@IsString()` `@Matches(/\S/, { message: 'Falta el nombre de la categoría.' })` `@MaxLength(60, { message: 'El nombre no puede pasar de 60 caracteres.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-requests.dto.ts:77` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Hematología"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Hematología"
}
```

</details>

### Respuesta — `Promise<LabCategoryDto>` · DTO `LabCategoryDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:75` |
| `name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:76` |
| `serviceCount` | `number` | Sí | — | — | Services of the category that are not withdrawn | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:80` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:55` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. DELETE /diagnostics/lab/categories/{id}

- **Origen:** CONTRATO
- **Nombre:** Eliminar una categoría (409 mientras agrupe servicios no retirados)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.deleteCategory` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:220`

### Qué es y para qué sirve (negocio)

Eliminar una categoría (409 mientras agrupe servicios no retirados). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostics/lab/categories/{id}` la atiende `LabPortalServicesController.deleteCategory` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:220). Exige sesión; el controlador no declara roles. Delega en `LabPortalCategoriesService.remove`. Borra de diagnostic_units.diagnostic_service_categories. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:220` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | BORRA | BORRA | POR_TIPO | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove | `src/modules/diagnostic_units/services/lab-portal-categories.service.ts:130` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.deleteCategory → LabPortalCategoriesService.remove → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ ok: true }>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado; ResourceNotFoundException: Categoría no encontrada |
| 409 | `CONFLICT` | ConflictException: «{category.name}» tiene {live.length} servicios. Muévalos a otra categoría antes de borrarla. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:57` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. PATCH /diagnostics/lab/categories/{id}

- **Origen:** CONTRATO
- **Nombre:** Renombrar una categoría (409 si el nombre ya existe)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.renameCategory` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:202`

### Qué es y para qué sirve (negocio)

Renombrar una categoría (409 si el nombre ya existe). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /diagnostics/lab/categories/{id}` la atiende `LabPortalServicesController.renameCategory` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:202). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabCategoryNameDto` (1 campo, 1 obligatorio). Delega en `LabPortalCategoriesService.rename`. Actualiza diagnostic_units.diagnostic_service_categories. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:202` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:202` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | ESCRIBE | ACTUALIZA | POR_TIPO | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename | `src/modules/diagnostic_units/services/lab-portal-categories.service.ts:105` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.renameCategory → LabPortalCategoriesService.rename → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LabCategoryNameDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud máxima 60; patrón runtime /\S/ | `@IsString()` `@Matches(/\S/, { message: 'Falta el nombre de la categoría.' })` `@MaxLength(60, { message: 'El nombre no puede pasar de 60 caracteres.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-requests.dto.ts:77` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Hematología"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Hematología"
}
```

</details>

### Respuesta — `Promise<LabCategoryDto>` · DTO `LabCategoryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:75` |
| `name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:76` |
| `serviceCount` | `number` | Sí | — | — | Services of the category that are not withdrawn | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:80` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado; ResourceNotFoundException: Categoría no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:56` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. GET /diagnostics/lab/services

- **Origen:** CONTRATO
- **Nombre:** Catálogo de servicios del laboratorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.listServices` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:104`

### Qué es y para qué sirve (negocio)

Catálogo de servicios del laboratorio. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/services` la atiende `LabPortalServicesController.listServices` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:104). Exige sesión; el controlador no declara roles. Delega en `LabPortalCatalogService.list`. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.listServices → LabPortalCatalogService.list → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.listServices → LabPortalCatalogService.list → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.listServices → LabPortalCatalogService.list → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.listServices → LabPortalCatalogService.list → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.listServices → LabPortalCatalogService.list → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.listServices → LabPortalCatalogService.list → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.listServices → LabPortalCatalogService.list → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | — |
| `categoryId` | query | No | `string` | — |
| `status` | query | No | `string` | — |
| `available` | query | No | `boolean` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabServicePageDto>` · DTO `LabServicePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LabServiceDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:70` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:5` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:6` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:7` |
| `items[].kind` | `string` | Sí | valores: SERVICE, MODALITY | — | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:13` |
| `items[].parentId` | `string` | Sí | formato uuid; admite null | — | Panel this service is a component of | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:20` |
| `items[].catalogConceptId` | `string` | Sí | formato uuid; admite null | — | Study catalog concept; null for free-form services | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:27` |
| `items[].hasPrice` | `boolean` | Sí | — | — | False until a price version exists | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:29` |
| `items[].categoryId` | `string` | Sí | admite null | — | Category of the lab, or null when the service has none | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:35` |
| `items[].categoryName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:36` |
| `items[].sampleType` | `string` | Sí | admite null | — | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:43` |
| `items[].preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:44` |
| `items[].description` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:45` |
| `items[].turnaroundHours` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:46` |
| `items[].requiresMedicalOrder` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:48` |
| `items[].homeCollection` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:49` |
| `items[].price` | `string` | Sí | admite null | — | null when the service has no current price | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:56` |
| `items[].alovidaDiscountPercent` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:58` |
| `items[].alovidaPrice` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:60` |
| `items[].currency` | `string` | Sí | valores: BOB | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:61` |
| `items[].status` | `string` | Sí | valores: PUBLISHED, DRAFT, WITHDRAWN | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:63` |
| `items[].available` | `boolean` | Sí | — | — | "Available today" switch of the service | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:65` |
| `items[].updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:66` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:71` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-catalog-import.int-spec.ts:165` |
| INTEGRACION | `test/integration/lab-portal-prices.int-spec.ts:123` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:46` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. POST /diagnostics/lab/services

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un servicio con su precio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.createService` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:111`

### Qué es y para qué sirve (negocio)

Dar de alta un servicio con su precio. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/services` la atiende `LabPortalServicesController.createService` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:111). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabServiceDraftDto` (13 campos, 3 obligatorios). Delega en `LabPortalCatalogService.create`. Crea filas en diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalWriterService.create → LabPortalPricingService.setPrice → LabPortalPricingService.ensureSchedule → DiagnosticPriceSchedulesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:92` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalWriterService.create → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:125` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalWriterService.create → LabPortalPricingService.setPrice → DiagnosticStudyPricesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:132` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.createService → LabPortalCatalogService.create → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Cuerpo — DTO `LabServiceDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `categoryId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID('all', { message: 'La categoría no existe.' })` | A category of this lab (`GET /diagnostics/lab/categories`); null clears it. Another lab's id is rejected as non-existent. | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:32` |
| `sampleType` | `string` | No | longitud máxima 120; admite null | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Sample type as free text, stored in `specimen_description`; blank or null clears it | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:43` |
| `preparation` | `string` | No | longitud máxima 2000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:49` |
| `description` | `string` | No | longitud máxima 2000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:55` |
| `turnaroundHours` | `number` | No | mínimo 0; máximo 8760; admite null | `@IsOptional()` `@IsInt({ message: 'El tiempo de entrega va en horas enteras.' })` `@Min(0, { message: 'El tiempo de entrega va en horas enteras.' })` `@Max(8760)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:62` |
| `requiresMedicalOrder` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:67` |
| `homeCollection` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:72` |
| `alovidaDiscountPercent` | `number` | No | mínimo 0; máximo 100; admite null | `@IsOptional()` `@IsNumber( { maxDecimalPlaces: 2 }, { message: 'El descuento va de 0 a 100 %.' }, )` `@Min(0, { message: 'El descuento va de 0 a 100 %.' })` `@Max(100, { message: 'El descuento va de 0 a 100 %.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:82` |
| `available` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | "Available today": false hides the service from the public directory, the coverage search and order booking; it keeps its status and price | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:90` |
| `code` | `string` | Sí | longitud máxima 40; patrón runtime NOT_BLANK | `@IsString()` `@Matches(NOT_BLANK, { message: 'Falta el código del servicio.' })` `@MaxLength(40, { message: 'El código no puede pasar de 40 caracteres.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:99` |
| `name` | `string` | Sí | longitud máxima 200; patrón runtime NOT_BLANK | `@IsString()` `@Matches(NOT_BLANK, { message: 'Falta el nombre del servicio.' })` `@MaxLength(200)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:105` |
| `price` | `string` | Sí | patrón runtime PRICE | `@IsString({ message: PRICE_MESSAGE })` `@Matches(PRICE, { message: PRICE_MESSAGE })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:110` |
| `status` | `string` | No | valores: PUBLISHED, DRAFT | `@IsOptional()` `@IsIn(['PUBLISHED', 'DRAFT'], { message: 'Estado desconocido.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:115` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "HEMOGRAMA",
  "name": "Nombre de ejemplo",
  "price": "45.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "sampleType": "valor-ejemplo",
  "preparation": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "turnaroundHours": 1,
  "requiresMedicalOrder": true,
  "homeCollection": true,
  "alovidaDiscountPercent": 10,
  "available": true,
  "code": "HEMOGRAMA",
  "name": "Nombre de ejemplo",
  "price": "45.00",
  "status": "PUBLISHED"
}
```

</details>

### Respuesta — `Promise<LabServiceDto>` · DTO `LabServiceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:5` |
| `code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:6` |
| `name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:7` |
| `kind` | `string` | Sí | valores: SERVICE, MODALITY | — | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:13` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | Panel this service is a component of | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:20` |
| `catalogConceptId` | `string` | Sí | formato uuid; admite null | — | Study catalog concept; null for free-form services | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:27` |
| `hasPrice` | `boolean` | Sí | — | — | False until a price version exists | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:29` |
| `categoryId` | `string` | Sí | admite null | — | Category of the lab, or null when the service has none | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:35` |
| `categoryName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:36` |
| `sampleType` | `string` | Sí | admite null | — | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:43` |
| `preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:44` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:45` |
| `turnaroundHours` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:46` |
| `requiresMedicalOrder` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:48` |
| `homeCollection` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:49` |
| `price` | `string` | Sí | admite null | — | null when the service has no current price | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:56` |
| `alovidaDiscountPercent` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:58` |
| `alovidaPrice` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:60` |
| `currency` | `string` | Sí | valores: BOB | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:61` |
| `status` | `string` | Sí | valores: PUBLISHED, DRAFT, WITHDRAWN | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:63` |
| `available` | `boolean` | Sí | — | — | "Available today" switch of the service | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:65` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 409 | `CONFLICT` | ConflictException: {problem.message}; ConflictException: El tarifario público del laboratorio existe pero no está vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {problem.message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-prices.int-spec.ts:155` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:47` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. DELETE /diagnostics/lab/services/{id}

- **Origen:** CONTRATO
- **Nombre:** Retirar un servicio (no se borra)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.withdrawService` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:160`

### Qué es y para qué sirve (negocio)

Retirar un servicio (no se borra). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostics/lab/services/{id}` la atiende `LabPortalServicesController.withdrawService` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:160). Exige sesión; el controlador no declara roles. Delega en `LabPortalCatalogService.withdraw`. Actualiza diagnostic_units.diagnostic_study_offerings. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:160` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:160` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | ACTUALIZA | POR_TIPO | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → DiagnosticStudiesService.retireOffering | `src/modules/diagnostic_units/services/diagnostic-studies.service.ts:165` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.withdrawService → LabPortalCatalogService.withdraw → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabServiceDto>` · DTO `LabServiceDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:5` |
| `code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:6` |
| `name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:7` |
| `kind` | `string` | Sí | valores: SERVICE, MODALITY | — | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:13` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | Panel this service is a component of | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:20` |
| `catalogConceptId` | `string` | Sí | formato uuid; admite null | — | Study catalog concept; null for free-form services | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:27` |
| `hasPrice` | `boolean` | Sí | — | — | False until a price version exists | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:29` |
| `categoryId` | `string` | Sí | admite null | — | Category of the lab, or null when the service has none | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:35` |
| `categoryName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:36` |
| `sampleType` | `string` | Sí | admite null | — | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:43` |
| `preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:44` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:45` |
| `turnaroundHours` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:46` |
| `requiresMedicalOrder` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:48` |
| `homeCollection` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:49` |
| `price` | `string` | Sí | admite null | — | null when the service has no current price | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:56` |
| `alovidaDiscountPercent` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:58` |
| `alovidaPrice` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:60` |
| `currency` | `string` | Sí | valores: BOB | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:61` |
| `status` | `string` | Sí | valores: PUBLISHED, DRAFT, WITHDRAWN | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:63` |
| `available` | `boolean` | Sí | — | — | "Available today" switch of the service | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:65` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Servicio no encontrado; ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 409 | `CONFLICT` | ConflictException: La oferta ya está retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:49` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. PATCH /diagnostics/lab/services/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar un servicio (un precio nuevo es una versión nueva)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.updateService` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:142`

### Qué es y para qué sirve (negocio)

Editar un servicio (un precio nuevo es una versión nueva). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /diagnostics/lab/services/{id}` la atiende `LabPortalServicesController.updateService` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:142). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabServiceChangesDto` (13 campos, 0 obligatorios). Delega en `LabPortalCatalogService.update`. Crea filas en diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_prices. Actualiza diagnostic_units.diagnostic_study_offerings. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:142` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalWriterService.update → LabPortalPricingService.setPrice → LabPortalPricingService.ensureSchedule → DiagnosticPriceSchedulesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:92` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | ACTUALIZA | POR_TIPO | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalWriterService.update | `src/modules/diagnostic_units/services/lab-portal-writer.service.ts:178` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalWriterService.update → LabPortalPricingService.setPrice → DiagnosticStudyPricesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:132` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.updateService → LabPortalCatalogService.update → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LabServiceChangesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `categoryId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID('all', { message: 'La categoría no existe.' })` | A category of this lab (`GET /diagnostics/lab/categories`); null clears it. Another lab's id is rejected as non-existent. | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:32` |
| `sampleType` | `string` | No | longitud máxima 120; admite null | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Sample type as free text, stored in `specimen_description`; blank or null clears it | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:43` |
| `preparation` | `string` | No | longitud máxima 2000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:49` |
| `description` | `string` | No | longitud máxima 2000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:55` |
| `turnaroundHours` | `number` | No | mínimo 0; máximo 8760; admite null | `@IsOptional()` `@IsInt({ message: 'El tiempo de entrega va en horas enteras.' })` `@Min(0, { message: 'El tiempo de entrega va en horas enteras.' })` `@Max(8760)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:62` |
| `requiresMedicalOrder` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:67` |
| `homeCollection` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:72` |
| `alovidaDiscountPercent` | `number` | No | mínimo 0; máximo 100; admite null | `@IsOptional()` `@IsNumber( { maxDecimalPlaces: 2 }, { message: 'El descuento va de 0 a 100 %.' }, )` `@Min(0, { message: 'El descuento va de 0 a 100 %.' })` `@Max(100, { message: 'El descuento va de 0 a 100 %.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:82` |
| `available` | `boolean` | No | — | `@IsOptional()` `@IsStrictBoolean()` | "Available today": false hides the service from the public directory, the coverage search and order booking; it keeps its status and price | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:90` |
| `code` | `string` | No | longitud máxima 40; patrón runtime NOT_BLANK | `@IsOptional()` `@IsString()` `@Matches(NOT_BLANK, { message: 'Falta el código del servicio.' })` `@MaxLength(40, { message: 'El código no puede pasar de 40 caracteres.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:125` |
| `name` | `string` | No | longitud máxima 200; patrón runtime NOT_BLANK | `@IsOptional()` `@IsString()` `@Matches(NOT_BLANK, { message: 'Falta el nombre del servicio.' })` `@MaxLength(200)` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:132` |
| `price` | `string` | No | patrón runtime PRICE | `@IsOptional()` `@IsString({ message: PRICE_MESSAGE })` `@Matches(PRICE, { message: PRICE_MESSAGE })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:138` |
| `status` | `string` | No | valores: PUBLISHED, DRAFT, WITHDRAWN | `@IsOptional()` `@IsIn(['PUBLISHED', 'DRAFT', 'WITHDRAWN'], { message: 'Estado desconocido.' })` | — | `src/modules/diagnostic_units/dto/lab-portal-service.dto.ts:143` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "sampleType": "valor-ejemplo",
  "preparation": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "turnaroundHours": 1,
  "requiresMedicalOrder": true,
  "homeCollection": true,
  "alovidaDiscountPercent": 10,
  "available": true,
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "price": "45.00",
  "status": "PUBLISHED"
}
```

</details>

### Respuesta — `Promise<LabServiceDto>` · DTO `LabServiceDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:5` |
| `code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:6` |
| `name` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:7` |
| `kind` | `string` | Sí | valores: SERVICE, MODALITY | — | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:13` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | Panel this service is a component of | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:20` |
| `catalogConceptId` | `string` | Sí | formato uuid; admite null | — | Study catalog concept; null for free-form services | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:27` |
| `hasPrice` | `boolean` | Sí | — | — | False until a price version exists | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:29` |
| `categoryId` | `string` | Sí | admite null | — | Category of the lab, or null when the service has none | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:35` |
| `categoryName` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:36` |
| `sampleType` | `string` | Sí | admite null | — | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:43` |
| `preparation` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:44` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:45` |
| `turnaroundHours` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:46` |
| `requiresMedicalOrder` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:48` |
| `homeCollection` | `boolean` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:49` |
| `price` | `string` | Sí | admite null | — | null when the service has no current price | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:56` |
| `alovidaDiscountPercent` | `number` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:58` |
| `alovidaPrice` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:60` |
| `currency` | `string` | Sí | valores: BOB | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:61` |
| `status` | `string` | Sí | valores: PUBLISHED, DRAFT, WITHDRAWN | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:63` |
| `available` | `boolean` | Sí | — | — | "Available today" switch of the service | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:65` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado; ResourceNotFoundException: Servicio no encontrado |
| 409 | `CONFLICT` | ConflictException: {problem.message}; ConflictException: El tarifario público del laboratorio existe pero no está vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {problem.message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-prices.int-spec.ts:146` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:48` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. POST /diagnostics/lab/services/import

- **Origen:** CONTRATO
- **Nombre:** Carga masiva por código, fila por fila
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LabPortalServicesController.importServices` — `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:127`

### Qué es y para qué sirve (negocio)

Carga masiva por código, fila por fila. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/services/import` la atiende `LabPortalServicesController.importServices` (src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:127). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabImportDto` (4 campos, 4 obligatorios). Delega en `LabPortalImportService.import`. Crea filas en diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices. Actualiza diagnostic_units.diagnostic_study_offerings. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalWriterService.create → LabPortalPricingService.setPrice → LabPortalPricingService.ensureSchedule → DiagnosticPriceSchedulesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:92` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:108` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:78` |
| `diagnostic_units.diagnostic_study_components` | LEE | LEE | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:104` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalWriterService.create → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:125` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | ACTUALIZA | POR_TIPO | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalWriterService.update | `src/modules/diagnostic_units/services/lab-portal-writer.service.ts:178` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalContextService.load | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:77` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | CREA | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalWriterService.create → LabPortalPricingService.setPrice → DiagnosticStudyPricesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:132` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalContextService.load → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:128` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalContextService.load → LabPortalContextService.unitOfTenant | `src/modules/diagnostic_units/services/lab-portal-context.service.ts:56` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | LabPortalServicesController.importServices → LabPortalImportService.import → LabPortalContextService.load → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:169` |

### Cuerpo — DTO `LabImportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mode` | `string` | Sí | valores: CREATE_OR_UPDATE, UPDATE_ONLY | `@IsIn(['CREATE_OR_UPDATE', 'UPDATE_ONLY'])` | — | `src/modules/diagnostic_units/dto/lab-portal-requests.dto.ts:60` |
| `rows` | `array<LabImportRowDto>` | Sí | mínimo 1 elemento(s); máximo 2000 elemento(s) | `@IsArray()` `@ArrayMinSize(1, { message: 'El archivo no trae filas.' })` `@ArrayMaxSize(2000, { message: 'Hasta 2000 filas por archivo.' })` `@ValidateNested({ each: true })` `@Type(() => LabImportRowDto)` | — | `src/modules/diagnostic_units/dto/lab-portal-requests.dto.ts:68` |
| `rows[].line` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/diagnostic_units/dto/lab-portal-requests.dto.ts:49` |
| `rows[].service` | `object` | Sí | — | `@IsObject()` | A LabServiceDraft | `src/modules/diagnostic_units/dto/lab-portal-requests.dto.ts:53` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mode": "CREATE_OR_UPDATE",
  "rows": [
    {
      "line": 1,
      "service": {}
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mode": "CREATE_OR_UPDATE",
  "rows": [
    {
      "line": 1,
      "service": {}
    }
  ]
}
```

</details>

### Respuesta — `Promise<LabImportResultDto>` · DTO `LabImportResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `created` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:97` |
| `updated` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:98` |
| `unchanged` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:99` |
| `rejected` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:100` |
| `rows` | `array<LabImportRowResultDto>` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:102` |
| `rows[].line` | `number` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:89` |
| `rows[].code` | `string` | Sí | — | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:90` |
| `rows[].outcome` | `string` | Sí | valores: CREATED, UPDATED, UNCHANGED, REJECTED | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:92` |
| `rows[].reason` | `string` | Sí | admite null | — | — | `src/modules/diagnostic_units/dto/lab-portal-responses.dto.ts:93` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La organización activa no tiene un laboratorio registrado |
| 409 | `CONFLICT` | ConflictException: El tarifario público del laboratorio existe pero no está vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostic_units/controllers/lab-portal-services.controller.spec.ts:50` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `ctrl:LabPortalServicesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. POST /price-schedules/{scheduleId}/study-prices

- **Origen:** CONTRATO
- **Nombre:** Fijar/versionar el precio de un estudio (append-only)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticPricingController.addStudyPrice` — `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50`

### Qué es y para qué sirve (negocio)

Fijar/versionar el precio de un estudio (append-only). Caso de uso UC-23-07: Fijar/versionar precio (append-only). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /price-schedules/{scheduleId}/study-prices` la atiende `DiagnosticPricingController.addStudyPrice` (src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateStudyPriceDto` (8 campos, 2 obligatorios). Delega en `DiagnosticPricingService.addStudyPrice`. Crea filas en diagnostic_units.diagnostic_study_prices. Actualiza diagnostic_units.diagnostic_study_prices. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: scheduleId | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticUnitScopeService.schedule → DiagnosticPriceSchedulesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:69` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticUnitScopeService.offering → DiagnosticStudyOfferingsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:99` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice | `src/modules/diagnostic_units/services/diagnostic-pricing.service.ts:144` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | CREA | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticStudyPricesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:132` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticStudyPricesRepository.findActive | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:82` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticUnitScopeService.schedule → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `scheduleId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateStudyPriceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `diagnosticStudyOfferingId` | `string` | Sí | formato uuid | `@IsUUID()` | Oferta de estudio a tarificar | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:18` |
| `baseAmount` | `string` | Sí | — | `@IsNumberString()` | Importe base | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:25` |
| `patientAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe a paciente | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:33` |
| `insurerAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe a aseguradora | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:44` |
| `taxAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Impuesto | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:52` |
| `discountFactor` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Factor de descuento | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:60` |
| `pricingRuleJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Reglas de precio (JSON) | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:68` |
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Vigente desde | `src/modules/diagnostic_units/dto/create-study-price.dto.ts:81` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
  "baseAmount": "120.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
  "baseAmount": "120.00",
  "patientAmount": "120.00",
  "insurerAmount": "80.00",
  "taxAmount": "18.00",
  "discountFactor": "0.10",
  "pricingRuleJson": {},
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<StudyPriceResponseDto>` · DTO `StudyPriceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:135` |
| `versionNumber` | `number` | Sí | — | — | Nº de versión (append-only) | `src/modules/diagnostic_units/dto/responses.dto.ts:141` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | `src/modules/diagnostic_units/dto/responses.dto.ts:147` |
| `effectiveFrom` | `string` | Sí | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:153` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El cronograma no está activo; PreconditionFailedException: La oferta no pertenece a la misma unidad que el cronograma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-07`

---

## 47. POST /study-prices/{priceId}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar una versión de precio vigente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticPricingController.closePrice` — `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70`

### Qué es y para qué sirve (negocio)

Cerrar una versión de precio vigente. Caso de uso UC-23-08: Cerrar versión de precio vigente. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /study-prices/{priceId}/close` la atiende `DiagnosticPricingController.closePrice` (src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticPricingService.closePrice`. Actualiza diagnostic_units.diagnostic_study_prices. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: priceId | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticPricingController.closePrice → DiagnosticPricingService.closePrice → DiagnosticUnitScopeService.price → DiagnosticUnitScopeService.schedule → DiagnosticPriceSchedulesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:69` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticPricingController.closePrice → DiagnosticPricingService.closePrice | `src/modules/diagnostic_units/services/diagnostic-pricing.service.ts:200` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticPricingController.closePrice → DiagnosticPricingService.closePrice → DiagnosticUnitScopeService.price → DiagnosticStudyPricesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:73` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticPricingController.closePrice → DiagnosticPricingService.closePrice → DiagnosticUnitScopeService.price → DiagnosticUnitScopeService.schedule → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `priceId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/diagnostic_units/dto/responses.dto.ts:261` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede cerrar una versión de precio activa y aún abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-08`

---

