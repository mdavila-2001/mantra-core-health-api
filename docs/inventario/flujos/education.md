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

_Fuente: `src/modules/education/README.md:31`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-47-01` | Publicar curso con módulos y lecciones | POST /education/courses/publish | EDUCATION_ADMIN · COURSE_AUTHOR | MEDIO | 5 |
| `UC-47-02` | Publicar versión del curso | POST /education/courses/{id}/versions/publish | EDUCATION_ADMIN · COURSE_AUTHOR | MEDIO | 4 |
| `UC-47-03` | Asignar instructor | POST /education/courses/{id}/instructors | EDUCATION_ADMIN | MEDIO | 5 |
| `UC-47-04` | Abrir cohorte | POST /education/courses/{id}/cohorts | EDUCATION_ADMIN | MEDIO | 3 |
| `UC-47-05` | Inscribir aprendiz | POST /education/enrollments | EDUCATION_ADMIN · LEARNER | MEDIO | 5 |
| `UC-47-06` | Registrar progreso | POST /education/enrollments/{id}/lesson-progress | LEARNER · EDUCATION_ADMIN · SYSTEM | MEDIO | 6 |
| `UC-47-07` | Diseñar evaluación | POST /education/courses/{id}/assessments | EDUCATION_ADMIN · COURSE_AUTHOR | MEDIO | 4 |
| `UC-47-08` | Iniciar intento | POST /education/assessments/{id}/attempts | LEARNER · EDUCATION_ADMIN | MEDIO | 4 |
| `UC-47-09` | Enviar y calificar | POST /education/attempts/{id}/submit | LEARNER · EDUCATION_ADMIN | MEDIO | 4 |
| `UC-47-10` | Completar curso | POST /education/enrollments/{id}/complete | SYSTEM · EDUCATION_ADMIN · LEARNER | MEDIO | 7 |
| `UC-47-11` | Emitir certificado | POST /education/enrollments/{id}/certificate | SYSTEM · EDUCATION_ADMIN | MEDIO | 4 |
| `UC-47-12` | Acreditar CME | POST /education/certificates/{id}/cme-credits | SYSTEM · EDUCATION_ADMIN | MEDIO | 4 |
| `UC-47-13` | Publicar reseña | POST /education/courses/{id}/reviews | LEARNER · EDUCATION_ADMIN | MEDIO | 3 |
| `UC-47-14` | Revocar y revertir CME | POST /education/certificates/{id}/revoke | EDUCATION_ADMIN | MEDIO | 4 |

### Diagrama — etapas `UC-47-01`, `UC-47-02`, `UC-47-03`…

```mermaid
flowchart LR
  a2(["EDUCATION_ADMIN · COURSE_AUTHOR"]):::actor
  a9(["EDUCATION_ADMIN"]):::actor
  a15(["EDUCATION_ADMIN · LEARNER"]):::actor
  a18(["LEARNER · EDUCATION_ADMIN · SYSTEM"]):::actor
  a24(["LEARNER · EDUCATION_ADMIN"]):::actor
  a28(["SYSTEM · EDUCATION_ADMIN · LEARNER"]):::actor
  a31(["SYSTEM · EDUCATION_ADMIN"]):::actor
  t3[("education.course_modules")]:::tabla
  t4[("education.course_versions")]:::tabla
  t5[("education.courses")]:::tabla
  t6[("education.lessons")]:::tabla
  t10[("education.course_instructors")]:::tabla
  t11[("education.instructors")]:::tabla
  t13[("education.course_cohorts")]:::tabla
  t16[("education.enrollments")]:::tabla
  t19[("education.lesson_progress")]:::tabla
  t21[("education.assessment_questions")]:::tabla
  t22[("education.assessments")]:::tabla
  t25[("education.assessment_attempts")]:::tabla
  t32[("education.certificates")]:::tabla
  t34[("education.cme_credit_records")]:::tabla
  t36[("education.course_reviews")]:::tabla
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
  subgraph s5["UC-47-06 · Registrar progreso"]
    o17["POST /education/enrollments/{id}/lesson-progress"]:::op
  end
  subgraph s6["UC-47-07 · Diseñar evaluación"]
    o20["POST /education/courses/{id}/assessments"]:::op
  end
  subgraph s7["UC-47-08 · Iniciar intento"]
    o23["POST /education/assessments/{id}/attempts"]:::op
  end
  subgraph s8["UC-47-09 · Enviar y calificar"]
    o26["POST /education/attempts/{id}/submit"]:::op
  end
  t29[("+1 tablas más")]
  subgraph s9["UC-47-10 · Completar curso"]
    o27["POST /education/enrollments/{id}/complete"]:::op
  end
  subgraph s10["UC-47-11 · Emitir certificado"]
    o30["POST /education/enrollments/{id}/certificate"]:::op
  end
  subgraph s11["UC-47-12 · Acreditar CME"]
    o33["POST /education/certificates/{id}/cme-credits"]:::op
  end
  subgraph s12["UC-47-13 · Publicar reseña"]
    o35["POST /education/courses/{id}/reviews"]:::op
  end
  subgraph s13["UC-47-14 · Revocar y revertir CME"]
    o37["POST /education/certificates/{id}/revoke"]:::op
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
  o17 -->|"ACTUALIZA"| t16
  o17 -->|"LEE"| t16
  o17 -->|"CREA"| t19
  o17 -->|"LEE"| t19
  o17 -->|"LEE"| t6
  a2 --> o20
  o20 -->|"CREA"| t21
  o20 -->|"CREA"| t22
  o20 -->|"LEE"| t3
  o20 -->|"LEE"| t5
  a24 --> o23
  o23 -->|"CREA"| t25
  o23 -->|"LEE"| t25
  o23 -->|"LEE"| t22
  o23 -->|"LEE"| t16
  a24 --> o26
  o26 -->|"ACTUALIZA"| t25
  o26 -->|"LEE"| t25
  o26 -->|"LEE"| t21
  o26 -->|"LEE"| t22
  a28 --> o27
  o27 -->|"LEE"| t25
  o27 -->|"LEE"| t22
  o27 -->|"LEE"| t3
  o27 -->|"ACTUALIZA"| t16
  o27 -->|"LEE"| t16
  o27 -->|"LEE"| t19
  o27 -.-> t29
  a31 --> o30
  o30 -->|"CREA"| t32
  o30 -->|"LEE"| t32
  o30 -->|"LEE"| t5
  o30 -->|"LEE"| t16
  a31 --> o33
  o33 -->|"LEE"| t32
  o33 -->|"CREA"| t34
  o33 -->|"LEE"| t34
  o33 -->|"LEE"| t5
  a24 --> o35
  o35 -->|"CREA"| t36
  o35 -->|"LEE"| t36
  o35 -->|"LEE"| t5
  a9 --> o37
  o37 -->|"ACTUALIZA"| t32
  o37 -->|"LEE"| t32
  o37 -->|"ACTUALIZA"| t34
  o37 -->|"LEE"| t34
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Evaluación no encontrada; ResourceNotFoundException: Inscripción no encontrada |
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
  n5["Llama a EducationCatalogRepository.findAssessmentById"]:::llamada
  n4 --> n5
  n6[("LEE education.assessments")]:::efecto
  n5 --> n6
  n7{"!assessment"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Evaluación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a EducationLearningRepository.findEnrollmentById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE education.enrollments")]:::efecto
  n9 --> n10
  n11{"!enrollment"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Inscripción no encontrada"]):::error
  n11 -->|"sí"| n12
  n13{"enrollment.courseId !== assessment.courseId"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED La inscripción es de otro curso"]):::error
  n13 -->|"sí"| n14
  n15{"enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_ACTIVE"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED La inscripción no está activa"]):::error
  n15 -->|"sí"| n16
  n17["Llama a EducationLearningRepository.findAttemptsForUpdate"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE education.assessment_attempts")]:::efecto
  n17 --> n18
  n19{"open"}:::decision
  n18 --> n19
  n20(["409 CONFLICT Ya hay un intento en curso"]):::error
  n19 -->|"sí"| n20
  n21{"assessment.maxAttempts && previous.length ›= assessment.maxAttempts"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED Se agotaron los intentos permitidos"]):::error
  n21 -->|"sí"| n22
  n23["Llama a EducationLearningRepository.createAttempt"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA education.assessment_attempts")]:::efecto
  n23 --> n24
  n25(("201 Responde con éxito")):::ok
  n24 --> n25
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intento no encontrado; ResourceNotFoundException: Evaluación no encontrada |
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
  n5["Llama a EducationLearningRepository.findAttemptForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE education.assessment_attempts")]:::efecto
  n5 --> n6
  n7{"!attempt"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Intento no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"attempt.statusConceptId !== CONCEPTS.ATTEMPT_IN_PROGRESS"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT El intento ya fue corregido"]):::error
  n9 -->|"sí"| n10
  n11["Llama a EducationCatalogRepository.findAssessmentById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE education.assessments")]:::efecto
  n11 --> n12
  n13{"!assessment"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Evaluación no encontrada"]):::error
  n13 -->|"sí"| n14
  n15{"assessment.timeLimitMinutes && attempt.startedAt"}:::decision
  n13 -->|"no"| n15
  n16{"dueAt ‹ new Date()"}:::decision
  n15 -->|"sí"| n16
  n17(["422 PRECONDITION_FAILED El tiempo del intento venció"]):::error
  n16 -->|"sí"| n17
  n18["Llama a EducationCatalogRepository.findQuestionsByAssessment"]:::llamada
  n16 -->|"no"| n18
  n15 -->|"no"| n18
  n19[("LEE education.assessment_questions")]:::efecto
  n18 --> n19
  n20[("ACTUALIZA education.assessment_attempts · ACTUALIZA education.assessment_attempts · ACTUALIZA education.asses…")]:::efecto
  n19 --> n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Certificado no encontrado |
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
  n5["Llama a EducationLearningRepository.findCertificateById"]:::llamada
  n4 --> n5
  n6[("LEE education.certificates")]:::efecto
  n5 --> n6
  n7{"!certificate"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Certificado no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"certificate.statusConceptId !== CONCEPTS.CERTIFICATE_ISSUED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El certificado no está vigente"]):::error
  n9 -->|"sí"| n10
  n11{"!certificate.cmeCreditsAwarded || Number(certificate.cmeCreditsAwarded) ‹= 0"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El certificado no otorga créditos CME"]):::error
  n11 -->|"sí"| n12
  n13["Llama a EducationLearningRepository.findCmeRecord"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE education.cme_credit_records")]:::efecto
  n13 --> n14
  n15["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n14 --> n15
  n16[("LEE education.courses")]:::efecto
  n15 --> n16
  n17{"!course?.accreditingBodyConceptId"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED El curso no declara organismo acreditador"]):::error
  n17 -->|"sí"| n18
  n19["Llama a EducationLearningRepository.createCmeRecord"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA education.cme_credit_records")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Certificado no encontrado |
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
  n5["Llama a EducationLearningRepository.findCertificateForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE education.certificates")]:::efecto
  n5 --> n6
  n7{"!certificate"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Certificado no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"certificate.statusConceptId === CONCEPTS.CERTIFICATE_REVOKED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT El certificado ya está revocado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a EducationLearningRepository.findCmeRecordsForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE education.cme_credit_records")]:::efecto
  n11 --> n12
  n13["Repite: por cada const record de records"]:::bucle
  n12 --> n13
  n14[("ACTUALIZA education.cme_credit_records")]:::efecto
  n13 -->|"cada elemento"| n14
  n15[("ACTUALIZA education.certificates")]:::efecto
  n14 --> n15
  n13 -->|"al terminar"| n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
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
  n8["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n7 --> n8
  n9[("LEE education.courses")]:::efecto
  n8 --> n9
  n10{"!course"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Curso no encontrado"]):::error
  n10 -->|"sí"| n11
  n12{"dto.courseModuleId"}:::decision
  n10 -->|"no"| n12
  n13["Llama a EducationCatalogRepository.findModulesByCourse"]:::llamada
  n12 -->|"sí"| n13
  n14[("LEE education.course_modules")]:::efecto
  n13 --> n14
  n15{"!modules.some((m) =› m.id === dto.courseModuleId)"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El módulo no pertenece al curso"]):::error
  n15 -->|"sí"| n16
  n17["Llama a EducationCatalogRepository.createAssessment"]:::llamada
  n15 -->|"no"| n17
  n12 -->|"no"| n17
  n18[("CREA education.assessments")]:::efecto
  n17 --> n18
  n19["Repite: map(…)"]:::bucle
  n18 --> n19
  n20["Llama a EducationCatalogRepository.createQuestion"]:::llamada
  n19 -->|"cada elemento"| n20
  n21[("CREA education.assessment_questions")]:::efecto
  n20 --> n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
  n19 -->|"al terminar"| n22
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
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
  n7["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n6 --> n7
  n8[("LEE education.courses")]:::efecto
  n7 --> n8
  n9{"!course"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Curso no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"course.statusConceptId !== CONCEPTS.COURSE_PUBLISHED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El curso no está publicado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a EducationCatalogRepository.findCohortByCode"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE education.course_cohorts")]:::efecto
  n13 --> n14
  n15{"duplicate"}:::decision
  n14 --> n15
  n16(["409 CONFLICT Ya existe una cohorte con ese código en el curso"]):::error
  n15 -->|"sí"| n16
  n17["Llama a EducationCatalogRepository.createCohort"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA education.course_cohorts")]:::efecto
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

#### 7. POST /education/courses/{id}/instructors

Asignar un instructor al curso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
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
  n5["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n4 --> n5
  n6[("LEE education.courses")]:::efecto
  n5 --> n6
  n7{"!course"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Curso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a EducationCatalogRepository.findInstructorByProfile"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE education.instructors")]:::efecto
  n9 --> n10
  n11{"!instructor"}:::decision
  n10 --> n11
  n12["Llama a EducationCatalogRepository.createInstructor"]:::llamada
  n11 -->|"sí"| n12
  n13[("CREA education.instructors")]:::efecto
  n12 --> n13
  n14["Llama a EducationCatalogRepository.findCourseInstructors"]:::llamada
  n13 --> n14
  n11 -->|"no"| n14
  n15[("LEE education.course_instructors")]:::efecto
  n14 --> n15
  n16{"current.some((ci) =› ci.instructorId === instructor.id)"}:::decision
  n15 --> n16
  n17(["409 CONFLICT El instructor ya está asignado al curso"]):::error
  n16 -->|"sí"| n17
  n18{"dto.role === 'LEAD' && current.some((ci) =› ci.roleConceptId === CONCEPTS.INSTRUCTOR_LEAD)"}:::decision
  n16 -->|"no"| n18
  n19(["409 CONFLICT El curso ya tiene instructor titular"]):::error
  n18 -->|"sí"| n19
  n20["Llama a EducationCatalogRepository.createCourseInstructor"]:::llamada
  n18 -->|"no"| n20
  n21[("CREA education.course_instructors")]:::efecto
  n20 --> n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
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
  n5["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n4 --> n5
  n6[("LEE education.courses")]:::efecto
  n5 --> n6
  n7{"!course"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Curso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a EducationCatalogRepository.findReviewByReviewer"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE education.course_reviews")]:::efecto
  n9 --> n10
  n11{"previous"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El usuario ya reseñó este curso"]):::error
  n11 -->|"sí"| n12
  n13["Llama a EducationCatalogRepository.createReview"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA education.course_reviews")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado |
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
  n5["Llama a EducationCatalogRepository.findCourseForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE education.courses")]:::efecto
  n5 --> n6
  n7{"!course"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Curso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"course.statusConceptId === CONCEPTS.COURSE_ARCHIVED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Un curso archivado no admite versiones"]):::error
  n9 -->|"sí"| n10
  n11["Llama a EducationCatalogRepository.findVersion"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE education.course_versions")]:::efecto
  n11 --> n12
  n13{"existing"}:::decision
  n12 --> n13
  n14(["409 CONFLICT Esa versión del curso ya existe"]):::error
  n13 -->|"sí"| n14
  n15["Llama a EducationCatalogRepository.createVersion"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA education.course_versions")]:::efecto
  n15 --> n16
  n17[("ACTUALIZA education.courses")]:::efecto
  n16 --> n17
  n18(("201 Responde con éxito")):::ok
  n17 --> n18
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
  n4["Llama a EducationCatalogRepository.findCourseByCode"]:::llamada
  n3 --> n4
  n5[("LEE education.courses")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe un curso con ese código"]):::error
  n6 -->|"sí"| n7
  n8{"dto.isAccredited && !dto.cmeCreditHours"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Un curso acreditado necesita declarar sus horas CME"]):::error
  n8 -->|"sí"| n9
  n10["Transacción: transactional(…)"]:::transaccion
  n8 -->|"no"| n10
  n11["Llama a EducationCatalogRepository.createCourse"]:::llamada
  n10 --> n11
  n12[("CREA education.courses")]:::efecto
  n11 --> n12
  n13["Llama a EducationCatalogRepository.createVersion"]:::llamada
  n12 --> n13
  n14[("CREA education.course_versions")]:::efecto
  n13 --> n14
  n15["Repite: forEach(…)"]:::bucle
  n14 --> n15
  n16["Llama a EducationCatalogRepository.createModule"]:::llamada
  n15 -->|"cada elemento"| n16
  n17[("CREA education.course_modules")]:::efecto
  n16 --> n17
  n18["Repite: forEach(…)"]:::bucle
  n17 --> n18
  n19["Llama a EducationCatalogRepository.createLesson"]:::llamada
  n18 -->|"cada elemento"| n19
  n20[("CREA education.lessons")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  n18 -->|"al terminar"| n21
  n15 -->|"al terminar"| n21
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Curso no encontrado; ResourceNotFoundException: Cohorte no encontrada |
| 409 | `CONFLICT` | ConflictException: El aprendiz ya está inscrito en el curso; ConflictException: La cohorte no tiene plazas disponibles |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una inscripción comprada necesita su intento de pago; PreconditionFailedException: El curso no está publicado; PreconditionFailedException: La cohorte pertenece a otro curso; PreconditionFailedException: La cohorte no está abierta |
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
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n6 --> n7
  n8[("LEE education.courses")]:::efecto
  n7 --> n8
  n9{"!course"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Curso no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"course.statusConceptId !== CONCEPTS.COURSE_PUBLISHED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El curso no está publicado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a EducationLearningRepository.findLiveEnrollment"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE education.enrollments")]:::efecto
  n13 --> n14
  n15{"live"}:::decision
  n14 --> n15
  n16(["409 CONFLICT El aprendiz ya está inscrito en el curso"]):::error
  n15 -->|"sí"| n16
  n17{"dto.cohortId"}:::decision
  n15 -->|"no"| n17
  n18["Llama a EducationCatalogRepository.findCohortForUpdate"]:::llamada
  n17 -->|"sí"| n18
  n19[("LEE education.course_cohorts")]:::efecto
  n18 --> n19
  n20{"!cohort"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Cohorte no encontrada"]):::error
  n20 -->|"sí"| n21
  n22{"cohort.courseId !== dto.courseId"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED La cohorte pertenece a otro curso"]):::error
  n22 -->|"sí"| n23
  n24{"cohort.statusConceptId !== CONCEPTS.COHORT_OPEN"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED La cohorte no está abierta"]):::error
  n24 -->|"sí"| n25
  n26{"cohort.capacity && enrolled ›= cohort.capacity"}:::decision
  n24 -->|"no"| n26
  n27(["409 CONFLICT La cohorte no tiene plazas disponibles"]):::error
  n26 -->|"sí"| n27
  n28[("ACTUALIZA education.course_cohorts")]:::efecto
  n26 -->|"no"| n28
  n29{"cohort.capacity && cohortEnrolledCount ›= cohort.capacity"}:::decision
  n28 --> n29
  n30[("ACTUALIZA education.course_cohorts")]:::efecto
  n29 -->|"sí"| n30
  n31["Llama a EducationLearningRepository.createEnrollment"]:::llamada
  n30 --> n31
  n29 -->|"no"| n31
  n17 -->|"no"| n31
  n32[("CREA education.enrollments")]:::efecto
  n31 --> n32
  n33(("201 Responde con éxito")):::ok
  n32 --> n33
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Inscripción no encontrada; ResourceNotFoundException: Curso no encontrado |
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
  n5["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE education.enrollments")]:::efecto
  n5 --> n6
  n7{"!enrollment"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Inscripción no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_COMPLETED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La inscripción no está completada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a EducationLearningRepository.findCertificateByEnrollment"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE education.certificates")]:::efecto
  n11 --> n12
  n13["Llama a EducationCatalogRepository.findCourseById"]:::llamada
  n12 --> n13
  n14[("LEE education.courses")]:::efecto
  n13 --> n14
  n15{"!course"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Curso no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a EducationLearningService.generateCertificateNumber"]:::llamada
  n15 -->|"no"| n17
  n18["Repite: ciclo for"]:::bucle
  n17 --> n18
  n19["Llama a EducationLearningRepository.findCertificateByNumber"]:::llamada
  n18 -->|"cada elemento"| n19
  n20[("LEE education.certificates")]:::efecto
  n19 --> n20
  n21(["409 CONFLICT No se pudo generar un número de certificado libre"]):::error
  n20 --> n21
  n18 -->|"al terminar"| n21
  n22["Llama a EducationLearningService.generateVerificationCode"]:::llamada
  n23["Repite: ciclo for"]:::bucle
  n22 --> n23
  n24["Llama a EducationLearningRepository.findCertificateByVerificationCode"]:::llamada
  n23 -->|"cada elemento"| n24
  n25[("LEE education.certificates")]:::efecto
  n24 --> n25
  n26(["409 CONFLICT No se pudo generar un código de verificación libre"]):::error
  n25 --> n26
  n23 -->|"al terminar"| n26
  n27["Llama a EducationLearningRepository.createCertificate"]:::llamada
  n28[("CREA education.certificates")]:::efecto
  n27 --> n28
  n29(("201 Responde con éxito")):::ok
  n28 --> n29
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Inscripción no encontrada |
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
  n5["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE education.enrollments")]:::efecto
  n5 --> n6
  n7{"!enrollment"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Inscripción no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La inscripción no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a EducationLearningService.recomputeProgress"]:::llamada
  n9 -->|"no"| n11
  n12["Llama a EducationCatalogRepository.findModulesByCourse"]:::llamada
  n11 --> n12
  n13[("LEE education.course_modules")]:::efecto
  n12 --> n13
  n14["Llama a EducationCatalogRepository.countLessonsByModules"]:::llamada
  n13 --> n14
  n15[("LEE education.lessons")]:::efecto
  n14 --> n15
  n16["Llama a EducationLearningRepository.findProgressByEnrollment"]:::llamada
  n15 --> n16
  n17[("LEE education.lesson_progress")]:::efecto
  n16 --> n17
  n18{"Number(progressPercent) ‹ 100"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED El curso no está completo"]):::error
  n18 -->|"sí"| n19
  n20["Llama a EducationCatalogRepository.findGradedAssessments"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE education.assessments")]:::efecto
  n20 --> n21
  n22["Llama a EducationLearningRepository.findPassedAttempts"]:::llamada
  n21 --> n22
  n23[("LEE education.assessment_attempts")]:::efecto
  n22 --> n23
  n24{"pending.length › 0"}:::decision
  n23 --> n24
  n25(["422 PRECONDITION_FAILED Quedan evaluaciones sin aprobar"]):::error
  n24 -->|"sí"| n25
  n26[("ACTUALIZA education.enrollments · ACTUALIZA education.enrollments · ACTUALIZA education.enrollments")]:::efecto
  n24 -->|"no"| n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Inscripción no encontrada; ResourceNotFoundException: Lección no encontrada |
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
  n5["Llama a EducationLearningRepository.findEnrollmentForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE education.enrollments")]:::efecto
  n5 --> n6
  n7{"!enrollment"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Inscripción no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"enrollment.statusConceptId === CONCEPTS.ENROLLMENT_STATE_CANCELLED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La inscripción está cancelada"]):::error
  n9 -->|"sí"| n10
  n11{"enrollment.expiresAt && enrollment.expiresAt ‹ new Date()"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El acceso a la inscripción ha caducado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a EducationCatalogRepository.findLessonById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE education.lessons")]:::efecto
  n13 --> n14
  n15{"!lesson"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Lección no encontrada"]):::error
  n15 -->|"sí"| n16
  n17["Llama a EducationLearningRepository.createLessonProgress"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA education.lesson_progress")]:::efecto
  n17 --> n18
  n19["Llama a EducationLearningService.recomputeProgress"]:::llamada
  n18 --> n19
  n20["Llama a EducationCatalogRepository.findModulesByCourse"]:::llamada
  n19 --> n20
  n21[("LEE education.course_modules")]:::efecto
  n20 --> n21
  n22["Llama a EducationCatalogRepository.countLessonsByModules"]:::llamada
  n21 --> n22
  n23[("LEE education.lessons")]:::efecto
  n22 --> n23
  n24["Llama a EducationLearningRepository.findProgressByEnrollment"]:::llamada
  n23 --> n24
  n25[("LEE education.lesson_progress")]:::efecto
  n24 --> n25
  n26[("ACTUALIZA education.enrollments")]:::efecto
  n25 --> n26
  n27(("201 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

