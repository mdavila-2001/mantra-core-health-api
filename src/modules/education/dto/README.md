# DTO de formación

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`education.dto.ts`) porque los 14 casos de uso comparten vocabulario (curso, aprendiz, evaluación).

## Convenciones

- **Puntuaciones y horas como cadena decimal** (`@IsNumberString`): el modelo usa `numeric`, y
  pasarlas por `number` introduciría error de coma flotante en notas y en créditos.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Enums de dominio por código legible** (`SELF_PACED`, `VIDEO`, `LEAD`, `PURCHASED`,
  `SINGLE_CHOICE`…); el servicio los traduce al `*_concept_id` del catálogo.
- **Árbol anidado** (`modules` → `lessons`) con `@ValidateNested({ each: true })` y `@Type`, ambos
  con `@ArrayMinSize(1)`: un curso sin lecciones no se puede cursar.
- **Rango acotado** en `rating` (`@Min(1) @Max(5)`) y en las ventanas de vigencia.

## Lo que no se acepta

- **Derivados**: `durationMinutes`, `progressPercent`, `enrolledCount`, `currentVersion`,
  `attemptNumber`, `certificateNumber`, `verificationCode` y `cmeCreditsAwarded` se calculan y se
  devuelven; nunca se reciben.
- **El autor de la reseña**: sale del token, no del cuerpo. Aceptarlo permitiría opinar en nombre de
  otro.
- **La puntuación del intento**: la calcula la corrección. El cuerpo sólo trae respuestas.

## `correctAnswerJson` entra pero no sale

`AssessmentQuestionDto` lo acepta al **diseñar** la evaluación y su descripción lo dice: sólo lo lee
la corrección. Ninguna respuesta del módulo lo devuelve, y `GradedAttemptResponseDto` informa
puntuación y aciertos, no qué se falló ni cuál era la respuesta.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Curso | `PublishCourseDto` (+ `CourseModuleDto`, `LessonDto`), `PublishVersionDto` | `CourseResponseDto`, `CourseVersionResponseDto` |
| Instructores y cohortes | `AssignInstructorDto`, `OpenCohortDto` | `InstructorAssignmentResponseDto`, `CohortResponseDto` |
| Inscripción | `EnrollLearnerDto`, `RecordProgressDto` | `EnrollmentResponseDto`, `ProgressResponseDto`, `CompleteEnrollmentResponseDto` |
| Evaluación | `CreateAssessmentDto` (+ `AssessmentQuestionDto`), `StartAttemptDto`, `SubmitAttemptDto` | `AssessmentResponseDto`, `AttemptResponseDto`, `GradedAttemptResponseDto` |
| Certificados y CME | `IssueCertificateDto`, `RecordCmeCreditDto`, `RevokeCertificateDto` | `CertificateResponseDto`, `CmeCreditResponseDto`, `RevokeCertificateResponseDto` |
| Reseñas | `CreateReviewDto` | `ReviewResponseDto` |

## Respuestas con `already*`

`CompleteEnrollmentResponseDto`, `CertificateResponseDto` y `CmeCreditResponseDto` llevan
`alreadyCompleted` / `alreadyIssued` / `alreadyAwarded`. Estas tres operaciones las dispara un
worker tras la finalización, y reintentar es lo normal: el flag es lo que distingue "se hizo ahora"
de "ya estaba hecho".

## `ProgressResponseDto` devuelve el desglose

Además del porcentaje, informa lecciones completadas y totales. Sin el desglose, un cliente que ve
"66,67 %" no puede explicarle al aprendiz qué le falta.

## Ejemplo de solicitud

```json
POST /education/attempts/{id}/submit
{
  "responsesJson": {
    "8f1c…": { "value": "b" },
    "9a2d…": ["a", "c"]
  }
}
```

## Ejemplo de respuesta

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "score": "75.00",
  "passed": true,
  "statusConceptId": "…",
  "correctAnswers": 3,
  "totalQuestions": 4
}
```

`score` está ponderado por los puntos de cada pregunta, así que puede no coincidir con
`correctAnswers / totalQuestions`.
