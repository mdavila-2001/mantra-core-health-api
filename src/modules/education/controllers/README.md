# Controladores de formación

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`EducationController`, prefijo `education`) con 14 endpoints sobre `courses`,
`enrollments`, `assessments`, `attempts` y `certificates`.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`:

| Rol | Alcance |
| --- | --- |
| `EDUCATION_ADMIN` | Todo el módulo |
| `COURSE_AUTHOR` | Publicar cursos, versiones y evaluaciones |
| `LEARNER` | Inscribirse, registrar progreso, hacer intentos y reseñar |
| `SYSTEM` | Completar inscripciones, emitir certificados y acreditar CME |

Es deliberado que un `LEARNER` pueda **hacer** un intento pero no **diseñar** la evaluación: quien
responde no debería poder ver ni cambiar la respuesta correcta.

También lo es que emitir el certificado y acreditar CME sean de `SYSTEM` y `EDUCATION_ADMIN`, no del
aprendiz: son consecuencia de completar el curso, no algo que se pide.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta. `ValidationPipe` global sobre los cuerpos.

## El endpoint sin cuerpo

`POST /education/enrollments/:id/complete` no recibe cuerpo: todo lo que decide la finalización
—progreso y evaluaciones aprobadas— ya está en la base. Aceptar parámetros abriría la puerta a
completar un curso que no se completó.

## Códigos de respuesta

`201 Created` en las altas (curso, versión, instructor, cohorte, inscripción, progreso, evaluación,
intento, certificado, crédito CME, reseña). `200 OK` en lo que muta algo existente: corregir el
intento, completar la inscripción y revocar el certificado.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben cuatro rutas con dos puntos (`/courses:publish`, `/versions:publish`,
`/attempts/{id}:submit`, `/enrollments/{id}:complete`, `/certificates/{id}:revoke`). Aquí se usan
segmentos normales por el mismo motivo que en el resto del proyecto: el enrutador de Nest 11
interpreta `:` como inicio de parámetro en cualquier posición del segmento.

## Pruebas

`education.controller.spec.ts` con ambos servicios mockeados: delegación, argumentos (incluido el
actor y los ids de ruta), el endpoint sin cuerpo y propagación de errores.
