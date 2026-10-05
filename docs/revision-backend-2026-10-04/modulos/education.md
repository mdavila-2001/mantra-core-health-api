# Revisión del módulo `education` — ALOVIDA

## Alcance y evidencia

Se revisaron los 14 casos de uso de catálogo, cohortes, inscripciones, progreso,
evaluaciones, certificados y créditos CME; sus DTOs, entidades, repositorios,
guardas globales y pruebas unitarias. La orden
`corepack yarn test src/modules/education --runInBand --silent` aprobó **3 suites
y 84 pruebas**. La cobertura usa
repositorios simulados: no ejecuta consultas con RLS ni prueba dos tenants o dos
aprendices frente a HTTP.

La autenticación y el `RolesGuard` sí resuelven un tenant de petición y verifican
que el rol con ámbito corresponda a ese tenant. El interceptor contrasta un
`tenantId` declarado en el cuerpo, pero no puede deducir el tenant propietario a
partir de un UUID de curso, inscripción, intento o certificado. Los servicios de
este módulo tampoco consumen el contexto con `requireTenantId()`.

## Hallazgos confirmados

### EDU-01 — Crítica — Las mutaciones por UUID no verifican que el recurso pertenezca al tenant activo

Los repositorios de curso, cohorte, inscripción, intento y certificado hacen
`findOne` por `id`, incluidos los métodos con bloqueo, sin `tenantId` ni join al
curso ([`education-catalog.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/repositories/education-catalog.repository.ts#L182-L210),
[`…L648-L656`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/repositories/education-catalog.repository.ts#L648-L656),
[`education-learning.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/repositories/education-learning.repository.ts#L145-L165),
[`…L314-L322`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/repositories/education-learning.repository.ts#L314-L322),
[`…L391-L413`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/repositories/education-learning.repository.ts#L391-L413)). Las operaciones de catálogo usan esos objetos directamente para versionar, asignar instructores, abrir cohortes y diseñar evaluaciones ([`education-catalog.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-catalog.service.ts#L224-L266),
[`…L284-L347`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-catalog.service.ts#L284-L347),
[`…L373-L417`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-catalog.service.ts#L373-L417)). El recorrido del alumno repite el patrón al modificar inscripciones, intentos y certificados ([`education-learning.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L231-L279),
[`…L406-L475`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L406-L475),
[`…L491-L560`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L491-L560),
[`…L770-L815`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L770-L815)).

El `TenantContextInterceptor` sólo rechaza un `tenantId` explícito distinto del
contexto ([`tenant-context.interceptor.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-context.interceptor.ts#L115-L129)); no inspecciona UUIDs de recursos. Las filas hijas de educación tampoco tienen columna de tenant (por ejemplo, inscripción y certificado), por lo que el aislamiento RLS, aun cuando se active, necesita una política por relación o una consulta que encadene al curso. Un administrador o autor con rol válido en tenant A puede elegir el UUID de un recurso del tenant B y mutarlo si la conexión no cuenta con esa política relacional.

**Plan de corrección:** crear lectores `find…InTenant` que exijan
`requireTenantId()` y unan cada agregado al curso (`courses.tenant_id`), usarlos
antes de bloquear o escribir y devolver un 404 uniforme fuera de alcance. Añadir
políticas RLS relacionales para todas las tablas hijas si RLS es la defensa de
base de datos prevista. Mantener los bloqueos pesimistas dentro de la misma
consulta acotada.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Admin del tenant A publica versión del curso A | `201`; sólo cambia el curso A |
| Límite | Admin de A indica UUID de cohorte, inscripción o certificado de B | `404`, sin cambio ni metadatos de B |
| Error | Autor de A intenta crear evaluación en curso de B | `404/RESOURCE_NOT_FOUND`, sin preguntas creadas |
| Falla catalogada | UUID válido de otro tenant al completar o revocar | `404/RESOURCE_NOT_FOUND/EDUCATION_RESOURCE_OUT_OF_SCOPE` |

### EDU-02 — Alta — El rol `LEARNER` no está anclado a su inscripción ni a su identidad

Las rutas de alumno aceptan cualquier `learnerRefId`, `enrollmentId` o
`attemptId`: `POST /enrollments` permite a `LEARNER` crear una inscripción con el
`learnerRefId` del cuerpo, y las rutas de progreso, intento, entrega y
finalización aceptan el identificador de ruta o cuerpo sin comprobación de
propiedad ([`education.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/controllers/education.controller.ts#L109-L124),
[`…L126-L215`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/controllers/education.controller.ts#L126-L215)).
`enrollLearner` persiste el identificador recibido ([`education-learning.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L117-L201)); `recordProgress`, `startAttempt`, `submitAttempt` y `completeEnrollment` sólo comprueban estados y relaciones entre curso/evaluación, nunca que el `learnerRefId` sea el sujeto autenticado ([`education-learning.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L231-L279),
[`…L309-L389`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L309-L389),
[`…L406-L475`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L406-L475),
[`…L491-L560`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L491-L560)).

Un usuario con el rol global o de tenant `LEARNER` que conozca identificadores
puede inscribir a otro perfil y avanzar, entregar o completar su curso. La
finalización deja la inscripción apta para emisión de certificado, que un worker
o administrador podría emitir después. Las pruebas construyen un actor con sólo
`id` y roles y no cubren la identidad del aprendiz ni el intento ajeno
([`education-learning.service.spec.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.spec.ts#L19-L19)).

**Plan de corrección:** definir el mapeo permitido entre `AuthenticatedUser` y
`learnerRefId` (perfil de paciente, profesional o usuario) y resolverlo en el
servidor para las rutas de autoservicio. Introducir `assertLearnerOwnsEnrollment`
antes de cada lectura o escritura del alumno; conservar una vía administrativa o
de worker explícita, auditada y con rol distinto. No aceptar `learnerRefId` del
cuerpo para un actor `LEARNER`.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Alumno A inicia y entrega su propio intento | `201/200`; cambia sólo la inscripción A |
| Límite | Alumno A se inscribe sin declarar `learnerRefId` | se deriva el perfil propio y se crea una sola inscripción |
| Error | Alumno A envía el UUID de inscripción o intento de B | `404`, sin progreso, calificación ni cambio de estado |
| Falla catalogada | Alumno A intenta inscribir o completar a B | `403/FORBIDDEN/LEARNER_ENROLLMENT_OWNER_REQUIRED` |

### EDU-03 — Media — El progreso acepta lecciones de otro curso y deja una bitácora inconsistente

Al registrar progreso se carga la inscripción por UUID y la lección por UUID de
forma independiente; tras verificar que ambas existen se inserta la fila, sin
confirmar que la lección pertenezca al curso de la inscripción
([`education-learning.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L231-L274),
[`education-catalog.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/repositories/education-catalog.repository.ts#L350-L359)). El recálculo posterior cuenta sólo las lecciones que salen de los módulos del curso de la inscripción ([`education-learning.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/education/services/education-learning.service.ts#L842-L870)).

Así, una llamada válida puede guardar en el log una lección ajena que nunca suma
al porcentaje. Esa evidencia de aprendizaje contradice al agregado y complica
auditoría, proyecciones y correcciones posteriores.

**Plan de corrección:** añadir al repositorio una búsqueda de lección por
`lessonId + courseId` mediante `lessons → course_modules`, y rechazar antes de
crear el log. Probar que el rechazo no modifica el porcentaje ni inserta una
fila de progreso.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Inscripción y lección del mismo curso | se registra y recalcula el porcentaje |
| Límite | Lección previa del mismo curso registrada dos veces | se conserva el log y cuenta el estado más reciente una vez |
| Error | Lección existente de otro curso | `422`, sin fila de progreso ni cambio porcentual |
| Falla catalogada | UUID de lección ajena con inscripción válida | `422/PRECONDITION_FAILED/LESSON_NOT_IN_ENROLLMENT_COURSE` |

## Controles verificados

Las transacciones y bloqueos serializan versionado, cupos de cohorte, intentos y
revocación de certificado. El progreso se recalcula a partir de lecciones
distintas, la emisión de certificado y la acreditación CME son idempotentes, y
la revocación cambia certificado y CME en una transacción. Las respuestas
correctas no se retornan desde la operación de calificación. Estos controles no
sustituyen el alcance por tenant ni la propiedad del aprendiz descritos arriba.
