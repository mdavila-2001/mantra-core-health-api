<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `education`

Referencia exhaustiva de 14 operación(es) del módulo `education`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `education`
- **Controladores:** `EducationController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /education/assessments/{id}/attempts](#1-post-education-assessments-id-attempts) — Iniciar un intento de evaluación
2. [POST /education/attempts/{id}/submit](#2-post-education-attempts-id-submit) — Enviar y calificar el intento
3. [POST /education/certificates/{id}/cme-credits](#3-post-education-certificates-id-cme-credits) — Acreditar las horas CME al profesional
4. [POST /education/certificates/{id}/revoke](#4-post-education-certificates-id-revoke) — Revocar el certificado y revertir sus créditos CME
5. [POST /education/courses/{id}/assessments](#5-post-education-courses-id-assessments) — Diseñar una evaluación con sus preguntas
6. [POST /education/courses/{id}/cohorts](#6-post-education-courses-id-cohorts) — Abrir una cohorte del curso
7. [POST /education/courses/{id}/instructors](#7-post-education-courses-id-instructors) — Asignar un instructor al curso
8. [POST /education/courses/{id}/reviews](#8-post-education-courses-id-reviews) — Publicar una reseña del curso
9. [POST /education/courses/{id}/versions/publish](#9-post-education-courses-id-versions-publish) — Publicar una versión nueva del curso
10. [POST /education/courses/publish](#10-post-education-courses-publish) — Publicar un curso con sus módulos y lecciones
11. [POST /education/enrollments](#11-post-education-enrollments) — Inscribir a un aprendiz
12. [POST /education/enrollments/{id}/certificate](#12-post-education-enrollments-id-certificate) — Emitir el certificado verificable
13. [POST /education/enrollments/{id}/complete](#13-post-education-enrollments-id-complete) — Completar el curso
14. [POST /education/enrollments/{id}/lesson-progress](#14-post-education-enrollments-id-lesson-progress) — Registrar el progreso de una lección

---

## 1. POST /education/assessments/{id}/attempts

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Iniciar un intento de evaluación
- **Operation ID:** `EducationController_startAttempt`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.startAttempt](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

Se rechaza si hay uno en curso o si se agotaron los permitidos.


### Descripción del sistema

NestJS resuelve `POST /education/assessments/{id}/attempts` en `EducationController_startAttempt`. El controlador delega en `EducationLearningService.startAttempt`. Valida el body como `StartAttemptDto` y consume `application/json`. El tipo de retorno estático es `Promise<AttemptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartAttemptDto`; los campos opcionales se omiten.

```http
POST /education/assessments/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "enrollmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LEARNER`, `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `enrollmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/assessments/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "enrollmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AttemptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AttemptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "outcome": "00000000-0000-4000-8000-000000000001",
  "checkStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `outcome` | Sí | `string` | formato `uuid` | Valor de outcome mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `checkStatus` | Sí | `string` | formato `uuid` | Valor de check status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LEARNER, EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Evaluación no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 404 | `NOT_FOUND` | Inscripción no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 409 | `CONFLICT` | Ya hay un intento en curso | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La inscripción es de otro curso | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | La inscripción no está activa | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | Se agotaron los intentos permitidos | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/assessments/{id}/attempts"
}
```

---

## 2. POST /education/attempts/{id}/submit

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Enviar y calificar el intento
- **Operation ID:** `EducationController_submitAttempt`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.submitAttempt](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

La corrección se hace contra la respuesta correcta, que no sale de la transacción.


### Descripción del sistema

NestJS resuelve `POST /education/attempts/{id}/submit` en `EducationController_submitAttempt`. El controlador delega en `EducationLearningService.submitAttempt`. Valida el body como `SubmitAttemptDto` y consume `application/json`. El tipo de retorno estático es `Promise<GradedAttemptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitAttemptDto`; los campos opcionales se omiten.

```http
POST /education/attempts/00000000-0000-4000-8000-000000000001/submit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "responsesJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LEARNER`, `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `responsesJson` | Sí | `object` | Sin restricción adicional declarada | Respuestas por pregunta, con la forma { "<questionId>": <respuesta> } | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/attempts/00000000-0000-4000-8000-000000000001/submit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "responsesJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GradedAttemptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GradedAttemptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "score": "valor-ejemplo",
  "passed": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "correctAnswers": 1,
  "totalQuestions": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `score` | Sí | `string` | Sin restricción adicional declarada | Puntuación obtenida, en porcentaje | `valor-ejemplo` |
| `passed` | Sí | `boolean` | Sin restricción adicional declarada | Valor de passed mantenido por la instancia. | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `correctAnswers` | Sí | `number` | Sin restricción adicional declarada | Preguntas acertadas | `1` |
| `totalQuestions` | Sí | `number` | Sin restricción adicional declarada | Preguntas de la evaluación | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LEARNER, EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Intento no encontrado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 404 | `NOT_FOUND` | Evaluación no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 409 | `CONFLICT` | El intento ya fue corregido | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tiempo del intento venció | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/attempts/{id}/submit"
}
```

---

## 3. POST /education/certificates/{id}/cme-credits

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Acreditar las horas CME al profesional
- **Operation ID:** `EducationController_recordCmeCredit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.recordCmeCredit](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

Idempotente por certificado y profesional.


### Descripción del sistema

NestJS resuelve `POST /education/certificates/{id}/cme-credits` en `EducationController_recordCmeCredit`. El controlador delega en `EducationLearningService.recordCmeCredit`. Valida el body como `RecordCmeCreditDto` y consume `application/json`. El tipo de retorno estático es `Promise<CmeCreditResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordCmeCreditDto`; los campos opcionales se omiten.

```http
POST /education/certificates/00000000-0000-4000-8000-000000000001/cme-credits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Perfil profesional al que se acredita | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `periodYear` | No | `number` | mínimo 2000; máximo 2100 | Año del periodo de acreditación; por defecto, el actual | `2000` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/certificates/00000000-0000-4000-8000-000000000001/cme-credits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "periodYear": 2000
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CmeCreditResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CmeCreditResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "creditHours": "valor-ejemplo",
  "periodYear": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "alreadyAwarded": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `creditHours` | Sí | `string` | Sin restricción adicional declarada | Horas acreditadas | `valor-ejemplo` |
| `periodYear` | Sí | `number` | Sin restricción adicional declarada | Valor de period year mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `alreadyAwarded` | Sí | `boolean` | Sin restricción adicional declarada | true si el crédito ya estaba acreditado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Certificado no encontrado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El certificado no está vigente | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | El certificado no otorga créditos CME | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | El curso no declara organismo acreditador | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/certificates/{id}/cme-credits"
}
```

---

## 4. POST /education/certificates/{id}/revoke

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Revocar el certificado y revertir sus créditos CME
- **Operation ID:** `EducationController_revokeCertificate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.revokeCertificate](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

Ambas cosas ocurren en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /education/certificates/{id}/revoke` en `EducationController_revokeCertificate`. El controlador delega en `EducationLearningService.revokeCertificate`. Valida el body como `RevokeCertificateDto` y consume `application/json`. El tipo de retorno estático es `Promise<RevokeCertificateResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RevokeCertificateDto`; los campos opcionales se omiten.

```http
POST /education/certificates/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se revoca | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/certificates/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RevokeCertificateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RevokeCertificateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "cmeRecordsReversed": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `cmeRecordsReversed` | Sí | `number` | Sin restricción adicional declarada | Créditos CME revertidos | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Certificado no encontrado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 409 | `CONFLICT` | El certificado ya está revocado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
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
  "path": "/education/certificates/{id}/revoke"
}
```

---

## 5. POST /education/courses/{id}/assessments

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Diseñar una evaluación con sus preguntas
- **Operation ID:** `EducationController_createAssessment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.createAssessment](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

La respuesta correcta sólo la lee la corrección.


### Descripción del sistema

NestJS resuelve `POST /education/courses/{id}/assessments` en `EducationController_createAssessment`. El controlador delega en `EducationCatalogService.createAssessment`. Valida el body como `CreateAssessmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssessmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAssessmentDto`; los campos opcionales se omiten.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "assessmentType": "QUIZ",
  "questions": [
    {
      "questionType": "SINGLE_CHOICE",
      "promptText": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `EDUCATION_ADMIN`, `COURSE_AUTHOR`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `courseModuleId` | No | `string` | formato `uuid` | Módulo al que pertenece la evaluación | `00000000-0000-4000-8000-000000000001` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assessmentType` | Sí | `string` | valores: `QUIZ`, `EXAM`, `SURVEY` | Sin descripción específica en el contrato OpenAPI. | `QUIZ` |
| `passingScore` | No | `string` | Sin restricción adicional declarada | Puntuación mínima para aprobar, en porcentaje | `valor-ejemplo` |
| `maxAttempts` | No | `number` | mínimo 1 | Intentos permitidos | `1` |
| `timeLimitMinutes` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `isGraded` | No | `boolean` | Sin restricción adicional declarada | Una encuesta no puntúa | `true` |
| `questions` | Sí | `array<AssessmentQuestionDto>` | mínimo 1 elemento(s) | Preguntas, al menos una | `[{"questionType":"SINGLE_CHOICE","promptText":"valor-ejemplo","optionsJson":{},"correctAnswerJson":{},"points":"1"}]` |
| `questions[].questionType` | Sí | `string` | valores: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `MATCHING` | Sin descripción específica en el contrato OpenAPI. | `SINGLE_CHOICE` |
| `questions[].promptText` | Sí | `string` | Sin restricción adicional declarada | Enunciado | `valor-ejemplo` |
| `questions[].optionsJson` | No | `object` | Sin restricción adicional declarada | Opciones que se muestran al aprendiz | `{}` |
| `questions[].correctAnswerJson` | No | `object` | Sin restricción adicional declarada | Respuesta correcta. Sólo la lee la corrección; nunca se devuelve al aprendiz. | `{}` |
| `questions[].points` | No | `string` | Sin restricción adicional declarada | Puntos de la pregunta | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "courseModuleId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "assessmentType": "QUIZ",
  "passingScore": "valor-ejemplo",
  "maxAttempts": 1,
  "timeLimitMinutes": 1,
  "isGraded": true,
  "questions": [
    {
      "questionType": "SINGLE_CHOICE",
      "promptText": "valor-ejemplo",
      "optionsJson": {},
      "correctAnswerJson": {},
      "points": "1"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssessmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssessmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "questionIds": [
    "valor-ejemplo"
  ],
  "totalPoints": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `questionIds` | Sí | `array<string>` | formato `uuid` | Valor de question ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `totalPoints` | Sí | `string` | Sin restricción adicional declarada | Suma de los puntos de las preguntas | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: EDUCATION_ADMIN, COURSE_AUTHOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Curso no encontrado | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una evaluación puntuable necesita respuesta correcta en cada pregunta | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El módulo no pertenece al curso | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/courses/{id}/assessments"
}
```

---

## 6. POST /education/courses/{id}/cohorts

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Abrir una cohorte del curso
- **Operation ID:** `EducationController_openCohort`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.openCohort](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

Abrir una cohorte del curso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /education/courses/{id}/cohorts` en `EducationController_openCohort`. El controlador delega en `EducationCatalogService.openCohort`. Valida el body como `OpenCohortDto` y consume `application/json`. El tipo de retorno estático es `Promise<CohortResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenCohortDto`; los campos opcionales se omiten.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/cohorts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "deliveryMode": "ONLINE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código de la cohorte, único por curso | `CODIGO_EJEMPLO` |
| `deliveryMode` | Sí | `string` | valores: `ONLINE`, `IN_PERSON`, `HYBRID` | Sin descripción específica en el contrato OpenAPI. | `ONLINE` |
| `startDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `endDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `capacity` | No | `number` | mínimo 1 | Plazas; sin ella la cohorte no tiene límite | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/cohorts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "deliveryMode": "ONLINE",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "capacity": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CohortResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CohortResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "researchProjectId": "00000000-0000-4000-8000-000000000001",
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": "valor-ejemplo",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `researchProjectId` | Sí | `string` | formato `uuid` | Identificador asociado a research project. | `00000000-0000-4000-8000-000000000001` |
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Curso no encontrado | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 409 | `CONFLICT` | Ya existe una cohorte con ese código en el curso | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cohorte debe terminar después de empezar | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El curso no está publicado | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/courses/{id}/cohorts"
}
```

---

## 7. POST /education/courses/{id}/instructors

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Asignar un instructor al curso
- **Operation ID:** `EducationController_assignInstructor`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.assignInstructor](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

La ficha se reutiliza si el perfil profesional ya la tiene.


### Descripción del sistema

NestJS resuelve `POST /education/courses/{id}/instructors` en `EducationController_assignInstructor`. El controlador delega en `EducationCatalogService.assignInstructor`. Valida el body como `AssignInstructorDto` y consume `application/json`. El tipo de retorno estático es `Promise<InstructorAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AssignInstructorDto`; los campos opcionales se omiten.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/instructors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "displayName": "Nombre de ejemplo",
  "role": "LEAD"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | No | `string` | formato `uuid` | Perfil profesional; si ya tiene ficha de instructor, se reutiliza | `00000000-0000-4000-8000-000000000001` |
| `userId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `displayName` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `bio` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `credentialsText` | No | `string` | Sin restricción adicional declarada | Titulación tal como se muestra | `valor-ejemplo` |
| `role` | Sí | `string` | valores: `LEAD`, `CO`, `GUEST`, `ASSISTANT` | Sin descripción específica en el contrato OpenAPI. | `LEAD` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/instructors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "bio": "valor-ejemplo",
  "credentialsText": "valor-ejemplo",
  "role": "LEAD"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InstructorAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InstructorAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "instructorId": "00000000-0000-4000-8000-000000000001",
  "courseInstructorId": "00000000-0000-4000-8000-000000000001",
  "instructorExisted": true,
  "ordinal": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `instructorId` | Sí | `string` | formato `uuid` | Identificador asociado a instructor. | `00000000-0000-4000-8000-000000000001` |
| `courseInstructorId` | Sí | `string` | formato `uuid` | Identificador asociado a course instructor. | `00000000-0000-4000-8000-000000000001` |
| `instructorExisted` | Sí | `boolean` | Sin restricción adicional declarada | true si la ficha de instructor ya existía | `true` |
| `ordinal` | Sí | `number` | Sin restricción adicional declarada | Posición en la lista de instructores del curso | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Curso no encontrado | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 409 | `CONFLICT` | El instructor ya está asignado al curso | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 409 | `CONFLICT` | El curso ya tiene instructor titular | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
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
  "path": "/education/courses/{id}/instructors"
}
```

---

## 8. POST /education/courses/{id}/reviews

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Publicar una reseña del curso
- **Operation ID:** `EducationController_createReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.createReview](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

El autor es el usuario autenticado y opina una vez por curso.


### Descripción del sistema

NestJS resuelve `POST /education/courses/{id}/reviews` en `EducationController_createReview`. El controlador delega en `EducationCatalogService.createReview`. Valida el body como `EducationCreateReviewDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReviewResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EducationCreateReviewDto`; los campos opcionales se omiten.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/reviews HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rating": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LEARNER`, `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rating` | Sí | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `reviewText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/reviews HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rating": 1,
  "reviewText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReviewResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReviewResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "courseId": "00000000-0000-4000-8000-000000000001",
  "rating": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `courseId` | Sí | `string` | formato `uuid` | Identificador asociado a course. | `00000000-0000-4000-8000-000000000001` |
| `rating` | Sí | `number` | Sin restricción adicional declarada | Valor de rating mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LEARNER, EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Curso no encontrado | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 409 | `CONFLICT` | El usuario ya reseñó este curso | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
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
  "path": "/education/courses/{id}/reviews"
}
```

---

## 9. POST /education/courses/{id}/versions/publish

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Publicar una versión nueva del curso
- **Operation ID:** `EducationController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.publishVersion](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

El curso pasa a apuntar a la versión publicada.


### Descripción del sistema

NestJS resuelve `POST /education/courses/{id}/versions/publish` en `EducationController_publishVersion`. El controlador delega en `EducationCatalogService.publishVersion`. Valida el body como `EducationPublishVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CourseVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EducationPublishVersionDto`; los campos opcionales se omiten.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `EDUCATION_ADMIN`, `COURSE_AUTHOR`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `changelog` | No | `string` | Sin restricción adicional declarada | Qué cambió respecto de la versión anterior | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/courses/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "changelog": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CourseVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CourseVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "courseId": "00000000-0000-4000-8000-000000000001",
  "version": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `courseId` | Sí | `string` | formato `uuid` | Identificador asociado a course. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Versión publicada; el curso pasa a apuntar a ella | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: EDUCATION_ADMIN, COURSE_AUTHOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Curso no encontrado | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 409 | `CONFLICT` | Esa versión del curso ya existe | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un curso archivado no admite versiones | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/courses/{id}/versions/publish"
}
```

---

## 10. POST /education/courses/publish

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Publicar un curso con sus módulos y lecciones
- **Operation ID:** `EducationController_publishCourse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.publishCourse](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

La duración se deriva de la suma de las lecciones.


### Descripción del sistema

NestJS resuelve `POST /education/courses/publish` en `EducationController_publishCourse`. El controlador delega en `EducationCatalogService.publishCourse`. Valida el body como `PublishCourseDto` y consume `application/json`. El tipo de retorno estático es `Promise<CourseResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishCourseDto`; los campos opcionales se omiten.

```http
POST /education/courses/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "courseType": "SELF_PACED",
  "modules": [
    {
      "title": "valor-ejemplo",
      "lessons": [
        {
          "title": "valor-ejemplo",
          "contentType": "VIDEO"
        }
      ]
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `EDUCATION_ADMIN`, `COURSE_AUTHOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del curso, único | `CODIGO_EJEMPLO` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `courseType` | Sí | `string` | valores: `SELF_PACED`, `INSTRUCTOR_LED` | Sin descripción específica en el contrato OpenAPI. | `SELF_PACED` |
| `level` | No | `string` | valores: `BASIC`, `INTERMEDIATE`, `ADVANCED` | Sin descripción específica en el contrato OpenAPI. | `BASIC` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languageConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isAccredited` | No | `boolean` | Sin restricción adicional declarada | Un curso acreditado otorga créditos CME al completarse | `false` |
| `cmeCreditHours` | No | `string` | Sin restricción adicional declarada | Horas CME que otorga; obligatorio si está acreditado | `valor-ejemplo` |
| `accreditingBodyConceptId` | No | `string` | formato `uuid` | Organismo acreditador | `00000000-0000-4000-8000-000000000001` |
| `price` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `modules` | Sí | `array<CourseModuleDto>` | mínimo 1 elemento(s) | Módulos del curso, al menos uno | `[{"title":"valor-ejemplo","description":"Texto descriptivo de ejemplo","lessons":[{"title":"valor-ejemplo","contentType":"VIDEO","mediaFileId":"00000000-0000-4000-8000-000000000001","externalUrl":"valor-ejemplo","durationMinutes":1,"isPreview":false}]}]` |
| `modules[].title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `modules[].lessons` | Sí | `array<LessonDto>` | mínimo 1 elemento(s) | Lecciones del módulo, al menos una | `[{"title":"valor-ejemplo","contentType":"VIDEO","mediaFileId":"00000000-0000-4000-8000-000000000001","externalUrl":"valor-ejemplo","durationMinutes":1,"isPreview":false}]` |
| `modules[].lessons[].title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].lessons[].contentType` | Sí | `string` | valores: `VIDEO`, `ARTICLE`, `PDF`, `SCORM`, `QUIZ`, `LIVE_SESSION` | Sin descripción específica en el contrato OpenAPI. | `VIDEO` |
| `modules[].lessons[].mediaFileId` | No | `string` | formato `uuid` | Archivo en `common.files` | `00000000-0000-4000-8000-000000000001` |
| `modules[].lessons[].externalUrl` | No | `string` | Sin restricción adicional declarada | Recurso externo cuando el contenido no se aloja aquí | `valor-ejemplo` |
| `modules[].lessons[].durationMinutes` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].lessons[].isPreview` | No | `boolean` | Sin restricción adicional declarada | Visible sin inscripción, como muestra del curso | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/courses/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "courseType": "SELF_PACED",
  "level": "BASIC",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "languageConceptId": "00000000-0000-4000-8000-000000000001",
  "isAccredited": false,
  "cmeCreditHours": "valor-ejemplo",
  "accreditingBodyConceptId": "00000000-0000-4000-8000-000000000001",
  "price": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "modules": [
    {
      "title": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "lessons": [
        {
          "title": "valor-ejemplo",
          "contentType": "VIDEO",
          "mediaFileId": "00000000-0000-4000-8000-000000000001",
          "externalUrl": "valor-ejemplo",
          "durationMinutes": 1,
          "isPreview": false
        }
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CourseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CourseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CourseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "currentVersion": 1,
  "moduleIds": [
    "valor-ejemplo"
  ],
  "lessons": 1,
  "durationMinutes": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `currentVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de current version mantenido por la instancia. | `1` |
| `moduleIds` | Sí | `array<string>` | formato `uuid` | Valor de module ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `lessons` | Sí | `number` | Sin restricción adicional declarada | Lecciones creadas en total | `1` |
| `durationMinutes` | Sí | `number` | Sin restricción adicional declarada | Duración derivada de la suma de las lecciones, en minutos | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: EDUCATION_ADMIN, COURSE_AUTHOR. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un curso con ese código | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un curso acreditado necesita declarar sus horas CME | Excepción explícita en src/modules/education/services/education-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/courses/publish"
}
```

---

## 11. POST /education/enrollments

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Inscribir a un aprendiz
- **Operation ID:** `EducationController_enrollLearner`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.enrollLearner](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

La capacidad de la cohorte se comprueba bajo bloqueo.


### Descripción del sistema

NestJS resuelve `POST /education/enrollments` en `EducationController_enrollLearner`. El controlador delega en `EducationLearningService.enrollLearner`. Valida el body como `EnrollLearnerDto` y consume `application/json`. El tipo de retorno estático es `Promise<EnrollmentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EnrollLearnerDto`; los campos opcionales se omiten.

```http
POST /education/enrollments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "courseId": "00000000-0000-4000-8000-000000000001",
  "learnerType": "PRACTITIONER",
  "learnerRefId": "00000000-0000-4000-8000-000000000001",
  "source": "SELF"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `EDUCATION_ADMIN`, `LEARNER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `courseId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cohortId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `learnerType` | Sí | `string` | valores: `PRACTITIONER`, `STAFF`, `PATIENT`, `USER` | Sin descripción específica en el contrato OpenAPI. | `PRACTITIONER` |
| `learnerRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `source` | Sí | `string` | valores: `SELF`, `ASSIGNED`, `PURCHASED`, `PARTNER` | Sin descripción específica en el contrato OpenAPI. | `SELF` |
| `paymentIntentId` | No | `string` | formato `uuid` | Intento de pago; obligatorio si la inscripción es PURCHASED | `00000000-0000-4000-8000-000000000001` |
| `expiresAt` | No | `string` | formato `date-time` | Caducidad del acceso | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/enrollments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "courseId": "00000000-0000-4000-8000-000000000001",
  "cohortId": "00000000-0000-4000-8000-000000000001",
  "learnerType": "PRACTITIONER",
  "learnerRefId": "00000000-0000-4000-8000-000000000001",
  "source": "SELF",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EnrollmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EnrollmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "progressPercent": "valor-ejemplo",
  "cohortEnrolledCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `progressPercent` | Sí | `string` | Sin restricción adicional declarada | Progreso del curso, en porcentaje | `valor-ejemplo` |
| `cohortEnrolledCount` | No | `number` | Sin restricción adicional declarada | Plazas ocupadas de la cohorte tras inscribir | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: EDUCATION_ADMIN, LEARNER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Curso no encontrado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 404 | `NOT_FOUND` | Cohorte no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 409 | `CONFLICT` | El aprendiz ya está inscrito en el curso | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 409 | `CONFLICT` | La cohorte no tiene plazas disponibles | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una inscripción comprada necesita su intento de pago | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | El curso no está publicado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | La cohorte pertenece a otro curso | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | La cohorte no está abierta | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/enrollments"
}
```

---

## 12. POST /education/enrollments/{id}/certificate

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Emitir el certificado verificable
- **Operation ID:** `EducationController_issueCertificate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.issueCertificate](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

Idempotente por inscripción; las horas CME salen del curso.


### Descripción del sistema

NestJS resuelve `POST /education/enrollments/{id}/certificate` en `EducationController_issueCertificate`. El controlador delega en `EducationLearningService.issueCertificate`. Valida el body como `IssueCertificateDto` y consume `application/json`. El tipo de retorno estático es `Promise<CertificateResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueCertificateDto`; los campos opcionales se omiten.

```http
POST /education/enrollments/00000000-0000-4000-8000-000000000001/certificate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `EDUCATION_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileId` | No | `string` | formato `uuid` | Documento del certificado | `00000000-0000-4000-8000-000000000001` |
| `validityMonths` | No | `number` | mínimo 1 | Vigencia del certificado, en meses | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/enrollments/00000000-0000-4000-8000-000000000001/certificate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "validityMonths": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CertificateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CertificateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CertificateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "certificateNumber": "valor-ejemplo",
  "verificationCode": "CODIGO_EJEMPLO",
  "cmeCreditsAwarded": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "alreadyIssued": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `certificateNumber` | Sí | `string` | Sin restricción adicional declarada | Número del certificado | `valor-ejemplo` |
| `verificationCode` | Sí | `string` | Sin restricción adicional declarada | Código con el que un tercero lo verifica | `CODIGO_EJEMPLO` |
| `cmeCreditsAwarded` | No | `string` | Sin restricción adicional declarada | Horas CME acreditadas | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `alreadyIssued` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba emitido | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, EDUCATION_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Inscripción no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 404 | `NOT_FOUND` | Curso no encontrado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 409 | `CONFLICT` | No se pudo generar un número de certificado libre | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 409 | `CONFLICT` | No se pudo generar un código de verificación libre | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La inscripción no está completada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/enrollments/{id}/certificate"
}
```

---

## 13. POST /education/enrollments/{id}/complete

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Completar el curso
- **Operation ID:** `EducationController_completeEnrollment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.completeEnrollment](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

Exige progreso al 100 y todas las evaluaciones puntuables aprobadas.


### Descripción del sistema

NestJS resuelve `POST /education/enrollments/{id}/complete` en `EducationController_completeEnrollment`. El controlador delega en `EducationLearningService.completeEnrollment`. No recibe body. El tipo de retorno estático es `Promise<CompleteEnrollmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /education/enrollments/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `EDUCATION_ADMIN`, `LEARNER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /education/enrollments/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CompleteEnrollmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CompleteEnrollmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "progressPercent": "valor-ejemplo",
  "alreadyCompleted": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `progressPercent` | Sí | `string` | Sin restricción adicional declarada | Valor de progress percent mantenido por la instancia. | `valor-ejemplo` |
| `alreadyCompleted` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba completada | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, EDUCATION_ADMIN, LEARNER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Inscripción no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | La inscripción no está activa | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | El curso no está completo | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | Quedan evaluaciones sin aprobar | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/enrollments/{id}/complete"
}
```

---

## 14. POST /education/enrollments/{id}/lesson-progress

- **Módulo:** `education`
- **Etiqueta OpenAPI:** `education`
- **Nombre:** Registrar el progreso de una lección
- **Operation ID:** `EducationController_recordProgress`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [EducationController.recordProgress](../../src/modules/education/controllers/education.controller.ts)

### Descripción de negocio

Log append-only; el progreso del curso se recalcula.


### Descripción del sistema

NestJS resuelve `POST /education/enrollments/{id}/lesson-progress` en `EducationController_recordProgress`. El controlador delega en `EducationLearningService.recordProgress`. Valida el body como `RecordProgressDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProgressResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordProgressDto`; los campos opcionales se omiten.

```http
POST /education/enrollments/00000000-0000-4000-8000-000000000001/lesson-progress HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lessonId": "00000000-0000-4000-8000-000000000001",
  "status": "IN_PROGRESS"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LEARNER`, `EDUCATION_ADMIN`, `SYSTEM`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `lessonId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `IN_PROGRESS`, `COMPLETED` | Sin descripción específica en el contrato OpenAPI. | `IN_PROGRESS` |
| `secondsWatched` | No | `number` | mínimo 0 | Segundos vistos del contenido | `1` |
| `completionPercent` | No | `string` | Sin restricción adicional declarada | Porcentaje visto de la lección | `valor-ejemplo` |
| `occurredAt` | No | `string` | formato `date-time` | Cuándo ocurrió; por defecto, ahora | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /education/enrollments/00000000-0000-4000-8000-000000000001/lesson-progress HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lessonId": "00000000-0000-4000-8000-000000000001",
  "status": "IN_PROGRESS",
  "secondsWatched": 1,
  "completionPercent": "valor-ejemplo",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProgressResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProgressResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProgressResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "enrollmentId": "00000000-0000-4000-8000-000000000001",
  "progressPercent": "valor-ejemplo",
  "completedLessons": 1,
  "totalLessons": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Anotación de progreso creada | `00000000-0000-4000-8000-000000000001` |
| `enrollmentId` | Sí | `string` | formato `uuid` | Identificador asociado a enrollment. | `00000000-0000-4000-8000-000000000001` |
| `progressPercent` | Sí | `string` | Sin restricción adicional declarada | Progreso del curso recalculado | `valor-ejemplo` |
| `completedLessons` | Sí | `number` | Sin restricción adicional declarada | Lecciones completadas | `1` |
| `totalLessons` | Sí | `number` | Sin restricción adicional declarada | Lecciones publicadas del curso | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LEARNER, EDUCATION_ADMIN, SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Inscripción no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 404 | `NOT_FOUND` | Lección no encontrada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La inscripción está cancelada | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 422 | `PRECONDITION_FAILED` | El acceso a la inscripción ha caducado | Excepción explícita en src/modules/education/services/education-learning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/education/enrollments/{id}/lesson-progress"
}
```

---

