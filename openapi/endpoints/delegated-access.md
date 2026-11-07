<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `delegated_access`

Referencia exhaustiva de 45 operación(es) del módulo `delegated_access`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `clinical-prescription-shares`, `clinical-prescription-shares-public`, `delegated-access-affiliation-invitations`, `delegated-access-authz`, `delegated-access-governance`, `delegated-access-org`, `delegated-access-permission-sets`, `delegated-access-practitioner-delegates`, `delegated-access-requests`, `delegated-access-support-staff`
- **Controladores:** `AccessRequestsController`, `AffiliationInvitationsController`, `DelegatedAccessAuthzController`, `DelegatedPermissionSetsController`, `OrgSupportStaffProvisioningController`, `OrgUserAssignmentsController`, `PractitionerDelegatesController`, `PractitionerGovernanceController`, `PractitionerSupportController`, `PrescriptionSharesController`, `PrescriptionSharesPublicController`, `SupportStaffController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /access-requests/{id}/decision](#1-post-access-requests-id-decision) — Aprobar/Denegar solicitud y emitir grant scoped
2. [POST /affiliation-invitations/redeem](#2-post-affiliation-invitations-redeem) — Canjear un código o QR de afiliación
3. [GET /approvals/pending](#3-get-approvals-pending) — Aprobaciones que espera mi decisión
4. [POST /authz/effective-actor/evaluate](#4-post-authz-effective-actor-evaluate) — Evaluar actor efectivo por propósito (step-up)
5. [GET /clinical/prescription-shares](#5-get-clinical-prescription-shares) — Enlaces de receta de un paciente
6. [POST /clinical/prescription-shares](#6-post-clinical-prescription-shares) — Compartir una receta con un enlace
7. [POST /clinical/prescription-shares/{shareId}/revoke](#7-post-clinical-prescription-shares-shareid-revoke) — Revocar un enlace de receta
8. [GET /clinical/prescription-shares/by-token/{token}](#8-get-clinical-prescription-shares-by-token-token) — Saber si un enlace es de la sesión
9. [POST /delegated-access/expiry-sweep](#9-post-delegated-access-expiry-sweep) — Expirar delegaciones y grants vencidos (barrido)
10. [GET /delegated-permission-sets](#10-get-delegated-permission-sets) — Listar los sets de permisos delegados del tenant
11. [POST /delegated-permission-sets](#11-post-delegated-permission-sets) — Publicar set de permisos delegados (scoped)
12. [POST /delegated-permission-sets/{id}/versions](#12-post-delegated-permission-sets-id-versions) — Versionar set de permisos delegados
13. [GET /me/practitioner/governance-panel](#13-get-me-practitioner-governance-panel) — Panel «Para su atención» del doctor
14. [GET /me/practitioner/support-activity](#14-get-me-practitioner-support-activity) — Actividad de mi equipo de apoyo
15. [POST /me/practitioner/support-invitations](#15-post-me-practitioner-support-invitations) — Invitar a una secretaria a asistirme
16. [POST /me/practitioner/support-staff](#16-post-me-practitioner-support-staff) — Crear cuenta de secretaria y vincularla de inmediato
17. [GET /me/practitioner/support-team](#17-get-me-practitioner-support-team) — Mi equipo de apoyo (secretarias)
18. [POST /me/practitioner/support-team/{id}/end](#18-post-me-practitioner-support-team-id-end) — Terminar el vínculo con una secretaria
19. [GET /me/support-access](#19-get-me-support-access) — Mi alcance: hospitales, doctores y pisos de mis vínculos activos
20. [GET /me/support-agenda](#20-get-me-support-agenda) — Agenda de un doctor asignado (403 si no hay vínculo activo)
21. [GET /me/support-catalog](#21-get-me-support-catalog) — Sedes, servicios, pisos y doctores de un hospital para pedir
22. [GET /me/support-engagements](#22-get-me-support-engagements) — Mis vínculos de apoyo y mis solicitudes
23. [POST /me/support-engagements/{id}/confirm](#23-post-me-support-engagements-id-confirm) — Aceptar una invitación de apoyo
24. [POST /me/support-engagements/{id}/decline](#24-post-me-support-engagements-id-decline) — Rechazar una invitación de apoyo
25. [POST /me/support-engagements/{id}/leave](#25-post-me-support-engagements-id-leave) — Dejar un vínculo o retirar mi pedido
26. [POST /org/{tenantMembershipId}/user-assignments](#26-post-org-tenantmembershipid-user-assignments) — Asignar usuario de organización con alcance y vigencia
27. [GET /org/affiliation-invitations](#27-get-org-affiliation-invitations) — Listar los códigos de afiliación de la organización
28. [POST /org/affiliation-invitations](#28-post-org-affiliation-invitations) — Crear un código o QR de afiliación
29. [POST /org/affiliation-invitations/{id}/revoke](#29-post-org-affiliation-invitations-id-revoke) — Revocar un código o QR de afiliación
30. [GET /org/support-catalog](#30-get-org-support-catalog) — Sedes, servicios, pisos y doctores para invitar
31. [GET /org/support-engagement-requests](#31-get-org-support-engagement-requests) — Solicitudes e invitaciones de apoyo del hospital
32. [POST /org/support-engagement-requests/{id}/decision](#32-post-org-support-engagement-requests-id-decision) — Aceptar o rechazar una solicitud de apoyo
33. [GET /org/support-engagements](#33-get-org-support-engagements) — Personal de apoyo del hospital
34. [POST /org/support-engagements/{id}/end](#34-post-org-support-engagements-id-end) — Terminar un vínculo de apoyo
35. [POST /org/support-staff](#35-post-org-support-staff) — Crear cuenta de secretaria y vincularla a la organización de inmediato
36. [POST /org/team/invitations](#36-post-org-team-invitations) — Invitar a una secretaria a lugares o doctores
37. [PATCH /org/user-assignments/{id}](#37-patch-org-user-assignments-id) — Reasignar supervisor / suspender asignación de organización
38. [POST /practitioner-delegates](#38-post-practitioner-delegates) — Crear asignación de delegado de practitioner
39. [POST /practitioner-delegates/{id}/accept](#39-post-practitioner-delegates-id-accept) — Aceptar a una secretaria
40. [POST /practitioner-delegates/{id}/access-requests](#40-post-practitioner-delegates-id-access-requests) — Solicitar acceso delegado (aprobación previa)
41. [POST /practitioner-delegates/{id}/grants](#41-post-practitioner-delegates-id-grants) — Otorgar grant delegado por-propósito y temporal
42. [POST /practitioner-delegates/{id}/reject](#42-post-practitioner-delegates-id-reject) — Rechazar a una secretaria
43. [POST /practitioner-delegates/{id}/revoke](#43-post-practitioner-delegates-id-revoke) — Revocar delegación de forma inmediata (cascada authz)
44. [GET /public/prescription-shares/{token}](#44-get-public-prescription-shares-token) — Comprobar un enlace de receta compartida
45. [POST /support-engagement-requests](#45-post-support-engagement-requests) — Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor)

---

## 1. POST /access-requests/{id}/decision

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-requests`
- **Nombre:** Aprobar/Denegar solicitud y emitir grant scoped
- **Operation ID:** `AccessRequestsController_decide`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccessRequestsController.decide](../../src/modules/delegated_access/controllers/access-requests.controller.ts)

### Descripción de negocio

Aprobar/Denegar solicitud y emitir grant scoped. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /access-requests/{id}/decision` en `AccessRequestsController_decide`. El controlador delega en `AccessRequestsService.decide`. Valida el body como `DecideAccessRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<DecisionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DecideAccessRequestDto`; los campos opcionales se omiten.

```http
POST /access-requests/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `APPROVED`, `DENIED` | Decisión del aprobador | `APPROVED` |
| `purpose` | No | `string` | valores: `TREATMENT`, `BILLING`, `OPERATIONS` | Propósito de uso del grant emitido | `TREATMENT` |
| `resourceType` | No | `string` | valores: `CLINICAL_NOTE`, `APPOINTMENT`, `PRESCRIPTION` | Tipo de recurso del grant | `CLINICAL_NOTE` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia del grant (ISO) | `2026-07-31T12:00:00.000Z` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro del grant | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /access-requests/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "purpose": "TREATMENT",
  "resourceType": "CLINICAL_NOTE",
  "validTo": "2026-07-31T12:00:00.000Z",
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DecisionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DecisionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "requestId": "00000000-0000-4000-8000-000000000001",
  "decision": "valor-ejemplo",
  "grantId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requestId` | Sí | `string` | formato `uuid` | Solicitud decidida | `00000000-0000-4000-8000-000000000001` |
| `decision` | Sí | `string` | Sin restricción adicional declarada | Decisión aplicada (APPROVED\|DENIED) | `valor-ejemplo` |
| `grantId` | No | `string` | formato `uuid` | Grant emitido si fue aprobada | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud no está abierta | Excepción explícita en src/modules/delegated_access/services/access-requests.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/access-requests/{id}/decision"
}
```

---

## 2. POST /affiliation-invitations/redeem

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-affiliation-invitations`
- **Nombre:** Canjear un código o QR de afiliación
- **Operation ID:** `AffiliationInvitationsController_redeem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AffiliationInvitationsController.redeem](../../src/modules/delegated_access/controllers/affiliation-invitations.controller.ts)

### Descripción de negocio

Canjear un código o QR de afiliación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: No active tenant: the person does not belong to the inviting organization yet.

### Descripción del sistema

NestJS resuelve `POST /affiliation-invitations/redeem` en `AffiliationInvitationsController_redeem`. El controlador delega en `RedeemAffiliationInvitationService.redeem`. Valida el body como `RedeemAffiliationInvitationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AffiliationRedeemResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RedeemAffiliationInvitationDto`; los campos opcionales se omiten.

```http
POST /affiliation-invitations/redeem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `SUPPORT_STAFF`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /affiliation-invitations/redeem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AffiliationRedeemResultDto>` | No |

El controlador declara `AffiliationRedeemResultDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/application/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | Objetivo no encontrado en esa organización | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/profiles/application/services/profiles-practitioners.service.ts |
| 404 | `NOT_FOUND` | La sede indicada no existe | Excepción explícita en src/modules/profiles/application/services/profiles-affiliations.service.ts |
| 409 | `CONFLICT` | Ya hay un vínculo vivo con ese mismo objetivo | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 409 | `CONFLICT` | Ese vínculo ya está en el historial laboral | Excepción explícita en src/modules/profiles/application/services/profiles-practitioners.service.ts |
| 409 | `CONFLICT` | Ese vínculo con el establecimiento ya está en el historial laboral | Excepción explícita en src/modules/profiles/application/services/profiles-practitioners.service.ts |
| 409 | `CONFLICT` | Ya pidió vincularse a esa sede | Excepción explícita en src/modules/profiles/application/services/profiles-practitioners.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objetivo ${item.targetKind} exige ${field} | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 422 | `PRECONDITION_FAILED` | El fin del vínculo no puede ser anterior a su inicio | Excepción explícita en src/modules/profiles/application/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | El padrón de establecimientos no está disponible | Excepción explícita en src/modules/profiles/application/services/health-facility-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El establecimiento no pertenece al padrón oficial de establecimientos de salud | Excepción explícita en src/modules/profiles/application/services/health-facility-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/affiliation-invitations/redeem"
}
```

---

## 3. GET /approvals/pending

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-governance`
- **Nombre:** Aprobaciones que espera mi decisión
- **Operation ID:** `PractitionerGovernanceController_pending`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerGovernanceController.pending](../../src/modules/delegated_access/controllers/practitioner-governance.controller.ts)

### Descripción de negocio

Aprobaciones que espera mi decisión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Aprobaciones de cuatro ojos que el doctor puede decidir.

### Descripción del sistema

NestJS resuelve `GET /approvals/pending` en `PractitionerGovernanceController_pending`. El controlador delega en `PractitionerGovernanceService.pendingApprovals`. No recibe body. El tipo de retorno estático es `Promise<PendingApprovalsPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | `nextCursor` de la página anterior. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /approvals/pending HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /approvals/pending?limit=50&cursor=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingApprovalsPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PendingApprovalsPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingApprovalsPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingApprovalsPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingApprovalsPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingApprovalsPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PendingApprovalsPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingApprovalsPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "kind": "valor-ejemplo",
      "status": "PENDING",
      "approverKind": "DOCTOR_OWNER",
      "atom": "valor-ejemplo",
      "requesterUserId": "00000000-0000-4000-8000-000000000001",
      "subjectUserId": "00000000-0000-4000-8000-000000000001",
      "reasonText": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "expiresAt": "2026-07-31T12:00:00.000Z",
      "summary": "valor-ejemplo"
    }
  ],
  "count": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PendingApprovalDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001","kind":"valor-ejemplo","status":"PENDING","approverKind":"DOCTOR_OWNER","atom":"valor-ejemplo","requesterUserId":"00000000-0000-4000-8000-000000000001","subjectUserId":"00000000-0000-4000-8000-000000000001","reasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z","expiresAt":"2026-07-31T12:00:00.000Z","summary":"valor-ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | Sin restricción adicional declarada | ACTION, GRANT_CHANGE, SOD_EXCEPTION… | `valor-ejemplo` |
| `items[].status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].approverKind` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `DOCTOR_OWNER` |
| `items[].atom` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].requesterUserId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].subjectUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reasonText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].expiresAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].summary` | Sí | `string` | Sin restricción adicional declarada | Qué se pide, en lenguaje simple. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/approvals/pending"
}
```

---

## 4. POST /authz/effective-actor/evaluate

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-authz`
- **Nombre:** Evaluar actor efectivo por propósito (step-up)
- **Operation ID:** `DelegatedAccessAuthzController_evaluate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DelegatedAccessAuthzController.evaluate](../../src/modules/delegated_access/controllers/delegated-access-authz.controller.ts)

### Descripción de negocio

Evaluar actor efectivo por propósito (step-up). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-29-09: evaluación en línea del actor efectivo.

### Descripción del sistema

NestJS resuelve `POST /authz/effective-actor/evaluate` en `DelegatedAccessAuthzController_evaluate`. El controlador delega en `DelegatedAccessEvaluationService.evaluate`. Valida el body como `EvaluateActorDto` y consume `application/json`. El tipo de retorno estático es `Promise<EvaluationResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EvaluateActorDto`; los campos opcionales se omiten.

```http
POST /authz/effective-actor/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerDelegateAssignmentId": "00000000-0000-4000-8000-000000000001",
  "purpose": "TREATMENT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerDelegateAssignmentId` | Sí | `string` | formato `uuid` | Delegación a evaluar | `00000000-0000-4000-8000-000000000001` |
| `effectiveUserId` | No | `string` | formato `uuid` | Usuario que ejercería el acceso. Si se omite se evalúa al usuario autenticado. Tiene que ser el titular de la asignación del delegado; si no, el acceso no se permite | `00000000-0000-4000-8000-000000000001` |
| `purpose` | Sí | `string` | valores: `TREATMENT`, `BILLING`, `OPERATIONS` | Propósito de uso del acceso | `TREATMENT` |
| `permissionId` | No | `string` | formato `uuid` | Permiso concreto que se ejerce | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente sobre el que se accede | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro sobre el que se accede | `00000000-0000-4000-8000-000000000001` |
| `resourceType` | No | `string` | valores: `CLINICAL_NOTE`, `APPOINTMENT`, `PRESCRIPTION` | Tipo de recurso | `CLINICAL_NOTE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/effective-actor/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<EvaluationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvaluationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "allowed": true,
  "requiresStepUp": true,
  "reason": "Texto descriptivo de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `allowed` | Sí | `boolean` | Sin restricción adicional declarada | Si el acceso está permitido | `true` |
| `requiresStepUp` | Sí | `boolean` | Sin restricción adicional declarada | Si exige step-up antes de permitir | `true` |
| `reason` | No | `string` | Sin restricción adicional declarada | Motivo cuando no se permite | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/effective-actor/evaluate"
}
```

---

## 5. GET /clinical/prescription-shares

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `clinical-prescription-shares`
- **Nombre:** Enlaces de receta de un paciente
- **Operation ID:** `PrescriptionSharesController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrescriptionSharesController.list](../../src/modules/delegated_access/controllers/prescription-shares.controller.ts)

### Descripción de negocio

El paciente ve los suyos; una médica, los que creó para ese paciente. Sin token.


### Descripción del sistema

NestJS resuelve `GET /clinical/prescription-shares` en `PrescriptionSharesController_list`. El controlador delega en `PrescriptionSharesService.listForPatient`. No recibe body. El tipo de retorno estático es `Promise<PrescriptionShareSummaryDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /clinical/prescription-shares?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /clinical/prescription-shares?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PrescriptionShareSummaryDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PrescriptionShareSummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PrescriptionShareSummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PrescriptionShareSummaryDto[]>` | No |
| 404 | Es otro paciente | `Promise<PrescriptionShareSummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PrescriptionShareSummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PrescriptionShareSummaryDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<PrescriptionShareSummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionShareSummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "shareId": "00000000-0000-4000-8000-000000000001",
    "resourceType": "PRESCRIPTION_ENCOUNTER",
    "resourceId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "expiresAt": "2026-07-31T12:00:00.000Z",
    "status": "VALID",
    "endedReason": "LINK_EXPIRED",
    "uses": 1
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/delegated_access/services/prescription-shares.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/prescription-shares"
}
```

---

## 6. POST /clinical/prescription-shares

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `clinical-prescription-shares`
- **Nombre:** Compartir una receta con un enlace
- **Operation ID:** `PrescriptionSharesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrescriptionSharesController.create](../../src/modules/delegated_access/controllers/prescription-shares.controller.ts)

### Descripción de negocio

Exactamente uno de `encounterId` o `medicationRequestId`. Devuelve el token en claro una sola vez.


### Descripción del sistema

NestJS resuelve `POST /clinical/prescription-shares` en `PrescriptionSharesController_create`. El controlador delega en `PrescriptionSharesService.create`. Valida el body como `CreatePrescriptionShareDto` y consume `application/json`. El tipo de retorno estático es `Promise<PrescriptionShareCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePrescriptionShareDto`; los campos opcionales se omiten.

```http
POST /clinical/prescription-shares HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `encounterId` | No | `string` | formato `uuid` | Encuentro de la receta. Excluye a `medicationRequestId`. | `00000000-0000-4000-8000-000000000001` |
| `medicationRequestId` | No | `string` | formato `uuid` | Fármaco suelto. Excluye a `encounterId`. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/prescription-shares HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PrescriptionShareCreatedDto>` | Sí |
| 400 | No vino exactamente uno de los dos ids | `Promise<PrescriptionShareCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PrescriptionShareCreatedDto>` | No |
| 403 | Una médica que no emitió la receta | `Promise<PrescriptionShareCreatedDto>` | No |
| 404 | La receta no existe o es de otro paciente | `Promise<PrescriptionShareCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PrescriptionShareCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PrescriptionShareCreatedDto>` | No |
| 422 | Sin ítems emitidos y vigentes (PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS) | `Promise<PrescriptionShareCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PrescriptionShareCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PrescriptionShareCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PrescriptionShareCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionShareCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "shareId": "00000000-0000-4000-8000-000000000001",
  "url": "valor-ejemplo",
  "token": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "itemCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `shareId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `url` | Sí | `string` | Sin restricción adicional declarada | Enlace para compartir: `<web>/rx/<token>` | `valor-ejemplo` |
| `token` | Sí | `string` | Sin restricción adicional declarada | Token en claro; se devuelve una sola vez | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | {         code: ErrorCode.VALIDATION_FAILED,         message:           'Indicá la consulta o el medicamento que querés compartir, uno de los dos.',         reason,         details: { reason },       } | Excepción explícita en src/modules/delegated_access/services/prescription-shares.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | {         code: ErrorCode.FORBIDDEN,         message:           'Solo el paciente o quien emitió la receta pueden compartirla.',       } | Excepción explícita en src/modules/delegated_access/services/prescription-shares.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La receta no tiene medicamentos emitidos y vigentes para compartir. | Excepción explícita en src/modules/delegated_access/services/prescription-shares.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/prescription-shares"
}
```

---

## 7. POST /clinical/prescription-shares/{shareId}/revoke

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `clinical-prescription-shares`
- **Nombre:** Revocar un enlace de receta
- **Operation ID:** `PrescriptionSharesController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrescriptionSharesController.revoke](../../src/modules/delegated_access/controllers/prescription-shares.controller.ts)

### Descripción de negocio

Solo el paciente dueño o quien lo creó. Revocar uno ya revocado no cambia nada.


### Descripción del sistema

NestJS resuelve `POST /clinical/prescription-shares/{shareId}/revoke` en `PrescriptionSharesController_revoke`. El controlador delega en `PrescriptionSharesService.revoke`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `shareId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /clinical/prescription-shares/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `shareId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /clinical/prescription-shares/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Revocado | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | El enlace no existe o no es suyo | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |
| 504 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/prescription-shares/{shareId}/revoke"
}
```

---

## 8. GET /clinical/prescription-shares/by-token/{token}

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `clinical-prescription-shares`
- **Nombre:** Saber si un enlace es de la sesión
- **Operation ID:** `PrescriptionSharesController_resolveOwnership`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrescriptionSharesController.resolveOwnership](../../src/modules/delegated_access/controllers/prescription-shares.controller.ts)

### Descripción de negocio

200 solo para el paciente dueño o quien lo creó; 404 para cualquier otro. No registra uso.


### Descripción del sistema

NestJS resuelve `GET /clinical/prescription-shares/by-token/{token}` en `PrescriptionSharesController_resolveOwnership`. El controlador delega en `PrescriptionSharesService.resolveOwnership`. No recibe body. El tipo de retorno estático es `Promise<PrescriptionShareOwnershipDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `token` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /clinical/prescription-shares/by-token/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /clinical/prescription-shares/by-token/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PrescriptionShareOwnershipDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PrescriptionShareOwnershipDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PrescriptionShareOwnershipDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PrescriptionShareOwnershipDto>` | No |
| 404 | El enlace no existe o no es suyo | `Promise<PrescriptionShareOwnershipDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PrescriptionShareOwnershipDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PrescriptionShareOwnershipDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PrescriptionShareOwnershipDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionShareOwnershipDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "shareId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PRESCRIPTION_ENCOUNTER",
  "resourceId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `shareId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resourceType` | Sí | `string` | valores: `PRESCRIPTION_ENCOUNTER`, `MEDICATION_REQUEST` | Sin descripción específica en el contrato OpenAPI. | `PRESCRIPTION_ENCOUNTER` |
| `resourceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/prescription-shares/by-token/{token}"
}
```

---

## 9. POST /delegated-access/expiry-sweep

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-authz`
- **Nombre:** Expirar delegaciones y grants vencidos (barrido)
- **Operation ID:** `DelegatedAccessAuthzController_expirySweep`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DelegatedAccessAuthzController.expirySweep](../../src/modules/delegated_access/controllers/delegated-access-authz.controller.ts)

### Descripción de negocio

Expirar delegaciones y grants vencidos (barrido). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-29-08: disparador del worker de expiración (barrido de vencidos).

### Descripción del sistema

NestJS resuelve `POST /delegated-access/expiry-sweep` en `DelegatedAccessAuthzController_expirySweep`. El controlador delega en `DelegatedAccessEvaluationService.expirySweep`. No recibe body. El tipo de retorno estático es `Promise<ExpirySweepResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /delegated-access/expiry-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /delegated-access/expiry-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ExpirySweepResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpirySweepResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "expiredGrants": 1,
  "expiredDelegations": 1,
  "expiredOrgAssignments": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expiredGrants` | Sí | `number` | Sin restricción adicional declarada | Grants expirados | `1` |
| `expiredDelegations` | Sí | `number` | Sin restricción adicional declarada | Delegaciones de practitioner expiradas | `1` |
| `expiredOrgAssignments` | Sí | `number` | Sin restricción adicional declarada | Asignaciones de organización expiradas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/delegated-access/expiry-sweep"
}
```

---

## 10. GET /delegated-permission-sets

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-permission-sets`
- **Nombre:** Listar los sets de permisos delegados del tenant
- **Operation ID:** `DelegatedPermissionSetsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DelegatedPermissionSetsController.list](../../src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts)

### Descripción de negocio

Listar los sets de permisos delegados del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CV-13: listado del hub, acotado al tenant del actor.

### Descripción del sistema

NestJS resuelve `GET /delegated-permission-sets` en `DelegatedPermissionSetsController_list`. El controlador delega en `PermissionSetsService.listByTenant`. No recibe body. El tipo de retorno estático es `Promise<ListPermissionSetsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sets por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /delegated-permission-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /delegated-permission-sets?cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListPermissionSetsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListPermissionSetsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListPermissionSetsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListPermissionSetsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListPermissionSetsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListPermissionSetsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ListPermissionSetsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListPermissionSetsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "delegateTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "versionNumber": 1,
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PermissionSetSummaryDto>` | Sin restricción adicional declarada | Sets de esta página, ordenados por `id`. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","delegateTypeConceptId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","versionNumber":1,"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del set, único dentro del tenant. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre visible del set. | `Nombre de ejemplo` |
| `items[].delegateTypeConceptId` | Sí | `string` | formato `uuid` | Concepto del tipo de delegado al que aplica. | `00000000-0000-4000-8000-000000000001` |
| `items[].description` | No | `string` | Sin restricción adicional declarada | Descripción libre, si se publicó una. | `Texto descriptivo de ejemplo` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Concepto de estado del set. | `00000000-0000-4000-8000-000000000001` |
| `items[].versionNumber` | Sí | `number` | Sin restricción adicional declarada | Versión publicada más reciente. | `1` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha de creación del set. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/delegated-permission-sets"
}
```

---

## 11. POST /delegated-permission-sets

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-permission-sets`
- **Nombre:** Publicar set de permisos delegados (scoped)
- **Operation ID:** `DelegatedPermissionSetsController_createSet`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DelegatedPermissionSetsController.createSet](../../src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts)

### Descripción de negocio

Publicar set de permisos delegados (scoped). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-29-02: publica el set (versión 1).

### Descripción del sistema

NestJS resuelve `POST /delegated-permission-sets` en `DelegatedPermissionSetsController_createSet`. El controlador delega en `PermissionSetsService.createSet`. Valida el body como `CreatePermissionSetDto` y consume `application/json`. El tipo de retorno estático es `Promise<PermissionSetVersionDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePermissionSetDto`; los campos opcionales se omiten.

```http
POST /delegated-permission-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario del set | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único del set por tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible del set | `Nombre de ejemplo` |
| `delegateType` | No | `string` | valores: `SECRETARY`, `ASSISTANT`, `NURSE`, `BILLING` | Tipo de delegado | `SECRETARY` |
| `description` | No | `string` | longitud máxima 1000 | Descripción del set | `Texto descriptivo de ejemplo` |
| `items` | Sí | `array<PermissionSetItemDto>` | mínimo 1 elemento(s) | Ítems de permiso de la versión 1 | `[{"permissionId":"00000000-0000-4000-8000-000000000001","constraintJson":{},"requiresStepUpAuthentication":true}]` |
| `items[].permissionId` | Sí | `string` | formato `uuid` | Permiso referenciado en authz | `00000000-0000-4000-8000-000000000001` |
| `items[].constraintJson` | No | `object` | Sin restricción adicional declarada | Restricción declarativa (constraint) del permiso | `{}` |
| `items[].requiresStepUpAuthentication` | No | `boolean` | Sin restricción adicional declarada | Requiere step-up (autenticación reforzada) | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /delegated-permission-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PermissionSetVersionDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "itemCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Número de versión publicada | `1` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Nº de ítems de permiso de la versión | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un set con ese código en el tenant | Excepción explícita en src/modules/delegated_access/services/permission-sets.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/delegated-permission-sets"
}
```

---

## 12. POST /delegated-permission-sets/{id}/versions

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-permission-sets`
- **Nombre:** Versionar set de permisos delegados
- **Operation ID:** `DelegatedPermissionSetsController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DelegatedPermissionSetsController.publishVersion](../../src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts)

### Descripción de negocio

Versionar set de permisos delegados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-29-02: publica una nueva versión del set.

### Descripción del sistema

NestJS resuelve `POST /delegated-permission-sets/{id}/versions` en `DelegatedPermissionSetsController_publishVersion`. El controlador delega en `PermissionSetsService.publishVersion`. Valida el body como `PublishSetVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<PermissionSetVersionDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishSetVersionDto`; los campos opcionales se omiten.

```http
POST /delegated-permission-sets/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PermissionSetItemDto>` | mínimo 1 elemento(s) | Ítems de permiso de la nueva versión | `[{"permissionId":"00000000-0000-4000-8000-000000000001","constraintJson":{},"requiresStepUpAuthentication":true}]` |
| `items[].permissionId` | Sí | `string` | formato `uuid` | Permiso referenciado en authz | `00000000-0000-4000-8000-000000000001` |
| `items[].constraintJson` | No | `object` | Sin restricción adicional declarada | Restricción declarativa (constraint) del permiso | `{}` |
| `items[].requiresStepUpAuthentication` | No | `boolean` | Sin restricción adicional declarada | Requiere step-up (autenticación reforzada) | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /delegated-permission-sets/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PermissionSetVersionDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PermissionSetVersionDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "itemCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Número de versión publicada | `1` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Nº de ítems de permiso de la versión | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/delegated-permission-sets/{id}/versions"
}
```

---

## 13. GET /me/practitioner/governance-panel

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-governance`
- **Nombre:** Panel «Para su atención» del doctor
- **Operation ID:** `PractitionerGovernanceController_panel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerGovernanceController.panel](../../src/modules/delegated_access/controllers/practitioner-governance.controller.ts)

### Descripción de negocio

Panel «Para su atención» del doctor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Revisiones y alertas que esperan al doctor.

### Descripción del sistema

NestJS resuelve `GET /me/practitioner/governance-panel` en `PractitionerGovernanceController_panel`. El controlador delega en `PractitionerGovernanceService.panel`. No recibe body. El tipo de retorno estático es `Promise<PractitionerGovernancePanelDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/practitioner/governance-panel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/practitioner/governance-panel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerGovernancePanelDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PractitionerGovernancePanelDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerGovernancePanelDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PractitionerGovernancePanelDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerGovernancePanelDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerGovernancePanelDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PractitionerGovernancePanelDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerGovernancePanelDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "generatedAt": "2026-07-31T12:00:00.000Z",
  "team": [
    {
      "userId": "00000000-0000-4000-8000-000000000001",
      "engagementId": "00000000-0000-4000-8000-000000000001",
      "templateCode": "CODIGO_EJEMPLO",
      "liveGrants": 1
    }
  ],
  "pendingReviews": 1,
  "openAnomalies": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "userId": "00000000-0000-4000-8000-000000000001",
      "kindConceptId": "00000000-0000-4000-8000-000000000001",
      "windowStart": "2026-07-31T12:00:00.000Z",
      "observed": 1,
      "threshold": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `team` | Sí | `array<GovernancePanelTeamMemberDto>` | Sin restricción adicional declarada | Reservado: la lista del equipo la da `GET /me/practitioner/support-team`; acá va vacía. | `[{"userId":"00000000-0000-4000-8000-000000000001","engagementId":"00000000-0000-4000-8000-000000000001","templateCode":"CODIGO_EJEMPLO","liveGrants":1}]` |
| `team[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `team[].engagementId` | Sí | `string` | formato `uuid` | El vínculo con el doctor. | `00000000-0000-4000-8000-000000000001` |
| `team[].templateCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `team[].liveGrants` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `pendingReviews` | Sí | `number` | Sin restricción adicional declarada | Revisiones de acceso que esperan al doctor. | `1` |
| `openAnomalies` | Sí | `array<GovernancePanelAnomalyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","userId":"00000000-0000-4000-8000-000000000001","kindConceptId":"00000000-0000-4000-8000-000000000001","windowStart":"2026-07-31T12:00:00.000Z","observed":1,"threshold":1}]` |
| `openAnomalies[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openAnomalies[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openAnomalies[].kindConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de la alerta, p. ej. `ANOMALY_CANCEL_SPIKE`. | `00000000-0000-4000-8000-000000000001` |
| `openAnomalies[].windowStart` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openAnomalies[].observed` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `openAnomalies[].threshold` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/practitioner/governance-panel"
}
```

---

## 14. GET /me/practitioner/support-activity

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Actividad de mi equipo de apoyo
- **Operation ID:** `PractitionerSupportController_activity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSupportController.activity](../../src/modules/delegated_access/controllers/practitioner-support.controller.ts)

### Descripción de negocio

Actividad de mi equipo de apoyo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Actividad reciente del equipo de apoyo.

### Descripción del sistema

NestJS resuelve `GET /me/practitioner/support-activity` en `PractitionerSupportController_activity`. No se detectó una delegación adicional desde el controlador. No recibe body. El tipo de retorno estático es `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/practitioner/support-activity HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`, `SUPPORT_STAFF`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/practitioner/support-activity HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>` | No |
| 400 | Consulta completada correctamente. | `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>` | No |
| 401 | Consulta completada correctamente. | `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>` | No |
| 403 | Consulta completada correctamente. | `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>` | No |
| 429 | Consulta completada correctamente. | `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>` | No |
| 500 | Consulta completada correctamente. | `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>` | No |
| 504 | Consulta completada correctamente. | `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ items: readonly unknown[]; count: number; nextCursor: string | null }`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {}
  ],
  "count": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{}]` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN, SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/practitioner/support-activity"
}
```

---

## 15. POST /me/practitioner/support-invitations

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Invitar a una secretaria a asistirme
- **Operation ID:** `PractitionerSupportController_invite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSupportController.invite](../../src/modules/delegated_access/controllers/practitioner-support.controller.ts)

### Descripción de negocio

Invitar a una secretaria a asistirme. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Invita a una secretaria registrada (por su documento) a asistirlo.

### Descripción del sistema

NestJS resuelve `POST /me/practitioner/support-invitations` en `PractitionerSupportController_invite`. El controlador delega en `SupportStaffService.inviteForPractitioner`. Valida el body como `PractitionerInviteSupportDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinksCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PractitionerInviteSupportDto`; los campos opcionales se omiten.

```http
POST /me/practitioner/support-invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 20, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nationalId` | Sí | `string` | longitud mínima 4; longitud máxima 40; patrón runtime `NATIONAL_ID_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /me/practitioner/support-invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinksCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del primer vínculo creado. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `items[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `items[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Vinculación no encontrada | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | No hay una secretaria registrada con ese documento | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | Objetivo no encontrado en esa organización | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 409 | `CONFLICT` | Ya hay un vínculo vivo con ese mismo objetivo | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objetivo ${item.targetKind} exige ${field} | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 20, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/practitioner/support-invitations"
}
```

---

## 16. POST /me/practitioner/support-staff

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Crear cuenta de secretaria y vincularla de inmediato
- **Operation ID:** `PractitionerSupportController_createSecretary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSupportController.createSecretary](../../src/modules/delegated_access/controllers/practitioner-support.controller.ts)

### Descripción de negocio

Crear cuenta de secretaria y vincularla de inmediato. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea la cuenta de una secretaria y la vincula de inmediato con estado ACTIVE.

### Descripción del sistema

NestJS resuelve `POST /me/practitioner/support-staff` en `PractitionerSupportController_createSecretary`. El controlador delega en `SupportStaffProvisioningService.provisionForPractitioner`. Valida el body como `CreatePractitionerSupportStaffDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedSupportStaffViewDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePractitionerSupportStaffDto`; los campos opcionales se omiten.

```http
POST /me/practitioner/support-staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nationalId` | Sí | `string` | longitud máxima 40 | Documento de identidad con el que se iniciará sesión | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | Sí | `string` | formato `uuid` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `password` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `ClaveSegura2026!` |
| `name` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Andrea` |
| `lastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Mamani` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Quispe` |
| `displayName` | No | `string` | longitud máxima 200 | Forma anterior de declarar el nombre. Preferí name/lastName. | `Nombre de ejemplo` |
| `email` | Sí | `string` | formato `email`; longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `birthDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `phone` | Sí | `string` | longitud máxima 40 | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `+59170000000` |
| `gender` | No | `string` | valores: `MALE`, `FEMALE`, `OTHER`, `UNKNOWN` | Género administrativo (HL7 AdministrativeGender) | `MALE` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `practitionerRoleAssignmentId` | Sí | `string` | formato `uuid` | ID de la vinculación del doctor (practitioner_role_assignment_id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /me/practitioner/support-staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "gender": "MALE",
  "timeZone": "America/La_Paz",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedSupportStaffViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "supportProfileId": "00000000-0000-4000-8000-000000000001",
  "linkId": "00000000-0000-4000-8000-000000000001",
  "status": "ACTIVE",
  "organizationName": "Nombre de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Cuenta de usuario creada o vinculada. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Persona de la secretaria. | `00000000-0000-4000-8000-000000000001` |
| `supportProfileId` | Sí | `string` | formato `uuid` | Perfil de secretaria (`profiles.secretary_profiles.profile_id`). | `00000000-0000-4000-8000-000000000001` |
| `linkId` | Sí | `string` | formato `uuid` | ID del vínculo de apoyo (`practitioner_support_assignment` u `organization_user_assignment`). | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `ACTIVE` | Estado del vínculo creado (siempre ACTIVE). | `ACTIVE` |
| `organizationName` | No | `string` | Sin restricción adicional declarada | Nombre del hospital u organización vinculada. | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Vinculación no encontrada o no pertenece al médico | Excepción explícita en src/modules/delegated_access/services/support-staff-provisioning.service.ts |
| 409 | `CONFLICT` | La secretaria ya tiene un vínculo activo con esta vinculación | Excepción explícita en src/modules/delegated_access/services/support-staff-provisioning.service.ts |
| 409 | `CONFLICT` | Ya existe una cuenta con ese documento de identidad | Excepción explícita en src/modules/iam/application/services/iam-support-staff-self-registration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/practitioner/support-staff"
}
```

---

## 17. GET /me/practitioner/support-team

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Mi equipo de apoyo (secretarias)
- **Operation ID:** `PractitionerSupportController_team`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSupportController.team](../../src/modules/delegated_access/controllers/practitioner-support.controller.ts)

### Descripción de negocio

Mi equipo de apoyo (secretarias). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Sus secretarias, activas y pendientes.

### Descripción del sistema

NestJS resuelve `GET /me/practitioner/support-team` en `PractitionerSupportController_team`. El controlador delega en `SupportStaffService.practitionerTeam`. No recibe body. El tipo de retorno estático es `Promise<SupportLinkListDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/practitioner/support-team HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`, `SUPPORT_STAFF`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/practitioner/support-team HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `items[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `items[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN, SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/practitioner/support-team"
}
```

---

## 18. POST /me/practitioner/support-team/{id}/end

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Terminar el vínculo con una secretaria
- **Operation ID:** `PractitionerSupportController_end`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSupportController.end](../../src/modules/delegated_access/controllers/practitioner-support.controller.ts)

### Descripción de negocio

Terminar el vínculo con una secretaria. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Termina el vínculo con una secretaria suya.

### Descripción del sistema

NestJS resuelve `POST /me/practitioner/support-team/{id}/end` en `PractitionerSupportController_end`. El controlador delega en `SupportStaffService.endForPractitioner`. Valida el body como `SupportLinkReasonDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SupportLinkReasonDto`; los campos opcionales se omiten.

```http
POST /me/practitioner/support-team/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /me/practitioner/support-team/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se termina un vínculo activo o pendiente | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/practitioner/support-team/{id}/end"
}
```

---

## 19. GET /me/support-access

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Mi alcance: hospitales, doctores y pisos de mis vínculos activos
- **Operation ID:** `SupportStaffController_access`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.access](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Mi alcance: hospitales, doctores y pisos de mis vínculos activos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lo que puede ver: hospitales, sedes, servicios, pisos y doctores.

### Descripción del sistema

NestJS resuelve `GET /me/support-access` en `SupportStaffController_access`. El controlador delega en `SupportStaffService.myAccess`. No recibe body. El tipo de retorno estático es `Promise<SupportAccessResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/support-access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/support-access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportAccessResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SupportAccessResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SupportAccessResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SupportAccessResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SupportAccessResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SupportAccessResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SupportAccessResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportAccessResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "tenants": [
    {
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "wholeOrganization": true,
      "organizationAccess": true,
      "practiceSiteIds": [
        "valor-ejemplo"
      ],
      "clinicalUnitIds": [
        "valor-ejemplo"
      ],
      "careSpaceIds": [
        "valor-ejemplo"
      ],
      "practitioners": [
        {
          "linkId": "00000000-0000-4000-8000-000000000001",
          "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
          "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
          "name": "Nombre de ejemplo"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenants` | Sí | `array<SupportTenantScopeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","wholeOrganization":true,"organizationAccess":true,"practiceSiteIds":["valor-ejemplo"],"clinicalUnitIds":["valor-ejemplo"],"careSpaceIds":["valor-ejemplo"],"practitioners":[{"linkId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"}]}]` |
| `tenants[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenants[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `tenants[].wholeOrganization` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `tenants[].organizationAccess` | Sí | `boolean` | Sin restricción adicional declarada | El hospital aprobó a la secretaria y entra a su token. false = sólo un doctor la aceptó: ve su agenda y nada más del hospital. | `true` |
| `tenants[].practiceSiteIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `tenants[].clinicalUnitIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `tenants[].careSpaceIds` | Sí | `array<string>` | Sin restricción adicional declarada | Pisos y espacios. | `["valor-ejemplo"]` |
| `tenants[].practitioners` | Sí | `array<SupportScopePractitionerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"linkId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"}]` |
| `tenants[].practitioners[].linkId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenants[].practitioners[].practitionerRoleAssignmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenants[].practitioners[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenants[].practitioners[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/support-access"
}
```

---

## 20. GET /me/support-agenda

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Agenda de un doctor asignado (403 si no hay vínculo activo)
- **Operation ID:** `SupportStaffController_agenda`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.agenda](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Devuelve como mucho `limit` turnos (500) por hora; con `truncated: true` el rango tenía más: acote `from`/`to` y vuelva a pedir. La lectura queda en la bitácora de acceso a datos.

Contexto declarado en el controlador: Agenda de un doctor al que asiste (sólo con vínculo activo con él). Devuelve el nombre de los pacientes: es una lectura de PHI y deja su asiento en `audit.data_access_log` (`@AccessLogged`, sin identificadores de paciente en el asiento). Lleva un tope de turnos y avisa con `truncated`.

### Descripción del sistema

NestJS resuelve `GET /me/support-agenda` en `SupportStaffController_agenda`. El controlador delega en `SupportStaffService.agenda`. No recibe body. El tipo de retorno estático es `Promise<SupportAgendaResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | formato `date-time` | Sin descripción específica en OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `to` | query | Sí | `string` | formato `date-time` | Sin descripción específica en OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/support-agenda?tenantId=00000000-0000-4000-8000-000000000001&practitionerRoleAssignmentId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/support-agenda?tenantId=00000000-0000-4000-8000-000000000001&practitionerRoleAssignmentId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportAgendaResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SupportAgendaResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SupportAgendaResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SupportAgendaResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SupportAgendaResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SupportAgendaResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SupportAgendaResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportAgendaResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "bookingId": "00000000-0000-4000-8000-000000000001",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z",
      "statusCode": "CODIGO_EJEMPLO",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "patientName": "Nombre de ejemplo"
    }
  ],
  "count": 1,
  "truncated": true,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SupportAgendaItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"bookingId":"00000000-0000-4000-8000-000000000001","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z","statusCode":"CODIGO_EJEMPLO","patientProfileId":"00000000-0000-4000-8000-000000000001","patientName":"Nombre de ejemplo"}]` |
| `items[].bookingId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].startAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].endAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].statusCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | true = el rango tiene más turnos que `limit` y se devolvieron los primeros por hora; acote el rango y vuelva a pedir. | `true` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope de turnos por respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | El rango tiene que ser positivo y de ${MAX_AGENDA_DAYS} días como mucho | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/support-agenda"
}
```

---

## 21. GET /me/support-catalog

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Sedes, servicios, pisos y doctores de un hospital para pedir
- **Operation ID:** `SupportStaffController_catalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.catalog](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Sedes, servicios, pisos y doctores de un hospital para pedir. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Catálogo de un hospital para armar el pedido.

### Descripción del sistema

NestJS resuelve `GET /me/support-catalog` en `SupportStaffController_catalog`. El controlador delega en `SupportStaffService.catalogForSupport`. No recibe body. El tipo de retorno estático es `Promise<SupportCatalogResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `org` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/support-catalog?org=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/support-catalog?org=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportCatalogResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "sites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "services": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "floors": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "practitioners": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `sites[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `services[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `services[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Pisos. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `floors[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `floors[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Doctores: `id` es su vinculación con el hospital. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `practitioners[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `practitioners[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/support-catalog"
}
```

---

## 22. GET /me/support-engagements

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Mis vínculos de apoyo y mis solicitudes
- **Operation ID:** `SupportStaffController_mine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.mine](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Mis vínculos de apoyo y mis solicitudes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Sus vínculos y, aparte, los pendientes.

### Descripción del sistema

NestJS resuelve `GET /me/support-engagements` en `SupportStaffController_mine`. El controlador delega en `SupportStaffService.listMine`. No recibe body. El tipo de retorno estático es `Promise<MySupportEngagementsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/support-engagements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/support-engagements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MySupportEngagementsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MySupportEngagementsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MySupportEngagementsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MySupportEngagementsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MySupportEngagementsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MySupportEngagementsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MySupportEngagementsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MySupportEngagementsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "requests": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `items[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `items[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requests` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Los vínculos todavía PENDING (pedidos o invitaciones). | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `requests[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `requests[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `requests[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requests[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requests[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `requests[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `requests[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `requests[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requests[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `requests[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/support-engagements"
}
```

---

## 23. POST /me/support-engagements/{id}/confirm

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Aceptar una invitación de apoyo
- **Operation ID:** `SupportStaffController_confirm`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.confirm](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Aceptar una invitación de apoyo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Acepta una invitación del hospital o de un doctor.

### Descripción del sistema

NestJS resuelve `POST /me/support-engagements/{id}/confirm` en `SupportStaffController_confirm`. El controlador delega en `SupportStaffService.confirmMine`. No recibe body. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /me/support-engagements/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /me/support-engagements/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Ese vínculo no está esperando su decisión | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/support-engagements/{id}/confirm"
}
```

---

## 24. POST /me/support-engagements/{id}/decline

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Rechazar una invitación de apoyo
- **Operation ID:** `SupportStaffController_decline`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.decline](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Rechazar una invitación de apoyo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Rechaza una invitación.

### Descripción del sistema

NestJS resuelve `POST /me/support-engagements/{id}/decline` en `SupportStaffController_decline`. El controlador delega en `SupportStaffService.declineMine`. Valida el body como `SupportLinkReasonDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SupportLinkReasonDto`; los campos opcionales se omiten.

```http
POST /me/support-engagements/00000000-0000-4000-8000-000000000001/decline HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /me/support-engagements/00000000-0000-4000-8000-000000000001/decline HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Ese vínculo no está esperando su decisión | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/support-engagements/{id}/decline"
}
```

---

## 25. POST /me/support-engagements/{id}/leave

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Dejar un vínculo o retirar mi pedido
- **Operation ID:** `SupportStaffController_leave`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.leave](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Dejar un vínculo o retirar mi pedido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Deja un vínculo o retira un pedido propio.

### Descripción del sistema

NestJS resuelve `POST /me/support-engagements/{id}/leave` en `SupportStaffController_leave`. El controlador delega en `SupportStaffService.leaveMine`. No recibe body. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /me/support-engagements/00000000-0000-4000-8000-000000000001/leave HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /me/support-engagements/00000000-0000-4000-8000-000000000001/leave HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Sólo se termina un vínculo activo o pendiente | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/me/support-engagements/{id}/leave"
}
```

---

## 26. POST /org/{tenantMembershipId}/user-assignments

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-org`
- **Nombre:** Asignar usuario de organización con alcance y vigencia
- **Operation ID:** `OrgUserAssignmentsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgUserAssignmentsController.create](../../src/modules/delegated_access/controllers/org-user-assignments.controller.ts)

### Descripción de negocio

Asignar usuario de organización con alcance y vigencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /org/{tenantMembershipId}/user-assignments` en `OrgUserAssignmentsController_create`. El controlador delega en `OrgUserAssignmentsService.createAssignment`. Valida el body como `CreateOrgUserAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantMembershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateOrgUserAssignmentDto`; los campos opcionales se omiten.

```http
POST /org/00000000-0000-4000-8000-000000000001/user-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `tenantMembershipId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `role` | No | `string` | valores: `STAFF`, `SECRETARY`, `ASSISTANT`, `BILLING`, `OR_MANAGER`, `INFECTION_CONTROL`, `UNIT_HEAD` | Rol de la asignación | `STAFF` |
| `accessScope` | No | `string` | valores: `TENANT`, `PRACTICE`, `SITE`, `UNIT`, `SPACE` | Alcance de acceso | `TENANT` |
| `practiceId` | No | `string` | formato `uuid` | Nodo de scope: práctica | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | No | `string` | formato `uuid` | Nodo de scope: sede de práctica | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Nodo de scope: unidad clínica | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid` | Nodo de scope: care space | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitId` | No | `string` | formato `uuid` | Nodo de scope: unidad de diagnóstico | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | No | `string` | formato `uuid` | Nodo de scope: farmacia | `00000000-0000-4000-8000-000000000001` |
| `supervisorUserId` | No | `string` | formato `uuid` | Supervisor responsable | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia (ISO) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /org/00000000-0000-4000-8000-000000000001/user-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/delegated_access/services/org-user-assignments.service.ts |
| 409 | `CONFLICT` | Ya existe una asignación activa con ese rol y alcance | Excepción explícita en src/modules/delegated_access/services/org-user-assignments.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/{tenantMembershipId}/user-assignments"
}
```

---

## 27. GET /org/affiliation-invitations

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-affiliation-invitations`
- **Nombre:** Listar los códigos de afiliación de la organización
- **Operation ID:** `AffiliationInvitationsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AffiliationInvitationsController.list](../../src/modules/delegated_access/controllers/affiliation-invitations.controller.ts)

### Descripción de negocio

Listar los códigos de afiliación de la organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Codes of the active organization, without the plain codes.

### Descripción del sistema

NestJS resuelve `GET /org/affiliation-invitations` en `AffiliationInvitationsController_list`. El controlador delega en `AffiliationInvitationsService.list`. No recibe body. El tipo de retorno estático es `Promise<ListAffiliationInvitationsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /org/affiliation-invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /org/affiliation-invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListAffiliationInvitationsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListAffiliationInvitationsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListAffiliationInvitationsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListAffiliationInvitationsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListAffiliationInvitationsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListAffiliationInvitationsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ListAffiliationInvitationsResponseDto>` | No |

El controlador declara `ListAffiliationInvitationsResponseDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/affiliation-invitations"
}
```

---

## 28. POST /org/affiliation-invitations

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-affiliation-invitations`
- **Nombre:** Crear un código o QR de afiliación
- **Operation ID:** `AffiliationInvitationsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AffiliationInvitationsController.create](../../src/modules/delegated_access/controllers/affiliation-invitations.controller.ts)

### Descripción de negocio

Crear un código o QR de afiliación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Organization admin issues a code. The plain code is returned only here.

### Descripción del sistema

NestJS resuelve `POST /org/affiliation-invitations` en `AffiliationInvitationsController_create`. El controlador delega en `AffiliationInvitationsService.create`. Valida el body como `CreateAffiliationInvitationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AffiliationInvitationViewDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAffiliationInvitationDto`; los campos opcionales se omiten.

```http
POST /org/affiliation-invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kind": "PRACTITIONER",
  "maxUses": 1,
  "expiresInDays": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 20, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `string` | valores: `PRACTITIONER`, `SUPPORT_STAFF` | Sin descripción específica en el contrato OpenAPI. | `PRACTITIONER` |
| `targetPersonId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `maxUses` | Sí | `number` | mínimo 1; máximo 500 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `expiresInDays` | Sí | `number` | mínimo 1; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `roleTemplateCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /org/affiliation-invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kind": "PRACTITIONER",
  "targetPersonId": "00000000-0000-4000-8000-000000000001",
  "maxUses": 1,
  "expiresInDays": 1,
  "roleTemplateCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |

El controlador declara `AffiliationInvitationViewDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La organización necesita una sede activa para recibir solicitudes de médicos | Excepción explícita en src/modules/delegated_access/services/affiliation-invitations.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 20, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/affiliation-invitations"
}
```

---

## 29. POST /org/affiliation-invitations/{id}/revoke

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-affiliation-invitations`
- **Nombre:** Revocar un código o QR de afiliación
- **Operation ID:** `AffiliationInvitationsController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AffiliationInvitationsController.revoke](../../src/modules/delegated_access/controllers/affiliation-invitations.controller.ts)

### Descripción de negocio

Revocar un código o QR de afiliación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Organization admin turns a code off. Authorization is the OWNER/ADMIN check of the service (as in create and list): there is no global role to gate it with.

### Descripción del sistema

NestJS resuelve `POST /org/affiliation-invitations/{id}/revoke` en `AffiliationInvitationsController_revoke`. El controlador delega en `AffiliationInvitationsService.revoke`. No recibe body. El tipo de retorno estático es `Promise<AffiliationInvitationViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /org/affiliation-invitations/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit particular: `Throttle({ default: { limit: 20, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /org/affiliation-invitations/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AffiliationInvitationViewDto>` | No |

El controlador declara `AffiliationInvitationViewDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Código de afiliación no encontrado | Excepción explícita en src/modules/delegated_access/services/affiliation-invitations.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 20, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/affiliation-invitations/{id}/revoke"
}
```

---

## 30. GET /org/support-catalog

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Sedes, servicios, pisos y doctores para invitar
- **Operation ID:** `SupportStaffController_orgCatalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.orgCatalog](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Sedes, servicios, pisos y doctores para invitar. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Catálogo del hospital activo, para invitar.

### Descripción del sistema

NestJS resuelve `GET /org/support-catalog` en `SupportStaffController_orgCatalog`. El controlador delega en `SupportStaffService.catalogForOrganization`. No recibe body. El tipo de retorno estático es `Promise<SupportCatalogResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /org/support-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /org/support-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SupportCatalogResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportCatalogResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "sites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "services": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "floors": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "practitioners": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `sites[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `services[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `services[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `services[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Pisos. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `floors[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `floors[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `floors[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners` | Sí | `array<SupportCatalogEntryDto>` | Sin restricción adicional declarada | Doctores: `id` es su vinculación con el hospital. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `practitioners[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners[].name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `practitioners[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitioners[].practitionerProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/support-catalog"
}
```

---

## 31. GET /org/support-engagement-requests

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Solicitudes e invitaciones de apoyo del hospital
- **Operation ID:** `SupportStaffController_orgRequests`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.orgRequests](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Sin `@Roles`: lo decide el servicio por ser OWNER/ADMIN del hospital activo (o plataforma). `awaiting` dice quién tiene que decidir.

Contexto declarado en el controlador: Bandeja del hospital: vínculos en un estado (por defecto pendientes).

### Descripción del sistema

NestJS resuelve `GET /org/support-engagement-requests` en `SupportStaffController_orgRequests`. El controlador delega en `SupportStaffService.listForOrganization`. No recibe body. El tipo de retorno estático es `Promise<SupportLinkListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `status` | query | No | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en OpenAPI. | `PENDING` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /org/support-engagement-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /org/support-engagement-requests?status=PENDING HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `items[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `items[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/support-engagement-requests"
}
```

---

## 32. POST /org/support-engagement-requests/{id}/decision

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Aceptar o rechazar una solicitud de apoyo
- **Operation ID:** `SupportStaffController_decide`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.decide](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Aceptar o rechazar una solicitud de apoyo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El hospital acepta o rechaza lo que pidió una secretaria.

### Descripción del sistema

NestJS resuelve `POST /org/support-engagement-requests/{id}/decision` en `SupportStaffController_decide`. El controlador delega en `SupportStaffService.decideForOrganization`. Valida el body como `DecideSupportLinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DecideSupportLinkDto`; los campos opcionales se omiten.

```http
POST /org/support-engagement-requests/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `reasonText` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /org/support-engagement-requests/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Ese vínculo no está esperando su decisión | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/support-engagement-requests/{id}/decision"
}
```

---

## 33. GET /org/support-engagements

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Personal de apoyo del hospital
- **Operation ID:** `SupportStaffController_orgEngagements`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.orgEngagements](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Personal de apoyo del hospital. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Personal de apoyo del hospital (vínculos activos y pendientes).

### Descripción del sistema

NestJS resuelve `GET /org/support-engagements` en `SupportStaffController_orgEngagements`. El controlador delega en `SupportStaffService.listEngagementsForOrganization`. No recibe body. El tipo de retorno estático es `Promise<SupportLinkListDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /org/support-engagements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /org/support-engagements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SupportLinkListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `items[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `items[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/support-engagements"
}
```

---

## 34. POST /org/support-engagements/{id}/end

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Terminar un vínculo de apoyo
- **Operation ID:** `SupportStaffController_end`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.end](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Terminar un vínculo de apoyo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El hospital termina un vínculo o retira una invitación.

### Descripción del sistema

NestJS resuelve `POST /org/support-engagements/{id}/end` en `SupportStaffController_end`. El controlador delega en `SupportStaffService.endForOrganization`. Valida el body como `SupportLinkReasonDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SupportLinkReasonDto`; los campos opcionales se omiten.

```http
POST /org/support-engagements/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /org/support-engagements/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se termina un vínculo activo o pendiente | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/support-engagements/{id}/end"
}
```

---

## 35. POST /org/support-staff

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Crear cuenta de secretaria y vincularla a la organización de inmediato
- **Operation ID:** `OrgSupportStaffProvisioningController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgSupportStaffProvisioningController.create](../../src/modules/delegated_access/controllers/org-support-staff-provisioning.controller.ts)

### Descripción de negocio

Crear cuenta de secretaria y vincularla a la organización de inmediato. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea la cuenta de una secretaria y la vincula de inmediato con estado ACTIVE.

### Descripción del sistema

NestJS resuelve `POST /org/support-staff` en `OrgSupportStaffProvisioningController_create`. El controlador delega en `SupportStaffProvisioningService.provisionForOrganization`. Valida el body como `CreateOrgSupportStaffDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedSupportStaffViewDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateOrgSupportStaffDto`; los campos opcionales se omiten.

```http
POST /org/support-staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nationalId` | Sí | `string` | longitud máxima 40 | Documento de identidad con el que se iniciará sesión | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | Sí | `string` | formato `uuid` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `password` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `ClaveSegura2026!` |
| `name` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Andrea` |
| `lastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Mamani` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Quispe` |
| `displayName` | No | `string` | longitud máxima 200 | Forma anterior de declarar el nombre. Preferí name/lastName. | `Nombre de ejemplo` |
| `email` | Sí | `string` | formato `email`; longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `birthDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `phone` | Sí | `string` | longitud máxima 40 | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `+59170000000` |
| `gender` | No | `string` | valores: `MALE`, `FEMALE`, `OTHER`, `UNKNOWN` | Género administrativo (HL7 AdministrativeGender) | `MALE` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `targetKind` | No | `string` | valores: `ORGANIZATION`, `SITE`, `SERVICE`, `SPACE`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `ORGANIZATION` |
| `practiceSiteId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /org/support-staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "gender": "MALE",
  "timeZone": "America/La_Paz",
  "targetKind": "ORGANIZATION",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CreatedSupportStaffViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedSupportStaffViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "supportProfileId": "00000000-0000-4000-8000-000000000001",
  "linkId": "00000000-0000-4000-8000-000000000001",
  "status": "ACTIVE",
  "organizationName": "Nombre de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Cuenta de usuario creada o vinculada. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Persona de la secretaria. | `00000000-0000-4000-8000-000000000001` |
| `supportProfileId` | Sí | `string` | formato `uuid` | Perfil de secretaria (`profiles.secretary_profiles.profile_id`). | `00000000-0000-4000-8000-000000000001` |
| `linkId` | Sí | `string` | formato `uuid` | ID del vínculo de apoyo (`practitioner_support_assignment` u `organization_user_assignment`). | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `ACTIVE` | Estado del vínculo creado (siempre ACTIVE). | `ACTIVE` |
| `organizationName` | No | `string` | Sin restricción adicional declarada | Nombre del hospital u organización vinculada. | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una cuenta con ese documento de identidad | Excepción explícita en src/modules/iam/application/services/iam-support-staff-self-registration.service.ts |
| 409 | `CONFLICT` | La cuenta ya tiene una membresía en la organización que no está activa | Excepción explícita en src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/support-staff"
}
```

---

## 36. POST /org/team/invitations

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Invitar a una secretaria a lugares o doctores
- **Operation ID:** `SupportStaffController_invite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.invite](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Invitar a una secretaria a lugares o doctores. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El hospital invita a una secretaria registrada (por su documento).

### Descripción del sistema

NestJS resuelve `POST /org/team/invitations` en `SupportStaffController_invite`. El controlador delega en `SupportStaffService.inviteForOrganization`. Valida el body como `InviteSupportStaffDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinksCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InviteSupportStaffDto`; los campos opcionales se omiten.

```http
POST /org/team/invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": "ORGANIZATION"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 20, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nationalId` | Sí | `string` | longitud mínima 4; longitud máxima 40; patrón runtime `NATIONAL_ID_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<SupportTargetDto>` | mínimo 1 elemento(s); máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"targetKind":"ORGANIZATION","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].targetKind` | Sí | `string` | valores: `ORGANIZATION`, `SITE`, `SERVICE`, `SPACE`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `ORGANIZATION` |
| `items[].practiceSiteId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /org/team/invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": "ORGANIZATION",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinksCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del primer vínculo creado. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `items[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `items[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | No hay una secretaria registrada con ese documento | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | Objetivo no encontrado en esa organización | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 409 | `CONFLICT` | Ya hay un vínculo vivo con ese mismo objetivo | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objetivo ${item.targetKind} exige ${field} | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 20, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/team/invitations"
}
```

---

## 37. PATCH /org/user-assignments/{id}

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-org`
- **Nombre:** Reasignar supervisor / suspender asignación de organización
- **Operation ID:** `OrgUserAssignmentsController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgUserAssignmentsController.update](../../src/modules/delegated_access/controllers/org-user-assignments.controller.ts)

### Descripción de negocio

Reasignar supervisor / suspender asignación de organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /org/user-assignments/{id}` en `OrgUserAssignmentsController_update`. El controlador delega en `OrgUserAssignmentsService.updateAssignment`. Valida el body como `UpdateOrgUserAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<OperationResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateOrgUserAssignmentDto`; los campos opcionales se omiten.

```http
PATCH /org/user-assignments/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceSiteId` | No | `string` | formato `uuid` | Sede (alcance SITE) | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad (alcance UNIT) | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid` | Espacio (alcance SPACE) | `00000000-0000-4000-8000-000000000001` |
| `supervisorUserId` | No | `string` | formato `uuid` | Nuevo supervisor | `00000000-0000-4000-8000-000000000001` |
| `accessScope` | No | `string` | valores: `TENANT`, `PRACTICE`, `SITE`, `UNIT`, `SPACE` | Nuevo alcance de acceso | `TENANT` |
| `suspend` | No | `boolean` | Sin restricción adicional declarada | Suspender la asignación (cascada a delegaciones) | `true` |
| `expectedRowVersion` | No | `number` | Sin restricción adicional declarada | row_version esperado (concurrencia optimista) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /org/user-assignments/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "supervisorUserId": "00000000-0000-4000-8000-000000000001",
  "accessScope": "TENANT",
  "suspend": true,
  "expectedRowVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Indica éxito | `true` |
| `status` | No | `string` | Sin restricción adicional declarada | Nuevo estado del recurso (concept id) | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Asignación no encontrada | Excepción explícita en src/modules/delegated_access/services/org-user-assignments.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | row_version no coincide | Excepción explícita en src/modules/delegated_access/services/org-user-assignments.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No hay cambios que aplicar | Excepción explícita en src/modules/delegated_access/services/org-user-assignments.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación no está activa | Excepción explícita en src/modules/delegated_access/services/org-user-assignments.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/org/user-assignments/{id}"
}
```

---

## 38. POST /practitioner-delegates

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-practitioner-delegates`
- **Nombre:** Crear asignación de delegado de practitioner
- **Operation ID:** `PractitionerDelegatesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerDelegatesController.create](../../src/modules/delegated_access/controllers/practitioner-delegates.controller.ts)

### Descripción de negocio

Crear asignación de delegado de practitioner. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practitioner-delegates` en `PractitionerDelegatesController_create`. El controlador delega en `PractitionerDelegatesService.createDelegate`. Valida el body como `CreatePractitionerDelegateDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePractitionerDelegateDto`; los campos opcionales se omiten.

```http
POST /practitioner-delegates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegateUserAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegatedPermissionSetId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerRoleAssignmentId` | Sí | `string` | formato `uuid` | Asignación de rol del practitioner delegante | `00000000-0000-4000-8000-000000000001` |
| `delegateUserAssignmentId` | Sí | `string` | formato `uuid` | Asignación de usuario de organización (delegado) | `00000000-0000-4000-8000-000000000001` |
| `delegatedPermissionSetId` | Sí | `string` | formato `uuid` | Set de permisos delegados a aplicar | `00000000-0000-4000-8000-000000000001` |
| `delegateRole` | No | `string` | valores: `ASSISTANT`, `SECRETARY`, `NURSE` | Rol del delegado | `ASSISTANT` |
| `patientScope` | No | `string` | valores: `ASSIGNED`, `ALL` | Alcance de pacientes | `ASSIGNED` |
| `appointmentScope` | No | `string` | valores: `TODAY`, `ALL` | Alcance de citas | `TODAY` |
| `mayViewClinicalContent` | No | `boolean` | Sin restricción adicional declarada | Puede ver contenido clínico | `true` |
| `mayEditDrafts` | No | `boolean` | Sin restricción adicional declarada | Puede editar borradores | `true` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia (ISO) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practitioner-delegates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El usuario de organización no está activo | Excepción explícita en src/modules/delegated_access/services/practitioner-delegates.service.ts |
| 422 | `PRECONDITION_FAILED` | El set de permisos no está activo | Excepción explícita en src/modules/delegated_access/services/practitioner-delegates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-delegates"
}
```

---

## 39. POST /practitioner-delegates/{id}/accept

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Aceptar a una secretaria
- **Operation ID:** `PractitionerSupportController_accept`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSupportController.accept](../../src/modules/delegated_access/controllers/practitioner-support.controller.ts)

### Descripción de negocio

Aceptar a una secretaria. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Acepta a la secretaria que pidió asistirlo.

### Descripción del sistema

NestJS resuelve `POST /practitioner-delegates/{id}/accept` en `PractitionerSupportController_accept`. El controlador delega en `SupportStaffService.acceptForPractitioner`. No recibe body. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Ese vínculo no está esperando su decisión | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-delegates/{id}/accept"
}
```

---

## 40. POST /practitioner-delegates/{id}/access-requests

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-practitioner-delegates`
- **Nombre:** Solicitar acceso delegado (aprobación previa)
- **Operation ID:** `PractitionerDelegatesController_requestAccess`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerDelegatesController.requestAccess](../../src/modules/delegated_access/controllers/practitioner-delegates.controller.ts)

### Descripción de negocio

Solicitar acceso delegado (aprobación previa). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practitioner-delegates/{id}/access-requests` en `PractitionerDelegatesController_requestAccess`. El controlador delega en `AccessRequestsService.requestAccess`. Valida el body como `CreateAccessRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAccessRequestDto`; los campos opcionales se omiten.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/access-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requestedPermissionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requestedPermissionId` | Sí | `string` | formato `uuid` | Permiso solicitado (authz) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente objetivo | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro objetivo | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | longitud máxima 1000 | Justificación de la solicitud | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/access-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requestedPermissionId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una solicitud pendiente equivalente | Excepción explícita en src/modules/delegated_access/services/access-requests.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La delegación no está activa | Excepción explícita en src/modules/delegated_access/services/access-requests.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-delegates/{id}/access-requests"
}
```

---

## 41. POST /practitioner-delegates/{id}/grants

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-practitioner-delegates`
- **Nombre:** Otorgar grant delegado por-propósito y temporal
- **Operation ID:** `PractitionerDelegatesController_issueGrant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerDelegatesController.issueGrant](../../src/modules/delegated_access/controllers/practitioner-delegates.controller.ts)

### Descripción de negocio

Otorgar grant delegado por-propósito y temporal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practitioner-delegates/{id}/grants` en `PractitionerDelegatesController_issueGrant`. El controlador delega en `PractitionerDelegatesService.issueGrant`. Valida el body como `CreateGrantDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateGrantDto`; los campos opcionales se omiten.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purpose": "TREATMENT",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purpose` | Sí | `string` | valores: `TREATMENT`, `BILLING`, `OPERATIONS` | Propósito de uso | `TREATMENT` |
| `validTo` | Sí | `string` | formato `date-time` | Fin de vigencia del grant (ISO, obligatorio) | `2026-07-31T12:00:00.000Z` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia (ISO) | `2026-07-31T12:00:00.000Z` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente objetivo | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro objetivo | `00000000-0000-4000-8000-000000000001` |
| `resourceType` | No | `string` | valores: `CLINICAL_NOTE`, `APPOINTMENT`, `PRESCRIPTION` | Tipo de recurso | `CLINICAL_NOTE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purpose": "TREATMENT",
  "validTo": "2026-07-31T12:00:00.000Z",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "CLINICAL_NOTE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La delegación no está activa | Excepción explícita en src/modules/delegated_access/services/practitioner-delegates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-delegates/{id}/grants"
}
```

---

## 42. POST /practitioner-delegates/{id}/reject

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Rechazar a una secretaria
- **Operation ID:** `PractitionerSupportController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSupportController.reject](../../src/modules/delegated_access/controllers/practitioner-support.controller.ts)

### Descripción de negocio

Rechazar a una secretaria. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Rechaza a la secretaria que pidió asistirlo.

### Descripción del sistema

NestJS resuelve `POST /practitioner-delegates/{id}/reject` en `PractitionerSupportController_reject`. El controlador delega en `SupportStaffService.rejectForPractitioner`. Valida el body como `SupportLinkReasonDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinkViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SupportLinkReasonDto`; los campos opcionales se omiten.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinkViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinkViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "kind": "LOCATION",
  "targetKind": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "userId": "00000000-0000-4000-8000-000000000001",
  "personName": "Nombre de ejemplo",
  "status": "PENDING",
  "initiatedBy": "SUPPORT_STAFF",
  "awaiting": "SUPPORT_STAFF",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "targetName": "Nombre de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Ese vínculo no está esperando su decisión | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-delegates/{id}/reject"
}
```

---

## 43. POST /practitioner-delegates/{id}/revoke

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-practitioner-delegates`
- **Nombre:** Revocar delegación de forma inmediata (cascada authz)
- **Operation ID:** `PractitionerDelegatesController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerDelegatesController.revoke](../../src/modules/delegated_access/controllers/practitioner-delegates.controller.ts)

### Descripción de negocio

Revocar delegación de forma inmediata (cascada authz). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practitioner-delegates/{id}/revoke` en `PractitionerDelegatesController_revoke`. El controlador delega en `PractitionerDelegatesService.revoke`. Valida el body como `RevokeDelegationDto` y consume `application/json`. El tipo de retorno estático es `Promise<OperationResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RevokeDelegationDto`; los campos opcionales se omiten.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Motivo de la revocación (auditoría) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practitioner-delegates/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Indica éxito | `true` |
| `status` | No | `string` | Sin restricción adicional declarada | Nuevo estado del recurso (concept id) | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioner-delegates/{id}/revoke"
}
```

---

## 44. GET /public/prescription-shares/{token}

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `clinical-prescription-shares-public`
- **Nombre:** Comprobar un enlace de receta compartida
- **Operation ID:** `PrescriptionSharesPublicController_read`
- **Autenticación:** Pública
- **Implementación:** [PrescriptionSharesPublicController.read](../../src/modules/delegated_access/controllers/prescription-shares-public.controller.ts)

### Descripción de negocio

Sin autenticación y sin datos del paciente ni de los fármacos: estado, emisión, nombre y matrícula del prescriptor.


### Descripción del sistema

NestJS resuelve `GET /public/prescription-shares/{token}` en `PrescriptionSharesPublicController_read`. El controlador delega en `PrescriptionSharesService.readPublic`. No recibe body. El tipo de retorno estático es `Promise<PublicPrescriptionShareDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `token` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `user-agent` | header | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/prescription-shares/valor-ejemplo HTTP/1.1
Host: localhost:3000
user-agent: valor-ejemplo
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/prescription-shares/valor-ejemplo HTTP/1.1
Host: localhost:3000
user-agent: valor-ejemplo
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicPrescriptionShareDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PublicPrescriptionShareDto>` | No |
| 404 | El enlace no existe | `Promise<PublicPrescriptionShareDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicPrescriptionShareDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicPrescriptionShareDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PublicPrescriptionShareDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicPrescriptionShareDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "VALID",
  "endedReason": "LINK_EXPIRED",
  "issuedAt": "2026-07-31T12:00:00.000Z",
  "prescriberName": "Nombre de ejemplo",
  "prescriberLicense": {
    "number": "valor-ejemplo",
    "authority": {},
    "state": "ACTIVE"
  },
  "itemCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `VALID`, `EXPIRED`, `REVOKED` | Sin descripción específica en el contrato OpenAPI. | `VALID` |
| `endedReason` | Sí | `string` | valores: `LINK_EXPIRED`, `PRESCRIPTION_NOT_ACTIVE`; admite null | Sin descripción específica en el contrato OpenAPI. | `LINK_EXPIRED` |
| `issuedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `prescriberName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriberLicense` | No | `PrescriberLicenseDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"number":"valor-ejemplo","authority":{},"state":"ACTIVE"}` |
| `prescriberLicense.number` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prescriberLicense.authority` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `prescriberLicense.state` | No | `string` | valores: `ACTIVE`, `PENDING` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/prescription-shares/{token}"
}
```

---

## 45. POST /support-engagement-requests

- **Módulo:** `delegated_access`
- **Etiqueta OpenAPI:** `delegated-access-support-staff`
- **Nombre:** Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor)
- **Operation ID:** `SupportStaffController_request`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SupportStaffController.request](../../src/modules/delegated_access/controllers/support-staff.controller.ts)

### Descripción de negocio

Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La secretaria pide entrar a un hospital o asistir a sus doctores.

### Descripción del sistema

NestJS resuelve `POST /support-engagement-requests` en `SupportStaffController_request`. El controlador delega en `SupportStaffService.request`. Valida el body como `CreateEngagementRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportLinksCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEngagementRequestDto`; los campos opcionales se omiten.

```http
POST /support-engagement-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": "ORGANIZATION"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPPORT_STAFF`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 20, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `roleTemplateCode` | No | `string` | valores: `SECRETARY` | Sin descripción específica en el contrato OpenAPI. | `SECRETARY` |
| `message` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items` | Sí | `array<SupportTargetDto>` | mínimo 1 elemento(s); máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"targetKind":"ORGANIZATION","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].targetKind` | Sí | `string` | valores: `ORGANIZATION`, `SITE`, `SERVICE`, `SPACE`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `ORGANIZATION` |
| `items[].practiceSiteId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /support-engagement-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "roleTemplateCode": "SECRETARY",
  "message": "valor-ejemplo",
  "items": [
    {
      "targetKind": "ORGANIZATION",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportLinksCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportLinksCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "kind": "LOCATION",
      "targetKind": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "userId": "00000000-0000-4000-8000-000000000001",
      "personName": "Nombre de ejemplo",
      "status": "PENDING",
      "initiatedBy": "SUPPORT_STAFF",
      "awaiting": "SUPPORT_STAFF",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del primer vínculo creado. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<SupportLinkViewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","kind":"LOCATION","targetKind":{},"tenantId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","userId":"00000000-0000-4000-8000-000000000001","personName":"Nombre de ejemplo","status":"PENDING","initiatedBy":"SUPPORT_STAFF","awaiting":"SUPPORT_STAFF","practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].kind` | Sí | `string` | valores: `LOCATION`, `PRACTITIONER` | Sin descripción específica en el contrato OpenAPI. | `LOCATION` |
| `items[].targetKind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].personName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `items[].initiatedBy` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `SUPPORT_STAFF` |
| `items[].awaiting` | No | `string` | valores: `SUPPORT_STAFF`, `ORGANIZATION`, `PRACTITIONER` | Quién tiene que aceptar o rechazar; null si ya se decidió. | `SUPPORT_STAFF` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerRoleAssignmentId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetName` | No | `string` | admite null | Nombre del doctor, la sede, el servicio o el piso. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPPORT_STAFF. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 404 | `NOT_FOUND` | Objetivo no encontrado en esa organización | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 409 | `CONFLICT` | Ya hay un vínculo vivo con ese mismo objetivo | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objetivo ${item.targetKind} exige ${field} | Excepción explícita en src/modules/delegated_access/services/support-staff.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 20, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/support-engagement-requests"
}
```

---

