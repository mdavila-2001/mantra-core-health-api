<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `delegated_access`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 36 (17 en el contrato, 19 sólo en el código)
- **Riesgo:** ALTO 5 · MEDIO 20 · BAJO 11
- **Tablas distintas que tocan:** 31
- **Respuestas de error y detalle contractual:** `openapi/endpoints/delegated-access.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/access-requests/{id}/decision` | Aprobar/Denegar solicitud y emitir grant scoped | MEDIO | 4 | SECURITY_ADMIN |
| 2 | POST | `/authz/effective-actor/evaluate` | Evaluar actor efectivo por propósito (step-up) | MEDIO | 7 | SECURITY_ADMIN |
| 3 | GET | `/clinical/prescription-shares` | Enlaces de receta de un paciente | BAJO | 3 | PATIENT, PRACTITIONER |
| 4 | POST | `/clinical/prescription-shares` | Compartir una receta con un enlace | MEDIO | 2 | PATIENT, PRACTITIONER |
| 5 | POST | `/clinical/prescription-shares/{shareId}/revoke` | Revocar un enlace de receta | MEDIO | 2 | PATIENT, PRACTITIONER |
| 6 | GET | `/clinical/prescription-shares/by-token/{token}` | Saber si un enlace es de la sesión | BAJO | 1 | PATIENT, PRACTITIONER |
| 7 | POST | `/delegated-access/expiry-sweep` | Expirar delegaciones y grants vencidos (barrido) | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 8 | GET | `/delegated-permission-sets` | Listar los sets de permisos delegados del tenant | BAJO | 1 | SECURITY_ADMIN |
| 9 | POST | `/delegated-permission-sets` | Publicar set de permisos delegados (scoped) | MEDIO | 3 | SECURITY_ADMIN |
| 10 | POST | `/delegated-permission-sets/{id}/versions` | Versionar set de permisos delegados | ALTO | 4 | SECURITY_ADMIN |
| 11 | POST | `/me/practitioner/support-invitations` | Invita a una secretaria registrada (por su documento) a asistirlo. | MEDIO | 17 | PRACTITIONER, CLINICIAN |
| 12 | GET | `/me/practitioner/support-team` | Sus secretarias, activas y pendientes. | BAJO | 12 | PRACTITIONER, CLINICIAN |
| 13 | POST | `/me/practitioner/support-team/{id}/end` | Termina el vínculo con una secretaria suya. | MEDIO | 13 | PRACTITIONER, CLINICIAN |
| 14 | GET | `/me/support-access` | Lo que puede ver: hospitales, sedes, servicios, pisos y doctores. | BAJO | 12 | SUPPORT_STAFF |
| 15 | GET | `/me/support-agenda` | Agenda de un doctor al que asiste (sólo con vínculo activo con él). | BAJO | 16 | SUPPORT_STAFF |
| 16 | GET | `/me/support-catalog` | Catálogo de un hospital para armar el pedido. | BAJO | 9 | SUPPORT_STAFF |
| 17 | GET | `/me/support-engagements` | Sus vínculos y, aparte, los pendientes. | BAJO | 12 | SUPPORT_STAFF |
| 18 | POST | `/me/support-engagements/{id}/confirm` | Acepta una invitación del hospital o de un doctor. | MEDIO | 14 | SUPPORT_STAFF |
| 19 | POST | `/me/support-engagements/{id}/decline` | Rechaza una invitación. | MEDIO | 14 | SUPPORT_STAFF |
| 20 | POST | `/me/support-engagements/{id}/leave` | Deja un vínculo o retira un pedido propio. | MEDIO | 13 | SUPPORT_STAFF |
| 21 | POST | `/org/{tenantMembershipId}/user-assignments` | Asignar usuario de organización con alcance y vigencia | MEDIO | 2 | SECURITY_ADMIN |
| 22 | GET | `/org/support-catalog` | Catálogo del hospital activo, para invitar. | BAJO | 8 | sesión (sin roles) |
| 23 | GET | `/org/support-engagement-requests` | Bandeja del hospital: vínculos en un estado (por defecto pendientes). | BAJO | 12 | sesión (sin roles) |
| 24 | POST | `/org/support-engagement-requests/{id}/decision` | El hospital acepta o rechaza lo que pidió una secretaria. | ALTO | 14 | sesión (sin roles) |
| 25 | GET | `/org/support-engagements` | Personal de apoyo del hospital (vínculos activos y pendientes). | BAJO | 12 | sesión (sin roles) |
| 26 | POST | `/org/support-engagements/{id}/end` | El hospital termina un vínculo o retira una invitación. | ALTO | 13 | sesión (sin roles) |
| 27 | POST | `/org/team/invitations` | El hospital invita a una secretaria registrada (por su documento). | ALTO | 17 | sesión (sin roles) |
| 28 | PATCH | `/org/user-assignments/{id}` | Reasignar supervisor / suspender asignación de organización | MEDIO | 3 | SECURITY_ADMIN |
| 29 | POST | `/practitioner-delegates` | Crear asignación de delegado de practitioner | MEDIO | 7 | SECURITY_ADMIN |
| 30 | POST | `/practitioner-delegates/{id}/accept` | Acepta a la secretaria que pidió asistirlo. | MEDIO | 14 | PRACTITIONER, CLINICIAN |
| 31 | POST | `/practitioner-delegates/{id}/access-requests` | Solicitar acceso delegado (aprobación previa) | MEDIO | 4 | SECURITY_ADMIN |
| 32 | POST | `/practitioner-delegates/{id}/grants` | Otorgar grant delegado por-propósito y temporal | MEDIO | 6 | SECURITY_ADMIN |
| 33 | POST | `/practitioner-delegates/{id}/reject` | Rechaza a la secretaria que pidió asistirlo. | MEDIO | 14 | PRACTITIONER, CLINICIAN |
| 34 | POST | `/practitioner-delegates/{id}/revoke` | Revocar delegación de forma inmediata (cascada authz) | MEDIO | 5 | SECURITY_ADMIN |
| 35 | GET | `/public/prescription-shares/{token}` | Comprobar un enlace de receta compartida | ALTO | 6 | pública |
| 36 | POST | `/support-engagement-requests` | La secretaria pide entrar a un hospital o asistir a sus doctores. | MEDIO | 16 | SUPPORT_STAFF |

---

## 1. POST /access-requests/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Aprobar/Denegar solicitud y emitir grant scoped
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccessRequestsController.decide` — `src/modules/delegated_access/controllers/access-requests.controller.ts:33`

### Qué es y para qué sirve (negocio)

Aprobar/Denegar solicitud y emitir grant scoped. Caso de uso UC-29-05: Aprobar/Denegar y emitir grant scoped. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:94`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /access-requests/{id}/decision` la atiende `AccessRequestsController.decide` (src/modules/delegated_access/controllers/access-requests.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DecideAccessRequestDto` (5 campos, 1 obligatorio). Delega en `AccessRequestsService.decide`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests. Lee delegated_access.delegated_access_approval_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/access-requests.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/access-requests.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

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
| `requestId` | `string` | Sí | formato uuid | — | Solicitud decidida | `src/modules/delegated_access/dto/responses.dto.ts:112` |
| `decision` | `string` | Sí | — | — | Decisión aplicada (APPROVED\|DENIED) | `src/modules/delegated_access/dto/responses.dto.ts:118` |
| `grantId` | `string` | No | formato uuid | — | Grant emitido si fue aprobada | `src/modules/delegated_access/dto/responses.dto.ts:127` |

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
- **Implementación:** `DelegatedAccessAuthzController.evaluate` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48`

### Qué es y para qué sirve (negocio)

Evaluar actor efectivo por propósito (step-up). Caso de uso UC-29-09: Evaluar actor efectivo por propósito (step-up). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:98`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/effective-actor/evaluate` la atiende `DelegatedAccessAuthzController.evaluate` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `EvaluateActorDto` (7 campos, 2 obligatorios). Delega en `DelegatedAccessEvaluationService.evaluate`. Crea filas en delegated_access.delegation_events. Lee delegated_access.delegated_access_grants, delegated_access.delegated_permission_set_items, delegated_access.delegated_permission_sets, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedAccessGrantsRepository.findActiveMatch | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:118` |
| `delegated_access.delegated_permission_set_items` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedPermissionSetItemsRepository.findBySetAndPermission | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:75` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:84` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.membershipOfAssignment → DelegationScopeRepository.membershipOf | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:46` |

### Cuerpo — DTO `EvaluateActorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerDelegateAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Delegación a evaluar | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:18` |
| `effectiveUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario que ejercería el acceso. Si se omite se evalúa al usuario autenticado. Tiene que ser el titular de la asignación del delegado; si no, el acceso no se permite | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:30` |
| `purpose` | `string` | Sí | valores: TREATMENT, BILLING, OPERATIONS | `@IsIn(PURPOSES)` | Propósito de uso del acceso | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:37` |
| `permissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Permiso concreto que se ejerce | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:48` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente sobre el que se accede | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:59` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro sobre el que se accede | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:70` |
| `resourceType` | `string` | No | valores: CLINICAL_NOTE, APPOINTMENT, PRESCRIPTION | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:78` |

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
  "effectiveUserId": "00000000-0000-4000-8000-000000000001",
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
| `allowed` | `boolean` | Sí | — | — | Si el acceso está permitido | `src/modules/delegated_access/dto/responses.dto.ts:157` |
| `requiresStepUp` | `boolean` | Sí | — | — | Si exige step-up antes de permitir | `src/modules/delegated_access/dto/responses.dto.ts:163` |
| `reason` | `string` | No | — | — | Motivo cuando no se permite | `src/modules/delegated_access/dto/responses.dto.ts:169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-access-authz.controller.spec.ts:37` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-09`

---

## 3. GET /clinical/prescription-shares

- **Origen:** CONTRATO
- **Nombre:** Enlaces de receta de un paciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.list` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:89`

### Qué es y para qué sirve (negocio)

Enlaces de receta de un paciente. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /clinical/prescription-shares` la atiende `PrescriptionSharesController.list` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:89). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Delega en `PrescriptionSharesService.listForPatient`. Lee clinical.medication_requests, delegated_access.shared_access_link_uses, delegated_access.shared_access_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PrescriptionSharesController.list → PrescriptionSharesService.listForPatient → SharedAccessLinksRepository.findItemsForResources | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:256` |
| `delegated_access.shared_access_link_uses` | LEE | LEE | POR_SQL | PrescriptionSharesController.list → PrescriptionSharesService.listForPatient → SharedAccessLinksRepository.countOpenedByLinkIds | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:162` |
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesController.list → PrescriptionSharesService.listForPatient → SharedAccessLinksRepository.findByPatient | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:125` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionShareSummaryDto[]>` · DTO `PrescriptionShareSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shareId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:76` |
| `resourceType` | `string` | Sí | valores: PRESCRIPTION_ENCOUNTER, MEDICATION_REQUEST | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:79` |
| `resourceId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:83` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:86` |
| `expiresAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:89` |
| `status` | `string` | Sí | valores: VALID, EXPIRED, REVOKED | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:92` |
| `uses` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:96` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:108` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /clinical/prescription-shares

- **Origen:** CONTRATO
- **Nombre:** Compartir una receta con un enlace
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.create` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:57`

### Qué es y para qué sirve (negocio)

Compartir una receta con un enlace. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-shares` la atiende `PrescriptionSharesController.create` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:57). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Valida el cuerpo como `CreatePrescriptionShareDto` (2 campos, 0 obligatorios). Delega en `PrescriptionSharesService.create`. Crea filas en delegated_access.shared_access_links. Lee clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PrescriptionSharesController.create → PrescriptionSharesService.create → SharedAccessLinksRepository.findItemsByEncounter | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:215` |
| `delegated_access.shared_access_links` | ESCRIBE | CREA | DIRECTA | PrescriptionSharesController.create → PrescriptionSharesService.create → SharedAccessLinksRepository.create | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:67` |

### Cuerpo — DTO `CreatePrescriptionShareDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro de la receta. Excluye a `medicationRequestId`. | `src/modules/delegated_access/dto/prescription-shares.dto.ts:32` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Fármaco suelto. Excluye a `encounterId`. | `src/modules/delegated_access/dto/prescription-shares.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PrescriptionShareCreatedDto>` · DTO `PrescriptionShareCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shareId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:55` |
| `url` | `string` | Sí | — | — | Enlace para compartir: `<web>/rx/<token>` | `src/modules/delegated_access/dto/prescription-shares.dto.ts:59` |
| `token` | `string` | Sí | — | — | Token en claro; se devuelve una sola vez | `src/modules/delegated_access/dto/prescription-shares.dto.ts:63` |
| `expiresAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:66` |
| `itemCount` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:70` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: {{ code: ErrorCode.VALIDATION_FAILED, message: 'Indicá la co…} |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {{ code: ErrorCode.FORBIDDEN, message: 'Solo el paciente o q…} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La receta no tiene medicamentos emitidos y vigentes para compartir. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:105` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /clinical/prescription-shares/{shareId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar un enlace de receta
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.revoke` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:123`

### Qué es y para qué sirve (negocio)

Revocar un enlace de receta. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-shares/{shareId}/revoke` la atiende `PrescriptionSharesController.revoke` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:123). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Delega en `PrescriptionSharesService.revoke`. Actualiza delegated_access.shared_access_links. Lee delegated_access.shared_access_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: shareId | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:123` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.shared_access_links` | ESCRIBE | ACTUALIZA | POR_TIPO | PrescriptionSharesController.revoke → PrescriptionSharesService.revoke | `src/modules/delegated_access/services/prescription-shares.service.ts:270` |
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesController.revoke → PrescriptionSharesService.revoke → SharedAccessLinksRepository.findById | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:109` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `shareId` | path | Sí | `string` | — |

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
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:114` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /clinical/prescription-shares/by-token/{token}

- **Origen:** CONTRATO
- **Nombre:** Saber si un enlace es de la sesión
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.resolveOwnership` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:106`

### Qué es y para qué sirve (negocio)

Saber si un enlace es de la sesión. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /clinical/prescription-shares/by-token/{token}` la atiende `PrescriptionSharesController.resolveOwnership` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:106). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Delega en `PrescriptionSharesService.resolveOwnership`. Lee delegated_access.shared_access_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesController.resolveOwnership → PrescriptionSharesService.resolveOwnership → PrescriptionSharesService.findByToken → SharedAccessLinksRepository.findByTokenHash | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `token` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionShareOwnershipDto>` · DTO `PrescriptionShareOwnershipDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shareId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:102` |
| `resourceType` | `string` | Sí | valores: PRESCRIPTION_ENCOUNTER, MEDICATION_REQUEST | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:105` |
| `resourceId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:108` |

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
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:111` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /delegated-access/expiry-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar delegaciones y grants vencidos (barrido)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedAccessAuthzController.expirySweep` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32`

### Qué es y para qué sirve (negocio)

Expirar delegaciones y grants vencidos (barrido). Caso de uso UC-29-08: Expirar delegaciones y grants vencidos. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:97`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-access/expiry-sweep` la atiende `DelegatedAccessAuthzController.expirySweep` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `DelegatedAccessEvaluationService.expirySweep`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

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
| `expiredGrants` | `number` | Sí | — | — | Grants expirados | `src/modules/delegated_access/dto/responses.dto.ts:136` |
| `expiredDelegations` | `number` | Sí | — | — | Delegaciones de practitioner expiradas | `src/modules/delegated_access/dto/responses.dto.ts:142` |
| `expiredOrgAssignments` | `number` | Sí | — | — | Asignaciones de organización expiradas | `src/modules/delegated_access/dto/responses.dto.ts:148` |

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

## 8. GET /delegated-permission-sets

- **Origen:** CONTRATO
- **Nombre:** Listar los sets de permisos delegados del tenant
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.list` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:47`

### Qué es y para qué sirve (negocio)

Listar los sets de permisos delegados del tenant. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /delegated-permission-sets` la atiende `DelegatedPermissionSetsController.list` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `PermissionSetsService.listByTenant`. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedPermissionSetsController.list → PermissionSetsService.listByTenant → DelegatedPermissionSetsRepository.findByTenantPage | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Sets por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListPermissionSetsResponseDto>` · DTO `ListPermissionSetsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PermissionSetSummaryDto>` | Sí | — | — | Sets de esta página, ordenados por `id`. | `src/modules/delegated_access/dto/responses.dto.ts:63` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:28` |
| `items[].code` | `string` | Sí | — | — | Código del set, único dentro del tenant. | `src/modules/delegated_access/dto/responses.dto.ts:32` |
| `items[].name` | `string` | Sí | — | — | Nombre visible del set. | `src/modules/delegated_access/dto/responses.dto.ts:36` |
| `items[].delegateTypeConceptId` | `string` | Sí | formato uuid | — | Concepto del tipo de delegado al que aplica. | `src/modules/delegated_access/dto/responses.dto.ts:40` |
| `items[].description` | `string` | No | — | — | Descripción libre, si se publicó una. | `src/modules/delegated_access/dto/responses.dto.ts:44` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Concepto de estado del set. | `src/modules/delegated_access/dto/responses.dto.ts:48` |
| `items[].versionNumber` | `number` | Sí | — | — | Versión publicada más reciente. | `src/modules/delegated_access/dto/responses.dto.ts:52` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha de creación del set. | `src/modules/delegated_access/dto/responses.dto.ts:56` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/delegated_access/dto/responses.dto.ts:66` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/delegated_access/dto/responses.dto.ts:69` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/delegated_access/dto/responses.dto.ts:73` |

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
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:155` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:DelegatedPermissionSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /delegated-permission-sets

- **Origen:** CONTRATO
- **Nombre:** Publicar set de permisos delegados (scoped)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.createSet` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64`

### Qué es y para qué sirve (negocio)

Publicar set de permisos delegados (scoped). Caso de uso UC-29-02: Publicar set de permisos delegados (v1). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:90`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets` la atiende `DelegatedPermissionSetsController.createSet` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePermissionSetDto` (9 campos, 5 obligatorios). Delega en `PermissionSetsService.createSet`. Crea filas en delegated_access.delegated_permission_set_items, delegated_access.delegated_permission_sets. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_set_items` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetItemsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:39` |
| `delegated_access.delegated_permission_sets` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:99` |
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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:82` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:88` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:94` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un set con ese código en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.spec.ts:33` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-02`

---

## 10. POST /delegated-permission-sets/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Versionar set de permisos delegados
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.publishVersion` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81`

### Qué es y para qué sirve (negocio)

Versionar set de permisos delegados. Caso de uso UC-29-02: Versionar set (reemplazo all-or-nothing). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:91`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets/{id}/versions` la atiende `DelegatedPermissionSetsController.publishVersion` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishSetVersionDto` (4 campos, 2 obligatorios). Delega en `PermissionSetsService.publishVersion`. Crea filas en delegated_access.delegated_permission_set_items. Actualiza delegated_access.delegated_permission_sets. Borra de delegated_access.delegated_permission_set_items. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_set_items` | BORRA | BORRA | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegatedPermissionSetItemsRepository.deleteBySet | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:83` |
| `delegated_access.delegated_permission_set_items` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegatedPermissionSetItemsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:39` |
| `delegated_access.delegated_permission_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion | `src/modules/delegated_access/services/permission-sets.service.ts:183` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegationScopeService.loadSetInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:82` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:88` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:94` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.spec.ts:40` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-02`

---

## 11. POST /me/practitioner/support-invitations

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Invita a una secretaria registrada (por su documento) a asistirlo.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.invite` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117`

### Qué es y para qué sirve (negocio)

Invita a una secretaria registrada (por su documento) a asistirlo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/practitioner/support-invitations` la atiende `PractitionerSupportController.invite` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:117). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `PractitionerInviteSupportDto` (2 campos, 2 obligatorios). Delega en `SupportStaffService.inviteForPractitioner`. Crea filas en delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practitioner_support_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.authentication_credentials, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.createLocationLink | `src/modules/delegated_access/repositories/support-links.repository.ts:704` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:607` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:324` |
| `iam.authentication_credentials` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:271` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportLinksRepository.findActiveRoleAssignmentsOfPractitioner | `src/modules/delegated_access/repositories/support-links.repository.ts:432` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportLinksRepository.findActiveRoleAssignmentsOfPractitioner | `src/modules/delegated_access/repositories/support-links.repository.ts:432` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.createPractitionerLink | `src/modules/delegated_access/repositories/support-links.repository.ts:730` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:271` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:271` |

### Cuerpo — DTO `PractitionerInviteSupportDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime NATIONAL_ID_PATTERN | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(NATIONAL_ID_PATTERN, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad con el que la secretaria inicia sesión. | `src/modules/delegated_access/dto/support-staff.dto.ts:137` |
| `practitionerRoleAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Su vinculación con el hospital donde la secretaria lo va a asistir. | `src/modules/delegated_access/dto/support-staff.dto.ts:142` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SupportLinksCreatedDto>` · DTO `SupportLinksCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del primer vínculo creado. | `src/modules/delegated_access/dto/support-staff.dto.ts:273` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:274` |
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:275` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vinculación no encontrada; ResourceNotFoundException: No hay una secretaria registrada con ese documento; ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /me/practitioner/support-team

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Sus secretarias, activas y pendientes.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.team` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:52`

### Qué es y para qué sirve (negocio)

Sus secretarias, activas y pendientes. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/practitioner/support-team` la atiende `PractitionerSupportController.team` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:52). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SupportStaffService.practitionerTeam`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:52` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:52` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkListDto>` · DTO `SupportLinkListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:265` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:266` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:267` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /me/practitioner/support-team/{id}/end

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Termina el vínculo con una secretaria suya.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.end` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98`

### Qué es y para qué sirve (negocio)

Termina el vínculo con una secretaria suya. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/practitioner/support-team/{id}/end` la atiende `PractitionerSupportController.end` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:98). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.endForPractitioner`. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:685` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo, para el registro. No se guarda en la base. | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se termina un vínculo activo o pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /me/support-access

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Lo que puede ver: hospitales, sedes, servicios, pisos y doctores.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.access` — `src/modules/delegated_access/controllers/support-staff.controller.ts:76`

### Qué es y para qué sirve (negocio)

Lo que puede ver: hospitales, sedes, servicios, pisos y doctores. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-access` la atiende `SupportStaffController.access` (src/modules/delegated_access/controllers/support-staff.controller.ts:76). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.myAccess`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:76` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:76` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportLinksRepository.findActiveMembershipTenantIds | `src/modules/delegated_access/repositories/support-links.repository.ts:311` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportAccessResponseDto>` · DTO `SupportAccessResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenants` | `array<SupportTenantScopeDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:339` |
| `tenants[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:319` |
| `tenants[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:321` |
| `tenants[].wholeOrganization` | `boolean` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:322` |
| `tenants[].organizationAccess` | `boolean` | Sí | — | — | El hospital aprobó a la secretaria y entra a su token. false = sólo un doctor la aceptó: ve su agenda y nada más del hospital. | `src/modules/delegated_access/dto/support-staff.dto.ts:327` |
| `tenants[].practiceSiteIds` | `array<string>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:328` |
| `tenants[].clinicalUnitIds` | `array<string>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:329` |
| `tenants[].careSpaceIds` | `array<string>` | Sí | — | — | Pisos y espacios. | `src/modules/delegated_access/dto/support-staff.dto.ts:331` |
| `tenants[].practitioners` | `array<SupportScopePractitionerDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:333` |
| `tenants[].practitioners[].linkId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:310` |
| `tenants[].practitioners[].practitionerRoleAssignmentId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:311` |
| `tenants[].practitioners[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:313` |
| `tenants[].practitioners[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:314` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /me/support-agenda

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Agenda de un doctor al que asiste (sólo con vínculo activo con él).
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.agenda` — `src/modules/delegated_access/controllers/support-staff.controller.ts:180`

### Qué es y para qué sirve (negocio)

Agenda de un doctor al que asiste (sólo con vínculo activo con él). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-agenda` la atiende `SupportStaffController.agenda` (src/modules/delegated_access/controllers/support-staff.controller.ts:180). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.agenda`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:180` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:180` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findActiveRoleAssignmentInTenant | `src/modules/delegated_access/repositories/support-links.repository.ts:410` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findActiveRoleAssignmentInTenant | `src/modules/delegated_access/repositories/support-links.repository.ts:410` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:571` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:571` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:571` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:571` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:571` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `SupportAgendaQueryDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportAgendaResponseDto>` · DTO `SupportAgendaResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportAgendaItemDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:356` |
| `items[].bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:344` |
| `items[].startAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:345` |
| `items[].endAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:346` |
| `items[].statusCode` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:348` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:349` |
| `items[].patientName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:351` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:357` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rango tiene que ser positivo y de {MAX_AGENDA_DAYS} días como mucho |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /me/support-catalog

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Catálogo de un hospital para armar el pedido.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.catalog` — `src/modules/delegated_access/controllers/support-staff.controller.ts:89`

### Qué es y para qué sirve (negocio)

Catálogo de un hospital para armar el pedido. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-catalog` la atiende `SupportStaffController.catalog` (src/modules/delegated_access/controllers/support-staff.controller.ts:89). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.catalogForSupport`. Lee directory.tenants, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.person_account_links, profiles.persons y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:89` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:89` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:324` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:487` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:475` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:460` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:460` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:501` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:247` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:501` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:247` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `SupportCatalogQueryDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportCatalogResponseDto>` · DTO `SupportCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:294` |
| `sites` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:296` |
| `sites[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `sites[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `sites[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `sites[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `sites[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |
| `services` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:298` |
| `services[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `services[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `services[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `services[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `services[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |
| `floors` | `array<SupportCatalogEntryDto>` | Sí | — | — | Pisos. | `src/modules/delegated_access/dto/support-staff.dto.ts:300` |
| `floors[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `floors[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `floors[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `floors[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `floors[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |
| `practitioners` | `array<SupportCatalogEntryDto>` | Sí | — | — | Doctores: `id` es su vinculación con el hospital. | `src/modules/delegated_access/dto/support-staff.dto.ts:305` |
| `practitioners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `practitioners[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `practitioners[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `practitioners[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `practitioners[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /me/support-engagements

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Sus vínculos y, aparte, los pendientes.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.mine` — `src/modules/delegated_access/controllers/support-staff.controller.ts:65`

### Qué es y para qué sirve (negocio)

Sus vínculos y, aparte, los pendientes. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-engagements` la atiende `SupportStaffController.mine` (src/modules/delegated_access/controllers/support-staff.controller.ts:65). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.listMine`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:65` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:65` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MySupportEngagementsResponseDto>` · DTO `MySupportEngagementsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:255` |
| `requests` | `array<SupportLinkViewDto>` | Sí | — | — | Los vínculos todavía PENDING (pedidos o invitaciones). | `src/modules/delegated_access/dto/support-staff.dto.ts:260` |
| `requests[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `requests[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `requests[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `requests[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `requests[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `requests[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `requests[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `requests[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `requests[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `requests[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `requests[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `requests[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `requests[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `requests[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `requests[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `requests[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `requests[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /me/support-engagements/{id}/confirm

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Acepta una invitación del hospital o de un doctor.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.confirm` — `src/modules/delegated_access/controllers/support-staff.controller.ts:125`

### Qué es y para qué sirve (negocio)

Acepta una invitación del hospital o de un doctor. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-engagements/{id}/confirm` la atiende `SupportStaffController.confirm` (src/modules/delegated_access/controllers/support-staff.controller.ts:125). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.confirmMine`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:125` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:125` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:125` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:655` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /me/support-engagements/{id}/decline

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Rechaza una invitación.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.decline` — `src/modules/delegated_access/controllers/support-staff.controller.ts:143`

### Qué es y para qué sirve (negocio)

Rechaza una invitación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-engagements/{id}/decline` la atiende `SupportStaffController.decline` (src/modules/delegated_access/controllers/support-staff.controller.ts:143). Exige sesión con alguno de los roles SUPPORT_STAFF. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.declineMine`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:143` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:143` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:143` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:655` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo, para el registro. No se guarda en la base. | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /me/support-engagements/{id}/leave

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Deja un vínculo o retira un pedido propio.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.leave` — `src/modules/delegated_access/controllers/support-staff.controller.ts:162`

### Qué es y para qué sirve (negocio)

Deja un vínculo o retira un pedido propio. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-engagements/{id}/leave` la atiende `SupportStaffController.leave` (src/modules/delegated_access/controllers/support-staff.controller.ts:162). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.leaveMine`. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:162` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:162` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:162` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:685` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se termina un vínculo activo o pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /org/{tenantMembershipId}/user-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar usuario de organización con alcance y vigencia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.create` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39`

### Qué es y para qué sirve (negocio)

Asignar usuario de organización con alcance y vigencia. Caso de uso UC-29-01: Asignar usuario de organización (scoped, vigente). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:89`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/{tenantMembershipId}/user-assignments` la atiende `OrgUserAssignmentsController.create` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOrgUserAssignmentDto` (11 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.createAssignment`. Crea filas en delegated_access.organization_user_assignments. Lee delegated_access.organization_user_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantMembershipId | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

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

## 22. GET /org/support-catalog

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Catálogo del hospital activo, para invitar.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.orgCatalog` — `src/modules/delegated_access/controllers/support-staff.controller.ts:196`

### Qué es y para qué sirve (negocio)

Catálogo del hospital activo, para invitar. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-catalog` la atiende `SupportStaffController.orgCatalog` (src/modules/delegated_access/controllers/support-staff.controller.ts:196). Exige sesión; el controlador no declara roles. Delega en `SupportStaffService.catalogForOrganization`. Lee directory.tenant_memberships, directory.tenants, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.assertOrganizationAdmin → SupportLinksRepository.isOrganizationAdmin | `src/modules/delegated_access/repositories/support-links.repository.ts:297` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:324` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:487` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:475` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:460` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:460` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:501` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:501` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportCatalogResponseDto>` · DTO `SupportCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:294` |
| `sites` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:296` |
| `sites[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `sites[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `sites[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `sites[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `sites[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |
| `services` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:298` |
| `services[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `services[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `services[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `services[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `services[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |
| `floors` | `array<SupportCatalogEntryDto>` | Sí | — | — | Pisos. | `src/modules/delegated_access/dto/support-staff.dto.ts:300` |
| `floors[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `floors[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `floors[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `floors[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `floors[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |
| `practitioners` | `array<SupportCatalogEntryDto>` | Sí | — | — | Doctores: `id` es su vinculación con el hospital. | `src/modules/delegated_access/dto/support-staff.dto.ts:305` |
| `practitioners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `practitioners[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:281` |
| `practitioners[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:283` |
| `practitioners[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `practitioners[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:287` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /org/support-engagement-requests

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Bandeja del hospital: vínculos en un estado (por defecto pendientes).
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.orgRequests` — `src/modules/delegated_access/controllers/support-staff.controller.ts:205`

### Qué es y para qué sirve (negocio)

Bandeja del hospital: vínculos en un estado (por defecto pendientes). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-engagement-requests` la atiende `SupportStaffController.orgRequests` (src/modules/delegated_access/controllers/support-staff.controller.ts:205). Exige sesión; el controlador no declara roles. Delega en `SupportStaffService.listForOrganization`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:205` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `ListSupportRequestsQueryDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkListDto>` · DTO `SupportLinkListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:265` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:266` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:267` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /org/support-engagement-requests/{id}/decision

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** El hospital acepta o rechaza lo que pidió una secretaria.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.decide` — `src/modules/delegated_access/controllers/support-staff.controller.ts:224`

### Qué es y para qué sirve (negocio)

El hospital acepta o rechaza lo que pidió una secretaria. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagement-requests/{id}/decision` la atiende `SupportStaffController.decide` (src/modules/delegated_access/controllers/support-staff.controller.ts:224). Exige sesión; el controlador no declara roles. Valida el cuerpo como `DecideSupportLinkDto` (2 campos, 1 obligatorio). Delega en `SupportStaffService.decideForOrganization`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:224` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:224` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:655` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideSupportLinkDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | Aceptar o rechazar. | `src/modules/delegated_access/dto/support-staff.dto.ts:150` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo, para el registro. No se guarda en la base. | `src/modules/delegated_access/dto/support-staff.dto.ts:157` |

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
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. GET /org/support-engagements

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Personal de apoyo del hospital (vínculos activos y pendientes).
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.orgEngagements` — `src/modules/delegated_access/controllers/support-staff.controller.ts:246`

### Qué es y para qué sirve (negocio)

Personal de apoyo del hospital (vínculos activos y pendientes). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-engagements` la atiende `SupportStaffController.orgEngagements` (src/modules/delegated_access/controllers/support-staff.controller.ts:246). Exige sesión; el controlador no declara roles. Delega en `SupportStaffService.listEngagementsForOrganization`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:246` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkListDto>` · DTO `SupportLinkListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:265` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:266` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:267` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /org/support-engagements/{id}/end

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** El hospital termina un vínculo o retira una invitación.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.end` — `src/modules/delegated_access/controllers/support-staff.controller.ts:258`

### Qué es y para qué sirve (negocio)

El hospital termina un vínculo o retira una invitación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagements/{id}/end` la atiende `SupportStaffController.end` (src/modules/delegated_access/controllers/support-staff.controller.ts:258). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.endForOrganization`. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:258` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:258` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:685` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo, para el registro. No se guarda en la base. | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /org/team/invitations

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** El hospital invita a una secretaria registrada (por su documento).
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.invite` — `src/modules/delegated_access/controllers/support-staff.controller.ts:275`

### Qué es y para qué sirve (negocio)

El hospital invita a una secretaria registrada (por su documento). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/team/invitations` la atiende `SupportStaffController.invite` (src/modules/delegated_access/controllers/support-staff.controller.ts:275). Exige sesión; el controlador no declara roles. Valida el cuerpo como `InviteSupportStaffDto` (7 campos, 3 obligatorios). Delega en `SupportStaffService.inviteForOrganization`. Crea filas en delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practitioner_support_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.authentication_credentials, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:275` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/support-staff.controller.ts:275` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.createLocationLink | `src/modules/delegated_access/repositories/support-links.repository.ts:704` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:607` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:324` |
| `iam.authentication_credentials` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:271` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | DIRECTA | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.createPractitionerLink | `src/modules/delegated_access/repositories/support-links.repository.ts:730` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:271` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:271` |

### Cuerpo — DTO `InviteSupportStaffDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime NATIONAL_ID_PATTERN | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(NATIONAL_ID_PATTERN, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad con el que la secretaria inicia sesión. | `src/modules/delegated_access/dto/support-staff.dto.ts:115` |
| `items` | `array<SupportTargetDto>` | Sí | mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => SupportTargetDto)` | Lo que se le ofrece. | `src/modules/delegated_access/dto/support-staff.dto.ts:124` |
| `items[].targetKind` | `object` | Sí | — | `@IsIn(SUPPORT_TARGET_KINDS)` | Qué nombra el vínculo. | `src/modules/delegated_access/dto/support-staff.dto.ts:42` |
| `items[].practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede (`targetKind: SITE`). | `src/modules/delegated_access/dto/support-staff.dto.ts:48` |
| `items[].clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio / unidad clínica (`targetKind: SERVICE`). | `src/modules/delegated_access/dto/support-staff.dto.ts:54` |
| `items[].careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Piso u otro espacio (`targetKind: SPACE`). | `src/modules/delegated_access/dto/support-staff.dto.ts:60` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vinculación del doctor con el hospital (`targetKind: PRACTITIONER`). | `src/modules/delegated_access/dto/support-staff.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": {}
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": {},
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<SupportLinksCreatedDto>` · DTO `SupportLinksCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del primer vínculo creado. | `src/modules/delegated_access/dto/support-staff.dto.ts:273` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:274` |
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:275` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay una secretaria registrada con ese documento; ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. PATCH /org/user-assignments/{id}

- **Origen:** CONTRATO
- **Nombre:** Reasignar supervisor / suspender asignación de organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.update` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59`

### Qué es y para qué sirve (negocio)

Reasignar supervisor / suspender asignación de organización. Caso de uso UC-29-10: Reasignar supervisor / suspender (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:99`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /org/user-assignments/{id}` la atiende `OrgUserAssignmentsController.update` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateOrgUserAssignmentDto` (4 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.updateAssignment`. Actualiza delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.organization_user_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

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
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:103` |
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

## 29. POST /practitioner-delegates

- **Origen:** CONTRATO
- **Nombre:** Crear asignación de delegado de practitioner
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.create` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51`

### Qué es y para qué sirve (negocio)

Crear asignación de delegado de practitioner. Caso de uso UC-29-03: Crear delegación de practitioner. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:92`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates` la atiende `PractitionerDelegatesController.create` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerDelegateDto` (10 campos, 3 obligatorios). Delega en `PractitionerDelegatesService.createDelegate`. Crea filas en delegated_access.delegation_events, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_permission_sets, delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadSetInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadOrgAssignmentInTenant → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:84` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:90` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadOrgAssignmentInTenant → DelegationScopeService.membershipOfAssignment → DelegationScopeRepository.membershipOf | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:46` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.assertRoleAssignmentInTenant → DelegationScopeRepository.roleAssignmentTenant | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:69` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.assertRoleAssignmentInTenant → DelegationScopeRepository.roleAssignmentTenant | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:65` |

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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El usuario de organización no está activo; PreconditionFailedException: El set de permisos no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:40` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-03`

---

## 30. POST /practitioner-delegates/{id}/accept

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Acepta a la secretaria que pidió asistirlo.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.accept` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:61`

### Qué es y para qué sirve (negocio)

Acepta a la secretaria que pidió asistirlo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/accept` la atiende `PractitionerSupportController.accept` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:61). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SupportStaffService.acceptForPractitioner`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:61` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:61` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:61` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:655` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /practitioner-delegates/{id}/access-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar acceso delegado (aprobación previa)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.requestAccess` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68`

### Qué es y para qué sirve (negocio)

Solicitar acceso delegado (aprobación previa). Caso de uso UC-29-04: Solicitar acceso delegado (aprobación previa). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:93`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/access-requests` la atiende `PractitionerDelegatesController.requestAccess` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccessRequestDto` (4 campos, 1 obligatorio). Delega en `AccessRequestsService.requestAccess`. Crea filas en delegated_access.delegated_access_approval_requests, delegated_access.delegation_events. Lee delegated_access.delegated_access_approval_requests, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

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

## 32. POST /practitioner-delegates/{id}/grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar grant delegado por-propósito y temporal
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.issueGrant` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86`

### Qué es y para qué sirve (negocio)

Otorgar grant delegado por-propósito y temporal. Caso de uso UC-29-06: Grant pre-autorizado por-propósito y temporal. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:95`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/grants` la atiende `PractitionerDelegatesController.issueGrant` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateGrantDto` (6 campos, 2 obligatorios). Delega en `PractitionerDelegatesService.issueGrant`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Lee clinical.encounters, delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:84` |
| `delegated_access.delegated_access_grants` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegatedAccessGrantsRepository.create | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:79` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:104` |

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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:58` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-06`

---

## 33. POST /practitioner-delegates/{id}/reject

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Rechaza a la secretaria que pidió asistirlo.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.reject` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:79`

### Qué es y para qué sirve (negocio)

Rechaza a la secretaria que pidió asistirlo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/reject` la atiende `PractitionerSupportController.reject` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:79). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.rejectForPractitioner`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:79` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:79` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:79` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:761` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:655` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:678` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:762` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo, para el registro. No se guarda en la base. | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /practitioner-delegates/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar delegación de forma inmediata (cascada authz)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.revoke` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104`

### Qué es y para qué sirve (negocio)

Revocar delegación de forma inmediata (cascada authz). Caso de uso UC-29-07: Revocar delegación inmediata (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:96`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/revoke` la atiende `PractitionerDelegatesController.revoke` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RevokeDelegationDto` (1 campo, 0 obligatorios). Delega en `PractitionerDelegatesService.revoke`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests, delegated_access.delegated_access_grants. Lee delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessApprovalRequestsRepository.cancelOpenByAssignment | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:107` |
| `delegated_access.delegated_access_grants` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessGrantsRepository.revokeActiveByAssignment | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:130` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |

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
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:103` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:68` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-07`

---

## 35. GET /public/prescription-shares/{token}

- **Origen:** CONTRATO
- **Nombre:** Comprobar un enlace de receta compartida
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesPublicController.read` — `src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39`

### Qué es y para qué sirve (negocio)

Comprobar un enlace de receta compartida. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /public/prescription-shares/{token}` la atiende `PrescriptionSharesPublicController.read` (src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39). Es una ruta pública: no exige token. Delega en `PrescriptionSharesService.readPublic`. Crea filas en delegated_access.shared_access_link_uses. Lee clinical.medication_requests, delegated_access.shared_access_links, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39` |
| CABECERA | user-agent (obligatoria) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT) | `src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.resolve → SharedAccessLinksRepository.findItemsByEncounter | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:215` |
| `delegated_access.shared_access_link_uses` | ESCRIBE | CREA | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.recordUse → SharedAccessLinksRepository.appendUse | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:189` |
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.resolve → PrescriptionSharesService.findByToken → SharedAccessLinksRepository.findByTokenHash | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:98` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.prescriberOf → PrescriberIdentityReader.read → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.prescriberOf → PrescriberIdentityReader.read → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.persons` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.prescriberOf → PrescriberIdentityReader.read → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `token` | path | Sí | `string` | — |
| `user-agent` | header | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicPrescriptionShareDto>` · DTO `PublicPrescriptionShareDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: VALID, EXPIRED, REVOKED | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:117` |
| `issuedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:121` |
| `prescriberName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:124` |
| `prescriberLicense` | `PrescriberLicenseDto` | No | admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:127` |
| `prescriberLicense.number` | `string` | No | — | — | — | sin fuente |
| `prescriberLicense.authority` | `object` | No | admite null | — | — | sin fuente |
| `prescriberLicense.state` | `string` | No | valores: ACTIVE, PENDING | — | — | sin fuente |
| `itemCount` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:131` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares-public.controller.spec.ts:67` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /support-engagement-requests

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** La secretaria pide entrar a un hospital o asistir a sus doctores.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.request` — `src/modules/delegated_access/controllers/support-staff.controller.ts:103`

### Qué es y para qué sirve (negocio)

La secretaria pide entrar a un hospital o asistir a sus doctores. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /support-engagement-requests` la atiende `SupportStaffController.request` (src/modules/delegated_access/controllers/support-staff.controller.ts:103). Exige sesión con alguno de los roles SUPPORT_STAFF. Valida el cuerpo como `CreateEngagementRequestDto` (9 campos, 3 obligatorios). Delega en `SupportStaffService.request`. Crea filas en delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practitioner_support_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:103` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:103` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/support-staff.controller.ts:103` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.createLocationLink | `src/modules/delegated_access/repositories/support-links.repository.ts:704` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:619` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:607` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:324` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | DIRECTA | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.createPractitionerLink | `src/modules/delegated_access/repositories/support-links.repository.ts:730` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:247` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:146` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:247` |

### Cuerpo — DTO `CreateEngagementRequestDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Hospital al que pide entrar. | `src/modules/delegated_access/dto/support-staff.dto.ts:74` |
| `roleTemplateCode` | `string` | No | valores: SECRETARY | `@IsOptional()` `@IsIn(['SECRETARY'])` | Rol de apoyo. Hoy sólo existe la secretaria; se acepta para no romper al cliente del PR #1175, que lo mandaba siempre. | `src/modules/delegated_access/dto/support-staff.dto.ts:83` |
| `message` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Mensaje para quien decide. No se guarda en la base. | `src/modules/delegated_access/dto/support-staff.dto.ts:90` |
| `items` | `array<SupportTargetDto>` | Sí | mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => SupportTargetDto)` | Lo que pide: hospital, sedes, servicios, pisos y doctores. | `src/modules/delegated_access/dto/support-staff.dto.ts:99` |
| `items[].targetKind` | `object` | Sí | — | `@IsIn(SUPPORT_TARGET_KINDS)` | Qué nombra el vínculo. | `src/modules/delegated_access/dto/support-staff.dto.ts:42` |
| `items[].practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede (`targetKind: SITE`). | `src/modules/delegated_access/dto/support-staff.dto.ts:48` |
| `items[].clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio / unidad clínica (`targetKind: SERVICE`). | `src/modules/delegated_access/dto/support-staff.dto.ts:54` |
| `items[].careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Piso u otro espacio (`targetKind: SPACE`). | `src/modules/delegated_access/dto/support-staff.dto.ts:60` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vinculación del doctor con el hospital (`targetKind: PRACTITIONER`). | `src/modules/delegated_access/dto/support-staff.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": {}
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "roleTemplateCode": "SECRETARY",
  "message": "valor-ejemplo",
  "items": [
    {
      "targetKind": {},
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<SupportLinksCreatedDto>` · DTO `SupportLinksCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del primer vínculo creado. | `src/modules/delegated_access/dto/support-staff.dto.ts:273` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:274` |
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:275` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | Sí | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:226` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:232` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:234` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:236` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:238` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:240` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:242` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:248` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

