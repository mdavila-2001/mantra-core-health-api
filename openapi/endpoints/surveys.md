<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `surveys`

Referencia exhaustiva de 18 operación(es) del módulo `surveys`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `surveys-assignments`, `surveys-insights`, `surveys-patient`, `surveys-templates`
- **Controladores:** `SurveysAssignmentsController`, `SurveysInsightsController`, `SurveysPatientController`, `SurveysTemplatesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /surveys/assignments](#1-post-surveys-assignments) — Asociar una encuesta a una consulta o servicio
2. [GET /surveys/insights](#2-get-surveys-insights) — Resumen general de mis encuestas (agregado, sin pacientes)
3. [POST /surveys/invitations](#3-post-surveys-invitations) — Emitir los cuestionarios de una atención completada
4. [GET /surveys/me/invitations](#4-get-surveys-me-invitations) — Ver mis cuestionarios
5. [GET /surveys/me/invitations/{id}](#5-get-surveys-me-invitations-id) — Abrir un cuestionario para responderlo
6. [POST /surveys/me/invitations/{id}/responses](#6-post-surveys-me-invitations-id-responses) — Responder el cuestionario
7. [GET /surveys/templates](#7-get-surveys-templates) — Listar mis encuestas
8. [POST /surveys/templates](#8-post-surveys-templates) — Crear una encuesta para pacientes
9. [GET /surveys/templates/{id}](#9-get-surveys-templates-id) — Ver una encuesta y su cuestionario
10. [PATCH /surveys/templates/{id}](#10-patch-surveys-templates-id) — Corregir título, consigna y plazo del borrador
11. [POST /surveys/templates/{id}/deactivate](#11-post-surveys-templates-id-deactivate) — Desactivar la encuesta
12. [POST /surveys/templates/{id}/questions](#12-post-surveys-templates-id-questions) — Configurar una pregunta y su tipo de respuesta
13. [DELETE /surveys/templates/{id}/questions/{questionId}](#13-delete-surveys-templates-id-questions-questionid) — Quitar una pregunta del borrador
14. [PATCH /surveys/templates/{id}/questions/{questionId}](#14-patch-surveys-templates-id-questions-questionid) — Corregir una pregunta del borrador
15. [PUT /surveys/templates/{id}/questions/order](#15-put-surveys-templates-id-questions-order) — Reordenar el cuestionario del borrador
16. [GET /surveys/templates/{id}/responses](#16-get-surveys-templates-id-responses) — Revisar las respuestas de los pacientes
17. [POST /surveys/templates/{id}/versions](#17-post-surveys-templates-id-versions) — Abrir una versión nueva del cuestionario
18. [POST /surveys/templates/{id}/versions/{versionNumber}/publish](#18-post-surveys-templates-id-versions-versionnumber-publish) — Publicar la encuesta y configurar su vigencia

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

NestJS resuelve `POST /surveys/assignments` en `SurveysAssignmentsController_createAssignment`. El controlador delega en `SurveysAssignmentsService.createAssignment`. Valida el body como `SurveysCreateAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SurveysCreateAssignmentDto`; los campos opcionales se omiten.

```http
POST /surveys/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT"
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
| `targetType` | Sí | `string` | valores: `APPOINTMENT`, `SERVICE`, `CARE_TYPE` | Qué se evalúa: la reserva, el servicio o el tipo de atención. `CARE_TYPE` sólo admite «todas mis consultas» | `APPOINTMENT` |
| `targetId` | No | `string` | formato `uuid` | Identificador de la cosa evaluada, según `targetType`: la reserva (`APPOINTMENT`) o el servicio del catálogo, `billing.service_catalog.id` (`SERVICE`). Con `CARE_TYPE` se puede omitir: es «todas mis consultas» (`a0038828-6e68-55c5-aa59-d4c747035db6`), el único tipo de atención admitido. | `00000000-0000-4000-8000-000000000001` |

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
| 504 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

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
| 422 | `PRECONDITION_FAILED` | Solo se puede asignar una versión publicada | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 422 | `PRECONDITION_FAILED` | El único tipo de atención que se puede asociar es «consulta»: asigne la encuesta por servicio, por cita concreta o a todas sus consultas | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
| 422 | `PRECONDITION_FAILED` | Usted no ofrece ese servicio: declárelo en sus servicios antes de asociarle una encuesta | Excepción explícita en src/modules/surveys/services/surveys-assignments.service.ts |
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

## 2. GET /surveys/insights

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-insights`
- **Nombre:** Resumen general de mis encuestas (agregado, sin pacientes)
- **Operation ID:** `SurveysInsightsController_getInsights`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysInsightsController.getInsights](../../src/modules/surveys/controllers/surveys-insights.controller.ts)

### Descripción de negocio

Totales, tasa de respuesta, NPS, promedio y distribución por pregunta, tendencia, alertas de seguridad y comentarios abiertos (texto y día). Incluye las encuestas propias y las de sistema emitidas por las atenciones del profesional.

Contexto declarado en el controlador: El resumen del profesional de la sesión.

### Descripción del sistema

NestJS resuelve `GET /surveys/insights` en `SurveysInsightsController_getInsights`. El controlador delega en `SurveysInsightsService.getInsights`. No recibe body. El tipo de retorno estático es `Promise<SurveyInsightsDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date` | Primer día de un mes (YYYY-MM-01, UTC). Cualquier otro día, o una hora, se rechaza con 400. Se filtra por la fecha de emisión del cuestionario. Sin valor: 11 meses antes del mes de `to` (ventana de 12 meses). | `2026-08-01` |
| `to` | query | No | `string` | formato `date` | Último día de un mes (p. ej. 2026-10-31, UTC). Cualquier otro día, o una hora, se rechaza con 400. No puede ser anterior a `from` y el periodo no puede pasar de 12 meses. Sin valor: el último día del mes en curso. | `2026-10-31` |
| `serviceId` | query | No | `string` | formato `uuid` | Acota el resumen a los cuestionarios emitidos por atenciones de este servicio del catálogo. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /surveys/insights HTTP/1.1
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
GET /surveys/insights?from=2026-08-01&to=2026-10-31&serviceId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SurveyInsightsDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SurveyInsightsDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SurveyInsightsDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SurveyInsightsDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SurveyInsightsDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SurveyInsightsDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SurveyInsightsDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SurveyInsightsDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "totals": {
    "issued": 1,
    "answered": 1,
    "responseRate": 1
  },
  "privacy": {
    "minCohort": 1,
    "suppressed": true
  },
  "nps": {
    "value": 1,
    "promoters": 1,
    "passives": 1,
    "detractors": 1,
    "n": 1,
    "suppressed": true
  },
  "byQuestion": [
    {
      "questionId": "00000000-0000-4000-8000-000000000001",
      "text": "valor-ejemplo",
      "dimension": "valor-ejemplo",
      "answerType": "TEXT",
      "n": 1,
      "suppressed": true,
      "average": 1,
      "distribution": [
        {
          "value": 1,
          "count": 1
        }
      ],
      "optionCounts": [
        {
          "option": "valor-ejemplo",
          "count": 1
        }
      ]
    }
  ],
  "trend": [
    {
      "period": "2026-10-05",
      "answered": 1,
      "average": 1
    }
  ],
  "trendGranularity": "DAY",
  "safetyAlerts": {
    "n": 1
  },
  "comments": [
    {
      "text": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `totals` | Sí | `InsightsTotalsDto` | Sin restricción adicional declarada | Emitidos, respondidos y tasa. Siempre presente. | `{"issued":1,"answered":1,"responseRate":1}` |
| `totals.issued` | Sí | `number` | Sin restricción adicional declarada | Cuestionarios emitidos en el periodo | `1` |
| `totals.answered` | Sí | `number` | Sin restricción adicional declarada | De los emitidos, cuántos fueron respondidos | `1` |
| `totals.responseRate` | Sí | `number` | admite null | Tasa de respuesta como fracción entre 0 y 1 (0.62 = 62 %). `null` si no se emitió ninguno. | `1` |
| `privacy` | Sí | `InsightsPrivacyDto` | Sin restricción adicional declarada | Umbral de privacidad aplicado. Siempre presente. | `{"minCohort":1,"suppressed":true}` |
| `privacy.minCohort` | Sí | `number` | Sin restricción adicional declarada | Respondidas necesarias para mostrar cálculos. | `1` |
| `privacy.suppressed` | Sí | `boolean` | Sin restricción adicional declarada | `true` si el alcance filtrado tiene menos respondidas que `minCohort`: sólo vienen `totals` y `privacy`; el resto de los campos no se envía. | `true` |
| `nps` | No | `InsightsNpsDto` | Sin restricción adicional declarada | NPS de la pregunta de recomendación. Ausente si `privacy.suppressed`. | `{"value":1,"promoters":1,"passives":1,"detractors":1,"n":1,"suppressed":true}` |
| `nps.value` | No | `number` | admite null | %(9-10) − %(0-6), de −100 a 100 con un decimal. `null` si nadie respondió la pregunta. | `1` |
| `nps.promoters` | No | `number` | Sin restricción adicional declarada | Respuestas 9-10. | `1` |
| `nps.passives` | No | `number` | Sin restricción adicional declarada | Respuestas 7-8. | `1` |
| `nps.detractors` | No | `number` | Sin restricción adicional declarada | Respuestas 0-6. | `1` |
| `nps.n` | No | `number` | Sin restricción adicional declarada | Respuestas que sostienen el cálculo. | `1` |
| `nps.suppressed` | No | `boolean` | Sin restricción adicional declarada | true si hay menos de ${MIN_COHORT} respuestas: no se calcula | `true` |
| `byQuestion` | No | `array<InsightsQuestionDto>` | Sin restricción adicional declarada | Una entrada por pregunta (o dimensión), con su `n`. Ausente si suprimido. | `[{"questionId":"00000000-0000-4000-8000-000000000001","text":"valor-ejemplo","dimension":"valor-ejemplo","answerType":"TEXT","n":1,"suppressed":true,"average":1,"distribution":[{"value":1,"count":1}],"optionCounts":[{"option":"valor-ejemplo","count":1}]}]` |
| `byQuestion[].questionId` | No | `string` | formato `uuid` | Una pregunta representativa del grupo (la más reciente). No es estable entre versiones: sirve de clave de lista, no para consultar una pregunta. | `00000000-0000-4000-8000-000000000001` |
| `byQuestion[].text` | No | `string` | Sin restricción adicional declarada | Enunciado de la pregunta representativa. | `valor-ejemplo` |
| `byQuestion[].dimension` | No | `string` | admite null | Dimensión de la encuesta base, o `null` si es una pregunta propia. | `valor-ejemplo` |
| `byQuestion[].answerType` | No | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Tipo de respuesta. | `TEXT` |
| `byQuestion[].n` | No | `number` | Sin restricción adicional declarada | Respuestas contadas. Siempre presente; 0 si nadie respondió. | `1` |
| `byQuestion[].suppressed` | No | `boolean` | Sin restricción adicional declarada | true si n < ${MIN_COHORT}: sin promedio, distribución ni opciones | `true` |
| `byQuestion[].average` | No | `number` | Sin restricción adicional declarada | Sólo SCALE no suprimida | `1` |
| `byQuestion[].distribution` | No | `array<InsightsScaleBucketDto>` | Sin restricción adicional declarada | Distribución por valor, de `scaleMin` a `scaleMax` con ceros incluidos. Vacía en las preguntas que no son SCALE. | `[{"value":1,"count":1}]` |
| `byQuestion[].distribution[].value` | No | `number` | Sin restricción adicional declarada | Valor de la escala. | `1` |
| `byQuestion[].distribution[].count` | No | `number` | Sin restricción adicional declarada | Respuestas con ese valor. | `1` |
| `byQuestion[].optionCounts` | No | `array<InsightsOptionCountDto>` | Sin restricción adicional declarada | Veces que se eligió cada opción. Sólo SINGLE_CHOICE, MULTIPLE_CHOICE y BOOLEAN (`Sí` / `No`). | `[{"option":"valor-ejemplo","count":1}]` |
| `byQuestion[].optionCounts[].option` | No | `string` | Sin restricción adicional declarada | Texto de la opción. | `valor-ejemplo` |
| `byQuestion[].optionCounts[].count` | No | `number` | Sin restricción adicional declarada | Veces elegida. | `1` |
| `trend` | No | `array<InsightsTrendPointDto>` | Sin restricción adicional declarada | Tendencia por tramos de fecha de emisión. Ausente si suprimido. | `[{"period":"2026-10-05","answered":1,"average":1}]` |
| `trend[].period` | No | `string` | Sin restricción adicional declarada | Primer día del tramo (`YYYY-MM-DD`, UTC). Los tramos con menos de respondidos se funden con el siguiente: ningún punto muestra una respuesta suelta. | `2026-10-05` |
| `trend[].answered` | No | `number` | Sin restricción adicional declarada | Cuestionarios respondidos, de los emitidos en ese tramo. | `1` |
| `trend[].average` | No | `number` | Sin restricción adicional declarada | Promedio de satisfacción del tramo, sólo si lo sostienen al menos respuestas. Sale de la pregunta de satisfacción global; si el resumen no tiene ninguna, del promedio de las preguntas de escala 1-5. | `1` |
| `trendGranularity` | No | `string` | valores: `DAY`, `WEEK`, `MONTH` | Granularidad de `trend`, según la amplitud del periodo. Ausente si suprimido. | `DAY` |
| `safetyAlerts` | No | `InsightsSafetyAlertsDto` | Sin restricción adicional declarada | Alertas de seguridad. Ausente si suprimido. | `{"n":1}` |
| `safetyAlerts.n` | No | `number` | Sin restricción adicional declarada | Respuestas «Sí, y deseo que ALOVIDA me contacte…». | `1` |
| `comments` | No | `array<InsightsCommentDto>` | Sin restricción adicional declarada | Comentarios abiertos (tope 20) en un orden estable que no es cronológico. Vacío si en el alcance hay menos de . Ausente si suprimido. | `[{"text":"valor-ejemplo"}]` |
| `comments[].text` | No | `string` | Sin restricción adicional declarada | Texto del comentario. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | ${field} debe ser una fecha de día válida (YYYY-MM-DD), sin hora | Excepción explícita en src/modules/surveys/services/surveys-insights.service.ts |
| 400 | `VALIDATION_FAILED` | to debe ser el último día de un mes (por ejemplo 2026-10-31) | Excepción explícita en src/modules/surveys/services/surveys-insights.service.ts |
| 400 | `VALIDATION_FAILED` | from debe ser el primer día de un mes (por ejemplo 2026-10-01) | Excepción explícita en src/modules/surveys/services/surveys-insights.service.ts |
| 400 | `VALIDATION_FAILED` | El inicio del periodo debe ser anterior o igual a su fin | Excepción explícita en src/modules/surveys/services/surveys-insights.service.ts |
| 400 | `VALIDATION_FAILED` | El periodo no puede superar ${MAX_RANGE_MONTHS} meses | Excepción explícita en src/modules/surveys/services/surveys-insights.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Solo un profesional puede ver el resumen de sus encuestas | Excepción explícita en src/modules/surveys/services/surveys-insights.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/insights"
}
```

---

## 3. POST /surveys/invitations

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
| 504 | Operación completada correctamente. | `Promise<InvitationsIssuedDto>` | No |

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

## 4. GET /surveys/me/invitations

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
| 504 | Consulta completada correctamente. | `Promise<PatientInvitationDto[]>` | No |

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
| 403 | `FORBIDDEN` | Solo un paciente puede ver sus cuestionarios | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
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

## 5. GET /surveys/me/invitations/{id}

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
| 504 | Consulta completada correctamente. | `Promise<PatientQuestionnaireDto>` | No |

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
      "source": "SYSTEM",
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
| `questions` | Sí | `array<QuestionDto>` | Sin restricción adicional declarada | Valor de questions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","position":1,"questionText":"valor-ejemplo","answerType":"TEXT","required":true,"source":"SYSTEM","options":["valor-ejemplo"],"scaleMin":1,"scaleMax":1}]` |
| `questions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `questions[].position` | Sí | `number` | Sin restricción adicional declarada | Posición dentro del cuestionario | `1` |
| `questions[].questionText` | Sí | `string` | Sin restricción adicional declarada | Enunciado | `valor-ejemplo` |
| `questions[].answerType` | Sí | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Valor de answer type mantenido por la instancia. | `TEXT` |
| `questions[].required` | Sí | `boolean` | Sin restricción adicional declarada | Si es obligatoria | `true` |
| `questions[].source` | No | `string` | valores: `SYSTEM`, `PRACTITIONER` | SYSTEM: pregunta base de ALOVIDA. PRACTITIONER: pregunta de la encuesta del profesional (siempre opcional). Sólo la informa la lectura del paciente. | `SYSTEM` |
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
| 403 | `FORBIDDEN` | Solo un paciente puede ver sus cuestionarios | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 404 | `NOT_FOUND` | Cuestionario no encontrado | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
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

## 6. POST /surveys/me/invitations/{id}/responses

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
| 504 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

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
| 403 | `FORBIDDEN` | Solo un paciente puede ver sus cuestionarios | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 409 | `CONFLICT` | Este cuestionario ya fue respondido | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 409 | `CONFLICT` | La respuesta ya fue registrada para este cuestionario | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El plazo para responder este cuestionario venció | Excepción explícita en src/modules/surveys/services/surveys-responses.service.ts |
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

## 7. GET /surveys/templates

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
| 504 | Consulta completada correctamente. | `Promise<TemplateSummaryDto[]>` | No |

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

## 8. POST /surveys/templates

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
| 504 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |

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

## 9. GET /surveys/templates/{id}

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
| 504 | Consulta completada correctamente. | `Promise<TemplateDetailDto>` | No |

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
      "source": "SYSTEM",
      "options": [
        "valor-ejemplo"
      ],
      "scaleMin": 1,
      "scaleMax": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "targetType": "APPOINTMENT",
      "targetId": "00000000-0000-4000-8000-000000000001",
      "targetName": "Nombre de ejemplo",
      "active": true
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
| `questions` | Sí | `array<QuestionDto>` | Sin restricción adicional declarada | Valor de questions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","position":1,"questionText":"valor-ejemplo","answerType":"TEXT","required":true,"source":"SYSTEM","options":["valor-ejemplo"],"scaleMin":1,"scaleMax":1}]` |
| `questions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `questions[].position` | Sí | `number` | Sin restricción adicional declarada | Posición dentro del cuestionario | `1` |
| `questions[].questionText` | Sí | `string` | Sin restricción adicional declarada | Enunciado | `valor-ejemplo` |
| `questions[].answerType` | Sí | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Valor de answer type mantenido por la instancia. | `TEXT` |
| `questions[].required` | Sí | `boolean` | Sin restricción adicional declarada | Si es obligatoria | `true` |
| `questions[].source` | No | `string` | valores: `SYSTEM`, `PRACTITIONER` | SYSTEM: pregunta base de ALOVIDA. PRACTITIONER: pregunta de la encuesta del profesional (siempre opcional). Sólo la informa la lectura del paciente. | `SYSTEM` |
| `questions[].options` | No | `array<string>` | Sin restricción adicional declarada | Opciones de elección | `["valor-ejemplo"]` |
| `questions[].scaleMin` | No | `number` | Sin restricción adicional declarada | Mínimo de la escala | `1` |
| `questions[].scaleMax` | No | `number` | Sin restricción adicional declarada | Máximo de la escala | `1` |
| `assignments` | No | `array<TemplateAssignmentDto>` | Sin restricción adicional declarada | Asociaciones activas de la encuesta, de cualquiera de sus versiones. Si una misma cosa está asociada a dos versiones se informa la más alta, que es la que se reparte. Sólo en plantillas del profesional. | `[{"id":"00000000-0000-4000-8000-000000000001","targetType":"APPOINTMENT","targetId":"00000000-0000-4000-8000-000000000001","targetName":"Nombre de ejemplo","active":true}]` |
| `assignments[].id` | No | `string` | formato `uuid` | Identificador de la asignación. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].targetType` | No | `string` | valores: `APPOINTMENT`, `SERVICE`, `CARE_TYPE` | Qué se evalúa. | `APPOINTMENT` |
| `assignments[].targetId` | No | `string` | formato `uuid` | La reserva (`APPOINTMENT`), el servicio del catálogo, `billing.service_catalog.id` (`SERVICE`), o el tipo de atención «consulta» (`CARE_TYPE`). | `00000000-0000-4000-8000-000000000001` |
| `assignments[].targetName` | No | `string` | admite null | Nombre del servicio del catálogo cuando `targetType` es `SERVICE`; ausente en el resto. | `Nombre de ejemplo` |
| `assignments[].active` | No | `boolean` | Sin restricción adicional declarada | Siempre `true`: sólo se informan las activas. | `true` |

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

## 10. PATCH /surveys/templates/{id}

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Corregir título, consigna y plazo del borrador
- **Operation ID:** `SurveysTemplatesController_updateTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.updateTemplate](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Corregir título, consigna y plazo del borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CL-72: corrige título, consigna y plazo de la versión en borrador.

### Descripción del sistema

NestJS resuelve `PATCH /surveys/templates/{id}` en `SurveysTemplatesController_updateTemplate`. El controlador delega en `SurveysTemplatesService.updateTemplate`. Valida el body como `UpdateTemplateDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateTemplateDto`; los campos opcionales se omiten.

```http
PATCH /surveys/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| `title` | No | `string` | longitud mínima 1; longitud máxima 200 | Título del instrumento | `valor-ejemplo` |
| `description` | No | `string` | longitud máxima 2000 | Consigna que ve el paciente; vacío la borra | `Texto descriptivo de ejemplo` |
| `responseWindowDays` | No | `number` | mínimo 1; máximo 365 | Días para responder (de la versión en borrador) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /surveys/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "responseWindowDays": 1
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
| 504 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

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
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión ya está publicada: cree una versión nueva para modificar el cuestionario | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
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

## 11. POST /surveys/templates/{id}/deactivate

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
| 504 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

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

## 12. POST /surveys/templates/{id}/questions

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
| `required` | No | `boolean` | Sin restricción adicional declarada | Se ignora: las preguntas del profesional son siempre opcionales (`required` queda en false) | `false` |
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
| 504 | Operación completada correctamente. | `Promise<QuestionDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QuestionDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "position": 1,
  "questionText": "valor-ejemplo",
  "answerType": "TEXT",
  "required": true,
  "source": "SYSTEM",
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
| `source` | No | `string` | valores: `SYSTEM`, `PRACTITIONER` | SYSTEM: pregunta base de ALOVIDA. PRACTITIONER: pregunta de la encuesta del profesional (siempre opcional). Sólo la informa la lectura del paciente. | `SYSTEM` |
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
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Las preguntas de elección requieren al menos dos opciones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Este tipo de pregunta no admite opciones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Las opciones no pueden repetirse | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | El máximo de la escala debe ser mayor que el mínimo | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión ya está publicada: cree una versión nueva para modificar el cuestionario | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
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

## 13. DELETE /surveys/templates/{id}/questions/{questionId}

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Quitar una pregunta del borrador
- **Operation ID:** `SurveysTemplatesController_deleteQuestion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.deleteQuestion](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Quitar una pregunta del borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CL-60: quita una pregunta del borrador y renumera las que quedan.

### Descripción del sistema

NestJS resuelve `DELETE /surveys/templates/{id}/questions/{questionId}` en `SurveysTemplatesController_deleteQuestion`. El controlador delega en `SurveysTemplatesService.deleteQuestion`. No recibe body. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `questionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /surveys/templates/00000000-0000-4000-8000-000000000001/questions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`, `questionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /surveys/templates/00000000-0000-4000-8000-000000000001/questions/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 504 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

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
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 404 | `NOT_FOUND` | Pregunta no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión ya está publicada: cree una versión nueva para modificar el cuestionario | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}/questions/{questionId}"
}
```

---

## 14. PATCH /surveys/templates/{id}/questions/{questionId}

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Corregir una pregunta del borrador
- **Operation ID:** `SurveysTemplatesController_updateQuestion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.updateQuestion](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Corregir una pregunta del borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CL-60: corrige una pregunta del borrador (opciones y escala enteras).

### Descripción del sistema

NestJS resuelve `PATCH /surveys/templates/{id}/questions/{questionId}` en `SurveysTemplatesController_updateQuestion`. El controlador delega en `SurveysTemplatesService.updateQuestion`. Valida el body como `UpdateQuestionDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `questionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateQuestionDto`; los campos opcionales se omiten.

```http
PATCH /surveys/templates/00000000-0000-4000-8000-000000000001/questions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`, `questionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `questionText` | No | `string` | longitud mínima 1; longitud máxima 500 | Enunciado de la pregunta | `valor-ejemplo` |
| `answerType` | No | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Tipo de respuesta esperado | `TEXT` |
| `required` | No | `boolean` | Sin restricción adicional declarada | Se ignora: las preguntas del profesional son siempre opcionales (`required` queda en false) | `true` |
| `options` | No | `array<string>` | longitud máxima 200; mínimo 2 elemento(s); máximo 20 elemento(s) | Opciones, enteras. Reemplazan a las anteriores. | `["valor-ejemplo","valor-ejemplo"]` |
| `scaleMin` | No | `number` | mínimo 0; máximo 100 | Mínimo de la escala. Solo para SCALE. | `1` |
| `scaleMax` | No | `number` | mínimo 1; máximo 100 | Máximo de la escala. Solo para SCALE. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /surveys/templates/00000000-0000-4000-8000-000000000001/questions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "questionText": "valor-ejemplo",
  "answerType": "TEXT",
  "required": true,
  "options": [
    "valor-ejemplo",
    "valor-ejemplo"
  ],
  "scaleMin": 1,
  "scaleMax": 1
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
| 504 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

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
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 404 | `NOT_FOUND` | Pregunta no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión ya está publicada: cree una versión nueva para modificar el cuestionario | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Las preguntas de elección requieren al menos dos opciones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Este tipo de pregunta no admite opciones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | Las opciones no pueden repetirse | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | El máximo de la escala debe ser mayor que el mínimo | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}/questions/{questionId}"
}
```

---

## 15. PUT /surveys/templates/{id}/questions/order

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Reordenar el cuestionario del borrador
- **Operation ID:** `SurveysTemplatesController_reorderQuestions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.reorderQuestions](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Reordenar el cuestionario del borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CL-60: reordena el cuestionario entero. **Declarada antes** que las rutas con `:questionId` para que `order` nunca se lea como un identificador.

### Descripción del sistema

NestJS resuelve `PUT /surveys/templates/{id}/questions/order` en `SurveysTemplatesController_reorderQuestions`. El controlador delega en `SurveysTemplatesService.reorderQuestions`. Valida el body como `ReorderQuestionsDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReorderQuestionsDto`; los campos opcionales se omiten.

```http
PUT /surveys/templates/00000000-0000-4000-8000-000000000001/questions/order HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "questionIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
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
| `questionIds` | Sí | `array<string>` | formato `uuid`; mínimo 1 elemento(s) | Preguntas en el orden final (sin repetidos) | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /surveys/templates/00000000-0000-4000-8000-000000000001/questions/order HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "questionIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
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
| 504 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

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
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay preguntas que no pertenecen a la versión en borrador | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil profesional asociado | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión ya está publicada: cree una versión nueva para modificar el cuestionario | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/surveys/templates/{id}/questions/order"
}
```

---

## 16. GET /surveys/templates/{id}/responses

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
| 504 | Consulta completada correctamente. | `Promise<SurveyResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SurveyResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "invitationId": "00000000-0000-4000-8000-000000000001",
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

## 17. POST /surveys/templates/{id}/versions

- **Módulo:** `surveys`
- **Etiqueta OpenAPI:** `surveys-templates`
- **Nombre:** Abrir una versión nueva del cuestionario
- **Operation ID:** `SurveysTemplatesController_createNextVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SurveysTemplatesController.createNextVersion](../../src/modules/surveys/controllers/surveys-templates.controller.ts)

### Descripción de negocio

Abrir una versión nueva del cuestionario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Abre una versión nueva en borrador, para corregir una plantilla ya publicada (FT-31).

### Descripción del sistema

NestJS resuelve `POST /surveys/templates/{id}/versions` en `SurveysTemplatesController_createNextVersion`. El controlador delega en `SurveysTemplatesService.createNextVersion`. No recibe body. El tipo de retorno estático es `Promise<TemplateCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /surveys/templates/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
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
POST /surveys/templates/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TemplateCreatedDto>` | No |

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
| 404 | `NOT_FOUND` | La plantilla no tiene versiones | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 409 | `CONFLICT` | Ya hay una versión en borrador: termine de editarla o publíquela antes de abrir otra | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
| 409 | `CONFLICT` | Otra solicitud abrió la versión siguiente; vuelva a consultar la plantilla | Excepción explícita en src/modules/surveys/services/surveys-templates.service.ts |
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
  "path": "/surveys/templates/{id}/versions"
}
```

---

## 18. POST /surveys/templates/{id}/versions/{versionNumber}/publish

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
| 504 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

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

