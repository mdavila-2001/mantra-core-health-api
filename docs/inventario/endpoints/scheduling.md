<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `scheduling`

- **Bloque:** Práctica y Agenda (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)
- **Operaciones:** 50 (41 en el contrato, 9 sólo en el código)
- **Riesgo:** ALTO 2 · MEDIO 33 · BAJO 15
- **Tablas distintas que tocan:** 37
- **Respuestas de error y detalle contractual:** `openapi/endpoints/scheduling.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/scheduling/activity-types` | Las tipologías de actividad que la agenda sabe pintar (carril 12). El propietario lo pidió así: «con otros colores los otros procedimientos (TURNOS, OPERACIONES, ETC.) catalogado por tipología raíz». La columna existía y no había un solo concepto que ponerle. Manda `tone` y no un color: el color concreto es del sistema de diseño. Un `#RRGGBB` desde el servidor obligaría a redesplegarlo para cambiar la paleta y rompería el tema oscuro. | BAJO | 0 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 2 | POST | `/scheduling/appointments/direct` | Asignar una cita puntual a un paciente (nace confirmada) | MEDIO | 32 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 3 | POST | `/scheduling/booking-policies` | Definir una política de reserva | MEDIO | 2 | SCHEDULING_ADMIN, PRACTITIONER |
| 4 | GET | `/scheduling/bookings` | UC-41-15: lista citas por paciente, recurso y/o ventana | BAJO | 9 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 5 | GET | `/scheduling/bookings/{id}` | UC-41-15: consulta una cita | BAJO | 6 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 6 | POST | `/scheduling/bookings/{id}/accept` | Aceptar la solicitud de cita | MEDIO | 33 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 7 | POST | `/scheduling/bookings/{id}/cancel` | Cancelar la cita y liberar el cupo | MEDIO | 27 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 8 | POST | `/scheduling/bookings/{id}/check-in` | Registrar la llegada del paciente | MEDIO | 5 | SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 9 | POST | `/scheduling/bookings/{id}/complete` | Completar la atención | MEDIO | 8 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 10 | POST | `/scheduling/bookings/{id}/delay` | Informar una demora sobre una cita | MEDIO | 23 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 11 | GET | `/scheduling/bookings/{id}/payment-state` | Lee el estado de pago de la cita. Devuelve `null` cuando nadie lo marcó todavía, que **no** es lo mismo que «pendiente de pago»: pendiente es algo que alguien firmó. | BAJO | 3 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 12 | PUT | `/scheduling/bookings/{id}/payment-state` | Marca el estado de pago de la cita — TAREA-13, punto 5. `PUT` y no `POST` porque es **idempotente**: hay una fila por cita y volver a mandar el mismo estado deja exactamente el mismo resultado. Las otras operaciones de este controlador son `POST` porque cada una es un acto distinto —aceptar dos veces no es aceptar—; marcar un pago dos veces sí. Quién puede: los mismos que responden la solicitud. **El paciente no**: decir que una cita está pagada es una afirmación del prestador, y dejársela hacer a quien debe el dinero sería confiar en el campo equivocado. | MEDIO | 9 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 13 | POST | `/scheduling/bookings/{id}/propose-schedule` | Proponer otro horario para la solicitud | MEDIO | 9 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 14 | POST | `/scheduling/bookings/{id}/reject` | Rechazar la solicitud de cita | MEDIO | 27 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 15 | POST | `/scheduling/bookings/{id}/reminders` | Programar recordatorios para la cita | MEDIO | 3 | SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 16 | POST | `/scheduling/bookings/{id}/request-info` | Pedir documentación u orden médica antes de aceptar | MEDIO | 6 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 17 | POST | `/scheduling/bookings/{id}/reschedule` | Reprogramar la cita a otro slot | MEDIO | 26 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 18 | POST | `/scheduling/bookings/{id}/start` | Iniciar la atención | MEDIO | 8 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 19 | GET | `/scheduling/confirmation-rules` | Listar las reglas de un tenant | BAJO | 1 | SCHEDULING_ADMIN |
| 20 | POST | `/scheduling/confirmation-rules` | Crear una regla de confirmación | MEDIO | 1 | SCHEDULING_ADMIN |
| 21 | POST | `/scheduling/confirmation-rules/{id}/activate` | Reactivar una regla desactivada | MEDIO | 2 | SCHEDULING_ADMIN |
| 22 | POST | `/scheduling/confirmation-rules/{id}/deactivate` | Desactivar una regla (sin borrado duro) | MEDIO | 2 | SCHEDULING_ADMIN |
| 23 | POST | `/scheduling/confirmation-rules/evaluate` | Evaluar una solicitud de reserva contra las reglas vigentes | BAJO | 1 | SCHEDULING_ADMIN |
| 24 | GET | `/scheduling/exception-types` | Los motivos de bloqueo que el formulario puede ofrecer (TAREA-11, punto 4). Existe porque el catálogo estaba en la base y **no lo publicaba nadie**: `exception_type_concept_id` es obligatoria y la pantalla no tenía de dónde sacar las opciones, así que en la práctica todo bloqueo nacía con el mismo valor. Es una lectura de catálogo, no de datos de nadie: sin filtro por tenant y abierta a cualquiera que pueda crear una excepción. | BAJO | 0 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 25 | DELETE | `/scheduling/exceptions/{id}` | Eliminar una excepción de disponibilidad | ALTO | 3 | SCHEDULING_ADMIN, PRACTITIONER |
| 26 | PATCH | `/scheduling/exceptions/{id}` | Edita un bloqueo sin borrarlo (AC-11-7). **Agrandar el rango cierra los cupos nuevos; achicarlo no reabre ninguno.** Es la P-11-3, y se resuelve por la consecuencia: cerrar de más ofrece menos turnos y el profesional lo pidió; reabrir ofrecería turnos que nadie decidió ofrecer. El módulo queda con una sola regla: **los cupos sólo los crea publicar el horario.** | MEDIO | 5 | SCHEDULING_ADMIN, PRACTITIONER |
| 27 | POST | `/scheduling/holds/{holdToken}/confirm` | Confirmar la cita a partir de la reserva temporal | MEDIO | 14 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 28 | POST | `/scheduling/holds/{holdToken}/request` | Solicitar la cita a partir de la reserva temporal | MEDIO | 30 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 29 | POST | `/scheduling/internal/dispatch-reminders` | Despachar los recordatorios cuya hora ya llegó | MEDIO | 22 | SYSTEM, SYSTEM_WORKER |
| 30 | POST | `/scheduling/internal/expire-holds` | Liberar las reservas temporales vencidas | MEDIO | 4 | SYSTEM, SYSTEM_WORKER |
| 31 | POST | `/scheduling/internal/promote-waitlist/{slotId}` | Promover candidatos de la lista de espera a un slot con cupo | MEDIO | 20 | SYSTEM, SYSTEM_WORKER |
| 32 | GET | `/scheduling/internal/waitlist-candidates` | Listar slots con cupo libre y candidatos activos en espera | BAJO | 2 | SYSTEM, SYSTEM_WORKER |
| 33 | GET | `/scheduling/resources` | Listar los recursos agendables de un tenant | BAJO | 6 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 34 | POST | `/scheduling/resources` | Dar de alta un recurso agendable | MEDIO | 4 | SCHEDULING_ADMIN, PRACTITIONER |
| 35 | POST | `/scheduling/resources/{id}/close-slots` | Cierra cupos sueltos y deja el bloqueo que impide que vuelvan. Lo que el pedido pone entre paréntesis es su razón de ser: cerrar un cupo **sin** dejar la excepción sirve hasta que alguien regenera, y ahí el rato que el profesional había cerrado se ofrece otra vez. Un cupo con cita viva NO se cierra por acá: se rechaza entero y se nombran cuáles. Cancelar el turno de alguien exige motivo y avisa a esa persona; hacerlo de arrastre sería decidir por quien está esperando. | MEDIO | 5 | SCHEDULING_ADMIN, PRACTITIONER |
| 36 | POST | `/scheduling/resources/{id}/delay` | Informar una demora que alcanza a toda la agenda del recurso | MEDIO | 22 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 37 | GET | `/scheduling/resources/{id}/exceptions` | Listar las excepciones de disponibilidad de un recurso | BAJO | 3 | SCHEDULING_ADMIN, PRACTITIONER, PATIENT |
| 38 | POST | `/scheduling/resources/{id}/exceptions` | Registrar una excepción de disponibilidad | MEDIO | 5 | SCHEDULING_ADMIN, PRACTITIONER |
| 39 | POST | `/scheduling/resources/{id}/shift-slots` | Corre los cupos de una agenda N minutos — «mover horario» del carril 12. Distinto de «avisar demora», que **sólo avisa** y deja los cupos donde estaban. Acá el turno de la persona pasa a ser otro, así que se escribe y se avisa. Todo o nada: si un cupo no puede moverse porque su horario nuevo pisa otra cita del mismo profesional, no se mueve ninguno. La colisión la rechaza la base con `ex_appointments_practitioner_time`, no este código. | MEDIO | 21 | SCHEDULING_ADMIN, PRACTITIONER |
| 40 | GET | `/scheduling/resources/{id}/slots` | UC-41-14: agenda publicada del recurso en una ventana | BAJO | 2 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 41 | GET | `/scheduling/resources/{id}/templates` | Listar las plantillas de agenda de un recurso | BAJO | 3 | SCHEDULING_ADMIN, PRACTITIONER |
| 42 | POST | `/scheduling/resources/{id}/templates` | Publicar una plantilla de agenda con sus franjas | MEDIO | 5 | SCHEDULING_ADMIN, PRACTITIONER |
| 43 | GET | `/scheduling/slots` | Consultar los cupos de una ventana | BAJO | 1 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 44 | POST | `/scheduling/slots/{id}/holds` | Reservar temporalmente un cupo del slot | MEDIO | 6 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 45 | DELETE | `/scheduling/templates/{id}` | Retirar un horario publicado (TAREA-10, punto 6). `DELETE` y no `PATCH` porque para quien lo usa **es** el botón de dar de baja el horario; lo que cambia es qué significa dar de baja acá, y eso lo dice el cuerpo de la respuesta. No es `@HttpCode(NO_CONTENT)` como el borrado de una excepción: éste devuelve cuánto soltó y cuánto conservó. Responde **409 con la lista** cuando el horario tiene citas comprometidas: no lo retira y nombra lo que hay que resolver primero. | ALTO | 7 | SCHEDULING_ADMIN, PRACTITIONER |
| 46 | POST | `/scheduling/templates/{id}/generate-slots` | Materializar los slots de la plantilla en una ventana | MEDIO | 7 | SCHEDULING_ADMIN, PRACTITIONER |
| 47 | POST | `/scheduling/templates/{id}/reactivate` | Vuelve a poner en vigencia un horario pausado — «me fui de viaje y volví». `POST` y no `PATCH` porque es un acto con nombre, no la edición de un campo: es la contraparte exacta de `retire`, y las dos se leen juntas en el mismo controlador. | MEDIO | 3 | SCHEDULING_ADMIN, PRACTITIONER |
| 48 | GET | `/scheduling/waitlist` | Listar las entradas de lista de espera de un paciente | BAJO | 4 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 49 | POST | `/scheduling/waitlist` | Inscribir a un paciente en la lista de espera | MEDIO | 1 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 50 | GET | `/tenants/{tenantId}/agenda` | La agenda de la organización | BAJO | 5 | sesión (sin roles) |

---

## 1. GET /scheduling/activity-types

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Las tipologías de actividad que la agenda sabe pintar (carril 12). El propietario lo pidió así: «con otros colores los otros procedimientos (TURNOS, OPERACIONES, ETC.) catalogado por tipología raíz». La columna existía y no había un solo concepto que ponerle. Manda `tone` y no un color: el color concreto es del sistema de diseño. Un `#RRGGBB` desde el servidor obligaría a redesplegarlo para cambiar la paleta y rompería el tema oscuro.
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listActivityTypes` — `src/modules/scheduling/controllers/scheduling.controller.ts:406`

### Qué es y para qué sirve (negocio)

Las tipologías de actividad que la agenda sabe pintar (carril 12). El propietario lo pidió así: «con otros colores los otros procedimientos (TURNOS, OPERACIONES, ETC.) catalogado por tipología raíz». La columna existía y no había un solo concepto que ponerle. Manda `tone` y no un color: el color concreto es del sistema de diseño. Un `#RRGGBB` desde el servidor obligaría a redesplegarlo para cambiar la paleta y rompería el tema oscuro. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/activity-types` la atiende `SchedulingController.listActivityTypes` (src/modules/scheduling/controllers/scheduling.controller.ts:406). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingCatalogService.listActivityTypes`. No toca tablas relacionales: Devuelve el catálogo de tipologías de actividad, que vive en constantes del código (ACTIVITY_TYPES y sus etiquetas); no accede a datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:406` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: Devuelve el catálogo de tipologías de actividad, que vive en constantes del código (ACTIVITY_TYPES y sus etiquetas); no accede a datos.. _(manual, 2026-10-21; fuente: `src/modules/scheduling/services/scheduling-catalog.service.ts:1080`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ActivityTypeListDto` · DTO `ActivityTypeListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ActivityTypeDto>` | Sí | — | — | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:904` |
| `items[].type` | `string` | Sí | valores: APPOINTMENT, PROCEDURE, FOLLOW_UP, TELEHEALTH, OTHER | — | Clave estable con la que se identifica la tipología. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:881` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, que es lo que guarda `appointments`. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:885` |
| `items[].label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:889` |
| `items[].tone` | `string` | Sí | valores: primary, secondary, info, warning, success | — | El tono con el que se pinta, del sistema de diseño. `error` queda reservado para los BLOQUEOS —el propietario los pidió «con rojo»— así que ninguna tipología lo usa: si una actividad se pintara igual que un bloqueo, la agenda diría que ese rato está cerrado cuando no lo está. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:899` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:134` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /scheduling/appointments/direct

- **Origen:** CONTRATO
- **Nombre:** Asignar una cita puntual a un paciente (nace confirmada)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createDirectAppointment` — `src/modules/scheduling/controllers/scheduling.controller.ts:515`

### Qué es y para qué sirve (negocio)

Asignar una cita puntual a un paciente (nace confirmada). Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/appointments/direct` la atiende `SchedulingController.createDirectAppointment` (src/modules/scheduling/controllers/scheduling.controller.ts:515). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `CreateDirectAppointmentDto` (5 campos, 4 obligatorios). Delega en `SchedulingBookingsService.createDirectAppointment`. Crea filas en audit.appointment_bookings_history, clinical.appointments, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.appointment_bookings, scheduling.appointment_reminders, scheduling.bookable_slots. Actualiza audit.appointment_bookings_history, messaging.notification_requests, scheduling.bookable_slots. Lee audit.appointment_bookings_history, iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests y 13 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:515` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `clinical.appointments` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.crearCitaClinica → AppointmentsRepository.create | `src/modules/clinical/repositories/appointments.repository.ts:73` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.assertVinculoVigente → PractitionerAffiliationGateService.evaluar → PractitionerAffiliationGateService.tenantDeCadaSede | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:163` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.assertVinculoVigente → PractitionerAffiliationGateService.evaluar → PractitionerAffiliationGateService.tenantDeCadaSede | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:163` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1014` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.assertVinculoVigente → PractitionerAffiliationGateService.evaluar | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:88` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsRepository.createBooking | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:280` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:216` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1187` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingProfessionalTimeService.compromisos → SchedulingProfessionalTimeService.tiempoOcupado → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:977` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment | `src/modules/scheduling/services/scheduling-bookings.service.ts:944` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingCatalogRepository.createSlot | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:675` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:608` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Cuerpo — DTO `CreateDirectAppointmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:900` |
| `resourceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:909` |
| `startAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:914` |
| `durationMinutes` | `number` | Sí | mínimo 5; máximo 480 | `@IsInt()` `@Min(5)` `@Max(480)` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:924` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:931` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5,
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<DirectAppointmentResponseDto>` · DTO `DirectAppointmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | La reserva creada, ya confirmada. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:960` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | El cupo único que la respalda. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:964` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado con el que nace: confirmada. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:968` |
| `retractedSlots` | `number` | Sí | — | — | Cupos ofrecidos que esta cita retiró. Si el rato pisaba horarios libres que el doctor mismo ofrecía —en cualquiera de sus sedes—, se retiran en la misma transacción y acá se informa cuántos: el front lo muestra como AVISO («esto quitó N horarios disponibles»), no como pregunta. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:979` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Un profesional solo puede asignar citas en su propia agenda. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Tu vínculo con esta organización todavía está pendiente de aprobación, así que todavía no podés comprometer turnos suyos. / Tu vínculo con esta organización ya…; PreconditionFailedException: El profesional ya tiene {quien} de {horaLocal( primero.startAt, p…} a {horaLocal( primero.endAt, pri…}{primero.resourceName ? ` en «…}. No puede estar en dos l…; PreconditionFailedException: El paciente ya tiene un turno confirmado en ese rato{choque.resourceName ? ` en «$…}. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /scheduling/booking-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de reserva
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createPolicy` — `src/modules/scheduling/controllers/scheduling.controller.ts:171`

### Qué es y para qué sirve (negocio)

Definir una política de reserva. Caso de uso UC-41-01: Definir recurso y política. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:10`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/booking-policies` la atiende `SchedulingController.createPolicy` (src/modules/scheduling/controllers/scheduling.controller.ts:171). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CreateBookingPolicyDto` (10 campos, 3 obligatorios). Delega en `SchedulingCatalogService.createPolicy`. Crea filas en scheduling.booking_policies. Lee scheduling.booking_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_policies` | ESCRIBE | CREA | DIRECTA | SchedulingController.createPolicy → SchedulingCatalogService.createPolicy → SchedulingCatalogRepository.createPolicy | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.createPolicy → SchedulingCatalogService.createPolicy → SchedulingCatalogRepository.findPolicyByCode | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:375` |

### Cuerpo — DTO `CreateBookingPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:133` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único de la política dentro del tenant | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:144` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:152` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Práctica a la que aplica la política | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:163` |
| `minNoticeMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Antelación mínima para reservar, en minutos | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:174` |
| `maxAdvanceDays` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Máximo de días de antelación | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:183` |
| `cancellationWindowMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Ventana sin penalización para cancelar, en minutos | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:194` |
| `noShowFeeAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cargo por inasistencia | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:205` |
| `maxActivePerPatient` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Citas activas simultáneas por paciente | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:216` |
| `holdTtlSeconds` | `number` | No | mínimo 30 | `@IsOptional()` `@IsInt()` `@Min(30)` | Vigencia de la reserva temporal del slot, en segundos | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:228` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "minNoticeMinutes": 1,
  "maxAdvanceDays": 1,
  "cancellationWindowMinutes": 1,
  "noShowFeeAmount": "50.00",
  "maxActivePerPatient": 1,
  "holdTtlSeconds": 300
}
```

</details>

### Respuesta — `Promise<BookingPolicyResponseDto>` · DTO `BookingPolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:239` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:245` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:251` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: El tenant indicado no es uno de los del actor. |
| 409 | `CONFLICT` | ConflictException: Ya existe una política con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:103` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-01`

---

## 4. GET /scheduling/bookings

- **Origen:** CONTRATO
- **Nombre:** UC-41-15: lista citas por paciente, recurso y/o ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.searchBookings` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:85`

### Qué es y para qué sirve (negocio)

UC-41-15: lista citas por paciente, recurso y/o ventana. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings` la atiende `SchedulingBookingsController.searchBookings` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:85). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingBookingsService.searchBookings`. Lee audit.appointment_bookings_history, clinical.appointments, profiles.patient_profiles, profiles.persons, scheduling.appointment_bookings, scheduling.appointment_payment_states, scheduling.bookable_slots, scheduling.booking_reschedules y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:85` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings | `src/modules/scheduling/services/scheduling-bookings.service.ts:2432` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → AppointmentsRepository.findTypesByIds | `src/modules/clinical/repositories/appointments.repository.ts:125` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1014` |
| `profiles.persons` | LEE | LEE | POR_SQL | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1014` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SchedulingBookingsRepository.findBookings | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:450` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SchedulingBookingsRepository.findPaymentStatesForBookings | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:358` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SchedulingBookingsRepository.findBookings | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:460` |
| `scheduling.booking_reschedules` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SchedulingBookingsRepository.latestRescheduleOrigins | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1034` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | No | `string` | — |
| `resourceId` | query | No | `string` | — |
| `from` | query | No | `string` | Instante ISO 8601 |
| `to` | query | No | `string` | Instante ISO 8601 |
| `includeCancelled` | query | No | `string` | Incluye las canceladas y no-show (por defecto, no) |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchBookingsResponseDto>` · DTO `SearchBookingsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BookingItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:391` |
| `items[].paymentState` | `PaymentStateDto` | No | — | — | El estado de pago, si alguien lo marcó (TAREA-13 punto 5). **Se omite cuando no hay marca**, y no viaja como «pendiente de pago»: pendiente es una afirmación que alguien firmó, la ausencia es que del pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`. Viene en la misma consulta que la página, no una por fila. | `src/modules/scheduling/dto/scheduling-read.dto.ts:206` |
| `items[].paymentState.state` | `string` | No | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1037` |
| `items[].paymentState.label` | `string` | No | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1041` |
| `items[].paymentState.conceptId` | `string` | No | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1045` |
| `items[].paymentState.insuranceUsed` | `boolean` | No | — | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1048` |
| `items[].paymentState.markedByUserId` | `string` | No | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1052` |
| `items[].paymentState.markedAt` | `string` | No | formato date-time | — | Cuándo. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1056` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:212` |
| `items[].patientProfileId` | `string` | No | formato uuid | — | Identificador asociado a patient profile. | `src/modules/scheduling/dto/scheduling-read.dto.ts:218` |
| `items[].resourceId` | `string` | No | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/dto/scheduling-read.dto.ts:224` |
| `items[].bookableSlotId` | `string` | No | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/dto/scheduling-read.dto.ts:230` |
| `items[].appointmentId` | `string` | No | formato uuid; admite null | — | Cita clínica que respalda la reserva. Es el valor que acepta POST /clinical/encounters/check-in en su `appointmentId`. | `src/modules/scheduling/dto/scheduling-read.dto.ts:252` |
| `items[].startAt` | `string` | No | formato date-time; admite null | — | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `src/modules/scheduling/dto/scheduling-read.dto.ts:264` |
| `items[].endAt` | `string` | No | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:270` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:276` |
| `items[].serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:282` |
| `items[].bookingChannelConceptId` | `string` | No | formato uuid | — | Identificador asociado a booking channel concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:288` |
| `items[].typeConceptId` | `string` | No | formato uuid | — | Qué clase de actividad es: consulta, procedimiento, control… Vive en `clinical.appointments.type_concept_id` y viaja acá porque la agenda del día pinta cada bloque según su tipología —el pedido del propietario habla de «TURNOS, OPERACIONES, ETC.»— y colorear por algo que la respuesta no trae es imposible. **Es un identificador de concepto, no un enum.** El catálogo de tipologías lo define el propietario (P-12-2) y todavía no está publicado: quien lo consuma hoy puede agrupar por id, no traducirlo a un nombre. Se omite cuando la cita no tiene contraparte clínica —una reserva que nunca llegó a confirmarse no crea `clinical.appointments`— o cuando la tiene y no declara tipo. Omitido, no vacío: `null` diría «no tiene tipo», que es una afirmación distinta. | `src/modules/scheduling/dto/scheduling-read.dto.ts:308` |
| `items[].confirmedAt` | `string` | No | formato date-time | — | Valor de confirmed at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:314` |
| `items[].checkedInAt` | `string` | No | formato date-time | — | Valor de checked in at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:320` |
| `items[].reasonText` | `string` | No | — | — | Valor de reason text mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:326` |
| `items[].patientName` | `string` | No | — | — | Nombre del paciente. Viaja con la **misma regla que el motivo de consulta**: lo ve el titular y el profesional que atiende en esa agenda, y no la vista de la organización. El médico necesita saber a quién espera —la agenda del día sin nombres es una lista de identificadores— y la organización ya opera con el perfil. | `src/modules/scheduling/dto/scheduling-read.dto.ts:337` |
| `items[].rescheduledFrom` | `string` | No | formato date-time | — | De cuándo se movió, si la cita se reprogramó. Ausente cuando nunca se movió — que es distinto de «se movió y no sé desde cuándo». Es el instante ORIGINAL, no el id del cupo: la tarjeta dice «reprogramada desde el 20/08 a las 15:30», y resolverlo en la pantalla costaría una petición por cita para pintar una línea. | `src/modules/scheduling/dto/scheduling-read.dto.ts:348` |
| `items[].statusReason` | `BookingStatusReasonDto` | No | — | — | Motivo del último cambio que lo exigía (cancelación, rechazo o reprogramación), con quién lo hizo y cuándo. | `src/modules/scheduling/dto/scheduling-read.dto.ts:365` |
| `items[].statusReason.reasonText` | `string` | No | — | — | Lo que escribió quien hizo el cambio | `src/modules/scheduling/dto/scheduling-read.dto.ts:139` |
| `items[].statusReason.actorKind` | `string` | No | valores: PATIENT, PROVIDER | — | Desde qué lado se hizo el cambio. Permite decir «tu médico canceló» en vez de «la cita fue cancelada». | `src/modules/scheduling/dto/scheduling-read.dto.ts:149` |
| `items[].statusReason.toStateConceptId` | `string` | No | formato uuid | — | Estado al que llevó el cambio, si fue una transición | `src/modules/scheduling/dto/scheduling-read.dto.ts:158` |
| `items[].statusReason.changedAt` | `string` | No | formato date-time | — | Valor de changed at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:164` |
| `items[].delayNotice` | `BookingDelayNoticeDto` | No | — | — | Última demora informada por el profesional, con sus minutos y su mensaje. | `src/modules/scheduling/dto/scheduling-read.dto.ts:376` |
| `items[].delayNotice.delayMinutes` | `number` | No | — | — | Minutos de demora informados | `src/modules/scheduling/dto/scheduling-read.dto.ts:179` |
| `items[].delayNotice.message` | `string` | No | — | — | Mensaje del profesional | `src/modules/scheduling/dto/scheduling-read.dto.ts:185` |
| `items[].delayNotice.announcedAt` | `string` | No | formato date-time | — | Cuándo se informó. | `src/modules/scheduling/dto/scheduling-read.dto.ts:191` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/scheduling/dto/scheduling-read.dto.ts:382` |
| `count` | `number` | Sí | — | — | Número de elementos devueltos. | `src/modules/scheduling/dto/scheduling-read.dto.ts:397` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/scheduling/dto/scheduling-read.dto.ts:403` |
| `truncated` | `boolean` | Sí | — | — | Si había más citas que el tope pedido | `src/modules/scheduling/dto/scheduling-read.dto.ts:411` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique al menos patientProfileId o resourceId para listar citas; PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:270` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:162` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:211` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /scheduling/bookings/{id}

- **Origen:** CONTRATO
- **Nombre:** UC-41-15: consulta una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.getBooking` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:128`

### Qué es y para qué sirve (negocio)

UC-41-15: consulta una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings/{id}` la atiende `SchedulingBookingsController.getBooking` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:128). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingBookingsService.getBookingById`. Lee audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.booking_reschedules, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:128` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById | `src/modules/scheduling/services/scheduling-bookings.service.ts:2545` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → AppointmentsRepository.findTypesByIds | `src/modules/clinical/repositories/appointments.repository.ts:125` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → SchedulingBookingsRepository.findBookingById | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:382` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:214` |
| `scheduling.booking_reschedules` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → SchedulingBookingsRepository.latestRescheduleOrigins | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1034` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BookingItemDto>` · DTO `BookingItemDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `paymentState` | `PaymentStateDto` | No | — | — | El estado de pago, si alguien lo marcó (TAREA-13 punto 5). **Se omite cuando no hay marca**, y no viaja como «pendiente de pago»: pendiente es una afirmación que alguien firmó, la ausencia es que del pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`. Viene en la misma consulta que la página, no una por fila. | `src/modules/scheduling/dto/scheduling-read.dto.ts:206` |
| `paymentState.state` | `string` | No | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1037` |
| `paymentState.label` | `string` | No | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1041` |
| `paymentState.conceptId` | `string` | No | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1045` |
| `paymentState.insuranceUsed` | `boolean` | No | — | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1048` |
| `paymentState.markedByUserId` | `string` | No | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1052` |
| `paymentState.markedAt` | `string` | No | formato date-time | — | Cuándo. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1056` |
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:212` |
| `patientProfileId` | `string` | No | formato uuid | — | Identificador asociado a patient profile. | `src/modules/scheduling/dto/scheduling-read.dto.ts:218` |
| `resourceId` | `string` | No | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/dto/scheduling-read.dto.ts:224` |
| `bookableSlotId` | `string` | No | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/dto/scheduling-read.dto.ts:230` |
| `appointmentId` | `string` | No | formato uuid; admite null | — | Cita clínica que respalda la reserva. Es el valor que acepta POST /clinical/encounters/check-in en su `appointmentId`. | `src/modules/scheduling/dto/scheduling-read.dto.ts:252` |
| `startAt` | `string` | No | formato date-time; admite null | — | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `src/modules/scheduling/dto/scheduling-read.dto.ts:264` |
| `endAt` | `string` | No | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:270` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:276` |
| `serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:282` |
| `bookingChannelConceptId` | `string` | No | formato uuid | — | Identificador asociado a booking channel concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:288` |
| `typeConceptId` | `string` | No | formato uuid | — | Qué clase de actividad es: consulta, procedimiento, control… Vive en `clinical.appointments.type_concept_id` y viaja acá porque la agenda del día pinta cada bloque según su tipología —el pedido del propietario habla de «TURNOS, OPERACIONES, ETC.»— y colorear por algo que la respuesta no trae es imposible. **Es un identificador de concepto, no un enum.** El catálogo de tipologías lo define el propietario (P-12-2) y todavía no está publicado: quien lo consuma hoy puede agrupar por id, no traducirlo a un nombre. Se omite cuando la cita no tiene contraparte clínica —una reserva que nunca llegó a confirmarse no crea `clinical.appointments`— o cuando la tiene y no declara tipo. Omitido, no vacío: `null` diría «no tiene tipo», que es una afirmación distinta. | `src/modules/scheduling/dto/scheduling-read.dto.ts:308` |
| `confirmedAt` | `string` | No | formato date-time | — | Valor de confirmed at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:314` |
| `checkedInAt` | `string` | No | formato date-time | — | Valor de checked in at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:320` |
| `reasonText` | `string` | No | — | — | Valor de reason text mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:326` |
| `patientName` | `string` | No | — | — | Nombre del paciente. Viaja con la **misma regla que el motivo de consulta**: lo ve el titular y el profesional que atiende en esa agenda, y no la vista de la organización. El médico necesita saber a quién espera —la agenda del día sin nombres es una lista de identificadores— y la organización ya opera con el perfil. | `src/modules/scheduling/dto/scheduling-read.dto.ts:337` |
| `rescheduledFrom` | `string` | No | formato date-time | — | De cuándo se movió, si la cita se reprogramó. Ausente cuando nunca se movió — que es distinto de «se movió y no sé desde cuándo». Es el instante ORIGINAL, no el id del cupo: la tarjeta dice «reprogramada desde el 20/08 a las 15:30», y resolverlo en la pantalla costaría una petición por cita para pintar una línea. | `src/modules/scheduling/dto/scheduling-read.dto.ts:348` |
| `statusReason` | `BookingStatusReasonDto` | No | — | — | Motivo del último cambio que lo exigía (cancelación, rechazo o reprogramación), con quién lo hizo y cuándo. | `src/modules/scheduling/dto/scheduling-read.dto.ts:365` |
| `statusReason.reasonText` | `string` | No | — | — | Lo que escribió quien hizo el cambio | `src/modules/scheduling/dto/scheduling-read.dto.ts:139` |
| `statusReason.actorKind` | `string` | No | valores: PATIENT, PROVIDER | — | Desde qué lado se hizo el cambio. Permite decir «tu médico canceló» en vez de «la cita fue cancelada». | `src/modules/scheduling/dto/scheduling-read.dto.ts:149` |
| `statusReason.toStateConceptId` | `string` | No | formato uuid | — | Estado al que llevó el cambio, si fue una transición | `src/modules/scheduling/dto/scheduling-read.dto.ts:158` |
| `statusReason.changedAt` | `string` | No | formato date-time | — | Valor de changed at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:164` |
| `delayNotice` | `BookingDelayNoticeDto` | No | — | — | Última demora informada por el profesional, con sus minutos y su mensaje. | `src/modules/scheduling/dto/scheduling-read.dto.ts:376` |
| `delayNotice.delayMinutes` | `number` | No | — | — | Minutos de demora informados | `src/modules/scheduling/dto/scheduling-read.dto.ts:179` |
| `delayNotice.message` | `string` | No | — | — | Mensaje del profesional | `src/modules/scheduling/dto/scheduling-read.dto.ts:185` |
| `delayNotice.announcedAt` | `string` | No | formato date-time | — | Cuándo se informó. | `src/modules/scheduling/dto/scheduling-read.dto.ts:191` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/scheduling/dto/scheduling-read.dto.ts:382` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:358` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:186` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /scheduling/bookings/{id}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar la solicitud de cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.accept` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:144`

### Qué es y para qué sirve (negocio)

Aceptar la solicitud de cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/accept` la atiende `SchedulingBookingsController.accept` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:144). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `AcceptBookingDto` (1 campo, 0 obligatorios). Delega en `SchedulingBookingsService.accept`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.appointment_reminders, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, clinical.appointments, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, clinical.appointments, iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:144` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:144` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `clinical.appointments` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.sincronizarCitaClinica | `src/modules/scheduling/services/scheduling-bookings.service.ts:2340` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.sincronizarCitaClinica → AppointmentsRepository.findById | `src/modules/clinical/repositories/appointments.repository.ts:101` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.assertVinculoVigente → PractitionerAffiliationGateService.evaluar → PractitionerAffiliationGateService.tenantDeCadaSede | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:163` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.assertVinculoVigente → PractitionerAffiliationGateService.evaluar → PractitionerAffiliationGateService.tenantDeCadaSede | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:163` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1014` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.assertVinculoVigente → PractitionerAffiliationGateService.evaluar | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:88` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept | `src/modules/scheduling/services/scheduling-bookings.service.ts:1589` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.cargarParaOperar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1187` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingProfessionalTimeService.compromisos → SchedulingProfessionalTimeService.tiempoOcupado → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:977` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.cancelarPendientesQueChocan | `src/modules/scheduling/services/scheduling-bookings.service.ts:1741` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:214` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingBookingsService.cancelarPendientesQueChocan → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1114` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AcceptBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reminderOffsetsMinutes` | `array<number>` | No | mínimo 0 | `@IsOptional()` `@IsArray()` `@IsInt({ each: true })` `@Min(0, { each: true })` | Minutos de antelación de los recordatorios a programar | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:236` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reminderOffsetsMinutes": [
    1440,
    120
  ]
}
```

</details>

### Respuesta — `Promise<BookingDecisionResponseDto>` · DTO `BookingDecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:272` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:281` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:287` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:304` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Tu vínculo con esta organización todavía está pendiente de aprobación, así que todavía no podés comprometer turnos suyos. / Tu vínculo con esta organización ya…; PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: El profesional ya tiene {quien} de {horaLocal( primero.startAt, p…} a {horaLocal( primero.endAt, pri…}{primero.resourceName ? ` en «…}. No puede estar en dos l… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:369` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:196` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /scheduling/bookings/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar la cita y liberar el cupo
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.cancel` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:327`

### Qué es y para qué sirve (negocio)

Cancelar la cita y liberar el cupo. Caso de uso UC-41-09: Cancelar (con cargo por no-show). Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/cancel` la atiende `SchedulingBookingsController.cancel` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:327). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Valida el cuerpo como `CancelBookingDto` (3 campos, 2 obligatorios). Delega en `SchedulingBookingsService.cancel`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:327` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:327` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:278` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar | `src/modules/scheduling/services/scheduling-bookings.service.ts:1371` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar | `src/modules/scheduling/services/scheduling-bookings.service.ts:1383` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1114` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:366` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:319` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cancelledBy` | `string` | Sí | valores: PATIENT, PROVIDER | `@IsIn(['PATIENT', 'PROVIDER'])` | Quién origina la cancelación | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:368` |
| `isNoShow` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si la cita se marca como inasistencia (aplica el cargo de la política) | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:380` |
| `reasonText` | `string` | Sí | longitud mínima 5; longitud máxima 500 | `@IsString()` `@MinLength(MIN_REASON_LENGTH)` `@MaxLength(MAX_REASON_LENGTH)` | Motivo de la cancelación. Obligatorio: se le muestra a la otra parte en el detalle de la cita. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:398` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "cancelledBy": "PATIENT",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "cancelledBy": "PATIENT",
  "isNoShow": false,
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CancelBookingResponseDto>` · DTO `CancelBookingResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:409` |
| `feeAmount` | `string` | No | — | — | Cargo aplicado, si la política lo contempla | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:418` |
| `capacityReleased` | `boolean` | Sí | — | — | Cupo devuelto al slot | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:424` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: Podés cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no podés asistir, comunicate con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:347` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:260` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:147` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:228` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-09`
- Ciclo de vida de una cita — etapa `A2`

---

## 8. POST /scheduling/bookings/{id}/check-in

- **Origen:** CONTRATO
- **Nombre:** Registrar la llegada del paciente
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.checkIn` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:344`

### Qué es y para qué sirve (negocio)

Registrar la llegada del paciente. Caso de uso UC-41-10: Check-in. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/check-in` la atiende `SchedulingBookingsController.checkIn` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:344). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingBookingsService.checkIn`. Crea filas en audit.appointment_bookings_history. Actualiza audit.appointment_bookings_history, scheduling.appointment_bookings. Lee audit.appointment_bookings_history, scheduling.appointment_bookings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:344` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:344` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn | `src/modules/scheduling/services/scheduling-bookings.service.ts:2098` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CheckInResponseDto>` · DTO `CheckInResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:435` |
| `checkedInAt` | `string` | Sí | formato date-time | — | Valor de checked in at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:441` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:237` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-10`
- Ciclo de vida de una cita — etapa `P3`

---

## 9. POST /scheduling/bookings/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Completar la atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.complete` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:295`

### Qué es y para qué sirve (negocio)

Completar la atención. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/complete` la atiende `SchedulingBookingsController.complete` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:295). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingBookingsService.complete`. Crea filas en audit.appointment_bookings_history. Actualiza audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings. Lee audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:295` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:295` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `clinical.appointments` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → SchedulingBookingsService.sincronizarCitaClinica | `src/modules/scheduling/services/scheduling-bookings.service.ts:2340` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → SchedulingBookingsService.sincronizarCitaClinica → AppointmentsRepository.findById | `src/modules/clinical/repositories/appointments.repository.ts:101` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.complete → SchedulingBookingsService.complete | `src/modules/scheduling/services/scheduling-bookings.service.ts:2048` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → SchedulingBookingsService.cargarParaOperar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → SchedulingBookingsService.cargarParaOperar → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BookingDecisionResponseDto>` · DTO `BookingDecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:272` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:281` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:287` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:304` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /scheduling/bookings/{id}/delay

- **Origen:** CONTRATO
- **Nombre:** Informar una demora sobre una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.delay` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:362`

### Qué es y para qué sirve (negocio)

Informar una demora sobre una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/delay` la atiende `SchedulingBookingsController.delay` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:362). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `DelayBookingDto` (2 campos, 1 obligatorio). Delega en `SchedulingDelayService.delayBooking`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza audit.appointment_bookings_history, messaging.notification_requests. Lee audit.appointment_bookings_history, iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:362` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:362` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.anotarDemora | `src/modules/scheduling/services/scheduling-delay.service.ts:205` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.anotarDemora | `src/modules/scheduling/services/scheduling-delay.service.ts:205` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.anotarDemora | `src/modules/scheduling/services/scheduling-delay.service.ts:205` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:278` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.resolverDestinatario → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:216` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:219` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:293` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DelayBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `delayMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(MIN_DELAY_MINUTES)` | Minutos de demora estimados | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:720` |
| `message` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(MAX_DELAY_MESSAGE_LENGTH)` | Mensaje del profesional para el paciente | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:733` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "delayMinutes": 20
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "delayMinutes": 20,
  "message": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<DelayNoticeResponseDto>` · DTO `DelayNoticeResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `notified` | `number` | Sí | — | — | Pacientes que recibieron el aviso | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:799` |
| `affected` | `number` | Sí | — | — | Citas alcanzadas por la demora | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:805` |
| `bookingIds` | `array<string>` | Sí | formato uuid | — | Las citas alcanzadas, para que la pantalla pueda decir cuáles fueron. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:811` |
| `detail` | `string` | Sí | — | — | Qué pasó, en una frase. Incluye por qué un aviso no llegó cuando no llegó. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:817` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una demora mayor a cuatro horas se resuelve reprogramando el turno, no avisando |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:203` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /scheduling/bookings/{id}/payment-state

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Lee el estado de pago de la cita. Devuelve `null` cuando nadie lo marcó todavía, que **no** es lo mismo que «pendiente de pago»: pendiente es algo que alguien firmó.
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.getPaymentState` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:256`

### Qué es y para qué sirve (negocio)

Lee el estado de pago de la cita. Devuelve `null` cuando nadie lo marcó todavía, que **no** es lo mismo que «pendiente de pago»: pendiente es algo que alguien firmó. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings/{id}/payment-state` la atiende `SchedulingBookingsController.getPaymentState` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:256). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingBookingsService.getPaymentState`. Lee scheduling.appointment_bookings, scheduling.appointment_payment_states, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:256` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:256` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.getPaymentState → SchedulingBookingsService.getPaymentState → SchedulingBookingsService.cargarParaOperar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | SchedulingBookingsController.getPaymentState → SchedulingBookingsService.getPaymentState → SchedulingBookingsRepository.findPaymentState | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:372` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.getPaymentState → SchedulingBookingsService.getPaymentState → SchedulingBookingsService.cargarParaOperar → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PaymentStateDto | null>` · DTO `PaymentStateDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1037` |
| `label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1041` |
| `conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1045` |
| `insuranceUsed` | `boolean` | Sí | — | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1048` |
| `markedByUserId` | `string` | Sí | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1052` |
| `markedAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1056` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. PUT /scheduling/bookings/{id}/payment-state

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Marca el estado de pago de la cita — TAREA-13, punto 5. `PUT` y no `POST` porque es **idempotente**: hay una fila por cita y volver a mandar el mismo estado deja exactamente el mismo resultado. Las otras operaciones de este controlador son `POST` porque cada una es un acto distinto —aceptar dos veces no es aceptar—; marcar un pago dos veces sí. Quién puede: los mismos que responden la solicitud. **El paciente no**: decir que una cita está pagada es una afirmación del prestador, y dejársela hacer a quien debe el dinero sería confiar en el campo equivocado.
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.setPaymentState` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:234`

### Qué es y para qué sirve (negocio)

Marca el estado de pago de la cita — TAREA-13, punto 5. `PUT` y no `POST` porque es **idempotente**: hay una fila por cita y volver a mandar el mismo estado deja exactamente el mismo resultado. Las otras operaciones de este controlador son `POST` porque cada una es un acto distinto —aceptar dos veces no es aceptar—; marcar un pago dos veces sí. Quién puede: los mismos que responden la solicitud. **El paciente no**: decir que una cita está pagada es una afirmación del prestador, y dejársela hacer a quien debe el dinero sería confiar en el campo equivocado. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /scheduling/bookings/{id}/payment-state` la atiende `SchedulingBookingsController.setPaymentState` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:234). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `SetPaymentStateDto` (2 campos, 1 obligatorio). Delega en `SchedulingBookingsService.setPaymentState`. Crea filas en audit.appointment_bookings_history, scheduling.appointment_payment_states. Actualiza audit.appointment_bookings_history, scheduling.appointment_payment_states. Lee audit.appointment_bookings_history, scheduling.appointment_bookings, scheduling.appointment_payment_states, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:234` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:234` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState | `src/modules/scheduling/services/scheduling-bookings.service.ts:1507` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState | `src/modules/scheduling/services/scheduling-bookings.service.ts:1507` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState | `src/modules/scheduling/services/scheduling-bookings.service.ts:1507` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState → SchedulingBookingsService.cargarParaOperar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.appointment_payment_states` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState | `src/modules/scheduling/services/scheduling-bookings.service.ts:1482` |
| `scheduling.appointment_payment_states` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState | `src/modules/scheduling/services/scheduling-bookings.service.ts:1489` |
| `scheduling.appointment_payment_states` | ESCRIBE | GUARDA | POR_TIPO | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState | `src/modules/scheduling/services/scheduling-bookings.service.ts:1501` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState → SchedulingBookingsRepository.findPaymentStateForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:332` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState → SchedulingBookingsService.cargarParaOperar → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SetPaymentStateDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | valores: PENDING, PARTIALLY_PAID, PAID | `@IsIn(PAYMENT_STATES)` | Estado de pago de la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1008` |
| `insuranceUsed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca de que la cita se cubrió con seguro | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1024` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "state": "PENDING"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "state": "PENDING",
  "insuranceUsed": true
}
```

</details>

### Respuesta — `Promise<PaymentStateDto>` · DTO `PaymentStateDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1037` |
| `label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1041` |
| `conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1045` |
| `insuranceUsed` | `boolean` | Sí | — | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1048` |
| `markedByUserId` | `string` | Sí | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1052` |
| `markedAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:1056` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /scheduling/bookings/{id}/propose-schedule

- **Origen:** CONTRATO
- **Nombre:** Proponer otro horario para la solicitud
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.proposeSchedule` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:190`

### Qué es y para qué sirve (negocio)

Proponer otro horario para la solicitud. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/propose-schedule` la atiende `SchedulingBookingsController.proposeSchedule` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:190). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `ProposeScheduleDto` (2 campos, 2 obligatorios). Delega en `SchedulingBookingsService.proposeSchedule`. Crea filas en audit.appointment_bookings_history, scheduling.booking_reschedules. Actualiza audit.appointment_bookings_history, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:190` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:190` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule | `src/modules/scheduling/services/scheduling-bookings.service.ts:1927` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → SchedulingBookingsService.cargarParaOperar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule | `src/modules/scheduling/services/scheduling-bookings.service.ts:1915` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.booking_reschedules` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → SchedulingBookingsRepository.recordReschedule | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:637` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → SchedulingBookingsService.cargarParaOperar → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ProposeScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proposedSlotId` | `string` | Sí | formato uuid | `@IsUUID()` | Cupo propuesto | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:660` |
| `reasonText` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Motivo de la propuesta | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:666` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "proposedSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "proposedSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ProposeScheduleResponseDto>` · DTO `ProposeScheduleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Solicitud sobre la que se propuso. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:673` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó (concept id): sigue pendiente. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:677` |
| `fromSlotId` | `string` | Sí | formato uuid | — | Cupo que se liberó. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:681` |
| `toSlotId` | `string` | Sí | formato uuid | — | Cupo que quedó tomado. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:685` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Cupo propuesto no encontrado |
| 409 | `CONFLICT` | ConflictException: El cupo propuesto no tiene lugar |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se opera así sobre una solicitud pendiente; PreconditionFailedException: El horario propuesto es el que ya tiene la solicitud; PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /scheduling/bookings/{id}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar la solicitud de cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.reject` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:206`

### Qué es y para qué sirve (negocio)

Rechazar la solicitud de cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/reject` la atiende `SchedulingBookingsController.reject` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:206). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `RejectBookingDto` (1 campo, 1 obligatorio). Delega en `SchedulingBookingsService.reject`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:206` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:206` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:278` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar | `src/modules/scheduling/services/scheduling-bookings.service.ts:1371` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar | `src/modules/scheduling/services/scheduling-bookings.service.ts:1383` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1114` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:366` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → SchedulingBookingsService.cancelarYAvisar → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:319` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | longitud mínima 5; longitud máxima 500 | `@IsString()` `@MinLength(MIN_REASON_LENGTH)` `@MaxLength(MAX_REASON_LENGTH)` | Motivo del rechazo. Obligatorio: el paciente lo ve en el detalle de su turno. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:257` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CancelBookingResponseDto>` · DTO `CancelBookingResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:409` |
| `feeAmount` | `string` | No | — | — | Cargo aplicado, si la política lo contempla | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:418` |
| `capacityReleased` | `boolean` | Sí | — | — | Cupo devuelto al slot | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:424` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: Podés cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no podés asistir, comunicate con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /scheduling/bookings/{id}/reminders

- **Origen:** CONTRATO
- **Nombre:** Programar recordatorios para la cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.scheduleReminders` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:379`

### Qué es y para qué sirve (negocio)

Programar recordatorios para la cita. Caso de uso UC-41-13: Programar recordatorios. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/reminders` la atiende `SchedulingBookingsController.scheduleReminders` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:379). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT. Valida el cuerpo como `ScheduleRemindersDto` (2 campos, 1 obligatorio). Delega en `SchedulingWaitlistService.scheduleReminders`. Crea filas en scheduling.appointment_reminders. Lee scheduling.appointment_bookings, scheduling.bookable_slots.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:379` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:379` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.scheduleReminders → SchedulingWaitlistService.scheduleReminders → PostgresWaitlistAdapter.findBookingScheduleForUpdate → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.scheduleReminders → SchedulingWaitlistService.scheduleReminders → PostgresWaitlistAdapter.scheduleReminders → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1187` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.scheduleReminders → SchedulingWaitlistService.scheduleReminders → PostgresWaitlistAdapter.findBookingScheduleForUpdate → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:214` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ScheduleRemindersDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `offsetsMinutes` | `array<number>` | Sí | mínimo 0 | `@IsArray()` `@IsInt({ each: true })` `@Min(0, { each: true })` | Minutos de antelación de cada recordatorio | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:539` |
| `channel` | `string` | No | valores: SMS, EMAIL | `@IsOptional()` `@IsIn(['SMS', 'EMAIL'])` | Canal de envío | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:551` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "offsetsMinutes": [
    1440,
    120
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "offsetsMinutes": [
    1440,
    120
  ],
  "channel": "SMS"
}
```

</details>

### Respuesta — `Promise<ScheduleRemindersResponseDto>` · DTO `ScheduleRemindersResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:562` |
| `scheduled` | `number` | Sí | — | — | Valor de scheduled mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:568` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:247` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-13`

---

## 16. POST /scheduling/bookings/{id}/request-info

- **Origen:** CONTRATO
- **Nombre:** Pedir documentación u orden médica antes de aceptar
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.requestInfo` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:167`

### Qué es y para qué sirve (negocio)

Pedir documentación u orden médica antes de aceptar. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/request-info` la atiende `SchedulingBookingsController.requestInfo` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:167). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `RequestBookingInfoDto` (2 campos, 2 obligatorios). Delega en `SchedulingBookingsService.requestInfo`. Crea filas en audit.appointment_bookings_history. Actualiza audit.appointment_bookings_history, scheduling.appointment_bookings. Lee audit.appointment_bookings_history, scheduling.appointment_bookings, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:167` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo | `src/modules/scheduling/services/scheduling-bookings.service.ts:1828` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → SchedulingBookingsService.cargarParaOperar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → SchedulingBookingsService.cargarParaOperar → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RequestBookingInfoDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `infoRequested` | `string` | Sí | valores: DOCUMENTATION, MEDICAL_ORDER, PREPARATION | `@IsIn(BOOKING_INFO_REQUESTS as readonly string[])` | Qué falta antes de poder aceptar | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:641` |
| `reasonText` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Mensaje para el paciente | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:652` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "infoRequested": "DOCUMENTATION",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "infoRequested": "DOCUMENTATION",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<BookingDecisionResponseDto>` · DTO `BookingDecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:272` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:281` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:287` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:304` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se opera así sobre una solicitud pendiente; PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /scheduling/bookings/{id}/reschedule

- **Origen:** CONTRATO
- **Nombre:** Reprogramar la cita a otro slot
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.reschedule` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:311`

### Qué es y para qué sirve (negocio)

Reprogramar la cita a otro slot. Caso de uso UC-41-08: Reprogramar. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/reschedule` la atiende `SchedulingBookingsController.reschedule` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:311). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Valida el cuerpo como `RescheduleBookingDto` (2 campos, 2 obligatorios). Delega en `SchedulingBookingsService.reschedule`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.booking_reschedules. Actualiza audit.appointment_bookings_history, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:311` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:311` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule | `src/modules/scheduling/services/scheduling-bookings.service.ts:1188` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule | `src/modules/scheduling/services/scheduling-bookings.service.ts:1188` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule | `src/modules/scheduling/services/scheduling-bookings.service.ts:1188` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:278` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule | `src/modules/scheduling/services/scheduling-bookings.service.ts:1174` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule | `src/modules/scheduling/services/scheduling-bookings.service.ts:1162` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.booking_reschedules` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsRepository.recordReschedule | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:637` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → SchedulingBookingsService.avisarCambio → SchedulingNoticeRepository.findResourceAccount | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:319` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RescheduleBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `toSlotId` | `string` | Sí | formato uuid | `@IsUUID()` | Slot destino | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:314` |
| `reasonText` | `string` | Sí | longitud mínima 5; longitud máxima 500 | `@IsString()` `@MinLength(MIN_REASON_LENGTH)` `@MaxLength(MAX_REASON_LENGTH)` | Motivo del cambio. Obligatorio: se le muestra a la otra parte en el detalle de la cita. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:332` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "toSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "toSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RescheduleResponseDto>` · DTO `RescheduleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:343` |
| `fromSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a from slot. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:349` |
| `toSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a to slot. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:355` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Slot destino no encontrado |
| 409 | `CONFLICT` | ConflictException: El slot destino no tiene cupos |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se reprograma una cita vigente; PreconditionFailedException: El slot destino es el mismo que el actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:265` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:218` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-08`
- Ciclo de vida de una cita — etapa `A1`

---

## 18. POST /scheduling/bookings/{id}/start

- **Origen:** CONTRATO
- **Nombre:** Iniciar la atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.start` — `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:276`

### Qué es y para qué sirve (negocio)

Iniciar la atención. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/start` la atiende `SchedulingBookingsController.start` (src/modules/scheduling/controllers/scheduling-bookings.controller.ts:276). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingBookingsService.start`. Crea filas en audit.appointment_bookings_history. Actualiza audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings. Lee audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:276` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.start → SchedulingBookingsService.start → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.start → SchedulingBookingsService.start → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.start → SchedulingBookingsService.start → SchedulingBookingsService.recordTransition | `src/modules/scheduling/services/scheduling-bookings.service.ts:2147` |
| `clinical.appointments` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.start → SchedulingBookingsService.start → SchedulingBookingsService.sincronizarCitaClinica | `src/modules/scheduling/services/scheduling-bookings.service.ts:2340` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.start → SchedulingBookingsService.start → SchedulingBookingsService.sincronizarCitaClinica → AppointmentsRepository.findById | `src/modules/clinical/repositories/appointments.repository.ts:101` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.start → SchedulingBookingsService.start | `src/modules/scheduling/services/scheduling-bookings.service.ts:2001` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.start → SchedulingBookingsService.start → SchedulingBookingsService.cargarParaOperar → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:313` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.start → SchedulingBookingsService.start → SchedulingBookingsService.cargarParaOperar → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BookingDecisionResponseDto>` · DTO `BookingDecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:272` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:281` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:287` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:304` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /scheduling/confirmation-rules

- **Origen:** CONTRATO
- **Nombre:** Listar las reglas de un tenant
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.list` — `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:67`

### Qué es y para qué sirve (negocio)

Listar las reglas de un tenant. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/confirmation-rules` la atiende `SchedulingConfirmationController.list` (src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:67). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Delega en `SchedulingConfirmationService.listRules`. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.list → SchedulingConfirmationService.listRules → SchedulingConfirmationRepository.findRulesByTenant | `src/modules/scheduling/repositories/scheduling-confirmation.repository.ts:113` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | query | Sí | `string` | — |
| `includeDisabled` | query | No | `boolean` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmationRuleResponseDto[]>` · DTO `ConfirmationRuleResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:149` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /scheduling/confirmation-rules

- **Origen:** CONTRATO
- **Nombre:** Crear una regla de confirmación
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.create` — `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:49`

### Qué es y para qué sirve (negocio)

Crear una regla de confirmación. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules` la atiende `SchedulingConfirmationController.create` (src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:49). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Valida el cuerpo como `CreateConfirmationRuleDto` (8 campos, 5 obligatorios). Delega en `SchedulingConfirmationService.createRule`. Crea filas en scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | ESCRIBE | CREA | DIRECTA | SchedulingConfirmationController.create → SchedulingConfirmationService.createRule → SchedulingConfirmationRepository.createRule | `src/modules/scheduling/repositories/scheduling-confirmation.repository.ts:63` |

### Cuerpo — DTO `CreateConfirmationRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:36` |
| `scope` | `string` | Sí | valores: TENANT, PRACTICE, RESOURCE, SERVICE | `@IsIn(RULE_SCOPES as readonly string[])` | Tipo de alcance de la regla | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:46` |
| `scopeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Alcance concreto (practice/resource/service). Omitido = todo el tipo. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:58` |
| `priority` | `number` | No | — | `@IsOptional()` `@IsInt()` | Menor número = mayor prioridad | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:69` |
| `effectiveFrom` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:76` |
| `effectiveTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:84` |
| `condition` | `object` | Sí | — | `@IsObject()` | Condición determinista { field, op, value } o combinador all/any/not. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:95` |
| `decision` | `string` | Sí | valores: AUTO_CONFIRM, AUTO_REJECT, MANUAL_REVIEW | `@IsIn(RULE_DECISIONS as readonly string[])` | Decisión de la regla | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:102` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scope": "TENANT",
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "condition": {},
  "decision": "AUTO_CONFIRM"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scope": "TENANT",
  "scopeId": "00000000-0000-4000-8000-000000000001",
  "priority": 100,
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z",
  "condition": {},
  "decision": "AUTO_CONFIRM"
}
```

</details>

### Respuesta — `Promise<ConfirmationRuleResponseDto>` · DTO `ConfirmationRuleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:149` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /scheduling/confirmation-rules/{id}/activate

- **Origen:** CONTRATO
- **Nombre:** Reactivar una regla desactivada
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.activate` — `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:86`

### Qué es y para qué sirve (negocio)

Reactivar una regla desactivada. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules/{id}/activate` la atiende `SchedulingConfirmationController.activate` (src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:86). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Delega en `SchedulingConfirmationService.activateRule`. Actualiza scheduling.booking_confirmation_rules. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:86` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingConfirmationController.activate → SchedulingConfirmationService.activateRule → SchedulingConfirmationService.setEnabled | `src/modules/scheduling/services/scheduling-confirmation.service.ts:151` |
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.activate → SchedulingConfirmationService.activateRule → SchedulingConfirmationService.setEnabled → SchedulingConfirmationRepository.findRuleByIdForUpdate | `src/modules/scheduling/repositories/scheduling-confirmation.repository.ts:93` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmationRuleResponseDto>` · DTO `ConfirmationRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:149` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /scheduling/confirmation-rules/{id}/deactivate

- **Origen:** CONTRATO
- **Nombre:** Desactivar una regla (sin borrado duro)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.deactivate` — `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:104`

### Qué es y para qué sirve (negocio)

Desactivar una regla (sin borrado duro). Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules/{id}/deactivate` la atiende `SchedulingConfirmationController.deactivate` (src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:104). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Delega en `SchedulingConfirmationService.deactivateRule`. Actualiza scheduling.booking_confirmation_rules. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:104` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingConfirmationController.deactivate → SchedulingConfirmationService.deactivateRule → SchedulingConfirmationService.setEnabled | `src/modules/scheduling/services/scheduling-confirmation.service.ts:151` |
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.deactivate → SchedulingConfirmationService.deactivateRule → SchedulingConfirmationService.setEnabled → SchedulingConfirmationRepository.findRuleByIdForUpdate | `src/modules/scheduling/repositories/scheduling-confirmation.repository.ts:93` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmationRuleResponseDto>` · DTO `ConfirmationRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:149` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /scheduling/confirmation-rules/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar una solicitud de reserva contra las reglas vigentes
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.evaluate` — `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:121`

### Qué es y para qué sirve (negocio)

Evaluar una solicitud de reserva contra las reglas vigentes. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules/evaluate` la atiende `SchedulingConfirmationController.evaluate` (src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:121). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Valida el cuerpo como `EvaluateBookingRequestDto` (5 campos, 2 obligatorios). Delega en `SchedulingConfirmationService.evaluateBookingRequest`. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/controllers/scheduling-confirmation.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.evaluate → SchedulingConfirmationService.evaluateBookingRequest → SchedulingConfirmationRepository.findActiveRules | `src/modules/scheduling/repositories/scheduling-confirmation.repository.ts:130` |

### Cuerpo — DTO `EvaluateBookingRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:159` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Práctica de la solicitud | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:170` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Recurso de la solicitud | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:181` |
| `serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio de la solicitud | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:192` |
| `requestData` | `object` | Sí | — | `@IsObject()` | Datos congelados de la solicitud sobre los que se evalúan las condiciones. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:203` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "requestData": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "requestData": {}
}
```

</details>

### Respuesta — `Promise<EvaluateBookingResultDto>` · DTO `EvaluateBookingResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: AUTO_CONFIRM, AUTO_REJECT, MANUAL_REVIEW | — | Decisión determinista | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:259` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:265` |
| `explanation` | `EvaluationExplanationDto` | Sí | — | — | Valor de explanation mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:271` |
| `explanation.ruleId` | `string` | No | formato uuid | — | Regla aplicada; ausente si ninguna resultó concluyente. | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:215` |
| `explanation.ruleVersion` | `number` | No | — | — | Versión de la regla aplicada | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:221` |
| `explanation.reason` | `string` | Sí | — | — | Motivo de la decisión | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:227` |
| `explanation.variables` | `object` | Sí | — | — | Variables congeladas usadas en la evaluación | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:236` |
| `explanation.evaluatedRuleIds` | `array<string>` | Sí | — | — | Ids de reglas evaluadas antes de concluir | `src/modules/scheduling/dto/scheduling-confirmation.dto.ts:245` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. GET /scheduling/exception-types

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Los motivos de bloqueo que el formulario puede ofrecer (TAREA-11, punto 4). Existe porque el catálogo estaba en la base y **no lo publicaba nadie**: `exception_type_concept_id` es obligatoria y la pantalla no tenía de dónde sacar las opciones, así que en la práctica todo bloqueo nacía con el mismo valor. Es una lectura de catálogo, no de datos de nadie: sin filtro por tenant y abierta a cualquiera que pueda crear una excepción.
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listExceptionTypes` — `src/modules/scheduling/controllers/scheduling.controller.ts:428`

### Qué es y para qué sirve (negocio)

Los motivos de bloqueo que el formulario puede ofrecer (TAREA-11, punto 4). Existe porque el catálogo estaba en la base y **no lo publicaba nadie**: `exception_type_concept_id` es obligatoria y la pantalla no tenía de dónde sacar las opciones, así que en la práctica todo bloqueo nacía con el mismo valor. Es una lectura de catálogo, no de datos de nadie: sin filtro por tenant y abierta a cualquiera que pueda crear una excepción. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/exception-types` la atiende `SchedulingController.listExceptionTypes` (src/modules/scheduling/controllers/scheduling.controller.ts:428). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingCatalogService.listExceptionTypes`. No toca tablas relacionales: Devuelve el catálogo de motivos de bloqueo, que vive en constantes del código (EXCEPTION_TYPES y sus etiquetas); no accede a datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:428` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: Devuelve el catálogo de motivos de bloqueo, que vive en constantes del código (EXCEPTION_TYPES y sus etiquetas); no accede a datos.. _(manual, 2026-10-21; fuente: `src/modules/scheduling/services/scheduling-catalog.service.ts:1091`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ExceptionTypeListDto` · DTO `ExceptionTypeListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ExceptionTypeDto>` | Sí | — | — | Los motivos, en el orden en que se muestran. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:852` |
| `items[].type` | `object` | Sí | — | — | Clave estable con la que se envía al crear la excepción. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:818` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:822` |
| `items[].label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:826` |
| `items[].requiresText` | `boolean` | Sí | — | — | true en «Otro»: exige texto libre | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:835` |
| `items[].blocks` | `boolean` | Sí | — | — | false en la atención extraordinaria | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:845` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:89` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. DELETE /scheduling/exceptions/{id}

- **Origen:** CONTRATO
- **Nombre:** Eliminar una excepción de disponibilidad
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.removeException` — `src/modules/scheduling/controllers/scheduling.controller.ts:490`

### Qué es y para qué sirve (negocio)

Eliminar una excepción de disponibilidad. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /scheduling/exceptions/{id}` la atiende `SchedulingController.removeException` (src/modules/scheduling/controllers/scheduling.controller.ts:490). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.removeException`. Borra de scheduling.availability_exceptions. Lee scheduling.availability_exceptions, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:490` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:490` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.availability_exceptions` | BORRA | BORRA | POR_TIPO | SchedulingController.removeException → SchedulingCatalogService.removeException → SchedulingCatalogRepository.removeException | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:638` |
| `scheduling.availability_exceptions` | LEE | LEE | DIRECTA | SchedulingController.removeException → SchedulingCatalogService.removeException → SchedulingCatalogRepository.findExceptionById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:628` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.removeException → SchedulingCatalogService.removeException → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Excepción no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. PATCH /scheduling/exceptions/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Edita un bloqueo sin borrarlo (AC-11-7). **Agrandar el rango cierra los cupos nuevos; achicarlo no reabre ninguno.** Es la P-11-3, y se resuelve por la consecuencia: cerrar de más ofrece menos turnos y el profesional lo pidió; reabrir ofrecería turnos que nadie decidió ofrecer. El módulo queda con una sola regla: **los cupos sólo los crea publicar el horario.**
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.updateException` — `src/modules/scheduling/controllers/scheduling.controller.ts:467`

### Qué es y para qué sirve (negocio)

Edita un bloqueo sin borrarlo (AC-11-7). **Agrandar el rango cierra los cupos nuevos; achicarlo no reabre ninguno.** Es la P-11-3, y se resuelve por la consecuencia: cerrar de más ofrece menos turnos y el profesional lo pidió; reabrir ofrecería turnos que nadie decidió ofrecer. El módulo queda con una sola regla: **los cupos sólo los crea publicar el horario.**. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /scheduling/exceptions/{id}` la atiende `SchedulingController.updateException` (src/modules/scheduling/controllers/scheduling.controller.ts:467). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `UpdateExceptionDto` (4 campos, 0 obligatorios). Delega en `SchedulingCatalogService.updateException`. Actualiza scheduling.availability_exceptions, scheduling.bookable_slots. Lee scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:467` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:467` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.availability_exceptions` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.updateException → SchedulingCatalogService.updateException | `src/modules/scheduling/services/scheduling-catalog.service.ts:1608` |
| `scheduling.availability_exceptions` | LEE | LEE | DIRECTA | SchedulingController.updateException → SchedulingCatalogService.updateException → SchedulingCatalogRepository.findExceptionById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:628` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.updateException → SchedulingCatalogService.updateException | `src/modules/scheduling/services/scheduling-catalog.service.ts:1626` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.updateException → SchedulingCatalogService.updateException → SchedulingCatalogRepository.findOpenSlotsInWindow | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:1036` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.updateException → SchedulingCatalogService.updateException → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateExceptionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exceptionType` | `object` | No | — | `@IsOptional()` `@IsIn(EXCEPTION_TYPES)` | Tipo TypeScript no expandido:  \| 'ABSENCE' \| 'HOLIDAY' \| 'EXTRA' \| 'VACATION' \| 'CONFERENCE' \| 'ERRAND' \| 'OTHER' | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1062` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1068` |
| `startAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1073` |
| `endAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1078` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "exceptionType": {},
  "reason": "Texto descriptivo de ejemplo",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<UpdateExceptionResponseDto>` · DTO `UpdateExceptionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | El MISMO id que antes: editar no borra y recrea. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1085` |
| `startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1088` |
| `endAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1091` |
| `blockedSlots` | `number` | Sí | — | — | Cupos que se cerraron porque el rango creció. Achicar el rango **no reabre ninguno**, y por eso no hay campo para eso: en este módulo los cupos sólo los crea publicar el horario. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1100` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Excepción no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloqueo termina antes de empezar; PreconditionFailedException: Elegiste «Otro» como motivo: escribí cuál es |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:254` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /scheduling/holds/{holdToken}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar la cita a partir de la reserva temporal
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.confirmBooking` — `src/modules/scheduling/controllers/scheduling.controller.ts:550`

### Qué es y para qué sirve (negocio)

Confirmar la cita a partir de la reserva temporal. Caso de uso UC-41-06: Confirmar cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/holds/{holdToken}/confirm` la atiende `SchedulingController.confirmBooking` (src/modules/scheduling/controllers/scheduling.controller.ts:550). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `ConfirmBookingDto` (5 campos, 3 obligatorios). Delega en `SchedulingBookingsService.confirmBooking`. Crea filas en clinical.appointments, scheduling.appointment_bookings, scheduling.appointment_reminders. Actualiza scheduling.bookable_slots, scheduling.slot_holds. Lee profiles.patient_profiles, profiles.persons, scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.booking_policies, scheduling.schedulable_resources, scheduling.schedule_templates y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/controllers/scheduling.controller.ts:550` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: holdToken | `src/modules/scheduling/controllers/scheduling.controller.ts:550` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.appointments` | ESCRIBE | CREA | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsService.crearCitaClinica → AppointmentsRepository.create | `src/modules/clinical/repositories/appointments.repository.ts:73` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1014` |
| `profiles.persons` | LEE | LEE | POR_SQL | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1014` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.createBooking | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:280` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.findPatientBookingsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:726` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1187` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingProfessionalTimeService.compromisos → SchedulingProfessionalTimeService.tiempoOcupado → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:977` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva | `src/modules/scheduling/services/scheduling-bookings.service.ts:787` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsService.resolvePolicy → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:366` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsService.resolvePolicy → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:417` |
| `scheduling.slot_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva | `src/modules/scheduling/services/scheduling-bookings.service.ts:783` |
| `scheduling.slot_holds` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.findHoldByTokenForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:245` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `holdToken` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfirmBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:98` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente titular de la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:105` |
| `channel` | `string` | Sí | valores: PORTAL, DESK, PHONE | `@IsIn(BOOKING_CHANNELS as readonly string[])` | Canal de la reserva | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:112` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo de consulta | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:121` |
| `reminderOffsetsMinutes` | `array<number>` | No | mínimo 0 | `@IsOptional()` `@IsArray()` `@IsInt({ each: true })` `@Min(0, { each: true })` | Minutos de antelación de los recordatorios a programar | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:139` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "PORTAL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "PORTAL",
  "reasonText": "Texto descriptivo de ejemplo",
  "reminderOffsetsMinutes": [
    1440,
    120
  ]
}
```

</details>

### Respuesta — `Promise<BookingResponseDto>` · DTO `BookingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:195` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:201` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:207` |
| `remindersScheduled` | `number` | Sí | — | — | Recordatorios programados junto con la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:213` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva temporal no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La reserva temporal ya fue consumida o liberada; ConflictException: La reserva temporal expiró |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Ya tenés un turno confirmado ese día a esa hora{choque.resourceName ? ` en «$…}. Cancelalo primero si querés cambiarlo por éste.; PreconditionFailedException: El profesional ya tiene {quien} de {horaLocal( primero.startAt, p…} a {horaLocal( primero.endAt, pri…}{primero.resourceName ? ` en «…}. No puede estar en dos l… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:260` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:149` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:101` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:154` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-06`
- Ciclo de vida de una cita — etapa `P2`

---

## 28. POST /scheduling/holds/{holdToken}/request

- **Origen:** CONTRATO
- **Nombre:** Solicitar la cita a partir de la reserva temporal
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.requestBooking` — `src/modules/scheduling/controllers/scheduling.controller.ts:574`

### Qué es y para qué sirve (negocio)

Solicitar la cita a partir de la reserva temporal. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/holds/{holdToken}/request` la atiende `SchedulingController.requestBooking` (src/modules/scheduling/controllers/scheduling.controller.ts:574). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `RequestBookingDto` (4 campos, 3 obligatorios). Delega en `SchedulingBookingsService.requestBooking`. Crea filas en clinical.appointments, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.appointment_bookings, scheduling.appointment_reminders. Actualiza messaging.notification_requests, scheduling.bookable_slots, scheduling.slot_holds. Lee iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 13 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/controllers/scheduling.controller.ts:574` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: holdToken | `src/modules/scheduling/controllers/scheduling.controller.ts:574` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.appointments` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsService.crearCitaClinica → AppointmentsRepository.create | `src/modules/clinical/repositories/appointments.repository.ts:73` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:278` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1014` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.createBooking | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:280` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.avisarSolicitud → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:216` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1187` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingProfessionalTimeService.assertRangoLibre → SchedulingProfessionalTimeService.compromisos → SchedulingProfessionalTimeService.tiempoOcupado → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:977` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva | `src/modules/scheduling/services/scheduling-bookings.service.ts:787` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsService.resolvePolicy → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:366` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsService.resolvePolicy → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:417` |
| `scheduling.slot_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva | `src/modules/scheduling/services/scheduling-bookings.service.ts:783` |
| `scheduling.slot_holds` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → SchedulingBookingsService.materializarReserva → SchedulingBookingsRepository.findHoldByTokenForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:245` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `holdToken` | path | Sí | `string` | — |

### Cuerpo — DTO `RequestBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:156` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente que solicita la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:166` |
| `channel` | `string` | Sí | valores: PORTAL, DESK, PHONE | `@IsIn(BOOKING_CHANNELS as readonly string[])` | Canal de la solicitud | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:173` |
| `reasonText` | `string` | No | longitud máxima MAX_REASON_LENGTH | `@IsOptional()` `@IsString()` `@MaxLength(MAX_REASON_LENGTH)` | Motivo de consulta: por qué se pide el turno | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:184` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "PORTAL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "PORTAL",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<BookingResponseDto>` · DTO `BookingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:195` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:201` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:207` |
| `remindersScheduled` | `number` | Sí | — | — | Recordatorios programados junto con la cita | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:213` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva temporal no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La reserva temporal ya fue consumida o liberada; ConflictException: La reserva temporal expiró |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Ya tenés un turno confirmado ese día a esa hora{choque.resourceName ? ` en «$…}. Cancelalo primero si querés cambiarlo por éste.; PreconditionFailedException: El profesional ya tiene {quien} de {horaLocal( primero.startAt, p…} a {horaLocal( primero.endAt, pri…}{primero.resourceName ? ` en «…}. No puede estar en dos l… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:251` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:184` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:169` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /scheduling/internal/dispatch-reminders

- **Origen:** CONTRATO
- **Nombre:** Despachar los recordatorios cuya hora ya llegó
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.dispatchReminders` — `src/modules/scheduling/controllers/scheduling-internal.controller.ts:92`

### Qué es y para qué sirve (negocio)

Despachar los recordatorios cuya hora ya llegó. Caso de uso UC-41-14: Worker: despachar recordatorios. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/internal/dispatch-reminders` la atiende `SchedulingInternalController.dispatchReminders` (src/modules/scheduling/controllers/scheduling-internal.controller.ts:92). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Valida el cuerpo como `WorkerBatchDto` (1 campo, 0 obligatorios). Delega en `SchedulingWaitlistService.dispatchReminders`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.notification_requests, scheduling.appointment_reminders. Lee iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/controllers/scheduling-internal.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:278` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.resolverDestinatario → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:216` |
| `scheduling.appointment_reminders` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → PostgresWaitlistAdapter.markRemindersSent | `src/modules/scheduling/adapters/postgres-waitlist.adapter.ts:272` |
| `scheduling.appointment_reminders` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → PostgresWaitlistAdapter.markRemindersSent | `src/modules/scheduling/adapters/postgres-waitlist.adapter.ts:268` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:219` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.avisarRecordatorios → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:293` |

### Cuerpo — DTO `WorkerBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño máximo del lote | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:595` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 100
}
```

</details>

### Respuesta — `Promise<WorkerBatchResultDto>` · DTO `WorkerBatchResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `processed` | `number` | Sí | — | — | Elementos procesados en el lote | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:577` |
| `detail` | `string` | Sí | — | — | Detalle de lo que hizo el worker | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:583` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:298` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-14`

---

## 30. POST /scheduling/internal/expire-holds

- **Origen:** CONTRATO
- **Nombre:** Liberar las reservas temporales vencidas
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.expireHolds` — `src/modules/scheduling/controllers/scheduling-internal.controller.ts:47`

### Qué es y para qué sirve (negocio)

Liberar las reservas temporales vencidas. Caso de uso UC-41-07: Worker: liberar holds vencidos. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/internal/expire-holds` la atiende `SchedulingInternalController.expireHolds` (src/modules/scheduling/controllers/scheduling-internal.controller.ts:47). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Valida el cuerpo como `WorkerBatchDto` (1 campo, 0 obligatorios). Delega en `SchedulingBookingsService.expireHolds`. Actualiza scheduling.bookable_slots, scheduling.slot_holds. Lee scheduling.bookable_slots, scheduling.slot_holds.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/controllers/scheduling-internal.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds | `src/modules/scheduling/services/scheduling-bookings.service.ts:1071` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.slot_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds | `src/modules/scheduling/services/scheduling-bookings.service.ts:1062` |
| `scheduling.slot_holds` | LEE | LEE | DIRECTA | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → SchedulingBookingsRepository.findExpiredHolds | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:262` |

### Cuerpo — DTO `WorkerBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño máximo del lote | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:595` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 100
}
```

</details>

### Respuesta — `Promise<WorkerBatchResultDto>` · DTO `WorkerBatchResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `processed` | `number` | Sí | — | — | Elementos procesados en el lote | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:577` |
| `detail` | `string` | Sí | — | — | Detalle de lo que hizo el worker | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:583` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:280` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-07`
- Ciclo de vida de una cita — etapa `A3`

---

## 31. POST /scheduling/internal/promote-waitlist/{slotId}

- **Origen:** CONTRATO
- **Nombre:** Promover candidatos de la lista de espera a un slot con cupo
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.promoteWaitlist` — `src/modules/scheduling/controllers/scheduling-internal.controller.ts:77`

### Qué es y para qué sirve (negocio)

Promover candidatos de la lista de espera a un slot con cupo. Caso de uso UC-41-12: Worker: promover lista de espera. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/internal/promote-waitlist/{slotId}` la atiende `SchedulingInternalController.promoteWaitlist` (src/modules/scheduling/controllers/scheduling-internal.controller.ts:77). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Valida el cuerpo como `WorkerBatchDto` (1 campo, 0 obligatorios). Delega en `SchedulingWaitlistService.promoteWaitlist`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.notification_requests, scheduling.waitlist_entries. Lee iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/controllers/scheduling-internal.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: slotId | `src/modules/scheduling/controllers/scheduling-internal.controller.ts:77` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.resolverDestinatario → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → SchedulingNoticeRepository.describeSlot → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → SchedulingNoticeRepository.describeSlot → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.findSlotCapacity → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:214` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.avisarCupoLiberado → SchedulingNoticeRepository.describeSlot → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:293` |
| `scheduling.waitlist_entries` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/adapters/postgres-waitlist.adapter.ts:178` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/adapters/postgres-waitlist.adapter.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slotId` | path | Sí | `string` | — |

### Cuerpo — DTO `WorkerBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño máximo del lote | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:595` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 100
}
```

</details>

### Respuesta — `Promise<WorkerBatchResultDto>` · DTO `WorkerBatchResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `processed` | `number` | Sí | — | — | Elementos procesados en el lote | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:577` |
| `detail` | `string` | Sí | — | — | Detalle de lo que hizo el worker | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:583` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Slot no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:289` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-12`

---

## 32. GET /scheduling/internal/waitlist-candidates

- **Origen:** CONTRATO
- **Nombre:** Listar slots con cupo libre y candidatos activos en espera
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.listWaitlistCandidates` — `src/modules/scheduling/controllers/scheduling-internal.controller.ts:64`

### Qué es y para qué sirve (negocio)

Listar slots con cupo libre y candidatos activos en espera. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/internal/waitlist-candidates` la atiende `SchedulingInternalController.listWaitlistCandidates` (src/modules/scheduling/controllers/scheduling-internal.controller.ts:64). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Delega en `SchedulingWaitlistService.findSlotsWithCandidates`. Lee scheduling.bookable_slots, scheduling.waitlist_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/controllers/scheduling-internal.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.listWaitlistCandidates → SchedulingWaitlistService.findSlotsWithCandidates → PostgresWaitlistAdapter.findSlotsWithActiveCandidates → SchedulingBookingsRepository.findSlotsWithWaitlistCandidates | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1246` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingInternalController.listWaitlistCandidates → SchedulingWaitlistService.findSlotsWithCandidates → PostgresWaitlistAdapter.findSlotsWithActiveCandidates → SchedulingBookingsRepository.findSlotsWithWaitlistCandidates | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1229` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tamaño máximo del lote |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<WaitlistCandidateSlotsResponseDto>` · DTO `WaitlistCandidateSlotsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `slotIds` | `array<string>` | Sí | formato uuid | — | Slots candidatos a promoción, del más próximo al más lejano | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:611` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/data-sources.int-spec.ts:104` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:309` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /scheduling/resources

- **Origen:** CONTRATO
- **Nombre:** Listar los recursos agendables de un tenant
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingAgendaController.listResources` — `src/modules/scheduling/controllers/scheduling-agenda.controller.ts:33`

### Qué es y para qué sirve (negocio)

Listar los recursos agendables de un tenant. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources` la atiende `SchedulingAgendaController.listResources` (src/modules/scheduling/controllers/scheduling-agenda.controller.ts:33). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingAgendaService.listResources`. Lee common.addresses, practice.care_spaces, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling-agenda.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PractitionerSitesService.resolveSitesForResources → PractitionerSitesService.loadSites | `src/modules/practice/services/practitioner-sites.service.ts:222` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PractitionerSitesService.resolveSitesForResources → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:61` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PractitionerSitesService.resolveSitesForResources → PractitionerSitesService.loadSites → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PractitionerSitesService.resolveSitesForResources → PractitionerSitesService.loadSites → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PractitionerSitesService.resolveSitesForResources → PractitionerRoleAssignmentsRepository.findCurrentWithSite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:119` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → SchedulingAgendaRepository.findResources | `src/modules/scheduling/repositories/scheduling-agenda.repository.ts:91` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | query | Sí | `string` | Tenant dueño de la agenda |
| `practiceId` | query | No | `string` | Filtrar por práctica |
| `resourceType` | query | No | `string` | Filtrar por tipo de recurso |
| `includeInactive` | query | No | `boolean` | Incluir los recursos dados de baja |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListResourcesResponseDto>` · DTO `ListResourcesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ResourceListItemDto>` | Sí | — | — | Recursos de esta página. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:209` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:97` |
| `items[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:103` |
| `items[].resourceTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a resource type concept. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:109` |
| `items[].resourceRefType` | `string` | Sí | — | — | Tipo de la entidad referenciada por el recurso. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:115` |
| `items[].resourceRefId` | `string` | Sí | formato uuid | — | Identificador asociado a resource ref. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:121` |
| `items[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional detrás del recurso, cuando la referencia apunta a un perfil profesional y la persona pudo resolverse. El selector del paciente pregunta «¿con quién te querés atender?» — la respuesta honesta es una persona, no el nombre interno de la agenda. `null` para salas, equipos, o cuando el perfil referido no existe: la ausencia es un estado real que el cliente debe poder distinguir. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:132` |
| `items[].practiceId` | `string` | No | formato uuid; admite null | — | Identificador asociado a practice. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:138` |
| `items[].timeZone` | `string` | No | admite null | — | Zona horaria IANA del recurso. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:144` |
| `items[].capacity` | `number` | Sí | — | — | Atenciones simultáneas que admite. 1 cuando el recurso no lo declara. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:150` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:156` |
| `items[].site` | `ResourceSiteDto` | No | — | — | Dónde se atiende con este recurso. Derivado de lo que el recurso ya declara —la asignación de rol vigente si apunta a un profesional, el espacio de atención si apunta a un box— y no de una columna propia: guardarlo dos veces sería tener dos verdades sobre el mismo hecho. `null` es un estado corriente y no un error: un recurso sin asignación vigente con sede no tiene dónde que mostrar, y la agenda sigue sirviendo para elegir horario. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:171` |
| `items[].site.id` | `string` | No | formato uuid | — | Identificador de la sede. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:184` |
| `items[].site.name` | `string` | No | — | — | Nombre legible de la sede. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:188` |
| `items[].site.code` | `string` | No | — | — | Código único dentro de la práctica. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:192` |
| `items[].site.addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:196` |
| `items[].site.timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:200` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:215` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:176` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /scheduling/resources

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un recurso agendable
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createResource` — `src/modules/scheduling/controllers/scheduling.controller.ts:154`

### Qué es y para qué sirve (negocio)

Dar de alta un recurso agendable. Caso de uso UC-41-01: Definir recurso y política. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:10`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources` la atiende `SchedulingController.createResource` (src/modules/scheduling/controllers/scheduling.controller.ts:154). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CreateResourceDto` (8 campos, 5 obligatorios). Delega en `SchedulingCatalogService.createResource`. Crea filas en scheduling.schedulable_resources. Lee practice.practice_sites, practice.practices, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:154` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingController.createResource → SchedulingCatalogService.createResource → SchedulingCatalogService.assertVinculoConLaOrganizacion → PractitionerAffiliationGateService.evaluar → PractitionerAffiliationGateService.tenantDeCadaSede | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:163` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.createResource → SchedulingCatalogService.createResource → SchedulingCatalogService.assertVinculoConLaOrganizacion → PractitionerAffiliationGateService.evaluar → PractitionerAffiliationGateService.tenantDeCadaSede | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:163` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingController.createResource → SchedulingCatalogService.createResource → SchedulingCatalogService.assertVinculoConLaOrganizacion → PractitionerAffiliationGateService.evaluar | `src/modules/scheduling/services/practitioner-affiliation-gate.service.ts:88` |
| `scheduling.schedulable_resources` | ESCRIBE | CREA | DIRECTA | SchedulingController.createResource → SchedulingCatalogService.createResource → SchedulingCatalogRepository.createResource | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:291` |

### Cuerpo — DTO `CreateResourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:37` |
| `resourceType` | `string` | Sí | valores: PRACTITIONER, ROOM, EQUIPMENT | `@IsIn(RESOURCE_TYPES as readonly string[])` | Tipo de recurso | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:44` |
| `resourceRefType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Tipo de la entidad referenciada (referencia polimórfica), p. ej. practitioner_profiles | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:56` |
| `resourceRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id de la entidad referenciada | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:63` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:71` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:79` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA del recurso | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:88` |
| `capacity` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Atenciones simultáneas que admite | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PRACTITIONER",
  "resourceRefType": "valor-ejemplo",
  "resourceRefId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PRACTITIONER",
  "resourceRefType": "valor-ejemplo",
  "resourceRefId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "capacity": 1
}
```

</details>

### Respuesta — `Promise<ResourceResponseDto>` · DTO `ResourceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:111` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:117` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:123` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Un profesional solo puede publicar su propia agenda: el recurso debe apuntar a su perfil profesional.; ForbiddenException: El tenant indicado no es uno de los del actor. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Tu vínculo con esta organización todavía está pendiente de aprobación. Cuando la acepten vas a poder publicar tu agenda acá. / Tu vínculo con esta organización… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:180` |
| INTEGRACION | `test/integration/fx1-doctor-publica-agenda.int-spec.ts:84` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:181` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:130` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:110` |
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:68` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:114` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:84` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:75` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:56` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:46` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:93` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-01`

---

## 35. POST /scheduling/resources/{id}/close-slots

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Cierra cupos sueltos y deja el bloqueo que impide que vuelvan. Lo que el pedido pone entre paréntesis es su razón de ser: cerrar un cupo **sin** dejar la excepción sirve hasta que alguien regenera, y ahí el rato que el profesional había cerrado se ofrece otra vez. Un cupo con cita viva NO se cierra por acá: se rechaza entero y se nombran cuáles. Cancelar el turno de alguien exige motivo y avisa a esa persona; hacerlo de arrastre sería decidir por quien está esperando.
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.closeSlots` — `src/modules/scheduling/controllers/scheduling.controller.ts:352`

### Qué es y para qué sirve (negocio)

Cierra cupos sueltos y deja el bloqueo que impide que vuelvan. Lo que el pedido pone entre paréntesis es su razón de ser: cerrar un cupo **sin** dejar la excepción sirve hasta que alguien regenera, y ahí el rato que el profesional había cerrado se ofrece otra vez. Un cupo con cita viva NO se cierra por acá: se rechaza entero y se nombran cuáles. Cancelar el turno de alguien exige motivo y avisa a esa persona; hacerlo de arrastre sería decidir por quien está esperando. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/close-slots` la atiende `SchedulingController.closeSlots` (src/modules/scheduling/controllers/scheduling.controller.ts:352). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CloseSlotsDto` (3 campos, 2 obligatorios). Delega en `SchedulingCatalogService.closeSlots`. Crea filas en scheduling.availability_exceptions. Actualiza scheduling.bookable_slots. Lee scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:352` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:352` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → SchedulingCatalogRepository.findBookingsOfSlots | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:824` |
| `scheduling.availability_exceptions` | ESCRIBE | CREA | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → SchedulingCatalogRepository.createException | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:652` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots | `src/modules/scheduling/services/scheduling-catalog.service.ts:607` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → SchedulingCatalogRepository.findSlotsOfResourceForUpdate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:806` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseSlotsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exceptionType` | `object` | Sí | — | `@IsIn(EXCEPTION_TYPES)` | Por qué se cierra. Del mismo catálogo que los bloqueos. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1002` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | La explicación, obligatoria si el motivo la exige. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1009` |
| `slotIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@ArrayNotEmpty()` `@IsUUID('4', { each: true })` | Los cupos a cerrar. **Al menos uno.** A diferencia de mover, acá no hay «todos los de la ventana»: cerrar la agenda entera de un día ya tiene su pantalla —bloquear— y ofrecerlo también acá haría que un clic distraído cierre el día. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1022` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "exceptionType": {},
  "slotIds": [
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "exceptionType": {},
  "reason": "Texto descriptivo de ejemplo",
  "slotIds": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<CloseSlotsResponseDto>` · DTO `CloseSlotsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `closedSlots` | `number` | Sí | — | — | Cuántos cupos quedaron cerrados. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1029` |
| `exceptionId` | `string` | Sí | formato uuid | — | La excepción que se creó para que regenerar no los devuelva. Es la parte que el pedido pone entre paréntesis y que es su razón de ser: sin ella, cerrar un cupo dura hasta la próxima generación. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1038` |
| `from` | `string` | Sí | formato date-time | — | Desde cuándo cubre la excepción. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1042` |
| `to` | `string` | Sí | formato date-time | — | Hasta cuándo. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:1046` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: Ninguno de esos cupos es de esta agenda |
| 409 | `CONFLICT` | ConflictException: Esos ratos tienen pacientes citados: cancelá cada turno antes de cerrarlos |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Elegiste «Otro» como motivo: escribí cuál es |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:195` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /scheduling/resources/{id}/delay

- **Origen:** CONTRATO
- **Nombre:** Informar una demora que alcanza a toda la agenda del recurso
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.delayResource` — `src/modules/scheduling/controllers/scheduling.controller.ts:633`

### Qué es y para qué sirve (negocio)

Informar una demora que alcanza a toda la agenda del recurso. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/delay` la atiende `SchedulingController.delayResource` (src/modules/scheduling/controllers/scheduling.controller.ts:633). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `DelayResourceDto` (4 campos, 1 obligatorio). Delega en `SchedulingDelayService.delayResource`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza audit.appointment_bookings_history, messaging.notification_requests. Lee audit.appointment_bookings_history, iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:633` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:633` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.anotarDemora | `src/modules/scheduling/services/scheduling-delay.service.ts:205` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.anotarDemora | `src/modules/scheduling/services/scheduling-delay.service.ts:205` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.anotarDemora | `src/modules/scheduling/services/scheduling-delay.service.ts:205` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.avisar → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.resolverDestinatario → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:406` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:399` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DelayResourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `delayMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(MIN_DELAY_MINUTES)` | Minutos de demora estimados | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:752` |
| `message` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(MAX_DELAY_MESSAGE_LENGTH)` | Mensaje del profesional para los pacientes | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:764` |
| `from` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Inicio de la ventana afectada (ISO 8601). Por omisión, ahora. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:777` |
| `to` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Fin de la ventana afectada (ISO 8601). Por omisión, el fin del día. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:790` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "delayMinutes": 20
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "delayMinutes": 20,
  "message": "valor-ejemplo",
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<DelayNoticeResponseDto>` · DTO `DelayNoticeResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `notified` | `number` | Sí | — | — | Pacientes que recibieron el aviso | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:799` |
| `affected` | `number` | Sí | — | — | Citas alcanzadas por la demora | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:805` |
| `bookingIds` | `array<string>` | Sí | formato uuid | — | Las citas alcanzadas, para que la pantalla pueda decir cuáles fueron. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:811` |
| `detail` | `string` | Sí | — | — | Qué pasó, en una frase. Incluye por qué un aviso no llegó cuando no llegó. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:817` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una demora mayor a cuatro horas se resuelve reprogramando el turno, no avisando; PreconditionFailedException: La ventana de la demora termina antes de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:74` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. GET /scheduling/resources/{id}/exceptions

- **Origen:** CONTRATO
- **Nombre:** Listar las excepciones de disponibilidad de un recurso
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listExceptions` — `src/modules/scheduling/controllers/scheduling.controller.ts:307`

### Qué es y para qué sirve (negocio)

Listar las excepciones de disponibilidad de un recurso. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{id}/exceptions` la atiende `SchedulingController.listExceptions` (src/modules/scheduling/controllers/scheduling.controller.ts:307). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER, PATIENT. Delega en `SchedulingCatalogService.listExceptions`. Lee scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling.controller.ts:307` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:307` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.listExceptions → SchedulingCatalogService.listExceptions → SchedulingCatalogRepository.patientHasBookingWithResource | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:915` |
| `scheduling.availability_exceptions` | LEE | LEE | DIRECTA | SchedulingController.listExceptions → SchedulingCatalogService.listExceptions → SchedulingCatalogRepository.findExceptionsByResourceInRange | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:1022` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listExceptions → SchedulingCatalogService.listExceptions → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `from` | query | Sí | `string` | Inicio de la ventana (ISO 8601) |
| `to` | query | Sí | `string` | Fin de la ventana (ISO 8601) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AvailabilityExceptionListDto>` · DTO `AvailabilityExceptionListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AvailabilityExceptionDto>` | Sí | — | — | Las excepciones, de la más próxima a la más lejana. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:559` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:519` |
| `items[].exceptionTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de excepción, como concepto. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:523` |
| `items[].reasonLabel` | `string` | Sí | — | — | El motivo catalogado, en palabras. **Viaja para todos**, incluido el paciente: es una etiqueta de una lista cerrada —«Vacaciones», «Congreso o capacitación»— y no puede contener nada que el profesional no haya elegido a propósito. Es la mitad segura del motivo. La otra —`reason`, el texto libre— sólo la ve quien administra la agenda. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:536` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Comienzo del bloqueo. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:540` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Fin del bloqueo. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:544` |
| `items[].reason` | `string` | No | — | — | Por qué, si se declaró. Lo lee el profesional, no el paciente. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:548` |
| `items[].isAvailable` | `boolean` | No | — | — | `true` cuando la excepción ABRE disponibilidad en vez de cerrarla. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:552` |
| `count` | `number` | Sí | — | — | Cuántas son. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:563` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: No podés ver los bloqueos de esta agenda |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:201` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:206` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /scheduling/resources/{id}/exceptions

- **Origen:** CONTRATO
- **Nombre:** Registrar una excepción de disponibilidad
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createException` — `src/modules/scheduling/controllers/scheduling.controller.ts:440`

### Qué es y para qué sirve (negocio)

Registrar una excepción de disponibilidad. Caso de uso UC-41-04: Excepción de disponibilidad. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/exceptions` la atiende `SchedulingController.createException` (src/modules/scheduling/controllers/scheduling.controller.ts:440). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CreateExceptionDto` (5 campos, 3 obligatorios). Delega en `SchedulingCatalogService.createException`. Crea filas en scheduling.availability_exceptions. Actualiza scheduling.bookable_slots. Lee scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:440` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:440` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingController.createException → SchedulingCatalogService.createException → SchedulingProfessionalTimeService.citasConfirmadas → SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:806` |
| `scheduling.availability_exceptions` | ESCRIBE | CREA | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → SchedulingCatalogRepository.createException | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:652` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createException → SchedulingCatalogService.createException | `src/modules/scheduling/services/scheduling-catalog.service.ts:1206` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → SchedulingCatalogRepository.findOpenSlotsInWindow | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:1036` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateExceptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exceptionType` | `string` | Sí | valores: ABSENCE, HOLIDAY, EXTRA | `@IsIn(EXCEPTION_TYPES)` | Tipo de excepción | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:695` |
| `startAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:702` |
| `endAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:709` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo visible en agenda | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:721` |
| `isAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true cuando la excepción **añade** disponibilidad extraordinaria | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:733` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "exceptionType": "ABSENCE",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "exceptionType": "ABSENCE",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo",
  "isAvailable": false
}
```

</details>

### Respuesta — `Promise<ExceptionResponseDto>` · DTO `ExceptionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shipmentId` | `string` | Sí | formato uuid | — | Identificador asociado a shipment. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `priorityConceptId` | `string` | Sí | formato uuid | — | Prioridad a la que sube el sujeto | sin fuente |
| `eventId` | `string` | Sí | formato uuid | — | Identificador asociado a event. | sin fuente |
| `failedAttemptProofId` | `string` | No | formato uuid | — | Constancia del intento fallido | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Elegiste «Otro» como motivo: escribí cuál es; PreconditionFailedException: La excepción debe empezar antes de terminar; PreconditionFailedException: Tenés una cita confirmada en ese rato{primera.resourceName ? ` en «…}. Reprogramala primero o elegí otro horario. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:127` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:182` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:218` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-04`
- Ciclo de vida de una cita — etapa `A4`

---

## 39. POST /scheduling/resources/{id}/shift-slots

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Corre los cupos de una agenda N minutos — «mover horario» del carril 12. Distinto de «avisar demora», que **sólo avisa** y deja los cupos donde estaban. Acá el turno de la persona pasa a ser otro, así que se escribe y se avisa. Todo o nada: si un cupo no puede moverse porque su horario nuevo pisa otra cita del mismo profesional, no se mueve ninguno. La colisión la rechaza la base con `ex_appointments_practitioner_time`, no este código.
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.shiftSlots` — `src/modules/scheduling/controllers/scheduling.controller.ts:379`

### Qué es y para qué sirve (negocio)

Corre los cupos de una agenda N minutos — «mover horario» del carril 12. Distinto de «avisar demora», que **sólo avisa** y deja los cupos donde estaban. Acá el turno de la persona pasa a ser otro, así que se escribe y se avisa. Todo o nada: si un cupo no puede moverse porque su horario nuevo pisa otra cita del mismo profesional, no se mueve ninguno. La colisión la rechaza la base con `ex_appointments_practitioner_time`, no este código. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/shift-slots` la atiende `SchedulingController.shiftSlots` (src/modules/scheduling/controllers/scheduling.controller.ts:379). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `ShiftSlotsDto` (4 campos, 3 obligatorios). Delega en `SchedulingCatalogService.shiftSlots`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.notification_requests, scheduling.bookable_slots. Lee iam.authentication_credentials, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:379` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:379` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:177` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → MessagingAgendaNoticeAdapter.encolarCorreo → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:186` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.entregar → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:278` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:125` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:143` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogService.avisarDelMovimiento → SchedulingCatalogRepository.findBookingsOfSlots | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:824` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots | `src/modules/scheduling/services/scheduling-catalog.service.ts:681` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogRepository.findSlotsOfResourceForUpdate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:806` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ShiftSlotsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shiftMinutes` | `number` | Sí | mínimo MIN_SHIFT_MINUTES; máximo MAX_SHIFT_MINUTES | `@IsInt()` `@Min(MIN_SHIFT_MINUTES)` `@Max(MAX_SHIFT_MINUTES)` | Minutos a correr. Negativo adelanta. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:937` |
| `from` | `string` | Sí | formato date-time | `@IsISO8601()` | Desde cuándo se mira la agenda. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:942` |
| `to` | `string` | Sí | formato date-time | `@IsISO8601()` | Hasta cuándo. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:947` |
| `slotIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Qué cupos mover. **Ausente = todos los de la ventana.** Es el «seleccionable a todos o ciertos slots en específico» del pedido. Se distingue ausente de lista vacía: una lista vacía no mueve nada, y es una petición que alguien armó mal — mejor que no haga nada a que mueva la agenda entera. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:961` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "shiftMinutes": null,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "shiftMinutes": null,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "slotIds": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<ShiftSlotsResponseDto>` · DTO `ShiftSlotsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `movedSlots` | `number` | Sí | — | — | Cuántos cupos se corrieron. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:968` |
| `notified` | `number` | Sí | — | — | A cuántas personas se les avisó. Menor que `movedSlots` es lo corriente: los cupos libres se mueven y no hay a quién avisarle. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:977` |
| `shiftMinutes` | `number` | Sí | — | — | Los minutos que se aplicaron, para que el cliente confirme lo que pidió. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:981` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana termina antes de empezar; PreconditionFailedException: Mover cero minutos no cambia nada: elegí cuánto correr la agenda |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:154` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. GET /scheduling/resources/{id}/slots

- **Origen:** CONTRATO
- **Nombre:** UC-41-14: agenda publicada del recurso en una ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.getResourceAgenda` — `src/modules/scheduling/controllers/scheduling.controller.ts:109`

### Qué es y para qué sirve (negocio)

UC-41-14: agenda publicada del recurso en una ventana. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{id}/slots` la atiende `SchedulingController.getResourceAgenda` (src/modules/scheduling/controllers/scheduling.controller.ts:109). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingCatalogService.getResourceAgenda`. Lee scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:109` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.getResourceAgenda → SchedulingCatalogService.getResourceAgenda → SchedulingCatalogRepository.findSlotsByResourceInRange | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:997` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.getResourceAgenda → SchedulingCatalogService.getResourceAgenda → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `from` | query | Sí | `string` | Inicio de la ventana (ISO 8601) |
| `to` | query | Sí | `string` | Fin de la ventana (ISO 8601) |
| `onlyAvailable` | query | No | `string` | Por defecto `true`: sólo los slots con cupo. `false` devuelve la agenda completa, ocupados incluidos |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ResourceAgendaResponseDto>` · DTO `ResourceAgendaResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/dto/scheduling-read.dto.ts:85` |
| `from` | `string` | Sí | formato date-time | — | Valor de from mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:91` |
| `to` | `string` | Sí | formato date-time | — | Valor de to mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:97` |
| `items` | `array<BookableSlotItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:103` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del slot; es lo que se manda a `POST /scheduling/slots/:id/holds` | `src/modules/scheduling/dto/scheduling-read.dto.ts:20` |
| `items[].resourceId` | `string` | No | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/dto/scheduling-read.dto.ts:26` |
| `items[].scheduleTemplateId` | `string` | No | formato uuid | — | Identificador asociado a schedule template. | `src/modules/scheduling/dto/scheduling-read.dto.ts:32` |
| `items[].serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:38` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:44` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-read.dto.ts:50` |
| `items[].capacity` | `number` | Sí | — | — | Cupos totales del slot | `src/modules/scheduling/dto/scheduling-read.dto.ts:56` |
| `items[].remainingCapacity` | `number` | Sí | — | — | Cupos libres ahora mismo | `src/modules/scheduling/dto/scheduling-read.dto.ts:62` |
| `items[].available` | `boolean` | Sí | — | — | Si queda cupo. Derivado: no requiere resolver terminología | `src/modules/scheduling/dto/scheduling-read.dto.ts:70` |
| `items[].statusConceptId` | `string` | No | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-read.dto.ts:76` |
| `count` | `number` | Sí | — | — | Número de elementos devueltos. | `src/modules/scheduling/dto/scheduling-read.dto.ts:109` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/scheduling/dto/scheduling-read.dto.ts:115` |
| `truncated` | `boolean` | Sí | — | — | Si la ventana tenía más slots que el tope pedido. Se declara en vez de recortar en silencio: una agenda a la que le faltan huecos sin avisar se lee como una agenda llena | `src/modules/scheduling/dto/scheduling-read.dto.ts:124` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique la ventana con from y to (ISO 8601); PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:240` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:146` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:126` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:83` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. GET /scheduling/resources/{id}/templates

- **Origen:** CONTRATO
- **Nombre:** Listar las plantillas de agenda de un recurso
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listTemplates` — `src/modules/scheduling/controllers/scheduling.controller.ts:216`

### Qué es y para qué sirve (negocio)

Listar las plantillas de agenda de un recurso. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{id}/templates` la atiende `SchedulingController.listTemplates` (src/modules/scheduling/controllers/scheduling.controller.ts:216). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.listTemplates`. Lee scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:216` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:216` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listTemplates → SchedulingCatalogService.listTemplates → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.listTemplates → SchedulingCatalogService.listTemplates → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:456` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.listTemplates → SchedulingCatalogService.listTemplates → SchedulingCatalogRepository.findTemplatesByResource | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:434` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TemplateListDto>` · DTO `TemplateListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TemplateDetailDto>` | Sí | — | — | Las plantillas publicadas, de la más reciente a la más vieja. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:502` |
| `items[].latestVersionId` | `string` | Sí | formato uuid | — | Última versión | sin fuente |
| `items[].responseWindowDays` | `number` | Sí | — | — | Días de plazo para responder | sin fuente |
| `items[].effectiveFrom` | `string` | No | formato date-time | — | Valor de effective from mantenido por la instancia. | sin fuente |
| `items[].effectiveTo` | `string` | No | formato date-time | — | Valor de effective to mantenido por la instancia. | sin fuente |
| `items[].questions` | `array<QuestionDto>` | Sí | — | — | Valor de questions mantenido por la instancia. | sin fuente |
| `items[].questions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:49` |
| `items[].questions[].position` | `number` | Sí | — | — | Posición dentro del cuestionario | `src/modules/surveys/dto/responses.dto.ts:55` |
| `items[].questions[].questionText` | `string` | Sí | — | — | Enunciado | `src/modules/surveys/dto/responses.dto.ts:61` |
| `items[].questions[].answerType` | `string` | Sí | valores: TEXT, SCALE, BOOLEAN, SINGLE_CHOICE, MULTIPLE_CHOICE | — | Valor de answer type mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:67` |
| `items[].questions[].required` | `boolean` | Sí | — | — | Si es obligatoria | `src/modules/surveys/dto/responses.dto.ts:73` |
| `items[].questions[].options` | `array<string>` | No | — | — | Opciones de elección | `src/modules/surveys/dto/responses.dto.ts:79` |
| `items[].questions[].scaleMin` | `number` | No | — | — | Mínimo de la escala | `src/modules/surveys/dto/responses.dto.ts:85` |
| `items[].questions[].scaleMax` | `number` | No | — | — | Máximo de la escala | `src/modules/surveys/dto/responses.dto.ts:91` |
| `count` | `number` | Sí | — | — | Cuántas son. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:506` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:303` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. POST /scheduling/resources/{id}/templates

- **Origen:** CONTRATO
- **Nombre:** Publicar una plantilla de agenda con sus franjas
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createTemplate` — `src/modules/scheduling/controllers/scheduling.controller.ts:188`

### Qué es y para qué sirve (negocio)

Publicar una plantilla de agenda con sus franjas. Caso de uso UC-41-02: Publicar plantilla con franjas. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/templates` la atiende `SchedulingController.createTemplate` (src/modules/scheduling/controllers/scheduling.controller.ts:188). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `SchedulingCreateTemplateDto` (11 campos, 5 obligatorios). Delega en `SchedulingCatalogService.createTemplate`. Crea filas en scheduling.schedule_rules, scheduling.schedule_templates. Lee scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:188` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:188` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |
| `scheduling.schedule_rules` | ESCRIBE | CREA | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → SchedulingCatalogRepository.createRule | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → SchedulingCatalogService.assertSinSolapeConSusOtrasAgendas → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:550` |
| `scheduling.schedule_templates` | ESCRIBE | CREA | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → SchedulingCatalogRepository.createTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:389` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → SchedulingCatalogService.assertSinSolapeConSusOtrasAgendas → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:544` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SchedulingCreateTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:349` |
| `rules` | `array<ScheduleRuleDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ScheduleRuleDto)` | Franjas semanales de la plantilla | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:362` |
| `rules[].dayOfWeek` | `number` | Sí | mínimo 0; máximo 6 | `@IsInt()` `@Min(0)` `@Max(6)` | 0 = domingo … 6 = sábado | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:267` |
| `rules[].startTime` | `string` | Sí | patrón runtime /^\d{2}:\d{2}(:\d{2})?$/ | `@Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'startTime debe tener formato HH:MM o HH:MM:SS', })` | Hora de inicio HH:MM:SS | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:276` |
| `rules[].endTime` | `string` | Sí | patrón runtime /^\d{2}:\d{2}(:\d{2})?$/ | `@Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'endTime debe tener formato HH:MM o HH:MM:SS', })` | Hora de fin HH:MM:SS | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:285` |
| `rules[].slotMinutes` | `number` | No | mínimo 5 | `@IsOptional()` `@IsInt()` `@Min(5)` | Duración del slot en minutos | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:294` |
| `rules[].capacityPerSlot` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Cupos por slot | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:303` |
| `slotMinutes` | `number` | No | mínimo 5 | `@IsOptional()` `@IsInt()` `@Min(5)` | Duración por defecto del slot, en minutos | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:374` |
| `bookingPolicyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:382` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:390` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:398` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "rules": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00:00",
      "endTime": "12:00:00"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "rules": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00:00",
      "endTime": "12:00:00",
      "slotMinutes": 5,
      "capacityPerSlot": 1
    }
  ],
  "slotMinutes": 30,
  "bookingPolicyId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<TemplateResponseDto>` · DTO `TemplateResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:574` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:580` |
| `ruleCount` | `number` | Sí | — | — | Franjas creadas | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:586` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:592` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La franja debe empezar antes de terminar; PreconditionFailedException: Dos franjas de esta agenda se solapan entre sí; PreconditionFailedException: Ya tenés «{otra.resourceName}» el {existente.etiqueta}, que se cruza con estehorario. Cambiá el horario o el día, o editá esa otra agenda. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:194` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:156` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:125` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:131` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:99` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:94` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:70` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:61` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:113` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-02`

---

## 43. GET /scheduling/slots

- **Origen:** CONTRATO
- **Nombre:** Consultar los cupos de una ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingAgendaController.listSlots` — `src/modules/scheduling/controllers/scheduling-agenda.controller.ts:46`

### Qué es y para qué sirve (negocio)

Consultar los cupos de una ventana. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/slots` la atiende `SchedulingAgendaController.listSlots` (src/modules/scheduling/controllers/scheduling-agenda.controller.ts:46). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingAgendaService.listSlots`. Lee scheduling.bookable_slots.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling-agenda.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingAgendaController.listSlots → SchedulingAgendaService.listSlots → SchedulingAgendaRepository.findSlots | `src/modules/scheduling/repositories/scheduling-agenda.repository.ts:132` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `resourceId` | query | No | `string` | Recurso cuya agenda se consulta |
| `scheduleTemplateId` | query | No | `string` | Plantilla que materializó los cupos |
| `from` | query | Sí | `string` | Inicio de la ventana consultada |
| `to` | query | Sí | `string` | Fin de la ventana (exclusivo) |
| `onlyAvailable` | query | No | `boolean` | Sólo cupos con capacidad libre y abiertos: lo que el portal ofrece para reservar |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListSlotsResponseDto>` · DTO `ListSlotsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SlotListItemDto>` | Sí | — | — | Cupos de esta página, del más próximo al más lejano. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:359` |
| `items[].id` | `string` | Sí | formato uuid | — | Id a enviar para reservar el cupo | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:302` |
| `items[].resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:308` |
| `items[].scheduleTemplateId` | `string` | No | formato uuid; admite null | — | Identificador asociado a schedule template. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:314` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:320` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:326` |
| `items[].capacity` | `number` | Sí | — | — | Cupos totales del slot. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:332` |
| `items[].remainingCapacity` | `number` | Sí | — | — | Cupos que quedan libres. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:338` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:344` |
| `items[].serviceConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a service concept. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:350` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:365` |
| `limit` | `number` | Sí | — | — | Tope aplicado. | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:371` |
| `truncated` | `boolean` | Sí | — | — | Si la ventana excede el tope y hay que estrecharla | `src/modules/scheduling/dto/scheduling-agenda.dto.ts:381` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar; PreconditionFailedException: La ventana no puede superar {MAX_WINDOW_DAYS} días |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. POST /scheduling/slots/{id}/holds

- **Origen:** CONTRATO
- **Nombre:** Reservar temporalmente un cupo del slot
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.placeHold` — `src/modules/scheduling/controllers/scheduling.controller.ts:533`

### Qué es y para qué sirve (negocio)

Reservar temporalmente un cupo del slot. Caso de uso UC-41-05: Reserva temporal (anti-double-booking). Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/slots/{id}/holds` la atiende `SchedulingController.placeHold` (src/modules/scheduling/controllers/scheduling.controller.ts:533). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `CreateHoldDto` (1 campo, 0 obligatorios). Delega en `SchedulingBookingsService.placeHold`. Crea filas en scheduling.slot_holds. Actualiza scheduling.bookable_slots. Lee scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.booking_policies, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/controllers/scheduling.controller.ts:533` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:533` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → SchedulingBookingsRepository.countActiveBookingsForPatient | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:595` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.placeHold → SchedulingBookingsService.placeHold | `src/modules/scheduling/services/scheduling-bookings.service.ts:429` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:199` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → SchedulingBookingsService.resolvePolicy → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:366` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → SchedulingBookingsService.resolvePolicy → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:417` |
| `scheduling.slot_holds` | ESCRIBE | CREA | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → SchedulingBookingsRepository.createHold | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:225` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente para el que se reserva | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<HoldResponseDto>` · DTO `HoldResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:67` |
| `holdToken` | `string` | Sí | — | — | Token con el que se confirma la reserva. Se entrega una sola vez. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:76` |
| `expiresAt` | `string` | Sí | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:82` |
| `remainingCapacity` | `number` | Sí | — | — | Cupos que quedan libres en el slot | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:88` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: El slot no tiene cupos disponibles; ConflictException: El paciente alcanzó el máximo de citas activas |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El slot está bloqueado; PreconditionFailedException: Ese horario ya pasó. / Ese turno empieza demasiado pronto: hay que pedirlo con al menos {minutosDeAviso} minutos de anticipación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:254` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:245` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:178` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:164` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:143` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:95` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:140` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-05`
- Ciclo de vida de una cita — etapa `P1`

---

## 45. DELETE /scheduling/templates/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Retirar un horario publicado (TAREA-10, punto 6). `DELETE` y no `PATCH` porque para quien lo usa **es** el botón de dar de baja el horario; lo que cambia es qué significa dar de baja acá, y eso lo dice el cuerpo de la respuesta. No es `@HttpCode(NO_CONTENT)` como el borrado de una excepción: éste devuelve cuánto soltó y cuánto conservó. Responde **409 con la lista** cuando el horario tiene citas comprometidas: no lo retira y nombra lo que hay que resolver primero.
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.retireTemplate` — `src/modules/scheduling/controllers/scheduling.controller.ts:261`

### Qué es y para qué sirve (negocio)

Retirar un horario publicado (TAREA-10, punto 6). `DELETE` y no `PATCH` porque para quien lo usa **es** el botón de dar de baja el horario; lo que cambia es qué significa dar de baja acá, y eso lo dice el cuerpo de la respuesta. No es `@HttpCode(NO_CONTENT)` como el borrado de una excepción: éste devuelve cuánto soltó y cuánto conservó. Responde **409 con la lista** cuando el horario tiene citas comprometidas: no lo retira y nombra lo que hay que resolver primero. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /scheduling/templates/{id}` la atiende `SchedulingController.retireTemplate` (src/modules/scheduling/controllers/scheduling.controller.ts:261). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.retireTemplate`. Actualiza scheduling.schedule_templates. Borra de scheduling.bookable_slots, scheduling.slot_holds. Lee scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:261` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:261` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → SchedulingCatalogRepository.findBookingsOfTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:736` |
| `scheduling.bookable_slots` | BORRA | BORRA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:877` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → SchedulingCatalogRepository.findBookingsOfTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:728` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |
| `scheduling.schedule_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:887` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:417` |
| `scheduling.slot_holds` | BORRA | BORRA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:874` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RetireTemplateResponseDto>` · DTO `RetireTemplateResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | La plantilla retirada. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:790` |
| `statusConceptId` | `string` | Sí | formato uuid | — | El estado con el que queda: `TPL_RETIRED`. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:794` |
| `releasedSlots` | `number` | Sí | — | — | Cupos libres que se soltaron al retirar el horario | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:800` |
| `keptSlots` | `number` | Sí | — | — | Cupos conservados porque tienen una cita detrás | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:811` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado |
| 409 | `CONFLICT` | ConflictException: El horario tiene citas comprometidas: resolvelas antes de retirarlo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:204` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:272` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. POST /scheduling/templates/{id}/generate-slots

- **Origen:** CONTRATO
- **Nombre:** Materializar los slots de la plantilla en una ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.generateSlots` — `src/modules/scheduling/controllers/scheduling.controller.ts:278`

### Qué es y para qué sirve (negocio)

Materializar los slots de la plantilla en una ventana. Caso de uso UC-41-03: Materializar slots. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/templates/{id}/generate-slots` la atiende `SchedulingController.generateSlots` (src/modules/scheduling/controllers/scheduling.controller.ts:278). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `GenerateSlotsDto` (2 campos, 2 obligatorios). Delega en `SchedulingCatalogService.generateSlots`. Crea filas en scheduling.bookable_slots. Lee scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:278` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:278` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → SchedulingProfessionalTimeService.compromisos → SchedulingProfessionalTimeService.citasConfirmadas → SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:806` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → SchedulingProfessionalTimeService.compromisos → SchedulingProfessionalTimeService.tiempoOcupado → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:977` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → SchedulingCatalogRepository.createSlot | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:675` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → SchedulingCatalogRepository.findSlotsByTemplateInRange | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:928` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → SchedulingCatalogRepository.findRulesByTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:498` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:417` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `GenerateSlotsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `from` | `string` | Sí | formato date-time | `@IsISO8601()` | Inicio de la ventana a materializar | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:605` |
| `to` | `string` | Sí | formato date-time | `@IsISO8601()` | Fin de la ventana (exclusivo) | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:615` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<GenerateSlotsResponseDto>` · DTO `GenerateSlotsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `templateId` | `string` | Sí | formato uuid | — | Identificador asociado a template. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:626` |
| `created` | `number` | Sí | — | — | Slots creados en esta ejecución | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:632` |
| `skipped` | `number` | Sí | — | — | Slots que ya existían y se conservaron | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:638` |
| `omittedByCommitments` | `number` | Sí | — | — | Cupos omitidos por chocar con compromisos del profesional (citas confirmadas en cualquiera de sus sedes) | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:651` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:219` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:196` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:145` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:150` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:124` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:115` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:77` |
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:130` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-03`

---

## 47. POST /scheduling/templates/{id}/reactivate

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Vuelve a poner en vigencia un horario pausado — «me fui de viaje y volví». `POST` y no `PATCH` porque es un acto con nombre, no la edición de un campo: es la contraparte exacta de `retire`, y las dos se leen juntas en el mismo controlador.
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.reactivateTemplate` — `src/modules/scheduling/controllers/scheduling.controller.ts:235`

### Qué es y para qué sirve (negocio)

Vuelve a poner en vigencia un horario pausado — «me fui de viaje y volví». `POST` y no `PATCH` porque es un acto con nombre, no la edición de un campo: es la contraparte exacta de `retire`, y las dos se leen juntas en el mismo controlador. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/templates/{id}/reactivate` la atiende `SchedulingController.reactivateTemplate` (src/modules/scheduling/controllers/scheduling.controller.ts:235). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.reactivateTemplate`. Actualiza scheduling.schedule_templates. Lee scheduling.schedulable_resources, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/controllers/scheduling.controller.ts:235` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/controllers/scheduling.controller.ts:235` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.reactivateTemplate → SchedulingCatalogService.reactivateTemplate → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:320` |
| `scheduling.schedule_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.reactivateTemplate → SchedulingCatalogService.reactivateTemplate → SchedulingCatalogRepository.reactivateTemplate | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:840` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.reactivateTemplate → SchedulingCatalogService.reactivateTemplate → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/repositories/scheduling-catalog.repository.ts:417` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReactivateTemplateResponseDto>` · DTO `ReactivateTemplateResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | La plantilla reactivada. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:773` |
| `statusConceptId` | `string` | Sí | formato uuid | — | El estado con el que queda: `TPL_PUBLISHED`. | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:777` |
| `slotsPendientes` | `boolean` | Sí | — | — | true cuando el horario quedó vigente sin cupos materializados y hay que generarlos | `src/modules/scheduling/dto/scheduling-catalog.dto.ts:784` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:280` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. GET /scheduling/waitlist

- **Origen:** CONTRATO
- **Nombre:** Listar las entradas de lista de espera de un paciente
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listWaitlist` — `src/modules/scheduling/controllers/scheduling.controller.ts:608`

### Qué es y para qué sirve (negocio)

Listar las entradas de lista de espera de un paciente. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/waitlist` la atiende `SchedulingController.listWaitlist` (src/modules/scheduling/controllers/scheduling.controller.ts:608). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingWaitlistService.listForPatient`. Lee profiles.person_profiles, profiles.persons, scheduling.schedulable_resources, scheduling.waitlist_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/controllers/scheduling.controller.ts:608` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:145` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:202` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:293` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient | `src/modules/scheduling/repositories/scheduling-notice.repository.ts:352` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | — |
| `includeClosed` | query | No | `string` | Incluye las cubiertas y canceladas (por omisión, no) |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListWaitlistResponseDto>` · DTO `ListWaitlistResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<WaitlistEntryItemDto>` | Sí | — | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:886` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:852` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:855` |
| `items[].resourceId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:858` |
| `items[].resourceLabel` | `string` | Sí | — | — | Nombre del profesional o del recurso | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:865` |
| `items[].desiredFrom` | `string` | No | formato date-time | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:868` |
| `items[].desiredTo` | `string` | No | formato date-time | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:871` |
| `items[].priority` | `number` | Sí | — | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:874` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:877` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:880` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:55` |

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. POST /scheduling/waitlist

- **Origen:** CONTRATO
- **Nombre:** Inscribir a un paciente en la lista de espera
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.enrollWaitlist` — `src/modules/scheduling/controllers/scheduling.controller.ts:591`

### Qué es y para qué sirve (negocio)

Inscribir a un paciente en la lista de espera. Caso de uso UC-41-11: Inscribir en lista de espera. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/scheduling/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/waitlist` la atiende `SchedulingController.enrollWaitlist` (src/modules/scheduling/controllers/scheduling.controller.ts:591). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `CreateWaitlistEntryDto` (6 campos, 2 obligatorios). Delega en `SchedulingWaitlistService.enroll`. Crea filas en scheduling.waitlist_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/controllers/scheduling.controller.ts:591` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.waitlist_entries` | ESCRIBE | CREA | DIRECTA | SchedulingController.enrollWaitlist → SchedulingWaitlistService.enroll → PostgresWaitlistAdapter.enroll → SchedulingBookingsRepository.createWaitlistEntry | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:1142` |

### Cuerpo — DTO `CreateWaitlistEntryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:451` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:458` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Recurso deseado | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:466` |
| `desiredFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:474` |
| `desiredTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:482` |
| `priority` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Prioridad; a mayor valor, antes se promueve | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:494` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "desiredFrom": "2026-07-31T12:00:00.000Z",
  "desiredTo": "2026-07-31T12:00:00.000Z",
  "priority": 0
}
```

</details>

### Respuesta — `Promise<WaitlistEntryResponseDto>` · DTO `WaitlistEntryResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:505` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:511` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/dto/scheduling-bookings.dto.ts:517` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/controllers/scheduling.controller.spec.ts:168` |

### Flujos

- Módulo 41 — Scheduling — etapa `UC-41-11`
- Ciclo de vida de una cita — etapa `A5`

---

## 50. GET /tenants/{tenantId}/agenda

- **Origen:** CONTRATO
- **Nombre:** La agenda de la organización
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantAgendaController.list` — `src/modules/scheduling/controllers/tenant-agenda.controller.ts:36`

### Qué es y para qué sirve (negocio)

La agenda de la organización. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/agenda` la atiende `TenantAgendaController.list` (src/modules/scheduling/controllers/tenant-agenda.controller.ts:36). Exige sesión; el controlador no declara roles. Delega en `SchedulingTenantAgendaService.listar`. Lee directory.tenant_memberships, profiles.persons, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/scheduling/controllers/tenant-agenda.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/scheduling/controllers/tenant-agenda.controller.ts:36` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.listar → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `profiles.persons` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.listar → SchedulingTenantAgendaService.proyectar | `src/modules/scheduling/services/scheduling-tenant-agenda.service.ts:186` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.listar → SchedulingBookingsRepository.findTenantAgenda | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:552` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.listar → SchedulingBookingsRepository.findTenantAgenda | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:562` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.listar → SchedulingAgendaRepository.findResources | `src/modules/scheduling/repositories/scheduling-agenda.repository.ts:91` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |
| `practitionerProfileId` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TenantAgendaResponseDto>` · DTO `TenantAgendaResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TenantAgendaItemDto>` | Sí | — | — | Las citas, en orden cronológico. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:116` |
| `items[].bookingId` | `string` | Sí | formato uuid | — | La cita. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:77` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Cuándo empieza. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:81` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Cuándo termina. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:85` |
| `items[].resourceId` | `string` | Sí | formato uuid; admite null | — | El recurso —la sede— donde se atiende. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:89` |
| `items[].resourceName` | `string` | Sí | admite null | — | Nombre de la sede, para no obligar a la pantalla a cruzarlo. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:93` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid; admite null | — | El profesional que atiende, si el recurso apunta a uno. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:97` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | El paciente citado. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:101` |
| `items[].patientName` | `string` | Sí | admite null | — | Nombre del paciente: la organización lo recibe en la puerta. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:105` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la cita. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:109` |
| `truncated` | `boolean` | Sí | — | — | Si la ventana devolvió tantas citas como el tope permitía. Una agenda a la que le faltan citas sin avisar se lee como una agenda más vacía de lo que está, que es exactamente la lectura contraria a la que una recepción necesita. | `src/modules/scheduling/dto/tenant-agenda.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana no es una fecha válida; PreconditionFailedException: La ventana debe empezar antes de terminar; PreconditionFailedException: El rango no puede superar los {MAX_RANGO_AGENDA_DIAS} días |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling — etapa `ctrl:TenantAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

