<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `education`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 14 (14 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 14 · BAJO 0
- **Tablas distintas que tocan:** 15
- **Respuestas de error y detalle contractual:** `openapi/endpoints/education.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/education/assessments/{id}/attempts` | Iniciar un intento de evaluación | MEDIO | 4 | LEARNER, EDUCATION_ADMIN |
| 2 | POST | `/education/attempts/{id}/submit` | Enviar y calificar el intento | MEDIO | 4 | LEARNER, EDUCATION_ADMIN |
| 3 | POST | `/education/certificates/{id}/cme-credits` | Acreditar las horas CME al profesional | MEDIO | 4 | SYSTEM, EDUCATION_ADMIN |
| 4 | POST | `/education/certificates/{id}/revoke` | Revocar el certificado y revertir sus créditos CME | MEDIO | 4 | EDUCATION_ADMIN |
| 5 | POST | `/education/courses/{id}/assessments` | Diseñar una evaluación con sus preguntas | MEDIO | 4 | EDUCATION_ADMIN, COURSE_AUTHOR |
| 6 | POST | `/education/courses/{id}/cohorts` | Abrir una cohorte del curso | MEDIO | 3 | EDUCATION_ADMIN |
| 7 | POST | `/education/courses/{id}/instructors` | Asignar un instructor al curso | MEDIO | 5 | EDUCATION_ADMIN |
| 8 | POST | `/education/courses/{id}/reviews` | Publicar una reseña del curso | MEDIO | 3 | LEARNER, EDUCATION_ADMIN |
| 9 | POST | `/education/courses/{id}/versions/publish` | Publicar una versión nueva del curso | MEDIO | 4 | EDUCATION_ADMIN, COURSE_AUTHOR |
| 10 | POST | `/education/courses/publish` | Publicar un curso con sus módulos y lecciones | MEDIO | 5 | EDUCATION_ADMIN, COURSE_AUTHOR |
| 11 | POST | `/education/enrollments` | Inscribir a un aprendiz | MEDIO | 5 | EDUCATION_ADMIN, LEARNER |
| 12 | POST | `/education/enrollments/{id}/certificate` | Emitir el certificado verificable | MEDIO | 4 | SYSTEM, EDUCATION_ADMIN |
| 13 | POST | `/education/enrollments/{id}/complete` | Completar el curso | MEDIO | 7 | SYSTEM, EDUCATION_ADMIN, LEARNER |
| 14 | POST | `/education/enrollments/{id}/lesson-progress` | Registrar el progreso de una lección | MEDIO | 6 | LEARNER, EDUCATION_ADMIN, SYSTEM |

---

## 1. POST /education/assessments/{id}/attempts

- **Origen:** CONTRATO
- **Nombre:** Iniciar un intento de evaluación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.startAttempt` — `src/modules/education/controllers/education.controller.ts:167`

### Qué es y para qué sirve (negocio)

Iniciar un intento de evaluación. Caso de uso UC-47-08: Iniciar intento. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/assessments/{id}/attempts` la atiende `EducationController.startAttempt` (src/modules/education/controllers/education.controller.ts:167). Exige sesión con alguno de los roles LEARNER, EDUCATION_ADMIN. Valida el cuerpo como `StartAttemptDto` (1 campo, 1 obligatorio). Delega en `EducationLearningService.startAttempt`. Crea filas en education.assessment_attempts. Lee education.assessment_attempts, education.assessments, education.enrollments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LEARNER, EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:167` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.assessment_attempts` | ESCRIBE | CREA | DIRECTA | EducationController.startAttempt → EducationLearningService.startAttempt → EducationLearningRepository.createAttempt | `src/modules/education/repositories/education-learning.repository.ts:293` |
| `education.assessment_attempts` | LEE | LEE | DIRECTA | EducationController.startAttempt → EducationLearningService.startAttempt → EducationLearningRepository.findAttemptsForUpdate | `src/modules/education/repositories/education-learning.repository.ts:334` |
| `education.assessments` | LEE | LEE | DIRECTA | EducationController.startAttempt → EducationLearningService.startAttempt → EducationCatalogRepository.findAssessmentById | `src/modules/education/repositories/education-catalog.repository.ts:698` |
| `education.enrollments` | LEE | LEE | DIRECTA | EducationController.startAttempt → EducationLearningService.startAttempt → EducationLearningRepository.findEnrollmentById | `src/modules/education/repositories/education-learning.repository.ts:147` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `StartAttemptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `enrollmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:910` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "enrollmentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "enrollmentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AttemptResponseDto>` · DTO `AttemptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:921` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:927` |
| `outcome` | `string` | Sí | formato uuid | — | Valor de outcome mantenido por la instancia. | sin fuente |
| `checkStatus` | `string` | Sí | formato uuid | — | Valor de check status mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Evaluación no encontrada; ResourceNotFoundException: Inscripción no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un intento en curso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción es de otro curso; PreconditionFailedException: La inscripción no está activa; PreconditionFailedException: Se agotaron los intentos permitidos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:143` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-08`

---

## 2. POST /education/attempts/{id}/submit

- **Origen:** CONTRATO
- **Nombre:** Enviar y calificar el intento
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.submitAttempt` — `src/modules/education/controllers/education.controller.ts:184`

### Qué es y para qué sirve (negocio)

Enviar y calificar el intento. Caso de uso UC-47-09: Enviar y calificar. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/attempts/{id}/submit` la atiende `EducationController.submitAttempt` (src/modules/education/controllers/education.controller.ts:184). Exige sesión con alguno de los roles LEARNER, EDUCATION_ADMIN. Valida el cuerpo como `SubmitAttemptDto` (1 campo, 1 obligatorio). Delega en `EducationLearningService.submitAttempt`. Actualiza education.assessment_attempts. Lee education.assessment_attempts, education.assessment_questions, education.assessments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LEARNER, EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:184` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.assessment_attempts` | ESCRIBE | ACTUALIZA | POR_TIPO | EducationController.submitAttempt → EducationLearningService.submitAttempt | `src/modules/education/services/education-learning.service.ts:459` |
| `education.assessment_attempts` | LEE | LEE | DIRECTA | EducationController.submitAttempt → EducationLearningService.submitAttempt → EducationLearningRepository.findAttemptForUpdate | `src/modules/education/repositories/education-learning.repository.ts:318` |
| `education.assessment_questions` | LEE | LEE | DIRECTA | EducationController.submitAttempt → EducationLearningService.submitAttempt → EducationCatalogRepository.findQuestionsByAssessment | `src/modules/education/repositories/education-catalog.repository.ts:779` |
| `education.assessments` | LEE | LEE | DIRECTA | EducationController.submitAttempt → EducationLearningService.submitAttempt → EducationCatalogRepository.findAssessmentById | `src/modules/education/repositories/education-catalog.repository.ts:698` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitAttemptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `responsesJson` | `object` | Sí | — | `@IsObject()` | Respuestas por pregunta, con la forma { "<questionId>": <respuesta> } | `src/modules/education/dto/education.dto.ts:954` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "responsesJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "responsesJson": {}
}
```

</details>

### Respuesta — `Promise<GradedAttemptResponseDto>` · DTO `GradedAttemptResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:965` |
| `score` | `string` | Sí | — | — | Puntuación obtenida, en porcentaje | `src/modules/education/dto/education.dto.ts:971` |
| `passed` | `boolean` | Sí | — | — | Valor de passed mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:977` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:983` |
| `correctAnswers` | `number` | Sí | — | — | Preguntas acertadas | `src/modules/education/dto/education.dto.ts:989` |
| `totalQuestions` | `number` | Sí | — | — | Preguntas de la evaluación | `src/modules/education/dto/education.dto.ts:995` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intento no encontrado; ResourceNotFoundException: Evaluación no encontrada |
| 409 | `CONFLICT` | ConflictException: El intento ya fue corregido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tiempo del intento venció |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:144` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-09`

---

## 3. POST /education/certificates/{id}/cme-credits

- **Origen:** CONTRATO
- **Nombre:** Acreditar las horas CME al profesional
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.recordCmeCredit` — `src/modules/education/controllers/education.controller.ts:233`

### Qué es y para qué sirve (negocio)

Acreditar las horas CME al profesional. Caso de uso UC-47-12: Acreditar CME. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/certificates/{id}/cme-credits` la atiende `EducationController.recordCmeCredit` (src/modules/education/controllers/education.controller.ts:233). Exige sesión con alguno de los roles SYSTEM, EDUCATION_ADMIN. Valida el cuerpo como `RecordCmeCreditDto` (4 campos, 1 obligatorio). Delega en `EducationLearningService.recordCmeCredit`. Crea filas en education.cme_credit_records. Lee education.certificates, education.cme_credit_records, education.courses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:233` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:233` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.certificates` | LEE | LEE | DIRECTA | EducationController.recordCmeCredit → EducationLearningService.recordCmeCredit → EducationLearningRepository.findCertificateById | `src/modules/education/repositories/education-learning.repository.ts:395` |
| `education.cme_credit_records` | ESCRIBE | CREA | DIRECTA | EducationController.recordCmeCredit → EducationLearningService.recordCmeCredit → EducationLearningRepository.createCmeRecord | `src/modules/education/repositories/education-learning.repository.ts:502` |
| `education.cme_credit_records` | LEE | LEE | DIRECTA | EducationController.recordCmeCredit → EducationLearningService.recordCmeCredit → EducationLearningRepository.findCmeRecord | `src/modules/education/repositories/education-learning.repository.ts:526` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.recordCmeCredit → EducationLearningService.recordCmeCredit → EducationCatalogRepository.findCourseById | `src/modules/education/repositories/education-catalog.repository.ts:183` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordCmeCreditDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil profesional al que se acredita | `src/modules/education/dto/education.dto.ts:1146` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:1154` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:1162` |
| `periodYear` | `number` | No | mínimo 2000; máximo 2100 | `@IsOptional()` `@IsInt()` `@Min(2000)` `@Max(2100)` | Año del periodo de acreditación; por defecto, el actual | `src/modules/education/dto/education.dto.ts:1174` |

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
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "periodYear": 2000
}
```

</details>

### Respuesta — `Promise<CmeCreditResponseDto>` · DTO `CmeCreditResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:1185` |
| `creditHours` | `string` | Sí | — | — | Horas acreditadas | `src/modules/education/dto/education.dto.ts:1191` |
| `periodYear` | `number` | Sí | — | — | Valor de period year mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:1197` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:1203` |
| `alreadyAwarded` | `boolean` | Sí | — | — | true si el crédito ya estaba acreditado | `src/modules/education/dto/education.dto.ts:1209` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Certificado no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El certificado no está vigente; PreconditionFailedException: El certificado no otorga créditos CME; PreconditionFailedException: El curso no declara organismo acreditador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:178` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-12`

---

## 4. POST /education/certificates/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar el certificado y revertir sus créditos CME
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.revokeCertificate` — `src/modules/education/controllers/education.controller.ts:266`

### Qué es y para qué sirve (negocio)

Revocar el certificado y revertir sus créditos CME. Caso de uso UC-47-14: Revocar y revertir CME. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/certificates/{id}/revoke` la atiende `EducationController.revokeCertificate` (src/modules/education/controllers/education.controller.ts:266). Exige sesión con alguno de los roles EDUCATION_ADMIN. Valida el cuerpo como `RevokeCertificateDto` (1 campo, 1 obligatorio). Delega en `EducationLearningService.revokeCertificate`. Actualiza education.certificates, education.cme_credit_records. Lee education.certificates, education.cme_credit_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:266` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:266` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.certificates` | ESCRIBE | ACTUALIZA | POR_TIPO | EducationController.revokeCertificate → EducationLearningService.revokeCertificate | `src/modules/education/services/education-learning.service.ts:798` |
| `education.certificates` | LEE | LEE | DIRECTA | EducationController.revokeCertificate → EducationLearningService.revokeCertificate → EducationLearningRepository.findCertificateForUpdate | `src/modules/education/repositories/education-learning.repository.ts:409` |
| `education.cme_credit_records` | ESCRIBE | ACTUALIZA | POR_TIPO | EducationController.revokeCertificate → EducationLearningService.revokeCertificate | `src/modules/education/services/education-learning.service.ts:793` |
| `education.cme_credit_records` | LEE | LEE | DIRECTA | EducationController.revokeCertificate → EducationLearningService.revokeCertificate → EducationLearningRepository.findCmeRecordsForUpdate | `src/modules/education/repositories/education-learning.repository.ts:537` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RevokeCertificateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se revoca | `src/modules/education/dto/education.dto.ts:1106` |

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

### Respuesta — `Promise<RevokeCertificateResponseDto>` · DTO `RevokeCertificateResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:1117` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:1123` |
| `cmeRecordsReversed` | `number` | Sí | — | — | Créditos CME revertidos | `src/modules/education/dto/education.dto.ts:1129` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Certificado no encontrado |
| 409 | `CONFLICT` | ConflictException: El certificado ya está revocado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:207` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-14`

---

## 5. POST /education/courses/{id}/assessments

- **Origen:** CONTRATO
- **Nombre:** Diseñar una evaluación con sus preguntas
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.createAssessment` — `src/modules/education/controllers/education.controller.ts:151`

### Qué es y para qué sirve (negocio)

Diseñar una evaluación con sus preguntas. Caso de uso UC-47-07: Diseñar evaluación. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/courses/{id}/assessments` la atiende `EducationController.createAssessment` (src/modules/education/controllers/education.controller.ts:151). Exige sesión con alguno de los roles EDUCATION_ADMIN, COURSE_AUTHOR. Valida el cuerpo como `CreateAssessmentDto` (13 campos, 5 obligatorios). Delega en `EducationCatalogService.createAssessment`. Crea filas en education.assessment_questions, education.assessments. Lee education.course_modules, education.courses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: EDUCATION_ADMIN, COURSE_AUTHOR | `src/modules/education/controllers/education.controller.ts:151` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:151` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.assessment_questions` | ESCRIBE | CREA | DIRECTA | EducationController.createAssessment → EducationCatalogService.createAssessment → EducationCatalogRepository.createQuestion | `src/modules/education/repositories/education-catalog.repository.ts:758` |
| `education.assessments` | ESCRIBE | CREA | DIRECTA | EducationController.createAssessment → EducationCatalogService.createAssessment → EducationCatalogRepository.createAssessment | `src/modules/education/repositories/education-catalog.repository.ts:669` |
| `education.course_modules` | LEE | LEE | DIRECTA | EducationController.createAssessment → EducationCatalogService.createAssessment → EducationCatalogRepository.findModulesByCourse | `src/modules/education/repositories/education-catalog.repository.ts:343` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.createAssessment → EducationCatalogService.createAssessment → EducationCatalogRepository.findCourseById | `src/modules/education/repositories/education-catalog.repository.ts:183` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAssessmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `courseModuleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Módulo al que pertenece la evaluación | `src/modules/education/dto/education.dto.ts:803` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/education/dto/education.dto.ts:811` |
| `assessmentType` | `string` | Sí | valores: QUIZ, EXAM, SURVEY | `@IsIn(ASSESSMENT_TYPES)` | — | `src/modules/education/dto/education.dto.ts:818` |
| `passingScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntuación mínima para aprobar, en porcentaje | `src/modules/education/dto/education.dto.ts:828` |
| `maxAttempts` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Intentos permitidos | `src/modules/education/dto/education.dto.ts:837` |
| `timeLimitMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/education/dto/education.dto.ts:846` |
| `isGraded` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Una encuesta no puntúa | `src/modules/education/dto/education.dto.ts:854` |
| `questions` | `array<AssessmentQuestionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => AssessmentQuestionDto)` | Preguntas, al menos una | `src/modules/education/dto/education.dto.ts:867` |
| `questions[].questionType` | `string` | Sí | valores: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, MATCHING | `@IsIn(QUESTION_TYPES)` | — | `src/modules/education/dto/education.dto.ts:755` |
| `questions[].promptText` | `string` | Sí | — | `@IsString()` | Enunciado | `src/modules/education/dto/education.dto.ts:762` |
| `questions[].optionsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Opciones que se muestran al aprendiz | `src/modules/education/dto/education.dto.ts:770` |
| `questions[].correctAnswerJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Respuesta correcta. Sólo la lee la corrección; nunca se devuelve al aprendiz. | `src/modules/education/dto/education.dto.ts:781` |
| `questions[].points` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntos de la pregunta | `src/modules/education/dto/education.dto.ts:789` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AssessmentResponseDto>` · DTO `AssessmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:878` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:884` |
| `questionIds` | `array<string>` | Sí | formato uuid | — | Valor de question ids mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:890` |
| `totalPoints` | `string` | Sí | — | — | Suma de los puntos de las preguntas | `src/modules/education/dto/education.dto.ts:896` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una evaluación puntuable necesita respuesta correcta en cada pregunta; PreconditionFailedException: El módulo no pertenece al curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:127` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-07`

---

## 6. POST /education/courses/{id}/cohorts

- **Origen:** CONTRATO
- **Nombre:** Abrir una cohorte del curso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.openCohort` — `src/modules/education/controllers/education.controller.ts:107`

### Qué es y para qué sirve (negocio)

Abrir una cohorte del curso. Caso de uso UC-47-04: Abrir cohorte. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/courses/{id}/cohorts` la atiende `EducationController.openCohort` (src/modules/education/controllers/education.controller.ts:107). Exige sesión con alguno de los roles EDUCATION_ADMIN. Valida el cuerpo como `OpenCohortDto` (5 campos, 2 obligatorios). Delega en `EducationCatalogService.openCohort`. Crea filas en education.course_cohorts. Lee education.course_cohorts, education.courses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:107` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.course_cohorts` | ESCRIBE | CREA | DIRECTA | EducationController.openCohort → EducationCatalogService.openCohort → EducationCatalogRepository.createCohort | `src/modules/education/repositories/education-catalog.repository.ts:613` |
| `education.course_cohorts` | LEE | LEE | DIRECTA | EducationController.openCohort → EducationCatalogService.openCohort → EducationCatalogRepository.findCohortByCode | `src/modules/education/repositories/education-catalog.repository.ts:644` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.openCohort → EducationCatalogService.openCohort → EducationCatalogRepository.findCourseById | `src/modules/education/repositories/education-catalog.repository.ts:183` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `OpenCohortDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de la cohorte, único por curso | `src/modules/education/dto/education.dto.ts:471` |
| `deliveryMode` | `string` | Sí | valores: ONLINE, IN_PERSON, HYBRID | `@IsIn(DELIVERY_MODES)` | — | `src/modules/education/dto/education.dto.ts:478` |
| `startDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/education/dto/education.dto.ts:486` |
| `endDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/education/dto/education.dto.ts:494` |
| `capacity` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Plazas; sin ella la cohorte no tiene límite | `src/modules/education/dto/education.dto.ts:505` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "deliveryMode": "ONLINE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "deliveryMode": "ONLINE",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "capacity": 1
}
```

</details>

### Respuesta — `Promise<CohortResponseDto>` · DTO `CohortResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `researchProjectId` | `string` | Sí | formato uuid | — | Identificador asociado a research project. | sin fuente |
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:516` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:522` |
| `version` | `string` | Sí | — | — | Valor de version mantenido por la instancia. | sin fuente |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una cohorte con ese código en el curso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cohorte debe terminar después de empezar; PreconditionFailedException: El curso no está publicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:82` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-04`

---

## 7. POST /education/courses/{id}/instructors

- **Origen:** CONTRATO
- **Nombre:** Asignar un instructor al curso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.assignInstructor` — `src/modules/education/controllers/education.controller.ts:91`

### Qué es y para qué sirve (negocio)

Asignar un instructor al curso. Caso de uso UC-47-03: Asignar instructor. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/courses/{id}/instructors` la atiende `EducationController.assignInstructor` (src/modules/education/controllers/education.controller.ts:91). Exige sesión con alguno de los roles EDUCATION_ADMIN. Valida el cuerpo como `AssignInstructorDto` (6 campos, 2 obligatorios). Delega en `EducationCatalogService.assignInstructor`. Crea filas en education.course_instructors, education.instructors. Lee education.course_instructors, education.courses, education.instructors.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:91` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.course_instructors` | ESCRIBE | CREA | DIRECTA | EducationController.assignInstructor → EducationCatalogService.assignInstructor → EducationCatalogRepository.createCourseInstructor | `src/modules/education/repositories/education-catalog.repository.ts:540` |
| `education.course_instructors` | LEE | LEE | DIRECTA | EducationController.assignInstructor → EducationCatalogService.assignInstructor → EducationCatalogRepository.findCourseInstructors | `src/modules/education/repositories/education-catalog.repository.ts:564` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.assignInstructor → EducationCatalogService.assignInstructor → EducationCatalogRepository.findCourseById | `src/modules/education/repositories/education-catalog.repository.ts:183` |
| `education.instructors` | ESCRIBE | CREA | DIRECTA | EducationController.assignInstructor → EducationCatalogService.assignInstructor → EducationCatalogRepository.createInstructor | `src/modules/education/repositories/education-catalog.repository.ts:484` |
| `education.instructors` | LEE | LEE | DIRECTA | EducationController.assignInstructor → EducationCatalogService.assignInstructor → EducationCatalogRepository.findInstructorByProfile | `src/modules/education/repositories/education-catalog.repository.ts:505` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AssignInstructorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil profesional; si ya tiene ficha de instructor, se reutiliza | `src/modules/education/dto/education.dto.ts:379` |
| `userId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:387` |
| `displayName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/education/dto/education.dto.ts:395` |
| `bio` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/education/dto/education.dto.ts:403` |
| `credentialsText` | `string` | No | — | `@IsOptional()` `@IsString()` | Titulación tal como se muestra | `src/modules/education/dto/education.dto.ts:411` |
| `role` | `string` | Sí | valores: LEAD, CO, GUEST, ASSISTANT | `@IsIn(INSTRUCTOR_ROLES)` | — | `src/modules/education/dto/education.dto.ts:418` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "displayName": "Nombre de ejemplo",
  "role": "LEAD"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "bio": "valor-ejemplo",
  "credentialsText": "valor-ejemplo",
  "role": "LEAD"
}
```

</details>

### Respuesta — `Promise<InstructorAssignmentResponseDto>` · DTO `InstructorAssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `instructorId` | `string` | Sí | formato uuid | — | Identificador asociado a instructor. | `src/modules/education/dto/education.dto.ts:429` |
| `courseInstructorId` | `string` | Sí | formato uuid | — | Identificador asociado a course instructor. | `src/modules/education/dto/education.dto.ts:435` |
| `instructorExisted` | `boolean` | Sí | — | — | true si la ficha de instructor ya existía | `src/modules/education/dto/education.dto.ts:441` |
| `ordinal` | `number` | Sí | — | — | Posición en la lista de instructores del curso | `src/modules/education/dto/education.dto.ts:449` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
| 409 | `CONFLICT` | ConflictException: El instructor ya está asignado al curso; ConflictException: El curso ya tiene instructor titular |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:81` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-03`

---

## 8. POST /education/courses/{id}/reviews

- **Origen:** CONTRATO
- **Nombre:** Publicar una reseña del curso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.createReview` — `src/modules/education/controllers/education.controller.ts:249`

### Qué es y para qué sirve (negocio)

Publicar una reseña del curso. Caso de uso UC-47-13: Publicar reseña. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/courses/{id}/reviews` la atiende `EducationController.createReview` (src/modules/education/controllers/education.controller.ts:249). Exige sesión con alguno de los roles LEARNER, EDUCATION_ADMIN. Valida el cuerpo como `EducationCreateReviewDto` (2 campos, 1 obligatorio). Delega en `EducationCatalogService.createReview`. Crea filas en education.course_reviews. Lee education.course_reviews, education.courses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LEARNER, EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:249` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:249` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.course_reviews` | ESCRIBE | CREA | DIRECTA | EducationController.createReview → EducationCatalogService.createReview → EducationCatalogRepository.createReview | `src/modules/education/repositories/education-catalog.repository.ts:824` |
| `education.course_reviews` | LEE | LEE | DIRECTA | EducationController.createReview → EducationCatalogService.createReview → EducationCatalogRepository.findReviewByReviewer | `src/modules/education/repositories/education-catalog.repository.ts:844` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.createReview → EducationCatalogService.createReview → EducationCatalogRepository.findCourseById | `src/modules/education/repositories/education-catalog.repository.ts:183` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EducationCreateReviewDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rating` | `number` | Sí | mínimo 1; máximo 5 | `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/education/dto/education.dto.ts:1226` |
| `reviewText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/education/dto/education.dto.ts:1234` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "rating": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "rating": 1,
  "reviewText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReviewResponseDto>` · DTO `ReviewResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:1245` |
| `courseId` | `string` | Sí | formato uuid | — | Identificador asociado a course. | `src/modules/education/dto/education.dto.ts:1251` |
| `rating` | `number` | Sí | — | — | Valor de rating mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:1257` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:1263` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
| 409 | `CONFLICT` | ConflictException: El usuario ya reseñó este curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:197` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-13`

---

## 9. POST /education/courses/{id}/versions/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión nueva del curso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.publishVersion` — `src/modules/education/controllers/education.controller.ts:75`

### Qué es y para qué sirve (negocio)

Publicar una versión nueva del curso. Caso de uso UC-47-02: Publicar versión del curso. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/courses/{id}/versions/publish` la atiende `EducationController.publishVersion` (src/modules/education/controllers/education.controller.ts:75). Exige sesión con alguno de los roles EDUCATION_ADMIN, COURSE_AUTHOR. Valida el cuerpo como `EducationPublishVersionDto` (1 campo, 0 obligatorios). Delega en `EducationCatalogService.publishVersion`. Crea filas en education.course_versions. Actualiza education.courses. Lee education.course_versions, education.courses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: EDUCATION_ADMIN, COURSE_AUTHOR | `src/modules/education/controllers/education.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:75` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.course_versions` | ESCRIBE | CREA | DIRECTA | EducationController.publishVersion → EducationCatalogService.publishVersion → EducationCatalogRepository.createVersion | `src/modules/education/repositories/education-catalog.repository.ts:408` |
| `education.course_versions` | LEE | LEE | DIRECTA | EducationController.publishVersion → EducationCatalogService.publishVersion → EducationCatalogRepository.findVersion | `src/modules/education/repositories/education-catalog.repository.ts:435` |
| `education.courses` | ESCRIBE | ACTUALIZA | POR_TIPO | EducationController.publishVersion → EducationCatalogService.publishVersion | `src/modules/education/services/education-catalog.service.ts:263` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.publishVersion → EducationCatalogService.publishVersion → EducationCatalogRepository.findCourseForUpdate | `src/modules/education/repositories/education-catalog.repository.ts:194` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EducationPublishVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `changelog` | `string` | No | — | `@IsOptional()` `@IsString()` | Qué cambió respecto de la versión anterior | `src/modules/education/dto/education.dto.ts:331` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "changelog": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CourseVersionResponseDto>` · DTO `CourseVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:342` |
| `courseId` | `string` | Sí | formato uuid | — | Identificador asociado a course. | `src/modules/education/dto/education.dto.ts:348` |
| `version` | `number` | Sí | — | — | Versión publicada; el curso pasa a apuntar a ella | `src/modules/education/dto/education.dto.ts:356` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
| 409 | `CONFLICT` | ConflictException: Esa versión del curso ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un curso archivado no admite versiones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:65` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-02`

---

## 10. POST /education/courses/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar un curso con sus módulos y lecciones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.publishCourse` — `src/modules/education/controllers/education.controller.ts:60`

### Qué es y para qué sirve (negocio)

Publicar un curso con sus módulos y lecciones. Caso de uso UC-47-01: Publicar curso con módulos y lecciones. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:10`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/courses/publish` la atiende `EducationController.publishCourse` (src/modules/education/controllers/education.controller.ts:60). Exige sesión con alguno de los roles EDUCATION_ADMIN, COURSE_AUTHOR. Valida el cuerpo como `PublishCourseDto` (23 campos, 8 obligatorios). Delega en `EducationCatalogService.publishCourse`. Crea filas en education.course_modules, education.course_versions, education.courses, education.lessons. Lee education.courses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: EDUCATION_ADMIN, COURSE_AUTHOR | `src/modules/education/controllers/education.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.course_modules` | ESCRIBE | CREA | DIRECTA | EducationController.publishCourse → EducationCatalogService.publishCourse → EducationCatalogRepository.createModule | `src/modules/education/repositories/education-catalog.repository.ts:248` |
| `education.course_versions` | ESCRIBE | CREA | DIRECTA | EducationController.publishCourse → EducationCatalogService.publishCourse → EducationCatalogRepository.createVersion | `src/modules/education/repositories/education-catalog.repository.ts:408` |
| `education.courses` | ESCRIBE | CREA | DIRECTA | EducationController.publishCourse → EducationCatalogService.publishCourse → EducationCatalogRepository.createCourse | `src/modules/education/repositories/education-catalog.repository.ts:150` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.publishCourse → EducationCatalogService.publishCourse → EducationCatalogRepository.findCourseByCode | `src/modules/education/repositories/education-catalog.repository.ts:209` |
| `education.lessons` | ESCRIBE | CREA | DIRECTA | EducationController.publishCourse → EducationCatalogService.publishCourse → EducationCatalogRepository.createLesson | `src/modules/education/repositories/education-catalog.repository.ts:314` |

### Cuerpo — DTO `PublishCourseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:151` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del curso, único | `src/modules/education/dto/education.dto.ts:159` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/education/dto/education.dto.ts:167` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/education/dto/education.dto.ts:175` |
| `courseType` | `string` | Sí | valores: SELF_PACED, INSTRUCTOR_LED | `@IsIn(['SELF_PACED', 'INSTRUCTOR_LED'])` | — | `src/modules/education/dto/education.dto.ts:182` |
| `level` | `string` | No | valores: BASIC, INTERMEDIATE, ADVANCED | `@IsOptional()` `@IsIn(COURSE_LEVELS)` | — | `src/modules/education/dto/education.dto.ts:190` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:198` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:206` |
| `isAccredited` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Un curso acreditado otorga créditos CME al completarse | `src/modules/education/dto/education.dto.ts:217` |
| `cmeCreditHours` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Horas CME que otorga; obligatorio si está acreditado | `src/modules/education/dto/education.dto.ts:227` |
| `accreditingBodyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Organismo acreditador | `src/modules/education/dto/education.dto.ts:235` |
| `price` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/education/dto/education.dto.ts:243` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:251` |
| `modules` | `array<CourseModuleDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CourseModuleDto)` | Módulos del curso, al menos uno | `src/modules/education/dto/education.dto.ts:264` |
| `modules[].title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/education/dto/education.dto.ts:119` |
| `modules[].description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/education/dto/education.dto.ts:127` |
| `modules[].lessons` | `array<LessonDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => LessonDto)` | Lecciones del módulo, al menos una | `src/modules/education/dto/education.dto.ts:140` |
| `modules[].lessons[].title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/education/dto/education.dto.ts:58` |
| `modules[].lessons[].contentType` | `string` | Sí | valores: VIDEO, ARTICLE, PDF, SCORM, QUIZ, LIVE_SESSION | `@IsIn(LESSON_CONTENT_TYPES)` | — | `src/modules/education/dto/education.dto.ts:65` |
| `modules[].lessons[].mediaFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo en `common.files` | `src/modules/education/dto/education.dto.ts:76` |
| `modules[].lessons[].externalUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | Recurso externo cuando el contenido no se aloja aquí | `src/modules/education/dto/education.dto.ts:86` |
| `modules[].lessons[].durationMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/education/dto/education.dto.ts:95` |
| `modules[].lessons[].isPreview` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Visible sin inscripción, como muestra del curso | `src/modules/education/dto/education.dto.ts:106` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CourseResponseDto>` · DTO `CourseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:275` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:281` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:287` |
| `currentVersion` | `number` | Sí | — | — | Valor de current version mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:293` |
| `moduleIds` | `array<string>` | Sí | formato uuid | — | Valor de module ids mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:299` |
| `lessons` | `number` | Sí | — | — | Lecciones creadas en total | `src/modules/education/dto/education.dto.ts:305` |
| `durationMinutes` | `number` | Sí | — | — | Duración derivada de la suma de las lecciones, en minutos | `src/modules/education/dto/education.dto.ts:313` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un curso con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un curso acreditado necesita declarar sus horas CME |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:55` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-01`

---

## 11. POST /education/enrollments

- **Origen:** CONTRATO
- **Nombre:** Inscribir a un aprendiz
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.enrollLearner` — `src/modules/education/controllers/education.controller.ts:120`

### Qué es y para qué sirve (negocio)

Inscribir a un aprendiz. Caso de uso UC-47-05: Inscribir aprendiz. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/enrollments` la atiende `EducationController.enrollLearner` (src/modules/education/controllers/education.controller.ts:120). Exige sesión con alguno de los roles EDUCATION_ADMIN, LEARNER. Valida el cuerpo como `EnrollLearnerDto` (7 campos, 4 obligatorios). Delega en `EducationLearningService.enrollLearner`. Crea filas en education.enrollments. Actualiza education.course_cohorts. Lee education.course_cohorts, education.courses, education.enrollments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: EDUCATION_ADMIN, LEARNER | `src/modules/education/controllers/education.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.course_cohorts` | ESCRIBE | ACTUALIZA | POR_TIPO | EducationController.enrollLearner → EducationLearningService.enrollLearner | `src/modules/education/services/education-learning.service.ts:183` |
| `education.course_cohorts` | LEE | LEE | DIRECTA | EducationController.enrollLearner → EducationLearningService.enrollLearner → EducationCatalogRepository.findCohortForUpdate | `src/modules/education/repositories/education-catalog.repository.ts:652` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.enrollLearner → EducationLearningService.enrollLearner → EducationCatalogRepository.findCourseById | `src/modules/education/repositories/education-catalog.repository.ts:183` |
| `education.enrollments` | ESCRIBE | CREA | DIRECTA | EducationController.enrollLearner → EducationLearningService.enrollLearner → EducationLearningRepository.createEnrollment | `src/modules/education/repositories/education-learning.repository.ts:117` |
| `education.enrollments` | LEE | LEE | DIRECTA | EducationController.enrollLearner → EducationLearningService.enrollLearner → EducationLearningRepository.findLiveEnrollment | `src/modules/education/repositories/education-learning.repository.ts:179` |

### Cuerpo — DTO `EnrollLearnerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `courseId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:551` |
| `cohortId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:559` |
| `learnerType` | `string` | Sí | valores: PRACTITIONER, STAFF, PATIENT, USER | `@IsIn(LEARNER_TYPES)` | — | `src/modules/education/dto/education.dto.ts:566` |
| `learnerRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:573` |
| `source` | `string` | Sí | valores: SELF, ASSIGNED, PURCHASED, PARTNER | `@IsIn(ENROLLMENT_SOURCES)` | — | `src/modules/education/dto/education.dto.ts:580` |
| `paymentIntentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Intento de pago; obligatorio si la inscripción es PURCHASED | `src/modules/education/dto/education.dto.ts:591` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Caducidad del acceso | `src/modules/education/dto/education.dto.ts:602` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "courseId": "00000000-0000-4000-8000-000000000001",
  "learnerType": "PRACTITIONER",
  "learnerRefId": "00000000-0000-4000-8000-000000000001",
  "source": "SELF"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<EnrollmentResponseDto>` · DTO `EnrollmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:613` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:619` |
| `progressPercent` | `string` | Sí | — | — | Progreso del curso, en porcentaje | `src/modules/education/dto/education.dto.ts:625` |
| `cohortEnrolledCount` | `number` | No | — | — | Plazas ocupadas de la cohorte tras inscribir | `src/modules/education/dto/education.dto.ts:633` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado; ResourceNotFoundException: Cohorte no encontrada |
| 409 | `CONFLICT` | ConflictException: El aprendiz ya está inscrito en el curso; ConflictException: La cohorte no tiene plazas disponibles |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una inscripción comprada necesita su intento de pago; PreconditionFailedException: El curso no está publicado; PreconditionFailedException: La cohorte pertenece a otro curso; PreconditionFailedException: La cohorte no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:101` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-05`

---

## 12. POST /education/enrollments/{id}/certificate

- **Origen:** CONTRATO
- **Nombre:** Emitir el certificado verificable
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.issueCertificate` — `src/modules/education/controllers/education.controller.ts:217`

### Qué es y para qué sirve (negocio)

Emitir el certificado verificable. Caso de uso UC-47-11: Emitir certificado. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/enrollments/{id}/certificate` la atiende `EducationController.issueCertificate` (src/modules/education/controllers/education.controller.ts:217). Exige sesión con alguno de los roles SYSTEM, EDUCATION_ADMIN. Valida el cuerpo como `IssueCertificateDto` (2 campos, 0 obligatorios). Delega en `EducationLearningService.issueCertificate`. Crea filas en education.certificates. Lee education.certificates, education.courses, education.enrollments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, EDUCATION_ADMIN | `src/modules/education/controllers/education.controller.ts:217` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:217` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.certificates` | ESCRIBE | CREA | DIRECTA | EducationController.issueCertificate → EducationLearningService.issueCertificate → EducationLearningRepository.createCertificate | `src/modules/education/repositories/education-learning.repository.ts:365` |
| `education.certificates` | LEE | LEE | DIRECTA | EducationController.issueCertificate → EducationLearningService.issueCertificate → EducationLearningRepository.findCertificateByEnrollment | `src/modules/education/repositories/education-learning.repository.ts:421` |
| `education.courses` | LEE | LEE | DIRECTA | EducationController.issueCertificate → EducationLearningService.issueCertificate → EducationCatalogRepository.findCourseById | `src/modules/education/repositories/education-catalog.repository.ts:183` |
| `education.enrollments` | LEE | LEE | DIRECTA | EducationController.issueCertificate → EducationLearningService.issueCertificate → EducationLearningRepository.findEnrollmentForUpdate | `src/modules/education/repositories/education-learning.repository.ts:161` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IssueCertificateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento del certificado | `src/modules/education/dto/education.dto.ts:1046` |
| `validityMonths` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Vigencia del certificado, en meses | `src/modules/education/dto/education.dto.ts:1055` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "validityMonths": 1
}
```

</details>

### Respuesta — `Promise<CertificateResponseDto>` · DTO `CertificateResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:1066` |
| `certificateNumber` | `string` | Sí | — | — | Número del certificado | `src/modules/education/dto/education.dto.ts:1072` |
| `verificationCode` | `string` | Sí | — | — | Código con el que un tercero lo verifica | `src/modules/education/dto/education.dto.ts:1078` |
| `cmeCreditsAwarded` | `string` | No | — | — | Horas CME acreditadas | `src/modules/education/dto/education.dto.ts:1084` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:1090` |
| `alreadyIssued` | `boolean` | Sí | — | — | true si ya estaba emitido | `src/modules/education/dto/education.dto.ts:1096` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Inscripción no encontrada; ResourceNotFoundException: Curso no encontrado |
| 409 | `CONFLICT` | ConflictException: No se pudo generar un número de certificado libre; ConflictException: No se pudo generar un código de verificación libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción no está completada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:177` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-11`

---

## 13. POST /education/enrollments/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Completar el curso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.completeEnrollment` — `src/modules/education/controllers/education.controller.ts:201`

### Qué es y para qué sirve (negocio)

Completar el curso. Caso de uso UC-47-10: Completar curso. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/enrollments/{id}/complete` la atiende `EducationController.completeEnrollment` (src/modules/education/controllers/education.controller.ts:201). Exige sesión con alguno de los roles SYSTEM, EDUCATION_ADMIN, LEARNER. Delega en `EducationLearningService.completeEnrollment`. Actualiza education.enrollments. Lee education.assessment_attempts, education.assessments, education.course_modules, education.enrollments, education.lesson_progress, education.lessons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, EDUCATION_ADMIN, LEARNER | `src/modules/education/controllers/education.controller.ts:201` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:201` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.assessment_attempts` | LEE | LEE | DIRECTA | EducationController.completeEnrollment → EducationLearningService.completeEnrollment → EducationLearningRepository.findPassedAttempts | `src/modules/education/repositories/education-learning.repository.ts:349` |
| `education.assessments` | LEE | LEE | DIRECTA | EducationController.completeEnrollment → EducationLearningService.completeEnrollment → EducationCatalogRepository.findGradedAssessments | `src/modules/education/repositories/education-catalog.repository.ts:707` |
| `education.course_modules` | LEE | LEE | DIRECTA | EducationController.completeEnrollment → EducationLearningService.completeEnrollment → EducationLearningService.recomputeProgress → EducationCatalogRepository.findModulesByCourse | `src/modules/education/repositories/education-catalog.repository.ts:343` |
| `education.enrollments` | ESCRIBE | ACTUALIZA | POR_TIPO | EducationController.completeEnrollment → EducationLearningService.completeEnrollment | `src/modules/education/services/education-learning.service.ts:550` |
| `education.enrollments` | LEE | LEE | DIRECTA | EducationController.completeEnrollment → EducationLearningService.completeEnrollment → EducationLearningRepository.findEnrollmentForUpdate | `src/modules/education/repositories/education-learning.repository.ts:161` |
| `education.lesson_progress` | LEE | LEE | DIRECTA | EducationController.completeEnrollment → EducationLearningService.completeEnrollment → EducationLearningService.recomputeProgress → EducationLearningRepository.findProgressByEnrollment | `src/modules/education/repositories/education-learning.repository.ts:252` |
| `education.lessons` | LEE | LEE | DIRECTA | EducationController.completeEnrollment → EducationLearningService.completeEnrollment → EducationLearningService.recomputeProgress → EducationCatalogRepository.countLessonsByModules | `src/modules/education/repositories/education-catalog.repository.ts:368` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CompleteEnrollmentResponseDto>` · DTO `CompleteEnrollmentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/education/dto/education.dto.ts:1010` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/education/dto/education.dto.ts:1016` |
| `progressPercent` | `string` | Sí | — | — | Valor de progress percent mantenido por la instancia. | `src/modules/education/dto/education.dto.ts:1022` |
| `alreadyCompleted` | `boolean` | Sí | — | — | true si ya estaba completada | `src/modules/education/dto/education.dto.ts:1028` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Inscripción no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción no está activa; PreconditionFailedException: El curso no está completo; PreconditionFailedException: Quedan evaluaciones sin aprobar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:162` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-10`

---

## 14. POST /education/enrollments/{id}/lesson-progress

- **Origen:** CONTRATO
- **Nombre:** Registrar el progreso de una lección
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EducationController.recordProgress` — `src/modules/education/controllers/education.controller.ts:135`

### Qué es y para qué sirve (negocio)

Registrar el progreso de una lección. Caso de uso UC-47-06: Registrar progreso. Dentro del módulo (descripción del modelo, en inglés): «A learning platform for doctors and staff (the "doctor courses" the clients asked for): structured courses with modules and lessons, instructors, cohorts and enrollments, progress tracking, assessments/quizzes with attempts and grading…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/education/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_47_education.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /education/enrollments/{id}/lesson-progress` la atiende `EducationController.recordProgress` (src/modules/education/controllers/education.controller.ts:135). Exige sesión con alguno de los roles LEARNER, EDUCATION_ADMIN, SYSTEM. Valida el cuerpo como `RecordProgressDto` (5 campos, 2 obligatorios). Delega en `EducationLearningService.recordProgress`. Crea filas en education.lesson_progress. Actualiza education.enrollments. Lee education.course_modules, education.enrollments, education.lesson_progress, education.lessons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LEARNER, EDUCATION_ADMIN, SYSTEM | `src/modules/education/controllers/education.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/education/controllers/education.controller.ts:135` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `education.course_modules` | LEE | LEE | DIRECTA | EducationController.recordProgress → EducationLearningService.recordProgress → EducationLearningService.recomputeProgress → EducationCatalogRepository.findModulesByCourse | `src/modules/education/repositories/education-catalog.repository.ts:343` |
| `education.enrollments` | ESCRIBE | ACTUALIZA | POR_TIPO | EducationController.recordProgress → EducationLearningService.recordProgress | `src/modules/education/services/education-learning.service.ts:278` |
| `education.enrollments` | LEE | LEE | DIRECTA | EducationController.recordProgress → EducationLearningService.recordProgress → EducationLearningRepository.findEnrollmentForUpdate | `src/modules/education/repositories/education-learning.repository.ts:161` |
| `education.lesson_progress` | ESCRIBE | CREA | DIRECTA | EducationController.recordProgress → EducationLearningService.recordProgress → EducationLearningRepository.createLessonProgress | `src/modules/education/repositories/education-learning.repository.ts:227` |
| `education.lesson_progress` | LEE | LEE | DIRECTA | EducationController.recordProgress → EducationLearningService.recordProgress → EducationLearningService.recomputeProgress → EducationLearningRepository.findProgressByEnrollment | `src/modules/education/repositories/education-learning.repository.ts:252` |
| `education.lessons` | LEE | LEE | DIRECTA | EducationController.recordProgress → EducationLearningService.recordProgress → EducationCatalogRepository.findLessonById | `src/modules/education/repositories/education-catalog.repository.ts:358` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordProgressDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `lessonId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/education/dto/education.dto.ts:650` |
| `status` | `string` | Sí | valores: IN_PROGRESS, COMPLETED | `@IsIn(['IN_PROGRESS', 'COMPLETED'])` | — | `src/modules/education/dto/education.dto.ts:657` |
| `secondsWatched` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Segundos vistos del contenido | `src/modules/education/dto/education.dto.ts:666` |
| `completionPercent` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje visto de la lección | `src/modules/education/dto/education.dto.ts:674` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo ocurrió; por defecto, ahora | `src/modules/education/dto/education.dto.ts:685` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "lessonId": "00000000-0000-4000-8000-000000000001",
  "status": "IN_PROGRESS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "lessonId": "00000000-0000-4000-8000-000000000001",
  "status": "IN_PROGRESS",
  "secondsWatched": 1,
  "completionPercent": "valor-ejemplo",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ProgressResponseDto>` · DTO `ProgressResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Anotación de progreso creada | `src/modules/education/dto/education.dto.ts:696` |
| `enrollmentId` | `string` | Sí | formato uuid | — | Identificador asociado a enrollment. | `src/modules/education/dto/education.dto.ts:702` |
| `progressPercent` | `string` | Sí | — | — | Progreso del curso recalculado | `src/modules/education/dto/education.dto.ts:708` |
| `completedLessons` | `number` | Sí | — | — | Lecciones completadas | `src/modules/education/dto/education.dto.ts:714` |
| `totalLessons` | `number` | Sí | — | — | Lecciones publicadas del curso | `src/modules/education/dto/education.dto.ts:720` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Inscripción no encontrada; ResourceNotFoundException: Lección no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción está cancelada; PreconditionFailedException: El acceso a la inscripción ha caducado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/education.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/education/controllers/education.controller.spec.ts:113` |

### Flujos

- Módulo 47 — Formación, Evaluación y Acreditación — etapa `UC-47-06`

---

