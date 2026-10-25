<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `education`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 14 (14 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [education](../endpoints/education.md)

## Proceso: Módulo 47 — Formación, Evaluación y Acreditación

- **Código:** `education` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 14
- **Actores:** COURSE_AUTHOR · EDUCATION_ADMIN · LEARNER · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/education/README.md`

### Para qué sirve

Catálogo de cursos con módulos y lecciones, versionado, instructores, cohortes, inscripciones con progreso, evaluaciones corregidas automáticamente, certificados verificables y créditos CME.

_Fuente: `src/modules/education/README.md:3`_

### Flujo general declarado en el README

```text
curso (published, v1) ── versión ──> vN, el curso apunta a la nueva
     ├─ instructores (un solo titular)
     ├─ cohorte (open) ── se llena ──> closed
     └─ evaluación (published) ── preguntas con respuesta correcta

inscripción (active, 0%) ── lesson-progress (append-only) ──> % recalculado
                                    │
                                    ├─ attempt (in_progress) ── submit ──> graded (passed | failed)
                                    │
                                    └─ complete ──> completed (100% + evaluaciones aprobadas)
                                                        │
                                                        └─ certificate (issued, con código de verificación)
                                                                    │
                                                                    ├─ cme-credits ──> awarded
                                                                    └─ revoke ──> revoked + CME reversed
```

_Fuente: `src/modules/education/README.md:65`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-47-01` | Publicar curso con módulos y lecciones | POST /education/courses/publish | EDUCATION_ADMIN · COURSE_AUTHOR | MEDIO | 5 |
| `UC-47-02` | Publicar versión del curso | POST /education/courses/{id}/versions/publish | EDUCATION_ADMIN · COURSE_AUTHOR | MEDIO | 4 |
| `UC-47-03` | Asignar instructor | POST /education/courses/{id}/instructors | EDUCATION_ADMIN | MEDIO | 5 |
| `UC-47-04` | Abrir cohorte | POST /education/courses/{id}/cohorts | EDUCATION_ADMIN | MEDIO | 3 |
| `UC-47-05` | Inscribir aprendiz | POST /education/enrollments | EDUCATION_ADMIN · LEARNER | MEDIO | 5 |
| `UC-47-06` | Registrar progreso | POST /education/enrollments/{id}/lesson-progress | LEARNER · EDUCATION_ADMIN · SYSTEM | MEDIO | 7 |
| `UC-47-07` | Diseñar evaluación | POST /education/courses/{id}/assessments | EDUCATION_ADMIN · COURSE_AUTHOR | MEDIO | 4 |
| `UC-47-08` | Iniciar intento | POST /education/assessments/{id}/attempts | LEARNER · EDUCATION_ADMIN | MEDIO | 5 |
| `UC-47-09` | Enviar y calificar | POST /education/attempts/{id}/submit | LEARNER · EDUCATION_ADMIN | MEDIO | 6 |
| `UC-47-10` | Completar curso | POST /education/enrollments/{id}/complete | SYSTEM · EDUCATION_ADMIN · LEARNER | MEDIO | 8 |
| `UC-47-11` | Emitir certificado | POST /education/enrollments/{id}/certificate | SYSTEM · EDUCATION_ADMIN | MEDIO | 4 |
| `UC-47-12` | Acreditar CME | POST /education/certificates/{id}/cme-credits | SYSTEM · EDUCATION_ADMIN | MEDIO | 4 |
| `UC-47-13` | Publicar reseña | POST /education/courses/{id}/reviews | LEARNER · EDUCATION_ADMIN | MEDIO | 3 |
| `UC-47-14` | Revocar y revertir CME | POST /education/certificates/{id}/revoke | EDUCATION_ADMIN | MEDIO | 5 |

### Diagrama — etapas `UC-47-01`, `UC-47-02`, `UC-47-03`…

```mermaid
flowchart LR
  a2(["EDUCATION_ADMIN · COURSE_AUTHOR"]):::actor
  a9(["EDUCATION_ADMIN"]):::actor
  a15(["EDUCATION_ADMIN · LEARNER"]):::actor
  a18(["LEARNER · EDUCATION_ADMIN · SYSTEM"]):::actor
  a25(["LEARNER · EDUCATION_ADMIN"]):::actor
  a29(["SYSTEM · EDUCATION_ADMIN · LEARNER"]):::actor
  a32(["SYSTEM · EDUCATION_ADMIN"]):::actor
  t3[("education.course_modules")]:::tabla
  t4[("education.course_versions")]:::tabla
  t5[("education.courses")]:::tabla
  t6[("education.lessons")]:::tabla
  t10[("education.course_instructors")]:::tabla
  t11[("education.instructors")]:::tabla
  t13[("education.course_cohorts")]:::tabla
  t16[("education.enrollments")]:::tabla
  t19[("education.lesson_progress")]:::tabla
  t22[("education.assessment_questions")]:::tabla
  t23[("education.assessments")]:::tabla
  t26[("education.assessment_attempts")]:::tabla
  t33[("education.certificates")]:::tabla
  t35[("education.cme_credit_records")]:::tabla
  t37[("education.course_reviews")]:::tabla
  subgraph s0["UC-47-01 · Publicar curso con módulos y lecciones"]
    o1["POST /education/courses/publish"]:::op
  end
  subgraph s1["UC-47-02 · Publicar versión del curso"]
    o7["POST /education/courses/{id}/versions/publish"]:::op
  end
  subgraph s2["UC-47-03 · Asignar instructor"]
    o8["POST /education/courses/{id}/instructors"]:::op
  end
  subgraph s3["UC-47-04 · Abrir cohorte"]
    o12["POST /education/courses/{id}/cohorts"]:::op
  end
  subgraph s4["UC-47-05 · Inscribir aprendiz"]
    o14["POST /education/enrollments"]:::op
  end
  t20[("+1 tablas más")]
  subgraph s5["UC-47-06 · Registrar progreso"]
    o17["POST /education/enrollments/{id}/lesson-progress"]:::op
  end
  subgraph s6["UC-47-07 · Diseñar evaluación"]
    o21["POST /education/courses/{id}/assessments"]:::op
  end
  subgraph s7["UC-47-08 · Iniciar intento"]
    o24["POST /education/assessments/{id}/attempts"]:::op
  end
  subgraph s8["UC-47-09 · Enviar y calificar"]
    o27["POST /education/attempts/{id}/submit"]:::op
  end
  t30[("+2 tablas más")]
  subgraph s9["UC-47-10 · Completar curso"]
    o28["POST /education/enrollments/{id}/complete"]:::op
  end
  subgraph s10["UC-47-11 · Emitir certificado"]
    o31["POST /education/enrollments/{id}/certificate"]:::op
  end
  subgraph s11["UC-47-12 · Acreditar CME"]
    o34["POST /education/certificates/{id}/cme-credits"]:::op
  end
  subgraph s12["UC-47-13 · Publicar reseña"]
    o36["POST /education/courses/{id}/reviews"]:::op
  end
  subgraph s13["UC-47-14 · Revocar y revertir CME"]
    o38["POST /education/certificates/{id}/revoke"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  o1 -->|"LEE"| t5
  o1 -->|"CREA"| t6
  a2 --> o7
  o7 -->|"CREA"| t4
  o7 -->|"LEE"| t4
  o7 -->|"ACTUALIZA"| t5
  o7 -->|"LEE"| t5
  a9 --> o8
  o8 -->|"CREA"| t10
  o8 -->|"LEE"| t10
  o8 -->|"LEE"| t5
  o8 -->|"CREA"| t11
  o8 -->|"LEE"| t11
  a9 --> o12
  o12 -->|"CREA"| t13
  o12 -->|"LEE"| t13
  o12 -->|"LEE"| t5
  a15 --> o14
  o14 -->|"ACTUALIZA"| t13
  o14 -->|"LEE"| t13
  o14 -->|"LEE"| t5
  o14 -->|"CREA"| t16
  o14 -->|"LEE"| t16
  a18 --> o17
  o17 -->|"LEE"| t3
  o17 -->|"LEE"| t5
  o17 -->|"ACTUALIZA"| t16
  o17 -->|"LEE"| t16
  o17 -->|"CREA"| t19
  o17 -->|"LEE"| t19
  o17 -.-> t20
  a2 --> o21
  o21 -->|"CREA"| t22
  o21 -->|"CREA"| t23
  o21 -->|"LEE"| t3
  o21 -->|"LEE"| t5
  a25 --> o24
  o24 -->|"CREA"| t26
  o24 -->|"LEE"| t26
  o24 -->|"LEE"| t23
  o24 -->|"LEE"| t5
  o24 -->|"LEE"| t16
  a25 --> o27
  o27 -->|"ACTUALIZA"| t26
  o27 -->|"LEE"| t26
  o27 -->|"LEE"| t22
  o27 -->|"LEE"| t23
  o27 -->|"LEE"| t5
  o27 -->|"LEE"| t16
  a29 --> o28
  o28 -->|"LEE"| t26
  o28 -->|"LEE"| t23
  o28 -->|"LEE"| t3
  o28 -->|"LEE"| t5
  o28 -->|"ACTUALIZA"| t16
  o28 -->|"LEE"| t16
  o28 -.-> t30
  a32 --> o31
  o31 -->|"CREA"| t33
  o31 -->|"LEE"| t33
  o31 -->|"LEE"| t5
  o31 -->|"LEE"| t16
  a32 --> o34
  o34 -->|"LEE"| t33
  o34 -->|"CREA"| t35
  o34 -->|"LEE"| t35
  o34 -->|"LEE"| t5
  a25 --> o36
  o36 -->|"CREA"| t37
  o36 -->|"LEE"| t37
  o36 -->|"LEE"| t5
  a9 --> o38
  o38 -->|"ACTUALIZA"| t33
  o38 -->|"LEE"| t33
  o38 -->|"ACTUALIZA"| t35
  o38 -->|"LEE"| t35
  o38 -->|"LEE"| t5
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /education/assessments/{id}/attempts

Iniciar un intento de evaluación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 409 | `CONFLICT` | ConflictException: Ya hay un intento en curso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción es de otro curso; PreconditionFailedException: La inscripción no está activa; PreconditionFailedException: Se agotaron los intentos permitidos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.startAttempt"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.assessment"]:::llamada
  n4 --> n5
  n6["Llama a EducationCatalogRepository.findAssessmentById"]:::llamada
  n5 --> n6
  n7[("LEE education.assessments")]:::efecto
  n6 --> n7
  n8["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n7 --> n8
  n9["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n8 --> n9
  n10[("LEE education.courses")]:::efecto
  n9 --> n10
  n11["Llama a EducationScopeService.enrollment"]:::llamada
  n10 --> n11
  n12["Llama a EducationLearningRepository.findEnrollmentById"]:::llamada
  n11 --> n12
  n13[("LEE education.enrollments")]:::efecto
  n12 --> n13
  n14["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n13 --> n14
  n15["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n14 --> n15
  n16[("LEE education.courses")]:::efecto
  n15 --> n16
  n17["Llama a EducationScopeService.assertOwnsEnrollment"]:::llamada
  n16 --> n17
  n18{"!own || own !== enrollment.learnerRefId"}:::decision
  n17 --> n18
  n19["Llama a EducationScopeService.notFound"]:::llamada
  n18 -->|"sí"| n19
  n20(["404 NOT_FOUND {message}"]):::error
  n19 --> n20
  n21["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n18 -->|"no"| n21
  n22[("LEE education.enrollments")]:::efecto
  n21 --> n22
  n23["Llama a EducationScopeService.orGone"]:::llamada
  n22 --> n23
  n24["Llama a EducationScopeService.notFound"]:::llamada
  n23 --> n24
  n25(["404 NOT_FOUND {message}"]):::error
  n24 --> n25
  n26{"!row"}:::decision
  n27["Llama a EducationScopeService.notFound"]:::llamada
  n26 -->|"sí"| n27
  n28(["404 NOT_FOUND {message}"]):::error
  n27 --> n28
  n29{"enrollment.courseId !== assessment.courseId"}:::decision
  n26 -->|"no"| n29
  n30(["422 PRECONDITION_FAILED La inscripción es de otro curso"]):::error
  n29 -->|"sí"| n30
  n31{"enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_ACTIVE"}:::decision
  n29 -->|"no"| n31
  n32(["422 PRECONDITION_FAILED La inscripción no está activa"]):::error
  n31 -->|"sí"| n32
  n33["Llama a EducationLearningRepository.findAttemptsForUpdate"]:::llamada
  n31 -->|"no"| n33
  n34[("LEE education.assessment_attempts")]:::efecto
  n33 --> n34
  n35{"open"}:::decision
  n34 --> n35
  n36(["409 CONFLICT Ya hay un intento en curso"]):::error
  n35 -->|"sí"| n36
  n37{"assessment.maxAttempts && previous.length ›= assessment.maxAttempts"}:::decision
  n35 -->|"no"| n37
  n38(["422 PRECONDITION_FAILED Se agotaron los intentos permitidos"]):::error
  n37 -->|"sí"| n38
  n39["Llama a EducationLearningRepository.createAttempt"]:::llamada
  n37 -->|"no"| n39
  n40[("CREA education.assessment_attempts")]:::efecto
  n39 --> n40
  n41(("201 Responde con éxito")):::ok
  n40 --> n41
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /education/attempts/{id}/submit

Enviar y calificar el intento

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message}; ResourceNotFoundException: Evaluación no encontrada |
| 409 | `CONFLICT` | ConflictException: El intento ya fue corregido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tiempo del intento venció |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.submitAttempt"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.attemptForUpdate"]:::llamada
  n4 --> n5
  n6["Llama a EducationLearningRepository.findAttemptById"]:::llamada
  n5 --> n6
  n7[("LEE education.assessment_attempts")]:::efecto
  n6 --> n7
  n8["Llama a EducationScopeService.notFound"]:::llamada
  n7 --> n8
  n9(["404 NOT_FOUND {message}"]):::error
  n8 --> n9
  n10{"!attempt"}:::decision
  n11["Llama a EducationScopeService.notFound"]:::llamada
  n10 -->|"sí"| n11
  n12(["404 NOT_FOUND {message}"]):::error
  n11 --> n12
  n13["Llama a EducationScopeService.enrollment"]:::llamada
  n10 -->|"no"| n13
  n14["Llama a EducationLearningRepository.findEnrollmentById"]:::llamada
  n13 --> n14
  n15[("LEE education.enrollments")]:::efecto
  n14 --> n15
  n16["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n15 --> n16
  n17[("LEE education.enrollments")]:::efecto
  n16 --> n17
  n18["Llama a EducationScopeService.notFound"]:::llamada
  n17 --> n18
  n19(["404 NOT_FOUND {message}"]):::error
  n18 --> n19
  n20["Llama a EducationLearningRepository.findAttemptForUpdate"]:::llamada
  n21[("LEE education.assessment_attempts")]:::efecto
  n20 --> n21
  n22["Llama a EducationScopeService.orGone"]:::llamada
  n21 --> n22
  n23["Llama a EducationScopeService.notFound"]:::llamada
  n22 --> n23
  n24(["404 NOT_FOUND {message}"]):::error
  n23 --> n24
  n25{"!row"}:::decision
  n26["Llama a EducationScopeService.notFound"]:::llamada
  n25 -->|"sí"| n26
  n27(["404 NOT_FOUND {message}"]):::error
  n26 --> n27
  n28{"attempt.statusConceptId !== CONCEPTS.ATTEMPT_IN_PROGRESS"}:::decision
  n25 -->|"no"| n28
  n29(["409 CONFLICT El intento ya fue corregido"]):::error
  n28 -->|"sí"| n29
  n30["Llama a EducationCatalogRepository.findAssessmentById"]:::llamada
  n28 -->|"no"| n30
  n31[("LEE education.assessments")]:::efecto
  n30 --> n31
  n32{"!assessment"}:::decision
  n31 --> n32
  n33(["404 NOT_FOUND Evaluación no encontrada"]):::error
  n32 -->|"sí"| n33
  n34{"assessment.timeLimitMinutes && attempt.startedAt"}:::decision
  n32 -->|"no"| n34
  n35{"dueAt ‹ new Date()"}:::decision
  n34 -->|"sí"| n35
  n36(["422 PRECONDITION_FAILED El tiempo del intento venció"]):::error
  n35 -->|"sí"| n36
  n37["Llama a EducationCatalogRepository.findQuestionsByAssessment"]:::llamada
  n35 -->|"no"| n37
  n34 -->|"no"| n37
  n38[("LEE education.assessment_questions")]:::efecto
  n37 --> n38
  n39[("ACTUALIZA education.assessment_attempts · ACTUALIZA education.assessment_attempts · ACTUALIZA education.asses…")]:::efecto
  n38 --> n39
  n40(("200 Responde con éxito")):::ok
  n39 --> n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /education/certificates/{id}/cme-credits

Acreditar las horas CME al profesional

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El certificado no está vigente; PreconditionFailedException: El certificado no otorga créditos CME; PreconditionFailedException: El curso no declara organismo acreditador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.recordCmeCredit"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.certificate"]:::llamada
  n4 --> n5
  n6["Llama a EducationLearningRepository.findCertificateById"]:::llamada
  n5 --> n6
  n7[("LEE education.certificates")]:::efecto
  n6 --> n7
  n8["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n7 --> n8
  n9["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n8 --> n9
  n10[("LEE education.courses")]:::efecto
  n9 --> n10
  n11["Llama a EducationLearningRepository.findCertificateForUpdate"]:::llamada
  n10 --> n11
  n12[("LEE education.certificates")]:::efecto
  n11 --> n12
  n13["Llama a EducationScopeService.orGone"]:::llamada
  n12 --> n13
  n14["Llama a EducationScopeService.notFound"]:::llamada
  n13 --> n14
  n15(["404 NOT_FOUND {message}"]):::error
  n14 --> n15
  n16{"!row"}:::decision
  n17["Llama a EducationScopeService.notFound"]:::llamada
  n16 -->|"sí"| n17
  n18(["404 NOT_FOUND {message}"]):::error
  n17 --> n18
  n19{"certificate.statusConceptId !== CONCEPTS.CERTIFICATE_ISSUED"}:::decision
  n16 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El certificado no está vigente"]):::error
  n19 -->|"sí"| n20
  n21{"!certificate.cmeCreditsAwarded || Number(certificate.cmeCreditsAwarded) ‹= 0"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED El certificado no otorga créditos CME"]):::error
  n21 -->|"sí"| n22
  n23["Llama a EducationLearningRepository.findCmeRecord"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE education.cme_credit_records")]:::efecto
  n23 --> n24
  n25["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n24 --> n25
  n26[("LEE education.courses")]:::efecto
  n25 --> n26
  n27{"!course?.accreditingBodyConceptId"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED El curso no declara organismo acreditador"]):::error
  n27 -->|"sí"| n28
  n29["Llama a EducationLearningRepository.createCmeRecord"]:::llamada
  n27 -->|"no"| n29
  n30[("CREA education.cme_credit_records")]:::efecto
  n29 --> n30
  n31(("201 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /education/certificates/{id}/revoke

Revocar el certificado y revertir sus créditos CME

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 409 | `CONFLICT` | ConflictException: El certificado ya está revocado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.revokeCertificate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.certificate"]:::llamada
  n4 --> n5
  n6["Llama a EducationLearningRepository.findCertificateById"]:::llamada
  n5 --> n6
  n7[("LEE education.certificates")]:::efecto
  n6 --> n7
  n8["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n7 --> n8
  n9["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n8 --> n9
  n10[("LEE education.courses")]:::efecto
  n9 --> n10
  n11["Llama a EducationLearningRepository.findCertificateForUpdate"]:::llamada
  n10 --> n11
  n12[("LEE education.certificates")]:::efecto
  n11 --> n12
  n13["Llama a EducationScopeService.orGone"]:::llamada
  n12 --> n13
  n14["Llama a EducationScopeService.notFound"]:::llamada
  n13 --> n14
  n15(["404 NOT_FOUND {message}"]):::error
  n14 --> n15
  n16{"!row"}:::decision
  n17["Llama a EducationScopeService.notFound"]:::llamada
  n16 -->|"sí"| n17
  n18(["404 NOT_FOUND {message}"]):::error
  n17 --> n18
  n19{"certificate.statusConceptId === CONCEPTS.CERTIFICATE_REVOKED"}:::decision
  n16 -->|"no"| n19
  n20(["409 CONFLICT El certificado ya está revocado"]):::error
  n19 -->|"sí"| n20
  n21["Llama a EducationLearningRepository.findCmeRecordsForUpdate"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE education.cme_credit_records")]:::efecto
  n21 --> n22
  n23["Repite: por cada const record de records"]:::bucle
  n22 --> n23
  n24[("ACTUALIZA education.cme_credit_records")]:::efecto
  n23 -->|"cada elemento"| n24
  n25[("ACTUALIZA education.certificates")]:::efecto
  n24 --> n25
  n23 -->|"al terminar"| n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /education/courses/{id}/assessments

Diseñar una evaluación con sus preguntas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una evaluación puntuable necesita respuesta correcta en cada pregunta; PreconditionFailedException: El módulo no pertenece al curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationCatalogService.createAssessment"]:::llamada
  n2 --> n3
  n4{"isGraded"}:::decision
  n3 --> n4
  n5{"missing.length › 0"}:::decision
  n4 -->|"sí"| n5
  n6(["422 PRECONDITION_FAILED Una evaluación puntuable necesita respuesta correcta en cada pregunta"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n4 -->|"no"| n7
  n8["Llama a EducationScopeService.course"]:::llamada
  n7 --> n8
  n9["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n8 --> n9
  n10[("LEE education.courses")]:::efecto
  n9 --> n10
  n11["Llama a EducationCatalogRepository.findCourseForUpdate"]:::llamada
  n10 --> n11
  n12[("LEE education.courses")]:::efecto
  n11 --> n12
  n13{"dto.courseModuleId"}:::decision
  n12 --> n13
  n14["Llama a EducationCatalogRepository.findModulesByCourse"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE education.course_modules")]:::efecto
  n14 --> n15
  n16{"!modules.some((m) =› m.id === dto.courseModuleId)"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED El módulo no pertenece al curso"]):::error
  n16 -->|"sí"| n17
  n18["Llama a EducationCatalogRepository.createAssessment"]:::llamada
  n16 -->|"no"| n18
  n13 -->|"no"| n18
  n19[("CREA education.assessments")]:::efecto
  n18 --> n19
  n20["Repite: map(…)"]:::bucle
  n19 --> n20
  n21["Llama a EducationCatalogRepository.createQuestion"]:::llamada
  n20 -->|"cada elemento"| n21
  n22[("CREA education.assessment_questions")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  n20 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /education/courses/{id}/cohorts

Abrir una cohorte del curso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una cohorte con ese código en el curso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cohorte debe terminar después de empezar; PreconditionFailedException: El curso no está publicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationCatalogService.openCohort"]:::llamada
  n2 --> n3
  n4{"startDate && endDate && endDate ‹ startDate"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La cohorte debe terminar después de empezar"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a EducationScopeService.course"]:::llamada
  n6 --> n7
  n8["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n7 --> n8
  n9[("LEE education.courses")]:::efecto
  n8 --> n9
  n10["Llama a EducationCatalogRepository.findCourseForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE education.courses")]:::efecto
  n10 --> n11
  n12{"course.statusConceptId !== CONCEPTS.COURSE_PUBLISHED"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED El curso no está publicado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a EducationCatalogRepository.findCohortByCode"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE education.course_cohorts")]:::efecto
  n14 --> n15
  n16{"duplicate"}:::decision
  n15 --> n16
  n17(["409 CONFLICT Ya existe una cohorte con ese código en el curso"]):::error
  n16 -->|"sí"| n17
  n18["Llama a EducationCatalogRepository.createCohort"]:::llamada
  n16 -->|"no"| n18
  n19[("CREA education.course_cohorts")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /education/courses/{id}/instructors

Asignar un instructor al curso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El instructor ya está asignado al curso; ConflictException: El curso ya tiene instructor titular |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationCatalogService.assignInstructor"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.course"]:::llamada
  n4 --> n5
  n6["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n5 --> n6
  n7[("LEE education.courses")]:::efecto
  n6 --> n7
  n8["Llama a EducationCatalogRepository.findCourseForUpdate"]:::llamada
  n7 --> n8
  n9[("LEE education.courses")]:::efecto
  n8 --> n9
  n10["Llama a EducationCatalogRepository.findInstructorByProfile"]:::llamada
  n9 --> n10
  n11[("LEE education.instructors")]:::efecto
  n10 --> n11
  n12{"!instructor"}:::decision
  n11 --> n12
  n13["Llama a EducationCatalogRepository.createInstructor"]:::llamada
  n12 -->|"sí"| n13
  n14[("CREA education.instructors")]:::efecto
  n13 --> n14
  n15["Llama a EducationCatalogRepository.findCourseInstructors"]:::llamada
  n14 --> n15
  n12 -->|"no"| n15
  n16[("LEE education.course_instructors")]:::efecto
  n15 --> n16
  n17{"current.some((ci) =› ci.instructorId === instructor.id)"}:::decision
  n16 --> n17
  n18(["409 CONFLICT El instructor ya está asignado al curso"]):::error
  n17 -->|"sí"| n18
  n19{"dto.role === 'LEAD' && current.some((ci) =› ci.roleConceptId === CONCEPTS.INSTRUCTOR_LEAD)"}:::decision
  n17 -->|"no"| n19
  n20(["409 CONFLICT El curso ya tiene instructor titular"]):::error
  n19 -->|"sí"| n20
  n21["Llama a EducationCatalogRepository.createCourseInstructor"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA education.course_instructors")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /education/courses/{id}/reviews

Publicar una reseña del curso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El usuario ya reseñó este curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationCatalogService.createReview"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.course"]:::llamada
  n4 --> n5
  n6["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n5 --> n6
  n7[("LEE education.courses")]:::efecto
  n6 --> n7
  n8["Llama a EducationCatalogRepository.findCourseForUpdate"]:::llamada
  n7 --> n8
  n9[("LEE education.courses")]:::efecto
  n8 --> n9
  n10["Llama a EducationCatalogRepository.findReviewByReviewer"]:::llamada
  n9 --> n10
  n11[("LEE education.course_reviews")]:::efecto
  n10 --> n11
  n12{"previous"}:::decision
  n11 --> n12
  n13(["409 CONFLICT El usuario ya reseñó este curso"]):::error
  n12 -->|"sí"| n13
  n14["Llama a EducationCatalogRepository.createReview"]:::llamada
  n12 -->|"no"| n14
  n15[("CREA education.course_reviews")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /education/courses/{id}/versions/publish

Publicar una versión nueva del curso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa versión del curso ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un curso archivado no admite versiones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationCatalogService.publishVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.course"]:::llamada
  n4 --> n5
  n6["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n5 --> n6
  n7[("LEE education.courses")]:::efecto
  n6 --> n7
  n8["Llama a EducationCatalogRepository.findCourseForUpdate"]:::llamada
  n7 --> n8
  n9[("LEE education.courses")]:::efecto
  n8 --> n9
  n10{"course.statusConceptId === CONCEPTS.COURSE_ARCHIVED"}:::decision
  n9 --> n10
  n11(["422 PRECONDITION_FAILED Un curso archivado no admite versiones"]):::error
  n10 -->|"sí"| n11
  n12["Llama a EducationCatalogRepository.findVersion"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE education.course_versions")]:::efecto
  n12 --> n13
  n14{"existing"}:::decision
  n13 --> n14
  n15(["409 CONFLICT Esa versión del curso ya existe"]):::error
  n14 -->|"sí"| n15
  n16["Llama a EducationCatalogRepository.createVersion"]:::llamada
  n14 -->|"no"| n16
  n17[("CREA education.course_versions")]:::efecto
  n16 --> n17
  n18[("ACTUALIZA education.courses")]:::efecto
  n17 --> n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /education/courses/publish

Publicar un curso con sus módulos y lecciones

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 409 | `CONFLICT` | ConflictException: Ya existe un curso con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un curso acreditado necesita declarar sus horas CME |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a EducationCatalogService.publishCourse"]:::llamada
  n2 --> n3
  n4["Llama a EducationScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6["Llama a EducationScopeService.notFound"]:::llamada
  n5 -->|"sí"| n6
  n7(["404 NOT_FOUND {message}"]):::error
  n6 --> n7
  n8["Llama a EducationCatalogRepository.findCourseByCode"]:::llamada
  n5 -->|"no"| n8
  n9[("LEE education.courses")]:::efecto
  n8 --> n9
  n10{"duplicate"}:::decision
  n9 --> n10
  n11(["409 CONFLICT Ya existe un curso con ese código"]):::error
  n10 -->|"sí"| n11
  n12{"dto.isAccredited && !dto.cmeCreditHours"}:::decision
  n10 -->|"no"| n12
  n13(["422 PRECONDITION_FAILED Un curso acreditado necesita declarar sus horas CME"]):::error
  n12 -->|"sí"| n13
  n14["Transacción: transactional(…)"]:::transaccion
  n12 -->|"no"| n14
  n15["Llama a EducationCatalogRepository.createCourse"]:::llamada
  n14 --> n15
  n16[("CREA education.courses")]:::efecto
  n15 --> n16
  n17["Llama a EducationCatalogRepository.createVersion"]:::llamada
  n16 --> n17
  n18[("CREA education.course_versions")]:::efecto
  n17 --> n18
  n19["Repite: forEach(…)"]:::bucle
  n18 --> n19
  n20["Llama a EducationCatalogRepository.createModule"]:::llamada
  n19 -->|"cada elemento"| n20
  n21[("CREA education.course_modules")]:::efecto
  n20 --> n21
  n22["Repite: forEach(…)"]:::bucle
  n21 --> n22
  n23["Llama a EducationCatalogRepository.createLesson"]:::llamada
  n22 -->|"cada elemento"| n23
  n24[("CREA education.lessons")]:::efecto
  n23 --> n24
  n25(("201 Responde con éxito")):::ok
  n24 --> n25
  n22 -->|"al terminar"| n25
  n19 -->|"al terminar"| n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /education/enrollments

Inscribir a un aprendiz

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 409 | `CONFLICT` | ConflictException: El aprendiz ya está inscrito en el curso; ConflictException: La cohorte no tiene plazas disponibles |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una inscripción comprada necesita su intento de pago; PreconditionFailedException: Indique el aprendiz que se inscribe; PreconditionFailedException: El curso no está publicado; PreconditionFailedException: La cohorte pertenece a otro curso; PreconditionFailedException: La cohorte no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.enrollLearner"]:::llamada
  n2 --> n3
  n4{"dto.source === 'PURCHASED' && !dto.paymentIntentId"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Una inscripción comprada necesita su intento de pago"]):::error
  n4 -->|"sí"| n5
  n6["Llama a EducationScopeService.resolveLearnerRef"]:::llamada
  n4 -->|"no"| n6
  n7{"!own || (declaredRefId !== undefined && declaredRefId !== own)"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9{"!learnerRefId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Indique el aprendiz que se inscribe"]):::error
  n9 -->|"sí"| n10
  n11["Transacción: transactional(…)"]:::transaccion
  n9 -->|"no"| n11
  n12["Llama a EducationScopeService.course"]:::llamada
  n11 --> n12
  n13["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n12 --> n13
  n14[("LEE education.courses")]:::efecto
  n13 --> n14
  n15["Llama a EducationCatalogRepository.findCourseForUpdate"]:::llamada
  n14 --> n15
  n16[("LEE education.courses")]:::efecto
  n15 --> n16
  n17{"course.statusConceptId !== CONCEPTS.COURSE_PUBLISHED"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED El curso no está publicado"]):::error
  n17 -->|"sí"| n18
  n19["Llama a EducationLearningRepository.findLiveEnrollment"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE education.enrollments")]:::efecto
  n19 --> n20
  n21{"live"}:::decision
  n20 --> n21
  n22(["409 CONFLICT El aprendiz ya está inscrito en el curso"]):::error
  n21 -->|"sí"| n22
  n23{"dto.cohortId"}:::decision
  n21 -->|"no"| n23
  n24["Llama a EducationScopeService.cohort"]:::llamada
  n23 -->|"sí"| n24
  n25["Llama a EducationCatalogRepository.findCohortById"]:::llamada
  n24 --> n25
  n26[("LEE education.course_cohorts")]:::efecto
  n25 --> n26
  n27["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n26 --> n27
  n28["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n27 --> n28
  n29[("LEE education.courses")]:::efecto
  n28 --> n29
  n30["Llama a EducationCatalogRepository.findCohortForUpdate"]:::llamada
  n29 --> n30
  n31[("LEE education.course_cohorts")]:::efecto
  n30 --> n31
  n32["Llama a EducationScopeService.orGone"]:::llamada
  n31 --> n32
  n33["Llama a EducationScopeService.notFound"]:::llamada
  n32 --> n33
  n34(["404 NOT_FOUND {message}"]):::error
  n33 --> n34
  n35{"!row"}:::decision
  n36["Llama a EducationScopeService.notFound"]:::llamada
  n35 -->|"sí"| n36
  n37(["404 NOT_FOUND {message}"]):::error
  n36 --> n37
  n38{"cohort.courseId !== dto.courseId"}:::decision
  n35 -->|"no"| n38
  n39(["422 PRECONDITION_FAILED La cohorte pertenece a otro curso"]):::error
  n38 -->|"sí"| n39
  n40{"cohort.statusConceptId !== CONCEPTS.COHORT_OPEN"}:::decision
  n38 -->|"no"| n40
  n41(["422 PRECONDITION_FAILED La cohorte no está abierta"]):::error
  n40 -->|"sí"| n41
  n42{"cohort.capacity && enrolled ›= cohort.capacity"}:::decision
  n40 -->|"no"| n42
  n43(["409 CONFLICT La cohorte no tiene plazas disponibles"]):::error
  n42 -->|"sí"| n43
  n44[("ACTUALIZA education.course_cohorts")]:::efecto
  n42 -->|"no"| n44
  n45{"cohort.capacity && cohortEnrolledCount ›= cohort.capacity"}:::decision
  n44 --> n45
  n46[("ACTUALIZA education.course_cohorts")]:::efecto
  n45 -->|"sí"| n46
  n47["Llama a EducationLearningRepository.createEnrollment"]:::llamada
  n46 --> n47
  n45 -->|"no"| n47
  n23 -->|"no"| n47
  n48[("CREA education.enrollments")]:::efecto
  n47 --> n48
  n49(("201 Responde con éxito")):::ok
  n48 --> n49
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /education/enrollments/{id}/certificate

Emitir el certificado verificable

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message}; ResourceNotFoundException: Curso no encontrado |
| 409 | `CONFLICT` | ConflictException: No se pudo generar un número de certificado libre; ConflictException: No se pudo generar un código de verificación libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción no está completada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.issueCertificate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.enrollment"]:::llamada
  n4 --> n5
  n6["Llama a EducationLearningRepository.findEnrollmentById"]:::llamada
  n5 --> n6
  n7[("LEE education.enrollments")]:::efecto
  n6 --> n7
  n8["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n7 --> n8
  n9["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n8 --> n9
  n10[("LEE education.courses")]:::efecto
  n9 --> n10
  n11["Llama a EducationScopeService.assertOwnsEnrollment"]:::llamada
  n10 --> n11
  n12{"!own || own !== enrollment.learnerRefId"}:::decision
  n11 --> n12
  n13["Llama a EducationScopeService.notFound"]:::llamada
  n12 -->|"sí"| n13
  n14(["404 NOT_FOUND {message}"]):::error
  n13 --> n14
  n15["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n12 -->|"no"| n15
  n16[("LEE education.enrollments")]:::efecto
  n15 --> n16
  n17["Llama a EducationScopeService.orGone"]:::llamada
  n16 --> n17
  n18["Llama a EducationScopeService.notFound"]:::llamada
  n17 --> n18
  n19(["404 NOT_FOUND {message}"]):::error
  n18 --> n19
  n20{"!row"}:::decision
  n21["Llama a EducationScopeService.notFound"]:::llamada
  n20 -->|"sí"| n21
  n22(["404 NOT_FOUND {message}"]):::error
  n21 --> n22
  n23{"enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_COMPLETED"}:::decision
  n20 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED La inscripción no está completada"]):::error
  n23 -->|"sí"| n24
  n25["Llama a EducationLearningRepository.findCertificateByEnrollment"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE education.certificates")]:::efecto
  n25 --> n26
  n27["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n26 --> n27
  n28[("LEE education.courses")]:::efecto
  n27 --> n28
  n29{"!course"}:::decision
  n28 --> n29
  n30(["404 NOT_FOUND Curso no encontrado"]):::error
  n29 -->|"sí"| n30
  n31["Llama a EducationLearningService.generateCertificateNumber"]:::llamada
  n29 -->|"no"| n31
  n32["Repite: ciclo for"]:::bucle
  n31 --> n32
  n33["Llama a EducationLearningRepository.findCertificateByNumber"]:::llamada
  n32 -->|"cada elemento"| n33
  n34[("LEE education.certificates")]:::efecto
  n33 --> n34
  n35(["409 CONFLICT No se pudo generar un número de certificado libre"]):::error
  n34 --> n35
  n32 -->|"al terminar"| n35
  n36["Llama a EducationLearningService.generateVerificationCode"]:::llamada
  n37["Repite: ciclo for"]:::bucle
  n36 --> n37
  n38["Llama a EducationLearningRepository.findCertificateByVerificationCode"]:::llamada
  n37 -->|"cada elemento"| n38
  n39[("LEE education.certificates")]:::efecto
  n38 --> n39
  n40(["409 CONFLICT No se pudo generar un código de verificación libre"]):::error
  n39 --> n40
  n37 -->|"al terminar"| n40
  n41["Llama a EducationLearningRepository.createCertificate"]:::llamada
  n42[("CREA education.certificates")]:::efecto
  n41 --> n42
  n43(("201 Responde con éxito")):::ok
  n42 --> n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /education/enrollments/{id}/complete

Completar el curso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción no está activa; PreconditionFailedException: El curso no está completo; PreconditionFailedException: Quedan evaluaciones sin aprobar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.completeEnrollment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.enrollment"]:::llamada
  n4 --> n5
  n6["Llama a EducationLearningRepository.findEnrollmentById"]:::llamada
  n5 --> n6
  n7[("LEE education.enrollments")]:::efecto
  n6 --> n7
  n8["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n7 --> n8
  n9["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n8 --> n9
  n10[("LEE education.courses")]:::efecto
  n9 --> n10
  n11["Llama a EducationScopeService.assertOwnsEnrollment"]:::llamada
  n10 --> n11
  n12{"!own || own !== enrollment.learnerRefId"}:::decision
  n11 --> n12
  n13["Llama a EducationScopeService.notFound"]:::llamada
  n12 -->|"sí"| n13
  n14(["404 NOT_FOUND {message}"]):::error
  n13 --> n14
  n15["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n12 -->|"no"| n15
  n16[("LEE education.enrollments")]:::efecto
  n15 --> n16
  n17["Llama a EducationScopeService.orGone"]:::llamada
  n16 --> n17
  n18["Llama a EducationScopeService.notFound"]:::llamada
  n17 --> n18
  n19(["404 NOT_FOUND {message}"]):::error
  n18 --> n19
  n20{"!row"}:::decision
  n21["Llama a EducationScopeService.notFound"]:::llamada
  n20 -->|"sí"| n21
  n22(["404 NOT_FOUND {message}"]):::error
  n21 --> n22
  n23{"enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_ACTIVE"}:::decision
  n20 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED La inscripción no está activa"]):::error
  n23 -->|"sí"| n24
  n25["Llama a EducationLearningService.recomputeProgress"]:::llamada
  n23 -->|"no"| n25
  n26["Llama a EducationCatalogRepository.findModulesByCourse"]:::llamada
  n25 --> n26
  n27[("LEE education.course_modules")]:::efecto
  n26 --> n27
  n28["Llama a EducationCatalogRepository.countLessonsByModules"]:::llamada
  n27 --> n28
  n29[("LEE education.lessons")]:::efecto
  n28 --> n29
  n30["Llama a EducationLearningRepository.findProgressByEnrollment"]:::llamada
  n29 --> n30
  n31[("LEE education.lesson_progress")]:::efecto
  n30 --> n31
  n32{"Number(progressPercent) ‹ 100"}:::decision
  n31 --> n32
  n33(["422 PRECONDITION_FAILED El curso no está completo"]):::error
  n32 -->|"sí"| n33
  n34["Llama a EducationCatalogRepository.findGradedAssessments"]:::llamada
  n32 -->|"no"| n34
  n35[("LEE education.assessments")]:::efecto
  n34 --> n35
  n36["Llama a EducationLearningRepository.findPassedAttempts"]:::llamada
  n35 --> n36
  n37[("LEE education.assessment_attempts")]:::efecto
  n36 --> n37
  n38{"pending.length › 0"}:::decision
  n37 --> n38
  n39(["422 PRECONDITION_FAILED Quedan evaluaciones sin aprobar"]):::error
  n38 -->|"sí"| n39
  n40[("ACTUALIZA education.enrollments · ACTUALIZA education.enrollments · ACTUALIZA education.enrollments")]:::efecto
  n38 -->|"no"| n40
  n41(("200 Responde con éxito")):::ok
  n40 --> n41
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /education/enrollments/{id}/lesson-progress

Registrar el progreso de una lección

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message}; ResourceNotFoundException: Lección no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La inscripción está cancelada; PreconditionFailedException: El acceso a la inscripción ha caducado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EducationLearningService.recordProgress"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EducationScopeService.enrollment"]:::llamada
  n4 --> n5
  n6["Llama a EducationLearningRepository.findEnrollmentById"]:::llamada
  n5 --> n6
  n7[("LEE education.enrollments")]:::efecto
  n6 --> n7
  n8["Llama a EducationScopeService.assertCourseInScope"]:::llamada
  n7 --> n8
  n9["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n8 --> n9
  n10[("LEE education.courses")]:::efecto
  n9 --> n10
  n11["Llama a EducationScopeService.assertOwnsEnrollment"]:::llamada
  n10 --> n11
  n12{"!own || own !== enrollment.learnerRefId"}:::decision
  n11 --> n12
  n13["Llama a EducationScopeService.notFound"]:::llamada
  n12 -->|"sí"| n13
  n14(["404 NOT_FOUND {message}"]):::error
  n13 --> n14
  n15["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n12 -->|"no"| n15
  n16[("LEE education.enrollments")]:::efecto
  n15 --> n16
  n17["Llama a EducationScopeService.orGone"]:::llamada
  n16 --> n17
  n18["Llama a EducationScopeService.notFound"]:::llamada
  n17 --> n18
  n19(["404 NOT_FOUND {message}"]):::error
  n18 --> n19
  n20{"!row"}:::decision
  n21["Llama a EducationScopeService.notFound"]:::llamada
  n20 -->|"sí"| n21
  n22(["404 NOT_FOUND {message}"]):::error
  n21 --> n22
  n23{"enrollment.statusConceptId === CONCEPTS.ENROLLMENT_STATE_CANCELLED"}:::decision
  n20 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED La inscripción está cancelada"]):::error
  n23 -->|"sí"| n24
  n25{"enrollment.expiresAt && enrollment.expiresAt ‹ new Date()"}:::decision
  n23 -->|"no"| n25
  n26(["422 PRECONDITION_FAILED El acceso a la inscripción ha caducado"]):::error
  n25 -->|"sí"| n26
  n27["Llama a EducationCatalogRepository.findLessonById"]:::llamada
  n25 -->|"no"| n27
  n28[("LEE education.lessons")]:::efecto
  n27 --> n28
  n29["Llama a EducationCatalogRepository.findModulesByCourse"]:::llamada
  n28 --> n29
  n30[("LEE education.course_modules")]:::efecto
  n29 --> n30
  n31{"!lesson || !courseModules.some((module) =› module.id === lesson.courseModuleId)"}:::decision
  n30 --> n31
  n32(["404 NOT_FOUND Lección no encontrada"]):::error
  n31 -->|"sí"| n32
  n33["Llama a EducationLearningRepository.createLessonProgress"]:::llamada
  n31 -->|"no"| n33
  n34[("CREA education.lesson_progress")]:::efecto
  n33 --> n34
  n35["Llama a EducationLearningService.recomputeProgress"]:::llamada
  n34 --> n35
  n36["Llama a EducationCatalogRepository.findModulesByCourse"]:::llamada
  n35 --> n36
  n37[("LEE education.course_modules")]:::efecto
  n36 --> n37
  n38["Llama a EducationCatalogRepository.countLessonsByModules"]:::llamada
  n37 --> n38
  n39[("LEE education.lessons")]:::efecto
  n38 --> n39
  n40["Llama a EducationLearningRepository.findProgressByEnrollment"]:::llamada
  n39 --> n40
  n41[("LEE education.lesson_progress")]:::efecto
  n40 --> n41
  n42[("ACTUALIZA education.enrollments")]:::efecto
  n41 --> n42
  n43(("201 Responde con éxito")):::ok
  n42 --> n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

