<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `practice`

- **Bloque:** Práctica y Agenda (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)
- **Operaciones:** 30 (30 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 17 · BAJO 13
- **Tablas distintas que tocan:** 17
- **Respuestas de error y detalle contractual:** `openapi/endpoints/practice.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/accreditations/{id}/verify` | Verificar o caducar una acreditación (transición de estado) | BAJO | 2 | SECURITY_ADMIN |
| 2 | POST | `/inventory-items/{itemId}/movements` | Registrar un movimiento de inventario (ajuste de stock) | MEDIO | 3 | SECURITY_ADMIN |
| 3 | GET | `/practices` | Listar las prácticas activas del tenant | BAJO | 2 | SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER |
| 4 | POST | `/practices` | Dar de alta una práctica (organización raíz) | MEDIO | 2 | SECURITY_ADMIN |
| 5 | POST | `/practices/{practiceId}/accreditations` | Registrar una acreditación con evidencia | MEDIO | 2 | SECURITY_ADMIN |
| 6 | POST | `/practices/{practiceId}/healthcare-services` | Publicar un servicio de salud | MEDIO | 3 | SECURITY_ADMIN |
| 7 | POST | `/practices/{practiceId}/inventory-items` | Dar de alta un insumo de inventario de práctica | MEDIO | 1 | SECURITY_ADMIN |
| 8 | GET | `/practices/{practiceId}/organization` | Consola de organización médica: estructura, plantilla y legajo | BAJO | 9 | SECURITY_ADMIN, PERIOP_ADMIN, SURGERY_SCHEDULER, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER |
| 9 | GET | `/practices/{practiceId}/role-assignments` | Listar las vinculaciones profesional-organización de la práctica | BAJO | 2 | SECURITY_ADMIN |
| 10 | POST | `/practices/{practiceId}/role-assignments` | Asignar un rol de profesional a sitio/unidad/servicio | MEDIO | 4 | SECURITY_ADMIN |
| 11 | POST | `/practices/{practiceId}/role-assignments/self-request` | Solicitar la propia vinculación a una organización | MEDIO | 3 | PRACTITIONER |
| 12 | PUT | `/practices/{practiceId}/settings/{settingKey}` | Configurar un ajuste de práctica (upsert) | MEDIO | 3 | SECURITY_ADMIN |
| 13 | GET | `/practices/{practiceId}/sites` | Listar las sedes de una práctica | BAJO | 2 | SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN |
| 14 | POST | `/practices/{practiceId}/sites` | Dar de alta un sitio de práctica | MEDIO | 2 | SECURITY_ADMIN |
| 15 | DELETE | `/practices/{practiceId}/sites/{siteId}` | Desmantelar un sitio en cascada (soft-delete) | MEDIO | 10 | SECURITY_ADMIN |
| 16 | GET | `/practitioners/{profileId}/sites` | Consultorios donde atiende el profesional | BAJO | 5 | SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT |
| 17 | GET | `/practitioners/me/role-assignments` | Mis vinculaciones con organizaciones | BAJO | 3 | PRACTITIONER |
| 18 | POST | `/practitioners/me/sites` | Registrar un consultorio propio | MEDIO | 8 | PRACTITIONER, CLINICIAN |
| 19 | DELETE | `/practitioners/me/sites/{siteId}` | Retirar un consultorio propio | MEDIO | 4 | PRACTITIONER, CLINICIAN |
| 20 | PATCH | `/practitioners/me/sites/{siteId}` | Corregir un consultorio propio | MEDIO | 9 | PRACTITIONER, CLINICIAN |
| 21 | PUT | `/practitioners/me/sites/{siteId}/bank-qr` | Fijar o quitar el QR bancario de una sede | BAJO | 6 | PRACTITIONER, CLINICIAN |
| 22 | PUT | `/practitioners/me/sites/{siteId}/contact-phone` | Guardar o quitar mi teléfono en una sede | MEDIO | 7 | PRACTITIONER, CLINICIAN |
| 23 | POST | `/role-assignments/{roleId}/approve` | Aprobar una vinculación pendiente | BAJO | 2 | SECURITY_ADMIN |
| 24 | POST | `/role-assignments/{roleId}/end` | Finalizar una vinculación | BAJO | 2 | SECURITY_ADMIN |
| 25 | POST | `/role-assignments/{roleId}/reject` | Rechazar una vinculación pendiente | BAJO | 2 | SECURITY_ADMIN |
| 26 | POST | `/role-assignments/{roleId}/support-assignments` | Adjuntar personal de apoyo a un rol de profesional | MEDIO | 3 | SECURITY_ADMIN |
| 27 | POST | `/role-assignments/{roleId}/suspend` | Suspender una vinculación activa | BAJO | 2 | SECURITY_ADMIN |
| 28 | GET | `/sites/{siteId}/care-spaces` | Listar los espacios de atención de la sede | BAJO | 3 | SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN |
| 29 | POST | `/sites/{siteId}/care-spaces` | Crear un espacio de atención bajo una unidad/sitio | MEDIO | 3 | SECURITY_ADMIN |
| 30 | POST | `/sites/{siteId}/clinical-units` | Crear una unidad clínica jerárquica | MEDIO | 2 | SECURITY_ADMIN |

---

## 1. POST /accreditations/{id}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar o caducar una acreditación (transición de estado)
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccreditationsController.verify` — `src/modules/practice/controllers/accreditations.controller.ts:35`

### Qué es y para qué sirve (negocio)

Verificar o caducar una acreditación (transición de estado). Caso de uso UC-14-03: Verificar (→VERIFIED) o caducar (→EXPIRED). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:104`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /accreditations/{id}/verify` la atiende `AccreditationsController.verify` (src/modules/practice/controllers/accreditations.controller.ts:35). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `VerifyAccreditationDto` (1 campo, 0 obligatorios). Delega en `PracticeAccreditationsService.verify`. Lee practice.practice_accreditations, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/accreditations.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/accreditations.controller.ts:35` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_accreditations` | LEE | LEE | DIRECTA | AccreditationsController.verify → PracticeAccreditationsService.verify → PracticeAccreditationsRepository.findById | `src/modules/practice/repositories/practice-accreditations.repository.ts:68` |
| `practice.practices` | LEE | LEE | DIRECTA | AccreditationsController.verify → PracticeAccreditationsService.verify → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyAccreditationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | No | valores: VERIFIED, EXPIRED | `@IsOptional()` `@IsIn(['VERIFIED', 'EXPIRED'])` | Decisión de la transición (por defecto VERIFIED) | `src/modules/practice/dto/verify-accreditation.dto.ts:18` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "VERIFIED"
}
```

</details>

### Respuesta — `Promise<AccreditationResponseDto>` · DTO `AccreditationResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:56` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:60` |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:64` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:68` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La acreditación no está pendiente de verificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-03`

---

## 2. POST /inventory-items/{itemId}/movements

- **Origen:** CONTRATO
- **Nombre:** Registrar un movimiento de inventario (ajuste de stock)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InventoryItemsController.recordMovement` — `src/modules/practice/controllers/inventory-items.controller.ts:33`

### Qué es y para qué sirve (negocio)

Registrar un movimiento de inventario (ajuste de stock). Caso de uso UC-14-11: Movimiento de stock (IN/OUT/ADJUST). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:112`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /inventory-items/{itemId}/movements` la atiende `InventoryItemsController.recordMovement` (src/modules/practice/controllers/inventory-items.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateMovementDto` (5 campos, 2 obligatorios). Delega en `PracticeInventoryService.recordMovement`. Crea filas en practice.inventory_movements. Lee practice.inventory_items, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/inventory-items.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: itemId | `src/modules/practice/controllers/inventory-items.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.inventory_items` | LEE | LEE | DIRECTA | InventoryItemsController.recordMovement → PracticeInventoryService.recordMovement → InventoryItemsRepository.findById | `src/modules/practice/repositories/inventory-items.repository.ts:61` |
| `practice.inventory_movements` | ESCRIBE | CREA | DIRECTA | InventoryItemsController.recordMovement → PracticeInventoryService.recordMovement → InventoryMovementsRepository.create | `src/modules/practice/repositories/inventory-movements.repository.ts:55` |
| `practice.practices` | LEE | LEE | DIRECTA | InventoryItemsController.recordMovement → PracticeInventoryService.recordMovement → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `itemId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateMovementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `direction` | `string` | Sí | valores: IN, OUT, ADJUST | `@IsIn(['IN', 'OUT', 'ADJUST'])` | Sentido del movimiento | `src/modules/practice/dto/create-movement.dto.ts:25` |
| `quantity` | `number` | Sí | mayor que 0 | `@IsPositive()` | Cantidad (positiva) | `src/modules/practice/dto/create-movement.dto.ts:32` |
| `relatedResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de recurso relacionado | `src/modules/practice/dto/create-movement.dto.ts:44` |
| `relatedResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso relacionado | `src/modules/practice/dto/create-movement.dto.ts:55` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento en que ocurrió (ISO datetime) | `src/modules/practice/dto/create-movement.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "direction": "IN",
  "quantity": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "direction": "IN",
  "quantity": 1,
  "relatedResourceType": "valor-ejemplo",
  "relatedResourceId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<MovementResponseDto>` · DTO `MovementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:272` |
| `inventoryItemId` | `string` | Sí | — | — | Identificador asociado a inventory item. | `src/modules/practice/dto/responses.dto.ts:276` |
| `quantityOnHand` | `string` | Sí | — | — | Valor de quantity on hand mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:280` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:284` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El insumo no está activo; PreconditionFailedException: Stock insuficiente para la salida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-11`

---

## 3. GET /practices

- **Origen:** CONTRATO
- **Nombre:** Listar las prácticas activas del tenant
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.listPractices` — `src/modules/practice/controllers/practices.controller.ts:99`

### Qué es y para qué sirve (negocio)

Listar las prácticas activas del tenant. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices` la atiende `PracticesController.listPractices` (src/modules/practice/controllers/practices.controller.ts:99). Exige sesión con alguno de los roles SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER. Delega en `PracticeSitesService.listPractices`. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER | `src/modules/practice/controllers/practices.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.listPractices → PracticeSitesService.listPractices → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PracticesController.listPractices → PracticeSitesService.listPractices → PracticeAccessService.allowedPracticeIds → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PracticeSummaryDto[]>` · DTO `PracticeSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la práctica. | `src/modules/practice/dto/responses.dto.ts:303` |
| `code` | `string` | Sí | — | — | Código único dentro del tenant. | `src/modules/practice/dto/responses.dto.ts:305` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:307` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:309` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-ownership.int-spec.ts:46` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /practices

- **Origen:** CONTRATO
- **Nombre:** Dar de alta una práctica (organización raíz)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createPractice` — `src/modules/practice/controllers/practices.controller.ts:220`

### Qué es y para qué sirve (negocio)

Dar de alta una práctica (organización raíz). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices` la atiende `PracticesController.createPractice` (src/modules/practice/controllers/practices.controller.ts:220). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePracticeDto` (7 campos, 3 obligatorios). Delega en `PracticeSitesService.createPractice`. Crea filas en billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | ESCRIBE | CREA | DIRECTA | PracticesController.createPractice → PracticeSitesService.createPractice → ServiceCatalogRepository.create | `src/modules/billing/repositories/service-catalog.repository.ts:154` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | PracticesController.createPractice → PracticeSitesService.createPractice → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:130` |

### Cuerpo — DTO `CreatePracticeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant gestor (directory.tenants) | `src/modules/practice/dto/create-practice.dto.ts:24` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la práctica | `src/modules/practice/dto/create-practice.dto.ts:33` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre de la práctica | `src/modules/practice/dto/create-practice.dto.ts:42` |
| `typeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de práctica | `src/modules/practice/dto/create-practice.dto.ts:53` |
| `adminUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario administrador (por defecto el actor) | `src/modules/practice/dto/create-practice.dto.ts:64` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de moneda | `src/modules/practice/dto/create-practice.dto.ts:72` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/practice/dto/create-practice.dto.ts:81` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
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
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz"
}
```

</details>

### Respuesta — `Promise<PracticeResponseDto>` · DTO `PracticeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:8` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:12` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:16` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:20` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:40` |
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:59` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:125` |
| INTEGRACION | `test/integration/hardening/mch-018.int-spec.ts:70` |
| INTEGRACION | `test/integration/practice-ownership.int-spec.ts:79` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /practices/{practiceId}/accreditations

- **Origen:** CONTRATO
- **Nombre:** Registrar una acreditación con evidencia
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createAccreditation` — `src/modules/practice/controllers/practices.controller.ts:273`

### Qué es y para qué sirve (negocio)

Registrar una acreditación con evidencia. Caso de uso UC-14-02: Registrar acreditación (PENDING). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:103`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/accreditations` la atiende `PracticesController.createAccreditation` (src/modules/practice/controllers/practices.controller.ts:273). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeCreateAccreditationDto` (8 campos, 0 obligatorios). Delega en `PracticeAccreditationsService.create`. Crea filas en practice.practice_accreditations. Lee practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:273` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:273` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_accreditations` | ESCRIBE | CREA | DIRECTA | PracticesController.createAccreditation → PracticeAccreditationsService.create → PracticeAccreditationsRepository.create | `src/modules/practice/repositories/practice-accreditations.repository.ts:82` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.createAccreditation → PracticeAccreditationsService.create → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeCreateAccreditationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio acreditado (opcional) | `src/modules/practice/dto/create-accreditation.dto.ts:22` |
| `accreditationTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de acreditación | `src/modules/practice/dto/create-accreditation.dto.ts:33` |
| `accreditationNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Número de acreditación | `src/modules/practice/dto/create-accreditation.dto.ts:45` |
| `issuerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant emisor (directory.tenants) | `src/modules/practice/dto/create-accreditation.dto.ts:56` |
| `issuerName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre del emisor | `src/modules/practice/dto/create-accreditation.dto.ts:65` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/practice/dto/create-accreditation.dto.ts:73` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date) | `src/modules/practice/dto/create-accreditation.dto.ts:81` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia (common.files) | `src/modules/practice/dto/create-accreditation.dto.ts:92` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "accreditationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "accreditationNumber": "valor-ejemplo",
  "issuerTenantId": "00000000-0000-4000-8000-000000000001",
  "issuerName": "Nombre de ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AccreditationResponseDto>` · DTO `AccreditationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:56` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:60` |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:64` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:68` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sitio no pertenece a la práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-02`

---

## 6. POST /practices/{practiceId}/healthcare-services

- **Origen:** CONTRATO
- **Nombre:** Publicar un servicio de salud
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.publishHealthcareService` — `src/modules/practice/controllers/practices.controller.ts:291`

### Qué es y para qué sirve (negocio)

Publicar un servicio de salud. Caso de uso UC-14-06: Publicar servicio de salud. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:107`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/healthcare-services` la atiende `PracticesController.publishHealthcareService` (src/modules/practice/controllers/practices.controller.ts:291). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateHealthcareServiceDto` (7 campos, 0 obligatorios). Delega en `ClinicalStructureService.publishHealthcareService`. Crea filas en practice.healthcare_services. Lee practice.clinical_units, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:291` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:291` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.clinical_units` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:57` |
| `practice.healthcare_services` | ESCRIBE | CREA | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → HealthcareServicesRepository.create | `src/modules/practice/repositories/healthcare-services.repository.ts:89` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateHealthcareServiceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio donde se presta | `src/modules/practice/dto/create-healthcare-service.dto.ts:12` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica que lo presta | `src/modules/practice/dto/create-healthcare-service.dto.ts:23` |
| `serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de servicio | `src/modules/practice/dto/create-healthcare-service.dto.ts:31` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de especialidad | `src/modules/practice/dto/create-healthcare-service.dto.ts:42` |
| `referralRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Requiere derivación? | `src/modules/practice/dto/create-healthcare-service.dto.ts:50` |
| `appointmentRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Requiere cita? | `src/modules/practice/dto/create-healthcare-service.dto.ts:58` |
| `telehealthAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Disponible por telesalud? | `src/modules/practice/dto/create-healthcare-service.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "referralRequired": true,
  "appointmentRequired": true,
  "telehealthAvailable": true
}
```

</details>

### Respuesta — `Promise<HealthcareServiceResponseDto>` · DTO `HealthcareServiceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:128` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:132` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:136` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:140` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La práctica no está activa; PreconditionFailedException: El sitio no pertenece a la práctica; PreconditionFailedException: La unidad clínica no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-06`

---

## 7. POST /practices/{practiceId}/inventory-items

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un insumo de inventario de práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createInventoryItem` — `src/modules/practice/controllers/practices.controller.ts:378`

### Qué es y para qué sirve (negocio)

Dar de alta un insumo de inventario de práctica. Caso de uso UC-14-10: Alta de insumo (stock 0). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:111`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/inventory-items` la atiende `PracticesController.createInventoryItem` (src/modules/practice/controllers/practices.controller.ts:378). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateInventoryItemDto` (6 campos, 1 obligatorio). Delega en `PracticeInventoryService.createItem`. Crea filas en practice.inventory_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:378` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:378` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.inventory_items` | ESCRIBE | CREA | DIRECTA | PracticesController.createInventoryItem → PracticeInventoryService.createItem → InventoryItemsRepository.create | `src/modules/practice/repositories/inventory-items.repository.ts:72` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateInventoryItemDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del insumo | `src/modules/practice/dto/create-inventory-item.dto.ts:21` |
| `productConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de producto | `src/modules/practice/dto/create-inventory-item.dto.ts:29` |
| `lotNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Número de lote | `src/modules/practice/dto/create-inventory-item.dto.ts:38` |
| `expiryDate` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha de caducidad (ISO date) | `src/modules/practice/dto/create-inventory-item.dto.ts:46` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de unidad de medida | `src/modules/practice/dto/create-inventory-item.dto.ts:57` |
| `reorderLevel` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Nivel de reorden (numérico) | `src/modules/practice/dto/create-inventory-item.dto.ts:65` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "productConceptId": "00000000-0000-4000-8000-000000000001",
  "lotNumber": "valor-ejemplo",
  "expiryDate": "2026-07-31T12:00:00.000Z",
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "reorderLevel": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<InventoryItemResponseDto>` · DTO `InventoryItemResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:244` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:248` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:252` |
| `quantityOnHand` | `string` | Sí | — | — | Valor de quantity on hand mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:256` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:260` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:264` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-10`

---

## 8. GET /practices/{practiceId}/organization

- **Origen:** CONTRATO
- **Nombre:** Consola de organización médica: estructura, plantilla y legajo
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.getOrganizationConsole` — `src/modules/practice/controllers/practices.controller.ts:139`

### Qué es y para qué sirve (negocio)

Consola de organización médica: estructura, plantilla y legajo. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices/{practiceId}/organization` la atiende `PracticesController.getOrganizationConsole` (src/modules/practice/controllers/practices.controller.ts:139). Exige sesión con alguno de los roles SECURITY_ADMIN, PERIOP_ADMIN, SURGERY_SCHEDULER, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER. Delega en `PracticeOrganizationReadService.getConsole`. Lee practice.care_spaces, practice.clinical_units, practice.healthcare_services, practice.inventory_items, practice.practice_accreditations, practice.practice_sites, practice.practices, practice.practitioner_role_assignments y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PERIOP_ADMIN, SURGERY_SCHEDULER, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER | `src/modules/practice/controllers/practices.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:139` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.care_spaces` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findCareSpaces | `src/modules/practice/repositories/practice-organization-read.repository.ts:55` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findClinicalUnits | `src/modules/practice/repositories/practice-organization-read.repository.ts:42` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findHealthcareServices | `src/modules/practice/repositories/practice-organization-read.repository.ts:73` |
| `practice.inventory_items` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findInventoryItems | `src/modules/practice/repositories/practice-organization-read.repository.ts:109` |
| `practice.practice_accreditations` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findAccreditations | `src/modules/practice/repositories/practice-organization-read.repository.ts:97` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findSites | `src/modules/practice/repositories/practice-organization-read.repository.ts:33` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findRoleAssignments | `src/modules/practice/repositories/practice-organization-read.repository.ts:85` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PracticesController.getOrganizationConsole → PracticeOrganizationReadService.getConsole → PracticeOrganizationReadRepository.findConcepts | `src/modules/practice/repositories/practice-organization-read.repository.ts:140` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalOrganizationConsoleDto>` · DTO `MedicalOrganizationConsoleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `organization` | `OrganizationHeaderDto` | Sí | — | — | La organización. | `src/modules/practice/dto/organization-console.dto.ts:333` |
| `organization.id` | `string` | Sí | formato uuid | — | Identificador de la práctica. | `src/modules/practice/dto/organization-console.dto.ts:21` |
| `organization.code` | `string` | Sí | — | — | Código único dentro del tenant. | `src/modules/practice/dto/organization-console.dto.ts:24` |
| `organization.name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/organization-console.dto.ts:27` |
| `organization.type` | `PracticeConceptDto` | Sí | — | — | Tipo de organización: hospital, clínica, centro médico, consultorio… | `src/modules/practice/dto/organization-console.dto.ts:30` |
| `organization.type.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `organization.type.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `organization.status` | `PracticeConceptDto` | Sí | — | — | Estado de la práctica. | `src/modules/practice/dto/organization-console.dto.ts:33` |
| `organization.status.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `organization.status.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `organization.timeZone` | `string` | No | admite null | — | Zona horaria IANA declarada, si la tiene. | `src/modules/practice/dto/organization-console.dto.ts:37` |
| `organization.currency` | `PracticeConceptDto` | No | — | — | Moneda de la práctica, si la declara. | `src/modules/practice/dto/organization-console.dto.ts:41` |
| `organization.currency.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `organization.currency.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `sites` | `array<OrganizationSiteDto>` | Sí | — | — | Sus sedes. | `src/modules/practice/dto/organization-console.dto.ts:337` |
| `sites[].id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/organization-console.dto.ts:47` |
| `sites[].code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/organization-console.dto.ts:50` |
| `sites[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/organization-console.dto.ts:53` |
| `sites[].type` | `PracticeConceptDto` | Sí | — | — | Tipo de sede. | `src/modules/practice/dto/organization-console.dto.ts:56` |
| `sites[].type.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `sites[].type.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `sites[].physicalType` | `PracticeConceptDto` | No | — | — | Tipo físico del emplazamiento, si lo declara. | `src/modules/practice/dto/organization-console.dto.ts:60` |
| `sites[].physicalType.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `sites[].physicalType.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `sites[].operationalStatus` | `PracticeConceptDto` | No | — | — | Estado operativo (planificada, abierta, cerrada), si lo declara. | `src/modules/practice/dto/organization-console.dto.ts:64` |
| `sites[].operationalStatus.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `sites[].operationalStatus.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `sites[].status` | `PracticeConceptDto` | Sí | — | — | Estado de ciclo de vida. | `src/modules/practice/dto/organization-console.dto.ts:67` |
| `sites[].status.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `sites[].status.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `sites[].timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/organization-console.dto.ts:70` |
| `sites[].branchId` | `string` | No | formato uuid; admite null | — | Sucursal de `directory` con la que se corresponde, si la hay. | `src/modules/practice/dto/organization-console.dto.ts:74` |
| `sites[].clinicalUnitCount` | `number` | Sí | — | — | Áreas registradas en la sede. | `src/modules/practice/dto/organization-console.dto.ts:77` |
| `sites[].careSpaceCount` | `number` | Sí | — | — | Espacios de atención registrados en la sede. | `src/modules/practice/dto/organization-console.dto.ts:80` |
| `clinicalUnits` | `array<OrganizationClinicalUnitDto>` | Sí | — | — | Sus áreas y sub-áreas. | `src/modules/practice/dto/organization-console.dto.ts:341` |
| `clinicalUnits[].id` | `string` | Sí | formato uuid | — | Identificador del área. | `src/modules/practice/dto/organization-console.dto.ts:86` |
| `clinicalUnits[].siteId` | `string` | Sí | formato uuid | — | Sede a la que pertenece. | `src/modules/practice/dto/organization-console.dto.ts:89` |
| `clinicalUnits[].parentUnitId` | `string` | No | formato uuid; admite null | — | Área padre, cuando es una sub-área. | `src/modules/practice/dto/organization-console.dto.ts:93` |
| `clinicalUnits[].code` | `string` | Sí | — | — | Código único dentro de la sede. | `src/modules/practice/dto/organization-console.dto.ts:96` |
| `clinicalUnits[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/organization-console.dto.ts:99` |
| `clinicalUnits[].type` | `PracticeConceptDto` | Sí | — | — | Tipo de unidad. | `src/modules/practice/dto/organization-console.dto.ts:102` |
| `clinicalUnits[].type.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `clinicalUnits[].type.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `clinicalUnits[].specialty` | `PracticeConceptDto` | No | — | — | Especialidad del área, si la declara. | `src/modules/practice/dto/organization-console.dto.ts:106` |
| `clinicalUnits[].specialty.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `clinicalUnits[].specialty.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `clinicalUnits[].serviceMode` | `PracticeConceptDto` | No | — | — | Modalidad de servicio, si la declara. | `src/modules/practice/dto/organization-console.dto.ts:110` |
| `clinicalUnits[].serviceMode.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `clinicalUnits[].serviceMode.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `clinicalUnits[].status` | `PracticeConceptDto` | Sí | — | — | Estado de ciclo de vida. | `src/modules/practice/dto/organization-console.dto.ts:113` |
| `clinicalUnits[].status.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `clinicalUnits[].status.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `careSpaces` | `array<OrganizationCareSpaceDto>` | Sí | — | — | Su infraestructura: quirófanos, consultorios y demás espacios. | `src/modules/practice/dto/organization-console.dto.ts:345` |
| `careSpaces[].id` | `string` | Sí | formato uuid | — | Identificador del espacio. | `src/modules/practice/dto/organization-console.dto.ts:119` |
| `careSpaces[].siteId` | `string` | Sí | formato uuid | — | Sede a la que pertenece. | `src/modules/practice/dto/organization-console.dto.ts:122` |
| `careSpaces[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | Área a la que pertenece, si cuelga de una. | `src/modules/practice/dto/organization-console.dto.ts:126` |
| `careSpaces[].parentSpaceId` | `string` | No | formato uuid; admite null | — | Espacio contenedor, cuando es una subdivisión. | `src/modules/practice/dto/organization-console.dto.ts:130` |
| `careSpaces[].code` | `string` | Sí | — | — | Código único dentro de la sede. | `src/modules/practice/dto/organization-console.dto.ts:133` |
| `careSpaces[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/organization-console.dto.ts:136` |
| `careSpaces[].type` | `PracticeConceptDto` | Sí | — | — | Tipo de espacio. | `src/modules/practice/dto/organization-console.dto.ts:139` |
| `careSpaces[].type.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `careSpaces[].type.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `careSpaces[].capacity` | `number` | No | admite null | — | Capacidad declarada, si la tiene. | `src/modules/practice/dto/organization-console.dto.ts:142` |
| `careSpaces[].operationalStatus` | `PracticeConceptDto` | No | — | — | Disponibilidad operativa (disponible, en limpieza, fuera de servicio…). | `src/modules/practice/dto/organization-console.dto.ts:146` |
| `careSpaces[].operationalStatus.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `careSpaces[].operationalStatus.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `careSpaces[].status` | `PracticeConceptDto` | Sí | — | — | Estado de ciclo de vida. | `src/modules/practice/dto/organization-console.dto.ts:149` |
| `careSpaces[].status.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `careSpaces[].status.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `healthcareServices` | `array<OrganizationHealthcareServiceDto>` | Sí | — | — | Los servicios que ofrece. | `src/modules/practice/dto/organization-console.dto.ts:349` |
| `healthcareServices[].id` | `string` | Sí | formato uuid | — | Identificador del servicio. | `src/modules/practice/dto/organization-console.dto.ts:155` |
| `healthcareServices[].siteId` | `string` | No | formato uuid; admite null | — | Sede donde se presta, si está acotado a una. | `src/modules/practice/dto/organization-console.dto.ts:159` |
| `healthcareServices[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | Área que lo presta, si cuelga de una. | `src/modules/practice/dto/organization-console.dto.ts:163` |
| `healthcareServices[].service` | `PracticeConceptDto` | Sí | — | — | Servicio del catálogo. | `src/modules/practice/dto/organization-console.dto.ts:166` |
| `healthcareServices[].service.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `healthcareServices[].service.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `healthcareServices[].specialty` | `PracticeConceptDto` | No | — | — | Especialidad asociada, si la declara. | `src/modules/practice/dto/organization-console.dto.ts:170` |
| `healthcareServices[].specialty.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `healthcareServices[].specialty.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `healthcareServices[].referralRequired` | `boolean` | No | admite null | — | Si exige derivación previa. | `src/modules/practice/dto/organization-console.dto.ts:173` |
| `healthcareServices[].appointmentRequired` | `boolean` | No | admite null | — | Si exige turno previo. | `src/modules/practice/dto/organization-console.dto.ts:176` |
| `healthcareServices[].telehealthAvailable` | `boolean` | No | admite null | — | Si admite atención remota. | `src/modules/practice/dto/organization-console.dto.ts:179` |
| `healthcareServices[].status` | `PracticeConceptDto` | Sí | — | — | Estado de ciclo de vida. | `src/modules/practice/dto/organization-console.dto.ts:182` |
| `healthcareServices[].status.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `healthcareServices[].status.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `staff` | `array<OrganizationStaffMemberDto>` | Sí | — | — | Su plantilla profesional. | `src/modules/practice/dto/organization-console.dto.ts:353` |
| `staff[].id` | `string` | Sí | formato uuid | — | Identificador de la asignación. | `src/modules/practice/dto/organization-console.dto.ts:188` |
| `staff[].practitionerProfileId` | `string` | Sí | formato uuid | — | Perfil profesional asignado. | `src/modules/practice/dto/organization-console.dto.ts:191` |
| `staff[].practitionerName` | `string` | No | admite null | — | Nombre del profesional, o `null` si el perfil no lo tiene registrado. `null` es un estado real —un perfil creado sin persona detrás— y quien lo reciba tiene que decirlo, nunca sustituirlo por un uuid. | `src/modules/practice/dto/organization-console.dto.ts:199` |
| `staff[].siteId` | `string` | No | formato uuid; admite null | — | Sede del vínculo, si está acotado a una. | `src/modules/practice/dto/organization-console.dto.ts:203` |
| `staff[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | Área del vínculo, si está acotado a una. | `src/modules/practice/dto/organization-console.dto.ts:207` |
| `staff[].healthcareServiceId` | `string` | No | formato uuid; admite null | — | Servicio del vínculo, si está acotado a uno. | `src/modules/practice/dto/organization-console.dto.ts:211` |
| `staff[].role` | `PracticeConceptDto` | Sí | — | — | Rol clínico asignado. | `src/modules/practice/dto/organization-console.dto.ts:214` |
| `staff[].role.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `staff[].role.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `staff[].specialty` | `PracticeConceptDto` | No | — | — | Especialidad con la que ejerce en este vínculo, si la declara. | `src/modules/practice/dto/organization-console.dto.ts:218` |
| `staff[].specialty.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `staff[].specialty.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `staff[].isPrimary` | `boolean` | No | admite null | — | Si es el vínculo principal del profesional. | `src/modules/practice/dto/organization-console.dto.ts:221` |
| `staff[].validFrom` | `string` | No | formato date; admite null | — | Inicio de la vinculación. | `src/modules/practice/dto/organization-console.dto.ts:225` |
| `staff[].validTo` | `string` | No | formato date; admite null | — | Fin de la vinculación; `null` mientras siga abierta. | `src/modules/practice/dto/organization-console.dto.ts:229` |
| `staff[].status` | `PracticeConceptDto` | Sí | — | — | Estado de la asignación. | `src/modules/practice/dto/organization-console.dto.ts:232` |
| `staff[].status.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `staff[].status.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `legalDocuments` | `array<OrganizationLegalDocumentDto>` | Sí | — | — | Su documentación legal y acreditaciones. | `src/modules/practice/dto/organization-console.dto.ts:357` |
| `legalDocuments[].id` | `string` | Sí | formato uuid | — | Identificador del documento. | `src/modules/practice/dto/organization-console.dto.ts:238` |
| `legalDocuments[].siteId` | `string` | No | formato uuid; admite null | — | Sede a la que corresponde, si está acotado a una. | `src/modules/practice/dto/organization-console.dto.ts:242` |
| `legalDocuments[].type` | `PracticeConceptDto` | Sí | — | — | Tipo de acreditación o documento. | `src/modules/practice/dto/organization-console.dto.ts:245` |
| `legalDocuments[].type.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `legalDocuments[].type.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `legalDocuments[].number` | `string` | No | admite null | — | Número o matrícula del documento. | `src/modules/practice/dto/organization-console.dto.ts:248` |
| `legalDocuments[].issuerName` | `string` | No | admite null | — | Entidad emisora, tal como se registró. | `src/modules/practice/dto/organization-console.dto.ts:251` |
| `legalDocuments[].evidenceFileId` | `string` | No | formato uuid; admite null | — | Archivo de respaldo, si se adjuntó. | `src/modules/practice/dto/organization-console.dto.ts:255` |
| `legalDocuments[].validFrom` | `string` | No | formato date; admite null | — | Inicio de vigencia. | `src/modules/practice/dto/organization-console.dto.ts:259` |
| `legalDocuments[].validTo` | `string` | No | formato date; admite null | — | Fin de vigencia. | `src/modules/practice/dto/organization-console.dto.ts:263` |
| `legalDocuments[].daysToExpiry` | `number` | No | admite null | — | Días que faltan para el vencimiento; negativo si ya venció. Se calcula en el servidor a propósito: la alerta por vencimiento que pide la especificación tiene que dar el mismo resultado en toda pantalla y en todo informe, y el reloj del navegador no es una base confiable para eso. `null` cuando el documento no declara vencimiento. | `src/modules/practice/dto/organization-console.dto.ts:273` |
| `legalDocuments[].verificationStatus` | `PracticeConceptDto` | Sí | — | — | Estado de verificación del documento. | `src/modules/practice/dto/organization-console.dto.ts:277` |
| `legalDocuments[].verificationStatus.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `legalDocuments[].verificationStatus.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `inventory` | `array<OrganizationInventoryItemDto>` | Sí | — | — | Su inventario de insumos y equipamiento. | `src/modules/practice/dto/organization-console.dto.ts:361` |
| `inventory[].id` | `string` | Sí | formato uuid | — | Identificador del insumo. | `src/modules/practice/dto/organization-console.dto.ts:283` |
| `inventory[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/organization-console.dto.ts:286` |
| `inventory[].lotNumber` | `string` | No | admite null | — | Lote, si se registró. | `src/modules/practice/dto/organization-console.dto.ts:289` |
| `inventory[].expiryDate` | `string` | No | formato date; admite null | — | Fecha de vencimiento del lote, si la tiene. | `src/modules/practice/dto/organization-console.dto.ts:293` |
| `inventory[].quantityOnHand` | `string` | Sí | — | — | Existencias actuales, como decimal exacto. | `src/modules/practice/dto/organization-console.dto.ts:296` |
| `inventory[].unit` | `PracticeConceptDto` | No | — | — | Unidad de medida, si la declara. | `src/modules/practice/dto/organization-console.dto.ts:300` |
| `inventory[].unit.code` | `string` | No | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `inventory[].unit.display` | `string` | No | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |
| `inventory[].reorderLevel` | `string` | No | admite null | — | Punto de reposición configurado, si lo tiene. | `src/modules/practice/dto/organization-console.dto.ts:303` |
| `inventory[].belowReorderLevel` | `boolean` | Sí | — | — | Si las existencias cayeron al punto de reposición o por debajo. `false` cuando no hay punto configurado: sin umbral no hay faltante que declarar, y decir `true` ahí sería una alarma inventada. | `src/modules/practice/dto/organization-console.dto.ts:311` |
| `inventory[].status` | `PracticeConceptDto` | Sí | — | — | Estado del insumo. | `src/modules/practice/dto/organization-console.dto.ts:314` |
| `inventory[].status.code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/practice/dto/organization-console.dto.ts:12` |
| `inventory[].status.display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/practice/dto/organization-console.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-ownership.int-spec.ts:99` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /practices/{practiceId}/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Listar las vinculaciones profesional-organización de la práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.listRoleAssignments` — `src/modules/practice/controllers/practices.controller.ts:187`

### Qué es y para qué sirve (negocio)

Listar las vinculaciones profesional-organización de la práctica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices/{practiceId}/role-assignments` la atiende `PracticesController.listRoleAssignments` (src/modules/practice/controllers/practices.controller.ts:187). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `PracticeWorkforceService.listPracticeAssignments`. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:187` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:187` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.listRoleAssignments → PracticeWorkforceService.listPracticeAssignments → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PracticesController.listRoleAssignments → PracticeWorkforceService.listPracticeAssignments → PractitionerRoleAssignmentsRepository.findByPracticePage | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:242` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |
| `status` | query | No | `string` | Concepto de estado (p. ej. la vinculación pendiente) |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Vinculaciones por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListPracticeRoleAssignmentsResponseDto>` · DTO `ListPracticeRoleAssignmentsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<RoleAssignmentResponseDto>` | Sí | — | — | Vinculaciones de esta página, ordenadas por `id`. | `src/modules/practice/dto/responses.dto.ts:200` |
| `items[].id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:169` |
| `items[].practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:173` |
| `items[].practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:177` |
| `items[].status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:181` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:185` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/practice/dto/responses.dto.ts:205` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/practice/dto/responses.dto.ts:210` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/practice/dto/responses.dto.ts:216` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:129` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /practices/{practiceId}/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar un rol de profesional a sitio/unidad/servicio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.assignRole` — `src/modules/practice/controllers/practices.controller.ts:332`

### Qué es y para qué sirve (negocio)

Asignar un rol de profesional a sitio/unidad/servicio. Caso de uso UC-14-08: Asignar rol de profesional. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:109`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/role-assignments` la atiende `PracticesController.assignRole` (src/modules/practice/controllers/practices.controller.ts:332). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeCreateRoleAssignmentDto` (11 campos, 1 obligatorio). Delega en `PracticeWorkforceService.assignRole`. Crea filas en practice.practitioner_role_assignments. Lee practice.clinical_units, practice.healthcare_services, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:332` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:332` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.clinical_units` | LEE | LEE | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:57` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → HealthcareServicesRepository.findById | `src/modules/practice/repositories/healthcare-services.repository.ts:61` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:259` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeCreateRoleAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del profesional (profiles.health_practitioner_profiles) | `src/modules/practice/dto/create-role-assignment.dto.ts:22` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de la práctica | `src/modules/practice/dto/create-role-assignment.dto.ts:30` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica | `src/modules/practice/dto/create-role-assignment.dto.ts:38` |
| `healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio de salud | `src/modules/practice/dto/create-role-assignment.dto.ts:46` |
| `roleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de rol | `src/modules/practice/dto/create-role-assignment.dto.ts:54` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de especialidad | `src/modules/practice/dto/create-role-assignment.dto.ts:65` |
| `supervisorPractitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del supervisor | `src/modules/practice/dto/create-role-assignment.dto.ts:73` |
| `revenueSharePercent` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje de reparto de ingresos (numérico) | `src/modules/practice/dto/create-role-assignment.dto.ts:83` |
| `isPrimary` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Rol primario? | `src/modules/practice/dto/create-role-assignment.dto.ts:91` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/practice/dto/create-role-assignment.dto.ts:99` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date) | `src/modules/practice/dto/create-role-assignment.dto.ts:107` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "roleConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "supervisorPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "revenueSharePercent": "valor-ejemplo",
  "isPrimary": true,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<RoleAssignmentResponseDto>` · DTO `RoleAssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:169` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:173` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:177` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:181` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La práctica no está activa; PreconditionFailedException: El sitio no pertenece a la práctica; PreconditionFailedException: La unidad no pertenece a la práctica; PreconditionFailedException: El servicio no pertenece a la práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-08`

---

## 11. POST /practices/{practiceId}/role-assignments/self-request

- **Origen:** CONTRATO
- **Nombre:** Solicitar la propia vinculación a una organización
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.selfRequestRoleAssignment` — `src/modules/practice/controllers/practices.controller.ts:356`

### Qué es y para qué sirve (negocio)

Solicitar la propia vinculación a una organización. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/role-assignments/self-request` la atiende `PracticesController.selfRequestRoleAssignment` (src/modules/practice/controllers/practices.controller.ts:356). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `PracticeSelfRequestRoleAssignmentDto` (5 campos, 0 obligatorios). Delega en `PracticeWorkforceService.selfRequestAffiliation`. Crea filas en practice.practitioner_role_assignments. Lee practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/practice/controllers/practices.controller.ts:356` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:356` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:259` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeSelfRequestRoleAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de la práctica | `src/modules/practice/dto/self-request-role-assignment.dto.ts:24` |
| `roleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de cargo/rol | `src/modules/practice/dto/self-request-role-assignment.dto.ts:30` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de especialidad | `src/modules/practice/dto/self-request-role-assignment.dto.ts:39` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/practice/dto/self-request-role-assignment.dto.ts:45` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:52` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "roleConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RoleAssignmentResponseDto>` · DTO `RoleAssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:169` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:173` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:177` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:181` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: La práctica no está activa; PreconditionFailedException: El sitio no pertenece a la práctica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. PUT /practices/{practiceId}/settings/{settingKey}

- **Origen:** CONTRATO
- **Nombre:** Configurar un ajuste de práctica (upsert)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.upsertSetting` — `src/modules/practice/controllers/practices.controller.ts:313`

### Qué es y para qué sirve (negocio)

Configurar un ajuste de práctica (upsert). Caso de uso UC-14-07: Configurar ajuste (upsert). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:108`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /practices/{practiceId}/settings/{settingKey}` la atiende `PracticesController.upsertSetting` (src/modules/practice/controllers/practices.controller.ts:313). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpsertSettingDto` (2 campos, 1 obligatorio). Delega en `PracticeSettingsService.upsert`. Crea filas en practice.practice_settings. Actualiza practice.practice_settings. Lee practice.practice_settings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:313` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:313` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_settings` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.upsertSetting → PracticeSettingsService.upsert | `src/modules/practice/services/practice-settings.service.ts:58` |
| `practice.practice_settings` | ESCRIBE | CREA | DIRECTA | PracticesController.upsertSetting → PracticeSettingsService.upsert → PracticeSettingsRepository.create | `src/modules/practice/repositories/practice-settings.repository.ts:57` |
| `practice.practice_settings` | LEE | LEE | DIRECTA | PracticesController.upsertSetting → PracticeSettingsService.upsert → PracticeSettingsRepository.findByPracticeAndKey | `src/modules/practice/repositories/practice-settings.repository.ts:46` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |
| `settingKey` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertSettingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueJson` | `object` | Sí | — | `@IsDefined()` | Valor del ajuste (JSON arbitrario) | `src/modules/practice/dto/upsert-setting.dto.ts:14` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de categoría del ajuste | `src/modules/practice/dto/upsert-setting.dto.ts:25` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "valueJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "valueJson": {},
  "categoryConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SettingResponseDto>` · DTO `SettingResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:148` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:152` |
| `settingKey` | `string` | Sí | — | — | Valor de setting key mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:156` |
| `created` | `boolean` | Sí | — | — | true si se creó, false si se actualizó | `src/modules/practice/dto/responses.dto.ts:161` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-07`

---

## 13. GET /practices/{practiceId}/sites

- **Origen:** CONTRATO
- **Nombre:** Listar las sedes de una práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.listSites` — `src/modules/practice/controllers/practices.controller.ts:164`

### Qué es y para qué sirve (negocio)

Listar las sedes de una práctica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices/{practiceId}/sites` la atiende `PracticesController.listSites` (src/modules/practice/controllers/practices.controller.ts:164). Exige sesión con alguno de los roles SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN. Delega en `PracticeSitesService.listSites`. Lee practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN | `src/modules/practice/controllers/practices.controller.ts:164` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:164` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.listSites → PracticeSitesService.listSites → PracticeSitesRepository.findByPractice | `src/modules/practice/repositories/practice-sites.repository.ts:99` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.listSites → PracticeSitesService.listSites → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SiteSummaryDto[]>` · DTO `SiteSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:315` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:317` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:319` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:321` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:323` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /practices/{practiceId}/sites

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un sitio de práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createSite` — `src/modules/practice/controllers/practices.controller.ts:237`

### Qué es y para qué sirve (negocio)

Dar de alta un sitio de práctica. Caso de uso UC-14-01: Alta de sitio (op. status PLANNED). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:102`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/sites` la atiende `PracticesController.createSite` (src/modules/practice/controllers/practices.controller.ts:237). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeCreateSiteDto` (8 campos, 2 obligatorios). Delega en `PracticeSitesService.createSite`. Crea filas en practice.practice_sites. Lee practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:237` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:237` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | PracticesController.createSite → PracticeSitesService.createSite → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.createSite → PracticeSitesService.createSite → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeCreateSiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código de sitio único dentro de la práctica | `src/modules/practice/dto/create-site.dto.ts:23` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del sitio | `src/modules/practice/dto/create-site.dto.ts:32` |
| `siteTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de sitio | `src/modules/practice/dto/create-site.dto.ts:43` |
| `physicalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo físico | `src/modules/practice/dto/create-site.dto.ts:54` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/practice/dto/create-site.dto.ts:63` |
| `addressId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dirección (common.addresses) | `src/modules/practice/dto/create-site.dto.ts:74` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sucursal (directory.branches) | `src/modules/practice/dto/create-site.dto.ts:85` |
| `managingTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant gestor del sitio (directory.tenants) | `src/modules/practice/dto/create-site.dto.ts:96` |

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
  "siteTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "physicalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "addressId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "managingTenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SiteResponseDto>` · DTO `SiteResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:28` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:32` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:36` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:40` |
| `operationalStatus` | `string` | Sí | — | — | Valor de operational status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:44` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:48` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un sitio con ese código en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La práctica no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:137` |

### Flujos

- Módulo Practice (14) — etapa `UC-14-01`

---

## 15. DELETE /practices/{practiceId}/sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Desmantelar un sitio en cascada (soft-delete)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.decommissionSite` — `src/modules/practice/controllers/practices.controller.ts:255`

### Qué es y para qué sirve (negocio)

Desmantelar un sitio en cascada (soft-delete). Caso de uso UC-14-12: Desmantelar sitio en cascada. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:113`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /practices/{practiceId}/sites/{siteId}` la atiende `PracticesController.decommissionSite` (src/modules/practice/controllers/practices.controller.ts:255). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `PracticeSitesService.decommissionSite`. Actualiza practice.care_spaces, practice.clinical_units, practice.healthcare_services, practice.practice_sites, practice.practitioner_role_assignments. Lee practice.care_spaces, practice.clinical_units, practice.healthcare_services, practice.practice_sites, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:255` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId, siteId | `src/modules/practice/controllers/practices.controller.ts:255` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:336` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:72` |
| `practice.clinical_units` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:330` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → ClinicalUnitsRepository.findBySite | `src/modules/practice/repositories/clinical-units.repository.ts:71` |
| `practice.healthcare_services` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:343` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → HealthcareServicesRepository.findBySite | `src/modules/practice/repositories/healthcare-services.repository.ts:75` |
| `practice.practice_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:322` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:349` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → PractitionerRoleAssignmentsRepository.findBySite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:96` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/practice/dto/responses.dto.ts:292` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado en la práctica |
| 409 | `CONFLICT` | ConflictException: El sitio ya está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-12`

---

## 16. GET /practitioners/{profileId}/sites

- **Origen:** CONTRATO
- **Nombre:** Consultorios donde atiende el profesional
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.listSites` — `src/modules/practice/controllers/practitioner-sites.controller.ts:86`

### Qué es y para qué sirve (negocio)

Consultorios donde atiende el profesional. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practitioners/{profileId}/sites` la atiende `PractitionerSitesController.listSites` (src/modules/practice/controllers/practitioner-sites.controller.ts:86). Exige sesión con alguno de los roles SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT. Delega en `PractitionerSitesService.listSitesOfPractitioner`. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT | `src/modules/practice/controllers/practitioner-sites.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/practice/controllers/practitioner-sites.controller.ts:86` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.listSites → PractitionerSitesService.listSitesOfPractitioner → PractitionerSitesService.loadSites → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:558` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.listSites → PractitionerSitesService.listSitesOfPractitioner → PractitionerSitesService.loadSites → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.listSites → PractitionerSitesService.listSitesOfPractitioner → PractitionerSitesService.loadSites → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.listSites → PractitionerSitesService.listSitesOfPractitioner → PractitionerRoleAssignmentsRepository.findCurrentWithSite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:121` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.listSites → PractitionerSitesService.listSitesOfPractitioner → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerSitesResponseDto>` · DTO `PractitionerSitesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PractitionerSiteDto>` | Sí | — | — | Las sedes donde atiende, la principal primero. | `src/modules/practice/dto/responses.dto.ts:393` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:340` |
| `items[].practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:342` |
| `items[].code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:344` |
| `items[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:346` |
| `items[].timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:349` |
| `items[].addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:352` |
| `items[].latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:355` |
| `items[].longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:358` |
| `items[].contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:361` |
| `items[].isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:373` |
| `items[].bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:384` |
| `items[].status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:386` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/practice/dto/responses.dto.ts:397` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-registration.int-spec.ts:144` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /practitioners/me/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Mis vinculaciones con organizaciones
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.listMyAssignments` — `src/modules/practice/controllers/practitioner-sites.controller.ts:72`

### Qué es y para qué sirve (negocio)

Mis vinculaciones con organizaciones. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practitioners/me/role-assignments` la atiende `PractitionerSitesController.listMyAssignments` (src/modules/practice/controllers/practitioner-sites.controller.ts:72). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PracticeWorkforceService.listMyAssignments`. Lee community.public_profiles, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/practice/controllers/practitioner-sites.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.listMyAssignments → PracticeWorkforceService.listMyAssignments | `src/modules/practice/services/practice-workforce.service.ts:334` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.listMyAssignments → PracticeWorkforceService.listMyAssignments → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.listMyAssignments → PracticeWorkforceService.listMyAssignments → PractitionerRoleAssignmentsRepository.findByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:151` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyRoleAssignmentResponseDto[]>` · DTO `MyRoleAssignmentResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la vinculación. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:69` |
| `practiceId` | `string` | Sí | formato uuid | — | Organización (`practice.practices`). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:71` |
| `practiceName` | `string` | Sí | — | — | Nombre legible de la organización. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:73` |
| `practiceType` | `string` | No | formato uuid; admite null | — | Tipo de organización (concepto). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:76` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede, si la vinculación la declara. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:79` |
| `roleConceptId` | `string` | Sí | formato uuid | — | Cargo. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:81` |
| `specialtyConceptId` | `string` | No | formato uuid; admite null | — | Especialidad, si la vinculación la declara. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:84` |
| `status` | `string` | Sí | formato uuid | — | Estado de la vinculación (pendiente/activa/suspendida/rechazada/finalizada). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:86` |
| `isPrimary` | `boolean` | Sí | — | — | ¿Es la organización principal del profesional? | `src/modules/practice/dto/self-request-role-assignment.dto.ts:88` |
| `validFrom` | `string` | No | formato date-time; admite null | — | Vigente desde. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:90` |
| `validTo` | `string` | No | formato date-time; admite null | — | Vigente hasta (null = sigue vigente). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:92` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha de creación de la vinculación (o de la solicitud). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:94` |
| `avatarUrl` | `string` | No | admite null | — | Logo de la organización, tomado de su ficha pública (`community.public_profiles`), o `null` si no tiene una. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /practitioners/me/sites

- **Origen:** CONTRATO
- **Nombre:** Registrar un consultorio propio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.createOwnSite` — `src/modules/practice/controllers/practitioner-sites.controller.ts:114`

### Qué es y para qué sirve (negocio)

Registrar un consultorio propio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practitioners/me/sites` la atiende `PractitionerSitesController.createOwnSite` (src/modules/practice/controllers/practitioner-sites.controller.ts:114). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreateOwnSiteDto` (10 campos, 1 obligatorio). Delega en `PractitionerSitesService.createOwnSite`. Crea filas en common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments. Lee practice.practice_sites, practice.practices, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → OwnSiteProvisioningService.uniqueSiteCode → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:130` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:115` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:259` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `CreateOwnSiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 2; longitud máxima 200 | `@IsString()` `@MinLength(2)` `@MaxLength(200)` | Nombre del consultorio | `src/modules/practice/dto/create-own-site.dto.ts:113` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/practice/dto/create-own-site.dto.ts:120` |
| `address` | `OwnSiteAddressDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OwnSiteAddressDto)` | — | `src/modules/practice/dto/create-own-site.dto.ts:127` |
| `address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/modules/practice/dto/create-own-site.dto.ts:44` |
| `address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/practice/dto/create-own-site.dto.ts:51` |
| `address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:57` |
| `address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:63` |
| `address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/practice/dto/create-own-site.dto.ts:84` |
| `address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/practice/dto/create-own-site.dto.ts:95` |
| `contactPhone` | `string` | No | longitud máxima 40; patrón runtime SITE_CONTACT_PHONE_PATTERN | `@IsOptional()` `@IsString()` `@Matches(SITE_CONTACT_PHONE_PATTERN)` `@MaxLength(40)` | — | `src/modules/practice/dto/create-own-site.dto.ts:135` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "address": {
    "lines": [
      "valor-ejemplo"
    ],
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "contactPhone": "+591 72123456"
}
```

</details>

### Respuesta — `Promise<PractitionerSiteDto>` · DTO `PractitionerSiteDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:340` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:342` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:344` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:346` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:349` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:352` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:355` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:358` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:361` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:373` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:384` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:386` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. DELETE /practitioners/me/sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Retirar un consultorio propio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.deleteOwnSite` — `src/modules/practice/controllers/practitioner-sites.controller.ts:213`

### Qué es y para qué sirve (negocio)

Retirar un consultorio propio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /practitioners/me/sites/{siteId}` la atiende `PractitionerSitesController.deleteOwnSite` (src/modules/practice/controllers/practitioner-sites.controller.ts:213). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `PractitionerSitesService.deleteOwnSite`. Actualiza practice.practitioner_role_assignments. Lee practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:213` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:213` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.deleteOwnSite → PractitionerSitesService.deleteOwnSite | `src/modules/practice/services/practitioner-sites.service.ts:354` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.deleteOwnSite → PractitionerSitesService.deleteOwnSite → PractitionerRoleAssignmentsRepository.findCurrentBySite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:202` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.deleteOwnSite → PractitionerSitesService.deleteOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.deleteOwnSite → PractitionerSitesService.deleteOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No tiene una vinculación vigente con esa sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. PATCH /practitioners/me/sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Corregir un consultorio propio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.updateOwnSite` — `src/modules/practice/controllers/practitioner-sites.controller.ts:141`

### Qué es y para qué sirve (negocio)

Corregir un consultorio propio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /practitioners/me/sites/{siteId}` la atiende `PractitionerSitesController.updateOwnSite` (src/modules/practice/controllers/practitioner-sites.controller.ts:141). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `UpdateOwnSiteDto` (9 campos, 0 obligatorios). Delega en `PractitionerSitesService.updateOwnSite`. Crea filas en common.addresses. Actualiza common.addresses, practice.practice_sites. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:141` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:141` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.moveAddress → AddressesRepository.closeCurrent | `src/modules/common/repositories/addresses.repository.ts:112` |
| `common.addresses` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.moveAddress → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.moveAddress | `src/modules/practice/services/practitioner-sites.service.ts:659` |
| `practice.practice_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite | `src/modules/practice/services/practitioner-sites.service.ts:202` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.requireOwnSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.requireOwnSite → PractitionerSitesService.isOwnPractice → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:115` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerRoleAssignmentsRepository.findCurrentBySite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:202` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateOwnSiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 2; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(2)` `@MaxLength(200)` | Nombre del consultorio | `src/modules/practice/dto/update-own-site.dto.ts:43` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/practice/dto/update-own-site.dto.ts:50` |
| `address` | `OwnSiteAddressDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OwnSiteAddressDto)` | — | `src/modules/practice/dto/update-own-site.dto.ts:63` |
| `address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/modules/practice/dto/create-own-site.dto.ts:44` |
| `address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/practice/dto/create-own-site.dto.ts:51` |
| `address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:57` |
| `address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:63` |
| `address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/practice/dto/create-own-site.dto.ts:84` |
| `address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/practice/dto/create-own-site.dto.ts:95` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "address": {
    "lines": [
      "valor-ejemplo"
    ],
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  }
}
```

</details>

### Respuesta — `Promise<PractitionerSiteDto>` · DTO `PractitionerSiteDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:340` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:342` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:344` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:346` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:349` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:352` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:355` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:358` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:361` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:373` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:384` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:386` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Esa sede no es un consultorio propio suyo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. PUT /practitioners/me/sites/{siteId}/bank-qr

- **Origen:** CONTRATO
- **Nombre:** Fijar o quitar el QR bancario de una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.setSiteBankQr` — `src/modules/practice/controllers/practitioner-sites.controller.ts:168`

### Qué es y para qué sirve (negocio)

Fijar o quitar el QR bancario de una sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /practitioners/me/sites/{siteId}/bank-qr` la atiende `PractitionerSitesController.setSiteBankQr` (src/modules/practice/controllers/practitioner-sites.controller.ts:168). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SetSiteBankQrDto` (1 campo, 1 obligatorio). Delega en `PractitionerSitesService.setSiteBankQr`. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:168` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:168` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:558` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → PractitionerSitesService.isOwnPractice → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:115` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → PractitionerRoleAssignmentsRepository.findCurrentBySite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:202` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetSiteBankQrDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `object` | Sí | formato uuid; admite null | `@ValidateIf((dto: SetSiteBankQrDto) => dto.fileId !== null)` `@IsUUID()` | Archivo del QR ya subido, o null para quitarlo | `src/modules/practice/dto/update-own-site.dto.ts:89` |

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

### Respuesta — `Promise<PractitionerSiteDto>` · DTO `PractitionerSiteDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:340` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:342` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:344` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:346` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:349` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:352` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:355` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:358` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:361` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:373` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:384` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:386` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No tiene una vinculación vigente con esa sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. PUT /practitioners/me/sites/{siteId}/contact-phone

- **Origen:** CONTRATO
- **Nombre:** Guardar o quitar mi teléfono en una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.setSiteContactPhone` — `src/modules/practice/controllers/practitioner-sites.controller.ts:189`

### Qué es y para qué sirve (negocio)

Guardar o quitar mi teléfono en una sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /practitioners/me/sites/{siteId}/contact-phone` la atiende `PractitionerSitesController.setSiteContactPhone` (src/modules/practice/controllers/practitioner-sites.controller.ts:189). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SetSiteContactPhoneDto` (1 campo, 1 obligatorio). Delega en `PractitionerSitesService.setSiteContactPhone`. Actualiza practice.practitioner_role_assignments. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:189` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:189` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:558` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone | `src/modules/practice/services/practitioner-sites.service.ts:319` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → PractitionerRoleAssignmentsRepository.findCurrentBySite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:202` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetSiteContactPhoneDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `contactPhone` | `string` | Sí | longitud máxima 40; patrón runtime SITE_CONTACT_PHONE_PATTERN; admite null | `@ValidateIf((dto: SetSiteContactPhoneDto) => dto.contactPhone !== null)` `@IsString()` `@Matches(SITE_CONTACT_PHONE_PATTERN)` `@MaxLength(40)` | — | `src/modules/practice/dto/update-own-site.dto.ts:104` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "contactPhone": "+591 72123456"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "contactPhone": "+591 72123456"
}
```

</details>

### Respuesta — `Promise<PractitionerSiteDto>` · DTO `PractitionerSiteDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:340` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:342` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:344` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:346` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:349` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:352` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:355` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:358` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:361` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:373` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:384` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:386` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No tiene una vinculación vigente con esa sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /role-assignments/{roleId}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar una vinculación pendiente
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.approve` — `src/modules/practice/controllers/role-assignments.controller.ts:64`

### Qué es y para qué sirve (negocio)

Aprobar una vinculación pendiente. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/approve` la atiende `RoleAssignmentsController.approve` (src/modules/practice/controllers/role-assignments.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.approveAssignment`. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:64` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.approve → PracticeWorkforceService.approveAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.approve → PracticeWorkforceService.approveAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RoleAssignmentResponseDto>` · DTO `RoleAssignmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:169` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:173` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:177` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:181` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La vinculación no admite esa transición desde su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:RoleAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /role-assignments/{roleId}/end

- **Origen:** CONTRATO
- **Nombre:** Finalizar una vinculación
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.end` — `src/modules/practice/controllers/role-assignments.controller.ts:118`

### Qué es y para qué sirve (negocio)

Finalizar una vinculación. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/end` la atiende `RoleAssignmentsController.end` (src/modules/practice/controllers/role-assignments.controller.ts:118). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.endAssignment`. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:118` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:118` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.end → PracticeWorkforceService.endAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.end → PracticeWorkforceService.endAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RoleAssignmentResponseDto>` · DTO `RoleAssignmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:169` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:173` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:177` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:181` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La vinculación no admite esa transición desde su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:RoleAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /role-assignments/{roleId}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar una vinculación pendiente
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.reject` — `src/modules/practice/controllers/role-assignments.controller.ts:82`

### Qué es y para qué sirve (negocio)

Rechazar una vinculación pendiente. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/reject` la atiende `RoleAssignmentsController.reject` (src/modules/practice/controllers/role-assignments.controller.ts:82). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.rejectAssignment`. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:82` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.reject → PracticeWorkforceService.rejectAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.reject → PracticeWorkforceService.rejectAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RoleAssignmentResponseDto>` · DTO `RoleAssignmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:169` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:173` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:177` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:181` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La vinculación no admite esa transición desde su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:RoleAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /role-assignments/{roleId}/support-assignments

- **Origen:** CONTRATO
- **Nombre:** Adjuntar personal de apoyo a un rol de profesional
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.attachSupport` — `src/modules/practice/controllers/role-assignments.controller.ts:44`

### Qué es y para qué sirve (negocio)

Adjuntar personal de apoyo a un rol de profesional. Caso de uso UC-14-09: Adjuntar personal de apoyo. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:110`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/support-assignments` la atiende `RoleAssignmentsController.attachSupport` (src/modules/practice/controllers/role-assignments.controller.ts:44). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateSupportAssignmentDto` (5 campos, 1 obligatorio). Delega en `PracticeWorkforceService.attachSupport`. Crea filas en practice.practitioner_support_assignments. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:44` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.attachSupport → PracticeWorkforceService.attachSupport → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.attachSupport → PracticeWorkforceService.attachSupport → PracticeWorkforceService.loadRoleInScope → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | DIRECTA | RoleAssignmentsController.attachSupport → PracticeWorkforceService.attachSupport → PractitionerSupportAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-support-assignments.repository.ts:70` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateSupportAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `supportProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de apoyo (profiles.secretary_profiles) | `src/modules/practice/dto/create-support-assignment.dto.ts:14` |
| `supportRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de rol de apoyo | `src/modules/practice/dto/create-support-assignment.dto.ts:25` |
| `scopeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de alcance del apoyo | `src/modules/practice/dto/create-support-assignment.dto.ts:36` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/practice/dto/create-support-assignment.dto.ts:44` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date) | `src/modules/practice/dto/create-support-assignment.dto.ts:52` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "supportProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "supportProfileId": "00000000-0000-4000-8000-000000000001",
  "supportRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<SupportAssignmentResponseDto>` · DTO `SupportAssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:224` |
| `practitionerRoleAssignmentId` | `string` | Sí | — | — | Identificador asociado a practitioner role assignment. | `src/modules/practice/dto/responses.dto.ts:228` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:232` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:236` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rol de profesional no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-09`

---

## 27. POST /role-assignments/{roleId}/suspend

- **Origen:** CONTRATO
- **Nombre:** Suspender una vinculación activa
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.suspend` — `src/modules/practice/controllers/role-assignments.controller.ts:100`

### Qué es y para qué sirve (negocio)

Suspender una vinculación activa. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/suspend` la atiende `RoleAssignmentsController.suspend` (src/modules/practice/controllers/role-assignments.controller.ts:100). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.suspendAssignment`. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:100` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.suspend → PracticeWorkforceService.suspendAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.suspend → PracticeWorkforceService.suspendAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RoleAssignmentResponseDto>` · DTO `RoleAssignmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:169` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:173` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:177` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:181` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La vinculación no admite esa transición desde su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:RoleAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. GET /sites/{siteId}/care-spaces

- **Origen:** CONTRATO
- **Nombre:** Listar los espacios de atención de la sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SitesController.listCareSpaces` — `src/modules/practice/controllers/sites.controller.ts:69`

### Qué es y para qué sirve (negocio)

Listar los espacios de atención de la sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/care-spaces` la atiende `SitesController.listCareSpaces` (src/modules/practice/controllers/sites.controller.ts:69). Exige sesión con alguno de los roles SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN. Delega en `PracticeSitesService.listCareSpaces`. Lee practice.care_spaces, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN | `src/modules/practice/controllers/sites.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/sites.controller.ts:69` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.care_spaces` | LEE | LEE | DIRECTA | SitesController.listCareSpaces → PracticeSitesService.listCareSpaces → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:72` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SitesController.listCareSpaces → PracticeSitesService.listCareSpaces → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | SitesController.listCareSpaces → PracticeSitesService.listCareSpaces → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CareSpaceSummaryDto[]>` · DTO `CareSpaceSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del espacio. | `src/modules/practice/dto/responses.dto.ts:409` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | Sede a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:411` |
| `code` | `string` | Sí | — | — | Código único dentro de la sede. | `src/modules/practice/dto/responses.dto.ts:413` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:415` |
| `spaceTypeConceptId` | `string` | No | formato uuid | — | Tipo de espacio (quirófano, consulta, box…). | `src/modules/practice/dto/responses.dto.ts:417` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:419` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sede no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /sites/{siteId}/care-spaces

- **Origen:** CONTRATO
- **Nombre:** Crear un espacio de atención bajo una unidad/sitio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SitesController.createCareSpace` — `src/modules/practice/controllers/sites.controller.ts:87`

### Qué es y para qué sirve (negocio)

Crear un espacio de atención bajo una unidad/sitio. Caso de uso UC-14-05: Crear espacio de atención (AVAILABLE). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:106`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/care-spaces` la atiende `SitesController.createCareSpace` (src/modules/practice/controllers/sites.controller.ts:87). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCareSpaceDto` (6 campos, 2 obligatorios). Delega en `ClinicalStructureService.createCareSpace`. Crea filas en practice.care_spaces. Lee practice.care_spaces, practice.clinical_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/sites.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/sites.controller.ts:87` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.care_spaces` | ESCRIBE | CREA | DIRECTA | SitesController.createCareSpace → ClinicalStructureService.createCareSpace → CareSpacesRepository.create | `src/modules/practice/repositories/care-spaces.repository.ts:83` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SitesController.createCareSpace → ClinicalStructureService.createCareSpace → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:61` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SitesController.createCareSpace → ClinicalStructureService.createCareSpace → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:57` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCareSpaceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica (misma sede) | `src/modules/practice/dto/create-care-space.dto.ts:23` |
| `parentSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espacio padre (misma sede) | `src/modules/practice/dto/create-care-space.dto.ts:34` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único dentro de la sede | `src/modules/practice/dto/create-care-space.dto.ts:46` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del espacio | `src/modules/practice/dto/create-care-space.dto.ts:55` |
| `spaceTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de espacio | `src/modules/practice/dto/create-care-space.dto.ts:66` |
| `capacity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Capacidad (nº de plazas) | `src/modules/practice/dto/create-care-space.dto.ts:75` |

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
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "parentSpaceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "spaceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "capacity": 1
}
```

</details>

### Respuesta — `Promise<CareSpaceResponseDto>` · DTO `CareSpaceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:100` |
| `practiceSiteId` | `string` | Sí | — | — | Identificador asociado a practice site. | `src/modules/practice/dto/responses.dto.ts:104` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:108` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:112` |
| `operationalStatus` | `string` | Sí | — | — | Valor de operational status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:116` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un espacio con ese código en el sitio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sitio no está activo; PreconditionFailedException: La unidad no pertenece al sitio; PreconditionFailedException: El espacio padre no pertenece al sitio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-05`

---

## 30. POST /sites/{siteId}/clinical-units

- **Origen:** CONTRATO
- **Nombre:** Crear una unidad clínica jerárquica
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SitesController.createClinicalUnit` — `src/modules/practice/controllers/sites.controller.ts:45`

### Qué es y para qué sirve (negocio)

Crear una unidad clínica jerárquica. Caso de uso UC-14-04: Crear unidad clínica jerárquica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:105`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/clinical-units` la atiende `SitesController.createClinicalUnit` (src/modules/practice/controllers/sites.controller.ts:45). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateClinicalUnitDto` (6 campos, 2 obligatorios). Delega en `ClinicalStructureService.createClinicalUnit`. Crea filas en practice.clinical_units. Lee practice.clinical_units.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/sites.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/sites.controller.ts:45` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.clinical_units` | ESCRIBE | CREA | DIRECTA | SitesController.createClinicalUnit → ClinicalStructureService.createClinicalUnit → ClinicalUnitsRepository.create | `src/modules/practice/repositories/clinical-units.repository.ts:82` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SitesController.createClinicalUnit → ClinicalStructureService.createClinicalUnit → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:57` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateClinicalUnitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `parentUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad padre (misma sede) | `src/modules/practice/dto/create-clinical-unit.dto.ts:21` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único dentro de la sede | `src/modules/practice/dto/create-clinical-unit.dto.ts:33` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre de la unidad | `src/modules/practice/dto/create-clinical-unit.dto.ts:42` |
| `unitTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de unidad | `src/modules/practice/dto/create-clinical-unit.dto.ts:53` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de especialidad | `src/modules/practice/dto/create-clinical-unit.dto.ts:64` |
| `serviceModeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de modo de servicio | `src/modules/practice/dto/create-clinical-unit.dto.ts:75` |

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
  "parentUnitId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "unitTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceModeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ClinicalUnitResponseDto>` · DTO `ClinicalUnitResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:76` |
| `practiceSiteId` | `string` | Sí | — | — | Identificador asociado a practice site. | `src/modules/practice/dto/responses.dto.ts:80` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:84` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:88` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una unidad con ese código en el sitio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sitio no está activo; PreconditionFailedException: La unidad padre no pertenece al sitio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `UC-14-04`

---

