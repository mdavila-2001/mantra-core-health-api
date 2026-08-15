<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `surveys`

Referencia exhaustiva de 12 operación(es) del módulo `surveys`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `surveys-assignments`, `surveys-patient`, `surveys-templates`
- **Controladores:** `SurveysAssignmentsController`, `SurveysPatientController`, `SurveysTemplatesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /surveys/assignments](#1-post-surveys-assignments) — Asociar una encuesta a una consulta o servicio
2. [POST /surveys/invitations](#2-post-surveys-invitations) — Emitir los cuestionarios de una atención completada
3. [GET /surveys/me/invitations](#3-get-surveys-me-invitations) — Ver mis cuestionarios
4. [GET /surveys/me/invitations/{id}](#4-get-surveys-me-invitations-id) — Abrir un cuestionario para responderlo
5. [POST /surveys/me/invitations/{id}/responses](#5-post-surveys-me-invitations-id-responses) — Responder el cuestionario
6. [GET /surveys/templates](#6-get-surveys-templates) — Listar mis encuestas
7. [POST /surveys/templates](#7-post-surveys-templates) — Crear una encuesta para pacientes
8. [GET /surveys/templates/{id}](#8-get-surveys-templates-id) — Ver una encuesta y su cuestionario
9. [POST /surveys/templates/{id}/deactivate](#9-post-surveys-templates-id-deactivate) — Desactivar la encuesta
10. [POST /surveys/templates/{id}/questions](#10-post-surveys-templates-id-questions) — Configurar una pregunta y su tipo de respuesta
11. [GET /surveys/templates/{id}/responses](#11-get-surveys-templates-id-responses) — Revisar las respuestas de los pacientes
12. [POST /surveys/templates/{id}/versions/{versionNumber}/publish](#12-post-surveys-templates-id-versions-versionnumber-publish) — Publicar la encuesta y configurar su vigencia

---

## 1. POST /surveys/assignments

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-assignments`
- **Nombre:** Asociar una encuesta a una consulta o servicio
- **Operation ID:** `SurveysAssignmentsController_createAssignment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysAssignmentsController.createAssignment](../../src/modules/surveys/controllers/surveys-assignments.controller.ts)

### Descripción de negocio

Asociar una encuesta a una consulta o servicio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Asocia una versión publicada a una consulta o a un servicio.

### Descripción del sistema

NestJS resuelve `POST /surveys/assignments` en `SurveysAssignmentsController_createAssignment`. El controlador delega en `SurveysAssignmentsService.createAssignment`. Valida el body como `CreateAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAssignmentDto`; los campos opcionales se omiten.

```http
POST /surveys/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `surveyVersionId` | Sí | `string` | formato `uuid` | Versión publicada que se reparte | `00000000-0000-4000-8000-000000000001` |
| `targetType` | Sí | `string` | valores: `APPOINTMENT`, `SERVICE`, `CARE_TYPE` | Qué se evalúa: la reserva, el servicio o el tipo de atención | `APPOINTMENT` |
| `targetId` | Sí | `string` | formato `uuid` | Identificador de la cosa evaluada, según `targetType` | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /surveys/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 409 | `CONFLICT` | Ya existe una asignación activa de esa versión a ese destino | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El modelo de agenda no lleva tipo de atención en la reserva: asigná la encuesta por servicio o por cita concreta | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo se puede asignar una versión publicada | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/assignments"
}
```

---

## 2. POST /surveys/invitations

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-assignments`
- **Nombre:** Emitir los cuestionarios de una atención completada
- **Operation ID:** `SurveysAssignmentsController_issueInvitations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysAssignmentsController.issueInvitations](../../src/modules/surveys/controllers/surveys-assignments.controller.ts)

### Descripción de negocio

Emitir los cuestionarios de una atención completada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Emite las invitaciones que correspondan a una atención completada.

### Descripción del sistema

NestJS resuelve `POST /surveys/invitations` en `SurveysAssignmentsController_issueInvitations`. El controlador delega en `SurveysAssignmentsService.issueForBooking`. Valida el body como `IssueInvitationsDto` y consume `application/json`. El tipo de retorno estático es `Promise<InvitationsIssuedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueInvitationsDto`; los campos opcionales se omiten.

```http
POST /surveys/invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "appointmentBookingId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `appointmentBookingId` | Sí | `string` | formato `uuid` | Reserva completada que habilita las invitaciones | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /surveys/invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "appointmentBookingId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InvitationsIssuedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ids": [
    "valor-ejemplo"
  ],
  "alreadyIssued": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ids` | Sí | `array<string>` | formato `uuid` | Valor de ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `alreadyIssued` | Sí | `number` | Sin restricción adicional declarada | Invitaciones que ya existían para esa reserva y no se duplicaron | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reserva no encontrada | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se emiten cuestionarios sobre una atención completada | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/invitations"
}
```

---

## 3. GET /surveys/me/invitations

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-patient`
- **Nombre:** Ver mis cuestionarios
- **Operation ID:** `SurveysPatientController_listMyInvitations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysPatientController.listMyInvitations](../../src/modules/surveys/controllers/surveys-patient.controller.ts)

### Descripción de negocio

Ver mis cuestionarios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Los cuestionarios del paciente de la sesión.

### Descripción del sistema

NestJS resuelve `GET /surveys/me/invitations` en `SurveysPatientController_listMyInvitations`. El controlador delega en `SurveysResponsesService.listMyInvitations`. No recibe body. El tipo de retorno estático es `Promise<PatientInvitationDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /surveys/me/invitations HTTP/1.1
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
GET /surveys/me/invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientInvitationDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientInvitationDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientInvitationDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientInvitationDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientInvitationDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientInvitationDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientInvitationDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "title": "valor-ejemplo",
    "description": "Texto descriptivo de ejemplo",
    "status": "PENDING",
    "issuedAt": "2026-07-31T12:00:00.000Z",
    "expiresAt": "2026-07-31T12:00:00.000Z",
    "answeredAt": "2026-07-31T12:00:00.000Z",
    "appointmentBookingId": "00000000-0000-4000-8000-000000000001"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil de paciente asociado | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/me/invitations"
}
```

---

## 4. GET /surveys/me/invitations/{id}

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-patient`
- **Nombre:** Abrir un cuestionario para responderlo
- **Operation ID:** `SurveysPatientController_getMyQuestionnaire`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysPatientController.getMyQuestionnaire](../../src/modules/surveys/controllers/surveys-patient.controller.ts)

### Descripción de negocio

Abrir un cuestionario para responderlo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El cuestionario a responder, con sus preguntas.

### Descripción del sistema

NestJS resuelve `GET /surveys/me/invitations/{id}` en `SurveysPatientController_getMyQuestionnaire`. El controlador delega en `SurveysResponsesService.getMyQuestionnaire`. No recibe body. El tipo de retorno estático es `Promise<PatientQuestionnaireDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /surveys/me/invitations/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /surveys/me/invitations/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientQuestionnaireDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "questions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "position": 1,
      "questionText": "valor-ejemplo",
      "answerType": "TEXT",
      "required": true,
      "options": [
        "valor-ejemplo"
      ],
      "scaleMin": 1,
      "scaleMax": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `questions` | Sí | `array<QuestionDto>` | Sin restricción adicional declarada | Valor de questions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","position":1,"questionText":"valor-ejemplo","answerType":"TEXT","required":true,"options":["valor-ejemplo"],"scaleMin":1,"scaleMax":1}]` |
| `questions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `questions[].position` | Sí | `number` | Sin restricción adicional declarada | Posición dentro del cuestionario | `1` |
| `questions[].questionText` | Sí | `string` | Sin restricción adicional declarada | Enunciado | `valor-ejemplo` |
| `questions[].answerType` | Sí | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Valor de answer type mantenido por la instancia. | `TEXT` |
| `questions[].required` | Sí | `boolean` | Sin restricción adicional declarada | Si es obligatoria | `true` |
| `questions[].options` | No | `array<string>` | Sin restricción adicional declarada | Opciones de elección | `["valor-ejemplo"]` |
| `questions[].scaleMin` | No | `number` | Sin restricción adicional declarada | Mínimo de la escala | `1` |
| `questions[].scaleMax` | No | `number` | Sin restricción adicional declarada | Máximo de la escala | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuestionario no encontrado | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil de paciente asociado | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/me/invitations/{id}"
}
```

---

## 5. POST /surveys/me/invitations/{id}/responses

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-patient`
- **Nombre:** Responder el cuestionario
- **Operation ID:** `SurveysPatientController_submitResponse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysPatientController.submitResponse](../../src/modules/surveys/controllers/surveys-patient.controller.ts)

### Descripción de negocio

Responder el cuestionario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Envía la respuesta. Una sola vez y completa.

### Descripción del sistema

NestJS resuelve `POST /surveys/me/invitations/{id}/responses` en `SurveysPatientController_submitResponse`. El controlador delega en `SurveysResponsesService.submitResponse`. Valida el body como `SubmitResponseDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitResponseDto`; los campos opcionales se omiten.

```http
POST /surveys/me/invitations/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
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
| `answers` | Sí | `array<AnswerInputDto>` | mínimo 1 elemento(s); máximo 200 elemento(s) | Respuestas del cuestionario | `[{"questionId":"00000000-0000-4000-8000-000000000001","valueText":"valor-ejemplo","valueNumber":1,"valueBoolean":true,"valueChoices":["valor-ejemplo"]}]` |
| `answers[].questionId` | Sí | `string` | formato `uuid` | Pregunta contestada | `00000000-0000-4000-8000-000000000001` |
| `answers[].valueText` | No | `string` | longitud máxima 4000 | Respuesta de texto libre (TEXT) | `valor-ejemplo` |
| `answers[].valueNumber` | No | `number` | Sin restricción adicional declarada | Respuesta numérica (SCALE) | `1` |
| `answers[].valueBoolean` | No | `boolean` | Sin restricción adicional declarada | Respuesta sí/no (BOOLEAN) | `true` |
| `answers[].valueChoices` | No | `array<string>` | longitud máxima 200; mínimo 1 elemento(s); máximo 20 elemento(s) | Opciones elegidas (SINGLE_CHOICE / MULTIPLE_CHOICE) | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /surveys/me/invitations/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "00000000-0000-4000-8000-000000000001",
      "valueText": "valor-ejemplo",
      "valueNumber": 1,
      "valueBoolean": true,
      "valueChoices": [
        "valor-ejemplo"
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuestionario no encontrado | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 409 | `CONFLICT` | Este cuestionario ya fue respondido | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El plazo para responder este cuestionario venció | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil de paciente asociado | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Hay más de una respuesta para la misma pregunta | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | La respuesta no corresponde a una pregunta de este cuestionario | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Faltan respuestas a preguntas obligatorias | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta pregunta espera una respuesta de texto | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta pregunta espera un valor numérico | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | El valor está fuera de la escala de la pregunta | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta pregunta espera sí o no | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta pregunta espera al menos una opción | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta pregunta admite una sola opción | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Se eligieron opciones que la pregunta no ofrece | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Hay opciones repetidas en la respuesta | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 422 | `PRECONDITION_FAILED` | Tipo de pregunta desconocido | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/me/invitations/{id}/responses"
}
```

---

## 6. GET /surveys/templates

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Listar mis encuestas
- **Operation ID:** `SurveysTemplatesController_listTemplates`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.listTemplates](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Listar mis encuestas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lista las encuestas del profesional.

### Descripción del sistema

NestJS resuelve `GET /surveys/templates` en `SurveysTemplatesController_listTemplates`. El controlador delega en `SurveysTemplatesService.listTemplates`. No recibe body. El tipo de retorno estático es `Promise<TemplateSummaryDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /surveys/templates HTTP/1.1
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
GET /surveys/templates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TemplateSummaryDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<TemplateSummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<TemplateSummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<TemplateSummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<TemplateSummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<TemplateSummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TemplateSummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "title": "valor-ejemplo",
    "description": "Texto descriptivo de ejemplo",
    "status": "DRAFT",
    "latestVersionNumber": 1,
    "published": true,
    "questionCount": 1
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates"
}
```

---

## 7. POST /surveys/templates

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Crear una encuesta para pacientes
- **Operation ID:** `SurveysTemplatesController_createTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.createTemplate](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Crear una encuesta para pacientes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea la plantilla y su versión 1 en borrador.

### Descripción del sistema

NestJS resuelve `POST /surveys/templates` en `SurveysTemplatesController_createTemplate`. El controlador delega en `SurveysTemplatesService.createTemplate`. Valida el body como `CreateTemplateDto` y consume `application/json`. El tipo de retorno estático es `Promise<TemplateCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTemplateDto`; los campos opcionales se omiten.

```http
POST /surveys/templates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Título del instrumento | `valor-ejemplo` |
| `description` | No | `string` | longitud máxima 2000 | Consigna que ve el paciente antes de responder | `Texto descriptivo de ejemplo` |
| `ownerPractitionerId` | No | `string` | formato `uuid` | Profesional dueño. Por defecto, el perfil profesional del actor. | `00000000-0000-4000-8000-000000000001` |
| `responseWindowDays` | No | `number` | mínimo 1; máximo 365 | Días que tendrá el paciente para responder desde que se le emite la invitación | `30` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /surveys/templates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "ownerPractitionerId": "00000000-0000-4000-8000-000000000001",
  "responseWindowDays": 30
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TemplateCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Versión 1 (borrador) creada | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Número de la versión creada | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates"
}
```

---

## 8. GET /surveys/templates/{id}

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Ver una encuesta y su cuestionario
- **Operation ID:** `SurveysTemplatesController_getTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.getTemplate](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Ver una encuesta y su cuestionario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Devuelve la encuesta con el cuestionario de su última versión.

### Descripción del sistema

NestJS resuelve `GET /surveys/templates/{id}` en `SurveysTemplatesController_getTemplate`. El controlador delega en `SurveysTemplatesService.getTemplate`. No recibe body. El tipo de retorno estático es `Promise<TemplateDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /surveys/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /surveys/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TemplateDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TemplateDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TemplateDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TemplateDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<TemplateDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TemplateDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TemplateDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TemplateDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "latestVersionId": "00000000-0000-4000-8000-000000000001",
  "responseWindowDays": 1,
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z",
  "questions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "position": 1,
      "questionText": "valor-ejemplo",
      "answerType": "TEXT",
      "required": true,
      "options": [
        "valor-ejemplo"
      ],
      "scaleMin": 1,
      "scaleMax": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `latestVersionId` | Sí | `string` | formato `uuid` | Última versión | `00000000-0000-4000-8000-000000000001` |
| `responseWindowDays` | Sí | `number` | Sin restricción adicional declarada | Días de plazo para responder | `1` |
| `effectiveFrom` | No | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `effectiveTo` | No | `string` | formato `date-time` | Valor de effective to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `questions` | Sí | `array<QuestionDto>` | Sin restricción adicional declarada | Valor de questions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","position":1,"questionText":"valor-ejemplo","answerType":"TEXT","required":true,"options":["valor-ejemplo"],"scaleMin":1,"scaleMax":1}]` |
| `questions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `questions[].position` | Sí | `number` | Sin restricción adicional declarada | Posición dentro del cuestionario | `1` |
| `questions[].questionText` | Sí | `string` | Sin restricción adicional declarada | Enunciado | `valor-ejemplo` |
| `questions[].answerType` | Sí | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Valor de answer type mantenido por la instancia. | `TEXT` |
| `questions[].required` | Sí | `boolean` | Sin restricción adicional declarada | Si es obligatoria | `true` |
| `questions[].options` | No | `array<string>` | Sin restricción adicional declarada | Opciones de elección | `["valor-ejemplo"]` |
| `questions[].scaleMin` | No | `number` | Sin restricción adicional declarada | Mínimo de la escala | `1` |
| `questions[].scaleMax` | No | `number` | Sin restricción adicional declarada | Máximo de la escala | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}"
}
```

---

## 9. POST /surveys/templates/{id}/deactivate

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Desactivar la encuesta
- **Operation ID:** `SurveysTemplatesController_deactivateTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.deactivateTemplate](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Desactivar la encuesta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Desactiva la encuesta: corta las emisiones nuevas sin borrar nada.

### Descripción del sistema

NestJS resuelve `POST /surveys/templates/{id}/deactivate` en `SurveysTemplatesController_deactivateTemplate`. El controlador delega en `SurveysTemplatesService.deactivateTemplate`. No recibe body. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /surveys/templates/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
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
POST /surveys/templates/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 409 | `CONFLICT` | La plantilla ya está desactivada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}/deactivate"
}
```

---

## 10. POST /surveys/templates/{id}/questions

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Configurar una pregunta y su tipo de respuesta
- **Operation ID:** `SurveysTemplatesController_addQuestion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.addQuestion](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Configurar una pregunta y su tipo de respuesta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Agrega una pregunta a la versión en borrador.

### Descripción del sistema

NestJS resuelve `POST /surveys/templates/{id}/questions` en `SurveysTemplatesController_addQuestion`. El controlador delega en `SurveysTemplatesService.addQuestion`. Valida el body como `AddQuestionDto` y consume `application/json`. El tipo de retorno estático es `Promise<QuestionDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddQuestionDto`; los campos opcionales se omiten.

```http
POST /surveys/templates/00000000-0000-4000-8000-000000000001/questions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "questionText": "valor-ejemplo",
  "answerType": "TEXT"
}
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
| `questionText` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Enunciado de la pregunta | `valor-ejemplo` |
| `answerType` | Sí | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Tipo de respuesta esperado | `TEXT` |
| `required` | No | `boolean` | Sin restricción adicional declarada | Si responderla es obligatorio para poder enviar | `false` |
| `options` | No | `array<string>` | longitud máxima 200; mínimo 2 elemento(s); máximo 20 elemento(s) | Opciones. Obligatorias en SINGLE_CHOICE / MULTIPLE_CHOICE, prohibidas en el resto. | `["valor-ejemplo","valor-ejemplo"]` |
| `scaleMin` | No | `number` | mínimo 0; máximo 100 | Mínimo de la escala. Solo para SCALE. | `1` |
| `scaleMax` | No | `number` | mínimo 1; máximo 100 | Máximo de la escala. Solo para SCALE. | `5` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /surveys/templates/00000000-0000-4000-8000-000000000001/questions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "questionText": "valor-ejemplo",
  "answerType": "TEXT",
  "required": false,
  "options": [
    "valor-ejemplo",
    "valor-ejemplo"
  ],
  "scaleMin": 1,
  "scaleMax": 5
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<QuestionDto>` | No |
| 400 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 401 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 403 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 404 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 409 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 413 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 422 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 429 | Operación completada correctamente. | `Promise<QuestionDto>` | No |
| 500 | Operación completada correctamente. | `Promise<QuestionDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QuestionDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "position": 1,
  "questionText": "valor-ejemplo",
  "answerType": "TEXT",
  "required": true,
  "options": [
    "valor-ejemplo"
  ],
  "scaleMin": 1,
  "scaleMax": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `position` | Sí | `number` | Sin restricción adicional declarada | Posición dentro del cuestionario | `1` |
| `questionText` | Sí | `string` | Sin restricción adicional declarada | Enunciado | `valor-ejemplo` |
| `answerType` | Sí | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Valor de answer type mantenido por la instancia. | `TEXT` |
| `required` | Sí | `boolean` | Sin restricción adicional declarada | Si es obligatoria | `true` |
| `options` | No | `array<string>` | Sin restricción adicional declarada | Opciones de elección | `["valor-ejemplo"]` |
| `scaleMin` | No | `number` | Sin restricción adicional declarada | Mínimo de la escala | `1` |
| `scaleMax` | No | `number` | Sin restricción adicional declarada | Máximo de la escala | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión ya está publicada: cree una versión nueva para modificar el cuestionario | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Las preguntas de elección requieren al menos dos opciones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Este tipo de pregunta no admite opciones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Las opciones no pueden repetirse | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | El máximo de la escala debe ser mayor que el mínimo | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}/questions"
}
```

---

## 11. GET /surveys/templates/{id}/responses

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Revisar las respuestas de los pacientes
- **Operation ID:** `SurveysTemplatesController_listResponses`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.listResponses](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Revisar las respuestas de los pacientes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Las respuestas recibidas por la encuesta. Cuelga de la plantilla y no de un recurso `/surveys/responses` propio a propósito: la plantilla es la unidad de autorización —su dueño— y así no existe ninguna ruta de respuestas a la que se pueda llegar sin pasar por esa comprobación.

### Descripción del sistema

NestJS resuelve `GET /surveys/templates/{id}/responses` en `SurveysTemplatesController_listResponses`. El controlador delega en `SurveysResponsesService.listTemplateResponses`. No recibe body. El tipo de retorno estático es `Promise<SurveyResponseDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /surveys/templates/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
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
GET /surveys/templates/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SurveyResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<SurveyResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<SurveyResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<SurveyResponseDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<SurveyResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<SurveyResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<SurveyResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SurveyResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "invitationId": "00000000-0000-4000-8000-000000000001",
    "patientProfileId": "00000000-0000-4000-8000-000000000001",
    "appointmentBookingId": "00000000-0000-4000-8000-000000000001",
    "submittedAt": "2026-07-31T12:00:00.000Z",
    "answers": [
      {
        "questionId": "00000000-0000-4000-8000-000000000001",
        "questionText": "valor-ejemplo",
        "answerType": "TEXT",
        "valueText": "valor-ejemplo",
        "valueNumber": 1,
        "valueBoolean": true,
        "valueChoices": [
          "valor-ejemplo"
        ]
      }
    ]
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}/responses"
}
```

---

## 12. POST /surveys/templates/{id}/versions/{versionNumber}/publish

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Publicar la encuesta y configurar su vigencia
- **Operation ID:** `SurveysTemplatesController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.publishVersion](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Publicar la encuesta y configurar su vigencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Publica la versión y le fija vigencia.

### Descripción del sistema

NestJS resuelve `POST /surveys/templates/{id}/versions/{versionNumber}/publish` en `SurveysTemplatesController_publishVersion`. El controlador delega en `SurveysTemplatesService.publishVersion`. Valida el body como `PublishVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | path | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishVersionDto`; los campos opcionales se omiten.

```http
POST /surveys/templates/00000000-0000-4000-8000-000000000001/versions/1/publish HTTP/1.1
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
| `effectiveFrom` | No | `string` | formato `date-time` | Inicio de vigencia (ISO-8601). Por defecto, ahora. | `2026-07-31T12:00:00.000Z` |
| `effectiveTo` | No | `string` | formato `date-time` | Fin de vigencia (ISO-8601). Sin él, vigencia abierta. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /surveys/templates/00000000-0000-4000-8000-000000000001/versions/1/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 409 | `CONFLICT` | La versión ya fue publicada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede publicar un cuestionario sin preguntas | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | El fin de vigencia debe ser posterior al inicio | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}/versions/{versionNumber}/publish"
}
```

---

