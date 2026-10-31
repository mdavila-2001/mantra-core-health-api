<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `delegated_access`

Referencia exhaustiva de 17 operación(es) del módulo `delegated_access`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `clinical-prescription-shares`, `clinical-prescription-shares-public`, `delegated-access-authz`, `delegated-access-org`, `delegated-access-permission-sets`, `delegated-access-practitioner-delegates`, `delegated-access-requests`
- **Controladores:** `AccessRequestsController`, `DelegatedAccessAuthzController`, `DelegatedPermissionSetsController`, `OrgUserAssignmentsController`, `PractitionerDelegatesController`, `PrescriptionSharesController`, `PrescriptionSharesPublicController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /access-requests/{id}/decision](#1-post-access-requests-id-decision) — Aprobar/Denegar solicitud y emitir grant scoped
2. [POST /authz/effective-actor/evaluate](#2-post-authz-effective-actor-evaluate) — Evaluar actor efectivo por propósito (step-up)
3. [GET /clinical/prescription-shares](#3-get-clinical-prescription-shares) — Enlaces de receta de un paciente
4. [POST /clinical/prescription-shares](#4-post-clinical-prescription-shares) — Compartir una receta con un enlace
5. [POST /clinical/prescription-shares/{shareId}/revoke](#5-post-clinical-prescription-shares-shareid-revoke) — Revocar un enlace de receta
6. [GET /clinical/prescription-shares/by-token/{token}](#6-get-clinical-prescription-shares-by-token-token) — Saber si un enlace es de la sesión
7. [POST /delegated-access/expiry-sweep](#7-post-delegated-access-expiry-sweep) — Expirar delegaciones y grants vencidos (barrido)
8. [GET /delegated-permission-sets](#8-get-delegated-permission-sets) — Listar los sets de permisos delegados del tenant
9. [POST /delegated-permission-sets](#9-post-delegated-permission-sets) — Publicar set de permisos delegados (scoped)
10. [POST /delegated-permission-sets/{id}/versions](#10-post-delegated-permission-sets-id-versions) — Versionar set de permisos delegados
11. [POST /org/{tenantMembershipId}/user-assignments](#11-post-org-tenantmembershipid-user-assignments) — Asignar usuario de organización con alcance y vigencia
12. [PATCH /org/user-assignments/{id}](#12-patch-org-user-assignments-id) — Reasignar supervisor / suspender asignación de organización
13. [POST /practitioner-delegates](#13-post-practitioner-delegates) — Crear asignación de delegado de practitioner
14. [POST /practitioner-delegates/{id}/access-requests](#14-post-practitioner-delegates-id-access-requests) — Solicitar acceso delegado (aprobación previa)
15. [POST /practitioner-delegates/{id}/grants](#15-post-practitioner-delegates-id-grants) — Otorgar grant delegado por-propósito y temporal
16. [POST /practitioner-delegates/{id}/revoke](#16-post-practitioner-delegates-id-revoke) — Revocar delegación de forma inmediata (cascada authz)
17. [GET /public/prescription-shares/{token}](#17-get-public-prescription-shares-token) — Comprobar un enlace de receta compartida

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
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/delegated_access/services/access-requests.service.ts |
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

## 2. POST /authz/effective-actor/evaluate

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

## 3. GET /clinical/prescription-shares

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

## 4. POST /clinical/prescription-shares

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

## 5. POST /clinical/prescription-shares/{shareId}/revoke

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

## 6. GET /clinical/prescription-shares/by-token/{token}

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

## 7. POST /delegated-access/expiry-sweep

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

## 8. GET /delegated-permission-sets

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

## 9. POST /delegated-permission-sets

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

## 10. POST /delegated-permission-sets/{id}/versions

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

## 11. POST /org/{tenantMembershipId}/user-assignments

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
| `role` | No | `string` | valores: `STAFF`, `SECRETARY`, `ASSISTANT`, `NURSE`, `BILLING` | Rol de la asignación | `STAFF` |
| `accessScope` | No | `string` | valores: `TENANT`, `PRACTICE`, `SITE`, `UNIT` | Alcance de acceso | `TENANT` |
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

## 12. PATCH /org/user-assignments/{id}

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
| `supervisorUserId` | No | `string` | formato `uuid` | Nuevo supervisor | `00000000-0000-4000-8000-000000000001` |
| `accessScope` | No | `string` | valores: `TENANT`, `PRACTICE`, `SITE`, `UNIT` | Nuevo alcance de acceso | `TENANT` |
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

## 13. POST /practitioner-delegates

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

## 14. POST /practitioner-delegates/{id}/access-requests

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
| 404 | `NOT_FOUND` | Delegación no encontrada | Excepción explícita en src/modules/delegated_access/services/access-requests.service.ts |
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

## 15. POST /practitioner-delegates/{id}/grants

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

## 16. POST /practitioner-delegates/{id}/revoke

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

## 17. GET /public/prescription-shares/{token}

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

