<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/education/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `education`

**Fuente:** [`src/modules/education/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/education/README.md)
· 1 controllers · 2 services · 2 repositories · 15 entidades · 1 DTO

---

# Módulo 47 — Formación, Evaluación y Acreditación

Catálogo de cursos con módulos y lecciones, versionado, instructores, cohortes, inscripciones con
progreso, evaluaciones corregidas automáticamente, certificados verificables y créditos CME.

## Casos de uso cubiertos (14)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-47-01 | `POST /education/courses/publish` | Publicar curso con módulos y lecciones |
| UC-47-02 | `POST /education/courses/:id/versions/publish` | Publicar versión del curso |
| UC-47-03 | `POST /education/courses/:id/instructors` | Asignar instructor |
| UC-47-04 | `POST /education/courses/:id/cohorts` | Abrir cohorte |
| UC-47-05 | `POST /education/enrollments` | Inscribir aprendiz |
| UC-47-06 | `POST /education/enrollments/:id/lesson-progress` | Registrar progreso |
| UC-47-07 | `POST /education/courses/:id/assessments` | Diseñar evaluación |
| UC-47-08 | `POST /education/assessments/:id/attempts` | Iniciar intento |
| UC-47-09 | `POST /education/attempts/:id/submit` | Enviar y calificar |
| UC-47-10 | `POST /education/enrollments/:id/complete` | Completar curso |
| UC-47-11 | `POST /education/enrollments/:id/certificate` | Emitir certificado |
| UC-47-12 | `POST /education/certificates/:id/cme-credits` | Acreditar CME |
| UC-47-13 | `POST /education/courses/:id/reviews` | Publicar reseña |
| UC-47-14 | `POST /education/certificates/:id/revoke` | Revocar y revertir CME |

## Entidades

`courses`, `course_modules`, `lessons`, `course_versions`, `instructors`, `course_instructors`,
`course_cohorts`, `enrollments`, `lesson_progress`, `assessments`, `assessment_questions`,
`assessment_attempts`, `certificates`, `cme_credit_records`, `course_reviews`.

## Flujo general

```
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

## Reglas de negocio

- **El curso se publica entero**: módulos y lecciones se crean en la misma transacción, numerados en
  el orden recibido, y la duración se **deriva** sumando las lecciones.
- **La versión 1 se registra con el curso**: publicar sin dejar constancia de qué se publicó haría
  imposible saber qué vio quien se inscribió antes de un cambio.
- **Acreditar exige declarar las horas**: un curso acreditado sin `cmeCreditHours` no otorgaría nada
  al completarse.
- **Un solo instructor titular por curso**: con dos, no se sabe quién responde por él. La ficha de
  instructor se reutiliza si el perfil profesional ya la tiene.
- **La capacidad de la cohorte se comprueba bajo bloqueo**, que es lo único que impide desbordarla
  con dos inscripciones simultáneas; llenar la última plaza la cierra.
- **No hay doble inscripción viva**: quien ya está `active` o `completed` en el curso no se
  reinscribe.
- **Comprar exige intento de pago**: una inscripción `PURCHASED` sin él quedaría sin contrapartida.
- **El progreso es append-only y derivado**: cada anotación se conserva, y el porcentaje se
  recalcula contando **lecciones distintas** cuyo estado vigente (la anotación más reciente) sea
  completada. Reanotar la misma lección no la cuenta dos veces.
- **Una evaluación puntuable exige respuesta correcta en cada pregunta**; una encuesta no.
- **Un intento a la vez**, numerado a partir del máximo previo y acotado por `max_attempts`. Enviar
  fuera de tiempo se rechaza, y corregir dos veces también.
- **La corrección no sale de la transacción**: `correct_answer_json` se lee para puntuar y nunca se
  devuelve. Las respuestas de opción múltiple se comparan como conjunto.
- **Completar exige 100 % y todas las evaluaciones puntuables aprobadas**: dar por completado un
  curso con una evaluación pendiente convertiría el certificado en un papel sin respaldo.
- **Emitir el certificado es idempotente por inscripción**, y las horas CME salen del curso, no del
  cuerpo de la petición.
- **Acreditar CME es idempotente** por certificado y profesional, y exige que el curso declare
  organismo acreditador.
- **Revocar arrastra los créditos**: el certificado y sus registros CME cambian en la misma
  transacción; uno revocado cuyos créditos siguieran contando dejaría acreditación sin respaldo.
- **Una reseña por autor y curso**, atribuida al usuario autenticado.

## Permisos

`EDUCATION_ADMIN` cubre el módulo. `COURSE_AUTHOR` publica cursos, versiones y evaluaciones.
`LEARNER` se inscribe, registra progreso, hace intentos y reseña. `SYSTEM` completa inscripciones,
emite certificados y acredita CME — son pasos que dispara un worker tras la finalización.

## Concurrencia

`FOR UPDATE` sobre curso (serializa el versionado), cohorte (la capacidad), inscripción, intento y
certificado. Los intentos previos de una evaluación se leen bloqueados: de ahí sale el número del
siguiente. `row_version` aporta bloqueo optimista automático.

## Logs

`operation: 'education.<área>.<acción>'`. Nivel `warn` al revocar un certificado. No se loguean
respuestas de evaluación ni datos del aprendiz más allá del identificador.

## Pruebas

`yarn test --testPathPatterns=education` — 72 pruebas de servicio + delegación del controlador.

## Pendiente

- **Verificación pública del certificado**: el `verification_code` se genera y se devuelve, pero el
  endpoint público que lo resuelve pertenece a la superficie de lectura, aún no implementada.
- **Cruce con habilitaciones**: el caso de uso pide validar el crédito CME contra
  `profiles.practitioner_specialties` y `jurisdiction_authorizations` (módulo 05). Aquí se acepta la
  especialidad y la jurisdicción que llegan; la validación cruzada se conectará con ese módulo.
- **Documento del certificado**: `file_id` se acepta si llega, pero generar el PDF pertenece al
  módulo de archivos.
- **Valoración agregada del curso**: el caso de uso la marca como derivada y opcional vía
  proyección; no se calcula aquí.
- **Outbox**: `CoursePublished`, `EnrollmentCompleted`, `CertificateIssued`, `CmeCreditAwarded` se
  emitirán cuando exista el módulo 35.

