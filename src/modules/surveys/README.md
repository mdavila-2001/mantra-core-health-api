# Módulo Surveys — Cuestionarios y encuestas de satisfacción

Instrumento de satisfacción dirigido: plantilla con versiones inmutables y
vigencia, preguntas con tipo de respuesta y obligatoriedad, asociación a la cosa
evaluada, invitación contra una atención completada y respuestas **privadas**
del paciente con lectura para el profesional dueño.

Cubre el carril 10 y las nueve reglas `DOC-ENC-001` … `DOC-ENC-009` del actor
doctor, más `PAC-CAL-008` y `PAC-DIAG-014` del actor paciente, que el
diagnóstico ALOVIDA marcaba **todas `AUSENTE`**.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-11-06 sobre claude/amazing-brown-f2c2a9 (5594749d + cambios de la encuesta por servicio). Repetir con:
  find src/modules/surveys -name '*.controller.ts' | wc -l
  find src/modules/surveys -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/surveys -name '*.entity.ts' | wc -l
  find src/modules/surveys -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **6 controllers, 23 rutas HTTP, 8 entidades y 7 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 8 de 8 archivos `*.entity.ts`): `survey_answers`, `survey_assignments`, `survey_invitation_reminders`, `survey_invitations`, `survey_questions`, `survey_responses`, `survey_templates`, `survey_versions`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /surveys/assignments` | PRACTITIONER, CLINICIAN | `surveys-assignments` |
| `POST /surveys/invitations` | PRACTITIONER, CLINICIAN | `surveys-assignments` |
| `GET /surveys/insights` | PRACTITIONER, CLINICIAN | `surveys-insights` |
| `GET /surveys/me/invitations` | sesión | `surveys-patient` |
| `GET /surveys/me/invitations/:id` | sesión | `surveys-patient` |
| `POST /surveys/me/invitations/:id/responses` | sesión | `surveys-patient` |
| `GET /surveys/catalog` | PRACTITIONER, CLINICIAN | `surveys-catalog` |
| `GET /surveys/standard-catalog` | PRACTITIONER, CLINICIAN | `surveys-service-assignments` |
| `GET /surveys/service-assignments` | PRACTITIONER, CLINICIAN | `surveys-service-assignments` |
| `PUT /surveys/service-assignments/:serviceId` | PRACTITIONER, CLINICIAN | `surveys-service-assignments` |
| `DELETE /surveys/service-assignments/:serviceId` | PRACTITIONER, CLINICIAN | `surveys-service-assignments` |
| `POST /surveys/templates` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `GET /surveys/templates` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `GET /surveys/templates/:id` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `PATCH /surveys/templates/:id` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/questions` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `PUT /surveys/templates/:id/questions/order` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `PATCH /surveys/templates/:id/questions/:questionId` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `DELETE /surveys/templates/:id/questions/:questionId` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/versions` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/versions/:versionNumber/publish` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `POST /surveys/templates/:id/deactivate` | PRACTITIONER, CLINICIAN | `surveys-templates` |
| `GET /surveys/templates/:id/responses` | PRACTITIONER, CLINICIAN | `surveys-templates` |

## Por qué es un módulo nuevo y no `forms` ni `community.polls`

`alovida-gap-map` registra esto como decisión de arquitectura abierta; se resolvió
por dominio propio.

- `community.polls` / `poll_options` / `poll_votes` son **encuestas sociales de
  una publicación**: sin destinatario, sin atención que las habilite y con votos
  públicos por diseño. Lo contrario de lo que se pide acá.
- `forms.*` es un **motor EAV de campos dinámicos versionado**, pensado para
  extender entidades existentes con campos a medida
  (`extension_target_policies`, `field_assignments`, `field_value_access_rules`).
  Reutilizarlo obligaba igual a agregar destinatario, asignación, ventana de
  respuesta y privacidad — es decir, la mayor parte del dominio — sobre un motor
  cuyos endpoints de gobernanza exigen `SECURITY_ADMIN`, que no es quien crea una
  encuesta de satisfacción.

## Endpoints

| Método y ruta | Permiso | Descripción |
|---|---|---|
| `POST /surveys/templates` | `PRACTITIONER` `CLINICIAN` | Crea la encuesta y su versión 1 en borrador. El front ya no la usa (sólo se importa del catálogo); la ruta se mantiene para no romper consumidores |
| `GET /surveys/templates` | `PRACTITIONER` `CLINICIAN` | Lista las encuestas propias |
| `GET /surveys/templates/:id` | `PRACTITIONER` `CLINICIAN` | Encuesta con el cuestionario de su última versión |
| `POST /surveys/templates/:id/questions` | `PRACTITIONER` `CLINICIAN` | Agrega pregunta (tipo, obligatoriedad, opciones, escala) |
| `POST /surveys/templates/:id/versions/:n/publish` | `PRACTITIONER` `CLINICIAN` | Publica y fija vigencia |
| `POST /surveys/templates/:id/deactivate` | `PRACTITIONER` `CLINICIAN` | Desactiva la encuesta |
| `GET /surveys/templates/:id/responses` | `PRACTITIONER` `CLINICIAN` | Revisa las respuestas recibidas |
| `POST /surveys/assignments` | `PRACTITIONER` `CLINICIAN` | Asocia una versión publicada a consulta o servicio |
| `POST /surveys/invitations` | `PRACTITIONER` `CLINICIAN` | Emite los cuestionarios de una atención completada |
| `GET /surveys/me/invitations` | autenticado con perfil de paciente | Mis cuestionarios |
| `GET /surveys/me/invitations/:id` | autenticado con perfil de paciente | Abre el cuestionario a responder |
| `POST /surveys/me/invitations/:id/responses` | autenticado con perfil de paciente | Responde |
| `GET /surveys/insights` | `PRACTITIONER` `CLINICIAN` | Resumen agregado de las encuestas del profesional (ver abajo) |
| `GET /surveys/catalog` | `PRACTITIONER` `CLINICIAN` | Las encuestas base del sistema y las propias del profesional, cada una con sus servicios |
| `GET /surveys/standard-catalog` | `PRACTITIONER` `CLINICIAN` | Catálogo estándar de encuestas por tipo de servicio (`surveys-standard.catalog.ts`); no es `GET /surveys/catalog`, que ya existía con otra forma |
| `GET /surveys/service-assignments` | `PRACTITIONER` `CLINICIAN` | La cita médica (fija) y cada servicio activo del profesional con su encuesta |
| `PUT /surveys/service-assignments/:serviceId` | `PRACTITIONER` `CLINICIAN` | Importa una plantilla del catálogo al servicio y reemplaza la anterior |
| `DELETE /surveys/service-assignments/:serviceId` | `PRACTITIONER` `CLINICIAN` | Quita la encuesta del servicio: vuelve a la base de servicio del sistema (204) |

### Resumen del profesional (`GET /surveys/insights`) y su privacidad

Devuelve, en agregado, `totals` (emitidos, respondidos, tasa), `nps`, `byQuestion`
(promedio y distribución por pregunta o dimensión, con `n`), `trend`,
`safetyAlerts` y `comments`, más `privacy: { minCohort, suppressed }`. Alcance: el
tenant activo y el profesional de la sesión; sus plantillas y las de sistema
(sin dueño profesional) emitidas por sus atenciones. Nunca incluye
`patient_profile_id`, `appointment_booking_id` ni la hora de un envío. La
dimensión de una pregunta de la encuesta base se deriva de su enunciado
(`survey-dimensions.ts`), no de una columna.

Reglas que evitan identificar a un paciente (`insights.constants.ts`):

- **Cohorte mínima de 5.** Con menos de 5 respondidas en el alcance filtrado sólo
  salen `totals` y `privacy.suppressed = true`. Una pregunta con menos de 5
  respuestas, el NPS con menos de 5 y los puntos de tendencia con menos de 5
  respondidos se suprimen o se funden con el siguiente; lo suprimido no alimenta
  ningún total (NPS, alertas, tendencia).
- **Periodo en meses calendario.** `from` es el primer día de un mes, `to` el
  último día de un mes, hasta 12 meses; cualquier hora o día suelto responde 400.
- **Comentarios** sólo si hay al menos 5 en el alcance; salen únicamente con el
  texto (sin día, mes ni hora), máximo 20, en un orden estable por hash y no
  cronológico.

Límite conocido: sin ruido añadido, comparar resúmenes de ventanas casi iguales
o del mismo periodo con y sin `serviceId` puede acotar el aporte de pocas
respuestas. La cohorte mínima y las ventanas por mes lo reducen; no lo eliminan.
Es un riesgo residual aceptado.

## Entidades (schema `surveys`)

`survey_templates`, `survey_versions`, `survey_questions`, `survey_assignments`,
`survey_invitations`, `survey_responses`, `survey_answers`.

## Reglas de negocio destacadas

- **Hay una encuesta base del sistema, y es de todos.** ALOVIDA define en código
  (`surveys.base-definitions.ts`, constante versionada) dos instrumentos: la de
  *consulta* (12 preguntas en la versión 2; obligatorias todas salvo la revisión de
  la medicación y el comentario final libre) y la de *servicio* (7 preguntas, todas
  opcionales). La versión 2 (29/10/2026) suma a la consulta tres ítems del núcleo
  CAHPS —tiempo suficiente, inquietudes contestadas y revisión de la medicación—
  con el enunciado de la traducción oficial al castellano de CMS (Medicare CAHPS,
  OMB 0938-0732, dominio público); los enunciados de la versión 1 no cambian para
  que el resumen siga agrupando el histórico. Se materializan de
  forma perezosa e idempotente en cada tenant, con ids deterministas
  (`SurveysSystemTemplatesService.ensureSystemTemplate`): una plantilla sin
  profesional dueño (dueño tipado `SYSTEM_BASE_CONSULTATION` / `SYSTEM_BASE_SERVICE`,
  `owner_id` = tenant) y su asignación de sistema (`TARGET_SYSTEM_BASE`). Ningún
  profesional la modifica, publica, desactiva ni asigna: 403
  `SURVEY_SYSTEM_TEMPLATE_IMMUTABLE`.
- **Una invitación por reserva completada, y qué lleva (06/11/2026).** Una consulta
  recibe **sólo** la encuesta base de consulta del sistema. Un servicio recibe la
  encuesta del catálogo estándar que el profesional que atendió le importó o, si no
  hay, la base de servicio. Las encuestas escritas a mano ya no se emiten (ni como
  extensión ni sueltas). Las invitaciones anteriores que llevan una extensión
  (`survey_invitations.extension_survey_version_id`) siguen contestables y legibles:
  cada pregunta que ve el paciente trae `source` (`SYSTEM` o `PRACTITIONER`) y el
  envío se valida contra la unión.
- **Las preguntas del profesional son siempre opcionales.** El servidor guarda
  `required = false` en el alta y la edición, y al responder una invitación base no
  exige las de la extensión aunque una versión anterior las guardara obligatorias.
- **El médico no lee las respuestas del sistema una por una.**
  `GET /surveys/templates/:id/responses` devuelve sólo las respuestas a sus preguntas
  (y omite las respuestas en las que no contestó ninguna suya).

- **Publicar congela.** Las preguntas solo se agregan a la versión en borrador.
  Corregir el instrumento es publicar la versión siguiente, no editar la vigente:
  sin eso, una respuesta de hace meses no se podría interpretar.
- **No se publica un cuestionario sin preguntas.** Produciría invitaciones
  incontestables.
- **Solo responde quien tuvo atención completada.** La invitación se emite contra
  una `scheduling.appointment_bookings` en `BOOKING_COMPLETED`; sin invitación no
  hay forma de responder. Es la regla que ALOVIDA fija explícitamente.
- **Emisión idempotente, también bajo concurrencia.** El servicio bloquea la reserva
  y detecta lo ya emitido (la base se reconoce por su plantilla de sistema, de la
  versión que sea); además la base lo respalda con el índice único
  `uq_survey_invitations_booking_version` `(reserva, versión)` (v4249): perder la
  carrera responde como emisión previa, no como error.
- **Ventana congelada al emitir.** `expires_at` se deriva de
  `response_window_days` en el momento de la emisión; cambiar el plazo después no
  mueve una ventana ya prometida.
- **Envío único y atómico.** Todas las obligatorias o ninguna; una invitación
  respondida no admite un segundo envío.
- **`value[x]` exclusivo en servicio**, igual que `forms.field_values`: el
  servicio normaliza una única columna `value_*` por fila, y la base lo respalda con
  `ck_survey_answers_single_value` (v4249). Qué columna corresponde a cada tipo de
  respuesta sigue siendo regla del servicio.
- **Un texto en blanco en una pregunta opcional es «no contestó».** Se ignora (no
  se valida ni se guarda); en una obligatoria sigue siendo 422.
- **Desactivar ≠ borrar.** Corta las emisiones nuevas; lo ya emitido sigue siendo
  contestable y lo ya respondido, legible.

## Privacidad — el requisito central

ALOVIDA lo fija en dos frases: las respuestas *«solo podrán ser consultadas por el
profesional o la organización autorizada»* y *«no deberán mostrarse
públicamente»*. La decisión **D-08** del proyecto lo confirma y agrega que la
calificación pública es una entidad distinta (`community.service_reviews`).

Cómo se sostiene acá:

1. **No existe la columna.** `survey_responses` no tiene ningún campo de
   visibilidad pública. No hay estado que alguien pueda fijar por error.
2. **El paciente no se identifica por parámetro.** Las rutas `/surveys/me/*` no
   aceptan `patientProfileId`: sale del claim `pid` de la sesión, y la lectura
   se acota además al tenant activo. Una cuenta con rol `PATIENT` cuyo token no
   trae `pid` recibe `[]` en `GET /surveys/me/invitations` (no 403); sin rol de
   paciente sigue siendo 403.
3. **La autorización de lectura es por dueño, no por rol.** Dos profesionales de
   la misma organización comparten roles y no comparten instrumentos; las
   respuestas se leen colgando de `GET /surveys/templates/:id/responses`, que
   comprueba dueño antes que nada.
4. **404 en vez de 403** ante un recurso ajeno: confirmar que existe pero es de
   otro ya filtra que esa persona tuvo una atención.

## Permissions

Guard JWT global. La autoría y la lectura de respuestas exigen `PRACTITIONER` o
`CLINICIAN`; el autoservicio del paciente no exige rol —todas las cuentas de
paciente comparten el mismo— sino perfil de paciente en la sesión, igual que las
vistas de paciente de M41 scheduling.

## Tests

- Unit: `corepack yarn test src/modules/surveys --runInBand --silent` — 13 suites
  y 421 pruebas aprobadas el 2026-11-06. Cubre propiedad de plantilla,
  invitación ajena, sesión sin perfil, validación por tipo, la importación del
  catálogo por servicio (dueño, 403/404/409, baja antes que alta, idempotencia) y
  el reemplazo de la base de servicio al emitir.
- Integración contra PostgreSQL real (opt-in `SURVEYS_IT_DB_URL`, base
  desechable): `test/integration/surveys-encuesta-base.int-spec.ts` (31) y
  `test/integration/surveys-encuesta-por-servicio.int-spec.ts` (17: importación,
  idempotencia en paralelo, índice único, tenant de la reserva, cierre del
  encuentro → turno completado → invitación del paciente, la teleconsulta que no
  completa con el encuentro abierto, y RLS forzado con `mantra_app`, con su caso
  negativo), aprobadas el 2026-11-06.

## Notas de integración

### 1. La emisión es automática y también un comando

Al completarse una reserva, `scheduling` avisa por su puerto `BOOKING_COMPLETED_PORT`
(adaptador `SurveysBookingCompletedAdapter`) cuando terminó la transacción de cierre
del caso de uso: confirmada si la petición no tiene una propia; con `RLS_ENFORCE=true`
la petición entera es una transacción y se confirma al responder. El adaptador emite en
un savepoint de la transacción en curso, así que un fallo descarta sólo la encuesta y
nunca revierte el cierre. El mismo
`SurveysAssignmentsService.issueForBooking` es el que atiende
`POST /surveys/invitations`, que sirve para reintentar: es idempotente. Una reserva sin
oferta de servicio (`practitionerServiceOfferingId` nulo) es una consulta; con oferta,
un servicio. `SurveysModule` no importa `SchedulingModule` (sólo lee sus entidades), así
que no hay ciclo.

La reserva llega a `BOOKING_COMPLETED` por «Completar la cita» de la agenda
(`POST /scheduling/bookings/:id/complete`) y también al **cerrar la consulta**:
cerrar el encuentro clínico (`POST /clinical/encounters/:id/close`,
`EncounterCloseService`) avisa por
`ENCOUNTER_CLOSED_PORT` de `clinical` (adaptador
`SchedulingEncounterClosedAdapter`, que resuelve la agenda con `ModuleRef` para
no cerrar el ciclo `scheduling → community → clinical`), y
`CompleteLinkedBookingUseCase` completa la reserva atada a la cita clínica del
encuentro (`appointment_bookings.appointment_id`). Sigue la máquina de estados:
una en curso se completa, una confirmada o con llegada registrada se inicia y se
completa, una ya completada se deja como está y una cancelada, ausente o sin
confirmar no se toca. Pasa por los mismos casos de uso y la misma autorización
que la agenda, así que la encuesta sale por el mismo puerto, todo en un savepoint.
Un fallo esperable (quien cierra no opera esa agenda, el turno ya cambió por otra vía)
queda en `warn`; uno inesperado, en `error`; ninguno deshace el cierre.

Terminar la teleconsulta (`clinical_ext`, fin de la sesión virtual) **no** completa el
turno mientras el encuentro clínico siga abierto: le quitaría al profesional la base
para seguir escribiendo la consulta y mandaría la encuesta antes del cierre. El turno
se completa al cerrar el encuentro; si el encuentro ya estaba cerrado, el fin de la
sesión sólo repite el aviso (idempotente).

### 2. Claim `pid` expuesto en `AuthenticatedUser` — cambio en contrato compartido

`JwtPayload.pid` ya se firmaba pero `JwtStrategy` no lo reconstruía, así que
ningún servicio podía saber de qué paciente era la sesión. Se agregó
`AuthenticatedUser.patientProfileId` de forma **aditiva**: nada que dependa del
contrato anterior cambia de comportamiento.

### 3. A qué se puede asociar una encuesta

- `SERVICE`: `targetId` es `billing.service_catalog.id` (la identidad canónica del
  servicio). Debe existir, ser de una práctica del tenant y estar ofrecido por el
  profesional (`practitioner_service_offerings`). La reserva lo trae en
  `service_snapshot.serviceCatalogId`. Los servicios asociables son los de
  `GET /scheduling/service-offerings` (`serviceCatalogId` + `serviceName`).
- `CARE_TYPE`: la reserva no lleva «tipo de atención» (solo `service_concept_id`), así
  que el único tipo que se puede resolver es *consulta* (reserva sin oferta de
  servicio): «todas mis consultas», `targetId` = `SURVEYS.CARE_TYPE_CONSULTATION` (se
  puede omitir). Cualquier otro tipo se rechaza al crear (422), con el motivo explícito.
- `APPOINTMENT`: una reserva del tenant atendida por el profesional.

`POST /surveys/assignments` sólo asocia plantillas importadas del catálogo
(`standard_catalog_code`): una escrita a mano responde 422
`SURVEY_ASSIGNMENT_REQUIRES_CATALOG_TEMPLATE`, sea cual sea el destino, porque ya no
se emitiría nunca. La ruta se mantiene para no romper consumidores; el front asocia
con `PUT /surveys/service-assignments/:serviceId`. De las asignaciones activas, sólo
reparte una `SERVICE` importada del profesional que atendió la reserva de ese
servicio; entre varias, la más reciente y, de una plantilla, su versión más alta.

La creación automática de una «Satisfacción — <servicio>» por servicio nuevo (FT-31) se
retiró: la encuesta base la reemplaza. Las que ya existen no se borraron.

### 4. Sin indicadores agregados ni exportación anonimizada

ALOVIDA los pide (`DOC-ENC-008`, `DOC-ENC-009`), pero publicar un agregado exige
el umbral mínimo de participantes (decisión **D-13**), que no está definido: *«se
puede modelar la encuesta sin el umbral, pero no se puede publicar ningún
agregado sin él»*. El módulo no los ofrece.

### 5. Encuesta estandarizada por servicio (06/11/2026)

El profesional ya no escribe encuestas: a cada servicio suyo le importa una
plantilla del catálogo estándar (`surveys-standard.catalog.ts`, instrumentos de
dominio público citados en cada pregunta).

- **Qué es «sus servicios».** Las ofertas activas del profesional
  (`scheduling.practitioner_service_offerings`, `OFFERING_ACTIVE`) cuyo servicio
  (`billing.service_catalog`) es de una práctica del tenant activo. Un servicio
  fuera de esa lista responde 403 `SURVEY_SERVICE_NOT_OWNED`, también si no
  existe. Un código fuera del catálogo responde 404
  `SURVEY_CATALOG_CODE_UNKNOWN`.
- **Importar materializa una plantilla propia**, publicada (versión 1
  inmutable, preguntas siempre opcionales) con
  `survey_templates.standard_catalog_code`, una por `(tenant, profesional,
  código)` y con ids deterministas: importar dos veces, o en paralelo, reutiliza
  la misma. La misma plantilla puede usarse en varios servicios, cada uno con su
  asignación.
- **Una activa por servicio y profesional.** El `PUT` bloquea las ofertas del
  servicio, desactiva la asignación activa anterior, la escribe en la base y
  recién entonces crea la nueva, todo en una transacción. Lo respalda el índice
  único parcial `uq_survey_assignments_active_service_owner` (v4.2.91), sobre la
  copia `survey_assignments.owner_practitioner_id` que el servicio fija y un
  disparador valida contra la plantilla; perder la carrera responde 409
  `SURVEY_ASSIGNMENT_ALREADY_ACTIVE`. Repetir el `PUT` con la encuesta vigente
  no cambia nada.
- **La importada reemplaza a la base de servicio.** Al completarse una reserva de
  ese servicio, la invitación lleva la plantilla importada **en lugar de** la
  base de servicio del sistema: su núcleo copia literalmente el de la base y
  emitir las dos repetiría las preguntas. Una encuesta escrita a mano ya no se
  emite. La cita médica sin servicio usa
  siempre la base de consulta: no se reemplaza ni se quita (la fila «Cita
  médica» de `GET /surveys/service-assignments` es `replaceable: false`).
- **Quitar** (`DELETE`) desactiva la asignación; la plantilla queda y lo ya
  emitido sigue siendo contestable.
- **`GET /surveys/service-assignments`** trae, además, `consultation.questions` (las
  preguntas de la base de consulta vigente, de `SYSTEM_BASE_SURVEYS`) y
  `services[].serviceKind`, el tipo de servicio derivado en el servidor del nombre
  del servicio (`service-kind.ts`, con la tabla de reglas): `billing.service_catalog`
  no tiene columna de tipo y el nombre sale del repositorio universal de servicios.
  Lo no reconocido es `OTHER`. Orienta qué plantilla sugerir; no restringe.

### 6. La emisión del cierre usa el tenant de la reserva

`scheduling` autoriza completar una reserva por agenda propia
(`BookingAccess.loadForOperation`), no por el tenant activo de la sesión. La
emisión automática (`issueForCompletedBooking`) corre por eso en el tenant de la
reserva, que es donde la ve el paciente: con el de la sesión respondía «Reserva no
encontrada», el adaptador lo registraba y el paciente se quedaba sin encuesta. La
emisión manual (`POST /surveys/invitations`) sigue acotada al tenant de la sesión.

Con `RLS_ENFORCE=true` la reserva sólo se ve en el tenant de la petición
(`app.current_tenant_id`): una reserva de otra organización no se puede completar ni
emitir desde esa sesión (404), y la emisión escribe en el tenant de la petición, que es
el de la reserva. Lo prueba `surveys-encuesta-por-servicio.int-spec.ts` con el parche
de RLS y el rol `mantra_app`, incluido el caso negativo.

## Runbook: reservas completadas sin invitación

La emisión automática no reintenta: si falla (base caída, conceptos sin sembrar), el
cierre de la atención queda bien y `SurveysBookingCompletedAdapter` registra
`bookingId`, `tenantId` y `reason` (`warn` si es esperable, como una reserva que la
sesión no ve; `error` si no). No hay
barrido automático ni endpoint de listado.

1. Listar las reservas completadas del tenant sin ninguna invitación:
   `SurveysAssignmentsService.listCompletedBookingsWithoutInvitation(limit)` (más
   recientes primero; consulta interna, hay que invocarla desde un script o consola
   con el contexto del tenant).
2. Reemitir cada una con `POST /surveys/invitations {appointmentBookingId}`. Es
   idempotente y, para un profesional, exige haber atendido la reserva (la
   administración de agenda emite sobre cualquiera).
3. Si el fallo fue por conceptos sin sembrar o por la columna
   `extension_survey_version_id` ausente, corregirlo antes (sembrar conceptos /
   aplicar `2026-10-28_v4267_surveys_encuesta_base.sql`).
