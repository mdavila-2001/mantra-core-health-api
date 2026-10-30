<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostic_units`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 21 (21 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 15 · BAJO 6
- **Tablas distintas que tocan:** 17
- **Respuestas de error y detalle contractual:** `openapi/endpoints/diagnostic-units.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | PATCH | `/diagnostic-equipment/{id}` | Actualizar estado/calibración de un equipo | MEDIO | 4 | SECURITY_ADMIN |
| 2 | DELETE | `/diagnostic-study-offerings/{id}` | Retirar (soft-delete) una oferta de estudio | MEDIO | 3 | SECURITY_ADMIN |
| 3 | POST | `/diagnostic-unit-accreditations/{id}/renew` | Renovar/registrar acreditación con evidencia | MEDIO | 4 | SECURITY_ADMIN |
| 4 | PATCH | `/diagnostic-unit-sites/{siteId}` | Actualizar un sitio operativo de la unidad | MEDIO | 3 | SECURITY_ADMIN |
| 5 | POST | `/diagnostic-unit-sites/{siteId}/equipment` | Registrar equipamiento y calibración del sitio | MEDIO | 5 | SECURITY_ADMIN |
| 6 | GET | `/diagnostic-units` | Listar unidades diagnósticas publicadas | BAJO | 5 | sesión (sin roles) |
| 7 | POST | `/diagnostic-units` | Alta de unidad diagnóstica con sitios y acreditaciones | MEDIO | 4 | SECURITY_ADMIN |
| 8 | GET | `/diagnostic-units/{id}` | Consultar el perfil de una unidad diagnóstica | BAJO | 10 | sesión (sin roles) |
| 9 | POST | `/diagnostic-units/{id}/accreditations` | Registrar una acreditación con evidencia | MEDIO | 3 | SECURITY_ADMIN |
| 10 | GET | `/diagnostic-units/{id}/administration` | Consola de administración de una unidad diagnóstica | BAJO | 11 | SECURITY_ADMIN |
| 11 | POST | `/diagnostic-units/{id}/practitioner-assignments` | Asignar un especialista a la unidad/sitio | MEDIO | 6 | SECURITY_ADMIN |
| 12 | POST | `/diagnostic-units/{id}/price-schedules` | Crear un cronograma de precios | MEDIO | 4 | SECURITY_ADMIN |
| 13 | POST | `/diagnostic-units/{id}/reproject` | Reconstruir la proyección del perfil público | BAJO | 1 | SECURITY_ADMIN |
| 14 | POST | `/diagnostic-units/{id}/sites` | Registrar un sitio operativo de la unidad | MEDIO | 2 | SECURITY_ADMIN |
| 15 | PUT | `/diagnostic-units/{id}/specialties` | Declarar las especialidades de la unidad | MEDIO | 4 | SECURITY_ADMIN |
| 16 | POST | `/diagnostic-units/{id}/study-offerings` | Publicar oferta de estudio con componentes (panel) | MEDIO | 5 | SECURITY_ADMIN |
| 17 | POST | `/diagnostic-units/{id}/verify-and-publish` | Verificar la unidad y publicar su perfil público | MEDIO | 9 | SECURITY_ADMIN |
| 18 | GET | `/diagnostic-units/administration` | Listar las unidades del tenant, publicadas o no | BAJO | 5 | SECURITY_ADMIN |
| 19 | GET | `/diagnostic-units/search` | Buscar centros de diagnóstico, laboratorio e imagen | BAJO | 10 | sesión (sin roles) |
| 20 | POST | `/price-schedules/{scheduleId}/study-prices` | Fijar/versionar el precio de un estudio (append-only) | MEDIO | 6 | SECURITY_ADMIN |
| 21 | POST | `/study-prices/{priceId}/close` | Cerrar una versión de precio vigente | MEDIO | 4 | SECURITY_ADMIN |

---

## 1. PATCH /diagnostic-equipment/{id}

- **Origen:** CONTRATO
- **Nombre:** Actualizar estado/calibración de un equipo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticEquipmentController.updateEquipment` — `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:33`

### Qué es y para qué sirve (negocio)

Actualizar estado/calibración de un equipo. Caso de uso UC-23-09: Actualizar estado/calibración de equipo. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /diagnostic-equipment/{id}` la atiende `DiagnosticEquipmentController.updateEquipment` (src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateEquipmentDto` (5 campos, 0 obligatorios). Delega en `DiagnosticEquipmentService.updateEquipment`. Actualiza diagnostic_units.diagnostic_equipment. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment | `src/modules/diagnostic_units/services/diagnostic-equipment.service.ts:118` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → DiagnosticUnitScopeService.equipment → DiagnosticEquipmentRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:62` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitSitesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:50` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticEquipmentController.updateEquipment → DiagnosticEquipmentService.updateEquipment → DiagnosticUnitScopeService.equipment → DiagnosticUnitScopeService.siteOrFail → DiagnosticUnitScopeService.site → DiagnosticUnitScopeService.viaUnit → DiagnosticUnitsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateEquipmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `manufacturer` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Fabricante | `src/modules/diagnostic_units/dto/equipment.dto.ts:105` |
| `model` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Modelo | `src/modules/diagnostic_units/dto/equipment.dto.ts:114` |
| `lastCalibrationAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Última calibración | `src/modules/diagnostic_units/dto/equipment.dto.ts:127` |
| `nextCalibrationDueAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Próxima calibración | `src/modules/diagnostic_units/dto/equipment.dto.ts:140` |
| `operationalStatusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado operativo (concept id) | `src/modules/diagnostic_units/dto/equipment.dto.ts:151` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostic_units.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-09`

---

## 2. DELETE /diagnostic-study-offerings/{id}

- **Origen:** CONTRATO
- **Nombre:** Retirar (soft-delete) una oferta de estudio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticPricingController.retireOffering` — `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87`

### Qué es y para qué sirve (negocio)

Retirar (soft-delete) una oferta de estudio. Caso de uso UC-23-08: Retirar (soft-delete) oferta. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostic-study-offerings/{id}` la atiende `DiagnosticPricingController.retireOffering` (src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticStudiesService.retireOffering`. Actualiza diagnostic_units.diagnostic_study_offerings. Lee diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:87` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticPricingController.retireOffering → DiagnosticStudiesService.retireOffering | `src/modules/diagnostic_units/services/diagnostic-studies.service.ts:165` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticPricingController.retireOffering → DiagnosticStudiesService.retireOffering → DiagnosticUnitScopeService.offering → DiagnosticStudyOfferingsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:93` |
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
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/diagnostic_units/dto/responses.dto.ts:249` |

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

## 3. POST /diagnostic-unit-accreditations/{id}/renew

- **Origen:** CONTRATO
- **Nombre:** Renovar/registrar acreditación con evidencia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitAccreditationsController.renew` — `src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36`

### Qué es y para qué sirve (negocio)

Renovar/registrar acreditación con evidencia. Caso de uso UC-23-11: Renovar acreditación. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-unit-accreditations/{id}/renew` la atiende `DiagnosticUnitAccreditationsController.renew` (src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RenewAccreditationDto` (4 campos, 0 obligatorios). Delega en `DiagnosticUnitsService.renewAccreditation`. Crea filas en diagnostic_units.diagnostic_unit_accreditations. Actualiza diagnostic_units.diagnostic_unit_accreditations. Lee diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts:36` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:186` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | sin fuente |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:195` |
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

## 4. PATCH /diagnostic-unit-sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Actualizar un sitio operativo de la unidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitSitesController.updateSite` — `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49`

### Qué es y para qué sirve (negocio)

Actualizar un sitio operativo de la unidad. Caso de uso UC-23-02: Actualizar sitio. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /diagnostic-unit-sites/{siteId}` la atiende `DiagnosticUnitSitesController.updateSite` (src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateSiteDto` (4 campos, 0 obligatorios). Delega en `DiagnosticUnitsService.updateSite`. Actualiza diagnostic_units.diagnostic_unit_sites. Lee diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:49` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 5. POST /diagnostic-unit-sites/{siteId}/equipment

- **Origen:** CONTRATO
- **Nombre:** Registrar equipamiento y calibración del sitio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitSitesController.addEquipment` — `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67`

### Qué es y para qué sirve (negocio)

Registrar equipamiento y calibración del sitio. Caso de uso UC-23-09: Registrar equipamiento. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-unit-sites/{siteId}/equipment` la atiende `DiagnosticUnitSitesController.addEquipment` (src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateEquipmentDto` (8 campos, 1 obligatorio). Delega en `DiagnosticEquipmentService.addEquipment`. Crea filas en diagnostic_units.diagnostic_equipment. Actualiza diagnostic_units.diagnostic_unit_sites. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts:67` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment → DiagnosticEquipmentRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:85` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment → DiagnosticEquipmentRepository.findBySerial | `src/modules/diagnostic_units/repositories/diagnostic-equipment.repository.ts:71` |
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitSitesController.addEquipment → DiagnosticEquipmentService.addEquipment | `src/modules/diagnostic_units/services/diagnostic-equipment.service.ts:92` |
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

## 6. GET /diagnostic-units

- **Origen:** CONTRATO
- **Nombre:** Listar unidades diagnósticas publicadas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.list` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:86`

### Qué es y para qué sirve (negocio)

Listar unidades diagnósticas publicadas. Caso de uso Directorio P3: Listar unidades activas y verificadas del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units` la atiende `DiagnosticUnitsController.list` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:86). Exige sesión; el controlador no declara roles. Delega en `DiagnosticUnitsReadService.list`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:83` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findActiveOfferings | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:95` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findActiveSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:55` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findVisibleByTenant | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:25` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.list → DiagnosticUnitsReadService.list → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:171` |

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

## 7. POST /diagnostic-units

- **Origen:** CONTRATO
- **Nombre:** Alta de unidad diagnóstica con sitios y acreditaciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.create` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:183`

### Qué es y para qué sirve (negocio)

Alta de unidad diagnóstica con sitios y acreditaciones. Caso de uso UC-23-01: Alta de unidad con sitios (1..N) y acreditaciones (0..N). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units` la atiende `DiagnosticUnitsController.create` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:183). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDiagnosticUnitDto` (19 campos, 2 obligatorios). Delega en `DiagnosticUnitsService.create`. Crea filas en diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units. Lee diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:183` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 8. GET /diagnostic-units/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil de una unidad diagnóstica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.getById` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153`

### Qué es y para qué sirve (negocio)

Consultar el perfil de una unidad diagnóstica. Caso de uso Directorio P3: Perfil con sedes, equipos, oferta, precios públicos y acreditaciones vigentes. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/{id}` la atiende `DiagnosticUnitsController.getById` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153). Exige sesión; el controlador no declara roles. Delega en `DiagnosticUnitsReadService.getById`. Lee common.addresses, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:153` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findAddresses | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:75` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:83` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findCurrentPublicSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:110` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findActiveOfferings | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:95` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findCurrentPrices | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:130` |
| `diagnostic_units.diagnostic_unit_accreditations` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findCurrentAccreditations | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:144` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findActiveSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:55` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findVisibleById | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:42` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findPracticeSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:163` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.getById → DiagnosticUnitsReadService.getById → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:171` |

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
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:63` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `Directorio P3`

---

## 9. POST /diagnostic-units/{id}/accreditations

- **Origen:** CONTRATO
- **Nombre:** Registrar una acreditación con evidencia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.addAccreditation` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311`

### Qué es y para qué sirve (negocio)

Registrar una acreditación con evidencia. Caso de uso UC-23-11: Registrar acreditación con evidencia. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/accreditations` la atiende `DiagnosticUnitsController.addAccreditation` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DiagnosticUnitsCreateAccreditationDto` (7 campos, 1 obligatorio). Delega en `DiagnosticUnitsService.addAccreditation`. Crea filas en diagnostic_units.diagnostic_unit_accreditations. Lee diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:311` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:186` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | sin fuente |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:195` |
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

## 10. GET /diagnostic-units/{id}/administration

- **Origen:** CONTRATO
- **Nombre:** Consola de administración de una unidad diagnóstica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.getForAdministration` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170`

### Qué es y para qué sirve (negocio)

Consola de administración de una unidad diagnóstica. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/{id}/administration` la atiende `DiagnosticUnitsController.getForAdministration` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsAdminReadService.getById`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_practitioner_assignments, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:170` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 11. POST /diagnostic-units/{id}/practitioner-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar un especialista a la unidad/sitio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.assignPractitioner` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293`

### Qué es y para qué sirve (negocio)

Asignar un especialista a la unidad/sitio. Caso de uso UC-23-10: Asignar especialista. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/practitioner-assignments` la atiende `DiagnosticUnitsController.assignPractitioner` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerAssignmentDto` (8 campos, 1 obligatorio). Delega en `DiagnosticUnitsService.assignPractitioner`. Crea filas en diagnostic_units.diagnostic_unit_practitioner_assignments, diagnostic_units.diagnostic_unit_specialties. Lee diagnostic_units.diagnostic_unit_practitioner_assignments, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_unit_specialties, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:293` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostic_units/dto/responses.dto.ts:204` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | `src/modules/diagnostic_units/dto/responses.dto.ts:210` |

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

## 12. POST /diagnostic-units/{id}/price-schedules

- **Origen:** CONTRATO
- **Nombre:** Crear un cronograma de precios
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.createSchedule` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275`

### Qué es y para qué sirve (negocio)

Crear un cronograma de precios. Caso de uso UC-23-06: Crear cronograma de precios. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/price-schedules` la atiende `DiagnosticUnitsController.createSchedule` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePriceScheduleDto` (9 campos, 1 obligatorio). Delega en `DiagnosticPricingService.createSchedule`. Crea filas en diagnostic_units.diagnostic_price_schedules. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:275` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 13. POST /diagnostic-units/{id}/reproject

- **Origen:** CONTRATO
- **Nombre:** Reconstruir la proyección del perfil público
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.reproject` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329`

### Qué es y para qué sirve (negocio)

Reconstruir la proyección del perfil público. Caso de uso UC-23-12: Reconstruir proyección del perfil público. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:70`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/reproject` la atiende `DiagnosticUnitsController.reproject` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsService.reproject`. Lee diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:329` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `diagnosticUnitId` | `string` | Sí | formato uuid | — | Identificador asociado a diagnostic unit. | `src/modules/diagnostic_units/dto/responses.dto.ts:234` |
| `projected` | `boolean` | Sí | — | — | true si se (re)proyectó el perfil público | `src/modules/diagnostic_units/dto/responses.dto.ts:240` |

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

## 14. POST /diagnostic-units/{id}/sites

- **Origen:** CONTRATO
- **Nombre:** Registrar un sitio operativo de la unidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.addSite` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202`

### Qué es y para qué sirve (negocio)

Registrar un sitio operativo de la unidad. Caso de uso UC-23-02: Registrar sitio operativo. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/sites` la atiende `DiagnosticUnitsController.addSite` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AddSiteDto` (5 campos, 1 obligatorio). Delega en `DiagnosticUnitsService.addSite`. Crea filas en diagnostic_units.diagnostic_unit_sites. Lee diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:202` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 15. PUT /diagnostic-units/{id}/specialties

- **Origen:** CONTRATO
- **Nombre:** Declarar las especialidades de la unidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.setSpecialties` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237`

### Qué es y para qué sirve (negocio)

Declarar las especialidades de la unidad. Caso de uso UC-23-04: Declarar especialidades (upsert + soft-close). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostic-units/{id}/specialties` la atiende `DiagnosticUnitsController.setSpecialties` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SetSpecialtiesDto` (3 campos, 2 obligatorios). Delega en `DiagnosticUnitsService.setSpecialties`. Crea filas en diagnostic_units.diagnostic_unit_specialties. Actualiza diagnostic_units.diagnostic_unit_specialties. Lee diagnostic_units.diagnostic_unit_specialties, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:237` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `active` | `number` | Sí | — | — | Nº de especialidades vigentes tras el cambio | `src/modules/diagnostic_units/dto/responses.dto.ts:219` |
| `closed` | `number` | Sí | — | — | Nº de especialidades cerradas (soft) | `src/modules/diagnostic_units/dto/responses.dto.ts:225` |

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

## 16. POST /diagnostic-units/{id}/study-offerings

- **Origen:** CONTRATO
- **Nombre:** Publicar oferta de estudio con componentes (panel)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.createOffering` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255`

### Qué es y para qué sirve (negocio)

Publicar oferta de estudio con componentes (panel). Caso de uso UC-23-05: Publicar oferta con componentes (panel). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/study-offerings` la atiende `DiagnosticUnitsController.createOffering` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateStudyOfferingDto` (19 campos, 3 obligatorios). Delega en `DiagnosticStudiesService.createOffering`. Crea filas en diagnostic_units.diagnostic_study_components, diagnostic_units.diagnostic_study_offerings. Lee diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:255` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_study_components` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticStudyComponentsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-components.repository.ts:52` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:119` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.createOffering → DiagnosticStudiesService.createOffering → DiagnosticStudyOfferingsRepository.findByStudyCode | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:102` |
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
| `components[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden en el panel | `src/modules/diagnostic_units/dto/create-study-offering.dto.ts:54` |

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

## 17. POST /diagnostic-units/{id}/verify-and-publish

- **Origen:** CONTRATO
- **Nombre:** Verificar la unidad y publicar su perfil público
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.verifyAndPublish` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220`

### Qué es y para qué sirve (negocio)

Verificar la unidad y publicar su perfil público. Caso de uso UC-23-03: Verificar y publicar perfil público. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-units/{id}/verify-and-publish` la atiende `DiagnosticUnitsController.verifyAndPublish` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsService.verifyAndPublish`. Crea filas en community.public_profiles. Actualiza community.public_profiles, diagnostic_units.diagnostic_unit_accreditations, diagnostic_units.diagnostic_unit_specialties, diagnostic_units.diagnostic_units. Lee community.public_profiles, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:220` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:392` |
| `community.public_profiles` | LEE | LEE | DIRECTA | DiagnosticUnitsController.verifyAndPublish → DiagnosticUnitsService.verifyAndPublish → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
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
| INTEGRACION | `test/integration/laboratory-registration.int-spec.ts:459` |
| CONTROLADOR | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.spec.ts:109` |

### Flujos

- Módulo 23 — Diagnostic Units, Studies, Specialists and Prices — etapa `UC-23-03`

---

## 18. GET /diagnostic-units/administration

- **Origen:** CONTRATO
- **Nombre:** Listar las unidades del tenant, publicadas o no
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.listForAdministration` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:105`

### Qué es y para qué sirve (negocio)

Listar las unidades del tenant, publicadas o no. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/administration` la atiende `DiagnosticUnitsController.listForAdministration` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:105). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticUnitsAdminReadService.list`. Lee diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 19. GET /diagnostic-units/search

- **Origen:** CONTRATO
- **Nombre:** Buscar centros de diagnóstico, laboratorio e imagen
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticUnitsController.search` — `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129`

### Qué es y para qué sirve (negocio)

Buscar centros de diagnóstico, laboratorio e imagen. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-units/search` la atiende `DiagnosticUnitsController.search` (src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129). Exige sesión; el controlador no declara roles. Delega en `DiagnosticUnitsSearchService.searchCoverage`, `DiagnosticUnitsSearchService.search`. Lee common.addresses, community.service_reviews, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts:129` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findAddresses | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:75` |
| `community.service_reviews` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → CommunityRatingsService.ratingsByProfiles → ReviewsRepository.averageByTargets | `src/modules/community/repositories/reviews.repository.ts:307` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findEquipment | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:83` |
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.restrictions → DiagnosticUnitsReadRepository.findUnitIdsWithInsurerAgreement | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:285` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsReadRepository.findOfferedConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:254` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findCurrentPricesForSchedules | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:336` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findActiveSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:55` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsReadRepository.countVisible | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findPracticeSites | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:163` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticUnitsController.search → DiagnosticUnitsSearchService.searchCoverage → DiagnosticUnitsSearchService.project → DiagnosticUnitsReadRepository.findConcepts | `src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts:171` |

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

## 20. POST /price-schedules/{scheduleId}/study-prices

- **Origen:** CONTRATO
- **Nombre:** Fijar/versionar el precio de un estudio (append-only)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticPricingController.addStudyPrice` — `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50`

### Qué es y para qué sirve (negocio)

Fijar/versionar el precio de un estudio (append-only). Caso de uso UC-23-07: Fijar/versionar precio (append-only). Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /price-schedules/{scheduleId}/study-prices` la atiende `DiagnosticPricingController.addStudyPrice` (src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateStudyPriceDto` (8 campos, 2 obligatorios). Delega en `DiagnosticPricingService.addStudyPrice`. Crea filas en diagnostic_units.diagnostic_study_prices. Actualiza diagnostic_units.diagnostic_study_prices. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: scheduleId | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:50` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticUnitScopeService.schedule → DiagnosticPriceSchedulesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:69` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticUnitScopeService.offering → DiagnosticStudyOfferingsRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:93` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice | `src/modules/diagnostic_units/services/diagnostic-pricing.service.ts:141` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | CREA | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticStudyPricesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:114` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticPricingController.addStudyPrice → DiagnosticPricingService.addStudyPrice → DiagnosticStudyPricesRepository.findActive | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:81` |
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

## 21. POST /study-prices/{priceId}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar una versión de precio vigente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticPricingController.closePrice` — `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70`

### Qué es y para qué sirve (negocio)

Cerrar una versión de precio vigente. Caso de uso UC-23-08: Cerrar versión de precio vigente. Dentro del módulo (descripción del modelo, en inglés): «Gives a diagnostic unit a first-class identity, its own governance boundary, professionals, specialties, study catalog, public profile and versioned prices.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostic_units/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /study-prices/{priceId}/close` la atiende `DiagnosticPricingController.closePrice` (src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `DiagnosticPricingService.closePrice`. Actualiza diagnostic_units.diagnostic_study_prices. Lee diagnostic_units.diagnostic_price_schedules, diagnostic_units.diagnostic_study_prices, diagnostic_units.diagnostic_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: priceId | `src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts:70` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostic_units.diagnostic_price_schedules` | LEE | LEE | DIRECTA | DiagnosticPricingController.closePrice → DiagnosticPricingService.closePrice → DiagnosticUnitScopeService.price → DiagnosticUnitScopeService.schedule → DiagnosticPriceSchedulesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-price-schedules.repository.ts:69` |
| `diagnostic_units.diagnostic_study_prices` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticPricingController.closePrice → DiagnosticPricingService.closePrice | `src/modules/diagnostic_units/services/diagnostic-pricing.service.ts:200` |
| `diagnostic_units.diagnostic_study_prices` | LEE | LEE | DIRECTA | DiagnosticPricingController.closePrice → DiagnosticPricingService.closePrice → DiagnosticUnitScopeService.price → DiagnosticStudyPricesRepository.findById | `src/modules/diagnostic_units/repositories/diagnostic-study-prices.repository.ts:72` |
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
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/diagnostic_units/dto/responses.dto.ts:249` |

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

