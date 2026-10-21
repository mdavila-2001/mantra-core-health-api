<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `surveys`

- **Bloque:** —
- **Operaciones:** 12 (12 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 6 · BAJO 5
- **Tablas distintas que tocan:** 9
- **Respuestas de error y detalle contractual:** `openapi/endpoints/surveys.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/surveys/assignments` | Asociar una encuesta a una consulta o servicio | MEDIO | 4 | PRACTITIONER, CLINICIAN |
| 2 | POST | `/surveys/invitations` | Emitir los cuestionarios de una atención completada | MEDIO | 7 | PRACTITIONER, CLINICIAN |
| 3 | GET | `/surveys/me/invitations` | Ver mis cuestionarios | BAJO | 3 | sesión (sin roles) |
| 4 | GET | `/surveys/me/invitations/{id}` | Abrir un cuestionario para responderlo | BAJO | 4 | sesión (sin roles) |
| 5 | POST | `/surveys/me/invitations/{id}/responses` | Responder el cuestionario | ALTO | 5 | sesión (sin roles) |
| 6 | GET | `/surveys/templates` | Listar mis encuestas | BAJO | 3 | PRACTITIONER, CLINICIAN |
| 7 | POST | `/surveys/templates` | Crear una encuesta para pacientes | MEDIO | 2 | PRACTITIONER, CLINICIAN |
| 8 | GET | `/surveys/templates/{id}` | Ver una encuesta y su cuestionario | BAJO | 3 | PRACTITIONER, CLINICIAN |
| 9 | POST | `/surveys/templates/{id}/deactivate` | Desactivar la encuesta | MEDIO | 2 | PRACTITIONER, CLINICIAN |
| 10 | POST | `/surveys/templates/{id}/questions` | Configurar una pregunta y su tipo de respuesta | MEDIO | 4 | PRACTITIONER, CLINICIAN |
| 11 | GET | `/surveys/templates/{id}/responses` | Revisar las respuestas de los pacientes | BAJO | 6 | PRACTITIONER, CLINICIAN |
| 12 | POST | `/surveys/templates/{id}/versions/{versionNumber}/publish` | Publicar la encuesta y configurar su vigencia | MEDIO | 5 | PRACTITIONER, CLINICIAN |

---

## 1. POST /surveys/assignments

- **Origen:** CONTRATO
- **Nombre:** Asociar una encuesta a una consulta o servicio
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysAssignmentsController.createAssignment` — `src/modules/surveys/controllers/surveys-assignments.controller.ts:32`

### Qué es y para qué sirve (negocio)

Asociar una encuesta a una consulta o servicio. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`POST /surveys/assignments` la atiende `SurveysAssignmentsController.createAssignment` (src/modules/surveys/controllers/surveys-assignments.controller.ts:32). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreateAssignmentDto` (3 campos, 3 obligatorios). Delega en `SurveysAssignmentsService.createAssignment`. Crea filas en surveys.survey_assignments. Lee surveys.survey_assignments, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-assignments.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_assignments` | ESCRIBE | CREA | DIRECTA | SurveysAssignmentsController.createAssignment → SurveysAssignmentsService.createAssignment → AssignmentsRepository.create | `src/modules/surveys/repositories/assignments.repository.ts:119` |
| `surveys.survey_assignments` | LEE | LEE | DIRECTA | SurveysAssignmentsController.createAssignment → SurveysAssignmentsService.createAssignment → AssignmentsRepository.findActiveDuplicate | `src/modules/surveys/repositories/assignments.repository.ts:63` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysAssignmentsController.createAssignment → SurveysAssignmentsService.createAssignment → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysAssignmentsController.createAssignment → SurveysAssignmentsService.createAssignment → TemplatesRepository.findVersionById | `src/modules/surveys/repositories/templates.repository.ts:162` |

### Cuerpo — DTO `CreateAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `surveyVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión publicada que se reparte | `src/modules/surveys/dto/create-assignment.dto.ts:21` |
| `targetType` | `string` | Sí | valores: APPOINTMENT, SERVICE, CARE_TYPE | `@IsIn(TARGET_TYPE_CODES as readonly string[])` | Qué se evalúa: la reserva, el servicio o el tipo de atención | `src/modules/surveys/dto/create-assignment.dto.ts:31` |
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | Identificador de la cosa evaluada, según `targetType` | `src/modules/surveys/dto/create-assignment.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:10` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una asignación activa de esa versión a ese destino |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El modelo de agenda no lleva tipo de atención en la reserva: asigná la encuesta por servicio o por cita concreta; PreconditionFailedException: Solo se puede asignar una versión publicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /surveys/invitations

- **Origen:** CONTRATO
- **Nombre:** Emitir los cuestionarios de una atención completada
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysAssignmentsController.issueInvitations` — `src/modules/surveys/controllers/surveys-assignments.controller.ts:45`

### Qué es y para qué sirve (negocio)

Emitir los cuestionarios de una atención completada. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`POST /surveys/invitations` la atiende `SurveysAssignmentsController.issueInvitations` (src/modules/surveys/controllers/surveys-assignments.controller.ts:45). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `IssueInvitationsDto` (1 campo, 1 obligatorio). Delega en `SurveysAssignmentsService.issueForBooking`. Crea filas en surveys.survey_invitations. Lee scheduling.appointment_bookings, scheduling.bookable_slots, surveys.survey_assignments, surveys.survey_invitations, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-assignments.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SurveysAssignmentsController.issueInvitations → SurveysAssignmentsService.issueForBooking | `src/modules/surveys/services/surveys-assignments.service.ts:163` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SurveysAssignmentsController.issueInvitations → SurveysAssignmentsService.issueForBooking → SurveysAssignmentsService.resolveTargets | `src/modules/surveys/services/surveys-assignments.service.ts:267` |
| `surveys.survey_assignments` | LEE | LEE | DIRECTA | SurveysAssignmentsController.issueInvitations → SurveysAssignmentsService.issueForBooking → AssignmentsRepository.listActiveByTargets | `src/modules/surveys/repositories/assignments.repository.ts:89` |
| `surveys.survey_invitations` | ESCRIBE | CREA | DIRECTA | SurveysAssignmentsController.issueInvitations → SurveysAssignmentsService.issueForBooking → InvitationsRepository.create | `src/modules/surveys/repositories/invitations.repository.ts:121` |
| `surveys.survey_invitations` | LEE | LEE | DIRECTA | SurveysAssignmentsController.issueInvitations → SurveysAssignmentsService.issueForBooking → InvitationsRepository.listByBooking | `src/modules/surveys/repositories/invitations.repository.ts:92` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysAssignmentsController.issueInvitations → SurveysAssignmentsService.issueForBooking → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysAssignmentsController.issueInvitations → SurveysAssignmentsService.issueForBooking → TemplatesRepository.findVersionById | `src/modules/surveys/repositories/templates.repository.ts:162` |

### Cuerpo — DTO `IssueInvitationsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `appointmentBookingId` | `string` | Sí | formato uuid | `@IsUUID()` | Reserva completada que habilita las invitaciones | `src/modules/surveys/dto/issue-invitations.dto.ts:22` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "appointmentBookingId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "appointmentBookingId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<InvitationsIssuedDto>` · DTO `InvitationsIssuedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ids` | `array<string>` | Sí | formato uuid | — | Valor de ids mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:181` |
| `alreadyIssued` | `number` | Sí | — | — | Invitaciones que ya existían para esa reserva y no se duplicaron | `src/modules/surveys/dto/responses.dto.ts:190` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se emiten cuestionarios sobre una atención completada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /surveys/me/invitations

- **Origen:** CONTRATO
- **Nombre:** Ver mis cuestionarios
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysPatientController.listMyInvitations` — `src/modules/surveys/controllers/surveys-patient.controller.ts:42`

### Qué es y para qué sirve (negocio)

Ver mis cuestionarios. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`GET /surveys/me/invitations` la atiende `SurveysPatientController.listMyInvitations` (src/modules/surveys/controllers/surveys-patient.controller.ts:42). Exige sesión; el controlador no declara roles. Delega en `SurveysResponsesService.listMyInvitations`. Lee surveys.survey_invitations, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/surveys/controllers/surveys-patient.controller.ts:42` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_invitations` | LEE | LEE | DIRECTA | SurveysPatientController.listMyInvitations → SurveysResponsesService.listMyInvitations → SurveysResponsesService.listInvitationsOf → InvitationsRepository.listByPatient | `src/modules/surveys/repositories/invitations.repository.ts:71` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysPatientController.listMyInvitations → SurveysResponsesService.listMyInvitations → SurveysResponsesService.loadTemplateOfInvitation → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysPatientController.listMyInvitations → SurveysResponsesService.listMyInvitations → SurveysResponsesService.loadTemplateOfInvitation → TemplatesRepository.findVersionById | `src/modules/surveys/repositories/templates.repository.ts:162` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientInvitationDto[]>` · DTO `PatientInvitationDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:199` |
| `title` | `string` | Sí | — | — | Título del cuestionario | `src/modules/surveys/dto/responses.dto.ts:205` |
| `description` | `string` | No | — | — | Consigna | `src/modules/surveys/dto/responses.dto.ts:211` |
| `status` | `string` | Sí | valores: PENDING, ANSWERED, EXPIRED | — | Estado de la invitación | `src/modules/surveys/dto/responses.dto.ts:220` |
| `issuedAt` | `string` | Sí | formato date-time | — | Valor de issued at mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:226` |
| `expiresAt` | `string` | Sí | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:232` |
| `answeredAt` | `string` | No | formato date-time | — | Valor de answered at mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:238` |
| `appointmentBookingId` | `string` | Sí | formato uuid | — | Atención que la originó | `src/modules/surveys/dto/responses.dto.ts:244` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Solo un paciente puede ver sus cuestionarios |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysPatientController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /surveys/me/invitations/{id}

- **Origen:** CONTRATO
- **Nombre:** Abrir un cuestionario para responderlo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysPatientController.getMyQuestionnaire` — `src/modules/surveys/controllers/surveys-patient.controller.ts:51`

### Qué es y para qué sirve (negocio)

Abrir un cuestionario para responderlo. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`GET /surveys/me/invitations/{id}` la atiende `SurveysPatientController.getMyQuestionnaire` (src/modules/surveys/controllers/surveys-patient.controller.ts:51). Exige sesión; el controlador no declara roles. Delega en `SurveysResponsesService.getMyQuestionnaire`. Lee surveys.survey_invitations, surveys.survey_questions, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/surveys/controllers/surveys-patient.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/surveys/controllers/surveys-patient.controller.ts:51` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_invitations` | LEE | LEE | DIRECTA | SurveysPatientController.getMyQuestionnaire → SurveysResponsesService.getMyQuestionnaire → SurveysResponsesService.loadOwnInvitation → InvitationsRepository.findById | `src/modules/surveys/repositories/invitations.repository.ts:57` |
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SurveysPatientController.getMyQuestionnaire → SurveysResponsesService.getMyQuestionnaire → TemplatesRepository.listQuestions | `src/modules/surveys/repositories/templates.repository.ts:226` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysPatientController.getMyQuestionnaire → SurveysResponsesService.getMyQuestionnaire → SurveysResponsesService.loadTemplateOfInvitation → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysPatientController.getMyQuestionnaire → SurveysResponsesService.getMyQuestionnaire → SurveysResponsesService.loadTemplateOfInvitation → TemplatesRepository.findVersionById | `src/modules/surveys/repositories/templates.repository.ts:162` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientQuestionnaireDto>` · DTO `PatientQuestionnaireDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `questions` | `array<QuestionDto>` | Sí | — | — | Valor de questions mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:253` |
| `questions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:49` |
| `questions[].position` | `number` | Sí | — | — | Posición dentro del cuestionario | `src/modules/surveys/dto/responses.dto.ts:55` |
| `questions[].questionText` | `string` | Sí | — | — | Enunciado | `src/modules/surveys/dto/responses.dto.ts:61` |
| `questions[].answerType` | `string` | Sí | valores: TEXT, SCALE, BOOLEAN, SINGLE_CHOICE, MULTIPLE_CHOICE | — | Valor de answer type mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:67` |
| `questions[].required` | `boolean` | Sí | — | — | Si es obligatoria | `src/modules/surveys/dto/responses.dto.ts:73` |
| `questions[].options` | `array<string>` | No | — | — | Opciones de elección | `src/modules/surveys/dto/responses.dto.ts:79` |
| `questions[].scaleMin` | `number` | No | — | — | Mínimo de la escala | `src/modules/surveys/dto/responses.dto.ts:85` |
| `questions[].scaleMax` | `number` | No | — | — | Máximo de la escala | `src/modules/surveys/dto/responses.dto.ts:91` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Solo un paciente puede ver sus cuestionarios |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuestionario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysPatientController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /surveys/me/invitations/{id}/responses

- **Origen:** CONTRATO
- **Nombre:** Responder el cuestionario
- **Bloque:** —
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysPatientController.submitResponse` — `src/modules/surveys/controllers/surveys-patient.controller.ts:61`

### Qué es y para qué sirve (negocio)

Responder el cuestionario. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`POST /surveys/me/invitations/{id}/responses` la atiende `SurveysPatientController.submitResponse` (src/modules/surveys/controllers/surveys-patient.controller.ts:61). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SubmitResponseDto` (6 campos, 2 obligatorios). Delega en `SurveysResponsesService.submitResponse`. Crea filas en surveys.survey_answers, surveys.survey_responses. Actualiza surveys.survey_invitations. Lee surveys.survey_invitations, surveys.survey_questions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/surveys/controllers/surveys-patient.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/surveys/controllers/surveys-patient.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_answers` | ESCRIBE | CREA | DIRECTA | SurveysPatientController.submitResponse → SurveysResponsesService.submitResponse → ResponsesRepository.createAnswer | `src/modules/surveys/repositories/responses.repository.ts:144` |
| `surveys.survey_invitations` | ESCRIBE | ACTUALIZA | POR_TIPO | SurveysPatientController.submitResponse → SurveysResponsesService.submitResponse | `src/modules/surveys/services/surveys-responses.service.ts:137` |
| `surveys.survey_invitations` | LEE | LEE | DIRECTA | SurveysPatientController.submitResponse → SurveysResponsesService.submitResponse → SurveysResponsesService.loadOwnInvitation → InvitationsRepository.findById | `src/modules/surveys/repositories/invitations.repository.ts:57` |
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SurveysPatientController.submitResponse → SurveysResponsesService.submitResponse → TemplatesRepository.listQuestions | `src/modules/surveys/repositories/templates.repository.ts:226` |
| `surveys.survey_responses` | ESCRIBE | CREA | DIRECTA | SurveysPatientController.submitResponse → SurveysResponsesService.submitResponse → ResponsesRepository.createResponse | `src/modules/surveys/repositories/responses.repository.ts:128` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitResponseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `answers` | `array<AnswerInputDto>` | Sí | mínimo 1 elemento(s); máximo 200 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => AnswerInputDto)` | Respuestas del cuestionario | `src/modules/surveys/dto/submit-response.dto.ts:91` |
| `answers[].questionId` | `string` | Sí | formato uuid | `@IsUUID()` | Pregunta contestada | `src/modules/surveys/dto/submit-response.dto.ts:27` |
| `answers[].valueText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Respuesta de texto libre (TEXT) | `src/modules/surveys/dto/submit-response.dto.ts:36` |
| `answers[].valueNumber` | `number` | No | — | `@IsOptional()` `@IsInt()` | Respuesta numérica (SCALE) | `src/modules/surveys/dto/submit-response.dto.ts:44` |
| `answers[].valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Respuesta sí/no (BOOLEAN) | `src/modules/surveys/dto/submit-response.dto.ts:52` |
| `answers[].valueChoices` | `array<string>` | No | longitud máxima 200; mínimo 1 elemento(s); máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | Opciones elegidas (SINGLE_CHOICE / MULTIPLE_CHOICE) | `src/modules/surveys/dto/submit-response.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "answers": [
    {
      "questionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:10` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Solo un paciente puede ver sus cuestionarios |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuestionario no encontrado |
| 409 | `CONFLICT` | ConflictException: Este cuestionario ya fue respondido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El plazo para responder este cuestionario venció; PreconditionFailedException: Hay más de una respuesta para la misma pregunta; PreconditionFailedException: La respuesta no corresponde a una pregunta de este cuestionario; PreconditionFailedException: Esta pregunta espera una respuesta de texto; PreconditionFailedException: Esta pregunta espera un valor numérico; PreconditionFailedException: El valor está fuera de la escala de la pregunta; PreconditionFailedException: Esta pregunta espera sí o no; PreconditionFailedException: Esta pregunta espera al menos una opción; PreconditionFailedException: Esta pregunta admite una sola opción; PreconditionFailedException: Se eligieron opciones que la pregunta no ofrece; PreconditionFailedException: Hay opciones repetidas en la respuesta; PreconditionFailedException: Tipo de pregunta desconocido; PreconditionFailedException: Faltan respuestas a preguntas obligatorias |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysPatientController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /surveys/templates

- **Origen:** CONTRATO
- **Nombre:** Listar mis encuestas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysTemplatesController.listTemplates` — `src/modules/surveys/controllers/surveys-templates.controller.ts:62`

### Qué es y para qué sirve (negocio)

Listar mis encuestas. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`GET /surveys/templates` la atiende `SurveysTemplatesController.listTemplates` (src/modules/surveys/controllers/surveys-templates.controller.ts:62). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SurveysTemplatesService.listTemplates`. Lee surveys.survey_questions, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-templates.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SurveysTemplatesController.listTemplates → SurveysTemplatesService.listTemplates → TemplatesRepository.countQuestions | `src/modules/surveys/repositories/templates.repository.ts:241` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysTemplatesController.listTemplates → SurveysTemplatesService.listTemplates → TemplatesRepository.listTemplatesByOwner | `src/modules/surveys/repositories/templates.repository.ts:128` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysTemplatesController.listTemplates → SurveysTemplatesService.listTemplates → TemplatesRepository.findLatestVersion | `src/modules/surveys/repositories/templates.repository.ts:176` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TemplateSummaryDto[]>` · DTO `TemplateSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:100` |
| `title` | `string` | Sí | — | — | Título del instrumento | `src/modules/surveys/dto/responses.dto.ts:106` |
| `description` | `string` | No | — | — | Consigna para el paciente | `src/modules/surveys/dto/responses.dto.ts:112` |
| `status` | `string` | Sí | valores: DRAFT, ACTIVE, INACTIVE | — | Estado de la plantilla | `src/modules/surveys/dto/responses.dto.ts:121` |
| `latestVersionNumber` | `number` | Sí | — | — | Número de la última versión | `src/modules/surveys/dto/responses.dto.ts:127` |
| `published` | `boolean` | Sí | — | — | Si tiene al menos una versión publicada | `src/modules/surveys/dto/responses.dto.ts:133` |
| `questionCount` | `number` | Sí | — | — | Preguntas de la última versión | `src/modules/surveys/dto/responses.dto.ts:139` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /surveys/templates

- **Origen:** CONTRATO
- **Nombre:** Crear una encuesta para pacientes
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysTemplatesController.createTemplate` — `src/modules/surveys/controllers/surveys-templates.controller.ts:51`

### Qué es y para qué sirve (negocio)

Crear una encuesta para pacientes. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`POST /surveys/templates` la atiende `SurveysTemplatesController.createTemplate` (src/modules/surveys/controllers/surveys-templates.controller.ts:51). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreateTemplateDto` (4 campos, 1 obligatorio). Delega en `SurveysTemplatesService.createTemplate`. Crea filas en surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-templates.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_templates` | ESCRIBE | CREA | DIRECTA | SurveysTemplatesController.createTemplate → SurveysTemplatesService.createTemplate → TemplatesRepository.createTemplate | `src/modules/surveys/repositories/templates.repository.ts:144` |
| `surveys.survey_versions` | ESCRIBE | CREA | DIRECTA | SurveysTemplatesController.createTemplate → SurveysTemplatesService.createTemplate → TemplatesRepository.createVersion | `src/modules/surveys/repositories/templates.repository.ts:208` |

### Cuerpo — DTO `CreateTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Título del instrumento | `src/modules/surveys/dto/create-template.dto.ts:28` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Consigna que ve el paciente antes de responder | `src/modules/surveys/dto/create-template.dto.ts:40` |
| `ownerPractitionerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional dueño. Por defecto, el perfil profesional del actor. | `src/modules/surveys/dto/create-template.dto.ts:52` |
| `responseWindowDays` | `number` | No | mínimo 1; máximo 365 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(365)` | Días que tendrá el paciente para responder desde que se le emite la invitación | `src/modules/surveys/dto/create-template.dto.ts:68` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "title": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "ownerPractitionerId": "00000000-0000-4000-8000-000000000001",
  "responseWindowDays": 30
}
```

</details>

### Respuesta — `Promise<TemplateCreatedDto>` · DTO `TemplateCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:28` |
| `versionId` | `string` | Sí | formato uuid | — | Versión 1 (borrador) creada | `src/modules/surveys/dto/responses.dto.ts:34` |
| `versionNumber` | `number` | Sí | — | — | Número de la versión creada | `src/modules/surveys/dto/responses.dto.ts:40` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /surveys/templates/{id}

- **Origen:** CONTRATO
- **Nombre:** Ver una encuesta y su cuestionario
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysTemplatesController.getTemplate` — `src/modules/surveys/controllers/surveys-templates.controller.ts:71`

### Qué es y para qué sirve (negocio)

Ver una encuesta y su cuestionario. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`GET /surveys/templates/{id}` la atiende `SurveysTemplatesController.getTemplate` (src/modules/surveys/controllers/surveys-templates.controller.ts:71). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SurveysTemplatesService.getTemplate`. Lee surveys.survey_questions, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-templates.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/surveys/controllers/surveys-templates.controller.ts:71` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SurveysTemplatesController.getTemplate → SurveysTemplatesService.getTemplate → TemplatesRepository.listQuestions | `src/modules/surveys/repositories/templates.repository.ts:226` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysTemplatesController.getTemplate → SurveysTemplatesService.getTemplate → SurveysTemplatesService.loadOwnedTemplate → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysTemplatesController.getTemplate → SurveysTemplatesService.getTemplate → TemplatesRepository.findLatestVersion | `src/modules/surveys/repositories/templates.repository.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TemplateDetailDto>` · DTO `TemplateDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `latestVersionId` | `string` | Sí | formato uuid | — | Última versión | `src/modules/surveys/dto/responses.dto.ts:148` |
| `responseWindowDays` | `number` | Sí | — | — | Días de plazo para responder | `src/modules/surveys/dto/responses.dto.ts:154` |
| `effectiveFrom` | `string` | No | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:160` |
| `effectiveTo` | `string` | No | formato date-time | — | Valor de effective to mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:166` |
| `questions` | `array<QuestionDto>` | Sí | — | — | Valor de questions mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:172` |
| `questions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:49` |
| `questions[].position` | `number` | Sí | — | — | Posición dentro del cuestionario | `src/modules/surveys/dto/responses.dto.ts:55` |
| `questions[].questionText` | `string` | Sí | — | — | Enunciado | `src/modules/surveys/dto/responses.dto.ts:61` |
| `questions[].answerType` | `string` | Sí | valores: TEXT, SCALE, BOOLEAN, SINGLE_CHOICE, MULTIPLE_CHOICE | — | Valor de answer type mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:67` |
| `questions[].required` | `boolean` | Sí | — | — | Si es obligatoria | `src/modules/surveys/dto/responses.dto.ts:73` |
| `questions[].options` | `array<string>` | No | — | — | Opciones de elección | `src/modules/surveys/dto/responses.dto.ts:79` |
| `questions[].scaleMin` | `number` | No | — | — | Mínimo de la escala | `src/modules/surveys/dto/responses.dto.ts:85` |
| `questions[].scaleMax` | `number` | No | — | — | Máximo de la escala | `src/modules/surveys/dto/responses.dto.ts:91` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: La plantilla no tiene versiones |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /surveys/templates/{id}/deactivate

- **Origen:** CONTRATO
- **Nombre:** Desactivar la encuesta
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysTemplatesController.deactivateTemplate` — `src/modules/surveys/controllers/surveys-templates.controller.ts:106`

### Qué es y para qué sirve (negocio)

Desactivar la encuesta. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`POST /surveys/templates/{id}/deactivate` la atiende `SurveysTemplatesController.deactivateTemplate` (src/modules/surveys/controllers/surveys-templates.controller.ts:106). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SurveysTemplatesService.deactivateTemplate`. Actualiza surveys.survey_templates. Lee surveys.survey_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-templates.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/surveys/controllers/surveys-templates.controller.ts:106` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SurveysTemplatesController.deactivateTemplate → SurveysTemplatesService.deactivateTemplate | `src/modules/surveys/services/surveys-templates.service.ts:259` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysTemplatesController.deactivateTemplate → SurveysTemplatesService.deactivateTemplate → SurveysTemplatesService.loadOwnedTemplate → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OkResultDto>` · DTO `OkResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/surveys/dto/responses.dto.ts:19` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: La plantilla ya está desactivada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /surveys/templates/{id}/questions

- **Origen:** CONTRATO
- **Nombre:** Configurar una pregunta y su tipo de respuesta
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysTemplatesController.addQuestion` — `src/modules/surveys/controllers/surveys-templates.controller.ts:81`

### Qué es y para qué sirve (negocio)

Configurar una pregunta y su tipo de respuesta. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`POST /surveys/templates/{id}/questions` la atiende `SurveysTemplatesController.addQuestion` (src/modules/surveys/controllers/surveys-templates.controller.ts:81). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `AddQuestionDto` (6 campos, 2 obligatorios). Delega en `SurveysTemplatesService.addQuestion`. Crea filas en surveys.survey_questions. Lee surveys.survey_questions, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-templates.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/surveys/controllers/surveys-templates.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_questions` | ESCRIBE | CREA | DIRECTA | SurveysTemplatesController.addQuestion → SurveysTemplatesService.addQuestion → TemplatesRepository.createQuestion | `src/modules/surveys/repositories/templates.repository.ts:253` |
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SurveysTemplatesController.addQuestion → SurveysTemplatesService.addQuestion → TemplatesRepository.countQuestions | `src/modules/surveys/repositories/templates.repository.ts:241` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysTemplatesController.addQuestion → SurveysTemplatesService.addQuestion → SurveysTemplatesService.loadOwnedTemplate → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysTemplatesController.addQuestion → SurveysTemplatesService.addQuestion → TemplatesRepository.findLatestVersion | `src/modules/surveys/repositories/templates.repository.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AddQuestionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `questionText` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Enunciado de la pregunta | `src/modules/surveys/dto/add-question.dto.ts:34` |
| `answerType` | `string` | Sí | valores: TEXT, SCALE, BOOLEAN, SINGLE_CHOICE, MULTIPLE_CHOICE | `@IsIn(ANSWER_TYPE_CODES as readonly string[])` | Tipo de respuesta esperado | `src/modules/surveys/dto/add-question.dto.ts:44` |
| `required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si responderla es obligatorio para poder enviar | `src/modules/surveys/dto/add-question.dto.ts:55` |
| `options` | `array<string>` | No | longitud máxima 200; mínimo 2 elemento(s); máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(2)` `@ArrayMaxSize(20)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | Opciones. Obligatorias en SINGLE_CHOICE / MULTIPLE_CHOICE, prohibidas en el resto. | `src/modules/surveys/dto/add-question.dto.ts:71` |
| `scaleMin` | `number` | No | mínimo 0; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(100)` | Mínimo de la escala. Solo para SCALE. | `src/modules/surveys/dto/add-question.dto.ts:84` |
| `scaleMax` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(100)` | Máximo de la escala. Solo para SCALE. | `src/modules/surveys/dto/add-question.dto.ts:97` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "questionText": "valor-ejemplo",
  "answerType": "TEXT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<QuestionDto>` · DTO `QuestionDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:49` |
| `position` | `number` | Sí | — | — | Posición dentro del cuestionario | `src/modules/surveys/dto/responses.dto.ts:55` |
| `questionText` | `string` | Sí | — | — | Enunciado | `src/modules/surveys/dto/responses.dto.ts:61` |
| `answerType` | `string` | Sí | valores: TEXT, SCALE, BOOLEAN, SINGLE_CHOICE, MULTIPLE_CHOICE | — | Valor de answer type mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:67` |
| `required` | `boolean` | Sí | — | — | Si es obligatoria | `src/modules/surveys/dto/responses.dto.ts:73` |
| `options` | `array<string>` | No | — | — | Opciones de elección | `src/modules/surveys/dto/responses.dto.ts:79` |
| `scaleMin` | `number` | No | — | — | Mínimo de la escala | `src/modules/surveys/dto/responses.dto.ts:85` |
| `scaleMax` | `number` | No | — | — | Máximo de la escala | `src/modules/surveys/dto/responses.dto.ts:91` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: La plantilla no tiene versiones |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las preguntas de elección requieren al menos dos opciones; PreconditionFailedException: Este tipo de pregunta no admite opciones; PreconditionFailedException: Las opciones no pueden repetirse; PreconditionFailedException: El máximo de la escala debe ser mayor que el mínimo; PreconditionFailedException: La sesión no tiene perfil profesional asociado; PreconditionFailedException: La versión ya está publicada: cree una versión nueva para modificar el cuestionario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /surveys/templates/{id}/responses

- **Origen:** CONTRATO
- **Nombre:** Revisar las respuestas de los pacientes
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysTemplatesController.listResponses` — `src/modules/surveys/controllers/surveys-templates.controller.ts:124`

### Qué es y para qué sirve (negocio)

Revisar las respuestas de los pacientes. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`GET /surveys/templates/{id}/responses` la atiende `SurveysTemplatesController.listResponses` (src/modules/surveys/controllers/surveys-templates.controller.ts:124). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SurveysResponsesService.listTemplateResponses`. Lee surveys.survey_answers, surveys.survey_invitations, surveys.survey_questions, surveys.survey_responses, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-templates.controller.ts:124` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/surveys/controllers/surveys-templates.controller.ts:124` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_answers` | LEE | LEE | DIRECTA | SurveysTemplatesController.listResponses → SurveysResponsesService.listTemplateResponses → ResponsesRepository.listAnswers | `src/modules/surveys/repositories/responses.repository.ts:114` |
| `surveys.survey_invitations` | LEE | LEE | DIRECTA | SurveysTemplatesController.listResponses → SurveysResponsesService.listTemplateResponses → InvitationsRepository.listByVersions | `src/modules/surveys/repositories/invitations.repository.ts:107` |
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SurveysTemplatesController.listResponses → SurveysResponsesService.listTemplateResponses → TemplatesRepository.listQuestions | `src/modules/surveys/repositories/templates.repository.ts:226` |
| `surveys.survey_responses` | LEE | LEE | DIRECTA | SurveysTemplatesController.listResponses → SurveysResponsesService.listTemplateResponses → ResponsesRepository.listByInvitations | `src/modules/surveys/repositories/responses.repository.ts:95` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysTemplatesController.listResponses → SurveysResponsesService.listTemplateResponses → SurveysResponsesService.loadOwnedTemplate → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysTemplatesController.listResponses → SurveysResponsesService.listTemplateResponses → TemplatesRepository.findLatestVersion | `src/modules/surveys/repositories/templates.repository.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SurveyResponseDto[]>` · DTO `SurveyResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:314` |
| `invitationId` | `string` | Sí | formato uuid | — | Identificador asociado a invitation. | `src/modules/surveys/dto/responses.dto.ts:320` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/surveys/dto/responses.dto.ts:326` |
| `appointmentBookingId` | `string` | Sí | formato uuid | — | Identificador asociado a appointment booking. | `src/modules/surveys/dto/responses.dto.ts:332` |
| `submittedAt` | `string` | Sí | formato date-time | — | Valor de submitted at mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:338` |
| `answers` | `array<AnswerDto>` | Sí | — | — | Valor de answers mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:344` |
| `answers[].questionId` | `string` | Sí | formato uuid | — | Identificador asociado a question. | `src/modules/surveys/dto/responses.dto.ts:262` |
| `answers[].questionText` | `string` | Sí | — | — | Enunciado, para no tener que reunirlo aparte | `src/modules/surveys/dto/responses.dto.ts:268` |
| `answers[].answerType` | `string` | Sí | valores: TEXT, SCALE, BOOLEAN, SINGLE_CHOICE, MULTIPLE_CHOICE | — | Valor de answer type mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:274` |
| `answers[].valueText` | `string` | No | — | — | Valor de value text mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:280` |
| `answers[].valueNumber` | `number` | No | — | — | Valor de value number mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:286` |
| `answers[].valueBoolean` | `boolean` | No | — | — | Valor de value boolean mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:292` |
| `answers[].valueChoices` | `array<string>` | No | — | — | Valor de value choices mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:298` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /surveys/templates/{id}/versions/{versionNumber}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la encuesta y configurar su vigencia
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SurveysTemplatesController.publishVersion` — `src/modules/surveys/controllers/surveys-templates.controller.ts:93`

### Qué es y para qué sirve (negocio)

Publicar la encuesta y configurar su vigencia. Dentro del módulo (descripción del modelo, en inglés): «The practitioner asks the patient how the visit went.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_65_surveys.puml:18`)

### Cómo se atiende (sistema)

`POST /surveys/templates/{id}/versions/{versionNumber}/publish` la atiende `SurveysTemplatesController.publishVersion` (src/modules/surveys/controllers/surveys-templates.controller.ts:93). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `PublishVersionDto` (2 campos, 0 obligatorios). Delega en `SurveysTemplatesService.publishVersion`. Actualiza surveys.survey_templates, surveys.survey_versions. Lee surveys.survey_questions, surveys.survey_templates, surveys.survey_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/surveys/controllers/surveys-templates.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/surveys/controllers/surveys-templates.controller.ts:93` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SurveysTemplatesController.publishVersion → SurveysTemplatesService.publishVersion → TemplatesRepository.countQuestions | `src/modules/surveys/repositories/templates.repository.ts:241` |
| `surveys.survey_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SurveysTemplatesController.publishVersion → SurveysTemplatesService.publishVersion | `src/modules/surveys/services/surveys-templates.service.ts:229` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SurveysTemplatesController.publishVersion → SurveysTemplatesService.publishVersion → SurveysTemplatesService.loadOwnedTemplate → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:112` |
| `surveys.survey_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SurveysTemplatesController.publishVersion → SurveysTemplatesService.publishVersion | `src/modules/surveys/services/surveys-templates.service.ts:223` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SurveysTemplatesController.publishVersion → SurveysTemplatesService.publishVersion → TemplatesRepository.findVersionByNumber | `src/modules/surveys/repositories/templates.repository.ts:196` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `versionNumber` | path | Sí | `number` | — |

### Cuerpo — DTO `PublishVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO-8601). Por defecto, ahora. | `src/modules/surveys/dto/publish-version.dto.ts:22` |
| `effectiveTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia (ISO-8601). Sin él, vigencia abierta. | `src/modules/surveys/dto/publish-version.dto.ts:33` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<OkResultDto>` · DTO `OkResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/surveys/dto/responses.dto.ts:19` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Versión no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión ya fue publicada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil profesional asociado; PreconditionFailedException: No se puede publicar un cuestionario sin preguntas; PreconditionFailedException: El fin de vigencia debe ser posterior al inicio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/surveys.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Surveys — Cuestionarios y encuestas de satisfacción — etapa `ctrl:SurveysTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

