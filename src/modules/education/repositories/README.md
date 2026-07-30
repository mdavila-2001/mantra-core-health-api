# Repositorios de formación

Acceso a `education.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `education`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Tablas | Métodos destacados |
| --- | --- | --- |
| `EducationCatalogRepository` | `courses`, `course_modules`, `lessons`, `course_versions`, `instructors`, `course_instructors`, `course_cohorts`, `assessments`, `assessment_questions`, `course_reviews` | `createCourse`, `findCourseForUpdate`, `findCourseByCode`, `createModule`, `createLesson`, `countLessonsByModules`, `createVersion`, `findVersion`, `findInstructorByProfile`, `findCourseInstructors`, `createCohort`, `findCohortForUpdate`, `createAssessment`, `findGradedAssessments`, `findQuestionsByAssessment`, `findReviewByReviewer` |
| `EducationLearningRepository` | `enrollments`, `lesson_progress`, `assessment_attempts`, `certificates`, `cme_credit_records` | `createEnrollment`, `findEnrollmentForUpdate`, `findLiveEnrollment`, `createLessonProgress`, `findProgressByEnrollment`, `createAttempt`, `findAttemptsForUpdate`, `findPassedAttempts`, `createCertificate`, `findCertificateByEnrollment`, `findCertificateByNumber`, `findCertificateByVerificationCode`, `createCmeRecord`, `findCmeRecord`, `findCmeRecordsForUpdate` |

La división separa lo que la organización **ofrece** de lo que el aprendiz **recorre**: el catálogo
cambia poco y lo edita quien diseña; el recorrido cambia en cada sesión y lo escribe quien estudia.

## Lecturas con bloqueo

`findCourseForUpdate` (serializa el versionado), `findCohortForUpdate` (la capacidad),
`findEnrollmentForUpdate`, `findAttemptForUpdate` y `findCertificateForUpdate` usan
`LockMode.PESSIMISTIC_WRITE`.

`findAttemptsForUpdate` bloquea **la colección** de intentos previos del aprendiz en la evaluación:
de ella salen el número del siguiente y la comprobación del tope, y ambas cosas se decidirían mal si
otra petición insertara en medio.

`findCmeRecordsForUpdate` bloquea los créditos del certificado porque revocarlo los revierte todos
en la misma transacción.

## Lecturas por clave natural

`findCourseByCode`, `findCohortByCode` (curso + código), `findCertificateByNumber`,
`findCertificateByVerificationCode`, `findReviewByReviewer` y `findCmeRecord` anticipan la UNIQUE
correspondiente para devolver un error de dominio o, cuando la operación es idempotente, el
resultado anterior.

`findLiveEnrollment` refleja la UNIQUE parcial `WHERE status IN (active, completed)`: filtra por los
estados que cuentan como vigentes en vez de por todos.

## El progreso se lee entero

`findProgressByEnrollment` devuelve el log completo ordenado del más reciente al más antiguo. No
existe una consulta de "último estado por lección" porque el servicio la resuelve en memoria
quedándose con la primera aparición de cada lección — el conjunto está acotado por el número de
lecciones del curso.

## Contadores derivados

`countLessonsByModules` da el denominador del progreso: cuenta lecciones publicadas de los módulos
del curso. Es un `COUNT` sobre índice, no carga de colecciones.

## Rendimiento

Consultas por PK, FK o clave natural indexada. Sin N+1: nada recorre relaciones fila por fila.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de los bloqueos y
de las UNIQUE llega con las pruebas de integración.
