<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `practice`

- **Bloque:** Práctica y Agenda (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)
- **Operaciones:** 83 (83 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 26 · MEDIO 16 · BAJO 41
- **Tablas distintas que tocan:** 61
- **Respuestas de error y detalle contractual:** `openapi/endpoints/practice.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/accreditations/{id}/verify` | Verificar o caducar una acreditación (transición de estado) | BAJO | 2 | SECURITY_ADMIN |
| 2 | POST | `/care-space-blocks/{id}/cancel` | Cancelar un bloqueo | ALTO | 6 | sesión (sin roles) |
| 3 | POST | `/care-space-blocks/{id}/end` | Terminar un bloqueo | ALTO | 10 | sesión (sin roles) |
| 4 | GET | `/care-spaces/{id}` | Ficha de un espacio de atención | BAJO | 3 | sesión (sin roles) |
| 5 | PATCH | `/care-spaces/{id}` | Editar un espacio de atención | ALTO | 11 | sesión (sin roles) |
| 6 | POST | `/care-spaces/{id}/availability` | Cambiar la disponibilidad de un espacio | ALTO | 25 | sesión (sin roles) |
| 7 | GET | `/care-spaces/{id}/blocks` | Bloqueos de un espacio | BAJO | 8 | sesión (sin roles) |
| 8 | GET | `/care-spaces/{id}/equipment` | Equipos ubicados en un espacio (F5a) | BAJO | 11 | sesión (sin roles) |
| 9 | GET | `/care-spaces/{id}/history` | Historial de un espacio de atención | BAJO | 3 | sesión (sin roles) |
| 10 | POST | `/care-spaces/{id}/hygiene` | Marcar un espacio sucio o contaminado | ALTO | 19 | sesión (sin roles) |
| 11 | POST | `/care-spaces/{id}/isolation` | Cambiar el aislamiento de un espacio | ALTO | 22 | sesión (sin roles) |
| 12 | POST | `/care-spaces/{id}/lifecycle` | Cambiar el ciclo de vida de un espacio | ALTO | 20 | sesión (sin roles) |
| 13 | POST | `/care-spaces/{id}/move` | Mover un espacio de atención | BAJO | 7 | sesión (sin roles) |
| 14 | GET | `/care-spaces/{id}/operational-state` | Estado operativo de un espacio | BAJO | 16 | sesión (sin roles) |
| 15 | GET | `/care-spaces/{id}/retire-check` | Bloqueos para retirar un espacio | BAJO | 13 | sesión (sin roles) |
| 16 | GET | `/care-spaces/{id}/status-events` | Historial de estados de un espacio (A20) | BAJO | 8 | sesión (sin roles) |
| 17 | GET | `/care-spaces/{id}/stock` | Stock ubicado en un espacio (F5c) | BAJO | 14 | sesión (sin roles) |
| 18 | POST | `/care-spaces/{id}/unit-assignments` | Vincular un espacio a una unidad clínica | ALTO | 7 | sesión (sin roles) |
| 19 | DELETE | `/care-spaces/{id}/unit-assignments/{assignmentId}` | Desvincular un espacio de una unidad clínica | ALTO | 6 | sesión (sin roles) |
| 20 | POST | `/cleaning-orders/{id}/assign` | Asignar una orden de limpieza | BAJO | 1 | sesión (sin roles) |
| 21 | POST | `/cleaning-orders/{id}/cancel` | Cancelar una orden de limpieza | BAJO | 0 | sesión (sin roles) |
| 22 | POST | `/cleaning-orders/{id}/finish` | Terminar una orden de limpieza | BAJO | 0 | sesión (sin roles) |
| 23 | POST | `/cleaning-orders/{id}/inspect` | Inspeccionar una limpieza | BAJO | 0 | sesión (sin roles) |
| 24 | POST | `/cleaning-orders/{id}/start` | Iniciar una orden de limpieza | BAJO | 0 | sesión (sin roles) |
| 25 | GET | `/clinical-units/{id}` | Ficha de una unidad clínica | BAJO | 4 | sesión (sin roles) |
| 26 | PATCH | `/clinical-units/{id}` | Editar una unidad clínica | BAJO | 6 | sesión (sin roles) |
| 27 | POST | `/clinical-units/{id}/lifecycle` | Cambiar el ciclo de vida de una unidad clínica | ALTO | 10 | sesión (sin roles) |
| 28 | POST | `/internal/practice/blocks-tick` | Aplicar bloqueos programados y avisar vencidos (worker) | MEDIO | 7 | SYSTEM, SYSTEM_WORKER |
| 29 | POST | `/inventory-items/{itemId}/movements` | Registrar un movimiento de inventario (ajuste de stock) | MEDIO | 3 | SECURITY_ADMIN |
| 30 | GET | `/practice/infrastructure-access/me` | Acceso del actor a la infraestructura del tenant activo | BAJO | 7 | sesión (sin roles) |
| 31 | GET | `/practice/infrastructure-catalog` | Catálogo de infraestructura hospitalaria | BAJO | 2 | sesión (sin roles) |
| 32 | GET | `/practices` | Listar las prácticas activas del tenant | BAJO | 3 | sesión (sin roles) |
| 33 | POST | `/practices` | Dar de alta una práctica (organización raíz) | MEDIO | 2 | SECURITY_ADMIN |
| 34 | POST | `/practices/{practiceId}/accreditations` | Registrar una acreditación con evidencia | MEDIO | 2 | SECURITY_ADMIN |
| 35 | GET | `/practices/{practiceId}/healthcare-services` | Listar los procedimientos que ofrecen las sedes de la práctica | BAJO | 6 | sesión (sin roles) |
| 36 | POST | `/practices/{practiceId}/healthcare-services` | Publicar un procedimiento del nomenclador en una sede | ALTO | 7 | sesión (sin roles) |
| 37 | PATCH | `/practices/{practiceId}/healthcare-services/{id}` | Actualizar el precio o el estado de un procedimiento de la sede | ALTO | 7 | sesión (sin roles) |
| 38 | POST | `/practices/{practiceId}/inventory-items` | Dar de alta un insumo de inventario de práctica | MEDIO | 1 | SECURITY_ADMIN |
| 39 | GET | `/practices/{practiceId}/organization` | Consola de organización médica: estructura, plantilla y legajo | BAJO | 9 | SECURITY_ADMIN, PERIOP_ADMIN, SURGERY_SCHEDULER, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER |
| 40 | GET | `/practices/{practiceId}/role-assignments` | Listar las vinculaciones profesional-organización de la práctica | BAJO | 3 | sesión (sin roles) |
| 41 | POST | `/practices/{practiceId}/role-assignments` | Asignar un rol de profesional a sitio/unidad/servicio | MEDIO | 4 | SECURITY_ADMIN |
| 42 | POST | `/practices/{practiceId}/role-assignments/invitations` | Invitar a un profesional a procedimientos de una sede | ALTO | 7 | sesión (sin roles) |
| 43 | POST | `/practices/{practiceId}/role-assignments/self-request` | Solicitar la propia vinculación a una organización | MEDIO | 5 | PRACTITIONER |
| 44 | PUT | `/practices/{practiceId}/settings/{settingKey}` | Configurar un ajuste de práctica (upsert) | MEDIO | 3 | SECURITY_ADMIN |
| 45 | GET | `/practices/{practiceId}/sites` | Listar las sedes de una práctica | BAJO | 3 | sesión (sin roles) |
| 46 | POST | `/practices/{practiceId}/sites` | Dar de alta un sitio de práctica | ALTO | 4 | sesión (sin roles) |
| 47 | DELETE | `/practices/{practiceId}/sites/{siteId}` | Desmantelar un sitio en cascada (soft-delete) | ALTO | 12 | sesión (sin roles) |
| 48 | GET | `/practitioners/{profileId}/sites` | Consultorios donde atiende el profesional | BAJO | 5 | SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT |
| 49 | GET | `/practitioners/me/role-assignments` | Mis vinculaciones con organizaciones | BAJO | 3 | PRACTITIONER |
| 50 | POST | `/practitioners/me/role-assignments/{roleId}/accept` | Aceptar una invitación de un centro | MEDIO | 2 | PRACTITIONER |
| 51 | POST | `/practitioners/me/role-assignments/{roleId}/decline` | Declinar una invitación de un centro | MEDIO | 2 | PRACTITIONER |
| 52 | POST | `/practitioners/me/sites` | Registrar un consultorio propio | MEDIO | 10 | PRACTITIONER, CLINICIAN |
| 53 | DELETE | `/practitioners/me/sites/{siteId}` | Retirar un consultorio propio | MEDIO | 4 | PRACTITIONER, CLINICIAN |
| 54 | PATCH | `/practitioners/me/sites/{siteId}` | Corregir un consultorio propio | MEDIO | 9 | PRACTITIONER, CLINICIAN |
| 55 | PUT | `/practitioners/me/sites/{siteId}/bank-qr` | Fijar o quitar el QR bancario de una sede | BAJO | 6 | PRACTITIONER, CLINICIAN |
| 56 | PUT | `/practitioners/me/sites/{siteId}/contact-phone` | Guardar o quitar mi teléfono en una sede | MEDIO | 7 | PRACTITIONER, CLINICIAN |
| 57 | PUT | `/practitioners/me/sites/{siteId}/logo` | Fijar o quitar el logo del consultorio propio | MEDIO | 9 | PRACTITIONER, CLINICIAN |
| 58 | POST | `/role-assignments/{roleId}/approve` | Aprobar una vinculación pendiente | BAJO | 3 | sesión (sin roles) |
| 59 | POST | `/role-assignments/{roleId}/end` | Finalizar una vinculación | BAJO | 3 | SECURITY_ADMIN |
| 60 | POST | `/role-assignments/{roleId}/reject` | Rechazar una vinculación pendiente | BAJO | 3 | sesión (sin roles) |
| 61 | POST | `/role-assignments/{roleId}/support-assignments` | Adjuntar personal de apoyo a un rol de profesional | MEDIO | 3 | SECURITY_ADMIN |
| 62 | POST | `/role-assignments/{roleId}/suspend` | Suspender una vinculación activa | BAJO | 3 | SECURITY_ADMIN |
| 63 | PATCH | `/site-licenses/{id}` | Editar una habilitación del establecimiento | ALTO | 4 | sesión (sin roles) |
| 64 | GET | `/sites/{siteId}/bed-board` | Tablero de camas de una sede | BAJO | 15 | sesión (sin roles) |
| 65 | GET | `/sites/{siteId}/capacity` | Capacidad declarada vs. derivada del establecimiento | BAJO | 5 | sesión (sin roles) |
| 66 | GET | `/sites/{siteId}/care-spaces` | Listar los espacios de atención de la sede | BAJO | 3 | SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN |
| 67 | POST | `/sites/{siteId}/care-spaces` | Crear un espacio de atención bajo una unidad/sitio | ALTO | 8 | sesión (sin roles) |
| 68 | POST | `/sites/{siteId}/care-spaces/bulk` | Alta masiva de espacios por patrón | ALTO | 8 | sesión (sin roles) |
| 69 | POST | `/sites/{siteId}/care-spaces/import` | Importar espacios (dryRun=true valida sin escribir) | ALTO | 8 | sesión (sin roles) |
| 70 | GET | `/sites/{siteId}/cleaning-orders` | Cola de limpieza de una sede | BAJO | 9 | sesión (sin roles) |
| 71 | POST | `/sites/{siteId}/cleaning-orders` | Crear una orden de limpieza | ALTO | 14 | sesión (sin roles) |
| 72 | GET | `/sites/{siteId}/clinical-units` | Listar las unidades clínicas de la sede | BAJO | 3 | sesión (sin roles) |
| 73 | POST | `/sites/{siteId}/clinical-units` | Crear una unidad clínica jerárquica | ALTO | 5 | sesión (sin roles) |
| 74 | POST | `/sites/{siteId}/declared-capacities` | Declarar capacidad del establecimiento | ALTO | 6 | sesión (sin roles) |
| 75 | GET | `/sites/{siteId}/diagnostic-equipment` | Equipos diagnósticos de una sede (F5a) | BAJO | 11 | sesión (sin roles) |
| 76 | GET | `/sites/{siteId}/licenses` | Habilitaciones del establecimiento | BAJO | 3 | sesión (sin roles) |
| 77 | POST | `/sites/{siteId}/licenses` | Registrar una habilitación del establecimiento | ALTO | 6 | sesión (sin roles) |
| 78 | GET | `/sites/{siteId}/regulatory` | Datos regulatorios del establecimiento | BAJO | 5 | sesión (sin roles) |
| 79 | PATCH | `/sites/{siteId}/regulatory` | Editar los datos regulatorios del establecimiento | ALTO | 6 | sesión (sin roles) |
| 80 | POST | `/sites/{siteId}/regulatory/verify-snis` | Verificar el código SNIS del establecimiento (plataforma) | ALTO | 6 | sesión (sin roles) |
| 81 | GET | `/sites/{siteId}/sample-collection-points` | Puntos de toma de muestra de una sede (F5b) | BAJO | 12 | sesión (sin roles) |
| 82 | GET | `/sites/{siteId}/structure` | Estructura de la sede (espacios, unidades, vínculos) | BAJO | 6 | sesión (sin roles) |
| 83 | POST | `/tenants/{tenantId}/practices` | Crear la práctica y la primera sede de una organización | ALTO | 7 | sesión (sin roles) |

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

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:147`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /accreditations/{id}/verify` la atiende `AccreditationsController.verify` (src/modules/practice/controllers/accreditations.controller.ts:35). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `VerifyAccreditationDto` (1 campo, 0 obligatorios). Delega en `PracticeAccreditationsService.verify`. Lee practice.practice_accreditations, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/accreditations.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/accreditations.controller.ts:35` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:57` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:61` |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:65` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:69` |

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

## 2. POST /care-space-blocks/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar un bloqueo
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.cancelBlock` — `src/modules/practice/controllers/care-space-ops.controller.ts:207`

### Qué es y para qué sirve (negocio)

Cancelar un bloqueo. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-space-blocks/{id}/cancel` la atiende `CareSpaceOpsController.cancelBlock` (src/modules/practice/controllers/care-space-ops.controller.ts:207). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CancelBlockDto` (1 campo, 1 obligatorio). Delega en `CareSpaceOpsService.cancelBlock`. Crea filas en practice.care_space_status_events. Actualiza practice.care_spaces. Lee clinical.encounter_locations, practice.care_space_blocks, practice.care_spaces, practice.practice_settings. Hay 2 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:207` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:207` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.cancelBlock → CareSpaceOpsService.cancelBlock → CancelBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | CareSpaceOpsController.cancelBlock → CareSpaceOpsService.cancelBlock → CancelBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.cancelBlock → CareSpaceOpsService.cancelBlock → CancelBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | CareSpaceOpsController.cancelBlock → CareSpaceOpsService.cancelBlock → CancelBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | CareSpaceOpsController.cancelBlock → CareSpaceOpsService.cancelBlock → CancelBlockUseCase.execute → CareSpaceOpsCore.lock | `src/modules/practice/services/ops/care-space-ops-core.ts:171` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.cancelBlock → CareSpaceOpsService.cancelBlock → CancelBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelBlockDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:100` |

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

### Respuesta — `Promise<CareSpaceBlockDto>` · DTO `CareSpaceBlockDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:441` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:442` |
| `kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:443` |
| `reasonCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:444` |
| `reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:445` |
| `startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:446` |
| `expectedEndAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:448` |
| `endedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:449` |
| `cancelledAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:452` |
| `endNote` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:453` |
| `cancelReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:454` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:455` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:460` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /care-space-blocks/{id}/end

- **Origen:** CONTRATO
- **Nombre:** Terminar un bloqueo
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.endBlock` — `src/modules/practice/controllers/care-space-ops.controller.ts:184`

### Qué es y para qué sirve (negocio)

Terminar un bloqueo. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-space-blocks/{id}/end` la atiende `CareSpaceOpsController.endBlock` (src/modules/practice/controllers/care-space-ops.controller.ts:184). Exige sesión; el controlador no declara roles. Valida el cuerpo como `EndBlockDto` (1 campo, 0 obligatorios). Delega en `CareSpaceOpsService.endBlock`. Crea filas en practice.care_space_status_events, practice.cleaning_orders. Actualiza practice.care_space_blocks, practice.care_spaces, practice.cleaning_orders. Lee clinical.encounter_locations, practice.care_space_blocks, practice.care_spaces, practice.cleaning_orders, practice.practice_settings. Hay 6 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:184` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `practice.care_space_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → ChangeAvailabilityUseCase.endBlock | `src/modules/practice/services/ops/use-cases/change-availability.use-case.ts:291` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → CareSpaceOpsCore.lock | `src/modules/practice/services/ops/care-space-ops-core.ts:171` |
| `practice.cleaning_orders` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → CareSpaceOpsCore.openCleaningOrder | `src/modules/practice/services/ops/care-space-ops-core.ts:502` |
| `practice.cleaning_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone | `src/modules/practice/services/ops/care-space-ops-core.ts:573` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.endBlock → CareSpaceOpsService.endBlock → EndBlockUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EndBlockDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:91` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` · DTO `CareSpaceBlockDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:441` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:442` |
| `kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:443` |
| `reasonCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:444` |
| `reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:445` |
| `startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:446` |
| `expectedEndAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:448` |
| `endedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:449` |
| `cancelledAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:452` |
| `endNote` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:453` |
| `cancelReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:454` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:455` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:460` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:303` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /care-spaces/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un espacio de atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.detail` — `src/modules/practice/controllers/care-spaces.controller.ts:62`

### Qué es y para qué sirve (negocio)

Ficha de un espacio de atención. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}` la atiende `CareSpacesController.detail` (src/modules/practice/controllers/care-spaces.controller.ts:62). Exige sesión; el controlador no declara roles. Delega en `InfrastructureReadService.spaceDetail`. Lee directory.tenant_memberships, practice.care_spaces, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-spaces.controller.ts:62` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.detail → InfrastructureReadService.spaceDetail → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.detail → InfrastructureReadService.spaceDetail → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpacesController.detail → InfrastructureReadService.spaceDetail → SpaceUnitAssignmentsRepository.findCurrentBySpaces | `src/modules/practice/repositories/space-unit-assignments.repository.ts:43` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CareSpaceDetailDto>` · DTO `CareSpaceDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `form.code` | `string` | Sí | — | — | — | sin fuente |
| `form.display` | `string` | Sí | — | — | — | sin fuente |
| `function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `function.code` | `string` | Sí | — | — | — | sin fuente |
| `function.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:224` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:225` |
| `floorNumber` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:226` |
| `areaM2` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:227` |
| `asepsis` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:229` |
| `asepsis.code` | `string` | Sí | — | — | — | sin fuente |
| `asepsis.display` | `string` | Sí | — | — | — | sin fuente |
| `pressure` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:231` |
| `pressure.code` | `string` | Sí | — | — | — | sin fuente |
| `pressure.display` | `string` | Sí | — | — | — | sin fuente |
| `airChangesPerHour` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:232` |
| `hvacValidatedOn` | `object` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:234` |
| `sexRestriction` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:237` |
| `sexRestriction.code` | `string` | Sí | — | — | — | sin fuente |
| `sexRestriction.display` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:239` |
| `ageGroup.code` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup.display` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:241` |
| `bedCategory.code` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory.display` | `string` | Sí | — | — | — | sin fuente |
| `censable` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:242` |
| `gln` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:243` |
| `prepMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:244` |
| `cleanupMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:245` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:247` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:249` |
| `path` | `array<SpacePathStepDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:250` |
| `path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:209` |
| `path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:210` |
| `path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:211` |
| `path[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:212` |
| `path[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `path[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children` | `array<CareSpaceNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:251` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `children[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `children[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `children[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `children[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `children[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:253` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |
| `derived` | `SpaceDerivedDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:254` |
| `derived.beds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:217` |
| `derived.censableBeds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:218` |
| `derived.activeChildren` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:219` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:240` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. PATCH /care-spaces/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar un espacio de atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.update` — `src/modules/practice/controllers/care-spaces.controller.ts:73`

### Qué es y para qué sirve (negocio)

Editar un espacio de atención. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /care-spaces/{id}` la atiende `CareSpacesController.update` (src/modules/practice/controllers/care-spaces.controller.ts:73). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateCareSpaceDto` (20 campos, 0 obligatorios). Delega en `CareSpacesAdminService.update`. Crea filas en practice.care_space_category_periods. Actualiza practice.care_space_category_periods. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_space_category_periods, practice.care_spaces, practice.clinical_units, practice.facility_typology_rules, practice.practice_sites, practice.space_form_parent_rules y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-spaces.controller.ts:73` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_category_periods` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.rollCategoryPeriod | `src/modules/practice/services/care-spaces-admin.service.ts:665` |
| `practice.care_space_category_periods` | ESCRIBE | CREA | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.rollCategoryPeriod | `src/modules/practice/services/care-spaces-admin.service.ts:671` |
| `practice.care_space_category_periods` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.rollCategoryPeriod | `src/modules/practice/services/care-spaces-admin.service.ts:659` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.sameSiteUnit → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.loadRules → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.writableSpace → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_form_parent_rules` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.loadRules → StructureRulesRepository.parentRules | `src/modules/practice/repositories/structure-rules.repository.ts:28` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpacesController.update → CareSpacesAdminService.update → CareSpacesAdminService.detail → SpaceUnitAssignmentsRepository.findCurrentBySpaces | `src/modules/practice/repositories/space-unit-assignments.repository.ts:43` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion leída (3, "3" o W/"3"). Ausente o distinta: 412 |

### Cuerpo — DTO `UpdateCareSpaceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `description` | `string` | No | longitud máxima 1000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción libre | `src/modules/practice/dto/care-space-attributes.dto.ts:31` |
| `capacity` | `number` | No | mínimo 0; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` | Capacidad (nº de plazas) | `src/modules/practice/dto/care-space-attributes.dto.ts:42` |
| `floorNumber` | `number` | No | mínimo -20; máximo 300; admite null | `@IsOptional()` `@IsInt()` `@Min(-20)` `@Max(300)` | Piso (negativo = subsuelo) | `src/modules/practice/dto/care-space-attributes.dto.ts:53` |
| `areaM2` | `number` | No | mínimo 0; máximo 99999999; admite null | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(99999999)` | Superficie útil en m² | `src/modules/practice/dto/care-space-attributes.dto.ts:65` |
| `asepsisCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Asepsia (ASEPSIS_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:74` |
| `pressureCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Presión relativa (PRESSURE_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:83` |
| `airChangesPerHour` | `number` | No | mínimo 0; máximo 9999; admite null | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(9999)` | Renovaciones de aire por hora (ACH) | `src/modules/practice/dto/care-space-attributes.dto.ts:94` |
| `hvacValidatedOn` | `string` | No | formato date; patrón runtime /^\d{4}-\d{2}-\d{2}$/; admite null | `@IsOptional()` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | Fecha de validación HVAC (YYYY-MM-DD) | `src/modules/practice/dto/care-space-attributes.dto.ts:104` |
| `sexRestrictionCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Restricción de sexo (SEX_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:113` |
| `ageGroupCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Grupo etario (AGE_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:122` |
| `bedCategoryCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Categoría de cama (BED_CAT_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:131` |
| `censable` | `boolean` | No | admite null | `@IsOptional()` `@IsBoolean()` | Cama censable (cuenta para el censo) | `src/modules/practice/dto/care-space-attributes.dto.ts:140` |
| `prepMinutes` | `number` | No | mínimo 0; máximo 1440; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(1440)` | Minutos de preparación | `src/modules/practice/dto/care-space-attributes.dto.ts:152` |
| `cleanupMinutes` | `number` | No | mínimo 0; máximo 1440; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(1440)` | Minutos de limpieza | `src/modules/practice/dto/care-space-attributes.dto.ts:164` |
| `gln` | `string` | No | patrón runtime /^\d{13}$/; admite null | `@IsOptional()` `@Matches(/^\d{13}$/)` | GS1 GLN (13 dígitos) | `src/modules/practice/dto/care-space-attributes.dto.ts:173` |
| `code` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código: sólo mientras el espacio está PLANNED | `src/modules/practice/dto/infrastructure.dto.ts:112` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre | `src/modules/practice/dto/infrastructure.dto.ts:119` |
| `formCode` | `string` | No | — | `@IsOptional()` `@IsString()` | Forma: sólo mientras el espacio está PLANNED | `src/modules/practice/dto/infrastructure.dto.ts:126` |
| `functionCode` | `string` | No | — | `@IsOptional()` `@IsString()` | Función (valida perfil y tipología) | `src/modules/practice/dto/infrastructure.dto.ts:131` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | Unidad clínica principal (misma sede); null la quita | `src/modules/practice/dto/infrastructure.dto.ts:141` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "description": "Texto descriptivo de ejemplo",
  "capacity": 1,
  "floorNumber": 1,
  "areaM2": 1,
  "asepsisCode": "CODIGO_EJEMPLO",
  "pressureCode": "CODIGO_EJEMPLO",
  "airChangesPerHour": 1,
  "hvacValidatedOn": "2026-07-31",
  "sexRestrictionCode": "CODIGO_EJEMPLO",
  "ageGroupCode": "CODIGO_EJEMPLO",
  "bedCategoryCode": "CODIGO_EJEMPLO",
  "censable": true,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "gln": "valor-ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CareSpaceDetailDto>` · DTO `CareSpaceDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `form.code` | `string` | Sí | — | — | — | sin fuente |
| `form.display` | `string` | Sí | — | — | — | sin fuente |
| `function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `function.code` | `string` | Sí | — | — | — | sin fuente |
| `function.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:224` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:225` |
| `floorNumber` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:226` |
| `areaM2` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:227` |
| `asepsis` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:229` |
| `asepsis.code` | `string` | Sí | — | — | — | sin fuente |
| `asepsis.display` | `string` | Sí | — | — | — | sin fuente |
| `pressure` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:231` |
| `pressure.code` | `string` | Sí | — | — | — | sin fuente |
| `pressure.display` | `string` | Sí | — | — | — | sin fuente |
| `airChangesPerHour` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:232` |
| `hvacValidatedOn` | `object` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:234` |
| `sexRestriction` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:237` |
| `sexRestriction.code` | `string` | Sí | — | — | — | sin fuente |
| `sexRestriction.display` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:239` |
| `ageGroup.code` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup.display` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:241` |
| `bedCategory.code` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory.display` | `string` | Sí | — | — | — | sin fuente |
| `censable` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:242` |
| `gln` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:243` |
| `prepMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:244` |
| `cleanupMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:245` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:247` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:249` |
| `path` | `array<SpacePathStepDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:250` |
| `path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:209` |
| `path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:210` |
| `path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:211` |
| `path[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:212` |
| `path[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `path[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children` | `array<CareSpaceNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:251` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `children[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `children[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `children[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `children[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `children[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:253` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |
| `derived` | `SpaceDerivedDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:254` |
| `derived.beds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:217` |
| `derived.censableBeds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:218` |
| `derived.activeChildren` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:219` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:321` |
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:267` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /care-spaces/{id}/availability

- **Origen:** CONTRATO
- **Nombre:** Cambiar la disponibilidad de un espacio
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.changeAvailability` — `src/modules/practice/controllers/care-space-ops.controller.ts:140`

### Qué es y para qué sirve (negocio)

Cambiar la disponibilidad de un espacio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-spaces/{id}/availability` la atiende `CareSpaceOpsController.changeAvailability` (src/modules/practice/controllers/care-space-ops.controller.ts:140). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AvailabilityChangeDto` (7 campos, 1 obligatorio). Delega en `CareSpaceOpsService.changeAvailability`. Crea filas en practice.care_space_blocks, practice.care_space_status_events. Actualiza practice.care_space_blocks, practice.care_spaces. Lee clinical.appointments, clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_blocks, practice.care_space_status_events y 13 más. Hay 4 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:140` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match-Ops (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:140` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.appointments` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsRepository.futureCommitments | `src/modules/practice/repositories/care-space-ops.repository.ts:308` |
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `clinical.encounters` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_blocks` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute | `src/modules/practice/services/ops/use-cases/change-availability.use-case.ts:194` |
| `practice.care_space_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → ChangeAvailabilityUseCase.endBlock | `src/modules/practice/services/ops/use-cases/change-availability.use-case.ts:291` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_space_status_events` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.lastEventBySpace | `src/modules/practice/repositories/care-space-ops.repository.ts:373` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → OpsCellBuilder.cellFor | `src/modules/practice/services/ops/ops-cell-builder.ts:155` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsRepository.futureCommitments | `src/modules/practice/repositories/care-space-ops.repository.ts:308` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.persons` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsRepository.futureCommitments | `src/modules/practice/repositories/care-space-ops.repository.ts:308` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsRepository.futureCommitments | `src/modules/practice/repositories/care-space-ops.repository.ts:308` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeAvailability → CareSpaceOpsService.changeAvailability → ChangeAvailabilityUseCase.execute → CareSpaceOpsRepository.futureCommitments | `src/modules/practice/repositories/care-space-ops.repository.ts:308` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match-Ops` | header | Sí | `string` | opsVersion leída (3, "3" o W/"3"). Ausente: 428; distinta: 412 OPS_VERSION_MISMATCH |

### Cuerpo — DTO `AvailabilityChangeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `string` | Sí | valores: block, unblock, start-maintenance, close, reopen | `@IsIn([...ACTIONS])` | — | `src/modules/practice/dto/care-space-ops.dto.ts:37` |
| `kindCode` | `string` | No | valores: BLOCK_CLINICAL, BLOCK_ADMIN | `@IsOptional()` `@IsString()` | Sólo para `block` (por defecto BLOCK_CLINICAL) | `src/modules/practice/dto/care-space-ops.dto.ts:45` |
| `reasonCode` | `string` | No | valores: BLOCK_RSN_STAFF_SHORTAGE, BLOCK_RSN_ISOLATION_COHORT, BLOCK_RSN_PATIENT_CONDITION, BLOCK_RSN_EQUIPMENT_FAILURE, BLOCK_RSN_PREVENTIVE_MAINTENANCE, BLOCK_RSN_INFRASTRUCTURE, BLOCK_RSN_PEST_CONTROL, BLOCK_RSN_ADMIN_DECISION, BLOCK_RSN_OTHER | `@IsOptional()` `@IsString()` | — | `src/modules/practice/dto/care-space-ops.dto.ts:50` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:56` |
| `startsAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Por defecto, ahora | `src/modules/practice/dto/care-space-ops.dto.ts:65` |
| `expectedEndAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Obligatoria en mantenimiento | `src/modules/practice/dto/care-space-ops.dto.ts:74` |
| `acknowledgeConflicts` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Confirmar el bloqueo aunque haya compromisos futuros en la ventana | `src/modules/practice/dto/care-space-ops.dto.ts:82` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "action": "block"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "action": "block",
  "kindCode": "BLOCK_CLINICAL",
  "reasonCode": "BLOCK_RSN_STAFF_SHORTAGE",
  "reasonText": "Texto descriptivo de ejemplo",
  "startsAt": "2026-07-31T12:00:00.000Z",
  "expectedEndAt": "2026-07-31T12:00:00.000Z",
  "acknowledgeConflicts": true
}
```

</details>

### Respuesta — `Promise<AvailabilityResultDto>` · DTO `AvailabilityResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cell` | `BedBoardCellDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:557` |
| `cell.id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:371` |
| `cell.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:372` |
| `cell.name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:373` |
| `cell.path` | `array<SpacePathItemDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:374` |
| `cell.path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:309` |
| `cell.path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:310` |
| `cell.path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:311` |
| `cell.path[].form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:312` |
| `cell.form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:375` |
| `cell.function` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:376` |
| `cell.lifecycle` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:377` |
| `cell.availability` | `AvailabilityAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:379` |
| `cell.availability.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:317` |
| `cell.availability.reasonCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:318` |
| `cell.availability.reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:319` |
| `cell.availability.expectedUntil` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:321` |
| `cell.availability.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:323` |
| `cell.hygiene` | `HygieneAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:380` |
| `cell.hygiene.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:328` |
| `cell.hygiene.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:330` |
| `cell.hygiene.terminalRequired` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:331` |
| `cell.isolation` | `IsolationAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:381` |
| `cell.isolation.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:336` |
| `cell.isolation.organism` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:337` |
| `cell.isolation.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:340` |
| `cell.occupancy` | `OccupancyAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:382` |
| `cell.occupancy.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:352` |
| `cell.occupancy.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:354` |
| `cell.occupancy.encounterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:356` |
| `cell.occupancy.patient` | `BedPatientDto` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:358` |
| `cell.occupancy.patient.initials` | `string` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:345` |
| `cell.occupancy.patient.sexCode` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:346` |
| `cell.occupancy.patient.ageYears` | `number` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:347` |
| `cell.occupancy.encounterLocationId` | `string` | No | formato uuid; admite null | — | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `src/modules/practice/dto/care-space-ops.dto.ts:366` |
| `cell.v2Code` | `string` | Sí | valores: C, H, I, K, O, U, R | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:383` |
| `cell.assignable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:384` |
| `cell.openCleaningOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:386` |
| `cell.lastEventAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:388` |
| `cell.opsVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:389` |
| `cell.unitId` | `string` | Sí | formato uuid; admite null | — | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `src/modules/practice/dto/care-space-ops.dto.ts:397` |
| `cell.actions` | `array<string>` | Sí | — | — | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:403` |
| `blockId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:558` |
| `conflicts` | `array<string>` | No | — | — | Compromisos en la ventana (con acknowledgeConflicts) | `src/modules/practice/dto/care-space-ops.dto.ts:563` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:568` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action}; Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5b.int-spec.ts:81` |
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:230` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /care-spaces/{id}/blocks

- **Origen:** CONTRATO
- **Nombre:** Bloqueos de un espacio
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.blocks` — `src/modules/practice/controllers/care-space-ops.controller.ts:165`

### Qué es y para qué sirve (negocio)

Bloqueos de un espacio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}/blocks` la atiende `CareSpaceOpsController.blocks` (src/modules/practice/controllers/care-space-ops.controller.ts:165). Exige sesión; el controlador no declara roles. Delega en `BedBoardReadService.blocks`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_blocks, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:165` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:165` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.blocks → BedBoardReadService.blocks → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocks → BedBoardReadService.blocks → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocks → BedBoardReadService.blocks → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocks → BedBoardReadService.blocks → CareSpaceOpsRepository.blocks | `src/modules/practice/repositories/care-space-ops.repository.ts:242` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocks → BedBoardReadService.blocks → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocks → BedBoardReadService.blocks → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocks → BedBoardReadService.blocks → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.blocks → BedBoardReadService.blocks → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `includeEnded` | query | No | `boolean` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CareSpaceBlockDto[]>` · DTO `CareSpaceBlockDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:441` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:442` |
| `kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:443` |
| `reasonCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:444` |
| `reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:445` |
| `startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:446` |
| `expectedEndAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:448` |
| `endedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:449` |
| `cancelledAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:452` |
| `endNote` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:453` |
| `cancelReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:454` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:455` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:460` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /care-spaces/{id}/equipment

- **Origen:** CONTRATO
- **Nombre:** Equipos ubicados en un espacio (F5a)
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SpaceAssetsController.spaceEquipment` — `src/modules/practice/controllers/space-assets.controller.ts:31`

### Qué es y para qué sirve (negocio)

Equipos ubicados en un espacio (F5a). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}/equipment` la atiende `SpaceAssetsController.spaceEquipment` (src/modules/practice/controllers/space-assets.controller.ts:31). Exige sesión; el controlador no declara roles. Delega en `SpaceAssetsReadService.spaceEquipment`. Lee delegated_access.organization_user_assignments, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/space-assets.controller.ts:31` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/space-assets.controller.ts:31` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SpaceAssetsController.spaceEquipment → SpaceAssetsReadService.spaceEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |

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
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SpaceAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /care-spaces/{id}/history

- **Origen:** CONTRATO
- **Nombre:** Historial de un espacio de atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.history` — `src/modules/practice/controllers/care-spaces.controller.ts:138`

### Qué es y para qué sirve (negocio)

Historial de un espacio de atención. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}/history` la atiende `CareSpacesController.history` (src/modules/practice/controllers/care-spaces.controller.ts:138). Exige sesión; el controlador no declara roles. Delega en `InfrastructureReadService.spaceHistory`. Lee directory.tenant_memberships, iam.users, practice.care_spaces. Hay 1 llamada cuyo destino depende de un dato en tiempo de ejecución y no se siguió.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:138` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-spaces.controller.ts:138` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.history → InfrastructureReadService.spaceHistory → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `iam.users` | LEE | LEE | POR_SQL | CareSpacesController.history → InfrastructureReadService.spaceHistory | `src/modules/practice/services/infrastructure-read.service.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.history → InfrastructureReadService.spaceHistory → StructureAccessService.requireSpace → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.historyRepo.timeline (entidad según argumento no literal)` — `src/modules/practice/services/infrastructure-read.service.ts:180`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SpaceHistoryEntryDto[]>` · DTO `SpaceHistoryEntryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | `<careSpaceId>:<revisionNo>` | `src/modules/practice/dto/infrastructure-responses.dto.ts:439` |
| `at` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:440` |
| `action` | `string` | Sí | — | — | created \| updated \| moved \| activate \| suspend \| reactivate \| retire | `src/modules/practice/dto/infrastructure-responses.dto.ts:445` |
| `actorName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:446` |
| `reason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:447` |
| `summary` | `string` | Sí | — | — | Campos que cambiaron respecto de la revisión anterior | `src/modules/practice/dto/infrastructure-responses.dto.ts:451` |
| `rowVersion` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:452` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /care-spaces/{id}/hygiene

- **Origen:** CONTRATO
- **Nombre:** Marcar un espacio sucio o contaminado
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.changeHygiene` — `src/modules/practice/controllers/care-space-ops.controller.ts:230`

### Qué es y para qué sirve (negocio)

Marcar un espacio sucio o contaminado. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-spaces/{id}/hygiene` la atiende `CareSpaceOpsController.changeHygiene` (src/modules/practice/controllers/care-space-ops.controller.ts:230). Exige sesión; el controlador no declara roles. Valida el cuerpo como `HygieneActionDto` (2 campos, 1 obligatorio). Delega en `CareSpaceOpsService.changeHygiene`. Crea filas en practice.care_space_status_events, practice.cleaning_orders. Actualiza practice.care_spaces, practice.cleaning_orders. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_status_events, practice.care_spaces, practice.cleaning_orders y 7 más. Hay 9 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:230` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match-Ops (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:230` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `clinical.encounters` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_space_status_events` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.lastEventBySpace | `src/modules/practice/repositories/care-space-ops.repository.ts:373` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.cleaning_orders` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → CareSpaceOpsCore.openCleaningOrder | `src/modules/practice/services/ops/care-space-ops-core.ts:502` |
| `practice.cleaning_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone | `src/modules/practice/services/ops/care-space-ops-core.ts:573` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → OpsCellBuilder.cellFor | `src/modules/practice/services/ops/ops-cell-builder.ts:155` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.persons` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeHygiene → CareSpaceOpsService.changeHygiene → ChangeHygieneUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match-Ops` | header | Sí | `string` | opsVersion leída (3, "3" o W/"3"). Ausente: 428; distinta: 412 OPS_VERSION_MISMATCH |

### Cuerpo — DTO `HygieneActionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `string` | Sí | valores: mark-dirty, mark-contaminated | `@IsIn(['mark-dirty', 'mark-contaminated'])` | — | `src/modules/practice/dto/care-space-ops.dto.ts:107` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:113` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "action": "mark-dirty"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "action": "mark-dirty",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<HygieneResultDto>` · DTO `HygieneResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cell` | `BedBoardCellDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:573` |
| `cell.id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:371` |
| `cell.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:372` |
| `cell.name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:373` |
| `cell.path` | `array<SpacePathItemDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:374` |
| `cell.path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:309` |
| `cell.path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:310` |
| `cell.path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:311` |
| `cell.path[].form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:312` |
| `cell.form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:375` |
| `cell.function` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:376` |
| `cell.lifecycle` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:377` |
| `cell.availability` | `AvailabilityAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:379` |
| `cell.availability.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:317` |
| `cell.availability.reasonCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:318` |
| `cell.availability.reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:319` |
| `cell.availability.expectedUntil` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:321` |
| `cell.availability.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:323` |
| `cell.hygiene` | `HygieneAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:380` |
| `cell.hygiene.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:328` |
| `cell.hygiene.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:330` |
| `cell.hygiene.terminalRequired` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:331` |
| `cell.isolation` | `IsolationAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:381` |
| `cell.isolation.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:336` |
| `cell.isolation.organism` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:337` |
| `cell.isolation.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:340` |
| `cell.occupancy` | `OccupancyAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:382` |
| `cell.occupancy.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:352` |
| `cell.occupancy.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:354` |
| `cell.occupancy.encounterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:356` |
| `cell.occupancy.patient` | `BedPatientDto` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:358` |
| `cell.occupancy.patient.initials` | `string` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:345` |
| `cell.occupancy.patient.sexCode` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:346` |
| `cell.occupancy.patient.ageYears` | `number` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:347` |
| `cell.occupancy.encounterLocationId` | `string` | No | formato uuid; admite null | — | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `src/modules/practice/dto/care-space-ops.dto.ts:366` |
| `cell.v2Code` | `string` | Sí | valores: C, H, I, K, O, U, R | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:383` |
| `cell.assignable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:384` |
| `cell.openCleaningOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:386` |
| `cell.lastEventAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:388` |
| `cell.opsVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:389` |
| `cell.unitId` | `string` | Sí | formato uuid; admite null | — | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `src/modules/practice/dto/care-space-ops.dto.ts:397` |
| `cell.actions` | `array<string>` | Sí | — | — | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:403` |
| `cleaningOrderId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:574` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:579` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:84` |
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:281` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /care-spaces/{id}/isolation

- **Origen:** CONTRATO
- **Nombre:** Cambiar el aislamiento de un espacio
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.changeIsolation` — `src/modules/practice/controllers/care-space-ops.controller.ts:255`

### Qué es y para qué sirve (negocio)

Cambiar el aislamiento de un espacio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-spaces/{id}/isolation` la atiende `CareSpaceOpsController.changeIsolation` (src/modules/practice/controllers/care-space-ops.controller.ts:255). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IsolationChangeDto` (4 campos, 1 obligatorio). Delega en `CareSpaceOpsService.changeIsolation`. Crea filas en practice.care_space_blocks, practice.care_space_status_events, practice.cleaning_orders. Actualiza practice.care_space_blocks, practice.care_spaces, practice.cleaning_orders. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_blocks, practice.care_space_status_events, practice.care_spaces y 8 más. Hay 10 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:255` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match-Ops (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:255` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `clinical.encounters` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_blocks` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute | `src/modules/practice/services/ops/use-cases/change-isolation.use-case.ts:151` |
| `practice.care_space_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → ChangeAvailabilityUseCase.endBlock | `src/modules/practice/services/ops/use-cases/change-availability.use-case.ts:291` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_space_status_events` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.lastEventBySpace | `src/modules/practice/repositories/care-space-ops.repository.ts:373` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute | `src/modules/practice/services/ops/use-cases/change-isolation.use-case.ts:78` |
| `practice.cleaning_orders` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsCore.openCleaningOrder | `src/modules/practice/services/ops/care-space-ops-core.ts:502` |
| `practice.cleaning_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone | `src/modules/practice/services/ops/care-space-ops-core.ts:573` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → OpsCellBuilder.cellFor | `src/modules/practice/services/ops/ops-cell-builder.ts:155` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.persons` | LEE | LEE | POR_SQL | CareSpaceOpsController.changeIsolation → CareSpaceOpsService.changeIsolation → ChangeIsolationUseCase.execute → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match-Ops` | header | Sí | `string` | opsVersion leída (3, "3" o W/"3"). Ausente: 428; distinta: 412 OPS_VERSION_MISMATCH |

### Cuerpo — DTO `IsolationChangeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `isolationCode` | `string` | Sí | valores: ISO_NONE, ISO_CONTACT, ISO_DROPLET, ISO_AIRBORNE, ISO_PROTECTIVE | `@IsIn(Object.keys(ISOLATION))` | — | `src/modules/practice/dto/care-space-ops.dto.ts:120` |
| `organismText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:126` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Obligatorio | `src/modules/practice/dto/care-space-ops.dto.ts:132` |
| `cohortApproved` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Cohorte avalada por control de infecciones | `src/modules/practice/dto/care-space-ops.dto.ts:139` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "isolationCode": "ISO_NONE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "isolationCode": "ISO_NONE",
  "organismText": "valor-ejemplo",
  "reasonText": "Texto descriptivo de ejemplo",
  "cohortApproved": true
}
```

</details>

### Respuesta — `Promise<IsolationResultDto>` · DTO `IsolationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cell` | `BedBoardCellDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:590` |
| `cell.id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:371` |
| `cell.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:372` |
| `cell.name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:373` |
| `cell.path` | `array<SpacePathItemDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:374` |
| `cell.path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:309` |
| `cell.path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:310` |
| `cell.path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:311` |
| `cell.path[].form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:312` |
| `cell.form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:375` |
| `cell.function` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:376` |
| `cell.lifecycle` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:377` |
| `cell.availability` | `AvailabilityAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:379` |
| `cell.availability.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:317` |
| `cell.availability.reasonCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:318` |
| `cell.availability.reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:319` |
| `cell.availability.expectedUntil` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:321` |
| `cell.availability.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:323` |
| `cell.hygiene` | `HygieneAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:380` |
| `cell.hygiene.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:328` |
| `cell.hygiene.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:330` |
| `cell.hygiene.terminalRequired` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:331` |
| `cell.isolation` | `IsolationAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:381` |
| `cell.isolation.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:336` |
| `cell.isolation.organism` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:337` |
| `cell.isolation.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:340` |
| `cell.occupancy` | `OccupancyAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:382` |
| `cell.occupancy.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:352` |
| `cell.occupancy.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:354` |
| `cell.occupancy.encounterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:356` |
| `cell.occupancy.patient` | `BedPatientDto` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:358` |
| `cell.occupancy.patient.initials` | `string` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:345` |
| `cell.occupancy.patient.sexCode` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:346` |
| `cell.occupancy.patient.ageYears` | `number` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:347` |
| `cell.occupancy.encounterLocationId` | `string` | No | formato uuid; admite null | — | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `src/modules/practice/dto/care-space-ops.dto.ts:366` |
| `cell.v2Code` | `string` | Sí | valores: C, H, I, K, O, U, R | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:383` |
| `cell.assignable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:384` |
| `cell.openCleaningOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:386` |
| `cell.lastEventAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:388` |
| `cell.opsVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:389` |
| `cell.unitId` | `string` | Sí | formato uuid; admite null | — | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `src/modules/practice/dto/care-space-ops.dto.ts:397` |
| `cell.actions` | `array<string>` | Sí | — | — | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:403` |
| `companionBlocks` | `array<CompanionBlockDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:592` |
| `companionBlocks[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:584` |
| `companionBlocks[].blockId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:585` |
| `cleaningOrderId` | `string` | No | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:594` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:599` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action}; Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /care-spaces/{id}/lifecycle

- **Origen:** CONTRATO
- **Nombre:** Cambiar el ciclo de vida de un espacio
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.lifecycle` — `src/modules/practice/controllers/care-spaces.controller.ts:112`

### Qué es y para qué sirve (negocio)

Cambiar el ciclo de vida de un espacio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-spaces/{id}/lifecycle` la atiende `CareSpacesController.lifecycle` (src/modules/practice/controllers/care-spaces.controller.ts:112). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LifecycleChangeDto` (2 campos, 1 obligatorio). Delega en `CareSpacesAdminService.changeLifecycle`. Crea filas en audit.care_spaces_history. Actualiza audit.care_spaces_history, practice.space_unit_assignments. Lee accounting.infrastructure_items, audit.care_spaces_history, clinical.encounter_locations, diagnostic_units.diagnostic_equipment, directory.branch_memberships, directory.tenant_memberships, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-spaces.controller.ts:112` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.infrastructure_items` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:139` |
| `audit.care_spaces_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle | `src/modules/practice/services/care-spaces-admin.service.ts:869` |
| `audit.care_spaces_history` | ESCRIBE | CREA | POR_REGISTRO | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle | `src/modules/practice/services/care-spaces-admin.service.ts:869` |
| `audit.care_spaces_history` | LEE | LEE | POR_REGISTRO | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle | `src/modules/practice/services/care-spaces-admin.service.ts:869` |
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:84` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:139` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:130` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:130` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.writableSpace → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle | `src/modules/practice/services/care-spaces-admin.service.ts:859` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → SpaceUnitAssignmentsRepository.findCurrentBySpaces | `src/modules/practice/repositories/space-unit-assignments.repository.ts:43` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:91` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |
| `scheduling.availability_slots` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:120` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CareSpacesController.lifecycle → CareSpacesAdminService.changeLifecycle → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion leída (3, "3" o W/"3"). Ausente o distinta: 412 |

### Cuerpo — DTO `LifecycleChangeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `string` | Sí | valores: activate, suspend, reactivate, retire | `@IsIn([...LIFECYCLE_ACTIONS])` | — | `src/modules/practice/dto/infrastructure.dto.ts:161` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo; obligatorio para suspend y retire | `src/modules/practice/dto/infrastructure.dto.ts:170` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "action": "activate"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "action": "activate",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CareSpaceDetailDto>` · DTO `CareSpaceDetailDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `form.code` | `string` | Sí | — | — | — | sin fuente |
| `form.display` | `string` | Sí | — | — | — | sin fuente |
| `function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `function.code` | `string` | Sí | — | — | — | sin fuente |
| `function.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:224` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:225` |
| `floorNumber` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:226` |
| `areaM2` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:227` |
| `asepsis` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:229` |
| `asepsis.code` | `string` | Sí | — | — | — | sin fuente |
| `asepsis.display` | `string` | Sí | — | — | — | sin fuente |
| `pressure` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:231` |
| `pressure.code` | `string` | Sí | — | — | — | sin fuente |
| `pressure.display` | `string` | Sí | — | — | — | sin fuente |
| `airChangesPerHour` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:232` |
| `hvacValidatedOn` | `object` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:234` |
| `sexRestriction` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:237` |
| `sexRestriction.code` | `string` | Sí | — | — | — | sin fuente |
| `sexRestriction.display` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:239` |
| `ageGroup.code` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup.display` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:241` |
| `bedCategory.code` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory.display` | `string` | Sí | — | — | — | sin fuente |
| `censable` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:242` |
| `gln` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:243` |
| `prepMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:244` |
| `cleanupMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:245` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:247` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:249` |
| `path` | `array<SpacePathStepDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:250` |
| `path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:209` |
| `path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:210` |
| `path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:211` |
| `path[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:212` |
| `path[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `path[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children` | `array<CareSpaceNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:251` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `children[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `children[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `children[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `children[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `children[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:253` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |
| `derived` | `SpaceDerivedDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:254` |
| `derived.beds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:217` |
| `derived.censableBeds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:218` |
| `derived.activeChildren` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:219` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5c.int-spec.ts:226` |
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:284` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /care-spaces/{id}/move

- **Origen:** CONTRATO
- **Nombre:** Mover un espacio de atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.move` — `src/modules/practice/controllers/care-spaces.controller.ts:92`

### Qué es y para qué sirve (negocio)

Mover un espacio de atención. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-spaces/{id}/move` la atiende `CareSpacesController.move` (src/modules/practice/controllers/care-spaces.controller.ts:92). Exige sesión; el controlador no declara roles. Valida el cuerpo como `MoveCareSpaceDto` (1 campo, 0 obligatorios). Delega en `CareSpacesAdminService.move`. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.facility_typology_rules, practice.practice_sites, practice.space_form_parent_rules, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-spaces.controller.ts:92` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpacesController.move → CareSpacesAdminService.move → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.move → CareSpacesAdminService.move → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.move → CareSpacesAdminService.move → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | CareSpacesController.move → CareSpacesAdminService.move → CareSpacesAdminService.loadRules → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpacesController.move → CareSpacesAdminService.move → CareSpacesAdminService.writableSpace → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_form_parent_rules` | LEE | LEE | DIRECTA | CareSpacesController.move → CareSpacesAdminService.move → CareSpacesAdminService.loadRules → StructureRulesRepository.parentRules | `src/modules/practice/repositories/structure-rules.repository.ts:28` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpacesController.move → CareSpacesAdminService.move → CareSpacesAdminService.detail → SpaceUnitAssignmentsRepository.findCurrentBySpaces | `src/modules/practice/repositories/space-unit-assignments.repository.ts:43` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion leída (3, "3" o W/"3"). Ausente o distinta: 412 |

### Cuerpo — DTO `MoveCareSpaceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `parentSpaceId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | Nuevo padre (misma sede); null o ausente: raíz | `src/modules/practice/dto/infrastructure.dto.ts:154` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "parentSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CareSpaceDetailDto>` · DTO `CareSpaceDetailDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `form.code` | `string` | Sí | — | — | — | sin fuente |
| `form.display` | `string` | Sí | — | — | — | sin fuente |
| `function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `function.code` | `string` | Sí | — | — | — | sin fuente |
| `function.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:224` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:225` |
| `floorNumber` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:226` |
| `areaM2` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:227` |
| `asepsis` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:229` |
| `asepsis.code` | `string` | Sí | — | — | — | sin fuente |
| `asepsis.display` | `string` | Sí | — | — | — | sin fuente |
| `pressure` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:231` |
| `pressure.code` | `string` | Sí | — | — | — | sin fuente |
| `pressure.display` | `string` | Sí | — | — | — | sin fuente |
| `airChangesPerHour` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:232` |
| `hvacValidatedOn` | `object` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:234` |
| `sexRestriction` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:237` |
| `sexRestriction.code` | `string` | Sí | — | — | — | sin fuente |
| `sexRestriction.display` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:239` |
| `ageGroup.code` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup.display` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:241` |
| `bedCategory.code` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory.display` | `string` | Sí | — | — | — | sin fuente |
| `censable` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:242` |
| `gln` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:243` |
| `prepMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:244` |
| `cleanupMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:245` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:247` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:249` |
| `path` | `array<SpacePathStepDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:250` |
| `path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:209` |
| `path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:210` |
| `path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:211` |
| `path[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:212` |
| `path[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `path[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children` | `array<CareSpaceNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:251` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `children[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `children[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `children[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `children[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `children[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:253` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |
| `derived` | `SpaceDerivedDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:254` |
| `derived.beds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:217` |
| `derived.censableBeds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:218` |
| `derived.activeChildren` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:219` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:377` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /care-spaces/{id}/operational-state

- **Origen:** CONTRATO
- **Nombre:** Estado operativo de un espacio
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.operationalState` — `src/modules/practice/controllers/care-space-ops.controller.ts:129`

### Qué es y para qué sirve (negocio)

Estado operativo de un espacio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}/operational-state` la atiende `CareSpaceOpsController.operationalState` (src/modules/practice/controllers/care-space-ops.controller.ts:129). Exige sesión; el controlador no declara roles. Delega en `BedBoardReadService.operationalState`. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_blocks, practice.care_space_status_events, practice.care_spaces y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:129` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → OpsCellBuilder.cellFor → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `clinical.encounters` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_space_status_events` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → OpsCellBuilder.cellFor → CareSpaceOpsRepository.lastEventBySpace | `src/modules/practice/repositories/care-space-ops.repository.ts:373` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → OpsCellBuilder.cellFor | `src/modules/practice/services/ops/ops-cell-builder.ts:155` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.persons` | LEE | LEE | POR_SQL | CareSpaceOpsController.operationalState → BedBoardReadService.operationalState → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OperationalStateDto>` · DTO `OperationalStateDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:371` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:372` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:373` |
| `path` | `array<SpacePathItemDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:374` |
| `path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:309` |
| `path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:310` |
| `path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:311` |
| `path[].form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:312` |
| `form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:375` |
| `function` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:376` |
| `lifecycle` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:377` |
| `availability` | `AvailabilityAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:379` |
| `availability.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:317` |
| `availability.reasonCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:318` |
| `availability.reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:319` |
| `availability.expectedUntil` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:321` |
| `availability.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:323` |
| `hygiene` | `HygieneAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:380` |
| `hygiene.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:328` |
| `hygiene.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:330` |
| `hygiene.terminalRequired` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:331` |
| `isolation` | `IsolationAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:381` |
| `isolation.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:336` |
| `isolation.organism` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:337` |
| `isolation.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:340` |
| `occupancy` | `OccupancyAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:382` |
| `occupancy.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:352` |
| `occupancy.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:354` |
| `occupancy.encounterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:356` |
| `occupancy.patient` | `BedPatientDto` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:358` |
| `occupancy.patient.initials` | `string` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:345` |
| `occupancy.patient.sexCode` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:346` |
| `occupancy.patient.ageYears` | `number` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:347` |
| `occupancy.encounterLocationId` | `string` | No | formato uuid; admite null | — | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `src/modules/practice/dto/care-space-ops.dto.ts:366` |
| `v2Code` | `string` | Sí | valores: C, H, I, K, O, U, R | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:383` |
| `assignable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:384` |
| `openCleaningOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:386` |
| `lastEventAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:388` |
| `opsVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:389` |
| `unitId` | `string` | Sí | formato uuid; admite null | — | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `src/modules/practice/dto/care-space-ops.dto.ts:397` |
| `actions` | `array<string>` | Sí | — | — | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:403` |
| `openBlocks` | `array<CareSpaceBlockDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:524` |
| `openBlocks[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:441` |
| `openBlocks[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:442` |
| `openBlocks[].kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:443` |
| `openBlocks[].reasonCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:444` |
| `openBlocks[].reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:445` |
| `openBlocks[].startsAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:446` |
| `openBlocks[].expectedEndAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:448` |
| `openBlocks[].endedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:449` |
| `openBlocks[].cancelledAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:452` |
| `openBlocks[].endNote` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:453` |
| `openBlocks[].cancelReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:454` |
| `openBlocks[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:455` |
| `openBlocks[].requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:460` |
| `openCleaningOrder` | `CleaningOrderDto` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:526` |
| `openCleaningOrder.id` | `string` | Sí | formato uuid | — | — | sin fuente |
| `openCleaningOrder.careSpaceId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `openCleaningOrder.careSpaceCode` | `string` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.careSpaceName` | `string` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | sin fuente |
| `openCleaningOrder.typeCode` | `string` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.triggerCode` | `string` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.priorityCode` | `string` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.statusCode` | `string` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.requestedAt` | `string` | Sí | formato date-time | — | — | sin fuente |
| `openCleaningOrder.dueAt` | `string` | Sí | formato date-time; admite null | — | — | sin fuente |
| `openCleaningOrder.assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | sin fuente |
| `openCleaningOrder.startedAt` | `string` | Sí | formato date-time; admite null | — | — | sin fuente |
| `openCleaningOrder.finishedAt` | `string` | Sí | formato date-time; admite null | — | — | sin fuente |
| `openCleaningOrder.finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | sin fuente |
| `openCleaningOrder.inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | sin fuente |
| `openCleaningOrder.inspectionResult` | `string` | Sí | admite null | — | — | sin fuente |
| `openCleaningOrder.rejectionReason` | `string` | Sí | admite null | — | — | sin fuente |
| `openCleaningOrder.previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | sin fuente |
| `openCleaningOrder.ageMinutes` | `number` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.rowVersion` | `number` | Sí | — | — | — | sin fuente |
| `openCleaningOrder.allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | sin fuente |
| `openCleaningOrder.inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | sin fuente |
| `openCleaningOrder.requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:266` |
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:182` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /care-spaces/{id}/retire-check

- **Origen:** CONTRATO
- **Nombre:** Bloqueos para retirar un espacio
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.retireCheck` — `src/modules/practice/controllers/care-spaces.controller.ts:149`

### Qué es y para qué sirve (negocio)

Bloqueos para retirar un espacio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}/retire-check` la atiende `CareSpacesController.retireCheck` (src/modules/practice/controllers/care-spaces.controller.ts:149). Exige sesión; el controlador no declara roles. Delega en `CareSpacesAdminService.retireCheck`. Lee accounting.infrastructure_items, clinical.encounter_locations, diagnostic_units.diagnostic_equipment, directory.tenant_memberships, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, practice.care_spaces, procedures_perioperative.procedure_cases y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:149` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-spaces.controller.ts:149` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.infrastructure_items` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:139` |
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:84` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:130` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:130` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → StructureAccessService.requireSpace → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:91` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |
| `scheduling.availability_slots` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:120` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CareSpacesController.retireCheck → CareSpacesAdminService.retireCheck → CareSpacesAdminService.retireBlockers → RetireBlockersRepository.forSpace | `src/modules/practice/repositories/retire-blockers.repository.ts:99` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RetireCheckDto>` · DTO `RetireCheckDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `blockers` | `array<BlockerDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:327` |
| `blockers[].kind` | `string` | Sí | valores: ACTIVE_CHILDREN, ACTIVE_ENCOUNTER, FUTURE_PROCEDURE, FUTURE_BOOKING, SCHEDULABLE_RESOURCE, INVENTORY_LOCATION, EQUIPMENT, ACTIVE_CHILD_UNITS, ACTIVE_SPACES, ACTIVE_STAFF | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:309` |
| `blockers[].count` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:310` |
| `blockers[].sampleIds` | `array<string>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:311` |
| `blockers[].nextAction` | `NextActionDto` | Sí | — | — | Qué hacer para destrabarlo (S3) | `src/modules/practice/dto/infrastructure-responses.dto.ts:316` |
| `blockers[].nextAction.label` | `string` | Sí | — | — | — | sin fuente |
| `blockers[].nextAction.route` | `string` | No | — | — | Ruta relativa a la ficha del espacio (p. ej. ?tab=children) | sin fuente |
| `unverifiable` | `array<UnverifiableCheckDto>` | Sí | — | — | Bloqueos que todavía no se pueden comprobar (sin FK al espacio) | `src/modules/practice/dto/infrastructure-responses.dto.ts:333` |
| `unverifiable[].kind` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:321` |
| `unverifiable[].why` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:322` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5c.int-spec.ts:207` |
| INTEGRACION | `test/integration/infrastructure-f5f.int-spec.ts:154` |
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:403` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /care-spaces/{id}/status-events

- **Origen:** CONTRATO
- **Nombre:** Historial de estados de un espacio (A20)
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.statusEvents` — `src/modules/practice/controllers/care-space-ops.controller.ts:438`

### Qué es y para qué sirve (negocio)

Historial de estados de un espacio (A20). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}/status-events` la atiende `CareSpaceOpsController.statusEvents` (src/modules/practice/controllers/care-space-ops.controller.ts:438). Exige sesión; el controlador no declara roles. Delega en `BedBoardReadService.statusEvents`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_status_events, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:438` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:438` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_status_events` | LEE | LEE | DIRECTA | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → CareSpaceOpsRepository.statusEvents | `src/modules/practice/repositories/care-space-ops.repository.ts:404` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.statusEvents → BedBoardReadService.statusEvents → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `axis` | query | No | `string` | — |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |
| `cursor` | query | No | `string` | occurredAt ISO del último evento de la página anterior |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusEventListDto>` · DTO `StatusEventListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<StatusEventDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:551` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:531` |
| `items[].axis` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:532` |
| `items[].from` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:533` |
| `items[].to` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:534` |
| `items[].v2Code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:535` |
| `items[].reasonCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:536` |
| `items[].reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:537` |
| `items[].expectedUntil` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:539` |
| `items[].source` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:540` |
| `items[].sourceRefId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:541` |
| `items[].occurredAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:543` |
| `items[].recordedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:545` |
| `items[].requestId` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:546` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:552` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:172` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /care-spaces/{id}/stock

- **Origen:** CONTRATO
- **Nombre:** Stock ubicado en un espacio (F5c)
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SpaceAssetsController.stock` — `src/modules/practice/controllers/space-assets.controller.ts:21`

### Qué es y para qué sirve (negocio)

Stock ubicado en un espacio (F5c). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /care-spaces/{id}/stock` la atiende `SpaceAssetsController.stock` (src/modules/practice/controllers/space-assets.controller.ts:21). Exige sesión; el controlador no declara roles. Delega en `SpaceAssetsReadService.stock`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/space-assets.controller.ts:21` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/space-assets.controller.ts:21` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SpaceAssetsController.stock → SpaceAssetsReadService.stock → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SpaceAssetsController.stock → SpaceAssetsReadService.stock → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock | `src/modules/practice/services/space-assets-read.service.ts:161` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock | `src/modules/practice/services/space-assets-read.service.ts:190` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock | `src/modules/practice/services/space-assets-read.service.ts:190` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock | `src/modules/practice/services/space-assets-read.service.ts:137` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock | `src/modules/practice/services/space-assets-read.service.ts:190` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock | `src/modules/practice/services/space-assets-read.service.ts:137` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SpaceAssetsController.stock → SpaceAssetsReadService.stock → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SpaceAssetsController.stock → SpaceAssetsReadService.stock → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SpaceAssetsController.stock → SpaceAssetsReadService.stock → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SpaceAssetsController.stock → SpaceAssetsReadService.stock | `src/modules/practice/services/space-assets-read.service.ts:161` |

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
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5c.int-spec.ts:259` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SpaceAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /care-spaces/{id}/unit-assignments

- **Origen:** CONTRATO
- **Nombre:** Vincular un espacio a una unidad clínica
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.addAssignment` — `src/modules/practice/controllers/care-spaces.controller.ts:160`

### Qué es y para qué sirve (negocio)

Vincular un espacio a una unidad clínica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /care-spaces/{id}/unit-assignments` la atiende `CareSpacesController.addAssignment` (src/modules/practice/controllers/care-spaces.controller.ts:160). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateUnitAssignmentDto` (2 campos, 2 obligatorios). Delega en `CareSpacesAdminService.addAssignment`. Crea filas en practice.space_unit_assignments. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:160` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-spaces.controller.ts:160` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpacesController.addAssignment → CareSpacesAdminService.addAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.addAssignment → CareSpacesAdminService.addAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.addAssignment → CareSpacesAdminService.addAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.requireSpace → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpacesController.addAssignment → CareSpacesAdminService.addAssignment → CareSpacesAdminService.sameSiteUnit → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpacesController.addAssignment → CareSpacesAdminService.addAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | ESCRIBE | CREA | DIRECTA | CareSpacesController.addAssignment → CareSpacesAdminService.addAssignment → SpaceUnitAssignmentsRepository.create | `src/modules/practice/repositories/space-unit-assignments.repository.ts:73` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpacesController.addAssignment → CareSpacesAdminService.addAssignment → SpaceUnitAssignmentsRepository.findCurrentBySpaces | `src/modules/practice/repositories/space-unit-assignments.repository.ts:43` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateUnitAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `clinicalUnitId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/practice/dto/infrastructure.dto.ts:177` |
| `roleCode` | `string` | Sí | valores: SPACE_UNIT_ROLE_OWNER, SPACE_UNIT_ROLE_SHARED, SPACE_UNIT_ROLE_LOAN | `@IsIn([ 'SPACE_UNIT_ROLE_OWNER', 'SPACE_UNIT_ROLE_SHARED', 'SPACE_UNIT_ROLE_LOAN', ])` | — | `src/modules/practice/dto/infrastructure.dto.ts:191` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "roleCode": "SPACE_UNIT_ROLE_OWNER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "roleCode": "SPACE_UNIT_ROLE_OWNER"
}
```

</details>

### Respuesta — `Promise<SpaceUnitAssignmentDto>` · DTO `SpaceUnitAssignmentDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `role.code` | `string` | Sí | — | — | — | sin fuente |
| `role.display` | `string` | Sí | — | — | — | sin fuente |
| `validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-fixture.ts:263` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. DELETE /care-spaces/{id}/unit-assignments/{assignmentId}

- **Origen:** CONTRATO
- **Nombre:** Desvincular un espacio de una unidad clínica
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpacesController.removeAssignment` — `src/modules/practice/controllers/care-spaces.controller.ts:178`

### Qué es y para qué sirve (negocio)

Desvincular un espacio de una unidad clínica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /care-spaces/{id}/unit-assignments/{assignmentId}` la atiende `CareSpacesController.removeAssignment` (src/modules/practice/controllers/care-spaces.controller.ts:178). Exige sesión; el controlador no declara roles. Delega en `CareSpacesAdminService.removeAssignment`. Actualiza practice.space_unit_assignments. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.practice_sites, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-spaces.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, assignmentId | `src/modules/practice/controllers/care-spaces.controller.ts:178` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpacesController.removeAssignment → CareSpacesAdminService.removeAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpacesController.removeAssignment → CareSpacesAdminService.removeAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpacesController.removeAssignment → CareSpacesAdminService.removeAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.requireSpace → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpacesController.removeAssignment → CareSpacesAdminService.removeAssignment → CareSpacesAdminService.writableSpace → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpacesController.removeAssignment → CareSpacesAdminService.removeAssignment | `src/modules/practice/services/care-spaces-admin.service.ts:999` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpacesController.removeAssignment → CareSpacesAdminService.removeAssignment → SpaceUnitAssignmentsRepository.findById | `src/modules/practice/repositories/space-unit-assignments.repository.ts:29` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `assignmentId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AssignmentRemovedDto>` · DTO `AssignmentRemovedDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:434` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Vínculo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpacesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /cleaning-orders/{id}/assign

- **Origen:** CONTRATO
- **Nombre:** Asignar una orden de limpieza
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.assign` — `src/modules/practice/controllers/care-space-ops.controller.ts:314`

### Qué es y para qué sirve (negocio)

Asignar una orden de limpieza. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /cleaning-orders/{id}/assign` la atiende `CareSpaceOpsController.assign` (src/modules/practice/controllers/care-space-ops.controller.ts:314). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AssignCleaningOrderDto` (1 campo, 1 obligatorio). Delega en `CleaningOrdersService.assign`. Lee directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:314` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:314` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | CareSpaceOpsController.assign → CleaningOrdersService.assign → AssignCleaningOrderUseCase.execute | `src/modules/practice/services/ops/use-cases/cleaning-order.use-cases.ts:288` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion de la orden. Ausente: 428; distinta: 412 |

### Cuerpo — DTO `AssignCleaningOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid; admite null | `@ValidateIf((o: AssignCleaningOrderDto) => o.userId !== null)` `@IsUUID()` | — | `src/modules/practice/dto/care-space-ops.dto.ts:169` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "userId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CleaningOrderDto>` · DTO `CleaningOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:465` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:466` |
| `careSpaceCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:467` |
| `careSpaceName` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:468` |
| `clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:470` |
| `typeCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:471` |
| `triggerCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:472` |
| `priorityCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:473` |
| `statusCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:474` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:475` |
| `dueAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:476` |
| `assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:479` |
| `startedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:481` |
| `finishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:483` |
| `finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:485` |
| `inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:487` |
| `inspectionResult` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:488` |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:490` |
| `previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:493` |
| `ageMinutes` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:494` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:495` |
| `allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:502` |
| `inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `src/modules/practice/dto/care-space-ops.dto.ts:507` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:512` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /cleaning-orders/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar una orden de limpieza
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.cancel` — `src/modules/practice/controllers/care-space-ops.controller.ts:413`

### Qué es y para qué sirve (negocio)

Cancelar una orden de limpieza. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /cleaning-orders/{id}/cancel` la atiende `CareSpaceOpsController.cancel` (src/modules/practice/controllers/care-space-ops.controller.ts:413). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CancelCleaningOrderDto` (1 campo, 1 obligatorio). Delega en `CleaningOrdersService.cancel`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:413` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:413` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion de la orden. Ausente: 428; distinta: 412 |

### Cuerpo — DTO `CancelCleaningOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:200` |

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

### Respuesta — `Promise<CleaningOrderDto>` · DTO `CleaningOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:465` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:466` |
| `careSpaceCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:467` |
| `careSpaceName` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:468` |
| `clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:470` |
| `typeCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:471` |
| `triggerCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:472` |
| `priorityCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:473` |
| `statusCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:474` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:475` |
| `dueAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:476` |
| `assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:479` |
| `startedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:481` |
| `finishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:483` |
| `finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:485` |
| `inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:487` |
| `inspectionResult` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:488` |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:490` |
| `previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:493` |
| `ageMinutes` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:494` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:495` |
| `allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:502` |
| `inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `src/modules/practice/dto/care-space-ops.dto.ts:507` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:512` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:381` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /cleaning-orders/{id}/finish

- **Origen:** CONTRATO
- **Nombre:** Terminar una orden de limpieza
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.finish` — `src/modules/practice/controllers/care-space-ops.controller.ts:363`

### Qué es y para qué sirve (negocio)

Terminar una orden de limpieza. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /cleaning-orders/{id}/finish` la atiende `CareSpaceOpsController.finish` (src/modules/practice/controllers/care-space-ops.controller.ts:363). Exige sesión; el controlador no declara roles. Valida el cuerpo como `FinishCleaningOrderDto` (1 campo, 0 obligatorios). Delega en `CleaningOrdersService.finish`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:363` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:363` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion de la orden. Ausente: 428; distinta: 412 |

### Cuerpo — DTO `FinishCleaningOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:178` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CleaningOrderDto>` · DTO `CleaningOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:465` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:466` |
| `careSpaceCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:467` |
| `careSpaceName` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:468` |
| `clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:470` |
| `typeCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:471` |
| `triggerCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:472` |
| `priorityCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:473` |
| `statusCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:474` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:475` |
| `dueAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:476` |
| `assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:479` |
| `startedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:481` |
| `finishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:483` |
| `finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:485` |
| `inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:487` |
| `inspectionResult` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:488` |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:490` |
| `previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:493` |
| `ageMinutes` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:494` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:495` |
| `allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:502` |
| `inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `src/modules/practice/dto/care-space-ops.dto.ts:507` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:512` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:122` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /cleaning-orders/{id}/inspect

- **Origen:** CONTRATO
- **Nombre:** Inspeccionar una limpieza
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.inspect` — `src/modules/practice/controllers/care-space-ops.controller.ts:388`

### Qué es y para qué sirve (negocio)

Inspeccionar una limpieza. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /cleaning-orders/{id}/inspect` la atiende `CareSpaceOpsController.inspect` (src/modules/practice/controllers/care-space-ops.controller.ts:388). Exige sesión; el controlador no declara roles. Valida el cuerpo como `InspectCleaningOrderDto` (2 campos, 1 obligatorio). Delega en `CleaningOrdersService.inspect`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:388` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:388` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion de la orden. Ausente: 428; distinta: 412 |

### Cuerpo — DTO `InspectCleaningOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `result` | `string` | Sí | valores: PASS, FAIL | `@IsIn(['PASS', 'FAIL'])` | — | `src/modules/practice/dto/care-space-ops.dto.ts:185` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Obligatorio con FAIL | `src/modules/practice/dto/care-space-ops.dto.ts:191` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "result": "PASS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "result": "PASS",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` · DTO `CleaningOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:465` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:466` |
| `careSpaceCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:467` |
| `careSpaceName` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:468` |
| `clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:470` |
| `typeCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:471` |
| `triggerCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:472` |
| `priorityCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:473` |
| `statusCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:474` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:475` |
| `dueAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:476` |
| `assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:479` |
| `startedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:481` |
| `finishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:483` |
| `finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:485` |
| `inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:487` |
| `inspectionResult` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:488` |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:490` |
| `previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:493` |
| `ageMinutes` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:494` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:495` |
| `allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:502` |
| `inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `src/modules/practice/dto/care-space-ops.dto.ts:507` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:512` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:129` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /cleaning-orders/{id}/start

- **Origen:** CONTRATO
- **Nombre:** Iniciar una orden de limpieza
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.start` — `src/modules/practice/controllers/care-space-ops.controller.ts:339`

### Qué es y para qué sirve (negocio)

Iniciar una orden de limpieza. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /cleaning-orders/{id}/start` la atiende `CareSpaceOpsController.start` (src/modules/practice/controllers/care-space-ops.controller.ts:339). Exige sesión; el controlador no declara roles. Delega en `CleaningOrdersService.start`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:339` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/care-space-ops.controller.ts:339` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion de la orden. Ausente: 428; distinta: 412 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CleaningOrderDto>` · DTO `CleaningOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:465` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:466` |
| `careSpaceCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:467` |
| `careSpaceName` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:468` |
| `clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:470` |
| `typeCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:471` |
| `triggerCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:472` |
| `priorityCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:473` |
| `statusCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:474` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:475` |
| `dueAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:476` |
| `assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:479` |
| `startedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:481` |
| `finishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:483` |
| `finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:485` |
| `inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:487` |
| `inspectionResult` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:488` |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:490` |
| `previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:493` |
| `ageMinutes` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:494` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:495` |
| `allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:502` |
| `inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `src/modules/practice/dto/care-space-ops.dto.ts:507` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:512` |

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
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:116` |
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:310` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. GET /clinical-units/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha de una unidad clínica
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalUnitsController.detail` — `src/modules/practice/controllers/clinical-units.controller.ts:47`

### Qué es y para qué sirve (negocio)

Ficha de una unidad clínica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /clinical-units/{id}` la atiende `ClinicalUnitsController.detail` (src/modules/practice/controllers/clinical-units.controller.ts:47). Exige sesión; el controlador no declara roles. Delega en `ClinicalUnitsAdminService.detail`. Lee directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/clinical-units.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/clinical-units.controller.ts:47` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalUnitsController.detail → ClinicalUnitsAdminService.detail → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalUnitsController.detail → ClinicalUnitsAdminService.detail → ClinicalUnitsAdminService.toDetail → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalUnitsController.detail → ClinicalUnitsAdminService.detail → StructureAccessService.requireUnit → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | ClinicalUnitsController.detail → ClinicalUnitsAdminService.detail → ClinicalUnitsAdminService.toDetail → SpaceUnitAssignmentsRepository.findCurrentByUnit | `src/modules/practice/repositories/space-unit-assignments.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ClinicalUnitDetailDto>` · DTO `ClinicalUnitDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:338` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:340` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:342` |
| `children` | `array<ClinicalUnitNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:344` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `children[].description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |
| `spaces` | `array<CareSpaceNodeDto>` | Sí | — | — | Espacios con esta unidad principal | `src/modules/practice/dto/infrastructure-responses.dto.ts:349` |
| `spaces[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `spaces[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `spaces[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `spaces[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `spaces[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `spaces[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `spaces[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `spaces[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `spaces[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `spaces[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `spaces[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `spaces[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:351` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad clínica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:ClinicalUnitsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. PATCH /clinical-units/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una unidad clínica
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalUnitsController.update` — `src/modules/practice/controllers/clinical-units.controller.ts:58`

### Qué es y para qué sirve (negocio)

Editar una unidad clínica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /clinical-units/{id}` la atiende `ClinicalUnitsController.update` (src/modules/practice/controllers/clinical-units.controller.ts:58). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateClinicalUnitDto` (6 campos, 0 obligatorios). Delega en `ClinicalUnitsAdminService.update`. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/clinical-units.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/clinical-units.controller.ts:58` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalUnitsController.update → ClinicalUnitsAdminService.update → ClinicalUnitsAdminService.writable → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalUnitsController.update → ClinicalUnitsAdminService.update → ClinicalUnitsAdminService.writable → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalUnitsController.update → ClinicalUnitsAdminService.update → ClinicalUnitsAdminService.toDetail → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalUnitsController.update → ClinicalUnitsAdminService.update → ClinicalUnitsAdminService.writable → ClinicalUnitsRepository.findBySite | `src/modules/practice/repositories/clinical-units.repository.ts:79` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalUnitsController.update → ClinicalUnitsAdminService.update → ClinicalUnitsAdminService.writable → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | ClinicalUnitsController.update → ClinicalUnitsAdminService.update → ClinicalUnitsAdminService.toDetail → SpaceUnitAssignmentsRepository.findCurrentByUnit | `src/modules/practice/repositories/space-unit-assignments.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion leída. Ausente o distinta: 412 |

### Cuerpo — DTO `UpdateClinicalUnitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código: sólo mientras está PLANNED | `src/modules/practice/dto/infrastructure.dto.ts:201` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/practice/dto/infrastructure.dto.ts:208` |
| `description` | `string` | No | longitud máxima 1000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/practice/dto/infrastructure.dto.ts:214` |
| `parentUnitId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | Unidad padre (misma sede); null: raíz | `src/modules/practice/dto/infrastructure.dto.ts:224` |
| `responsibleUserId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/infrastructure.dto.ts:229` |
| `specialtyConceptId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/infrastructure.dto.ts:234` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "parentUnitId": "00000000-0000-4000-8000-000000000001",
  "responsibleUserId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ClinicalUnitDetailDto>` · DTO `ClinicalUnitDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:338` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:340` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:342` |
| `children` | `array<ClinicalUnitNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:344` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `children[].description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |
| `spaces` | `array<CareSpaceNodeDto>` | Sí | — | — | Espacios con esta unidad principal | `src/modules/practice/dto/infrastructure-responses.dto.ts:349` |
| `spaces[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `spaces[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `spaces[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `spaces[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `spaces[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `spaces[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `spaces[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `spaces[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `spaces[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `spaces[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `spaces[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `spaces[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:351` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:ClinicalUnitsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /clinical-units/{id}/lifecycle

- **Origen:** CONTRATO
- **Nombre:** Cambiar el ciclo de vida de una unidad clínica
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalUnitsController.lifecycle` — `src/modules/practice/controllers/clinical-units.controller.ts:77`

### Qué es y para qué sirve (negocio)

Cambiar el ciclo de vida de una unidad clínica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /clinical-units/{id}/lifecycle` la atiende `ClinicalUnitsController.lifecycle` (src/modules/practice/controllers/clinical-units.controller.ts:77). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LifecycleChangeDto` (2 campos, 1 obligatorio). Delega en `ClinicalUnitsAdminService.changeLifecycle`. Crea filas en audit.clinical_units_history. Actualiza audit.clinical_units_history. Lee audit.clinical_units_history, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practitioner_role_assignments, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/clinical-units.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/clinical-units.controller.ts:77` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.clinical_units_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle | `src/modules/practice/services/clinical-units-admin.service.ts:283` |
| `audit.clinical_units_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle | `src/modules/practice/services/clinical-units-admin.service.ts:283` |
| `audit.clinical_units_history` | LEE | LEE | POR_REGISTRO | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle | `src/modules/practice/services/clinical-units-admin.service.ts:283` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle → ClinicalUnitsAdminService.writable → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle → ClinicalUnitsAdminService.writable → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle → ClinicalUnitsAdminService.retireBlockers → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle → ClinicalUnitsAdminService.writable → ClinicalUnitsRepository.findBySite | `src/modules/practice/repositories/clinical-units.repository.ts:79` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle → ClinicalUnitsAdminService.writable → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle → ClinicalUnitsAdminService.retireBlockers | `src/modules/practice/services/clinical-units-admin.service.ts:361` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | ClinicalUnitsController.lifecycle → ClinicalUnitsAdminService.changeLifecycle → ClinicalUnitsAdminService.retireBlockers → SpaceUnitAssignmentsRepository.findCurrentByUnit | `src/modules/practice/repositories/space-unit-assignments.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | Sí | `string` | rowVersion leída. Ausente o distinta: 412 |

### Cuerpo — DTO `LifecycleChangeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `string` | Sí | valores: activate, suspend, reactivate, retire | `@IsIn([...LIFECYCLE_ACTIONS])` | — | `src/modules/practice/dto/infrastructure.dto.ts:161` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo; obligatorio para suspend y retire | `src/modules/practice/dto/infrastructure.dto.ts:170` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "action": "activate"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "action": "activate",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ClinicalUnitDetailDto>` · DTO `ClinicalUnitDetailDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:338` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:340` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:342` |
| `children` | `array<ClinicalUnitNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:344` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `children[].description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |
| `spaces` | `array<CareSpaceNodeDto>` | Sí | — | — | Espacios con esta unidad principal | `src/modules/practice/dto/infrastructure-responses.dto.ts:349` |
| `spaces[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `spaces[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `spaces[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `spaces[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `spaces[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `spaces[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `spaces[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `spaces[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `spaces[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `spaces[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `spaces[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `spaces[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:351` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:ClinicalUnitsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /internal/practice/blocks-tick

- **Origen:** CONTRATO
- **Nombre:** Aplicar bloqueos programados y avisar vencidos (worker)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.blocksTick` — `src/modules/practice/controllers/care-space-ops.controller.ts:450`

### Qué es y para qué sirve (negocio)

Aplicar bloqueos programados y avisar vencidos (worker). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /internal/practice/blocks-tick` la atiende `CareSpaceOpsController.blocksTick` (src/modules/practice/controllers/care-space-ops.controller.ts:450). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Delega en `CareSpaceOpsService.runBlocksTick`. Crea filas en practice.care_space_status_events. Actualiza practice.care_spaces. Lee clinical.encounter_locations, practice.care_space_blocks, practice.care_spaces, practice.practice_settings, practice.practice_sites. Hay 1 llamada cuyo destino depende de un dato en tiempo de ejecución y no se siguió.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/practice/controllers/care-space-ops.controller.ts:450` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.blocksTick → CareSpaceOpsService.runBlocksTick → RunBlocksTickUseCase.execute → ChangeAvailabilityUseCase.applyStarted → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocksTick → CareSpaceOpsService.runBlocksTick → RunBlocksTickUseCase.execute → CareSpaceOpsRepository.dueBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:261` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.blocksTick → CareSpaceOpsService.runBlocksTick → RunBlocksTickUseCase.execute → ChangeAvailabilityUseCase.applyStarted → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | CareSpaceOpsController.blocksTick → CareSpaceOpsService.runBlocksTick → RunBlocksTickUseCase.execute → ChangeAvailabilityUseCase.applyStarted → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocksTick → CareSpaceOpsService.runBlocksTick → RunBlocksTickUseCase.execute | `src/modules/practice/services/ops/use-cases/run-blocks-tick.use-case.ts:48` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.blocksTick → CareSpaceOpsService.runBlocksTick → RunBlocksTickUseCase.execute → ChangeAvailabilityUseCase.applyStarted → ChangeAvailabilityUseCase.reapply → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.blocksTick → CareSpaceOpsService.runBlocksTick → RunBlocksTickUseCase.execute | `src/modules/practice/services/ops/use-cases/run-blocks-tick.use-case.ts:55` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BlocksTickResultDto>` · DTO `BlocksTickResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `applied` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:604` |
| `overdue` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:605` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /inventory-items/{itemId}/movements

- **Origen:** CONTRATO
- **Nombre:** Registrar un movimiento de inventario (ajuste de stock)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InventoryItemsController.recordMovement` — `src/modules/practice/controllers/inventory-items.controller.ts:33`

### Qué es y para qué sirve (negocio)

Registrar un movimiento de inventario (ajuste de stock). Caso de uso UC-14-11: Movimiento de stock (IN/OUT/ADJUST). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:155`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /inventory-items/{itemId}/movements` la atiende `InventoryItemsController.recordMovement` (src/modules/practice/controllers/inventory-items.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateMovementDto` (5 campos, 2 obligatorios). Delega en `PracticeInventoryService.recordMovement`. Crea filas en practice.inventory_movements. Lee practice.inventory_items, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/inventory-items.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: itemId | `src/modules/practice/controllers/inventory-items.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:273` |
| `inventoryItemId` | `string` | Sí | — | — | Identificador asociado a inventory item. | `src/modules/practice/dto/responses.dto.ts:277` |
| `quantityOnHand` | `string` | Sí | — | — | Valor de quantity on hand mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:281` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:285` |

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

## 30. GET /practice/infrastructure-access/me

- **Origen:** CONTRATO
- **Nombre:** Acceso del actor a la infraestructura del tenant activo
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InfrastructureAccessController.read` — `src/modules/practice/controllers/infrastructure-access.controller.ts:24`

### Qué es y para qué sirve (negocio)

Acceso del actor a la infraestructura del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practice/infrastructure-access/me` la atiende `InfrastructureAccessController.read` (src/modules/practice/controllers/infrastructure-access.controller.ts:24). Exige sesión; el controlador no declara roles. Delega en `InfrastructureAccessMeService.me`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/infrastructure-access.controller.ts:24` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | InfrastructureAccessController.read → InfrastructureAccessMeService.me → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | InfrastructureAccessController.read → InfrastructureAccessMeService.me → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | InfrastructureAccessController.read → InfrastructureAccessMeService.me → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | InfrastructureAccessController.read → InfrastructureAccessMeService.me → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | InfrastructureAccessController.read → InfrastructureAccessMeService.me → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | InfrastructureAccessController.read → InfrastructureAccessMeService.me | `src/modules/practice/services/infrastructure-access-me.service.ts:50` |
| `practice.practices` | LEE | LEE | POR_SQL | InfrastructureAccessController.read → InfrastructureAccessMeService.me | `src/modules/practice/services/infrastructure-access-me.service.ts:50` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InfraAccessMeDto>` · DTO `InfraAccessMeDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:48` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:49` |
| `sites` | `array<InfraAccessSiteDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:50` |
| `sites[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:21` |
| `sites[].practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:22` |
| `sites[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:23` |
| `sites[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:24` |
| `sites[].timeZone` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:25` |
| `sites[].roles` | `array<string>` | Sí | — | — | Roles de nivel sede u organización (plataforma, admin, asignaciones TENANT/PRACTICE/SITE) | `src/modules/practice/dto/infrastructure-access-me.dto.ts:31` |
| `sites[].globalRoles` | `array<string>` | Sí | — | — | Roles globales equivalentes (BILLING, OR_MANAGER, ACCOUNTING) | `src/modules/practice/dto/infrastructure-access-me.dto.ts:37` |
| `sites[].actions` | `array<string>` | Sí | — | — | Acciones permitidas sobre la sede entera | `src/modules/practice/dto/infrastructure-access-me.dto.ts:42` |
| `sites[].grants` | `array<InfraAccessGrantDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:43` |
| `sites[].grants[].scope` | `string` | Sí | valores: UNIT, SPACE | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:5` |
| `sites[].grants[].role` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:6` |
| `sites[].grants[].clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:8` |
| `sites[].grants[].careSpaceId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-access-me.dto.ts:10` |
| `sites[].grants[].actions` | `array<string>` | Sí | — | — | Acciones que esta asignación permite sobre su unidad o espacio | `src/modules/practice/dto/infrastructure-access-me.dto.ts:16` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:572` |
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:83` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:InfrastructureAccessController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. GET /practice/infrastructure-catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo de infraestructura hospitalaria
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `InfrastructureCatalogController.catalog` — `src/modules/practice/controllers/infrastructure-catalog.controller.ts:44`

### Qué es y para qué sirve (negocio)

Catálogo de infraestructura hospitalaria. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practice/infrastructure-catalog` la atiende `InfrastructureCatalogController.catalog` (src/modules/practice/controllers/infrastructure-catalog.controller.ts:44). Exige sesión; el controlador no declara roles. Delega en `InfrastructureReadService.catalog`. Lee practice.facility_typology_rules, practice.space_form_parent_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/infrastructure-catalog.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | InfrastructureCatalogController.catalog → InfrastructureReadService.catalog → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.space_form_parent_rules` | LEE | LEE | DIRECTA | InfrastructureCatalogController.catalog → InfrastructureReadService.catalog → StructureRulesRepository.parentRules | `src/modules/practice/repositories/structure-rules.repository.ts:28` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InfrastructureCatalogDto>` · DTO `InfrastructureCatalogDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `forms` | `array<FormConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:85` |
| `forms[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `forms[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `forms[].fhirCode` | `string` | Sí | — | — | Código FHIR R5 Location.form | `src/modules/practice/dto/infrastructure-responses.dto.ts:12` |
| `functions` | `array<FunctionProfileDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:86` |
| `functions[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `functions[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `functions[].key` | `string` | Sí | — | — | Clave estable (GENERIC para SPACE_TYPE_ROOM) | `src/modules/practice/dto/infrastructure-responses.dto.ts:18` |
| `functions[].forms` | `array<string>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:19` |
| `functions[].schedulable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:20` |
| `functions[].inpatient` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:21` |
| `functions[].billable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:22` |
| `functions[].allowOverlap` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:23` |
| `functions[].isolationCapable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:24` |
| `functions[].stockPoint` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:25` |
| `functions[].hostsEquipment` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:26` |
| `functions[].requiresTerminalCleaning` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:27` |
| `functions[].requiresArea` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:28` |
| `functions[].requiresHvac` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:29` |
| `parentRules` | `array<ParentRuleDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:87` |
| `parentRules[].parent` | `string` | Sí | admite null | — | null = raíz de la sede | `src/modules/practice/dto/infrastructure-responses.dto.ts:51` |
| `parentRules[].child` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:52` |
| `typologyRules` | `array<TypologyRuleDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:88` |
| `typologyRules[].typology` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:57` |
| `typologyRules[].function` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:58` |
| `typologyRules[].rule` | `string` | Sí | valores: TYPO_ALLOWED, TYPO_REQUIRED | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:60` |
| `lifecycle` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:89` |
| `lifecycle[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `lifecycle[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `unitLifecycle` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:90` |
| `unitLifecycle[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `unitLifecycle[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `attributes` | `CatalogAttributesDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:92` |
| `attributes.asepsis` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:65` |
| `attributes.asepsis[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `attributes.asepsis[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `attributes.pressure` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:66` |
| `attributes.pressure[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `attributes.pressure[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `attributes.sex` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:67` |
| `attributes.sex[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `attributes.sex[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `attributes.ageGroup` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:68` |
| `attributes.ageGroup[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `attributes.ageGroup[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `attributes.bedCategory` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:69` |
| `attributes.bedCategory[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `attributes.bedCategory[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `attributes.unitRole` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:70` |
| `attributes.unitRole[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `attributes.unitRole[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `regulatory` | `CatalogRegulatoryDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:94` |
| `regulatory.subsector` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:75` |
| `regulatory.subsector[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `regulatory.subsector[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `regulatory.careLevel` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:76` |
| `regulatory.careLevel[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `regulatory.careLevel[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `regulatory.typology` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:77` |
| `regulatory.typology[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `regulatory.typology[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `regulatory.sedes` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:78` |
| `regulatory.sedes[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `regulatory.sedes[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `regulatory.licenseStatus` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:79` |
| `regulatory.licenseStatus[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `regulatory.licenseStatus[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `regulatory.capacityKind` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:80` |
| `regulatory.capacityKind[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `regulatory.capacityKind[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `availability` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:96` |
| `availability[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `availability[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `hygiene` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:97` |
| `hygiene[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `hygiene[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `isolation` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:98` |
| `isolation[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `isolation[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `occupancy` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:99` |
| `occupancy[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `occupancy[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `blockReasons` | `array<BlockReasonConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:101` |
| `blockReasons[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `blockReasons[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `blockReasons[].kinds` | `array<string>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:34` |
| `cleaningTypes` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:102` |
| `cleaningTypes[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `cleaningTypes[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `cleaningPriorities` | `array<ConceptDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:103` |
| `cleaningPriorities[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:5` |
| `cleaningPriorities[].display` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:6` |
| `v2Map` | `array<V2MapRuleDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:104` |
| `v2Map[].order` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:39` |
| `v2Map[].condition` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:40` |
| `v2Map[].v2Code` | `string` | Sí | valores: C, K, I, O, R, H, U | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:41` |

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
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:110` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:InfrastructureCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /practices

- **Origen:** CONTRATO
- **Nombre:** Listar las prácticas activas del tenant
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.listPractices` — `src/modules/practice/controllers/practices.controller.ts:108`

### Qué es y para qué sirve (negocio)

Listar las prácticas activas del tenant. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices` la atiende `PracticesController.listPractices` (src/modules/practice/controllers/practices.controller.ts:108). Exige sesión; el controlador no declara roles. Delega en `PracticeSitesService.listPractices`. Lee directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.listPractices → PracticeSitesService.listPractices → PracticeSitesService.assertCanReadPractices → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.listPractices → PracticeSitesService.listPractices → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PracticesController.listPractices → PracticeSitesService.listPractices → PracticeAccessService.allowedPracticeIds → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PracticeSummaryDto[]>` · DTO `PracticeSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la práctica. | `src/modules/practice/dto/responses.dto.ts:304` |
| `code` | `string` | Sí | — | — | Código único dentro del tenant. | `src/modules/practice/dto/responses.dto.ts:306` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:308` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:310` |

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
| INTEGRACION | `test/integration/medical-center-registration.int-spec.ts:172` |
| INTEGRACION | `test/integration/practice-ownership.int-spec.ts:46` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. POST /practices

- **Origen:** CONTRATO
- **Nombre:** Dar de alta una práctica (organización raíz)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createPractice` — `src/modules/practice/controllers/practices.controller.ts:213`

### Qué es y para qué sirve (negocio)

Dar de alta una práctica (organización raíz). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices` la atiende `PracticesController.createPractice` (src/modules/practice/controllers/practices.controller.ts:213). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePracticeDto` (7 campos, 3 obligatorios). Delega en `PracticeSitesService.createPractice`. Crea filas en billing.service_catalog, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:213` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | ESCRIBE | CREA | DIRECTA | PracticesController.createPractice → PracticeSitesService.createPractice → ServiceCatalogRepository.create | `src/modules/billing/repositories/service-catalog.repository.ts:253` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | PracticesController.createPractice → PracticeSitesService.createPractice → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:9` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:13` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:17` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:21` |

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
| INTEGRACION | `test/integration/accounting-practitioner-simple-http.int-spec.ts:91` |
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:40` |
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:59` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:125` |
| INTEGRACION | `test/integration/hardening/mch-018.int-spec.ts:70` |
| INTEGRACION | `test/integration/infrastructure-f5f.int-spec.ts:49` |
| INTEGRACION | `test/integration/infrastructure-fixture.ts:87` |
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:80` |
| INTEGRACION | `test/integration/practice-ownership.int-spec.ts:79` |
| INTEGRACION | `test/integration/practice-structure-tenancy.int-spec.ts:82` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /practices/{practiceId}/accreditations

- **Origen:** CONTRATO
- **Nombre:** Registrar una acreditación con evidencia
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createAccreditation` — `src/modules/practice/controllers/practices.controller.ts:280`

### Qué es y para qué sirve (negocio)

Registrar una acreditación con evidencia. Caso de uso UC-14-02: Registrar acreditación (PENDING). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:146`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/accreditations` la atiende `PracticesController.createAccreditation` (src/modules/practice/controllers/practices.controller.ts:280). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeCreateAccreditationDto` (8 campos, 0 obligatorios). Delega en `PracticeAccreditationsService.create`. Crea filas en practice.practice_accreditations. Lee practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:280` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:280` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_accreditations` | ESCRIBE | CREA | DIRECTA | PracticesController.createAccreditation → PracticeAccreditationsService.create → PracticeAccreditationsRepository.create | `src/modules/practice/repositories/practice-accreditations.repository.ts:82` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.createAccreditation → PracticeAccreditationsService.create → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:57` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:61` |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:65` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:69` |

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

## 35. GET /practices/{practiceId}/healthcare-services

- **Origen:** CONTRATO
- **Nombre:** Listar los procedimientos que ofrecen las sedes de la práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.listHealthcareServices` — `src/modules/practice/controllers/practices.controller.ts:326`

### Qué es y para qué sirve (negocio)

Listar los procedimientos que ofrecen las sedes de la práctica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices/{practiceId}/healthcare-services` la atiende `PracticesController.listHealthcareServices` (src/modules/practice/controllers/practices.controller.ts:326). Exige sesión; el controlador no declara roles. Delega en `HealthcareServiceOffersService.listOffers`. Lee billing.service_catalog, directory.tenant_memberships, practice.healthcare_services, practice.practices, terminology.catalog_concepts, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:326` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:326` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | PracticesController.listHealthcareServices → HealthcareServiceOffersService.listOffers → HealthcareServiceOffersService.toOffers → ServiceCatalogRepository.findByIds | `src/modules/billing/repositories/service-catalog.repository.ts:116` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.listHealthcareServices → HealthcareServiceOffersService.listOffers → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.listHealthcareServices → HealthcareServiceOffersService.listOffers → HealthcareServicesRepository.listByPractice | `src/modules/practice/repositories/healthcare-services.repository.ts:116` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.listHealthcareServices → HealthcareServiceOffersService.listOffers → PracticeAdministrationService.assertCanAdministerPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PracticesController.listHealthcareServices → HealthcareServiceOffersService.listOffers → HealthcareServiceOffersService.toOffers | `src/modules/practice/services/healthcare-service-offers.service.ts:158` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | PracticesController.listHealthcareServices → HealthcareServiceOffersService.listOffers → HealthcareServiceOffersService.toOffers → ProcedureReferenceReader.referencesFor | `src/modules/billing/services/procedure-reference.reader.ts:78` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |
| `practiceSiteId` | query | No | `string` | Solo la oferta de esa sede |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<HealthcareServiceOffersResponseDto>` · DTO `HealthcareServiceOffersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<HealthcareServiceOfferDto>` | Sí | — | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:68` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:11` |
| `items[].practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:15` |
| `items[].serviceConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:19` |
| `items[].serviceDisplay` | `string` | Sí | — | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:23` |
| `items[].serviceCatalogId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:28` |
| `items[].price` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:32` |
| `items[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:37` |
| `items[].referencePrice` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:41` |
| `items[].referenceUnit` | `string` | Sí | valores: UMA, USD; admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:46` |
| `items[].overMargin` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:51` |
| `items[].visibleInSearch` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:55` |
| `items[].active` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:59` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:453` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /practices/{practiceId}/healthcare-services

- **Origen:** CONTRATO
- **Nombre:** Publicar un procedimiento del nomenclador en una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.publishHealthcareService` — `src/modules/practice/controllers/practices.controller.ts:301`

### Qué es y para qué sirve (negocio)

Publicar un procedimiento del nomenclador en una sede. Caso de uso UC-14-06: Publicar servicio de salud. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:150`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/healthcare-services` la atiende `PracticesController.publishHealthcareService` (src/modules/practice/controllers/practices.controller.ts:301). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateHealthcareServiceDto` (8 campos, 3 obligatorios). Delega en `ClinicalStructureService.publishHealthcareService`. Crea filas en practice.healthcare_services. Lee directory.tenant_memberships, practice.clinical_units, practice.healthcare_services, practice.practice_sites, practice.practices, terminology.value_set_members.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:301` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:301` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.healthcare_services` | ESCRIBE | CREA | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → HealthcareServicesRepository.create | `src/modules/practice/repositories/healthcare-services.repository.ts:136` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → HealthcareServicesRepository.findBySiteAndConcept | `src/modules/practice/repositories/healthcare-services.repository.ts:100` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → PracticeAdministrationService.assertCanAdministerPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | PracticesController.publishHealthcareService → ClinicalStructureService.publishHealthcareService → ProcedureReferenceReader.isProcedure | `src/modules/billing/services/procedure-reference.reader.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateHealthcareServiceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sitio donde se presta | `src/modules/practice/dto/create-healthcare-service.dto.ts:11` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica que lo presta | `src/modules/practice/dto/create-healthcare-service.dto.ts:22` |
| `serviceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Procedimiento del nomenclador (`VS_BO_MEDICAL_PROCEDURE`) que se ofrece | `src/modules/practice/dto/create-healthcare-service.dto.ts:33` |
| `serviceCatalogId` | `string` | Sí | formato uuid | `@IsUUID()` | Ítem del catálogo de precios de la práctica; su concepto debe ser el mismo `serviceConceptId` | `src/modules/practice/dto/create-healthcare-service.dto.ts:44` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de especialidad | `src/modules/practice/dto/create-healthcare-service.dto.ts:55` |
| `referralRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Requiere derivación? | `src/modules/practice/dto/create-healthcare-service.dto.ts:63` |
| `appointmentRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Requiere cita? | `src/modules/practice/dto/create-healthcare-service.dto.ts:71` |
| `telehealthAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Disponible por telesalud? | `src/modules/practice/dto/create-healthcare-service.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:129` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:133` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:137` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:141` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La práctica no está activa; PreconditionFailedException: El sitio no pertenece a la práctica; PreconditionFailedException: La unidad clínica no existe; PreconditionFailedException: El concepto no es un procedimiento del nomenclador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:297` |

### Flujos

- Módulo Practice (14) — etapa `UC-14-06`

---

## 37. PATCH /practices/{practiceId}/healthcare-services/{id}

- **Origen:** CONTRATO
- **Nombre:** Actualizar el precio o el estado de un procedimiento de la sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.updateHealthcareService` — `src/modules/practice/controllers/practices.controller.ts:346`

### Qué es y para qué sirve (negocio)

Actualizar el precio o el estado de un procedimiento de la sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /practices/{practiceId}/healthcare-services/{id}` la atiende `PracticesController.updateHealthcareService` (src/modules/practice/controllers/practices.controller.ts:346). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateHealthcareServiceDto` (2 campos, 0 obligatorios). Delega en `HealthcareServiceOffersService.updateOffer`. Actualiza practice.healthcare_services. Lee billing.service_catalog, directory.tenant_memberships, practice.healthcare_services, practice.practices, terminology.catalog_concepts, terminology.concept_properties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:346` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId, id | `src/modules/practice/controllers/practices.controller.ts:346` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | PracticesController.updateHealthcareService → HealthcareServiceOffersService.updateOffer → HealthcareServiceOffersService.toOffers → ServiceCatalogRepository.findByIds | `src/modules/billing/repositories/service-catalog.repository.ts:116` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.updateHealthcareService → HealthcareServiceOffersService.updateOffer → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.healthcare_services` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.updateHealthcareService → HealthcareServiceOffersService.updateOffer | `src/modules/practice/services/healthcare-service-offers.service.ts:120` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.updateHealthcareService → HealthcareServiceOffersService.updateOffer → HealthcareServicesRepository.findById | `src/modules/practice/repositories/healthcare-services.repository.ts:70` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.updateHealthcareService → HealthcareServiceOffersService.updateOffer → PracticeAdministrationService.assertCanAdministerPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PracticesController.updateHealthcareService → HealthcareServiceOffersService.updateOffer → HealthcareServiceOffersService.toOffers | `src/modules/practice/services/healthcare-service-offers.service.ts:158` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | PracticesController.updateHealthcareService → HealthcareServiceOffersService.updateOffer → HealthcareServiceOffersService.toOffers → ProcedureReferenceReader.referencesFor | `src/modules/billing/services/procedure-reference.reader.ts:78` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateHealthcareServiceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `serviceCatalogId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nuevo ítem del catálogo de precios de la práctica; su concepto debe coincidir con el del servicio | `src/modules/practice/dto/update-healthcare-service.dto.ts:16` |
| `active` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿El procedimiento está activo? | `src/modules/practice/dto/update-healthcare-service.dto.ts:24` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "active": true
}
```

</details>

### Respuesta — `Promise<HealthcareServiceOfferDto>` · DTO `HealthcareServiceOfferDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:11` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:15` |
| `serviceConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:19` |
| `serviceDisplay` | `string` | Sí | — | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:23` |
| `serviceCatalogId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:28` |
| `price` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:32` |
| `currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:37` |
| `referencePrice` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:41` |
| `referenceUnit` | `string` | Sí | valores: UMA, USD; admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:46` |
| `overMargin` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:51` |
| `visibleInSearch` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:55` |
| `active` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/healthcare-service-offer.dto.ts:59` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:457` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /practices/{practiceId}/inventory-items

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un insumo de inventario de práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createInventoryItem` — `src/modules/practice/controllers/practices.controller.ts:432`

### Qué es y para qué sirve (negocio)

Dar de alta un insumo de inventario de práctica. Caso de uso UC-14-10: Alta de insumo (stock 0). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:154`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/inventory-items` la atiende `PracticesController.createInventoryItem` (src/modules/practice/controllers/practices.controller.ts:432). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateInventoryItemDto` (6 campos, 1 obligatorio). Delega en `PracticeInventoryService.createItem`. Crea filas en practice.inventory_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:432` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:432` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:245` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:249` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:253` |
| `quantityOnHand` | `string` | Sí | — | — | Valor de quantity on hand mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:257` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:261` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:265` |

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

## 39. GET /practices/{practiceId}/organization

- **Origen:** CONTRATO
- **Nombre:** Consola de organización médica: estructura, plantilla y legajo
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.getOrganizationConsole` — `src/modules/practice/controllers/practices.controller.ts:133`

### Qué es y para qué sirve (negocio)

Consola de organización médica: estructura, plantilla y legajo. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices/{practiceId}/organization` la atiende `PracticesController.getOrganizationConsole` (src/modules/practice/controllers/practices.controller.ts:133). Exige sesión con alguno de los roles SECURITY_ADMIN, PERIOP_ADMIN, SURGERY_SCHEDULER, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER. Delega en `PracticeOrganizationReadService.getConsole`. Lee practice.care_spaces, practice.clinical_units, practice.healthcare_services, practice.inventory_items, practice.practice_accreditations, practice.practice_sites, practice.practices, practice.practitioner_role_assignments y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PERIOP_ADMIN, SURGERY_SCHEDULER, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER | `src/modules/practice/controllers/practices.controller.ts:133` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:133` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

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

## 40. GET /practices/{practiceId}/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Listar las vinculaciones profesional-organización de la práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.listRoleAssignments` — `src/modules/practice/controllers/practices.controller.ts:180`

### Qué es y para qué sirve (negocio)

Listar las vinculaciones profesional-organización de la práctica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practices/{practiceId}/role-assignments` la atiende `PracticesController.listRoleAssignments` (src/modules/practice/controllers/practices.controller.ts:180). Exige sesión; el controlador no declara roles. Delega en `PracticeWorkforceService.listPracticeAssignments`. Lee directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:180` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.listRoleAssignments → PracticeWorkforceService.listPracticeAssignments → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.listRoleAssignments → PracticeWorkforceService.listPracticeAssignments → PracticeAdministrationService.assertCanAdministerPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
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
| `items` | `array<PracticeRoleAssignmentItemDto>` | Sí | — | — | Vinculaciones de esta página, ordenadas por `id`. | `src/modules/practice/dto/responses.dto.ts:201` |
| `items[].status` | `string` | Sí | — | — | Estado como uuid de concepto, igual que antes de las filas por procedimiento. | `src/modules/practice/dto/role-assignment-row.dto.ts:92` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha de creación de la vinculación. | `src/modules/practice/dto/role-assignment-row.dto.ts:94` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/practice/dto/responses.dto.ts:206` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/practice/dto/responses.dto.ts:211` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/practice/dto/responses.dto.ts:217` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:129` |
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:616` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. POST /practices/{practiceId}/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar un rol de profesional a sitio/unidad/servicio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.assignRole` — `src/modules/practice/controllers/practices.controller.ts:386`

### Qué es y para qué sirve (negocio)

Asignar un rol de profesional a sitio/unidad/servicio. Caso de uso UC-14-08: Asignar rol de profesional. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:152`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/role-assignments` la atiende `PracticesController.assignRole` (src/modules/practice/controllers/practices.controller.ts:386). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeCreateRoleAssignmentDto` (11 campos, 1 obligatorio). Delega en `PracticeWorkforceService.assignRole`. Crea filas en practice.practitioner_role_assignments. Lee practice.clinical_units, practice.healthcare_services, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:386` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:386` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.clinical_units` | LEE | LEE | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → HealthcareServicesRepository.findById | `src/modules/practice/repositories/healthcare-services.repository.ts:70` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | PracticesController.assignRole → PracticeWorkforceService.assignRole → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:311` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:170` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:174` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:178` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:182` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:186` |

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

## 42. POST /practices/{practiceId}/role-assignments/invitations

- **Origen:** CONTRATO
- **Nombre:** Invitar a un profesional a procedimientos de una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticeInvitationsController.invite` — `src/modules/practice/controllers/practice-invitations.controller.ts:39`

### Qué es y para qué sirve (negocio)

Invitar a un profesional a procedimientos de una sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/role-assignments/invitations` la atiende `PracticeInvitationsController.invite` (src/modules/practice/controllers/practice-invitations.controller.ts:39). Exige sesión; el controlador no declara roles. Valida el cuerpo como `InvitePractitionerDto` (3 campos, 3 obligatorios). Delega en `PracticeAffiliationInvitationsService.invite`. Crea filas en practice.practitioner_role_assignments. Lee directory.tenant_memberships, practice.healthcare_services, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practice-invitations.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practice-invitations.controller.ts:39` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticeInvitationsController.invite → PracticeAffiliationInvitationsService.invite → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticeInvitationsController.invite → PracticeAffiliationInvitationsService.invite → HealthcareServicesRepository.findById | `src/modules/practice/repositories/healthcare-services.repository.ts:70` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticeInvitationsController.invite → PracticeAffiliationInvitationsService.invite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticeInvitationsController.invite → PracticeAffiliationInvitationsService.invite → PracticeAdministrationService.assertCanAdministerPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | PracticeInvitationsController.invite → PracticeAffiliationInvitationsService.invite → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:311` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PracticeInvitationsController.invite → PracticeAffiliationInvitationsService.invite → PractitionerRoleAssignmentsRepository.findOpenForServices | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:292` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PracticeInvitationsController.invite → PracticeAffiliationInvitationsService.invite → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `InvitePractitionerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/practice/dto/role-assignment-row.dto.ts:67` |
| `practiceSiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/practice/dto/role-assignment-row.dto.ts:72` |
| `healthcareServiceIds` | `array<string>` | Sí | formato uuid; mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_INVITED_SERVICES)` `@ArrayUnique()` `@IsUUID('all', { each: true })` | — | `src/modules/practice/dto/role-assignment-row.dto.ts:86` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<RoleAssignmentRowsResponseDto>` · DTO `RoleAssignmentRowsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<RoleAssignmentRowDto>` | Sí | — | — | Filas creadas, en el orden pedido. | `src/modules/practice/dto/role-assignment-row.dto.ts:59` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la afiliación. | `src/modules/practice/dto/role-assignment-row.dto.ts:24` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid | — | Profesional afiliado. | `src/modules/practice/dto/role-assignment-row.dto.ts:26` |
| `items[].practitionerName` | `string` | Sí | — | — | Nombre legible del profesional. | `src/modules/practice/dto/role-assignment-row.dto.ts:28` |
| `items[].practiceId` | `string` | Sí | formato uuid | — | Organización. | `src/modules/practice/dto/role-assignment-row.dto.ts:30` |
| `items[].practiceSiteId` | `string` | Sí | formato uuid; admite null | — | Sede; `null` en una vinculación antigua que no declara sede. | `src/modules/practice/dto/role-assignment-row.dto.ts:33` |
| `items[].healthcareServiceId` | `string` | Sí | formato uuid; admite null | — | Servicio ofrecido por la sede; `null` si la vinculación no es por procedimiento. | `src/modules/practice/dto/role-assignment-row.dto.ts:36` |
| `items[].serviceConceptId` | `string` | Sí | formato uuid; admite null | — | Procedimiento del nomenclador del servicio; `null` sin servicio. | `src/modules/practice/dto/role-assignment-row.dto.ts:39` |
| `items[].serviceDisplay` | `string` | Sí | admite null | — | Nombre del procedimiento para mostrar; `null` sin servicio. | `src/modules/practice/dto/role-assignment-row.dto.ts:42` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado (uuid). | `src/modules/practice/dto/role-assignment-row.dto.ts:44` |
| `items[].statusCode` | `string` | Sí | — | — | Código del concepto del estado (`ROLE_ASG_ACTIVE`, …); el front compara por código. | `src/modules/practice/dto/role-assignment-row.dto.ts:46` |
| `items[].initiatedBy` | `object` | Sí | — | — | Quién abrió la afiliación. Se deriva de la cuenta que creó la fila: si es la del propio profesional, `PRACTITIONER`; si no, `PRACTICE`. | `src/modules/practice/dto/role-assignment-row.dto.ts:52` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 409 | `CONFLICT` | ConflictException: El profesional ya tiene una vinculación en curso con ese procedimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La práctica no está activa; PreconditionFailedException: El sitio no pertenece a la práctica; PreconditionFailedException: El profesional no existe; PreconditionFailedException: El procedimiento no está publicado y activo en esa sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:548` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticeInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. POST /practices/{practiceId}/role-assignments/self-request

- **Origen:** CONTRATO
- **Nombre:** Solicitar la propia vinculación a una organización
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.selfRequestRoleAssignment` — `src/modules/practice/controllers/practices.controller.ts:410`

### Qué es y para qué sirve (negocio)

Solicitar la propia vinculación a una organización. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/role-assignments/self-request` la atiende `PracticesController.selfRequestRoleAssignment` (src/modules/practice/controllers/practices.controller.ts:410). Exige sesión con alguno de los roles PRACTITIONER. Valida el cuerpo como `PracticeSelfRequestRoleAssignmentDto` (6 campos, 0 obligatorios). Delega en `PracticeWorkforceService.selfRequestAffiliation`. Crea filas en practice.practitioner_role_assignments. Lee practice.healthcare_services, practice.practice_sites, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/practice/controllers/practices.controller.ts:410` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:410` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PracticeWorkforceService.assertServiceOfferedBySite → HealthcareServicesRepository.findById | `src/modules/practice/repositories/healthcare-services.repository.ts:70` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:311` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PracticesController.selfRequestRoleAssignment → PracticeWorkforceService.selfRequestAffiliation → PractitionerRoleAssignmentsRepository.findOpenForServices | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:292` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practiceId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeSelfRequestRoleAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de la práctica | `src/modules/practice/dto/self-request-role-assignment.dto.ts:25` |
| `roleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de cargo/rol | `src/modules/practice/dto/self-request-role-assignment.dto.ts:31` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de especialidad | `src/modules/practice/dto/self-request-role-assignment.dto.ts:40` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/practice/dto/self-request-role-assignment.dto.ts:46` |
| `healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio de salud (procedimiento) de la sede | `src/modules/practice/dto/self-request-role-assignment.dto.ts:58` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:65` |

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
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RoleAssignmentResponseDto>` · DTO `RoleAssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:170` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:174` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:178` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:182` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:186` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Práctica no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya tenés una vinculación en curso con ese procedimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: La práctica no está activa; PreconditionFailedException: El sitio no pertenece a la práctica; PreconditionFailedException: El procedimiento no está publicado y activo en esa sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:699` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. PUT /practices/{practiceId}/settings/{settingKey}

- **Origen:** CONTRATO
- **Nombre:** Configurar un ajuste de práctica (upsert)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.upsertSetting` — `src/modules/practice/controllers/practices.controller.ts:367`

### Qué es y para qué sirve (negocio)

Configurar un ajuste de práctica (upsert). Caso de uso UC-14-07: Configurar ajuste (upsert). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:151`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /practices/{practiceId}/settings/{settingKey}` la atiende `PracticesController.upsertSetting` (src/modules/practice/controllers/practices.controller.ts:367). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpsertSettingDto` (2 campos, 1 obligatorio). Delega en `PracticeSettingsService.upsert`. Crea filas en practice.practice_settings. Actualiza practice.practice_settings. Lee practice.practice_settings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/practices.controller.ts:367` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:367` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:149` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:153` |
| `settingKey` | `string` | Sí | — | — | Valor de setting key mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:157` |
| `created` | `boolean` | Sí | — | — | true si se creó, false si se actualizó | `src/modules/practice/dto/responses.dto.ts:162` |

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

## 45. GET /practices/{practiceId}/sites

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

`GET /practices/{practiceId}/sites` la atiende `PracticesController.listSites` (src/modules/practice/controllers/practices.controller.ts:164). Exige sesión; el controlador no declara roles. Delega en `PracticeSitesService.listSites`. Lee directory.tenant_memberships, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:164` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:164` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.listSites → PracticeSitesService.listSites → PracticeSitesService.assertCanReadPractices → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.listSites → PracticeSitesService.listSites → PracticeSitesRepository.findByPractice | `src/modules/practice/repositories/practice-sites.repository.ts:104` |
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
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:316` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:318` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:320` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:322` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:324` |

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
| INTEGRACION | `test/integration/medical-center-registration.int-spec.ts:180` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. POST /practices/{practiceId}/sites

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un sitio de práctica
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.createSite` — `src/modules/practice/controllers/practices.controller.ts:236`

### Qué es y para qué sirve (negocio)

Dar de alta un sitio de práctica. Caso de uso UC-14-01: Alta de sitio (op. status PLANNED). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:145`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practices/{practiceId}/sites` la atiende `PracticesController.createSite` (src/modules/practice/controllers/practices.controller.ts:236). Exige sesión; el controlador no declara roles. Valida el cuerpo como `PracticeCreateSiteDto` (8 campos, 2 obligatorios). Delega en `PracticeSitesService.createSite`. Crea filas en practice.practice_sites. Lee directory.branches, directory.tenant_memberships, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:236` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId | `src/modules/practice/controllers/practices.controller.ts:236` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branches` | LEE | LEE | DIRECTA | PracticesController.createSite → PracticeSitesService.createSite → BranchesRepository.findById | `src/modules/directory/repositories/branches.repository.ts:53` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.createSite → PracticeSitesService.createSite → StructureAccessService.assertCanAdministerOrganization → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | PracticesController.createSite → PracticeSitesService.createSite → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:116` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.createSite → PracticeSitesService.createSite → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:90` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:29` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:33` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:37` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:41` |
| `operationalStatus` | `string` | Sí | — | — | Valor de operational status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:45` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:49` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Branch no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe un sitio con ese código en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La práctica no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:137` |
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:224` |
| INTEGRACION | `test/integration/infrastructure-f5c.int-spec.ts:112` |
| INTEGRACION | `test/integration/infrastructure-f5f.int-spec.ts:61` |
| INTEGRACION | `test/integration/infrastructure-fixture.ts:98` |
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:91` |
| INTEGRACION | `test/integration/practice-structure-tenancy.int-spec.ts:130` |

### Flujos

- Módulo Practice (14) — etapa `UC-14-01`

---

## 47. DELETE /practices/{practiceId}/sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Desmantelar un sitio en cascada (soft-delete)
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PracticesController.decommissionSite` — `src/modules/practice/controllers/practices.controller.ts:258`

### Qué es y para qué sirve (negocio)

Desmantelar un sitio en cascada (soft-delete). Caso de uso UC-14-12: Desmantelar sitio en cascada. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:156`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /practices/{practiceId}/sites/{siteId}` la atiende `PracticesController.decommissionSite` (src/modules/practice/controllers/practices.controller.ts:258). Exige sesión; el controlador no declara roles. Delega en `PracticeSitesService.decommissionSite`. Actualiza practice.care_spaces, practice.clinical_units, practice.healthcare_services, practice.practice_sites, practice.practitioner_role_assignments. Lee directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.healthcare_services, practice.practice_sites, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/practices.controller.ts:258` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: practiceId, siteId | `src/modules/practice/controllers/practices.controller.ts:258` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → StructureAccessService.assertCanAdministerOrganization → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:457` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:451` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → ClinicalUnitsRepository.findBySite | `src/modules/practice/repositories/clinical-units.repository.ts:79` |
| `practice.healthcare_services` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:464` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → HealthcareServicesRepository.findBySite | `src/modules/practice/repositories/healthcare-services.repository.ts:84` |
| `practice.practice_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:443` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PracticesController.decommissionSite → PracticeSitesService.decommissionSite → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PracticesController.decommissionSite → PracticeSitesService.decommissionSite | `src/modules/practice/services/practice-sites.service.ts:470` |
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
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/practice/dto/responses.dto.ts:293` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado en la práctica |
| 409 | `CONFLICT` | ConflictException: El sitio ya está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-structure-tenancy.int-spec.ts:211` |

### Flujos

- Módulo Practice (14) — etapa `UC-14-12`

---

## 48. GET /practitioners/{profileId}/sites

- **Origen:** CONTRATO
- **Nombre:** Consultorios donde atiende el profesional
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.listSites` — `src/modules/practice/controllers/practitioner-sites.controller.ts:87`

### Qué es y para qué sirve (negocio)

Consultorios donde atiende el profesional. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practitioners/{profileId}/sites` la atiende `PractitionerSitesController.listSites` (src/modules/practice/controllers/practitioner-sites.controller.ts:87). Exige sesión con alguno de los roles SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT. Delega en `PractitionerSitesService.listSitesOfPractitioner`. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT | `src/modules/practice/controllers/practitioner-sites.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/practice/controllers/practitioner-sites.controller.ts:87` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.listSites → PractitionerSitesService.listSitesOfPractitioner → PractitionerSitesService.loadSites → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:620` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.listSites → PractitionerSitesService.listSitesOfPractitioner → PractitionerSitesService.loadSites → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
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
| `items` | `array<PractitionerSiteDto>` | Sí | — | — | Las sedes donde atiende, la principal primero. | `src/modules/practice/dto/responses.dto.ts:400` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:341` |
| `items[].practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:343` |
| `items[].code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:345` |
| `items[].name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:347` |
| `items[].timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:350` |
| `items[].addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:353` |
| `items[].latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:356` |
| `items[].longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:359` |
| `items[].contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:362` |
| `items[].isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:374` |
| `items[].bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:385` |
| `items[].logoFileId` | `string` | No | formato uuid; admite null | — | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `src/modules/practice/dto/responses.dto.ts:391` |
| `items[].status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:393` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/practice/dto/responses.dto.ts:404` |

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

## 49. GET /practitioners/me/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Mis vinculaciones con organizaciones
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.listMyAssignments` — `src/modules/practice/controllers/practitioner-sites.controller.ts:73`

### Qué es y para qué sirve (negocio)

Mis vinculaciones con organizaciones. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /practitioners/me/role-assignments` la atiende `PractitionerSitesController.listMyAssignments` (src/modules/practice/controllers/practitioner-sites.controller.ts:73). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PracticeWorkforceService.listMyAssignments`. Lee community.public_profiles, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/practice/controllers/practitioner-sites.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.listMyAssignments → PracticeWorkforceService.listMyAssignments | `src/modules/practice/services/practice-workforce.service.ts:357` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.listMyAssignments → PracticeWorkforceService.listMyAssignments → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.listMyAssignments → PracticeWorkforceService.listMyAssignments → PractitionerRoleAssignmentsRepository.findByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:151` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyRoleAssignmentResponseDto[]>` · DTO `MyRoleAssignmentResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceName` | `string` | Sí | — | — | Nombre legible de la organización. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:82` |
| `practiceType` | `string` | No | formato uuid; admite null | — | Tipo de organización (concepto). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:85` |
| `roleConceptId` | `string` | Sí | formato uuid | — | Cargo. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:87` |
| `specialtyConceptId` | `string` | No | formato uuid; admite null | — | Especialidad, si la vinculación la declara. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:90` |
| `status` | `string` | Sí | formato uuid | — | Estado de la vinculación (pendiente/activa/suspendida/rechazada/finalizada). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:92` |
| `isPrimary` | `boolean` | Sí | — | — | ¿Es la organización principal del profesional? | `src/modules/practice/dto/self-request-role-assignment.dto.ts:94` |
| `validFrom` | `string` | No | formato date-time; admite null | — | Vigente desde. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:96` |
| `validTo` | `string` | No | formato date-time; admite null | — | Vigente hasta (null = sigue vigente). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:98` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha de creación de la vinculación (o de la solicitud). | `src/modules/practice/dto/self-request-role-assignment.dto.ts:100` |
| `avatarUrl` | `string` | No | admite null | — | Logo de la organización, tomado de su ficha pública (`community.public_profiles`), o `null` si no tiene una. | `src/modules/practice/dto/self-request-role-assignment.dto.ts:105` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:661` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. POST /practitioners/me/role-assignments/{roleId}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar una invitación de un centro
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerInvitationsController.accept` — `src/modules/practice/controllers/practitioner-invitations.controller.ts:40`

### Qué es y para qué sirve (negocio)

Aceptar una invitación de un centro. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practitioners/me/role-assignments/{roleId}/accept` la atiende `PractitionerInvitationsController.accept` (src/modules/practice/controllers/practitioner-invitations.controller.ts:40). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PracticeAffiliationInvitationsService.accept`. Actualiza practice.practitioner_role_assignments. Lee practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/practice/controllers/practitioner-invitations.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/practitioner-invitations.controller.ts:40` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerInvitationsController.accept → PracticeAffiliationInvitationsService.accept → PracticeAffiliationInvitationsService.resolve | `src/modules/practice/services/practice-affiliation-invitations.service.ts:238` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerInvitationsController.accept → PracticeAffiliationInvitationsService.accept → PracticeAffiliationInvitationsService.resolve → PractitionerRoleAssignmentsRepository.findByIdForPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:264` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RoleAssignmentRowDto>` · DTO `RoleAssignmentRowDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la afiliación. | `src/modules/practice/dto/role-assignment-row.dto.ts:24` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Profesional afiliado. | `src/modules/practice/dto/role-assignment-row.dto.ts:26` |
| `practitionerName` | `string` | Sí | — | — | Nombre legible del profesional. | `src/modules/practice/dto/role-assignment-row.dto.ts:28` |
| `practiceId` | `string` | Sí | formato uuid | — | Organización. | `src/modules/practice/dto/role-assignment-row.dto.ts:30` |
| `practiceSiteId` | `string` | Sí | formato uuid; admite null | — | Sede; `null` en una vinculación antigua que no declara sede. | `src/modules/practice/dto/role-assignment-row.dto.ts:33` |
| `healthcareServiceId` | `string` | Sí | formato uuid; admite null | — | Servicio ofrecido por la sede; `null` si la vinculación no es por procedimiento. | `src/modules/practice/dto/role-assignment-row.dto.ts:36` |
| `serviceConceptId` | `string` | Sí | formato uuid; admite null | — | Procedimiento del nomenclador del servicio; `null` sin servicio. | `src/modules/practice/dto/role-assignment-row.dto.ts:39` |
| `serviceDisplay` | `string` | Sí | admite null | — | Nombre del procedimiento para mostrar; `null` sin servicio. | `src/modules/practice/dto/role-assignment-row.dto.ts:42` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado (uuid). | `src/modules/practice/dto/role-assignment-row.dto.ts:44` |
| `statusCode` | `string` | Sí | — | — | Código del concepto del estado (`ROLE_ASG_ACTIVE`, …); el front compara por código. | `src/modules/practice/dto/role-assignment-row.dto.ts:46` |
| `initiatedBy` | `object` | Sí | — | — | Quién abrió la afiliación. Se deriva de la cuenta que creó la fila: si es la del propio profesional, `PRACTITIONER`; si no, `PRACTICE`. | `src/modules/practice/dto/role-assignment-row.dto.ts:52` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vinculación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: La vinculación no admite esa acción desde su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:648` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 51. POST /practitioners/me/role-assignments/{roleId}/decline

- **Origen:** CONTRATO
- **Nombre:** Declinar una invitación de un centro
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerInvitationsController.decline` — `src/modules/practice/controllers/practitioner-invitations.controller.ts:57`

### Qué es y para qué sirve (negocio)

Declinar una invitación de un centro. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practitioners/me/role-assignments/{roleId}/decline` la atiende `PractitionerInvitationsController.decline` (src/modules/practice/controllers/practitioner-invitations.controller.ts:57). Exige sesión con alguno de los roles PRACTITIONER. Delega en `PracticeAffiliationInvitationsService.decline`. Actualiza practice.practitioner_role_assignments. Lee practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER | `src/modules/practice/controllers/practitioner-invitations.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/practitioner-invitations.controller.ts:57` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerInvitationsController.decline → PracticeAffiliationInvitationsService.decline → PracticeAffiliationInvitationsService.resolve | `src/modules/practice/services/practice-affiliation-invitations.service.ts:238` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerInvitationsController.decline → PracticeAffiliationInvitationsService.decline → PracticeAffiliationInvitationsService.resolve → PractitionerRoleAssignmentsRepository.findByIdForPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:264` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RoleAssignmentRowDto>` · DTO `RoleAssignmentRowDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la afiliación. | `src/modules/practice/dto/role-assignment-row.dto.ts:24` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Profesional afiliado. | `src/modules/practice/dto/role-assignment-row.dto.ts:26` |
| `practitionerName` | `string` | Sí | — | — | Nombre legible del profesional. | `src/modules/practice/dto/role-assignment-row.dto.ts:28` |
| `practiceId` | `string` | Sí | formato uuid | — | Organización. | `src/modules/practice/dto/role-assignment-row.dto.ts:30` |
| `practiceSiteId` | `string` | Sí | formato uuid; admite null | — | Sede; `null` en una vinculación antigua que no declara sede. | `src/modules/practice/dto/role-assignment-row.dto.ts:33` |
| `healthcareServiceId` | `string` | Sí | formato uuid; admite null | — | Servicio ofrecido por la sede; `null` si la vinculación no es por procedimiento. | `src/modules/practice/dto/role-assignment-row.dto.ts:36` |
| `serviceConceptId` | `string` | Sí | formato uuid; admite null | — | Procedimiento del nomenclador del servicio; `null` sin servicio. | `src/modules/practice/dto/role-assignment-row.dto.ts:39` |
| `serviceDisplay` | `string` | Sí | admite null | — | Nombre del procedimiento para mostrar; `null` sin servicio. | `src/modules/practice/dto/role-assignment-row.dto.ts:42` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado (uuid). | `src/modules/practice/dto/role-assignment-row.dto.ts:44` |
| `statusCode` | `string` | Sí | — | — | Código del concepto del estado (`ROLE_ASG_ACTIVE`, …); el front compara por código. | `src/modules/practice/dto/role-assignment-row.dto.ts:46` |
| `initiatedBy` | `object` | Sí | — | — | Quién abrió la afiliación. Se deriva de la cuenta que creó la fila: si es la del propio profesional, `PRACTITIONER`; si no, `PRACTICE`. | `src/modules/practice/dto/role-assignment-row.dto.ts:52` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vinculación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un perfil profesional asociado; PreconditionFailedException: La vinculación no admite esa acción desde su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. POST /practitioners/me/sites

- **Origen:** CONTRATO
- **Nombre:** Registrar un consultorio propio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.createOwnSite` — `src/modules/practice/controllers/practitioner-sites.controller.ts:115`

### Qué es y para qué sirve (negocio)

Registrar un consultorio propio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /practitioners/me/sites` la atiende `PractitionerSitesController.createOwnSite` (src/modules/practice/controllers/practitioner-sites.controller.ts:115). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreateOwnSiteDto` (12 campos, 1 obligatorio). Delega en `PractitionerSitesService.createOwnSite`. Crea filas en common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments. Lee common.file_versions, common.files, practice.practice_sites, practice.practices, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:154` |
| `common.file_versions` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → PractitionerSitesService.assertUsableLogo → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → PractitionerSitesService.assertUsableLogo → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:116` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → OwnSiteProvisioningService.uniqueSiteCode → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:90` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:135` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → OwnSiteProvisioningService.provision → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:311` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.createOwnSite → PractitionerSitesService.createOwnSite → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `CreateOwnSiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 2; longitud máxima 200 | `@IsString()` `@MinLength(2)` `@MaxLength(200)` | Nombre del consultorio | `src/common/dto/create-own-site.dto.ts:123` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/common/dto/create-own-site.dto.ts:130` |
| `address` | `OwnSiteAddressDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OwnSiteAddressDto)` | — | `src/common/dto/create-own-site.dto.ts:137` |
| `address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/common/dto/create-own-site.dto.ts:44` |
| `address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/common/dto/create-own-site.dto.ts:51` |
| `address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:57` |
| `address.district` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/common/dto/create-own-site.dto.ts:67` |
| `address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:73` |
| `address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/common/dto/create-own-site.dto.ts:94` |
| `address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/common/dto/create-own-site.dto.ts:105` |
| `contactPhone` | `string` | No | longitud máxima 40; patrón runtime SITE_CONTACT_PHONE_PATTERN | `@IsOptional()` `@IsString()` `@Matches(SITE_CONTACT_PHONE_PATTERN)` `@MaxLength(40)` | — | `src/common/dto/create-own-site.dto.ts:145` |
| `logoFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:159` |

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
    "district": "valor-ejemplo",
    "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "contactPhone": "+591 72123456",
  "logoFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PractitionerSiteDto>` · DTO `PractitionerSiteDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:341` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:343` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:345` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:347` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:350` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:353` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:356` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:359` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:362` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:374` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:385` |
| `logoFileId` | `string` | No | formato uuid; admite null | — | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `src/modules/practice/dto/responses.dto.ts:391` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:393` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: El logo no es un archivo suyo que se pueda usar; PreconditionFailedException: El logo debe ser una imagen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. DELETE /practitioners/me/sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Retirar un consultorio propio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.deleteOwnSite` — `src/modules/practice/controllers/practitioner-sites.controller.ts:241`

### Qué es y para qué sirve (negocio)

Retirar un consultorio propio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /practitioners/me/sites/{siteId}` la atiende `PractitionerSitesController.deleteOwnSite` (src/modules/practice/controllers/practitioner-sites.controller.ts:241). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `PractitionerSitesService.deleteOwnSite`. Actualiza practice.practitioner_role_assignments. Lee practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:241` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:241` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.deleteOwnSite → PractitionerSitesService.deleteOwnSite | `src/modules/practice/services/practitioner-sites.service.ts:416` |
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

## 54. PATCH /practitioners/me/sites/{siteId}

- **Origen:** CONTRATO
- **Nombre:** Corregir un consultorio propio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.updateOwnSite` — `src/modules/practice/controllers/practitioner-sites.controller.ts:142`

### Qué es y para qué sirve (negocio)

Corregir un consultorio propio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /practitioners/me/sites/{siteId}` la atiende `PractitionerSitesController.updateOwnSite` (src/modules/practice/controllers/practitioner-sites.controller.ts:142). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `UpdateOwnSiteDto` (10 campos, 0 obligatorios). Delega en `PractitionerSitesService.updateOwnSite`. Crea filas en common.addresses. Actualiza common.addresses, practice.practice_sites. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:142` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.moveAddress → AddressesRepository.closeCurrent | `src/modules/common/repositories/addresses.repository.ts:148` |
| `common.addresses` | ESCRIBE | CREA | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.moveAddress → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:154` |
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.moveAddress | `src/modules/practice/services/practitioner-sites.service.ts:773` |
| `practice.practice_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite | `src/modules/practice/services/practitioner-sites.service.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.requireOwnSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.updateOwnSite → PractitionerSitesService.updateOwnSite → PractitionerSitesService.requireOwnSite → PractitionerSitesService.isOwnPractice → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:135` |
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
| `address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/common/dto/create-own-site.dto.ts:44` |
| `address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/common/dto/create-own-site.dto.ts:51` |
| `address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:57` |
| `address.district` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/common/dto/create-own-site.dto.ts:67` |
| `address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:73` |
| `address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/common/dto/create-own-site.dto.ts:94` |
| `address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/common/dto/create-own-site.dto.ts:105` |

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
    "district": "valor-ejemplo",
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
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:341` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:343` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:345` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:347` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:350` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:353` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:356` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:359` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:362` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:374` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:385` |
| `logoFileId` | `string` | No | formato uuid; admite null | — | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `src/modules/practice/dto/responses.dto.ts:391` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:393` |

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

## 55. PUT /practitioners/me/sites/{siteId}/bank-qr

- **Origen:** CONTRATO
- **Nombre:** Fijar o quitar el QR bancario de una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.setSiteBankQr` — `src/modules/practice/controllers/practitioner-sites.controller.ts:169`

### Qué es y para qué sirve (negocio)

Fijar o quitar el QR bancario de una sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /practitioners/me/sites/{siteId}/bank-qr` la atiende `PractitionerSitesController.setSiteBankQr` (src/modules/practice/controllers/practitioner-sites.controller.ts:169). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SetSiteBankQrDto` (1 campo, 1 obligatorio). Delega en `PractitionerSitesService.setSiteBankQr`. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:169` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:620` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteBankQr → PractitionerSitesService.setSiteBankQr → PractitionerSitesService.isOwnPractice → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:135` |
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
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:341` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:343` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:345` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:347` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:350` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:353` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:356` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:359` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:362` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:374` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:385` |
| `logoFileId` | `string` | No | formato uuid; admite null | — | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `src/modules/practice/dto/responses.dto.ts:391` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:393` |

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

## 56. PUT /practitioners/me/sites/{siteId}/contact-phone

- **Origen:** CONTRATO
- **Nombre:** Guardar o quitar mi teléfono en una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.setSiteContactPhone` — `src/modules/practice/controllers/practitioner-sites.controller.ts:217`

### Qué es y para qué sirve (negocio)

Guardar o quitar mi teléfono en una sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /practitioners/me/sites/{siteId}/contact-phone` la atiende `PractitionerSitesController.setSiteContactPhone` (src/modules/practice/controllers/practitioner-sites.controller.ts:217). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SetSiteContactPhoneDto` (1 campo, 1 obligatorio). Delega en `PractitionerSitesService.setSiteContactPhone`. Actualiza practice.practitioner_role_assignments. Lee common.addresses, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:217` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:217` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:620` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.setSiteContactPhone → PractitionerSitesService.setSiteContactPhone | `src/modules/practice/services/practitioner-sites.service.ts:381` |
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
| `contactPhone` | `string` | Sí | longitud máxima 40; patrón runtime SITE_CONTACT_PHONE_PATTERN; admite null | `@ValidateIf((dto: SetSiteContactPhoneDto) => dto.contactPhone !== null)` `@IsString()` `@Matches(SITE_CONTACT_PHONE_PATTERN)` `@MaxLength(40)` | — | `src/modules/practice/dto/update-own-site.dto.ts:123` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:341` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:343` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:345` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:347` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:350` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:353` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:356` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:359` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:362` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:374` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:385` |
| `logoFileId` | `string` | No | formato uuid; admite null | — | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `src/modules/practice/dto/responses.dto.ts:391` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:393` |

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

## 57. PUT /practitioners/me/sites/{siteId}/logo

- **Origen:** CONTRATO
- **Nombre:** Fijar o quitar el logo del consultorio propio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSitesController.setSiteLogo` — `src/modules/practice/controllers/practitioner-sites.controller.ts:196`

### Qué es y para qué sirve (negocio)

Fijar o quitar el logo del consultorio propio. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /practitioners/me/sites/{siteId}/logo` la atiende `PractitionerSitesController.setSiteLogo` (src/modules/practice/controllers/practitioner-sites.controller.ts:196). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SetSiteLogoDto` (1 campo, 1 obligatorio). Delega en `PractitionerSitesService.setSiteLogo`. Actualiza practice.practice_sites. Lee common.addresses, common.file_versions, common.files, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/practice/controllers/practitioner-sites.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/practitioner-sites.controller.ts:196` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:620` |
| `common.file_versions` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → PractitionerSitesService.assertUsableLogo → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → PractitionerSitesService.assertUsableLogo → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `practice.practice_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo | `src/modules/practice/services/practitioner-sites.service.ts:330` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → PractitionerSitesService.requireOwnSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → PractitionerSitesService.requireOwnSite → PractitionerSitesService.isOwnPractice → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:135` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → PractitionerRoleAssignmentsRepository.findCurrentBySite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:202` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSitesController.setSiteLogo → PractitionerSitesService.setSiteLogo → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetSiteLogoDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `object` | Sí | formato uuid; admite null | `@ValidateIf((dto: SetSiteLogoDto) => dto.fileId !== null)` `@IsUUID()` | Imagen del logo ya subida, o null para quitarlo | `src/modules/practice/dto/update-own-site.dto.ts:108` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador de la sede. | `src/modules/practice/dto/responses.dto.ts:341` |
| `practiceId` | `string` | Sí | formato uuid | — | Práctica a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:343` |
| `code` | `string` | Sí | — | — | Código único dentro de la práctica. | `src/modules/practice/dto/responses.dto.ts:345` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:347` |
| `timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/practice/dto/responses.dto.ts:350` |
| `addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/practice/dto/responses.dto.ts:353` |
| `latitude` | `number` | No | admite null | — | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `src/modules/practice/dto/responses.dto.ts:356` |
| `longitude` | `number` | No | admite null | — | Longitud del punto de la sede. Va siempre junto a `latitude`. | `src/modules/practice/dto/responses.dto.ts:359` |
| `contactPhone` | `string` | No | admite null | — | Teléfono de este profesional en esta sede, si lo declaró. | `src/modules/practice/dto/responses.dto.ts:362` |
| `isOwnSite` | `boolean` | Sí | — | — | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `src/modules/practice/dto/responses.dto.ts:374` |
| `bankQrFileId` | `string` | No | formato uuid; admite null | — | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `src/modules/practice/dto/responses.dto.ts:385` |
| `logoFileId` | `string` | No | formato uuid; admite null | — | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `src/modules/practice/dto/responses.dto.ts:391` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:393` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Esa sede no es un consultorio propio suyo; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: El logo no es un archivo suyo que se pueda usar; PreconditionFailedException: El logo debe ser una imagen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:PractitionerSitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 58. POST /role-assignments/{roleId}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar una vinculación pendiente
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.approve` — `src/modules/practice/controllers/role-assignments.controller.ts:68`

### Qué es y para qué sirve (negocio)

Aprobar una vinculación pendiente. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/approve` la atiende `RoleAssignmentsController.approve` (src/modules/practice/controllers/role-assignments.controller.ts:68). Exige sesión; el controlador no declara roles. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.approveAssignment`. Lee directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/role-assignments.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | RoleAssignmentsController.approve → PracticeWorkforceService.approveAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.approve → PracticeWorkforceService.approveAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.approve → PracticeWorkforceService.approveAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:76` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:170` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:174` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:178` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:182` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:186` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:640` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:RoleAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 59. POST /role-assignments/{roleId}/end

- **Origen:** CONTRATO
- **Nombre:** Finalizar una vinculación
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.end` — `src/modules/practice/controllers/role-assignments.controller.ts:120`

### Qué es y para qué sirve (negocio)

Finalizar una vinculación. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/end` la atiende `RoleAssignmentsController.end` (src/modules/practice/controllers/role-assignments.controller.ts:120). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.endAssignment`. Lee directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:120` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | RoleAssignmentsController.end → PracticeWorkforceService.endAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.end → PracticeWorkforceService.endAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.end → PracticeWorkforceService.endAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:76` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:170` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:174` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:178` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:182` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:186` |

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

## 60. POST /role-assignments/{roleId}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar una vinculación pendiente
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.reject` — `src/modules/practice/controllers/role-assignments.controller.ts:85`

### Qué es y para qué sirve (negocio)

Rechazar una vinculación pendiente. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/reject` la atiende `RoleAssignmentsController.reject` (src/modules/practice/controllers/role-assignments.controller.ts:85). Exige sesión; el controlador no declara roles. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.rejectAssignment`. Lee directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/role-assignments.controller.ts:85` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:85` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | RoleAssignmentsController.reject → PracticeWorkforceService.rejectAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.reject → PracticeWorkforceService.rejectAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.reject → PracticeWorkforceService.rejectAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:76` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:170` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:174` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:178` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:182` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:186` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:745` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:RoleAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 61. POST /role-assignments/{roleId}/support-assignments

- **Origen:** CONTRATO
- **Nombre:** Adjuntar personal de apoyo a un rol de profesional
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.attachSupport` — `src/modules/practice/controllers/role-assignments.controller.ts:44`

### Qué es y para qué sirve (negocio)

Adjuntar personal de apoyo a un rol de profesional. Caso de uso UC-14-09: Adjuntar personal de apoyo. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:153`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/support-assignments` la atiende `RoleAssignmentsController.attachSupport` (src/modules/practice/controllers/role-assignments.controller.ts:44). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateSupportAssignmentDto` (5 campos, 1 obligatorio). Delega en `PracticeWorkforceService.attachSupport`. Crea filas en practice.practitioner_support_assignments. Lee practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:44` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:225` |
| `practitionerRoleAssignmentId` | `string` | Sí | — | — | Identificador asociado a practitioner role assignment. | `src/modules/practice/dto/responses.dto.ts:229` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:233` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:237` |

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

## 62. POST /role-assignments/{roleId}/suspend

- **Origen:** CONTRATO
- **Nombre:** Suspender una vinculación activa
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RoleAssignmentsController.suspend` — `src/modules/practice/controllers/role-assignments.controller.ts:102`

### Qué es y para qué sirve (negocio)

Suspender una vinculación activa. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /role-assignments/{roleId}/suspend` la atiende `RoleAssignmentsController.suspend` (src/modules/practice/controllers/role-assignments.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PracticeRoleAssignmentTransitionDto` (1 campo, 0 obligatorios). Delega en `PracticeWorkforceService.suspendAssignment`. Lee directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/practice/controllers/role-assignments.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/practice/controllers/role-assignments.controller.ts:102` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | RoleAssignmentsController.suspend → PracticeWorkforceService.suspendAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PracticeAdministrationService.assertCanAdministerPractice → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.practices` | LEE | LEE | DIRECTA | RoleAssignmentsController.suspend → PracticeWorkforceService.suspendAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleInScope → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | RoleAssignmentsController.suspend → PracticeWorkforceService.suspendAssignment → PracticeWorkforceService.transitionAssignment → PracticeWorkforceService.loadRoleForAdministrator → PractitionerRoleAssignmentsRepository.findById | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `PracticeRoleAssignmentTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/self-request-role-assignment.dto.ts:76` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:170` |
| `practiceId` | `string` | Sí | — | — | Identificador asociado a practice. | `src/modules/practice/dto/responses.dto.ts:174` |
| `practitionerProfileId` | `string` | Sí | — | — | Identificador asociado a practitioner profile. | `src/modules/practice/dto/responses.dto.ts:178` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:182` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:186` |

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

## 63. PATCH /site-licenses/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una habilitación del establecimiento
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteLicensesController.update` — `src/modules/practice/controllers/infrastructure-catalog.controller.ts:60`

### Qué es y para qué sirve (negocio)

Editar una habilitación del establecimiento. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /site-licenses/{id}` la atiende `SiteLicensesController.update` (src/modules/practice/controllers/infrastructure-catalog.controller.ts:60). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateSiteLicenseDto` (7 campos, 0 obligatorios). Delega en `SiteEstablishmentService.updateLicense`. Actualiza organization_extensions.facility_licenses. Lee directory.tenant_memberships, organization_extensions.facility_licenses, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/infrastructure-catalog.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/practice/controllers/infrastructure-catalog.controller.ts:60` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteLicensesController.update → SiteEstablishmentService.updateLicense → StructureAccessService.assertCanAdministerOrganization → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `organization_extensions.facility_licenses` | ESCRIBE | ACTUALIZA | POR_TIPO | SiteLicensesController.update → SiteEstablishmentService.updateLicense | `src/modules/practice/services/site-establishment.service.ts:465` |
| `organization_extensions.facility_licenses` | LEE | LEE | DIRECTA | SiteLicensesController.update → SiteEstablishmentService.updateLicense → FacilityLicensesRepository.findByIdInTenant | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:78` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteLicensesController.update → SiteEstablishmentService.updateLicense → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion; si viene y no coincide: 412 |

### Cuerpo — DTO `UpdateSiteLicenseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorityName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/practice/dto/infrastructure.dto.ts:370` |
| `resolutionNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/practice/dto/infrastructure.dto.ts:377` |
| `issuedOn` | `string` | No | formato date; patrón runtime DATE; admite null | `@IsOptional()` `@Matches(DATE)` | — | `src/modules/practice/dto/infrastructure.dto.ts:382` |
| `expiresOn` | `string` | No | formato date; patrón runtime DATE; admite null | `@IsOptional()` `@Matches(DATE)` | — | `src/modules/practice/dto/infrastructure.dto.ts:387` |
| `documentFileId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/infrastructure.dto.ts:392` |
| `status` | `string` | No | — | `@IsOptional()` `@IsString()` | Estado: LIC_IN_PROCESS \| LIC_VALID \| LIC_REVOKED (sólo plataforma). LIC_EXPIRED se calcula; LIC_SUSPENDED no tiene columna en facility_licenses | `src/modules/practice/dto/infrastructure.dto.ts:400` |
| `notes` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Sin columna en facility_licenses: sólo se acepta vacío (422 LICENSE_NOTES_UNSUPPORTED si trae texto) | `src/modules/practice/dto/infrastructure.dto.ts:410` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "documentFileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "notes": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<SiteLicenseDto>` · DTO `SiteLicenseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:372` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:373` |
| `authorityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:374` |
| `resolutionNumber` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:375` |
| `issuedOn` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:376` |
| `expiresOn` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:378` |
| `status` | `ConceptDto` | Sí | — | — | LIC_*; vencida se calcula al leer | `src/modules/practice/dto/infrastructure-responses.dto.ts:384` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:385` |
| `healthcareServiceId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:387` |
| `documentFileId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:389` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:391` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma; ForbiddenException: Sólo la plataforma cambia el estado de una habilitación |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Habilitación no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteLicensesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 64. GET /sites/{siteId}/bed-board

- **Origen:** CONTRATO
- **Nombre:** Tablero de camas de una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.bedBoard` — `src/modules/practice/controllers/care-space-ops.controller.ts:101`

### Qué es y para qué sirve (negocio)

Tablero de camas de una sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/bed-board` la atiende `CareSpaceOpsController.bedBoard` (src/modules/practice/controllers/care-space-ops.controller.ts:101). Exige sesión; el controlador no declara roles. Delega en `BedBoardReadService.bedBoard`. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_status_events, practice.care_spaces, practice.cleaning_orders y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/care-space-ops.controller.ts:101` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `clinical.encounters` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_status_events` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsRepository.lastEventBySpace | `src/modules/practice/repositories/care-space-ops.repository.ts:373` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → BedBoardReadService.index | `src/modules/practice/services/bed-board-read.service.ts:480` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → BedBoardReadService.index | `src/modules/practice/services/bed-board-read.service.ts:481` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → BedBoardReadService.index | `src/modules/practice/services/bed-board-read.service.ts:485` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.persons` | LEE | LEE | POR_SQL | CareSpaceOpsController.bedBoard → BedBoardReadService.bedBoard → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `unitId` | query | No | `string` | — |
| `parentSpaceId` | query | No | `string` | — |
| `functionCodes` | query | No | `string` | Funciones separadas por coma |
| `v2Codes` | query | No | `string` | Códigos v2-0116 separados por coma |
| `cursor` | query | No | `string` | Código del último espacio de la página anterior |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BedBoardDto>` · DTO `BedBoardDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:431` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:432` |
| `lastEventAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:434` |
| `units` | `array<BedBoardUnitDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:435` |
| `units[].unitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:422` |
| `units[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:424` |
| `units[].counts` | `BedBoardCountsDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:425` |
| `units[].counts.total` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:408` |
| `units[].counts.assignable` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:409` |
| `units[].counts.occupied` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:410` |
| `units[].counts.reserved` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:411` |
| `units[].counts.blocked` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:412` |
| `units[].counts.maintenance` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:413` |
| `units[].counts.dirty` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:414` |
| `units[].counts.cleaning` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:415` |
| `units[].counts.isolation` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:416` |
| `units[].counts.contaminated` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:417` |
| `units[].cells` | `array<BedBoardCellDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:426` |
| `units[].cells[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:371` |
| `units[].cells[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:372` |
| `units[].cells[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:373` |
| `units[].cells[].path` | `array<SpacePathItemDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:374` |
| `units[].cells[].path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:309` |
| `units[].cells[].path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:310` |
| `units[].cells[].path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:311` |
| `units[].cells[].path[].form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:312` |
| `units[].cells[].form` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:375` |
| `units[].cells[].function` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:376` |
| `units[].cells[].lifecycle` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:377` |
| `units[].cells[].availability` | `AvailabilityAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:379` |
| `units[].cells[].availability.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:317` |
| `units[].cells[].availability.reasonCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:318` |
| `units[].cells[].availability.reasonText` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:319` |
| `units[].cells[].availability.expectedUntil` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:321` |
| `units[].cells[].availability.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:323` |
| `units[].cells[].hygiene` | `HygieneAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:380` |
| `units[].cells[].hygiene.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:328` |
| `units[].cells[].hygiene.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:330` |
| `units[].cells[].hygiene.terminalRequired` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:331` |
| `units[].cells[].isolation` | `IsolationAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:381` |
| `units[].cells[].isolation.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:336` |
| `units[].cells[].isolation.organism` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:337` |
| `units[].cells[].isolation.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:340` |
| `units[].cells[].occupancy` | `OccupancyAxisDto` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:382` |
| `units[].cells[].occupancy.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:352` |
| `units[].cells[].occupancy.since` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:354` |
| `units[].cells[].occupancy.encounterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:356` |
| `units[].cells[].occupancy.patient` | `BedPatientDto` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:358` |
| `units[].cells[].occupancy.patient.initials` | `string` | No | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:345` |
| `units[].cells[].occupancy.patient.sexCode` | `string` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:346` |
| `units[].cells[].occupancy.patient.ageYears` | `number` | No | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:347` |
| `units[].cells[].occupancy.encounterLocationId` | `string` | No | formato uuid; admite null | — | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `src/modules/practice/dto/care-space-ops.dto.ts:366` |
| `units[].cells[].v2Code` | `string` | Sí | valores: C, H, I, K, O, U, R | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:383` |
| `units[].cells[].assignable` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:384` |
| `units[].cells[].openCleaningOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:386` |
| `units[].cells[].lastEventAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:388` |
| `units[].cells[].opsVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:389` |
| `units[].cells[].unitId` | `string` | Sí | formato uuid; admite null | — | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `src/modules/practice/dto/care-space-ops.dto.ts:397` |
| `units[].cells[].actions` | `array<string>` | Sí | — | — | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:403` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:436` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:125` |
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:314` |
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:253` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 65. GET /sites/{siteId}/capacity

- **Origen:** CONTRATO
- **Nombre:** Capacidad declarada vs. derivada del establecimiento
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.capacity` — `src/modules/practice/controllers/site-infrastructure.controller.ts:237`

### Qué es y para qué sirve (negocio)

Capacidad declarada vs. derivada del establecimiento. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/capacity` la atiende `SiteInfrastructureController.capacity` (src/modules/practice/controllers/site-infrastructure.controller.ts:237). Exige sesión; el controlador no declara roles. Delega en `SiteEstablishmentService.capacity`. Lee directory.tenant_memberships, organization_extensions.hospitals, practice.care_spaces, practice.practice_sites, practice.site_declared_capacities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:237` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:237` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.capacity → SiteEstablishmentService.capacity → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `organization_extensions.hospitals` | LEE | LEE | DIRECTA | SiteInfrastructureController.capacity → SiteEstablishmentService.capacity → SiteEstablishmentService.capacityOf | `src/modules/practice/services/site-establishment.service.ts:625` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.capacity → SiteEstablishmentService.capacity → SiteEstablishmentService.capacityOf → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.capacity → SiteEstablishmentService.capacity → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.site_declared_capacities` | LEE | LEE | DIRECTA | SiteInfrastructureController.capacity → SiteEstablishmentService.capacity → SiteEstablishmentService.capacityOf → SiteDeclaredCapacitiesRepository.findBySite | `src/modules/practice/repositories/site-declared-capacities.repository.ts:32` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SiteCapacityDto>` · DTO `SiteCapacityDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `declared` | `array<DeclaredCapacityLineDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:426` |
| `declared[].kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:396` |
| `declared[].quantity` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:397` |
| `declared[].asOf` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:398` |
| `declared[].resolutionNumber` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:400` |
| `declared[].source` | `string` | Sí | valores: site, hospital | — | site = site_declared_capacities; hospital = organization_extensions.hospitals | `src/modules/practice/dto/infrastructure-responses.dto.ts:407` |
| `derived` | `array<DerivedCapacityLineDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:428` |
| `derived[].kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:412` |
| `derived[].quantity` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:413` |
| `gaps` | `array<CapacityGapDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:429` |
| `gaps[].kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:418` |
| `gaps[].declared` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:419` |
| `gaps[].derived` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:420` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:250` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 66. GET /sites/{siteId}/care-spaces

- **Origen:** CONTRATO
- **Nombre:** Listar los espacios de atención de la sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SitesController.listCareSpaces` — `src/modules/practice/controllers/sites.controller.ts:91`

### Qué es y para qué sirve (negocio)

Listar los espacios de atención de la sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/care-spaces` la atiende `SitesController.listCareSpaces` (src/modules/practice/controllers/sites.controller.ts:91). Exige sesión con alguno de los roles SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN. Delega en `PracticeSitesService.listCareSpaces`. Lee practice.care_spaces, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN | `src/modules/practice/controllers/sites.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/sites.controller.ts:91` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.care_spaces` | LEE | LEE | DIRECTA | SitesController.listCareSpaces → PracticeSitesService.listCareSpaces → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SitesController.listCareSpaces → PracticeSitesService.listCareSpaces → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
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
| `id` | `string` | Sí | formato uuid | — | Identificador del espacio. | `src/modules/practice/dto/responses.dto.ts:416` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | Sede a la que pertenece. | `src/modules/practice/dto/responses.dto.ts:418` |
| `code` | `string` | Sí | — | — | Código único dentro de la sede. | `src/modules/practice/dto/responses.dto.ts:420` |
| `name` | `string` | Sí | — | — | Nombre legible. | `src/modules/practice/dto/responses.dto.ts:422` |
| `spaceTypeConceptId` | `string` | No | formato uuid | — | Tipo de espacio (quirófano, consulta, box…). | `src/modules/practice/dto/responses.dto.ts:424` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado. | `src/modules/practice/dto/responses.dto.ts:426` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-structure-tenancy.int-spec.ts:259` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SitesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 67. POST /sites/{siteId}/care-spaces

- **Origen:** CONTRATO
- **Nombre:** Crear un espacio de atención bajo una unidad/sitio
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SitesController.createCareSpace` — `src/modules/practice/controllers/sites.controller.ts:114`

### Qué es y para qué sirve (negocio)

Crear un espacio de atención bajo una unidad/sitio. Caso de uso UC-14-05: Crear espacio de atención (F1: PLANNED salvo activate; cuerpo de F0 sin forma/función: ACTIVO y AVAILABLE). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:149`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/care-spaces` la atiende `SitesController.createCareSpace` (src/modules/practice/controllers/sites.controller.ts:114). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateCareSpaceDto` (23 campos, 2 obligatorios). Delega en `CareSpacesAdminService.create`. Crea filas en practice.care_spaces. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.facility_typology_rules, practice.practice_sites, practice.space_form_parent_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/sites.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/sites.controller.ts:114` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesAdminService.writableSite → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesAdminService.writableSite → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | ESCRIBE | CREA | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesAdminService.insert → CareSpacesRepository.create | `src/modules/practice/repositories/care-spaces.repository.ts:133` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesAdminService.sameSiteUnit → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesAdminService.loadRules → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesAdminService.writableSite → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_form_parent_rules` | LEE | LEE | DIRECTA | SitesController.createCareSpace → CareSpacesAdminService.create → CareSpacesAdminService.loadRules → StructureRulesRepository.parentRules | `src/modules/practice/repositories/structure-rules.repository.ts:28` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCareSpaceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `description` | `string` | No | longitud máxima 1000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción libre | `src/modules/practice/dto/care-space-attributes.dto.ts:31` |
| `capacity` | `number` | No | mínimo 0; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` | Capacidad (nº de plazas) | `src/modules/practice/dto/care-space-attributes.dto.ts:42` |
| `floorNumber` | `number` | No | mínimo -20; máximo 300; admite null | `@IsOptional()` `@IsInt()` `@Min(-20)` `@Max(300)` | Piso (negativo = subsuelo) | `src/modules/practice/dto/care-space-attributes.dto.ts:53` |
| `areaM2` | `number` | No | mínimo 0; máximo 99999999; admite null | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(99999999)` | Superficie útil en m² | `src/modules/practice/dto/care-space-attributes.dto.ts:65` |
| `asepsisCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Asepsia (ASEPSIS_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:74` |
| `pressureCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Presión relativa (PRESSURE_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:83` |
| `airChangesPerHour` | `number` | No | mínimo 0; máximo 9999; admite null | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(9999)` | Renovaciones de aire por hora (ACH) | `src/modules/practice/dto/care-space-attributes.dto.ts:94` |
| `hvacValidatedOn` | `string` | No | formato date; patrón runtime /^\d{4}-\d{2}-\d{2}$/; admite null | `@IsOptional()` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | Fecha de validación HVAC (YYYY-MM-DD) | `src/modules/practice/dto/care-space-attributes.dto.ts:104` |
| `sexRestrictionCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Restricción de sexo (SEX_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:113` |
| `ageGroupCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Grupo etario (AGE_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:122` |
| `bedCategoryCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Categoría de cama (BED_CAT_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:131` |
| `censable` | `boolean` | No | admite null | `@IsOptional()` `@IsBoolean()` | Cama censable (cuenta para el censo) | `src/modules/practice/dto/care-space-attributes.dto.ts:140` |
| `prepMinutes` | `number` | No | mínimo 0; máximo 1440; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(1440)` | Minutos de preparación | `src/modules/practice/dto/care-space-attributes.dto.ts:152` |
| `cleanupMinutes` | `number` | No | mínimo 0; máximo 1440; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(1440)` | Minutos de limpieza | `src/modules/practice/dto/care-space-attributes.dto.ts:164` |
| `gln` | `string` | No | patrón runtime /^\d{13}$/; admite null | `@IsOptional()` `@Matches(/^\d{13}$/)` | GS1 GLN (13 dígitos) | `src/modules/practice/dto/care-space-attributes.dto.ts:173` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica (misma sede) | `src/modules/practice/dto/create-care-space.dto.ts:23` |
| `parentSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espacio padre (misma sede) | `src/modules/practice/dto/create-care-space.dto.ts:34` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único dentro de la sede | `src/modules/practice/dto/create-care-space.dto.ts:46` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del espacio | `src/modules/practice/dto/create-care-space.dto.ts:55` |
| `spaceTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obsoleto (F0): concepto de función. Usar functionCode; si vienen los dos, manda functionCode | `src/modules/practice/dto/create-care-space.dto.ts:68` |
| `formCode` | `string` | No | — | `@IsOptional()` `@IsString()` | Forma FHIR (LOC_FORM_*). Ausente: LOC_FORM_ROOM (compatibilidad con F0) | `src/modules/practice/dto/create-care-space.dto.ts:76` |
| `functionCode` | `string` | No | — | `@IsOptional()` `@IsString()` | Función (SPACE_FN_* o SPACE_TYPE_ROOM). Ausente: SPACE_TYPE_ROOM (genérica) | `src/modules/practice/dto/create-care-space.dto.ts:84` |
| `activate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Nacer ACTIVO en vez de PLANNED (el padre tiene que estar activo) | `src/modules/practice/dto/create-care-space.dto.ts:92` |

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
  "description": "Texto descriptivo de ejemplo",
  "capacity": 1,
  "floorNumber": 1,
  "areaM2": 1,
  "asepsisCode": "CODIGO_EJEMPLO",
  "pressureCode": "CODIGO_EJEMPLO",
  "airChangesPerHour": 1,
  "hvacValidatedOn": "2026-07-31",
  "sexRestrictionCode": "CODIGO_EJEMPLO",
  "ageGroupCode": "CODIGO_EJEMPLO",
  "bedCategoryCode": "CODIGO_EJEMPLO",
  "censable": true,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "gln": "valor-ejemplo",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "parentSpaceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "spaceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "activate": true
}
```

</details>

### Respuesta — `Promise<CareSpaceDetailDto>` · DTO `CareSpaceDetailDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `form.code` | `string` | Sí | — | — | — | sin fuente |
| `form.display` | `string` | Sí | — | — | — | sin fuente |
| `function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `function.code` | `string` | Sí | — | — | — | sin fuente |
| `function.display` | `string` | Sí | — | — | — | sin fuente |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:224` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:225` |
| `floorNumber` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:226` |
| `areaM2` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:227` |
| `asepsis` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:229` |
| `asepsis.code` | `string` | Sí | — | — | — | sin fuente |
| `asepsis.display` | `string` | Sí | — | — | — | sin fuente |
| `pressure` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:231` |
| `pressure.code` | `string` | Sí | — | — | — | sin fuente |
| `pressure.display` | `string` | Sí | — | — | — | sin fuente |
| `airChangesPerHour` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:232` |
| `hvacValidatedOn` | `object` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:234` |
| `sexRestriction` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:237` |
| `sexRestriction.code` | `string` | Sí | — | — | — | sin fuente |
| `sexRestriction.display` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:239` |
| `ageGroup.code` | `string` | Sí | — | — | — | sin fuente |
| `ageGroup.display` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:241` |
| `bedCategory.code` | `string` | Sí | — | — | — | sin fuente |
| `bedCategory.display` | `string` | Sí | — | — | — | sin fuente |
| `censable` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:242` |
| `gln` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:243` |
| `prepMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:244` |
| `cleanupMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:245` |
| `validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:247` |
| `validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:249` |
| `path` | `array<SpacePathStepDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:250` |
| `path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:209` |
| `path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:210` |
| `path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:211` |
| `path[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:212` |
| `path[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `path[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children` | `array<CareSpaceNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:251` |
| `children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `children[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `children[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `children[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `children[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `children[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `children[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `children[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:253` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |
| `derived` | `SpaceDerivedDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:254` |
| `derived.beds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:217` |
| `derived.censableBeds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:218` |
| `derived.activeChildren` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:219` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:444` |
| INTEGRACION | `test/integration/infrastructure-f5b.int-spec.ts:39` |
| INTEGRACION | `test/integration/infrastructure-f5c.int-spec.ts:45` |
| INTEGRACION | `test/integration/infrastructure-f5d.int-spec.ts:40` |
| INTEGRACION | `test/integration/infrastructure-fixture.ts:217` |
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:50` |
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:137` |
| INTEGRACION | `test/integration/practice-structure-tenancy.int-spec.ts:193` |

### Flujos

- Módulo Practice (14) — etapa `UC-14-05`

---

## 68. POST /sites/{siteId}/care-spaces/bulk

- **Origen:** CONTRATO
- **Nombre:** Alta masiva de espacios por patrón
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.bulk` — `src/modules/practice/controllers/site-infrastructure.controller.ts:80`

### Qué es y para qué sirve (negocio)

Alta masiva de espacios por patrón. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/care-spaces/bulk` la atiende `SiteInfrastructureController.bulk` (src/modules/practice/controllers/site-infrastructure.controller.ts:80). Exige sesión; el controlador no declara roles. Valida el cuerpo como `BulkCreateCareSpacesDto` (22 campos, 4 obligatorios). Delega en `CareSpacesAdminService.bulkCreate`. Crea filas en practice.care_spaces. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.facility_typology_rules, practice.practice_sites, practice.space_form_parent_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:80` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesAdminService.writableSite → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesAdminService.writableSite → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | ESCRIBE | CREA | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesAdminService.insert → CareSpacesRepository.create | `src/modules/practice/repositories/care-spaces.repository.ts:133` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesAdminService.sameSiteUnit → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesAdminService.loadRules → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesAdminService.writableSite → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_form_parent_rules` | LEE | LEE | DIRECTA | SiteInfrastructureController.bulk → CareSpacesAdminService.bulkCreate → CareSpacesAdminService.loadRules → StructureRulesRepository.parentRules | `src/modules/practice/repositories/structure-rules.repository.ts:28` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `BulkCreateCareSpacesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `description` | `string` | No | longitud máxima 1000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción libre | `src/modules/practice/dto/care-space-attributes.dto.ts:31` |
| `capacity` | `number` | No | mínimo 0; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` | Capacidad (nº de plazas) | `src/modules/practice/dto/care-space-attributes.dto.ts:42` |
| `floorNumber` | `number` | No | mínimo -20; máximo 300; admite null | `@IsOptional()` `@IsInt()` `@Min(-20)` `@Max(300)` | Piso (negativo = subsuelo) | `src/modules/practice/dto/care-space-attributes.dto.ts:53` |
| `areaM2` | `number` | No | mínimo 0; máximo 99999999; admite null | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(99999999)` | Superficie útil en m² | `src/modules/practice/dto/care-space-attributes.dto.ts:65` |
| `asepsisCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Asepsia (ASEPSIS_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:74` |
| `pressureCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Presión relativa (PRESSURE_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:83` |
| `airChangesPerHour` | `number` | No | mínimo 0; máximo 9999; admite null | `@IsOptional()` `@IsNumber({ maxDecimalPlaces: 2 })` `@Min(0)` `@Max(9999)` | Renovaciones de aire por hora (ACH) | `src/modules/practice/dto/care-space-attributes.dto.ts:94` |
| `hvacValidatedOn` | `string` | No | formato date; patrón runtime /^\d{4}-\d{2}-\d{2}$/; admite null | `@IsOptional()` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | Fecha de validación HVAC (YYYY-MM-DD) | `src/modules/practice/dto/care-space-attributes.dto.ts:104` |
| `sexRestrictionCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Restricción de sexo (SEX_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:113` |
| `ageGroupCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Grupo etario (AGE_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:122` |
| `bedCategoryCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Categoría de cama (BED_CAT_*) | `src/modules/practice/dto/care-space-attributes.dto.ts:131` |
| `censable` | `boolean` | No | admite null | `@IsOptional()` `@IsBoolean()` | Cama censable (cuenta para el censo) | `src/modules/practice/dto/care-space-attributes.dto.ts:140` |
| `prepMinutes` | `number` | No | mínimo 0; máximo 1440; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(1440)` | Minutos de preparación | `src/modules/practice/dto/care-space-attributes.dto.ts:152` |
| `cleanupMinutes` | `number` | No | mínimo 0; máximo 1440; admite null | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(1440)` | Minutos de limpieza | `src/modules/practice/dto/care-space-attributes.dto.ts:164` |
| `gln` | `string` | No | patrón runtime /^\d{13}$/; admite null | `@IsOptional()` `@Matches(/^\d{13}$/)` | GS1 GLN (13 dígitos) | `src/modules/practice/dto/care-space-attributes.dto.ts:173` |
| `parentSpaceId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | Padre común (misma sede). Ausente o null: raíz | `src/modules/practice/dto/infrastructure.dto.ts:36` |
| `formCode` | `string` | Sí | — | `@IsString()` | Forma (LOC_FORM_*) | `src/modules/practice/dto/infrastructure.dto.ts:40` |
| `functionCode` | `string` | Sí | — | `@IsString()` | Función (SPACE_FN_* o SPACE_TYPE_ROOM) | `src/modules/practice/dto/infrastructure.dto.ts:44` |
| `codePattern` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Patrón de código con un rango: "301-{A..H}", "CAMA-{1..12}" | `src/modules/practice/dto/infrastructure.dto.ts:54` |
| `namePattern` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Patrón del nombre: el mismo rango, "{}" o nada (se agrega al final) | `src/modules/practice/dto/infrastructure.dto.ts:65` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica (misma sede) | `src/modules/practice/dto/infrastructure.dto.ts:73` |
| `activate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Nacer ACTIVOS (padre activo) | `src/modules/practice/dto/infrastructure.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "codePattern": "CAMA-{1..12}",
  "namePattern": "Cama {1..12}"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "description": "Texto descriptivo de ejemplo",
  "capacity": 1,
  "floorNumber": 1,
  "areaM2": 1,
  "asepsisCode": "CODIGO_EJEMPLO",
  "pressureCode": "CODIGO_EJEMPLO",
  "airChangesPerHour": 1,
  "hvacValidatedOn": "2026-07-31",
  "sexRestrictionCode": "CODIGO_EJEMPLO",
  "ageGroupCode": "CODIGO_EJEMPLO",
  "bedCategoryCode": "CODIGO_EJEMPLO",
  "censable": true,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "gln": "valor-ejemplo",
  "parentSpaceId": "00000000-0000-4000-8000-000000000001",
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "codePattern": "CAMA-{1..12}",
  "namePattern": "Cama {1..12}",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "activate": true
}
```

</details>

### Respuesta — `Promise<BulkCreatedDto>` · DTO `BulkCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `created` | `array<CareSpaceDetailDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:259` |
| `created[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `created[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `created[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `created[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `created[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `created[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `created[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `created[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `created[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `created[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `created[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `created[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `created[].practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:224` |
| `created[].description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:225` |
| `created[].floorNumber` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:226` |
| `created[].areaM2` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:227` |
| `created[].asepsis` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:229` |
| `created[].asepsis.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].asepsis.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].pressure` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:231` |
| `created[].pressure.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].pressure.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].airChangesPerHour` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:232` |
| `created[].hvacValidatedOn` | `object` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:234` |
| `created[].sexRestriction` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:237` |
| `created[].sexRestriction.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].sexRestriction.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].ageGroup` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:239` |
| `created[].ageGroup.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].ageGroup.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].bedCategory` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:241` |
| `created[].bedCategory.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].bedCategory.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].censable` | `boolean` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:242` |
| `created[].gln` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:243` |
| `created[].prepMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:244` |
| `created[].cleanupMinutes` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:245` |
| `created[].validFrom` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:247` |
| `created[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:249` |
| `created[].path` | `array<SpacePathStepDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:250` |
| `created[].path[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:209` |
| `created[].path[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:210` |
| `created[].path[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:211` |
| `created[].path[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:212` |
| `created[].path[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].path[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].children` | `array<CareSpaceNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:251` |
| `created[].children[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `created[].children[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `created[].children[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `created[].children[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `created[].children[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `created[].children[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `created[].children[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `created[].children[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `created[].children[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].children[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `created[].children[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `created[].children[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `created[].children[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `created[].assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:253` |
| `created[].assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `created[].assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `created[].assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `created[].assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `created[].assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `created[].assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `created[].assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `created[].assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |
| `created[].derived` | `SpaceDerivedDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:254` |
| `created[].derived.beds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:217` |
| `created[].derived.censableBeds` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:218` |
| `created[].derived.activeChildren` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:219` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-fixture.ts:243` |
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:211` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 69. POST /sites/{siteId}/care-spaces/import

- **Origen:** CONTRATO
- **Nombre:** Importar espacios (dryRun=true valida sin escribir)
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.importRows` — `src/modules/practice/controllers/site-infrastructure.controller.ts:98`

### Qué es y para qué sirve (negocio)

Importar espacios (dryRun=true valida sin escribir). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/care-spaces/import` la atiende `SiteInfrastructureController.importRows` (src/modules/practice/controllers/site-infrastructure.controller.ts:98). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ImportCareSpacesDto` (1 campo, 1 obligatorio). Delega en `CareSpacesAdminService.importRows`. Crea filas en practice.care_spaces. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.facility_typology_rules, practice.practice_sites, practice.space_form_parent_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:98` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → CareSpacesAdminService.writableSite → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → CareSpacesAdminService.writableSite → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | ESCRIBE | CREA | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → CareSpacesAdminService.insert → CareSpacesRepository.create | `src/modules/practice/repositories/care-spaces.repository.ts:133` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → ClinicalUnitsRepository.findBySite | `src/modules/practice/repositories/clinical-units.repository.ts:79` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → CareSpacesAdminService.loadRules → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → CareSpacesAdminService.writableSite → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_form_parent_rules` | LEE | LEE | DIRECTA | SiteInfrastructureController.importRows → CareSpacesAdminService.importRows → CareSpacesAdminService.loadRules → StructureRulesRepository.parentRules | `src/modules/practice/repositories/structure-rules.repository.ts:28` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `dryRun` | query | No | `string` | Por defecto true |

### Cuerpo — DTO `ImportCareSpacesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rows` | `array<object>` | Sí | mínimo 1 elemento(s); máximo 500 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(500)` `@Type(() => Object)` | Filas ya parseadas por el cliente. Cada una: code, name, formCode, functionCode, parentCode? (código de un espacio existente o de una fila anterior), clinicalUnitCode?, activate?, y los atributos de CareSpaceAttributes. Se validan fila por fila. | `src/modules/practice/dto/infrastructure.dto.ts:99` |

**Payload mínimo** (sólo los obligatorios):

```json
{
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
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ImportResultDto>` · DTO `ImportResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:278` |
| `dryRun` | `boolean` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:279` |
| `rows` | `array<ImportRowResultDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:280` |
| `rows[].line` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:271` |
| `rows[].status` | `string` | Sí | valores: ok, error | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:272` |
| `rows[].errors` | `array<ImportFieldErrorDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:273` |
| `rows[].errors[].field` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:264` |
| `rows[].errors[].reason` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:265` |
| `rows[].errors[].message` | `string` | Sí | — | — | Texto para la persona | `src/modules/practice/dto/infrastructure-responses.dto.ts:266` |
| `created` | `number` | No | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:281` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:457` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 70. GET /sites/{siteId}/cleaning-orders

- **Origen:** CONTRATO
- **Nombre:** Cola de limpieza de una sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.cleaningOrders` — `src/modules/practice/controllers/care-space-ops.controller.ts:280`

### Qué es y para qué sirve (negocio)

Cola de limpieza de una sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/cleaning-orders` la atiende `CareSpaceOpsController.cleaningOrders` (src/modules/practice/controllers/care-space-ops.controller.ts:280). Exige sesión; el controlador no declara roles. Delega en `BedBoardReadService.cleaningOrders`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.cleaning_orders, practice.clinical_units, practice.practice_settings, practice.practice_sites y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:280` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/care-space-ops.controller.ts:280` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → BedBoardReadService.index | `src/modules/practice/services/bed-board-read.service.ts:480` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders | `src/modules/practice/services/bed-board-read.service.ts:389` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → BedBoardReadService.index | `src/modules/practice/services/bed-board-read.service.ts:481` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | CareSpaceOpsController.cleaningOrders → BedBoardReadService.cleaningOrders → BedBoardReadService.index | `src/modules/practice/services/bed-board-read.service.ts:485` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `status` | query | No | `string` | — |
| `unitId` | query | No | `string` | — |
| `assignedTo` | query | No | `string` | — |
| `priority` | query | No | `string` | — |
| `cursor` | query | No | `string` | requested_at ISO de la última fila de la página anterior |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CleaningOrderListDto>` · DTO `CleaningOrderListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CleaningOrderDto>` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:517` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:465` |
| `items[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:466` |
| `items[].careSpaceCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:467` |
| `items[].careSpaceName` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:468` |
| `items[].clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:470` |
| `items[].typeCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:471` |
| `items[].triggerCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:472` |
| `items[].priorityCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:473` |
| `items[].statusCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:474` |
| `items[].requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:475` |
| `items[].dueAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:476` |
| `items[].assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:479` |
| `items[].startedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:481` |
| `items[].finishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:483` |
| `items[].finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:485` |
| `items[].inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:487` |
| `items[].inspectionResult` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:488` |
| `items[].rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:490` |
| `items[].previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:493` |
| `items[].ageMinutes` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:494` |
| `items[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:495` |
| `items[].allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:502` |
| `items[].inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `src/modules/practice/dto/care-space-ops.dto.ts:507` |
| `items[].requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:512` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:518` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:519` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:137` |
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:203` |
| INTEGRACION | `test/integration/infrastructure-ops-f2.int-spec.ts:109` |
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:293` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 71. POST /sites/{siteId}/cleaning-orders

- **Origen:** CONTRATO
- **Nombre:** Crear una orden de limpieza
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareSpaceOpsController.createCleaningOrder` — `src/modules/practice/controllers/care-space-ops.controller.ts:292`

### Qué es y para qué sirve (negocio)

Crear una orden de limpieza. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/cleaning-orders` la atiende `CareSpaceOpsController.createCleaningOrder` (src/modules/practice/controllers/care-space-ops.controller.ts:292). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateCleaningOrderDto` (4 campos, 2 obligatorios). Delega en `CleaningOrdersService.create`. Crea filas en practice.care_space_status_events, practice.cleaning_orders. Actualiza practice.care_spaces, practice.cleaning_orders. Lee clinical.encounter_locations, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.cleaning_orders, practice.clinical_units, practice.practice_settings y 2 más. Hay 4 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/care-space-ops.controller.ts:292` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/care-space-ops.controller.ts:292` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.cleaning_orders` | ESCRIBE | CREA | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → CareSpaceOpsCore.openCleaningOrder | `src/modules/practice/services/ops/care-space-ops-core.ts:502` |
| `practice.cleaning_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone | `src/modules/practice/services/ops/care-space-ops-core.ts:573` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | CareSpaceOpsController.createCleaningOrder → CleaningOrdersService.create → CreateCleaningOrderUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCleaningOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careSpaceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/practice/dto/care-space-ops.dto.ts:146` |
| `typeCode` | `string` | Sí | valores: CLEAN_ROUTINE, CLEAN_DISCHARGE, CLEAN_TERMINAL, CLEAN_OR_TURNOVER, CLEAN_SPOT | `@IsIn(Object.keys(CLEANING_TYPE))` | — | `src/modules/practice/dto/care-space-ops.dto.ts:150` |
| `priorityCode` | `string` | No | valores: CLN_PRIO_ROUTINE, CLN_PRIO_URGENT, CLN_PRIO_STAT | `@IsOptional()` `@IsIn(Object.keys(CLEANING_PRIORITY))` | — | `src/modules/practice/dto/care-space-ops.dto.ts:155` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/practice/dto/care-space-ops.dto.ts:161` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CLEAN_ROUTINE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CLEAN_ROUTINE",
  "priorityCode": "CLN_PRIO_ROUTINE",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CleaningOrderDto>` · DTO `CleaningOrderDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:465` |
| `careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:466` |
| `careSpaceCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:467` |
| `careSpaceName` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:468` |
| `clinicalUnitId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:470` |
| `typeCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:471` |
| `triggerCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:472` |
| `priorityCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:473` |
| `statusCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:474` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:475` |
| `dueAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:476` |
| `assignedUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:479` |
| `startedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:481` |
| `finishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:483` |
| `finishedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:485` |
| `inspectedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:487` |
| `inspectionResult` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:488` |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:490` |
| `previousOrderId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:493` |
| `ageMinutes` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:494` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/care-space-ops.dto.ts:495` |
| `allowedTransitions` | `array<string>` | Sí | — | — | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `src/modules/practice/dto/care-space-ops.dto.ts:502` |
| `inspectionRequired` | `boolean` | Sí | — | — | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `src/modules/practice/dto/care-space-ops.dto.ts:507` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/practice/dto/care-space-ops.dto.ts:512` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:CareSpaceOpsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 72. GET /sites/{siteId}/clinical-units

- **Origen:** CONTRATO
- **Nombre:** Listar las unidades clínicas de la sede
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.listUnits` — `src/modules/practice/controllers/site-infrastructure.controller.ts:131`

### Qué es y para qué sirve (negocio)

Listar las unidades clínicas de la sede. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/clinical-units` la atiende `SiteInfrastructureController.listUnits` (src/modules/practice/controllers/site-infrastructure.controller.ts:131). Exige sesión; el controlador no declara roles. Delega en `ClinicalUnitsAdminService.list`. Lee directory.tenant_memberships, practice.clinical_units, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:131` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.listUnits → ClinicalUnitsAdminService.list → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SiteInfrastructureController.listUnits → ClinicalUnitsAdminService.list → ClinicalUnitsRepository.findBySite | `src/modules/practice/repositories/clinical-units.repository.ts:79` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.listUnits → ClinicalUnitsAdminService.list → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ClinicalUnitNodeDto[]>` · DTO `ClinicalUnitNodeDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 73. POST /sites/{siteId}/clinical-units

- **Origen:** CONTRATO
- **Nombre:** Crear una unidad clínica jerárquica
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SitesController.createClinicalUnit` — `src/modules/practice/controllers/sites.controller.ts:63`

### Qué es y para qué sirve (negocio)

Crear una unidad clínica jerárquica. Caso de uso UC-14-04: Crear unidad clínica jerárquica. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/practice/README.md:148`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/clinical-units` la atiende `SitesController.createClinicalUnit` (src/modules/practice/controllers/sites.controller.ts:63). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateClinicalUnitDto` (6 campos, 2 obligatorios). Delega en `ClinicalStructureService.createClinicalUnit`. Crea filas en practice.clinical_units. Lee directory.branch_memberships, directory.tenant_memberships, practice.clinical_units, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/sites.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/sites.controller.ts:63` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SitesController.createClinicalUnit → ClinicalStructureService.createClinicalUnit → StructureAccessService.assertCanWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SitesController.createClinicalUnit → ClinicalStructureService.createClinicalUnit → StructureAccessService.assertCanWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.clinical_units` | ESCRIBE | CREA | DIRECTA | SitesController.createClinicalUnit → ClinicalStructureService.createClinicalUnit → ClinicalUnitsRepository.create | `src/modules/practice/repositories/clinical-units.repository.ts:104` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SitesController.createClinicalUnit → ClinicalStructureService.createClinicalUnit → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SitesController.createClinicalUnit → ClinicalStructureService.createClinicalUnit → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/practice/dto/responses.dto.ts:77` |
| `practiceSiteId` | `string` | Sí | — | — | Identificador asociado a practice site. | `src/modules/practice/dto/responses.dto.ts:81` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:85` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/practice/dto/responses.dto.ts:89` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/practice/dto/responses.dto.ts:93` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere administrar la organización o la sucursal de esta sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una unidad con ese código en el sitio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sitio no está activo; PreconditionFailedException: La unidad padre no pertenece al sitio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:770` |
| INTEGRACION | `test/integration/infrastructure-fixture.ts:257` |
| INTEGRACION | `test/integration/practice-structure-tenancy.int-spec.ts:188` |

### Flujos

- Módulo Practice (14) — etapa `UC-14-04`

---

## 74. POST /sites/{siteId}/declared-capacities

- **Origen:** CONTRATO
- **Nombre:** Declarar capacidad del establecimiento
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.declareCapacity` — `src/modules/practice/controllers/site-infrastructure.controller.ts:250`

### Qué es y para qué sirve (negocio)

Declarar capacidad del establecimiento. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/declared-capacities` la atiende `SiteInfrastructureController.declareCapacity` (src/modules/practice/controllers/site-infrastructure.controller.ts:250). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateDeclaredCapacityDto` (5 campos, 3 obligatorios). Delega en `SiteEstablishmentService.declareCapacity`. Crea filas en practice.site_declared_capacities. Lee directory.tenant_memberships, organization_extensions.hospitals, practice.care_spaces, practice.practice_sites, practice.site_declared_capacities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:250` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:250` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.declareCapacity → SiteEstablishmentService.declareCapacity → StructureAccessService.assertCanAdministerOrganization → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `organization_extensions.hospitals` | LEE | LEE | DIRECTA | SiteInfrastructureController.declareCapacity → SiteEstablishmentService.declareCapacity → SiteEstablishmentService.capacityOf | `src/modules/practice/services/site-establishment.service.ts:625` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.declareCapacity → SiteEstablishmentService.declareCapacity → SiteEstablishmentService.capacityOf → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.declareCapacity → SiteEstablishmentService.declareCapacity → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.site_declared_capacities` | ESCRIBE | CREA | DIRECTA | SiteInfrastructureController.declareCapacity → SiteEstablishmentService.declareCapacity → SiteDeclaredCapacitiesRepository.create | `src/modules/practice/repositories/site-declared-capacities.repository.ts:50` |
| `practice.site_declared_capacities` | LEE | LEE | DIRECTA | SiteInfrastructureController.declareCapacity → SiteEstablishmentService.declareCapacity → SiteEstablishmentService.capacityOf → SiteDeclaredCapacitiesRepository.findBySite | `src/modules/practice/repositories/site-declared-capacities.repository.ts:32` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDeclaredCapacityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kindCode` | `string` | Sí | — | `@IsString()` | CAP_* | `src/modules/practice/dto/infrastructure.dto.ts:417` |
| `quantity` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/practice/dto/infrastructure.dto.ts:422` |
| `asOf` | `string` | Sí | formato date; patrón runtime DATE | `@Matches(DATE)` | — | `src/modules/practice/dto/infrastructure.dto.ts:426` |
| `resolutionNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/practice/dto/infrastructure.dto.ts:432` |
| `validTo` | `string` | No | formato date; patrón runtime DATE | `@IsOptional()` `@Matches(DATE)` | — | `src/modules/practice/dto/infrastructure.dto.ts:437` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kindCode": "CODIGO_EJEMPLO",
  "quantity": 1,
  "asOf": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kindCode": "CODIGO_EJEMPLO",
  "quantity": 1,
  "asOf": "2026-07-31",
  "resolutionNumber": "valor-ejemplo",
  "validTo": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<SiteCapacityDto>` · DTO `SiteCapacityDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `declared` | `array<DeclaredCapacityLineDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:426` |
| `declared[].kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:396` |
| `declared[].quantity` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:397` |
| `declared[].asOf` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:398` |
| `declared[].resolutionNumber` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:400` |
| `declared[].source` | `string` | Sí | valores: site, hospital | — | site = site_declared_capacities; hospital = organization_extensions.hospitals | `src/modules/practice/dto/infrastructure-responses.dto.ts:407` |
| `derived` | `array<DerivedCapacityLineDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:428` |
| `derived[].kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:412` |
| `derived[].quantity` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:413` |
| `gaps` | `array<CapacityGapDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:429` |
| `gaps[].kindCode` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:418` |
| `gaps[].declared` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:419` |
| `gaps[].derived` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:420` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 75. GET /sites/{siteId}/diagnostic-equipment

- **Origen:** CONTRATO
- **Nombre:** Equipos diagnósticos de una sede (F5a)
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SpaceAssetsController.siteEquipment` — `src/modules/practice/controllers/space-assets.controller.ts:41`

### Qué es y para qué sirve (negocio)

Equipos diagnósticos de una sede (F5a). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/diagnostic-equipment` la atiende `SpaceAssetsController.siteEquipment` (src/modules/practice/controllers/space-assets.controller.ts:41). Exige sesión; el controlador no declara roles. Delega en `SpaceAssetsReadService.siteEquipment`. Lee delegated_access.organization_user_assignments, diagnostic_units.diagnostic_equipment, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/space-assets.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/space-assets.controller.ts:41` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `diagnostic_units.diagnostic_equipment` | LEE | LEE | POR_SQL | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |
| `diagnostic_units.diagnostic_unit_sites` | LEE | LEE | POR_SQL | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | POR_SQL | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SpaceAssetsController.siteEquipment → SpaceAssetsReadService.siteEquipment → SpaceAssetsReadService.equipmentRows | `src/modules/practice/services/space-assets-read.service.ts:297` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

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
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SpaceAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 76. GET /sites/{siteId}/licenses

- **Origen:** CONTRATO
- **Nombre:** Habilitaciones del establecimiento
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.listLicenses` — `src/modules/practice/controllers/site-infrastructure.controller.ts:203`

### Qué es y para qué sirve (negocio)

Habilitaciones del establecimiento. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/licenses` la atiende `SiteInfrastructureController.listLicenses` (src/modules/practice/controllers/site-infrastructure.controller.ts:203). Exige sesión; el controlador no declara roles. Delega en `SiteEstablishmentService.listLicenses`. Lee directory.tenant_memberships, organization_extensions.facility_licenses, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:203` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:203` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.listLicenses → SiteEstablishmentService.listLicenses → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `organization_extensions.facility_licenses` | LEE | LEE | DIRECTA | SiteInfrastructureController.listLicenses → SiteEstablishmentService.listLicenses → FacilityLicensesRepository.findBySite | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:116` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.listLicenses → SiteEstablishmentService.listLicenses → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SiteLicenseDto[]>` · DTO `SiteLicenseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:372` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:373` |
| `authorityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:374` |
| `resolutionNumber` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:375` |
| `issuedOn` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:376` |
| `expiresOn` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:378` |
| `status` | `ConceptDto` | Sí | — | — | LIC_*; vencida se calcula al leer | `src/modules/practice/dto/infrastructure-responses.dto.ts:384` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:385` |
| `healthcareServiceId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:387` |
| `documentFileId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:389` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:391` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 77. POST /sites/{siteId}/licenses

- **Origen:** CONTRATO
- **Nombre:** Registrar una habilitación del establecimiento
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.createLicense` — `src/modules/practice/controllers/site-infrastructure.controller.ts:214`

### Qué es y para qué sirve (negocio)

Registrar una habilitación del establecimiento. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/licenses` la atiende `SiteInfrastructureController.createLicense` (src/modules/practice/controllers/site-infrastructure.controller.ts:214). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateSiteLicenseDto` (8 campos, 2 obligatorios). Delega en `SiteEstablishmentService.createLicense`. Crea filas en organization_extensions.facility_licenses. Lee directory.tenant_memberships, organization_extensions.facility_licenses, practice.clinical_units, practice.healthcare_services, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:214` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:214` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.createLicense → SiteEstablishmentService.createLicense → StructureAccessService.assertCanAdministerOrganization → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `organization_extensions.facility_licenses` | ESCRIBE | CREA | DIRECTA | SiteInfrastructureController.createLicense → SiteEstablishmentService.createLicense → FacilityLicensesRepository.create | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:125` |
| `organization_extensions.facility_licenses` | LEE | LEE | DIRECTA | SiteInfrastructureController.createLicense → SiteEstablishmentService.createLicense → FacilityLicensesRepository.findByNumber | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:88` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SiteInfrastructureController.createLicense → SiteEstablishmentService.createLicense → SiteEstablishmentService.assertScope → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | SiteInfrastructureController.createLicense → SiteEstablishmentService.createLicense → SiteEstablishmentService.assertScope | `src/modules/practice/services/site-establishment.service.ts:718` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.createLicense → SiteEstablishmentService.createLicense → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateSiteLicenseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorityName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Autoridad emisora (p. ej. SEDES La Paz) | `src/modules/practice/dto/infrastructure.dto.ts:310` |
| `resolutionNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de resolución | `src/modules/practice/dto/infrastructure.dto.ts:316` |
| `issuedOn` | `string` | No | formato date; patrón runtime DATE | `@IsOptional()` `@Matches(DATE)` | — | `src/modules/practice/dto/infrastructure.dto.ts:321` |
| `expiresOn` | `string` | No | formato date; patrón runtime DATE | `@IsOptional()` `@Matches(DATE)` | — | `src/modules/practice/dto/infrastructure.dto.ts:326` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Alcance: unidad de la sede | `src/modules/practice/dto/infrastructure.dto.ts:334` |
| `healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Alcance: servicio de la sede | `src/modules/practice/dto/infrastructure.dto.ts:342` |
| `documentFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de la resolución | `src/modules/practice/dto/infrastructure.dto.ts:350` |
| `notes` | `string` | No | admite null | `@IsOptional()` `@IsString()` | Sin columna en facility_licenses: sólo se acepta vacío (422 LICENSE_NOTES_UNSUPPORTED si trae texto) | `src/modules/practice/dto/infrastructure.dto.ts:360` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "documentFileId": "00000000-0000-4000-8000-000000000001",
  "notes": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<SiteLicenseDto>` · DTO `SiteLicenseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:372` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:373` |
| `authorityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:374` |
| `resolutionNumber` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:375` |
| `issuedOn` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:376` |
| `expiresOn` | `string` | Sí | formato date; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:378` |
| `status` | `ConceptDto` | Sí | — | — | LIC_*; vencida se calcula al leer | `src/modules/practice/dto/infrastructure-responses.dto.ts:384` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:385` |
| `healthcareServiceId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:387` |
| `documentFileId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:389` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:391` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Servicio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 78. GET /sites/{siteId}/regulatory

- **Origen:** CONTRATO
- **Nombre:** Datos regulatorios del establecimiento
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.getRegulatory` — `src/modules/practice/controllers/site-infrastructure.controller.ts:142`

### Qué es y para qué sirve (negocio)

Datos regulatorios del establecimiento. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/regulatory` la atiende `SiteInfrastructureController.getRegulatory` (src/modules/practice/controllers/site-infrastructure.controller.ts:142). Exige sesión; el controlador no declara roles. Delega en `SiteEstablishmentService.getRegulatory`. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.facility_typology_rules, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:142` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.getRegulatory → SiteEstablishmentService.getRegulatory → SiteEstablishmentService.regulatoryView → StructureAccessService.canWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.getRegulatory → SiteEstablishmentService.getRegulatory → StructureAccessService.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.getRegulatory → SiteEstablishmentService.getRegulatory → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | SiteInfrastructureController.getRegulatory → SiteEstablishmentService.getRegulatory → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.getRegulatory → SiteEstablishmentService.getRegulatory → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SiteRegulatoryDto>` · DTO `SiteRegulatoryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:178` |
| `practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:179` |
| `branchId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:181` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:182` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:183` |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:184` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `timeZone` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:185` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:186` |
| `regulatory` | `SiteRegulatoryDataDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:188` |
| `regulatory.snisCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:155` |
| `regulatory.snisVerified` | `boolean` | Sí | — | — | Código SNIS verificado por la plataforma | `src/modules/practice/dto/infrastructure-responses.dto.ts:157` |
| `regulatory.subsector` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:159` |
| `regulatory.subsector.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.subsector.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.careLevel` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:161` |
| `regulatory.careLevel.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.careLevel.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.typology` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:163` |
| `regulatory.typology.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.typology.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.managingEntityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:165` |
| `regulatory.healthNetworkName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:167` |
| `regulatory.sedes` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:168` |
| `regulatory.sedes.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.sedes.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.municipalityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:170` |
| `canWrite` | `boolean` | Sí | — | — | El actor puede editar la estructura (sólo refleja; la API decide) | `src/modules/practice/dto/infrastructure-responses.dto.ts:193` |
| `missingRequiredFunctions` | `array<string>` | Sí | — | — | Funciones obligatorias que faltan | `src/modules/practice/dto/infrastructure-responses.dto.ts:367` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 79. PATCH /sites/{siteId}/regulatory

- **Origen:** CONTRATO
- **Nombre:** Editar los datos regulatorios del establecimiento
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.updateRegulatory` — `src/modules/practice/controllers/site-infrastructure.controller.ts:153`

### Qué es y para qué sirve (negocio)

Editar los datos regulatorios del establecimiento. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /sites/{siteId}/regulatory` la atiende `SiteInfrastructureController.updateRegulatory` (src/modules/practice/controllers/site-infrastructure.controller.ts:153). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateSiteRegulatoryDto` (8 campos, 0 obligatorios). Delega en `SiteEstablishmentService.updateRegulatory`. Actualiza practice.practice_sites. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.facility_typology_rules, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:153` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.updateRegulatory → SiteEstablishmentService.updateRegulatory → SiteEstablishmentService.regulatoryView → StructureAccessService.canWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.updateRegulatory → SiteEstablishmentService.updateRegulatory → StructureAccessService.assertCanAdministerOrganization → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.updateRegulatory → SiteEstablishmentService.updateRegulatory → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | SiteInfrastructureController.updateRegulatory → SiteEstablishmentService.updateRegulatory → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | SiteInfrastructureController.updateRegulatory → SiteEstablishmentService.updateRegulatory | `src/modules/practice/services/site-establishment.service.ts:177` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.updateRegulatory → SiteEstablishmentService.updateRegulatory → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion de la sede; si viene y no coincide: 412 |

### Cuerpo — DTO `UpdateSiteRegulatoryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `snisCode` | `string` | No | longitud máxima 30; patrón runtime /^[A-Za-z0-9-]{1,30}$/; admite null | `@IsOptional()` `@IsString()` `@Matches(/^[A-Za-z0-9-]{1,30}$/)` | Código SNIS/SUIS | `src/modules/practice/dto/infrastructure.dto.ts:248` |
| `subsectorCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | SUBSECTOR_* | `src/modules/practice/dto/infrastructure.dto.ts:257` |
| `careLevelCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | CARE_LEVEL_* | `src/modules/practice/dto/infrastructure.dto.ts:266` |
| `typologyCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | TYPOLOGY_* | `src/modules/practice/dto/infrastructure.dto.ts:275` |
| `managingEntityName` | `string` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/practice/dto/infrastructure.dto.ts:281` |
| `healthNetworkName` | `string` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/practice/dto/infrastructure.dto.ts:287` |
| `sedesCode` | `string` | No | admite null | `@IsOptional()` `@IsString()` | SEDES_* | `src/modules/practice/dto/infrastructure.dto.ts:292` |
| `municipalityName` | `string` | No | longitud máxima 200; admite null | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/practice/dto/infrastructure.dto.ts:298` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "snisCode": "CODIGO_EJEMPLO",
  "subsectorCode": "CODIGO_EJEMPLO",
  "careLevelCode": "CODIGO_EJEMPLO",
  "typologyCode": "CODIGO_EJEMPLO",
  "managingEntityName": "Nombre de ejemplo",
  "healthNetworkName": "Nombre de ejemplo",
  "sedesCode": "CODIGO_EJEMPLO",
  "municipalityName": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<SiteRegulatoryDto>` · DTO `SiteRegulatoryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:178` |
| `practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:179` |
| `branchId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:181` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:182` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:183` |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:184` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `timeZone` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:185` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:186` |
| `regulatory` | `SiteRegulatoryDataDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:188` |
| `regulatory.snisCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:155` |
| `regulatory.snisVerified` | `boolean` | Sí | — | — | Código SNIS verificado por la plataforma | `src/modules/practice/dto/infrastructure-responses.dto.ts:157` |
| `regulatory.subsector` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:159` |
| `regulatory.subsector.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.subsector.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.careLevel` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:161` |
| `regulatory.careLevel.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.careLevel.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.typology` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:163` |
| `regulatory.typology.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.typology.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.managingEntityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:165` |
| `regulatory.healthNetworkName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:167` |
| `regulatory.sedes` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:168` |
| `regulatory.sedes.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.sedes.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.municipalityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:170` |
| `canWrite` | `boolean` | Sí | — | — | El actor puede editar la estructura (sólo refleja; la API decide) | `src/modules/practice/dto/infrastructure-responses.dto.ts:193` |
| `missingRequiredFunctions` | `array<string>` | Sí | — | — | Funciones obligatorias que faltan | `src/modules/practice/dto/infrastructure-responses.dto.ts:367` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:488` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 80. POST /sites/{siteId}/regulatory/verify-snis

- **Origen:** CONTRATO
- **Nombre:** Verificar el código SNIS del establecimiento (plataforma)
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.verifySnis` — `src/modules/practice/controllers/site-infrastructure.controller.ts:184`

### Qué es y para qué sirve (negocio)

Verificar el código SNIS del establecimiento (plataforma). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/regulatory/verify-snis` la atiende `SiteInfrastructureController.verifySnis` (src/modules/practice/controllers/site-infrastructure.controller.ts:184). Exige sesión; el controlador no declara roles. Delega en `SiteEstablishmentService.verifySnis`. Actualiza practice.practice_sites. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.facility_typology_rules, practice.practice_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:184` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.verifySnis → SiteEstablishmentService.verifySnis → SiteEstablishmentService.regulatoryView → StructureAccessService.canWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.verifySnis → SiteEstablishmentService.verifySnis → SiteEstablishmentService.regulatoryView → StructureAccessService.canWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.verifySnis → SiteEstablishmentService.verifySnis → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.facility_typology_rules` | LEE | LEE | DIRECTA | SiteInfrastructureController.verifySnis → SiteEstablishmentService.verifySnis → StructureRulesRepository.typologyRules | `src/modules/practice/repositories/structure-rules.repository.ts:44` |
| `practice.practice_sites` | ESCRIBE | ACTUALIZA | POR_TIPO | SiteInfrastructureController.verifySnis → SiteEstablishmentService.verifySnis | `src/modules/practice/services/site-establishment.service.ts:268` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.verifySnis → SiteEstablishmentService.verifySnis → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SiteRegulatoryDto>` · DTO `SiteRegulatoryDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:178` |
| `practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:179` |
| `branchId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:181` |
| `code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:182` |
| `name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:183` |
| `status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:184` |
| `status.code` | `string` | Sí | — | — | — | sin fuente |
| `status.display` | `string` | Sí | — | — | — | sin fuente |
| `timeZone` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:185` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:186` |
| `regulatory` | `SiteRegulatoryDataDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:188` |
| `regulatory.snisCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:155` |
| `regulatory.snisVerified` | `boolean` | Sí | — | — | Código SNIS verificado por la plataforma | `src/modules/practice/dto/infrastructure-responses.dto.ts:157` |
| `regulatory.subsector` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:159` |
| `regulatory.subsector.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.subsector.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.careLevel` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:161` |
| `regulatory.careLevel.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.careLevel.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.typology` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:163` |
| `regulatory.typology.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.typology.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.managingEntityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:165` |
| `regulatory.healthNetworkName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:167` |
| `regulatory.sedes` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:168` |
| `regulatory.sedes.code` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.sedes.display` | `string` | Sí | — | — | — | sin fuente |
| `regulatory.municipalityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:170` |
| `canWrite` | `boolean` | Sí | — | — | El actor puede editar la estructura (sólo refleja; la API decide) | `src/modules/practice/dto/infrastructure-responses.dto.ts:193` |
| `missingRequiredFunctions` | `array<string>` | Sí | — | — | Funciones obligatorias que faltan | `src/modules/practice/dto/infrastructure-responses.dto.ts:367` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo la plataforma verifica el código SNIS |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 81. GET /sites/{siteId}/sample-collection-points

- **Origen:** CONTRATO
- **Nombre:** Puntos de toma de muestra de una sede (F5b)
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SpaceAssetsController.collectionPoints` — `src/modules/practice/controllers/space-assets.controller.ts:51`

### Qué es y para qué sirve (negocio)

Puntos de toma de muestra de una sede (F5b). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/sample-collection-points` la atiende `SpaceAssetsController.collectionPoints` (src/modules/practice/controllers/space-assets.controller.ts:51). Exige sesión; el controlador no declara roles. Delega en `SpaceAssetsReadService.collectionPoints`. Lee clinical.encounter_locations, clinical.encounters, practice.care_space_status_events, practice.care_spaces, practice.cleaning_orders, practice.clinical_units, practice.practice_settings, practice.practice_sites y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/space-assets.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/space-assets.controller.ts:51` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `clinical.encounters` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `practice.care_space_status_events` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsRepository.lastEventBySpace | `src/modules/practice/repositories/care-space-ops.repository.ts:373` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints | `src/modules/practice/services/space-assets-read.service.ts:103` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor | `src/modules/practice/services/ops/ops-cell-builder.ts:155` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |
| `profiles.persons` | LEE | LEE | POR_SQL | SpaceAssetsController.collectionPoints → SpaceAssetsReadService.collectionPoints → OpsCellBuilder.cellFor → CareSpaceOpsRepository.patientBadges | `src/modules/practice/repositories/care-space-ops.repository.ts:204` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5b.int-spec.ts:93` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SpaceAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 82. GET /sites/{siteId}/structure

- **Origen:** CONTRATO
- **Nombre:** Estructura de la sede (espacios, unidades, vínculos)
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SiteInfrastructureController.structure` — `src/modules/practice/controllers/site-infrastructure.controller.ts:67`

### Qué es y para qué sirve (negocio)

Estructura de la sede (espacios, unidades, vínculos). Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/structure` la atiende `SiteInfrastructureController.structure` (src/modules/practice/controllers/site-infrastructure.controller.ts:67). Exige sesión; el controlador no declara roles. Delega en `InfrastructureReadService.structure`. Lee directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/site-infrastructure.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/practice/controllers/site-infrastructure.controller.ts:67` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.structure → InfrastructureReadService.structure → StructureAccessService.canWriteSite → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SiteInfrastructureController.structure → InfrastructureReadService.structure → StructureAccessService.canWriteSite → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SiteInfrastructureController.structure → InfrastructureReadService.structure → CareSpacesRepository.findBySite | `src/modules/practice/repositories/care-spaces.repository.ts:96` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | SiteInfrastructureController.structure → InfrastructureReadService.structure → ClinicalUnitsRepository.findBySite | `src/modules/practice/repositories/clinical-units.repository.ts:79` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SiteInfrastructureController.structure → InfrastructureReadService.structure → StructureAccessService.requireSite → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | DIRECTA | SiteInfrastructureController.structure → InfrastructureReadService.structure → SpaceUnitAssignmentsRepository.findCurrentBySpaces | `src/modules/practice/repositories/space-unit-assignments.repository.ts:43` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SiteStructureDto>` · DTO `SiteStructureDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `site` | `EstablishmentSummaryDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:199` |
| `site.id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:178` |
| `site.practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:179` |
| `site.branchId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:181` |
| `site.code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:182` |
| `site.name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:183` |
| `site.status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:184` |
| `site.status.code` | `string` | Sí | — | — | — | sin fuente |
| `site.status.display` | `string` | Sí | — | — | — | sin fuente |
| `site.timeZone` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:185` |
| `site.rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:186` |
| `site.regulatory` | `SiteRegulatoryDataDto` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:188` |
| `site.regulatory.snisCode` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:155` |
| `site.regulatory.snisVerified` | `boolean` | Sí | — | — | Código SNIS verificado por la plataforma | `src/modules/practice/dto/infrastructure-responses.dto.ts:157` |
| `site.regulatory.subsector` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:159` |
| `site.regulatory.subsector.code` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.subsector.display` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.careLevel` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:161` |
| `site.regulatory.careLevel.code` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.careLevel.display` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.typology` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:163` |
| `site.regulatory.typology.code` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.typology.display` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.managingEntityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:165` |
| `site.regulatory.healthNetworkName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:167` |
| `site.regulatory.sedes` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:168` |
| `site.regulatory.sedes.code` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.sedes.display` | `string` | Sí | — | — | — | sin fuente |
| `site.regulatory.municipalityName` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:170` |
| `site.canWrite` | `boolean` | Sí | — | — | El actor puede editar la estructura (sólo refleja; la API decide) | `src/modules/practice/dto/infrastructure-responses.dto.ts:193` |
| `spaces` | `array<CareSpaceNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:200` |
| `spaces[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:109` |
| `spaces[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:110` |
| `spaces[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:112` |
| `spaces[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:113` |
| `spaces[].form` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:114` |
| `spaces[].form.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].form.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:116` |
| `spaces[].function.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].function.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:117` |
| `spaces[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:119` |
| `spaces[].operationalStatus.code` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].operationalStatus.display` | `string` | Sí | — | — | — | sin fuente |
| `spaces[].clinicalUnitId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:120` |
| `spaces[].capacity` | `number` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:122` |
| `spaces[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:123` |
| `spaces[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:124` |
| `units` | `array<ClinicalUnitNodeDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:201` |
| `units[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:129` |
| `units[].parentId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:130` |
| `units[].code` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:132` |
| `units[].name` | `string` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:133` |
| `units[].description` | `string` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:134` |
| `units[].status` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:135` |
| `units[].status.code` | `string` | Sí | — | — | — | sin fuente |
| `units[].status.display` | `string` | Sí | — | — | — | sin fuente |
| `units[].responsibleUserId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:136` |
| `units[].rowVersion` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:138` |
| `units[].childCount` | `number` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:139` |
| `assignments` | `array<SpaceUnitAssignmentDto>` | Sí | — | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:203` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:144` |
| `assignments[].careSpaceId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:145` |
| `assignments[].clinicalUnitId` | `string` | Sí | formato uuid | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:146` |
| `assignments[].role` | `ConceptDto` | Sí | admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:147` |
| `assignments[].role.code` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].role.display` | `string` | Sí | — | — | — | sin fuente |
| `assignments[].validFrom` | `string` | Sí | formato date-time | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:148` |
| `assignments[].validTo` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/practice/dto/infrastructure-responses.dto.ts:150` |
| `asOf` | `string` | Sí | — | — | Instante de la lectura (S7) | `src/modules/practice/dto/infrastructure-responses.dto.ts:204` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practice-infrastructure.int-spec.ts:227` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:SiteInfrastructureController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 83. POST /tenants/{tenantId}/practices

- **Origen:** CONTRATO
- **Nombre:** Crear la práctica y la primera sede de una organización
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrganizationPracticesController.create` — `src/modules/practice/controllers/organization-practices.controller.ts:41`

### Qué es y para qué sirve (negocio)

Crear la práctica y la primera sede de una organización. Dentro del módulo (descripción del modelo, en inglés): «General physical and care-delivery infrastructure for a private office, clinic, medical center, hospital, nursing station, laboratory, imaging site, pharmacy counter, mobile unit or virtual service.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_14_practice.puml:44`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/practices` la atiende `OrganizationPracticesController.create` (src/modules/practice/controllers/organization-practices.controller.ts:41). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateOrganizationPracticeDto` (7 campos, 6 obligatorios). Delega en `OrganizationPracticeProvisioningService.provision`. Crea filas en common.addresses, practice.practice_sites, practice.practices. Lee directory.tenant_memberships, directory.tenants, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/practice/controllers/organization-practices.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/practice/controllers/organization-practices.controller.ts:41` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | OrganizationPracticesController.create → OrganizationPracticeProvisioningService.provision → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:154` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | OrganizationPracticesController.create → OrganizationPracticeProvisioningService.provision → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `directory.tenants` | LEE | LEE | DIRECTA | OrganizationPracticesController.create → OrganizationPracticeProvisioningService.provision → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:77` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | OrganizationPracticesController.create → OrganizationPracticeProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:116` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | OrganizationPracticesController.create → OrganizationPracticeProvisioningService.provision → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:90` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | OrganizationPracticesController.create → OrganizationPracticeProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |
| `practice.practices` | LEE | LEE | DIRECTA | OrganizationPracticesController.create → OrganizationPracticeProvisioningService.provision → PracticesRepository.findByTenantAndCode | `src/modules/practice/repositories/practices.repository.ts:112` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateOrganizationPracticeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 2; longitud máxima 200 | `@IsString()` `@MinLength(2)` `@MaxLength(200)` | Nombre del centro médico | `src/modules/practice/dto/create-organization-practice.dto.ts:77` |
| `site` | `CreateOrganizationPracticeSiteDto` | Sí | — | `@IsDefined()` `@ValidateNested()` `@Type(() => CreateOrganizationPracticeSiteDto)` | — | `src/modules/practice/dto/create-organization-practice.dto.ts:84` |
| `site.name` | `string` | Sí | longitud mínima 2; longitud máxima 200 | `@IsString()` `@MinLength(2)` `@MaxLength(200)` | Nombre de la sede | `src/modules/practice/dto/create-organization-practice.dto.ts:28` |
| `site.addressText` | `string` | Sí | longitud mínima 2; longitud máxima 500 | `@IsString()` `@MinLength(2)` `@MaxLength(500)` | Dirección en una línea | `src/modules/practice/dto/create-organization-practice.dto.ts:39` |
| `site.latitude` | `number` | Sí | mínimo -90; máximo 90 | `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/practice/dto/create-organization-practice.dto.ts:46` |
| `site.longitude` | `number` | Sí | mínimo -180; máximo 180 | `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/practice/dto/create-organization-practice.dto.ts:53` |
| `site.cityText` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/practice/dto/create-organization-practice.dto.ts:60` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "site": {
    "name": "Nombre de ejemplo",
    "addressText": "Av. San Martín 123",
    "latitude": -17.7833,
    "longitude": -63.1821
  }
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "site": {
    "name": "Nombre de ejemplo",
    "addressText": "Av. San Martín 123",
    "latitude": -17.7833,
    "longitude": -63.1821,
    "cityText": "Santa Cruz de la Sierra"
  }
}
```

</details>

### Respuesta — `Promise<OrganizationPracticeResponseDto>` · DTO `OrganizationPracticeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | — | Identificador de la práctica creada. | `src/modules/practice/dto/create-organization-practice.dto.ts:90` |
| `practiceSiteId` | `string` | Sí | formato uuid | — | Identificador de su primera sede. | `src/modules/practice/dto/create-organization-practice.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: La organización ya tiene una práctica con ese nombre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La organización todavía no fue verificada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/practice.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/medical-center-registration.int-spec.ts:215` |
| CONTROLADOR | `src/modules/practice/controllers/organization-practices.controller.spec.ts:28` |

### Flujos

- Módulo Practice (14) — etapa `ctrl:OrganizationPracticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

