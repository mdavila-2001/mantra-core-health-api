<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `delegated_access`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 11 (11 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 10 · BAJO 0
- **Tablas distintas que tocan:** 7
- **Respuestas de error y detalle contractual:** `openapi/endpoints/delegated-access.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/access-requests/{id}/decision` | Aprobar/Denegar solicitud y emitir grant scoped | MEDIO | 4 | SECURITY_ADMIN |
| 2 | POST | `/authz/effective-actor/evaluate` | Evaluar actor efectivo por propósito (step-up) | MEDIO | 4 | SECURITY_ADMIN |
| 3 | POST | `/delegated-access/expiry-sweep` | Expirar delegaciones y grants vencidos (barrido) | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 4 | POST | `/delegated-permission-sets` | Publicar set de permisos delegados (scoped) | MEDIO | 3 | SECURITY_ADMIN |
| 5 | POST | `/delegated-permission-sets/{id}/versions` | Versionar set de permisos delegados | ALTO | 4 | SECURITY_ADMIN |
| 6 | POST | `/org/{tenantMembershipId}/user-assignments` | Asignar usuario de organización con alcance y vigencia | MEDIO | 2 | SECURITY_ADMIN |
| 7 | PATCH | `/org/user-assignments/{id}` | Reasignar supervisor / suspender asignación de organización | MEDIO | 3 | SECURITY_ADMIN |
| 8 | POST | `/practitioner-delegates` | Crear asignación de delegado de practitioner | MEDIO | 4 | SECURITY_ADMIN |
| 9 | POST | `/practitioner-delegates/{id}/access-requests` | Solicitar acceso delegado (aprobación previa) | MEDIO | 4 | SECURITY_ADMIN |
| 10 | POST | `/practitioner-delegates/{id}/grants` | Otorgar grant delegado por-propósito y temporal | MEDIO | 3 | SECURITY_ADMIN |
| 11 | POST | `/practitioner-delegates/{id}/revoke` | Revocar delegación de forma inmediata (cascada authz) | MEDIO | 5 | SECURITY_ADMIN |

---

## 1. POST /access-requests/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Aprobar/Denegar solicitud y emitir grant scoped
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccessRequestsController.decide` — `src/modules/delegated_access/controllers/access-requests.controller.ts:28`

### Qué es y para qué sirve (negocio)

Aprobar/Denegar solicitud y emitir grant scoped. Caso de uso UC-29-05: Aprobar/Denegar y emitir grant scoped. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /access-requests/{id}/decision` la atiende `AccessRequestsController.decide` (src/modules/delegated_access/controllers/access-requests.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DecideAccessRequestDto` (5 campos, 1 obligatorio). Delega en `AccessRequestsService.decide`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests. Lee delegated_access.delegated_access_approval_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/access-requests.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/access-requests.controller.ts:28` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | AccessRequestsController.decide → AccessRequestsService.decide | `src/modules/delegated_access/services/access-requests.service.ts:161` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegatedAccessApprovalRequestsRepository.findById | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:51` |
| `delegated_access.delegated_access_grants` | ESCRIBE | CREA | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegatedAccessGrantsRepository.create | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:79` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideAccessRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, DENIED | `@IsIn(DECISIONS)` | Decisión del aprobador | `src/modules/delegated_access/dto/decide-access-request.dto.ts:22` |
| `purpose` | `string` | No | valores: TREATMENT, BILLING, OPERATIONS | `@IsOptional()` `@IsIn(PURPOSES)` | Propósito de uso del grant emitido | `src/modules/delegated_access/dto/decide-access-request.dto.ts:33` |
| `resourceType` | `string` | No | valores: CLINICAL_NOTE, APPOINTMENT, PRESCRIPTION | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso del grant | `src/modules/delegated_access/dto/decide-access-request.dto.ts:44` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia del grant (ISO) | `src/modules/delegated_access/dto/decide-access-request.dto.ts:55` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro del grant | `src/modules/delegated_access/dto/decide-access-request.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "purpose": "TREATMENT",
  "resourceType": "CLINICAL_NOTE",
  "validTo": "2026-07-31T12:00:00.000Z",
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DecisionResultDto>` · DTO `DecisionResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestId` | `string` | Sí | formato uuid | — | Solicitud decidida | `src/modules/delegated_access/dto/responses.dto.ts:60` |
| `decision` | `string` | Sí | — | — | Decisión aplicada (APPROVED\|DENIED) | `src/modules/delegated_access/dto/responses.dto.ts:66` |
| `grantId` | `string` | No | formato uuid | — | Grant emitido si fue aprobada | `src/modules/delegated_access/dto/responses.dto.ts:75` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/access-requests.controller.spec.ts:28` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-05`

---

## 2. POST /authz/effective-actor/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar actor efectivo por propósito (step-up)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedAccessAuthzController.evaluate` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:38`

### Qué es y para qué sirve (negocio)

Evaluar actor efectivo por propósito (step-up). Caso de uso UC-29-09: Evaluar actor efectivo por propósito (step-up). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/effective-actor/evaluate` la atiende `DelegatedAccessAuthzController.evaluate` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `EvaluateActorDto` (6 campos, 2 obligatorios). Delega en `DelegatedAccessEvaluationService.evaluate`. Crea filas en delegated_access.delegation_events. Lee delegated_access.delegated_access_grants, delegated_access.delegated_permission_set_items, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedAccessGrantsRepository.findActiveMatch | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:118` |
| `delegated_access.delegated_permission_set_items` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedPermissionSetItemsRepository.findBySetAndPermission | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:75` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |

### Cuerpo — DTO `EvaluateActorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerDelegateAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Delegación a evaluar | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:18` |
| `purpose` | `string` | Sí | valores: TREATMENT, BILLING, OPERATIONS | `@IsIn(PURPOSES)` | Propósito de uso del acceso | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:25` |
| `permissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Permiso concreto que se ejerce | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:36` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente sobre el que se accede | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:47` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro sobre el que se accede | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:58` |
| `resourceType` | `string` | No | valores: CLINICAL_NOTE, APPOINTMENT, PRESCRIPTION | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerDelegateAssignmentId": "00000000-0000-4000-8000-000000000001",
  "purpose": "TREATMENT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerDelegateAssignmentId": "00000000-0000-4000-8000-000000000001",
  "purpose": "TREATMENT",
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "CLINICAL_NOTE"
}
```

</details>

### Respuesta — `Promise<EvaluationResultDto>` · DTO `EvaluationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `allowed` | `boolean` | Sí | — | — | Si el acceso está permitido | `src/modules/delegated_access/dto/responses.dto.ts:105` |
| `requiresStepUp` | `boolean` | Sí | — | — | Si exige step-up antes de permitir | `src/modules/delegated_access/dto/responses.dto.ts:111` |
| `reason` | `string` | No | — | — | Motivo cuando no se permite | `src/modules/delegated_access/dto/responses.dto.ts:117` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-access-authz.controller.spec.ts:37` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-09`

---

## 3. POST /delegated-access/expiry-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar delegaciones y grants vencidos (barrido)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedAccessAuthzController.expirySweep` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:27`

### Qué es y para qué sirve (negocio)

Expirar delegaciones y grants vencidos (barrido). Caso de uso UC-29-08: Expirar delegaciones y grants vencidos. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-access/expiry-sweep` la atiende `DelegatedAccessAuthzController.expirySweep` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:27). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `DelegatedAccessEvaluationService.expirySweep`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:27` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:73` |
| `delegated_access.delegated_access_grants` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → DelegatedAccessGrantsRepository.findOverdueActive | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:151` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:106` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → OrganizationUserAssignmentsRepository.findOverdueActive | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:142` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:90` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → PractitionerDelegateAssignmentsRepository.findOverdueActive | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:137` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExpirySweepResultDto>` · DTO `ExpirySweepResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredGrants` | `number` | Sí | — | — | Grants expirados | `src/modules/delegated_access/dto/responses.dto.ts:84` |
| `expiredDelegations` | `number` | Sí | — | — | Delegaciones de practitioner expiradas | `src/modules/delegated_access/dto/responses.dto.ts:90` |
| `expiredOrgAssignments` | `number` | Sí | — | — | Asignaciones de organización expiradas | `src/modules/delegated_access/dto/responses.dto.ts:96` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-access-authz.controller.spec.ts:27` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-08`

---

## 4. POST /delegated-permission-sets

- **Origen:** CONTRATO
- **Nombre:** Publicar set de permisos delegados (scoped)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.createSet` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:32`

### Qué es y para qué sirve (negocio)

Publicar set de permisos delegados (scoped). Caso de uso UC-29-02: Publicar set de permisos delegados (v1). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets` la atiende `DelegatedPermissionSetsController.createSet` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:32). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePermissionSetDto` (9 campos, 5 obligatorios). Delega en `PermissionSetsService.createSet`. Crea filas en delegated_access.delegated_permission_set_items, delegated_access.delegated_permission_sets. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_set_items` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetItemsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:39` |
| `delegated_access.delegated_permission_sets` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:75` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetsRepository.findByCode | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:61` |

### Cuerpo — DTO `CreatePermissionSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario del set | `src/modules/delegated_access/dto/create-permission-set.dto.ts:25` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del set por tenant | `src/modules/delegated_access/dto/create-permission-set.dto.ts:37` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible del set | `src/modules/delegated_access/dto/create-permission-set.dto.ts:46` |
| `delegateType` | `string` | No | valores: SECRETARY, ASSISTANT, NURSE, BILLING | `@IsOptional()` `@IsIn(DELEGATE_TYPES)` | Tipo de delegado | `src/modules/delegated_access/dto/create-permission-set.dto.ts:57` |
| `description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción del set | `src/modules/delegated_access/dto/create-permission-set.dto.ts:66` |
| `items` | `array<PermissionSetItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PermissionSetItemDto)` | Ítems de permiso de la versión 1 | `src/modules/delegated_access/dto/create-permission-set.dto.ts:79` |
| `items[].permissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso referenciado en authz | `src/modules/delegated_access/dto/permission-set-item.dto.ts:11` |
| `items[].constraintJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Restricción declarativa (constraint) del permiso | `src/modules/delegated_access/dto/permission-set-item.dto.ts:21` |
| `items[].requiresStepUpAuthentication` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere step-up (autenticación reforzada) | `src/modules/delegated_access/dto/permission-set-item.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "delegateType": "SECRETARY",
  "description": "Texto descriptivo de ejemplo",
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "constraintJson": {},
      "requiresStepUpAuthentication": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<PermissionSetVersionDto>` · DTO `PermissionSetVersionDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:30` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:36` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:42` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un set con ese código en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.spec.ts:33` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-02`

---

## 5. POST /delegated-permission-sets/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Versionar set de permisos delegados
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.publishVersion` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:44`

### Qué es y para qué sirve (negocio)

Versionar set de permisos delegados. Caso de uso UC-29-02: Versionar set (reemplazo all-or-nothing). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets/{id}/versions` la atiende `DelegatedPermissionSetsController.publishVersion` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:44). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishSetVersionDto` (4 campos, 2 obligatorios). Delega en `PermissionSetsService.publishVersion`. Crea filas en delegated_access.delegated_permission_set_items. Actualiza delegated_access.delegated_permission_sets. Borra de delegated_access.delegated_permission_set_items. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:44` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_set_items` | BORRA | BORRA | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegatedPermissionSetItemsRepository.deleteBySet | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:83` |
| `delegated_access.delegated_permission_set_items` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegatedPermissionSetItemsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:39` |
| `delegated_access.delegated_permission_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion | `src/modules/delegated_access/services/permission-sets.service.ts:130` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishSetVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PermissionSetItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PermissionSetItemDto)` | Ítems de permiso de la nueva versión | `src/modules/delegated_access/dto/publish-set-version.dto.ts:19` |
| `items[].permissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso referenciado en authz | `src/modules/delegated_access/dto/permission-set-item.dto.ts:11` |
| `items[].constraintJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Restricción declarativa (constraint) del permiso | `src/modules/delegated_access/dto/permission-set-item.dto.ts:21` |
| `items[].requiresStepUpAuthentication` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere step-up (autenticación reforzada) | `src/modules/delegated_access/dto/permission-set-item.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "constraintJson": {},
      "requiresStepUpAuthentication": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<PermissionSetVersionDto>` · DTO `PermissionSetVersionDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:30` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:36` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:42` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Set de permisos no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.spec.ts:40` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-02`

---

## 6. POST /org/{tenantMembershipId}/user-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar usuario de organización con alcance y vigencia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.create` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:34`

### Qué es y para qué sirve (negocio)

Asignar usuario de organización con alcance y vigencia. Caso de uso UC-29-01: Asignar usuario de organización (scoped, vigente). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/{tenantMembershipId}/user-assignments` la atiende `OrgUserAssignmentsController.create` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:34). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOrgUserAssignmentDto` (11 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.createAssignment`. Crea filas en delegated_access.organization_user_assignments. Lee delegated_access.organization_user_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantMembershipId | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:34` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | OrgUserAssignmentsController.create → OrgUserAssignmentsService.createAssignment → OrganizationUserAssignmentsRepository.create | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:114` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | OrgUserAssignmentsController.create → OrgUserAssignmentsService.createAssignment → OrganizationUserAssignmentsRepository.findActiveOverlap | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:95` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantMembershipId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateOrgUserAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `role` | `string` | No | valores: STAFF, SECRETARY, ASSISTANT, NURSE, BILLING | `@IsOptional()` `@IsIn(ROLES)` | Rol de la asignación | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:15` |
| `accessScope` | `string` | No | valores: TENANT, PRACTICE, SITE, UNIT | `@IsOptional()` `@IsIn(SCOPES)` | Alcance de acceso | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:23` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: práctica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:34` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: sede de práctica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:45` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: unidad clínica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:56` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: care space | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:67` |
| `diagnosticUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: unidad de diagnóstico | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:78` |
| `pharmacyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: farmacia | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:89` |
| `supervisorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Supervisor responsable | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:100` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO) | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:111` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia (ISO) | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:122` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "role": "STAFF",
  "accessScope": "TENANT",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitId": "00000000-0000-4000-8000-000000000001",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "supervisorUserId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una asignación activa con ese rol y alcance |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/org-user-assignments.controller.spec.ts:28` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-01`

---

## 7. PATCH /org/user-assignments/{id}

- **Origen:** CONTRATO
- **Nombre:** Reasignar supervisor / suspender asignación de organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.update` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:49`

### Qué es y para qué sirve (negocio)

Reasignar supervisor / suspender asignación de organización. Caso de uso UC-29-10: Reasignar supervisor / suspender (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /org/user-assignments/{id}` la atiende `OrgUserAssignmentsController.update` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:49). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateOrgUserAssignmentDto` (4 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.updateAssignment`. Actualiza delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.organization_user_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:49` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment | `src/modules/delegated_access/services/org-user-assignments.service.ts:174` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:84` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → PractitionerDelegateAssignmentsRepository.suspendByDelegateAssignment | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateOrgUserAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `supervisorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nuevo supervisor | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:17` |
| `accessScope` | `string` | No | valores: TENANT, PRACTICE, SITE, UNIT | `@IsOptional()` `@IsIn(SCOPES)` | Nuevo alcance de acceso | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:25` |
| `suspend` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Suspender la asignación (cascada a delegaciones) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:35` |
| `expectedRowVersion` | `number` | No | — | `@IsOptional()` `@IsInt()` | row_version esperado (concurrencia optimista) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "supervisorUserId": "00000000-0000-4000-8000-000000000001",
  "accessScope": "TENANT",
  "suspend": true,
  "expectedRowVersion": 1
}
```

</details>

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:51` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación no encontrada |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: row_version no coincide |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay cambios que aplicar; PreconditionFailedException: La asignación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/org-user-assignments.controller.spec.ts:35` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-10`

---

## 8. POST /practitioner-delegates

- **Origen:** CONTRATO
- **Nombre:** Crear asignación de delegado de practitioner
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.create` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:46`

### Qué es y para qué sirve (negocio)

Crear asignación de delegado de practitioner. Caso de uso UC-29-03: Crear delegación de practitioner. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates` la atiende `PractitionerDelegatesController.create` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:46). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerDelegateDto` (10 campos, 3 obligatorios). Delega en `PractitionerDelegatesService.createDelegate`. Crea filas en delegated_access.delegation_events, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_permission_sets, delegated_access.organization_user_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:84` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:90` |

### Cuerpo — DTO `CreatePractitionerDelegateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerRoleAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Asignación de rol del practitioner delegante | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:24` |
| `delegateUserAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Asignación de usuario de organización (delegado) | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:34` |
| `delegatedPermissionSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Set de permisos delegados a aplicar | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:44` |
| `delegateRole` | `string` | No | valores: ASSISTANT, SECRETARY, NURSE | `@IsOptional()` `@IsIn(DELEGATE_ROLES)` | Rol del delegado | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:55` |
| `patientScope` | `string` | No | valores: ASSIGNED, ALL | `@IsOptional()` `@IsIn(PATIENT_SCOPES)` | Alcance de pacientes | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:66` |
| `appointmentScope` | `string` | No | valores: TODAY, ALL | `@IsOptional()` `@IsIn(APPOINTMENT_SCOPES)` | Alcance de citas | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:77` |
| `mayViewClinicalContent` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Puede ver contenido clínico | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:85` |
| `mayEditDrafts` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Puede editar borradores | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:93` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO) | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:104` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia (ISO) | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:115` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegateUserAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegatedPermissionSetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegateUserAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegatedPermissionSetId": "00000000-0000-4000-8000-000000000001",
  "delegateRole": "ASSISTANT",
  "patientScope": "ASSIGNED",
  "appointmentScope": "TODAY",
  "mayViewClinicalContent": true,
  "mayEditDrafts": true,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación de usuario de organización no encontrada; ResourceNotFoundException: Set de permisos no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El usuario de organización no está activo; PreconditionFailedException: El set de permisos no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:40` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-03`

---

## 9. POST /practitioner-delegates/{id}/access-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar acceso delegado (aprobación previa)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.requestAccess` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:58`

### Qué es y para qué sirve (negocio)

Solicitar acceso delegado (aprobación previa). Caso de uso UC-29-04: Solicitar acceso delegado (aprobación previa). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/access-requests` la atiende `PractitionerDelegatesController.requestAccess` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:58). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccessRequestDto` (4 campos, 1 obligatorio). Delega en `AccessRequestsService.requestAccess`. Crea filas en delegated_access.delegated_access_approval_requests, delegated_access.delegation_events. Lee delegated_access.delegated_access_approval_requests, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:58` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegatedAccessApprovalRequestsRepository.create | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:83` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegatedAccessApprovalRequestsRepository.findOpenDuplicate | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:63` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAccessRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestedPermissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso solicitado (authz) | `src/modules/delegated_access/dto/create-access-request.dto.ts:11` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente objetivo | `src/modules/delegated_access/dto/create-access-request.dto.ts:19` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro objetivo | `src/modules/delegated_access/dto/create-access-request.dto.ts:27` |
| `reasonText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Justificación de la solicitud | `src/modules/delegated_access/dto/create-access-request.dto.ts:36` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "requestedPermissionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "requestedPermissionId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una solicitud pendiente equivalente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:47` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-04`

---

## 10. POST /practitioner-delegates/{id}/grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar grant delegado por-propósito y temporal
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.issueGrant` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:71`

### Qué es y para qué sirve (negocio)

Otorgar grant delegado por-propósito y temporal. Caso de uso UC-29-06: Grant pre-autorizado por-propósito y temporal. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/grants` la atiende `PractitionerDelegatesController.issueGrant` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:71). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateGrantDto` (6 campos, 2 obligatorios). Delega en `PractitionerDelegatesService.issueGrant`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Lee delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:71` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegatedAccessGrantsRepository.create | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:79` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateGrantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purpose` | `string` | Sí | valores: TREATMENT, BILLING, OPERATIONS | `@IsIn(PURPOSES)` | Propósito de uso | `src/modules/delegated_access/dto/create-grant.dto.ts:21` |
| `validTo` | `string` | Sí | formato date-time | `@IsDateString()` | Fin de vigencia del grant (ISO, obligatorio) | `src/modules/delegated_access/dto/create-grant.dto.ts:31` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO) | `src/modules/delegated_access/dto/create-grant.dto.ts:42` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente objetivo | `src/modules/delegated_access/dto/create-grant.dto.ts:50` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro objetivo | `src/modules/delegated_access/dto/create-grant.dto.ts:58` |
| `resourceType` | `string` | No | valores: CLINICAL_NOTE, APPOINTMENT, PRESCRIPTION | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso | `src/modules/delegated_access/dto/create-grant.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purpose": "TREATMENT",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "purpose": "TREATMENT",
  "validTo": "2026-07-31T12:00:00.000Z",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "CLINICAL_NOTE"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:58` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-06`

---

## 11. POST /practitioner-delegates/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar delegación de forma inmediata (cascada authz)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.revoke` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:84`

### Qué es y para qué sirve (negocio)

Revocar delegación de forma inmediata (cascada authz). Caso de uso UC-29-07: Revocar delegación inmediata (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/revoke` la atiende `PractitionerDelegatesController.revoke` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:84). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RevokeDelegationDto` (1 campo, 0 obligatorios). Delega en `PractitionerDelegatesService.revoke`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests, delegated_access.delegated_access_grants, delegated_access.practitioner_delegate_assignments. Lee delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:84` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessApprovalRequestsRepository.cancelOpenByAssignment | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:107` |
| `delegated_access.delegated_access_grants` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessGrantsRepository.revokeActiveByAssignment | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:130` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke | `src/modules/delegated_access/services/practitioner-delegates.service.ts:250` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RevokeDelegationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo de la revocación (auditoría) | `src/modules/delegated_access/dto/revoke-delegation.dto.ts:13` |

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

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:51` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:68` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-07`

---

