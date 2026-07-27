# Servicios de formación

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `EducationCatalogService` | 01, 02, 03, 04, 07, 13 | Cursos, versiones, instructores, cohortes, evaluaciones y reseñas |
| `EducationLearningService` | 05, 06, 08, 09, 10, 11, 12, 14 | Inscripción, progreso, intentos, certificado y CME |

## Reglas de negocio

- **Curso (01)**: código único, árbol de módulos y lecciones numerado en el orden recibido, duración
  derivada de las lecciones y versión 1 registrada con él. Acreditar exige declarar las horas CME.
- **Versión (02)**: el número sale de `current_version + 1` con el curso bloqueado, y el curso pasa
  a apuntar a la nueva. Un curso archivado no admite versiones.
- **Instructor (03)**: la ficha se reutiliza por perfil profesional. Un curso no admite dos titulares
  ni el mismo instructor dos veces.
- **Cohorte (04)**: código único por curso, sobre un curso publicado, con las fechas coherentes.
- **Inscripción (05)**: exige curso publicado y ninguna inscripción viva del aprendiz. La capacidad
  se toma bajo bloqueo y, al llenarse, la cohorte se cierra. Comprar exige intento de pago.
- **Progreso (06)**: log append-only; el porcentaje se recalcula contando lecciones distintas
  completadas. Una inscripción cancelada o caducada no admite progreso.
- **Evaluación (07)**: puntuable exige respuesta correcta en cada pregunta; el módulo indicado debe
  ser del curso.
- **Intento (08)**: uno a la vez, numerado desde el máximo previo y acotado por `max_attempts`.
- **Corrección (09)**: se puntúa contra `correct_answer_json`, que no sale de la transacción. Enviar
  fuera de tiempo o corregir dos veces se rechaza. Una encuesta pasa siempre.
- **Finalización (10)**: idempotente; exige 100 % y todas las evaluaciones puntuables aprobadas.
- **Certificado (11)**: idempotente por inscripción; número y código de verificación se generan
  únicos, y las horas CME salen del curso.
- **CME (12)**: idempotente por certificado y profesional; exige certificado vigente que otorgue
  horas y curso con organismo acreditador.
- **Revocación (14)**: certificado y créditos cambian juntos; los ya revertidos no se cuentan de
  nuevo.

## Cómo se calcula el progreso

El log llega ordenado del más reciente al más antiguo. El servicio recorre y se queda con la
**primera aparición de cada lección** — su estado vigente — y cuenta cuántas están completadas. El
denominador es el número de lecciones publicadas del curso.

Que sea así, y no un contador incremental, es lo que hace que reanotar la misma lección no infle el
progreso y que retroceder (marcarla de nuevo en curso) lo baje.

## Cómo se corrige un intento

Cada pregunta aporta sus puntos si la respuesta coincide con la esperada; la puntuación es el
porcentaje de puntos obtenidos sobre el total posible. Las preguntas sin respuesta correcta
declarada (encuestas) suman al total posible pero nunca a lo obtenido.

Las respuestas de tipo lista se comparan **como conjunto**: el orden en que el aprendiz marca las
opciones no forma parte de la respuesta.

## Dependencias

`EntityManager`, los repositorios del módulo y `PinoLogger`. `EducationLearningService` usa además
`EducationCatalogRepository` para leer el curso, sus lecciones, la cohorte, la evaluación y sus
preguntas: son lecturas de validación y de corrección, no escrituras cruzadas.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluida la publicación completa del curso.
`FOR UPDATE` sobre curso, cohorte, inscripción, intento y certificado; los intentos previos se leen
bloqueados como colección; `row_version` aporta bloqueo optimista automático.

## Excepciones

`ResourceNotFoundException` (curso, cohorte, lección, inscripción, evaluación, intento o certificado
inexistente), `PreconditionFailedException` (curso no publicado o archivado, cohorte de otro curso o
cerrada, inscripción caducada o cancelada, curso incompleto, evaluaciones sin aprobar, intentos
agotados, tiempo vencido, certificado sin créditos o no vigente, acreditación sin organismo) y
`ConflictException` (código duplicado, doble inscripción, cohorte llena, instructor repetido, segundo
titular, intento en curso, intento ya corregido, reseña repetida, certificado ya revocado).

## Logs

`operation: 'education.<área>.<acción>'`. `warn` al revocar un certificado. No se loguean respuestas
de evaluación ni datos del aprendiz más allá del identificador.

## Pruebas

`education-catalog.service.spec.ts` (26) y `education-learning.service.spec.ts` (46): derivación de
la duración y del progreso, estado vigente de la lección, numeración de intentos, corrección
ponderada y por conjunto, idempotencia del certificado y del crédito CME, y arrastre de la
revocación.
