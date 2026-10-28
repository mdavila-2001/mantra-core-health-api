<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `scheduling`

- **Bloque:** Práctica y Agenda (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)
- **Operaciones:** 66 (66 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 3 · MEDIO 40 · BAJO 23
- **Tablas distintas que tocan:** 66
- **Respuestas de error y detalle contractual:** `openapi/endpoints/scheduling.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/scheduling/activity-types` | Listar las tipologías de actividad de la agenda | BAJO | 0 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 2 | POST | `/scheduling/appointments/direct` | Asignar una cita puntual a un paciente (nace confirmada) | MEDIO | 47 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 3 | POST | `/scheduling/appointments/walk-in` | Turno de mostrador atómico (walk-in) | MEDIO | 26 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 4 | POST | `/scheduling/booking-policies` | Definir una política de reserva | MEDIO | 2 | SCHEDULING_ADMIN, PRACTITIONER |
| 5 | GET | `/scheduling/bookings` | UC-41-15: lista citas por paciente, recurso y/o ventana | BAJO | 18 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 6 | GET | `/scheduling/bookings/{id}` | UC-41-15: consulta una cita | BAJO | 10 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 7 | POST | `/scheduling/bookings/{id}/accept` | Aceptar la solicitud de cita | MEDIO | 55 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 8 | POST | `/scheduling/bookings/{id}/cancel` | Cancelar la cita y liberar el cupo | MEDIO | 47 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 9 | POST | `/scheduling/bookings/{id}/check-in` | Registrar la llegada del paciente | MEDIO | 5 | SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 10 | POST | `/scheduling/bookings/{id}/complete` | Completar la atención | MEDIO | 26 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 11 | POST | `/scheduling/bookings/{id}/delay` | Informar una demora sobre una cita | MEDIO | 34 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 12 | GET | `/scheduling/bookings/{id}/payment-receipts` | Listar los comprobantes de pago de una cita | BAJO | 9 | PATIENT, PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 13 | POST | `/scheduling/bookings/{id}/payment-receipts` | Subir el comprobante de pago de una cita | MEDIO | 38 | PATIENT |
| 14 | POST | `/scheduling/bookings/{id}/payment-receipts/{receiptId}/confirm` | Confirmar un comprobante de pago | MEDIO | 36 | PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 15 | GET | `/scheduling/bookings/{id}/payment-receipts/{receiptId}/content` | Descargar el archivo de un comprobante de pago | BAJO | 8 | PATIENT, PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 16 | POST | `/scheduling/bookings/{id}/payment-receipts/{receiptId}/reject` | Rechazar un comprobante de pago | MEDIO | 35 | PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 17 | GET | `/scheduling/bookings/{id}/payment-state` | Leer el estado de pago de una cita | BAJO | 3 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 18 | PUT | `/scheduling/bookings/{id}/payment-state` | Marcar el estado de pago de una cita | BAJO | 2 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 19 | POST | `/scheduling/bookings/{id}/propose-schedule` | Proponer otro horario para la solicitud | MEDIO | 11 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 20 | POST | `/scheduling/bookings/{id}/reject` | Rechazar la solicitud de cita | MEDIO | 35 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 21 | POST | `/scheduling/bookings/{id}/reminders` | Programar recordatorios para la cita | MEDIO | 3 | SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 22 | POST | `/scheduling/bookings/{id}/request-info` | Pedir documentación u orden médica antes de aceptar | MEDIO | 6 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 23 | POST | `/scheduling/bookings/{id}/reschedule` | Reprogramar la cita a otro slot | MEDIO | 42 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 24 | POST | `/scheduling/bookings/{id}/start` | Iniciar la atención | MEDIO | 8 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 25 | GET | `/scheduling/confirmation-rules` | Listar las reglas de un tenant | BAJO | 1 | SCHEDULING_ADMIN |
| 26 | POST | `/scheduling/confirmation-rules` | Crear una regla de confirmación | MEDIO | 1 | SCHEDULING_ADMIN |
| 27 | POST | `/scheduling/confirmation-rules/{id}/activate` | Reactivar una regla desactivada | MEDIO | 2 | SCHEDULING_ADMIN |
| 28 | POST | `/scheduling/confirmation-rules/{id}/deactivate` | Desactivar una regla (sin borrado duro) | MEDIO | 2 | SCHEDULING_ADMIN |
| 29 | POST | `/scheduling/confirmation-rules/evaluate` | Evaluar una solicitud de reserva contra las reglas vigentes | BAJO | 1 | SCHEDULING_ADMIN |
| 30 | GET | `/scheduling/exception-types` | Listar los motivos de bloqueo de agenda | BAJO | 0 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 31 | DELETE | `/scheduling/exceptions/{id}` | Eliminar una excepción de disponibilidad | ALTO | 3 | SCHEDULING_ADMIN, PRACTITIONER |
| 32 | PATCH | `/scheduling/exceptions/{id}` | Editar una excepción de disponibilidad | MEDIO | 5 | SCHEDULING_ADMIN, PRACTITIONER |
| 33 | POST | `/scheduling/holds/{holdToken}/confirm` | Confirmar la cita a partir de la reserva temporal | MEDIO | 18 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 34 | POST | `/scheduling/holds/{holdToken}/request` | Solicitar la cita a partir de la reserva temporal | MEDIO | 44 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 35 | POST | `/scheduling/internal/dispatch-reminders` | Despachar los recordatorios cuya hora ya llegó | MEDIO | 33 | SYSTEM, SYSTEM_WORKER |
| 36 | POST | `/scheduling/internal/expire-holds` | Liberar las reservas temporales vencidas | MEDIO | 10 | SYSTEM, SYSTEM_WORKER |
| 37 | POST | `/scheduling/internal/promote-waitlist/{slotId}` | Promover candidatos de la lista de espera a un slot con cupo | MEDIO | 31 | SYSTEM, SYSTEM_WORKER |
| 38 | GET | `/scheduling/internal/waitlist-candidates` | Listar slots con cupo libre y candidatos activos en espera | BAJO | 2 | SYSTEM, SYSTEM_WORKER |
| 39 | GET | `/scheduling/resources` | Listar los recursos agendables de un tenant | BAJO | 6 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 40 | POST | `/scheduling/resources` | Dar de alta un recurso agendable | MEDIO | 4 | SCHEDULING_ADMIN, PRACTITIONER |
| 41 | POST | `/scheduling/resources/{id}/close-slots` | Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos | MEDIO | 32 | SCHEDULING_ADMIN, PRACTITIONER |
| 42 | POST | `/scheduling/resources/{id}/delay` | Informar una demora que alcanza a toda la agenda del recurso | MEDIO | 33 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 43 | GET | `/scheduling/resources/{id}/exceptions` | Listar las excepciones de disponibilidad de un recurso | BAJO | 3 | SCHEDULING_ADMIN, PRACTITIONER, PATIENT |
| 44 | POST | `/scheduling/resources/{id}/exceptions` | Registrar una excepción de disponibilidad | MEDIO | 32 | SCHEDULING_ADMIN, PRACTITIONER |
| 45 | GET | `/scheduling/resources/{id}/flexible-availability` | Horas que se pueden pedir en un horario flexible | BAJO | 9 | PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 46 | POST | `/scheduling/resources/{id}/flexible-holds` | Retener una hora de un horario flexible | MEDIO | 17 | PATIENT, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 47 | POST | `/scheduling/resources/{id}/shift-slots` | Correr los cupos de una agenda N minutos | MEDIO | 32 | SCHEDULING_ADMIN, PRACTITIONER |
| 48 | GET | `/scheduling/resources/{id}/slots` | UC-41-14: agenda publicada del recurso en una ventana | BAJO | 2 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 49 | GET | `/scheduling/resources/{id}/templates` | Listar las plantillas de agenda de un recurso | BAJO | 3 | SCHEDULING_ADMIN, PRACTITIONER |
| 50 | POST | `/scheduling/resources/{id}/templates` | Publicar una plantilla de agenda con sus franjas | MEDIO | 5 | SCHEDULING_ADMIN, PRACTITIONER |
| 51 | GET | `/scheduling/resources/{resourceId}/waitlist` | Listar quiénes esperan turno en una agenda | BAJO | 4 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| 52 | GET | `/scheduling/service-availability` | Horarios donde cabe un servicio | BAJO | 10 | PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 53 | GET | `/scheduling/service-offerings` | Los servicios que ofrece un profesional | BAJO | 2 | PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 54 | POST | `/scheduling/service-offerings` | Declarar cómo ofrezco un servicio | MEDIO | 4 | PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN |
| 55 | PATCH | `/scheduling/service-offerings/{id}` | Editar o apagar la oferta de un servicio | MEDIO | 3 | PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN |
| 56 | POST | `/scheduling/service-offerings/{id}/holds` | Retener el turno de un servicio | MEDIO | 19 | PATIENT, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| 57 | GET | `/scheduling/slots` | Consultar los cupos de una ventana | BAJO | 1 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 58 | POST | `/scheduling/slots/{id}/holds` | Reservar temporalmente un cupo del slot | MEDIO | 9 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 59 | DELETE | `/scheduling/templates/{id}` | Retirar una plantilla de agenda y soltar sus cupos libres | ALTO | 35 | SCHEDULING_ADMIN, PRACTITIONER |
| 60 | PATCH | `/scheduling/templates/{id}` | Editar una plantilla de agenda ya publicada | ALTO | 6 | SCHEDULING_ADMIN, PRACTITIONER |
| 61 | POST | `/scheduling/templates/{id}/generate-slots` | Materializar los slots de la plantilla en una ventana | MEDIO | 7 | SCHEDULING_ADMIN, PRACTITIONER |
| 62 | GET | `/scheduling/templates/{id}/live-bookings` | Listar las citas vivas de una plantilla antes de retirarla | BAJO | 6 | SCHEDULING_ADMIN, PRACTITIONER |
| 63 | POST | `/scheduling/templates/{id}/reactivate` | Reactivar un horario retirado | MEDIO | 3 | SCHEDULING_ADMIN, PRACTITIONER |
| 64 | GET | `/scheduling/waitlist` | Listar las entradas de lista de espera de un paciente | BAJO | 7 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| 65 | POST | `/scheduling/waitlist` | Inscribir a un paciente en la lista de espera | MEDIO | 4 | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| 66 | GET | `/tenants/{tenantId}/agenda` | La agenda de la organización | BAJO | 5 | sesión (sin roles) |

---

## 1. GET /scheduling/activity-types

- **Origen:** CONTRATO
- **Nombre:** Listar las tipologías de actividad de la agenda
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listActivityTypes` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:509`

### Qué es y para qué sirve (negocio)

Listar las tipologías de actividad de la agenda. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/activity-types` la atiende `SchedulingController.listActivityTypes` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:509). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingCatalogService.listActivityTypes`. No toca tablas relacionales: Devuelve el catálogo de tipologías de actividad, que vive en constantes del código (ACTIVITY_TYPES y sus etiquetas); no accede a datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:509` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

No toca tablas relacionales: Devuelve el catálogo de tipologías de actividad, que vive en constantes del código (ACTIVITY_TYPES y sus etiquetas); no accede a datos.. _(manual, 2026-10-21; fuente: `src/modules/scheduling/services/scheduling-catalog.service.ts:1080`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ActivityTypeListDto` · DTO `ActivityTypeListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ActivityTypeDto>` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1178` |
| `items[].type` | `string` | Sí | valores: APPOINTMENT, PROCEDURE, FOLLOW_UP, TELEHEALTH, OTHER | — | Clave estable con la que se identifica la tipología. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1155` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, que es lo que guarda `appointments`. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1159` |
| `items[].label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1163` |
| `items[].tone` | `string` | Sí | valores: primary, secondary, info, warning, success | — | El tono con el que se pinta, del sistema de diseño. `error` queda reservado para los BLOQUEOS —el propietario los pidió «con rojo»— así que ninguna tipología lo usa: si una actividad se pintara igual que un bloqueo, la agenda diría que ese rato está cerrado cuando no lo está. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1173` |

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
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:145` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /scheduling/appointments/direct

- **Origen:** CONTRATO
- **Nombre:** Asignar una cita puntual a un paciente (nace confirmada)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createDirectAppointment` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:633`

### Qué es y para qué sirve (negocio)

Asignar una cita puntual a un paciente (nace confirmada). Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/appointments/direct` la atiende `SchedulingController.createDirectAppointment` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:633). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `CreateDirectAppointmentDto` (10 campos, 4 obligatorios). Delega en `SchedulingBookingsService.createDirectAppointment`. Crea filas en audit.appointment_bookings_history, clinical.appointments, community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests y 3 más. Actualiza audit.appointment_bookings_history, community.public_profiles, iam.devices, messaging.notification_requests, scheduling.bookable_slots. Lee audit.appointment_bookings_history, clinical.encounters, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, forms.form_instances, iam.authentication_credentials y 23 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:633` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `clinical.appointments` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → ClinicalAppointmentSync.createClinicalAppointment → ClinicalAppointmentsAdapter.create → AppointmentsRepository.create | `src/modules/clinical/repositories/appointments.repository.ts:78` |
| `clinical.encounters` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.validateFollowUp → ClinicalAppointmentsAdapter.findLatestEncounterIds → EncountersRepository.findLatestIdsByAppointmentIds | `src/modules/clinical/repositories/encounters.repository.ts:311` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `forms.form_instances` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.validateFollowUp → FormsOriginAdapter.assertUsableOrigin → FormInstanceOriginValidator.assertUsableOrigin | `src/modules/forms/services/form-instance-origin.validator.ts:43` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.findOfPractitioner | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:31` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingBookingsRepository.createBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:292` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:168` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1311` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingProfessionalTimeService.assertRangeFree → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction | `src/modules/scheduling/application/bookings/use-cases/create-direct-appointment.use-case.ts:278` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingCatalogRepository.createSlot | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:752` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:685` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.assertTelemedicineEnabled → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.createDirectAppointment → SchedulingBookingsService.createDirectAppointment → CreateDirectAppointmentUseCase.execute → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.assertTelemedicineEnabled → SchedulingCatalogRepository.findTemplatesByResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:449` |

### Cuerpo — DTO `CreateDirectAppointmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:982` |
| `resourceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:991` |
| `startAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:996` |
| `durationMinutes` | `number` | Sí | mínimo 5; máximo 480 | `@IsInt()` `@Min(5)` `@Max(480)` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1006` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1013` |
| `channel` | `string` | No | valores: PRESENCIAL, TELECONSULTA, DOMICILIO | `@IsOptional()` `@IsIn(APPOINTMENT_CHANNELS as readonly string[])` | Modalidad de la atención. Ausente = PRESENCIAL. No es el canal de la reserva. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1035` |
| `followUpOf` | `FollowUpOriginDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => FollowUpOriginDto)` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1050` |
| `followUpOf.bookingId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:948` |
| `followUpOf.encounterId` | `string` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:957` |
| `followUpOf.formInstanceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:968` |

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
  "reasonText": "Texto descriptivo de ejemplo",
  "channel": "PRESENCIAL",
  "followUpOf": {
    "bookingId": "00000000-0000-4000-8000-000000000001",
    "encounterId": "00000000-0000-4000-8000-000000000001",
    "formInstanceId": "00000000-0000-4000-8000-000000000001"
  }
}
```

</details>

### Respuesta — `Promise<DirectAppointmentResponseDto>` · DTO `DirectAppointmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | La reserva creada, ya confirmada. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1057` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | El cupo único que la respalda. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1061` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado con el que nace: confirmada. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1065` |
| `retractedSlots` | `number` | Sí | — | — | Cupos ofrecidos que esta cita retiró. Si el rato pisaba horarios libres que el doctor mismo ofrecía —en cualquiera de sus sedes—, se retiran en la misma transacción y acá se informa cuántos: el front lo muestra como AVISO («esto quitó N horarios disponibles»), no como pregunta. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1076` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La agenda indicada pertenece a otra organización.; ForbiddenException: Un profesional solo puede asignar citas en su propia agenda.; ForbiddenException: La reconsulta se agenda en su propia agenda, no en la de otro profesional. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: La cita de la que sale esta reconsulta no existe; ResourceNotFoundException: Paciente no encontrado |
| 409 | `CONFLICT` | ConflictException: Esta consulta ya tiene una reconsulta agendada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario no atiende por telemedicina. Habilítela en la franja de su horario de atención o elija otra modalidad.; PreconditionFailedException: La reconsulta es para el paciente de la cita de origen; PreconditionFailedException: Una reconsulta se agenda para más adelante; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug…; PreconditionFailedException: El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:90` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:178` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:219` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /scheduling/appointments/walk-in

- **Origen:** CONTRATO
- **Nombre:** Turno de mostrador atómico (walk-in)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createWalkInAppointment` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:667`

### Qué es y para qué sirve (negocio)

Turno de mostrador atómico (walk-in). Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/appointments/walk-in` la atiende `SchedulingController.createWalkInAppointment` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:667). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `WalkInAppointmentDto` (19 campos, 8 obligatorios). Delega en `SchedulingWalkInService.createWalkInAppointment`. Crea filas en audit.appointment_bookings_history, clinical.appointments, clinical.encounter_participants, clinical.encounters, scheduling.appointment_bookings, scheduling.appointment_reminders, scheduling.bookable_slots. Actualiza audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, clinical.appointments, clinical.encounters, forms.form_instances, practice.practice_sites, practice.practices, profiles.patient_profiles, profiles.persons y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:667` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `clinical.appointments` | ESCRIBE | CREA | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → ClinicalAppointmentSync.createClinicalAppointment → ClinicalAppointmentsAdapter.create → AppointmentsRepository.create | `src/modules/clinical/repositories/appointments.repository.ts:78` |
| `clinical.appointments` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.startInTransaction → StartAppointmentUseCase.executeInTransaction → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus | `src/modules/scheduling/infrastructure/adapters/clinical-appointments.adapter.ts:39` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.startInTransaction → StartAppointmentUseCase.executeInTransaction → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus → AppointmentsRepository.findById | `src/modules/clinical/repositories/appointments.repository.ts:107` |
| `clinical.encounter_participants` | ESCRIBE | CREA | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → ClinicalEncountersAdapter.addParticipant → EncountersRepository.createParticipant | `src/modules/clinical/repositories/encounters.repository.ts:211` |
| `clinical.encounters` | ESCRIBE | CREA | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → ClinicalEncountersAdapter.open → EncountersRepository.create | `src/modules/clinical/repositories/encounters.repository.ts:180` |
| `clinical.encounters` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.validateFollowUp → ClinicalAppointmentsAdapter.findLatestEncounterIds → EncountersRepository.findLatestIdsByAppointmentIds | `src/modules/clinical/repositories/encounters.repository.ts:311` |
| `forms.form_instances` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.validateFollowUp → FormsOriginAdapter.assertUsableOrigin → FormInstanceOriginValidator.assertUsableOrigin | `src/modules/forms/services/form-instance-origin.validator.ts:43` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1107` |
| `profiles.persons` | LEE | LEE | POR_SQL | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1107` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.findOfPractitioner | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:31` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingBookingsRepository.createBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:292` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.startInTransaction → StartAppointmentUseCase.executeInTransaction | `src/modules/scheduling/application/bookings/use-cases/start-appointment.use-case.ts:93` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.validateFollowUp → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1311` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingProfessionalTimeService.assertRangeFree → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction | `src/modules/scheduling/application/bookings/use-cases/create-direct-appointment.use-case.ts:278` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingCatalogRepository.createSlot | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:752` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:685` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.assertTelemedicineEnabled → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.createWalkInAppointment → SchedulingWalkInService.createWalkInAppointment → SchedulingBookingsService.createDirectAppointmentInTransaction → CreateDirectAppointmentUseCase.executeInTransaction → CreateDirectAppointmentUseCase.assertTelemedicineEnabled → SchedulingCatalogRepository.findTemplatesByResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:449` |

### Cuerpo — DTO `WalkInAppointmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patient` | `WalkInPatientDto` | Sí | — | `@ValidateNested()` `@Type(() => WalkInPatientDto)` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:197` |
| `patient.name` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:50` |
| `patient.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:60` |
| `patient.lastName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:67` |
| `patient.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:77` |
| `patient.nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad del paciente | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:90` |
| `patient.issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:105` |
| `patient.birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:111` |
| `patient.phone` | `string` | Sí | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:122` |
| `patient.occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:131` |
| `patient.occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:144` |
| `patient.guardianName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del tutor o persona autorizada | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:155` |
| `patient.guardianPhone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono del tutor, en formato E.164 o nacional | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:171` |
| `patient.guardianRelationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Parentesco del contacto de emergencia (conjunto related-person-relationship) | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:184` |
| `resourceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:202` |
| `startAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:207` |
| `durationMinutes` | `number` | Sí | mínimo 5; máximo 480 | `@IsInt()` `@Min(5)` `@Max(480)` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:214` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:221` |
| `channel` | `string` | No | valores: PRESENCIAL, TELECONSULTA, DOMICILIO | `@IsOptional()` `@IsIn(APPOINTMENT_CHANNELS as readonly string[])` | Modalidad de la atención. Ausente = PRESENCIAL. No es el canal de la reserva. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:236` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patient": {
    "name": "Lucía",
    "lastName": "Mamani",
    "nationalId": "00000000-0000-4000-8000-000000000001",
    "phone": "+59170000000"
  },
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patient": {
    "name": "Lucía",
    "middleName": "Andrea",
    "lastName": "Mamani",
    "motherLastName": "Quispe",
    "nationalId": "00000000-0000-4000-8000-000000000001",
    "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
    "birthDate": "2026-07-31",
    "phone": "+59170000000",
    "occupationConceptId": "00000000-0000-4000-8000-000000000001",
    "occupationFreeText": "valor-ejemplo",
    "guardianName": "Nombre de ejemplo",
    "guardianPhone": "+59170000000",
    "guardianRelationshipConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5,
  "reasonText": "Texto descriptivo de ejemplo",
  "channel": "PRESENCIAL"
}
```

</details>

### Respuesta — `Promise<WalkInAppointmentResponseDto>` · DTO `WalkInAppointmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | El perfil de paciente recién creado. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:243` |
| `personId` | `string` | Sí | formato uuid | — | La persona recién creada. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:247` |
| `patientCode` | `string` | Sí | — | — | El código de paciente asignado. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:251` |
| `bookingId` | `string` | Sí | formato uuid | — | La reserva creada, ya `IN_PROGRESS`. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:255` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | El cupo único que la respalda. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:259` |
| `appointmentId` | `string` | Sí | formato uuid | — | La cita clínica que respalda la reserva. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:263` |
| `encounterId` | `string` | Sí | formato uuid | — | El encuentro abierto, listo para registrar la atención. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:267` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la reserva: nace `IN_PROGRESS`. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:271` |
| `retractedSlots` | `number` | Sí | — | — | Cupos ofrecidos que este turno retiró. | `src/modules/scheduling/presentation/dto/scheduling-walk-in.dto.ts:275` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La agenda indicada pertenece a otra organización.; ForbiddenException: Un profesional solo puede asignar citas en su propia agenda.; ForbiddenException: La reconsulta se agenda en su propia agenda, no en la de otro profesional. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: La cita de la que sale esta reconsulta no existe; ResourceNotFoundException: Paciente no encontrado |
| 409 | `CONFLICT` | ConflictException: Esta consulta ya tiene una reconsulta agendada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario no atiende por telemedicina. Habilítela en la franja de su horario de atención o elija otra modalidad.; PreconditionFailedException: La reconsulta es para el paciente de la cita de origen; PreconditionFailedException: Una reconsulta se agenda para más adelante; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug…; PreconditionFailedException: El paciente ya tiene una cita confirmada en ese rato{clash.resourceName ? ` en «${…}.; PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx10-mostrador-atomico.int-spec.ts:254` |
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:168` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:110` |
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:126` |
| INTEGRACION | `test/integration/p40-orden-basada-en-notas.int-spec.ts:105` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /scheduling/booking-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de reserva
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createPolicy` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:189`

### Qué es y para qué sirve (negocio)

Definir una política de reserva. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/booking-policies` la atiende `SchedulingController.createPolicy` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:189). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CreateBookingPolicyDto` (10 campos, 3 obligatorios). Delega en `SchedulingCatalogService.createPolicy`. Crea filas en scheduling.booking_policies. Lee scheduling.booking_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:189` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_policies` | ESCRIBE | CREA | DIRECTA | SchedulingController.createPolicy → SchedulingCatalogService.createPolicy → CreateBookingPolicyUseCase.execute → SchedulingCatalogRepository.createPolicy | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:348` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.createPolicy → SchedulingCatalogService.createPolicy → CreateBookingPolicyUseCase.execute → SchedulingCatalogRepository.findPolicyByCode | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:389` |

### Cuerpo — DTO `CreateBookingPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:133` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único de la política dentro del tenant | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:144` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:152` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Práctica a la que aplica la política | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:163` |
| `minNoticeMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Antelación mínima para reservar, en minutos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:174` |
| `maxAdvanceDays` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Máximo de días de antelación | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:183` |
| `cancellationWindowMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Ventana sin penalización para cancelar, en minutos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:194` |
| `noShowFeeAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cargo por inasistencia | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:205` |
| `maxActivePerPatient` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Citas activas simultáneas por paciente | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:216` |
| `holdTtlSeconds` | `number` | No | mínimo 30 | `@IsOptional()` `@IsInt()` `@Min(30)` | Vigencia de la reserva temporal del slot, en segundos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:228` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:239` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:245` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:251` |

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
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:112` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /scheduling/bookings

- **Origen:** CONTRATO
- **Nombre:** UC-41-15: lista citas por paciente, recurso y/o ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.searchBookings` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:97`

### Qué es y para qué sirve (negocio)

UC-41-15: lista citas por paciente, recurso y/o ventana. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings` la atiende `SchedulingBookingsController.searchBookings` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:97). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingBookingsService.searchBookings`. Lee audit.appointment_bookings_history, clinical.appointments, clinical.encounters, insurance.insurance_carriers, insurance.insurance_claims, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → AuditBookingHistoryAdapter.latestByBooking | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:31` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → ClinicalAppointmentsAdapter.findTypesByIds → AppointmentsRepository.findTypesByIds | `src/modules/clinical/repositories/appointments.repository.ts:131` |
| `clinical.encounters` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → ClinicalAppointmentsAdapter.findLatestEncounterIds → EncountersRepository.findLatestIdsByAppointmentIds | `src/modules/clinical/repositories/encounters.repository.ts:311` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → InsuranceReadAdapter.findActiveCarriersByPatients → CoverageRepository.findActiveCarriersByPatients | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:221` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → BookingItemAssembler.insuranceClaimsByAppointment → InsuranceReadAdapter.findClaimSummariesByEncounterIds → ClaimReadRepository.findSummariesByEncounterIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:522` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → InsuranceReadAdapter.findActiveCarriersByPatients → CoverageRepository.findActiveCarriersByPatients | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:209` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → InsuranceReadAdapter.findActiveCarriersByPatients → CoverageRepository.findActiveCarriersByPatients | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:213` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → InsuranceReadAdapter.findActiveCarriersByPatients → CoverageRepository.findActiveCarriersByPatients | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:201` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → ProfilesPatientRepresentationAdapter.findActiveProxiedPatientIds → PatientRepresentationService.findActiveProxiedPatientIds → PatientPortalProxiesRepository.findActiveByProxyUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:204` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | POR_SQL | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1107` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → SchedulingBookingsRepository.findBookings | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:545` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → SchedulingBookingsRepository.findPaymentStatesForBookings | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:441` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → SchedulingBookingsRepository.findBookings | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:555` |
| `scheduling.booking_reschedules` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → SchedulingBookingsRepository.latestRescheduleOrigins | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1129` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | SchedulingBookingsController.searchBookings → SchedulingBookingsService.searchBookings → SearchBookingsUseCase.execute → BookingItemAssembler.insuranceClaimsByAppointment → InsuranceReadAdapter.findClaimSummariesByEncounterIds → ClaimReadRepository.findSummariesByEncounterIds | `src/modules/insurance/infrastructure/repositories/claim-read.repository.ts:535` |

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
| `items` | `array<BookingItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:570` |
| `items[].paymentState` | `PaymentStateDto` | No | — | — | El estado de pago, si alguien lo marcó (TAREA-13 punto 5). **Se omite cuando no hay marca**, y no viaja como «pendiente de pago»: pendiente es una afirmación que alguien firmó, la ausencia es que del pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`. Viene en la misma consulta que la página, no una por fila. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:296` |
| `items[].paymentState.state` | `string` | No | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1134` |
| `items[].paymentState.label` | `string` | No | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1138` |
| `items[].paymentState.conceptId` | `string` | No | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1142` |
| `items[].paymentState.insuranceUsed` | `boolean` | No | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1145` |
| `items[].paymentState.markedByUserId` | `string` | No | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1149` |
| `items[].paymentState.markedAt` | `string` | No | formato date-time | — | Cuándo. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1153` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:302` |
| `items[].patientProfileId` | `string` | No | formato uuid | — | Identificador asociado a patient profile. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:308` |
| `items[].resourceId` | `string` | No | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:314` |
| `items[].bookableSlotId` | `string` | No | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:320` |
| `items[].appointmentId` | `string` | No | formato uuid; admite null | — | Cita clínica que respalda la reserva. Es el valor que acepta POST /clinical/encounters/check-in en su `appointmentId`. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:342` |
| `items[].encounterId` | `string` | No | formato uuid; admite null | — | Encuentro clínico de la cita que respalda la reserva; es el encounterId con el que la lectura de notas identifica cada atención. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:361` |
| `items[].startAt` | `string` | No | formato date-time; admite null | — | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:373` |
| `items[].endAt` | `string` | No | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:379` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:385` |
| `items[].serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:391` |
| `items[].bookingChannelConceptId` | `string` | No | formato uuid | — | Identificador asociado a booking channel concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:397` |
| `items[].typeConceptId` | `string` | No | formato uuid | — | Qué clase de actividad es: consulta, procedimiento, control… Vive en `clinical.appointments.type_concept_id` y viaja acá porque la agenda del día pinta cada bloque según su tipología —el pedido del propietario habla de «TURNOS, OPERACIONES, ETC.»— y colorear por algo que la respuesta no trae es imposible. **Es un identificador de concepto, no un enum.** El catálogo de tipologías lo define el propietario (P-12-2) y todavía no está publicado: quien lo consuma hoy puede agrupar por id, no traducirlo a un nombre. Se omite cuando la cita no tiene contraparte clínica —una reserva que nunca llegó a confirmarse no crea `clinical.appointments`— o cuando la tiene y no declara tipo. Omitido, no vacío: `null` diría «no tiene tipo», que es una afirmación distinta. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:417` |
| `items[].confirmedAt` | `string` | No | formato date-time | — | Valor de confirmed at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:423` |
| `items[].checkedInAt` | `string` | No | formato date-time | — | Valor de checked in at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:429` |
| `items[].reasonText` | `string` | No | — | — | Valor de reason text mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:435` |
| `items[].patientName` | `string` | No | — | — | Nombre del paciente. Viaja con la **misma regla que el motivo de consulta**: lo ve el titular y el profesional que atiende en esa agenda, y no la vista de la organización. El médico necesita saber a quién espera —la agenda del día sin nombres es una lista de identificadores— y la organización ya opera con el perfil. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:446` |
| `items[].insuranceCarrierName` | `string` | No | admite null | — | La aseguradora del paciente titular, o `null` si no declara ninguna (ALV-021 — «Particular» o el nombre de la cobertura). Viaja con la **misma regla de privacidad que `patientName`**: es un dato del paciente y lo ve quien ya puede verlo a él. `null` es la respuesta comprobada —«se buscó y no tiene»—; **ausente** es que no se comprobó porque quien mira no tiene el permiso, que es distinto de que el paciente no tenga seguro. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:459` |
| `items[].insuranceClaim` | `BookingInsuranceClaimDto` | No | — | — | La solicitud de seguro más reciente de la cita, o `null` si no tiene. El vínculo es cita → encuentro clínico → solicitud (`appointment_bookings.appointment_id` = `encounters.appointment_id`, y `insurance_claims.encounter_id` = `encounters.id`). Si la cita tuvo más de un encuentro, o más de una solicitud, viaja la más reciente por `submittedAt` y, entre las no enviadas, por fecha de alta. Viaja con la **misma regla que `insuranceCarrierName`**: que alguien tenga un reclamo abierto con su seguro es un dato del paciente, y lo ve quien ya puede verlo a él. `null` es la respuesta comprobada —«se buscó y la cita no tiene solicitud»—; **ausente** es que no se comprobó porque quien mira no tiene el permiso. Hoy sólo lo trae el listado; el detalle lo omite, igual que la aseguradora. Se resuelve en lote para toda la página, no una consulta por fila. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:483` |
| `items[].insuranceClaim.id` | `string` | No | formato uuid | — | `insurance.insurance_claims.id`: con esto se abre el detalle. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:203` |
| `items[].insuranceClaim.claimIdentifier` | `string` | No | — | — | Número de la solicitud, el que se le dicta a la aseguradora. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:207` |
| `items[].insuranceClaim.statusCode` | `string` | No | — | — | Código del concepto de estado (`CLAIM_SUBMITTED`, `CLAIM_ADJUDICATED`, `CLAIM_PAID`, `CLAIM_REVERSED`…). Es la clave estable para decidir color o icono; la lista puede crecer, así que un código desconocido no es error. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:215` |
| `items[].insuranceClaim.statusDisplay` | `string` | No | — | — | Etiqueta del estado en castellano, tal como está en el catálogo. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:219` |
| `items[].insuranceClaim.submittedAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió, en ISO 8601; `null` si todavía no se envió. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:223` |
| `items[].followUpOf` | `BookingFollowUpOriginDto` | No | — | — | P42: la consulta de la que sale esta cita, si es una reconsulta. Misma compuerta de privacidad que `patientName` y `reasonText`: viaja al titular (y a quien lo representa) y al profesional de esa agenda. **Ausente** es «no te corresponde verlo»; `null` es «se buscó y no es una reconsulta». | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:497` |
| `items[].followUpOf.bookingId` | `string` | No | formato uuid | — | La reserva de la que nace la reconsulta. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:237` |
| `items[].followUpOf.encounterId` | `string` | No | formato uuid; admite null | — | El encuentro clínico de esa reserva, si lo tuvo. Lo resuelve el servidor (cita → encuentro), igual que `BookingItemDto.encounterId`. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:244` |
| `items[].followUpOf.startAt` | `string` | No | formato date-time; admite null | — | Cuándo fue la consulta de origen; `null` si su cupo no se encontró. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:248` |
| `items[].followUpOf.formInstanceId` | `string` | No | formato uuid | — | P43: la instancia del formulario médico de esa consulta de la que sale la reconsulta. Se omite si no se declaró. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:255` |
| `items[].followUpBookingId` | `string` | No | formato uuid; admite null | — | P42: la reconsulta viva (no cancelada ni ausente) que salió de esta cita, derivada al leer —el vínculo se guarda sólo en la reconsulta—. Misma compuerta y mismo trato del `null` que `followUpOf`. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:505` |
| `items[].service` | `BookingServiceDto` | No | — | — | El servicio que se reservó, si la cita no es una consulta (v4.2.40). Sale de la copia congelada al reservar —nombre, precio y duración que el paciente aceptó—, no de la oferta de hoy. **Misma compuerta que `reasonText`**: el nombre de un servicio puede revelar un dato de salud. Ausente es «es una consulta» o «no te corresponde verlo». | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:516` |
| `items[].service.offeringId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:261` |
| `items[].service.name` | `string` | No | — | — | Nombre del servicio cuando se reservó | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:264` |
| `items[].service.price` | `string` | No | — | — | Precio cuando se reservó, con dos decimales | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:267` |
| `items[].service.currencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:270` |
| `items[].service.minDurationMinutes` | `number` | No | — | — | Lo mínimo que podía tardar, en minutos | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:273` |
| `items[].service.maxDurationMinutes` | `number` | No | — | — | Lo que se reservó en la agenda, en minutos | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:276` |
| `items[].service.requiresApproval` | `boolean` | No | — | — | Si la reserva esperaba la aceptación del profesional | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:281` |
| `items[].rescheduledFrom` | `string` | No | formato date-time | — | De cuándo se movió, si la cita se reprogramó. Ausente cuando nunca se movió — que es distinto de «se movió y no sé desde cuándo». Es el instante ORIGINAL, no el id del cupo: la tarjeta dice «reprogramada desde el 20/08 a las 15:30», y resolverlo en la pantalla costaría una petición por cita para pintar una línea. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:527` |
| `items[].statusReason` | `BookingStatusReasonDto` | No | — | — | Motivo del último cambio que lo exigía (cancelación, rechazo o reprogramación), con quién lo hizo y cuándo. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:544` |
| `items[].statusReason.reasonText` | `string` | No | — | — | Lo que escribió quien hizo el cambio | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:139` |
| `items[].statusReason.actorKind` | `string` | No | valores: PATIENT, PROVIDER | — | Desde qué lado se hizo el cambio. Permite decir «su médico canceló» en vez de «la cita fue cancelada». | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:149` |
| `items[].statusReason.toStateConceptId` | `string` | No | formato uuid | — | Estado al que llevó el cambio, si fue una transición | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:158` |
| `items[].statusReason.changedAt` | `string` | No | formato date-time | — | Valor de changed at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:164` |
| `items[].delayNotice` | `BookingDelayNoticeDto` | No | — | — | Última demora informada por el profesional, con sus minutos y su mensaje. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:555` |
| `items[].delayNotice.delayMinutes` | `number` | No | — | — | Minutos de demora informados | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:179` |
| `items[].delayNotice.message` | `string` | No | — | — | Mensaje del profesional | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:185` |
| `items[].delayNotice.announcedAt` | `string` | No | formato date-time | — | Cuándo se informó. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:191` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:561` |
| `count` | `number` | Sí | — | — | Número de elementos devueltos. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:576` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:582` |
| `truncated` | `boolean` | Sí | — | — | Si había más citas que el tope pedido | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:590` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo se lista desde su propia cuenta.; ForbiddenException: Esta cuenta no tiene un perfil de paciente con citas que listar. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique al menos patientProfileId o resourceId para listar citas; PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:270` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:130` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:367` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:162` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:226` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /scheduling/bookings/{id}

- **Origen:** CONTRATO
- **Nombre:** UC-41-15: consulta una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.getBooking` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:140`

### Qué es y para qué sirve (negocio)

UC-41-15: consulta una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings/{id}` la atiende `SchedulingBookingsController.getBooking` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:140). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingBookingsService.getBookingById`. Lee audit.appointment_bookings_history, clinical.appointments, clinical.encounters, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, scheduling.appointment_bookings, scheduling.bookable_slots y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:140` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:140` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → AuditBookingHistoryAdapter.latestByBooking | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:31` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → ClinicalAppointmentsAdapter.findTypesByIds → AppointmentsRepository.findTypesByIds | `src/modules/clinical/repositories/appointments.repository.ts:131` |
| `clinical.encounters` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → ClinicalAppointmentsAdapter.findLatestEncounterIds → EncountersRepository.findLatestIdsByAppointmentIds | `src/modules/clinical/repositories/encounters.repository.ts:311` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → ProfilesPatientRepresentationAdapter.findActiveProxiedPatientIds → PatientRepresentationService.findActiveProxiedPatientIds → PatientPortalProxiesRepository.findActiveByProxyUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:204` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → SchedulingBookingsRepository.findBookingById | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:465` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:226` |
| `scheduling.booking_reschedules` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → SchedulingBookingsRepository.latestRescheduleOrigins | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1129` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.getBooking → SchedulingBookingsService.getBookingById → GetBookingUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BookingItemDto>` · DTO `BookingItemDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `paymentState` | `PaymentStateDto` | No | — | — | El estado de pago, si alguien lo marcó (TAREA-13 punto 5). **Se omite cuando no hay marca**, y no viaja como «pendiente de pago»: pendiente es una afirmación que alguien firmó, la ausencia es que del pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`. Viene en la misma consulta que la página, no una por fila. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:296` |
| `paymentState.state` | `string` | No | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1134` |
| `paymentState.label` | `string` | No | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1138` |
| `paymentState.conceptId` | `string` | No | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1142` |
| `paymentState.insuranceUsed` | `boolean` | No | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1145` |
| `paymentState.markedByUserId` | `string` | No | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1149` |
| `paymentState.markedAt` | `string` | No | formato date-time | — | Cuándo. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1153` |
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:302` |
| `patientProfileId` | `string` | No | formato uuid | — | Identificador asociado a patient profile. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:308` |
| `resourceId` | `string` | No | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:314` |
| `bookableSlotId` | `string` | No | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:320` |
| `appointmentId` | `string` | No | formato uuid; admite null | — | Cita clínica que respalda la reserva. Es el valor que acepta POST /clinical/encounters/check-in en su `appointmentId`. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:342` |
| `encounterId` | `string` | No | formato uuid; admite null | — | Encuentro clínico de la cita que respalda la reserva; es el encounterId con el que la lectura de notas identifica cada atención. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:361` |
| `startAt` | `string` | No | formato date-time; admite null | — | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:373` |
| `endAt` | `string` | No | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:379` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:385` |
| `serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:391` |
| `bookingChannelConceptId` | `string` | No | formato uuid | — | Identificador asociado a booking channel concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:397` |
| `typeConceptId` | `string` | No | formato uuid | — | Qué clase de actividad es: consulta, procedimiento, control… Vive en `clinical.appointments.type_concept_id` y viaja acá porque la agenda del día pinta cada bloque según su tipología —el pedido del propietario habla de «TURNOS, OPERACIONES, ETC.»— y colorear por algo que la respuesta no trae es imposible. **Es un identificador de concepto, no un enum.** El catálogo de tipologías lo define el propietario (P-12-2) y todavía no está publicado: quien lo consuma hoy puede agrupar por id, no traducirlo a un nombre. Se omite cuando la cita no tiene contraparte clínica —una reserva que nunca llegó a confirmarse no crea `clinical.appointments`— o cuando la tiene y no declara tipo. Omitido, no vacío: `null` diría «no tiene tipo», que es una afirmación distinta. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:417` |
| `confirmedAt` | `string` | No | formato date-time | — | Valor de confirmed at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:423` |
| `checkedInAt` | `string` | No | formato date-time | — | Valor de checked in at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:429` |
| `reasonText` | `string` | No | — | — | Valor de reason text mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:435` |
| `patientName` | `string` | No | — | — | Nombre del paciente. Viaja con la **misma regla que el motivo de consulta**: lo ve el titular y el profesional que atiende en esa agenda, y no la vista de la organización. El médico necesita saber a quién espera —la agenda del día sin nombres es una lista de identificadores— y la organización ya opera con el perfil. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:446` |
| `insuranceCarrierName` | `string` | No | admite null | — | La aseguradora del paciente titular, o `null` si no declara ninguna (ALV-021 — «Particular» o el nombre de la cobertura). Viaja con la **misma regla de privacidad que `patientName`**: es un dato del paciente y lo ve quien ya puede verlo a él. `null` es la respuesta comprobada —«se buscó y no tiene»—; **ausente** es que no se comprobó porque quien mira no tiene el permiso, que es distinto de que el paciente no tenga seguro. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:459` |
| `insuranceClaim` | `BookingInsuranceClaimDto` | No | — | — | La solicitud de seguro más reciente de la cita, o `null` si no tiene. El vínculo es cita → encuentro clínico → solicitud (`appointment_bookings.appointment_id` = `encounters.appointment_id`, y `insurance_claims.encounter_id` = `encounters.id`). Si la cita tuvo más de un encuentro, o más de una solicitud, viaja la más reciente por `submittedAt` y, entre las no enviadas, por fecha de alta. Viaja con la **misma regla que `insuranceCarrierName`**: que alguien tenga un reclamo abierto con su seguro es un dato del paciente, y lo ve quien ya puede verlo a él. `null` es la respuesta comprobada —«se buscó y la cita no tiene solicitud»—; **ausente** es que no se comprobó porque quien mira no tiene el permiso. Hoy sólo lo trae el listado; el detalle lo omite, igual que la aseguradora. Se resuelve en lote para toda la página, no una consulta por fila. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:483` |
| `insuranceClaim.id` | `string` | No | formato uuid | — | `insurance.insurance_claims.id`: con esto se abre el detalle. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:203` |
| `insuranceClaim.claimIdentifier` | `string` | No | — | — | Número de la solicitud, el que se le dicta a la aseguradora. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:207` |
| `insuranceClaim.statusCode` | `string` | No | — | — | Código del concepto de estado (`CLAIM_SUBMITTED`, `CLAIM_ADJUDICATED`, `CLAIM_PAID`, `CLAIM_REVERSED`…). Es la clave estable para decidir color o icono; la lista puede crecer, así que un código desconocido no es error. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:215` |
| `insuranceClaim.statusDisplay` | `string` | No | — | — | Etiqueta del estado en castellano, tal como está en el catálogo. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:219` |
| `insuranceClaim.submittedAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió, en ISO 8601; `null` si todavía no se envió. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:223` |
| `followUpOf` | `BookingFollowUpOriginDto` | No | — | — | P42: la consulta de la que sale esta cita, si es una reconsulta. Misma compuerta de privacidad que `patientName` y `reasonText`: viaja al titular (y a quien lo representa) y al profesional de esa agenda. **Ausente** es «no te corresponde verlo»; `null` es «se buscó y no es una reconsulta». | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:497` |
| `followUpOf.bookingId` | `string` | No | formato uuid | — | La reserva de la que nace la reconsulta. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:237` |
| `followUpOf.encounterId` | `string` | No | formato uuid; admite null | — | El encuentro clínico de esa reserva, si lo tuvo. Lo resuelve el servidor (cita → encuentro), igual que `BookingItemDto.encounterId`. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:244` |
| `followUpOf.startAt` | `string` | No | formato date-time; admite null | — | Cuándo fue la consulta de origen; `null` si su cupo no se encontró. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:248` |
| `followUpOf.formInstanceId` | `string` | No | formato uuid | — | P43: la instancia del formulario médico de esa consulta de la que sale la reconsulta. Se omite si no se declaró. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:255` |
| `followUpBookingId` | `string` | No | formato uuid; admite null | — | P42: la reconsulta viva (no cancelada ni ausente) que salió de esta cita, derivada al leer —el vínculo se guarda sólo en la reconsulta—. Misma compuerta y mismo trato del `null` que `followUpOf`. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:505` |
| `service` | `BookingServiceDto` | No | — | — | El servicio que se reservó, si la cita no es una consulta (v4.2.40). Sale de la copia congelada al reservar —nombre, precio y duración que el paciente aceptó—, no de la oferta de hoy. **Misma compuerta que `reasonText`**: el nombre de un servicio puede revelar un dato de salud. Ausente es «es una consulta» o «no te corresponde verlo». | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:516` |
| `service.offeringId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:261` |
| `service.name` | `string` | No | — | — | Nombre del servicio cuando se reservó | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:264` |
| `service.price` | `string` | No | — | — | Precio cuando se reservó, con dos decimales | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:267` |
| `service.currencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:270` |
| `service.minDurationMinutes` | `number` | No | — | — | Lo mínimo que podía tardar, en minutos | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:273` |
| `service.maxDurationMinutes` | `number` | No | — | — | Lo que se reservó en la agenda, en minutos | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:276` |
| `service.requiresApproval` | `boolean` | No | — | — | Si la reserva esperaba la aceptación del profesional | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:281` |
| `rescheduledFrom` | `string` | No | formato date-time | — | De cuándo se movió, si la cita se reprogramó. Ausente cuando nunca se movió — que es distinto de «se movió y no sé desde cuándo». Es el instante ORIGINAL, no el id del cupo: la tarjeta dice «reprogramada desde el 20/08 a las 15:30», y resolverlo en la pantalla costaría una petición por cita para pintar una línea. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:527` |
| `statusReason` | `BookingStatusReasonDto` | No | — | — | Motivo del último cambio que lo exigía (cancelación, rechazo o reprogramación), con quién lo hizo y cuándo. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:544` |
| `statusReason.reasonText` | `string` | No | — | — | Lo que escribió quien hizo el cambio | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:139` |
| `statusReason.actorKind` | `string` | No | valores: PATIENT, PROVIDER | — | Desde qué lado se hizo el cambio. Permite decir «su médico canceló» en vez de «la cita fue cancelada». | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:149` |
| `statusReason.toStateConceptId` | `string` | No | formato uuid | — | Estado al que llevó el cambio, si fue una transición | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:158` |
| `statusReason.changedAt` | `string` | No | formato date-time | — | Valor de changed at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:164` |
| `delayNotice` | `BookingDelayNoticeDto` | No | — | — | Última demora informada por el profesional, con sus minutos y su mensaje. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:555` |
| `delayNotice.delayMinutes` | `number` | No | — | — | Minutos de demora informados | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:179` |
| `delayNotice.message` | `string` | No | — | — | Mensaje del profesional | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:185` |
| `delayNotice.announcedAt` | `string` | No | formato date-time | — | Cuándo se informó. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:191` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:561` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:142` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:358` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:371` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:201` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /scheduling/bookings/{id}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar la solicitud de cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.accept` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:156`

### Qué es y para qué sirve (negocio)

Aceptar la solicitud de cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/accept` la atiende `SchedulingBookingsController.accept` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:156). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `AcceptBookingDto` (1 campo, 0 obligatorios). Delega en `SchedulingBookingsService.accept`. Crea filas en audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.direct_messages, community.message_receipts, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries y 3 más. Actualiza audit.appointment_bookings_history, clinical.appointments, community.conversation_participants, community.conversations, community.public_profiles, iam.devices, messaging.notification_requests, scheduling.appointment_bookings y 1 más. Lee audit.appointment_bookings_history, clinical.appointments, common.file_versions, common.files, community.chat_auto_replies, community.conversation_participants, community.conversations, community.direct_messages y 27 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:156` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `clinical.appointments` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus | `src/modules/scheduling/infrastructure/adapters/clinical-appointments.adapter.ts:39` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus → AppointmentsRepository.findById | `src/modules/clinical/repositories/appointments.repository.ts:107` |
| `common.file_versions` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.assertAttachmentCanBeAssociated → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.assertAttachmentCanBeAssociated → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.chat_auto_replies` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.responderOnly → CommunityChatAutoReplyService.textForResponder | `src/modules/community/services/community-chat-auto-reply.service.ts:152` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.responderOnly → CommunityChatAutoReplyService.textForResponder | `src/modules/community/services/community-chat-auto-reply.service.ts:186` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send | `src/modules/community/services/community-messaging.service.ts:383` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.direct_messages` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → ConversationsRepository.createMessage | `src/modules/community/repositories/conversations.repository.ts:466` |
| `community.direct_messages` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.assertAttachmentCanBeAssociated → ConversationsRepository.findLiveMessagesByAttachmentFileId | `src/modules/community/repositories/conversations.repository.ts:229` |
| `community.message_receipts` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → ConversationsRepository.createReceipt | `src/modules/community/repositories/conversations.repository.ts:565` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyAcceptedInChat → CommunityBookingChatAdapter.announceAcceptance → CommunityBookingChatService.enviarConfirmacion → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → SchedulingProfessionalTimeService.assertRangeFree → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingAccess.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.findOfPractitioner | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:31` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/accept-booking.use-case.ts:95` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → BookingAccess.loadForOperation → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1311` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → SchedulingProfessionalTimeService.assertRangeFree → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → DisplacedRequestsCanceller.cancelConflictingPending | `src/modules/scheduling/application/bookings/support/displaced-requests-canceller.ts:109` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:226` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → DisplacedRequestsCanceller.cancelConflictingPending → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1213` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → DisplacedRequestsCanceller.cancelConflictingPending → ServiceSlotLifecycle.isOneOffOnDemand → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.accept → SchedulingBookingsService.accept → AcceptBookingUseCase.execute → DisplacedRequestsCanceller.cancelConflictingPending → ServiceSlotLifecycle.isOneOffOnDemand → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AcceptBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reminderOffsetsMinutes` | `array<number>` | No | mínimo 0 | `@IsOptional()` `@IsArray()` `@IsInt({ each: true })` `@Min(0, { each: true })` | Minutos de antelación de los recordatorios a programar | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:245` |

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
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:281` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:290` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:296` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:313` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación, así que todavía no puede comprometer citas suyas. / Su vínculo con esta organización ya…; PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:382` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:209` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:339` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:113` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /scheduling/bookings/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar la cita y liberar el cupo
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.cancel` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:500`

### Qué es y para qué sirve (negocio)

Cancelar la cita y liberar el cupo. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/cancel` la atiende `SchedulingBookingsController.cancel` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:500). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Valida el cuerpo como `CancelBookingDto` (3 campos, 2 obligatorios). Delega en `SchedulingBookingsService.cancel`. Crea filas en audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, community.public_profiles, iam.devices, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.waitlist_entries. Lee audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications y 24 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:500` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:500` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction | `src/modules/scheduling/application/bookings/use-cases/cancel-booking.use-case.ts:286` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.discardOneOffSlot → ServiceSlotLifecycle.reopenRetractedConsultationsOf → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction | `src/modules/scheduling/application/bookings/use-cases/cancel-booking.use-case.ts:298` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1213` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | POR_SQL | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.discardOneOffSlot → ServiceSlotLifecycle.reopenRetractedConsultationsOf → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:242` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |
| `scheduling.slot_holds` | LEE | LEE | POR_SQL | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.discardOneOffSlot → ServiceSlotLifecycle.reopenRetractedConsultationsOf → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |
| `scheduling.waitlist_entries` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.promoteWaitlistFor → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:212` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingBookingsController.cancel → SchedulingBookingsService.cancel → CancelBookingUseCase.execute → CancelBookingUseCase.promoteWaitlistFor → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:210` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cancelledBy` | `string` | Sí | valores: PATIENT, PROVIDER | `@IsIn(['PATIENT', 'PROVIDER'])` | Quién origina la cancelación | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:377` |
| `isNoShow` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si la cita se marca como inasistencia (aplica el cargo de la política) | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:389` |
| `reasonText` | `string` | Sí | longitud mínima 5; longitud máxima 500 | `@IsString()` `@MinLength(MIN_REASON_LENGTH)` `@MaxLength(MAX_REASON_LENGTH)` | Motivo de la cancelación. Obligatorio: se le muestra a la otra parte en el detalle de la cita. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:407` |

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
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:418` |
| `feeAmount` | `string` | No | — | — | Cargo aplicado, si la política lo contempla | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:427` |
| `capacityReleased` | `boolean` | Sí | — | — | Cupo devuelto al slot | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:433` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Transición de estado de cita no permitida; PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:348` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:281` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:222` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:158` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:326` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:252` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `A2`

---

## 9. POST /scheduling/bookings/{id}/check-in

- **Origen:** CONTRATO
- **Nombre:** Registrar la llegada del paciente
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.checkIn` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:522`

### Qué es y para qué sirve (negocio)

Registrar la llegada del paciente. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/check-in` la atiende `SchedulingBookingsController.checkIn` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:522). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingBookingsService.checkIn`. Crea filas en audit.appointment_bookings_history. Actualiza audit.appointment_bookings_history, scheduling.appointment_bookings. Lee audit.appointment_bookings_history, scheduling.appointment_bookings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:522` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:522` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → CheckInBookingUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → CheckInBookingUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → CheckInBookingUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → CheckInBookingUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/check-in-booking.use-case.ts:51` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.checkIn → SchedulingBookingsService.checkIn → CheckInBookingUseCase.execute → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CheckInResponseDto>` · DTO `CheckInResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:444` |
| `checkedInAt` | `string` | Sí | formato date-time | — | Valor de checked in at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:450` |

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

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:261` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `P3`

---

## 10. POST /scheduling/bookings/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Completar la atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.complete` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:458`

### Qué es y para qué sirve (negocio)

Completar la atención. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/complete` la atiende `SchedulingBookingsController.complete` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:458). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingBookingsService.complete`. Crea filas en audit.appointment_bookings_history, surveys.survey_assignments, surveys.survey_invitations, surveys.survey_questions, surveys.survey_templates, surveys.survey_versions. Actualiza audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings, scheduling.bookable_slots, surveys.survey_templates, surveys.survey_versions. Lee audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.practitioner_service_offerings, scheduling.schedulable_resources, scheduling.schedule_templates y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:458` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:458` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `clinical.appointments` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus | `src/modules/scheduling/infrastructure/adapters/clinical-appointments.adapter.ts:39` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus → AppointmentsRepository.findById | `src/modules/clinical/repositories/appointments.repository.ts:107` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/complete-appointment.use-case.ts:55` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → BookingAccess.loadForOperation → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → ServiceSlotLifecycle.releaseServiceLeftover → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → ServiceSlotLifecycle.releaseServiceLeftover | `src/modules/scheduling/application/bookings/support/service-slot-lifecycle.ts:93` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → ServiceSlotLifecycle.releaseServiceLeftover → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysAssignmentsService.resolveTargets → SurveysAssignmentsService.resolveServiceCatalogId → TargetsRepository.findOffering | `src/modules/surveys/repositories/targets.repository.ts:78` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_templates` | LEE | LEE | POR_SQL | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → ServiceSlotLifecycle.releaseServiceLeftover → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveFlexibleSlotsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:309` |
| `scheduling.slot_holds` | LEE | LEE | POR_SQL | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → ServiceSlotLifecycle.releaseServiceLeftover → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |
| `surveys.survey_assignments` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysSystemTemplatesService.ensureSystemTemplate → SurveysSystemTemplatesService.materialize → AssignmentsRepository.create | `src/modules/surveys/repositories/assignments.repository.ts:143` |
| `surveys.survey_assignments` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → AssignmentsRepository.listActiveByTargets | `src/modules/surveys/repositories/assignments.repository.ts:93` |
| `surveys.survey_invitations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → InvitationsRepository.create | `src/modules/surveys/repositories/invitations.repository.ts:203` |
| `surveys.survey_invitations` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → InvitationsRepository.listByBooking | `src/modules/surveys/repositories/invitations.repository.ts:156` |
| `surveys.survey_questions` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysSystemTemplatesService.ensureSystemTemplate → SurveysSystemTemplatesService.materialize → TemplatesRepository.createQuestion | `src/modules/surveys/repositories/templates.repository.ts:365` |
| `surveys.survey_questions` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysSystemTemplatesService.ensureSystemTemplate → SurveysSystemTemplatesService.read → TemplatesRepository.countQuestions | `src/modules/surveys/repositories/templates.repository.ts:324` |
| `surveys.survey_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysSystemTemplatesService.ensureSystemTemplate → SurveysSystemTemplatesService.materialize | `src/modules/surveys/services/surveys-system-templates.service.ts:211` |
| `surveys.survey_templates` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysSystemTemplatesService.ensureSystemTemplate → SurveysSystemTemplatesService.materialize → TemplatesRepository.createTemplate | `src/modules/surveys/repositories/templates.repository.ts:209` |
| `surveys.survey_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysAssignmentsService.practitionerCandidates → TemplatesRepository.findTemplateById | `src/modules/surveys/repositories/templates.repository.ts:143` |
| `surveys.survey_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysSystemTemplatesService.ensureSystemTemplate → SurveysSystemTemplatesService.materialize | `src/modules/surveys/services/surveys-system-templates.service.ts:222` |
| `surveys.survey_versions` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysSystemTemplatesService.ensureSystemTemplate → SurveysSystemTemplatesService.materialize → TemplatesRepository.createVersion | `src/modules/surveys/repositories/templates.repository.ts:291` |
| `surveys.survey_versions` | LEE | LEE | DIRECTA | SchedulingBookingsController.complete → SchedulingBookingsService.complete → CompleteAppointmentUseCase.execute → SurveysBookingCompletedAdapter.onBookingCompleted → SurveysAssignmentsService.issueForCompletedBooking → SurveysAssignmentsService.issue → SurveysAssignmentsService.hasInvitationOfTemplate → TemplatesRepository.findVersionById | `src/modules/surveys/repositories/templates.repository.ts:227` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BookingDecisionResponseDto>` · DTO `BookingDecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:281` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:290` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:296` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:313` |

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

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /scheduling/bookings/{id}/delay

- **Origen:** CONTRATO
- **Nombre:** Informar una demora sobre una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.delay` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:545`

### Qué es y para qué sirve (negocio)

Informar una demora sobre una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/delay` la atiende `SchedulingBookingsController.delay` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:545). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `DelayBookingDto` (2 campos, 1 obligatorio). Delega en `SchedulingDelayService.delayBooking`. Crea filas en audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza audit.appointment_bookings_history, community.public_profiles, iam.devices, messaging.notification_requests. Lee audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications y 15 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:545` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:545` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.recordDelay → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.recordDelay → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.recordDelay → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.resolveRecipient → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:168` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:171` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.delay → SchedulingDelayService.delayBooking → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:245` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DelayBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `delayMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(MIN_DELAY_MINUTES)` | Minutos de demora estimados | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:729` |
| `message` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(MAX_DELAY_MESSAGE_LENGTH)` | Mensaje del profesional para el paciente | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:742` |

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
| `notified` | `number` | Sí | — | — | Pacientes que recibieron el aviso | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:808` |
| `affected` | `number` | Sí | — | — | Citas alcanzadas por la demora | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:814` |
| `bookingIds` | `array<string>` | Sí | formato uuid | — | Las citas alcanzadas, para que la pantalla pueda decir cuáles fueron. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:820` |
| `detail` | `string` | Sí | — | — | Qué pasó, en una frase. Incluye por qué un aviso no llegó cuando no llegó. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:826` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una demora mayor a cuatro horas se resuelve reprogramando la cita, no avisando |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:227` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /scheduling/bookings/{id}/payment-receipts

- **Origen:** CONTRATO
- **Nombre:** Listar los comprobantes de pago de una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.listPaymentReceipts` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:335`

### Qué es y para qué sirve (negocio)

Listar los comprobantes de pago de una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings/{id}/payment-receipts` la atiende `SchedulingBookingsController.listPaymentReceipts` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:335). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingPaymentReceiptsService.list`. Lee common.file_versions, common.files, iam.users, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, scheduling.appointment_bookings, scheduling.appointment_payment_receipts y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:335` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:335` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:92` |
| `common.files` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:85` |
| `iam.users` | LEE | LEE | POR_SQL | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.project → SchedulingPaymentReceiptsRepository.findUserDisplayNames | `src/modules/scheduling/infrastructure/repositories/scheduling-payment-receipts.repository.ts:63` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.loadForReading → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.loadForReading → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.loadForReading → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.loadForReading → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.appointment_payment_receipts` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → SchedulingPaymentReceiptsRepository.findForBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-payment-receipts.repository.ts:14` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.listPaymentReceipts → SchedulingPaymentReceiptsService.list → ListPaymentReceiptsUseCase.execute → PaymentReceiptAccess.loadForReading → PaymentReceiptAccess.loadForReviewer → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PaymentReceiptDto[]>` · DTO `PaymentReceiptDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1239` |
| `bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1242` |
| `fileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1245` |
| `mimeType` | `string` | Sí | valores: image/png, image/jpeg, image/webp, application/pdf | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1250` |
| `originalName` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1253` |
| `amount` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1257` |
| `paidAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1260` |
| `note` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1263` |
| `uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1266` |
| `uploadedBy` | `PaymentReceiptActorDto` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1269` |
| `uploadedBy.userId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1230` |
| `uploadedBy.displayName` | `string` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1233` |
| `status` | `string` | Sí | valores: PENDING, CONFIRMED, REJECTED | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1272` |
| `reviewedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1275` |
| `reviewedBy` | `PaymentReceiptActorDto` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1278` |
| `reviewedBy.userId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `reviewedBy.displayName` | `string` | Sí | — | — | — | sin fuente |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1281` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /scheduling/bookings/{id}/payment-receipts

- **Origen:** CONTRATO
- **Nombre:** Subir el comprobante de pago de una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.uploadPaymentReceipt` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:313`

### Qué es y para qué sirve (negocio)

Subir el comprobante de pago de una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/payment-receipts` la atiende `SchedulingBookingsController.uploadPaymentReceipt` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:313). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `UploadPaymentReceiptDto` (4 campos, 1 obligatorio). Delega en `SchedulingPaymentReceiptsService.upload`. Crea filas en community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.appointment_payment_receipts. Actualiza community.public_profiles, iam.devices, messaging.notification_requests. Lee common.file_versions, common.files, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices y 19 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:313` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:313` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:92` |
| `common.files` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:85` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → PaymentReceiptAccess.loadForPatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → PaymentReceiptAccess.loadForPatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → PaymentReceiptAccess.loadForPatient → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.appointment_payment_receipts` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/upload-payment-receipt.use-case.ts:89` |
| `scheduling.appointment_payment_receipts` | ESCRIBE | GUARDA | POR_TIPO | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/upload-payment-receipt.use-case.ts:103` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → SchedulingBookingsRepository.findPaymentStateForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:415` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:171` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.uploadPaymentReceipt → SchedulingPaymentReceiptsService.upload → UploadPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptUploaded → SchedulingNoticeRepository.findResourceAccount | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:271` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UploadPaymentReceiptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo del comprobante (png, jpeg, webp o pdf, hasta 5 MB), subido por quien lo adjunta. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1179` |
| `amount` | `string` | No | patrón runtime /^\d{1,10}(\.\d{1,2})?$/ | `@IsOptional()` `@IsString()` `@Matches(/^\d{1,10}(\.\d{1,2})?$/, { message: 'amount debe ser un monto decimal con hasta dos decimales', })` | Monto declarado, como texto decimal con hasta dos decimales | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1196` |
| `paidAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1202` |
| `note` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(MAX_RECEIPT_TEXT_LENGTH)` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1209` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "amount": "150.00",
  "paidAt": "2026-07-31T12:00:00.000Z",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PaymentReceiptDto>` · DTO `PaymentReceiptDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1239` |
| `bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1242` |
| `fileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1245` |
| `mimeType` | `string` | Sí | valores: image/png, image/jpeg, image/webp, application/pdf | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1250` |
| `originalName` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1253` |
| `amount` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1257` |
| `paidAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1260` |
| `note` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1263` |
| `uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1266` |
| `uploadedBy` | `PaymentReceiptActorDto` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1269` |
| `uploadedBy.userId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1230` |
| `uploadedBy.displayName` | `string` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1233` |
| `status` | `string` | Sí | valores: PENDING, CONFIRMED, REJECTED | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1272` |
| `reviewedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1275` |
| `reviewedBy` | `PaymentReceiptActorDto` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1278` |
| `reviewedBy.userId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `reviewedBy.displayName` | `string` | Sí | — | — | — | sin fuente |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1281` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {labels.notFound} |
| 409 | `CONFLICT` | ConflictException: La cita ya está pagada: no hace falta otro comprobante. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una cita cancelada o rechazada no lleva pago: no hay comprobante que subir.; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: El comprobante supera los 5 MB; PreconditionFailedException: El comprobante no es un archivo suyo que se pueda adjuntar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar un comprobante de pago
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.confirmPaymentReceipt` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:384`

### Qué es y para qué sirve (negocio)

Confirmar un comprobante de pago. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/confirm` la atiende `SchedulingBookingsController.confirmPaymentReceipt` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:384). Exige sesión con alguno de los roles PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingPaymentReceiptsService.confirm`. Crea filas en community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza community.public_profiles, iam.devices, messaging.notification_requests, scheduling.appointment_payment_receipts. Lee common.file_versions, common.files, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices y 18 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:384` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, receiptId | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:384` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:92` |
| `common.files` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:85` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.resolveRecipient → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:168` |
| `scheduling.appointment_payment_receipts` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/confirm-payment-receipt.use-case.ts:109` |
| `scheduling.appointment_payment_receipts` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → PaymentReceiptAccess.receiptOf → SchedulingPaymentReceiptsRepository.findOfBookingForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-payment-receipts.repository.ts:44` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → SchedulingBookingsRepository.findPaymentState | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:455` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:171` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.confirmPaymentReceipt → SchedulingPaymentReceiptsService.confirm → ConfirmPaymentReceiptUseCase.execute → PaymentReceiptAccess.loadForReviewer → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `receiptId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmPaymentReceiptResponseDto>` · DTO `ConfirmPaymentReceiptResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `receipt` | `PaymentReceiptDto` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1287` |
| `receipt.id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1239` |
| `receipt.bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1242` |
| `receipt.fileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1245` |
| `receipt.mimeType` | `string` | Sí | valores: image/png, image/jpeg, image/webp, application/pdf | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1250` |
| `receipt.originalName` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1253` |
| `receipt.amount` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1257` |
| `receipt.paidAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1260` |
| `receipt.note` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1263` |
| `receipt.uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1266` |
| `receipt.uploadedBy` | `PaymentReceiptActorDto` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1269` |
| `receipt.uploadedBy.userId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1230` |
| `receipt.uploadedBy.displayName` | `string` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1233` |
| `receipt.status` | `string` | Sí | valores: PENDING, CONFIRMED, REJECTED | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1272` |
| `receipt.reviewedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1275` |
| `receipt.reviewedBy` | `PaymentReceiptActorDto` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1278` |
| `receipt.reviewedBy.userId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `receipt.reviewedBy.displayName` | `string` | Sí | — | — | — | sin fuente |
| `receipt.rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1281` |
| `paymentState` | `PaymentStateDto` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1290` |
| `paymentState.state` | `string` | Sí | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1134` |
| `paymentState.label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1138` |
| `paymentState.conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1142` |
| `paymentState.insuranceUsed` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1145` |
| `paymentState.markedByUserId` | `string` | Sí | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1149` |
| `paymentState.markedAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1153` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella.; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Comprobante no encontrado |
| 409 | `CONFLICT` | ConflictException: Ese comprobante ya se rechazó: no se puede confirmar. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /scheduling/bookings/{id}/payment-receipts/{receiptId}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar el archivo de un comprobante de pago
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.paymentReceiptContent` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:356`

### Qué es y para qué sirve (negocio)

Descargar el archivo de un comprobante de pago. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings/{id}/payment-receipts/{receiptId}/content` la atiende `SchedulingBookingsController.paymentReceiptContent` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:356). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingPaymentReceiptsService.content`. Lee common.file_versions, common.files, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, scheduling.appointment_bookings, scheduling.appointment_payment_receipts, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:356` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, receiptId | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:356` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → CommonPaymentReceiptFilesAdapter.download → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → CommonPaymentReceiptFilesAdapter.download → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → PaymentReceiptAccess.loadForReading → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → PaymentReceiptAccess.loadForReading → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → PaymentReceiptAccess.loadForReading → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → PaymentReceiptAccess.loadForReading → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.appointment_payment_receipts` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → PaymentReceiptAccess.receiptOf → SchedulingPaymentReceiptsRepository.findOfBookingForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-payment-receipts.repository.ts:44` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.paymentReceiptContent → SchedulingPaymentReceiptsService.content → GetPaymentReceiptContentUseCase.execute → PaymentReceiptAccess.loadForReading → PaymentReceiptAccess.loadForReviewer → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `receiptId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Comprobante no encontrado; ResourceNotFoundException: Archivo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo del comprobante ya no es de un formato que se pueda mostrar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar un comprobante de pago
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.rejectPaymentReceipt` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:406`

### Qué es y para qué sirve (negocio)

Rechazar un comprobante de pago. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/reject` la atiende `SchedulingBookingsController.rejectPaymentReceipt` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:406). Exige sesión con alguno de los roles PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT. Valida el cuerpo como `RejectPaymentReceiptDto` (1 campo, 1 obligatorio). Delega en `SchedulingPaymentReceiptsService.reject`. Crea filas en community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza community.public_profiles, iam.devices, messaging.notification_requests, scheduling.appointment_payment_receipts. Lee common.file_versions, common.files, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices y 17 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:406` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, receiptId | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:406` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:92` |
| `common.files` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → PaymentReceiptAccess.project → CommonPaymentReceiptFilesAdapter.describe | `src/modules/scheduling/infrastructure/adapters/common-payment-receipt-files.adapter.ts:85` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.resolveRecipient → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:168` |
| `scheduling.appointment_payment_receipts` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/reject-payment-receipt.use-case.ts:73` |
| `scheduling.appointment_payment_receipts` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → PaymentReceiptAccess.receiptOf → SchedulingPaymentReceiptsRepository.findOfBookingForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-payment-receipts.repository.ts:44` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → BookingChangeNotifier.notifyReceiptReviewed → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:171` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.rejectPaymentReceipt → SchedulingPaymentReceiptsService.reject → RejectPaymentReceiptUseCase.execute → PaymentReceiptAccess.loadForReviewer → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `receiptId` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectPaymentReceiptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud mínima 3; longitud máxima 500 | `@IsString()` `@MinLength(MIN_RECEIPT_REJECTION_LENGTH)` `@MaxLength(MAX_RECEIPT_TEXT_LENGTH)` | Motivo del rechazo. Obligatorio: el paciente lo lee para saber qué volver a subir. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1224` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<PaymentReceiptDto>` · DTO `PaymentReceiptDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1239` |
| `bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1242` |
| `fileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1245` |
| `mimeType` | `string` | Sí | valores: image/png, image/jpeg, image/webp, application/pdf | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1250` |
| `originalName` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1253` |
| `amount` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1257` |
| `paidAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1260` |
| `note` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1263` |
| `uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1266` |
| `uploadedBy` | `PaymentReceiptActorDto` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1269` |
| `uploadedBy.userId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1230` |
| `uploadedBy.displayName` | `string` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1233` |
| `status` | `string` | Sí | valores: PENDING, CONFIRMED, REJECTED | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1272` |
| `reviewedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1275` |
| `reviewedBy` | `PaymentReceiptActorDto` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1278` |
| `reviewedBy.userId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `reviewedBy.displayName` | `string` | Sí | — | — | — | sin fuente |
| `rejectionReason` | `string` | Sí | admite null | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1281` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella.; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Comprobante no encontrado |
| 409 | `CONFLICT` | ConflictException: Ese comprobante ya se confirmó: no se puede rechazar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /scheduling/bookings/{id}/payment-state

- **Origen:** CONTRATO
- **Nombre:** Leer el estado de pago de una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.getPaymentState` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:293`

### Qué es y para qué sirve (negocio)

Leer el estado de pago de una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/bookings/{id}/payment-state` la atiende `SchedulingBookingsController.getPaymentState` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:293). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingBookingsService.getPaymentState`. Lee scheduling.appointment_bookings, scheduling.appointment_payment_states, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:293` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:293` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.getPaymentState → SchedulingBookingsService.getPaymentState → GetPaymentStateUseCase.execute → BookingAccess.loadForOperation → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | SchedulingBookingsController.getPaymentState → SchedulingBookingsService.getPaymentState → GetPaymentStateUseCase.execute → SchedulingBookingsRepository.findPaymentState | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:455` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.getPaymentState → SchedulingBookingsService.getPaymentState → GetPaymentStateUseCase.execute → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PaymentStateDto | null>` · DTO `PaymentStateDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1134` |
| `label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1138` |
| `conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1142` |
| `insuranceUsed` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1145` |
| `markedByUserId` | `string` | Sí | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1149` |
| `markedAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1153` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. PUT /scheduling/bookings/{id}/payment-state

- **Origen:** CONTRATO
- **Nombre:** Marcar el estado de pago de una cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.setPaymentState` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:266`

### Qué es y para qué sirve (negocio)

Marcar el estado de pago de una cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PUT /scheduling/bookings/{id}/payment-state` la atiende `SchedulingBookingsController.setPaymentState` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:266). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `SetPaymentStateDto` (2 campos, 1 obligatorio). Delega en `SchedulingBookingsService.setPaymentState`. Lee scheduling.appointment_bookings, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:266` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:266` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState → SetPaymentStateUseCase.execute → BookingAccess.loadForOperation → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.setPaymentState → SchedulingBookingsService.setPaymentState → SetPaymentStateUseCase.execute → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SetPaymentStateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | valores: PENDING, PARTIALLY_PAID, PAID | `@IsIn(PAYMENT_STATES)` | Estado de pago de la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1105` |
| `insuranceUsed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca de que la cita se cubrió con seguro | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1121` |

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
  "insuranceUsed": false
}
```

</details>

### Respuesta — `Promise<PaymentStateDto>` · DTO `PaymentStateDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | valores: PENDING, PARTIALLY_PAID, PAID | — | Clave estable del estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1134` |
| `label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1138` |
| `conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1142` |
| `insuranceUsed` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1145` |
| `markedByUserId` | `string` | Sí | formato uuid | — | Quién la dejó en este estado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1149` |
| `markedAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:1153` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /scheduling/bookings/{id}/propose-schedule

- **Origen:** CONTRATO
- **Nombre:** Proponer otro horario para la solicitud
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.proposeSchedule` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:212`

### Qué es y para qué sirve (negocio)

Proponer otro horario para la solicitud. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/propose-schedule` la atiende `SchedulingBookingsController.proposeSchedule` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:212). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `ProposeScheduleDto` (2 campos, 2 obligatorios). Delega en `SchedulingBookingsService.proposeSchedule`. Crea filas en audit.appointment_bookings_history, scheduling.booking_reschedules. Actualiza audit.appointment_bookings_history, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:212` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:212` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/propose-schedule.use-case.ts:119` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → BookingAccess.loadForOperation → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/propose-schedule.use-case.ts:107` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.booking_reschedules` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → SchedulingBookingsRepository.recordReschedule | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:730` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → ServiceSlotLifecycle.assertNotAService → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.proposeSchedule → SchedulingBookingsService.proposeSchedule → ProposeScheduleUseCase.execute → ServiceSlotLifecycle.assertNotAService → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ProposeScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proposedSlotId` | `string` | Sí | formato uuid | `@IsUUID()` | Cupo propuesto | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:669` |
| `reasonText` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Motivo de la propuesta | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:675` |

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
| `bookingId` | `string` | Sí | formato uuid | — | Solicitud sobre la que se propuso. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:682` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó (concept id): sigue pendiente. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:686` |
| `fromSlotId` | `string` | Sí | formato uuid | — | Cupo que se liberó. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:690` |
| `toSlotId` | `string` | Sí | formato uuid | — | Cupo que quedó tomado. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:694` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cita es de otra agenda: solo la opera quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Cupo propuesto no encontrado |
| 409 | `CONFLICT` | ConflictException: El cupo propuesto no tiene lugar |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se opera así sobre una solicitud pendiente; PreconditionFailedException: Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario.; PreconditionFailedException: Todavía no se puede {action} un turno de horario flexible: cancele la reserva y pida otra hora.; PreconditionFailedException: El horario propuesto es el que ya tiene la solicitud; PreconditionFailedException: Transición de estado de cita no permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /scheduling/bookings/{id}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar la solicitud de cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.reject` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:233`

### Qué es y para qué sirve (negocio)

Rechazar la solicitud de cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/reject` la atiende `SchedulingBookingsController.reject` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:233). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `RejectBookingDto` (1 campo, 1 obligatorio). Delega en `SchedulingBookingsService.reject`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, iam.devices, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.waitlist_entries. Lee audit.appointment_bookings_history, iam.authentication_credentials, iam.devices, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries y 16 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:233` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:233` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction | `src/modules/scheduling/application/bookings/use-cases/cancel-booking.use-case.ts:286` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction | `src/modules/scheduling/application/bookings/use-cases/cancel-booking.use-case.ts:298` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1213` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |
| `scheduling.waitlist_entries` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.promoteWaitlistFor → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:212` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingBookingsController.reject → SchedulingBookingsService.reject → RejectBookingUseCase.execute → CancelBookingUseCase.execute → CancelBookingUseCase.promoteWaitlistFor → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:210` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | longitud mínima 5; longitud máxima 500 | `@IsString()` `@MinLength(MIN_REASON_LENGTH)` `@MaxLength(MAX_REASON_LENGTH)` | Motivo del rechazo. Obligatorio: el paciente lo ve en el detalle de su turno. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:266` |

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
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:418` |
| `feeAmount` | `string` | No | — | — | Cargo aplicado, si la política lo contempla | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:427` |
| `capacityReleased` | `boolean` | Sí | — | — | Cupo devuelto al slot | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:433` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /scheduling/bookings/{id}/reminders

- **Origen:** CONTRATO
- **Nombre:** Programar recordatorios para la cita
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.scheduleReminders` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:567`

### Qué es y para qué sirve (negocio)

Programar recordatorios para la cita. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/reminders` la atiende `SchedulingBookingsController.scheduleReminders` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:567). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT. Valida el cuerpo como `ScheduleRemindersDto` (2 campos, 1 obligatorio). Delega en `SchedulingWaitlistService.scheduleReminders`. Crea filas en scheduling.appointment_reminders. Lee scheduling.appointment_bookings, scheduling.bookable_slots.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:567` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:567` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.scheduleReminders → SchedulingWaitlistService.scheduleReminders → PostgresWaitlistAdapter.findBookingScheduleForUpdate → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.scheduleReminders → SchedulingWaitlistService.scheduleReminders → PostgresWaitlistAdapter.scheduleReminders → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1311` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.scheduleReminders → SchedulingWaitlistService.scheduleReminders → PostgresWaitlistAdapter.findBookingScheduleForUpdate → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:226` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ScheduleRemindersDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `offsetsMinutes` | `array<number>` | Sí | mínimo 0 | `@IsArray()` `@IsInt({ each: true })` `@Min(0, { each: true })` | Minutos de antelación de cada recordatorio | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:548` |
| `channel` | `string` | No | valores: SMS, EMAIL | `@IsOptional()` `@IsIn(['SMS', 'EMAIL'])` | Canal de envío | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:560` |

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
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:571` |
| `scheduled` | `number` | Sí | — | — | Valor de scheduled mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:577` |

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
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:271` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /scheduling/bookings/{id}/request-info

- **Origen:** CONTRATO
- **Nombre:** Pedir documentación u orden médica antes de aceptar
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.requestInfo` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:184`

### Qué es y para qué sirve (negocio)

Pedir documentación u orden médica antes de aceptar. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/request-info` la atiende `SchedulingBookingsController.requestInfo` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:184). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `RequestBookingInfoDto` (2 campos, 2 obligatorios). Delega en `SchedulingBookingsService.requestInfo`. Crea filas en audit.appointment_bookings_history. Actualiza audit.appointment_bookings_history, scheduling.appointment_bookings. Lee audit.appointment_bookings_history, scheduling.appointment_bookings, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:184` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → RequestBookingInfoUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → RequestBookingInfoUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → RequestBookingInfoUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → RequestBookingInfoUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/request-booking-info.use-case.ts:75` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → RequestBookingInfoUseCase.execute → BookingAccess.loadForOperation → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.requestInfo → SchedulingBookingsService.requestInfo → RequestBookingInfoUseCase.execute → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RequestBookingInfoDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `infoRequested` | `string` | Sí | valores: DOCUMENTATION, MEDICAL_ORDER, PREPARATION | `@IsIn(BOOKING_INFO_REQUESTS as readonly string[])` | Qué falta antes de poder aceptar | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:650` |
| `reasonText` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Mensaje para el paciente | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:661` |

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
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:281` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:290` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:296` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:313` |

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

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /scheduling/bookings/{id}/reschedule

- **Origen:** CONTRATO
- **Nombre:** Reprogramar la cita a otro slot
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.reschedule` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:479`

### Qué es y para qué sirve (negocio)

Reprogramar la cita a otro slot. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/reschedule` la atiende `SchedulingBookingsController.reschedule` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:479). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Valida el cuerpo como `RescheduleBookingDto` (2 campos, 2 obligatorios). Delega en `SchedulingBookingsService.reschedule`. Crea filas en audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.booking_reschedules. Actualiza audit.appointment_bookings_history, community.public_profiles, iam.devices, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications y 20 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:479` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:479` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/reschedule-booking.use-case.ts:189` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → SchedulingProfessionalTimeService.assertRangeFree → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/reschedule-booking.use-case.ts:177` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.booking_reschedules` | ESCRIBE | CREA | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → SchedulingBookingsRepository.recordReschedule | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:730` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → ServiceSlotLifecycle.assertNotAService → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingBookingsController.reschedule → SchedulingBookingsService.reschedule → RescheduleBookingUseCase.execute → ServiceSlotLifecycle.assertNotAService → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RescheduleBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `toSlotId` | `string` | Sí | formato uuid | `@IsUUID()` | Slot destino | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:323` |
| `reasonText` | `string` | Sí | longitud mínima 5; longitud máxima 500 | `@IsString()` `@MinLength(MIN_REASON_LENGTH)` `@MaxLength(MAX_REASON_LENGTH)` | Motivo del cambio. Obligatorio: se le muestra a la otra parte en el detalle de la cita. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:341` |

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
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:352` |
| `fromSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a from slot. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:358` |
| `toSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a to slot. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:364` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cita no encontrada; ResourceNotFoundException: Slot destino no encontrado |
| 409 | `CONFLICT` | ConflictException: El slot destino no tiene cupos |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se reprograma una cita vigente; PreconditionFailedException: Todavía no se puede {action} un servicio: cancele la reserva y pida otro horario.; PreconditionFailedException: Todavía no se puede {action} un turno de horario flexible: cancele la reserva y pida otra hora.; PreconditionFailedException: El slot destino es el mismo que el actual; PreconditionFailedException: El paciente ya tiene una cita confirmada a esa hora{clash.resourceName ? ` en «${…}.; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:280` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:242` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `A1`

---

## 24. POST /scheduling/bookings/{id}/start

- **Origen:** CONTRATO
- **Nombre:** Iniciar la atención
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingBookingsController.start` — `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:434`

### Qué es y para qué sirve (negocio)

Iniciar la atención. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/bookings/{id}/start` la atiende `SchedulingBookingsController.start` (src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:434). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingBookingsService.start`. Crea filas en audit.appointment_bookings_history. Actualiza audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings. Lee audit.appointment_bookings_history, clinical.appointments, scheduling.appointment_bookings, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:434` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:434` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `clinical.appointments` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus | `src/modules/scheduling/infrastructure/adapters/clinical-appointments.adapter.ts:39` |
| `clinical.appointments` | LEE | LEE | DIRECTA | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute → ClinicalAppointmentSync.syncClinicalAppointment → ClinicalAppointmentsAdapter.updateStatus → AppointmentsRepository.findById | `src/modules/clinical/repositories/appointments.repository.ts:107` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/start-appointment.use-case.ts:48` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute → BookingAccess.loadForOperation → SchedulingBookingsRepository.findBookingByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:396` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingBookingsController.start → SchedulingBookingsService.start → StartAppointmentUseCase.execute → BookingAccess.loadForOperation → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BookingDecisionResponseDto>` · DTO `BookingDecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bookingId` | `string` | Sí | formato uuid | — | Identificador asociado a booking. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:281` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que quedó la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:290` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:296` |
| `desplazadas` | `array<object>` | Sí | formato uuid | — | Citas pendientes que quedaron canceladas por chocar con ésta | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:313` |

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

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingBookingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. GET /scheduling/confirmation-rules

- **Origen:** CONTRATO
- **Nombre:** Listar las reglas de un tenant
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.list` — `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:77`

### Qué es y para qué sirve (negocio)

Listar las reglas de un tenant. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/confirmation-rules` la atiende `SchedulingConfirmationController.list` (src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:77). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Delega en `SchedulingConfirmationService.listRules`. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.list → SchedulingConfirmationService.listRules → SchedulingConfirmationRepository.findRulesByTenant | `src/modules/scheduling/infrastructure/repositories/scheduling-confirmation.repository.ts:113` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:149` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /scheduling/confirmation-rules

- **Origen:** CONTRATO
- **Nombre:** Crear una regla de confirmación
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.create` — `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:54`

### Qué es y para qué sirve (negocio)

Crear una regla de confirmación. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules` la atiende `SchedulingConfirmationController.create` (src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:54). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Valida el cuerpo como `CreateConfirmationRuleDto` (8 campos, 5 obligatorios). Delega en `SchedulingConfirmationService.createRule`. Crea filas en scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | ESCRIBE | CREA | DIRECTA | SchedulingConfirmationController.create → SchedulingConfirmationService.createRule → SchedulingConfirmationRepository.createRule | `src/modules/scheduling/infrastructure/repositories/scheduling-confirmation.repository.ts:63` |

### Cuerpo — DTO `CreateConfirmationRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:36` |
| `scope` | `string` | Sí | valores: TENANT, PRACTICE, RESOURCE, SERVICE | `@IsIn(RULE_SCOPES as readonly string[])` | Tipo de alcance de la regla | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:46` |
| `scopeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Alcance concreto (practice/resource/service). Omitido = todo el tipo. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:58` |
| `priority` | `number` | No | — | `@IsOptional()` `@IsInt()` | Menor número = mayor prioridad | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:69` |
| `effectiveFrom` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:76` |
| `effectiveTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:84` |
| `condition` | `object` | Sí | — | `@IsObject()` | Condición determinista { field, op, value } o combinador all/any/not. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:95` |
| `decision` | `string` | Sí | valores: AUTO_CONFIRM, AUTO_REJECT, MANUAL_REVIEW | `@IsIn(RULE_DECISIONS as readonly string[])` | Decisión de la regla | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:102` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:149` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /scheduling/confirmation-rules/{id}/activate

- **Origen:** CONTRATO
- **Nombre:** Reactivar una regla desactivada
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.activate` — `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:96`

### Qué es y para qué sirve (negocio)

Reactivar una regla desactivada. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules/{id}/activate` la atiende `SchedulingConfirmationController.activate` (src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:96). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Delega en `SchedulingConfirmationService.activateRule`. Actualiza scheduling.booking_confirmation_rules. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:96` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingConfirmationController.activate → SchedulingConfirmationService.activateRule → SchedulingConfirmationService.setEnabled | `src/modules/scheduling/application/confirmation/scheduling-confirmation.service.ts:156` |
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.activate → SchedulingConfirmationService.activateRule → SchedulingConfirmationService.setEnabled → SchedulingConfirmationRepository.findRuleByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-confirmation.repository.ts:93` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmationRuleResponseDto>` · DTO `ConfirmationRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:149` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /scheduling/confirmation-rules/{id}/deactivate

- **Origen:** CONTRATO
- **Nombre:** Desactivar una regla (sin borrado duro)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.deactivate` — `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:119`

### Qué es y para qué sirve (negocio)

Desactivar una regla (sin borrado duro). Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules/{id}/deactivate` la atiende `SchedulingConfirmationController.deactivate` (src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:119). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Delega en `SchedulingConfirmationService.deactivateRule`. Actualiza scheduling.booking_confirmation_rules. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:119` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingConfirmationController.deactivate → SchedulingConfirmationService.deactivateRule → SchedulingConfirmationService.setEnabled | `src/modules/scheduling/application/confirmation/scheduling-confirmation.service.ts:156` |
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.deactivate → SchedulingConfirmationService.deactivateRule → SchedulingConfirmationService.setEnabled → SchedulingConfirmationRepository.findRuleByIdForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-confirmation.repository.ts:93` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmationRuleResponseDto>` · DTO `ConfirmationRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:113` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a scope type concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:119` |
| `scopeId` | `string` | No | formato uuid | — | Identificador asociado a scope. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:125` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:131` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:137` |
| `enabled` | `boolean` | Sí | — | — | Valor de enabled mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:143` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:149` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /scheduling/confirmation-rules/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar una solicitud de reserva contra las reglas vigentes
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingConfirmationController.evaluate` — `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:141`

### Qué es y para qué sirve (negocio)

Evaluar una solicitud de reserva contra las reglas vigentes. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/confirmation-rules/evaluate` la atiende `SchedulingConfirmationController.evaluate` (src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:141). Exige sesión con alguno de los roles SCHEDULING_ADMIN. Valida el cuerpo como `EvaluateBookingRequestDto` (5 campos, 2 obligatorios). Delega en `SchedulingConfirmationService.evaluateBookingRequest`. Lee scheduling.booking_confirmation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN | `src/modules/scheduling/presentation/controllers/scheduling-confirmation.controller.ts:141` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.booking_confirmation_rules` | LEE | LEE | DIRECTA | SchedulingConfirmationController.evaluate → SchedulingConfirmationService.evaluateBookingRequest → SchedulingConfirmationRepository.findActiveRules | `src/modules/scheduling/infrastructure/repositories/scheduling-confirmation.repository.ts:130` |

### Cuerpo — DTO `EvaluateBookingRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:159` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Práctica de la solicitud | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:170` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Recurso de la solicitud | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:181` |
| `serviceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio de la solicitud | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:192` |
| `requestData` | `object` | Sí | — | `@IsObject()` | Datos congelados de la solicitud sobre los que se evalúan las condiciones. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:203` |

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
| `decision` | `string` | Sí | valores: AUTO_CONFIRM, AUTO_REJECT, MANUAL_REVIEW | — | Decisión determinista | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:259` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:265` |
| `explanation` | `EvaluationExplanationDto` | Sí | — | — | Valor de explanation mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:271` |
| `explanation.ruleId` | `string` | No | formato uuid | — | Regla aplicada; ausente si ninguna resultó concluyente. | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:215` |
| `explanation.ruleVersion` | `number` | No | — | — | Versión de la regla aplicada | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:221` |
| `explanation.reason` | `string` | Sí | — | — | Motivo de la decisión | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:227` |
| `explanation.variables` | `object` | Sí | — | — | Variables congeladas usadas en la evaluación | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:236` |
| `explanation.evaluatedRuleIds` | `array<string>` | Sí | — | — | Ids de reglas evaluadas antes de concluir | `src/modules/scheduling/presentation/dto/scheduling-confirmation.dto.ts:245` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingConfirmationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /scheduling/exception-types

- **Origen:** CONTRATO
- **Nombre:** Listar los motivos de bloqueo de agenda
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listExceptionTypes` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:531`

### Qué es y para qué sirve (negocio)

Listar los motivos de bloqueo de agenda. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/exception-types` la atiende `SchedulingController.listExceptionTypes` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:531). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingCatalogService.listExceptionTypes`. No toca tablas relacionales: Devuelve el catálogo de motivos de bloqueo, que vive en constantes del código (EXCEPTION_TYPES y sus etiquetas); no accede a datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:531` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

No toca tablas relacionales: Devuelve el catálogo de motivos de bloqueo, que vive en constantes del código (EXCEPTION_TYPES y sus etiquetas); no accede a datos.. _(manual, 2026-10-21; fuente: `src/modules/scheduling/services/scheduling-catalog.service.ts:1091`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ExceptionTypeListDto` · DTO `ExceptionTypeListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ExceptionTypeDto>` | Sí | — | — | Los motivos, en el orden en que se muestran. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1126` |
| `items[].type` | `object` | Sí | — | — | Clave estable con la que se envía al crear la excepción. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1092` |
| `items[].conceptId` | `string` | Sí | formato uuid | — | El concepto real detrás, por si el cliente lo necesita. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1096` |
| `items[].label` | `string` | Sí | — | — | Cómo se llama en pantalla, en castellano. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1100` |
| `items[].requiresText` | `boolean` | Sí | — | — | true en «Otro»: exige texto libre | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1109` |
| `items[].blocks` | `boolean` | Sí | — | — | false en la atención extraordinaria | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1119` |

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
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:95` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. DELETE /scheduling/exceptions/{id}

- **Origen:** CONTRATO
- **Nombre:** Eliminar una excepción de disponibilidad
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.removeException` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:603`

### Qué es y para qué sirve (negocio)

Eliminar una excepción de disponibilidad. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /scheduling/exceptions/{id}` la atiende `SchedulingController.removeException` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:603). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.removeException`. Borra de scheduling.availability_exceptions. Lee scheduling.availability_exceptions, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:603` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:603` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.availability_exceptions` | BORRA | BORRA | POR_TIPO | SchedulingController.removeException → SchedulingCatalogService.removeException → RemoveExceptionUseCase.execute → SchedulingCatalogRepository.removeException | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:715` |
| `scheduling.availability_exceptions` | LEE | LEE | DIRECTA | SchedulingController.removeException → SchedulingCatalogService.removeException → RemoveExceptionUseCase.execute → SchedulingCatalogRepository.findExceptionById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:705` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.removeException → SchedulingCatalogService.removeException → RemoveExceptionUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. PATCH /scheduling/exceptions/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una excepción de disponibilidad
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.updateException` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:575`

### Qué es y para qué sirve (negocio)

Editar una excepción de disponibilidad. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /scheduling/exceptions/{id}` la atiende `SchedulingController.updateException` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:575). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `UpdateExceptionDto` (4 campos, 0 obligatorios). Delega en `SchedulingCatalogService.updateException`. Actualiza scheduling.availability_exceptions, scheduling.bookable_slots. Lee scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:575` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:575` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.availability_exceptions` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.updateException → SchedulingCatalogService.updateException → UpdateExceptionUseCase.execute | `src/modules/scheduling/application/catalog/use-cases/update-exception.use-case.ts:170` |
| `scheduling.availability_exceptions` | LEE | LEE | DIRECTA | SchedulingController.updateException → SchedulingCatalogService.updateException → UpdateExceptionUseCase.execute → SchedulingCatalogRepository.findExceptionById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:705` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.updateException → SchedulingCatalogService.updateException → UpdateExceptionUseCase.execute | `src/modules/scheduling/application/catalog/use-cases/update-exception.use-case.ts:188` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.updateException → SchedulingCatalogService.updateException → UpdateExceptionUseCase.execute → SchedulingCatalogRepository.findOpenSlotsInWindow | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1159` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.updateException → SchedulingCatalogService.updateException → UpdateExceptionUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateExceptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exceptionType` | `string` | No | valores: ABSENCE, HOLIDAY, VACATION, CONFERENCE, ERRAND, EXTRA, OTHER | `@IsOptional()` `@IsIn(EXCEPTION_TYPES)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1353` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1359` |
| `startAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1364` |
| `endAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1369` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "exceptionType": "ABSENCE",
  "reason": "Texto descriptivo de ejemplo",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<UpdateExceptionResponseDto>` · DTO `UpdateExceptionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | El MISMO id que antes: editar no borra y recrea. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1376` |
| `startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1379` |
| `endAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1382` |
| `blockedSlots` | `number` | Sí | — | — | Cupos que se cerraron porque el rango creció. Achicar el rango **no reabre ninguno**, y por eso no hay campo para eso: en este módulo los cupos sólo los crea publicar el horario. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1391` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Excepción no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloqueo termina antes de empezar; PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:275` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. POST /scheduling/holds/{holdToken}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar la cita a partir de la reserva temporal
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.confirmBooking` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:710`

### Qué es y para qué sirve (negocio)

Confirmar la cita a partir de la reserva temporal. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/holds/{holdToken}/confirm` la atiende `SchedulingController.confirmBooking` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:710). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `ConfirmBookingDto` (5 campos, 3 obligatorios). Delega en `SchedulingBookingsService.confirmBooking`. Crea filas en clinical.appointments, scheduling.appointment_bookings, scheduling.appointment_reminders. Actualiza scheduling.bookable_slots, scheduling.slot_holds. Lee billing.service_catalog, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.persons, scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:710` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: holdToken | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:710` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingServiceAgendaService.offeringOfSlot → SchedulingOfferingsRepository.findCatalogItem | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:124` |
| `clinical.appointments` | ESCRIBE | CREA | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → ClinicalAppointmentSync.createClinicalAppointment → ClinicalAppointmentsAdapter.create → AppointmentsRepository.create | `src/modules/clinical/repositories/appointments.repository.ts:78` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | POR_SQL | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingProfessionalTimeService.assertRangeFree → SchedulingBookingsRepository.findPatientNames | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1107` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.createBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:292` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.findPatientBookingsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:819` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1311` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingProfessionalTimeService.assertRangeFree → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking | `src/modules/scheduling/application/bookings/support/booking-materializer.ts:280` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SlotPolicyResolver.resolvePolicy → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingServiceAgendaService.offeringOfSlot → SchedulingOfferingsRepository.findOfferingById | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:53` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SlotPolicyResolver.resolvePolicy → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |
| `scheduling.slot_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking | `src/modules/scheduling/application/bookings/support/booking-materializer.ts:276` |
| `scheduling.slot_holds` | LEE | LEE | DIRECTA | SchedulingController.confirmBooking → SchedulingBookingsService.confirmBooking → ConfirmBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.findHoldByTokenForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:257` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `holdToken` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfirmBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:107` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente titular de la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:114` |
| `channel` | `string` | Sí | valores: PORTAL, DESK, PHONE | `@IsIn(BOOKING_CHANNELS as readonly string[])` | Canal de la reserva | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:121` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo de consulta | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:130` |
| `reminderOffsetsMinutes` | `array<number>` | No | mínimo 0 | `@IsOptional()` `@IsArray()` `@IsInt({ each: true })` `@Min(0, { each: true })` | Minutos de antelación de los recordatorios a programar | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:148` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:204` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:210` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:216` |
| `remindersScheduled` | `number` | Sí | — | — | Recordatorios programados junto con la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva temporal no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La reserva temporal ya fue consumida o liberada; ConflictException: La reserva temporal expiró |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Cancélelo primero si quiere cambiarlo por éste.; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:260` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:149` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:281` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:110` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:257` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:177` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `P2`

---

## 34. POST /scheduling/holds/{holdToken}/request

- **Origen:** CONTRATO
- **Nombre:** Solicitar la cita a partir de la reserva temporal
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.requestBooking` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:739`

### Qué es y para qué sirve (negocio)

Solicitar la cita a partir de la reserva temporal. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/holds/{holdToken}/request` la atiende `SchedulingController.requestBooking` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:739). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `RequestBookingDto` (4 campos, 3 obligatorios). Delega en `SchedulingBookingsService.requestBooking`. Crea filas en clinical.appointments, community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.appointment_bookings y 1 más. Actualiza community.public_profiles, iam.devices, messaging.notification_requests, scheduling.bookable_slots, scheduling.slot_holds. Lee billing.service_catalog, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications y 22 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:739` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: holdToken | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:739` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingServiceAgendaService.offeringOfSlot → SchedulingOfferingsRepository.findCatalogItem | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:124` |
| `clinical.appointments` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → ClinicalAppointmentSync.createClinicalAppointment → ClinicalAppointmentsAdapter.create → AppointmentsRepository.create | `src/modules/clinical/repositories/appointments.repository.ts:78` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.createBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:292` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingChangeNotifier.notifyRequest → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:168` |
| `scheduling.appointment_reminders` | ESCRIBE | CREA | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.createReminder | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1311` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingProfessionalTimeService.assertRangeFree → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking | `src/modules/scheduling/application/bookings/support/booking-materializer.ts:280` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SlotPolicyResolver.resolvePolicy → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingServiceAgendaService.offeringOfSlot → SchedulingOfferingsRepository.findOfferingById | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:53` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SlotPolicyResolver.resolvePolicy → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |
| `scheduling.slot_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking | `src/modules/scheduling/application/bookings/support/booking-materializer.ts:276` |
| `scheduling.slot_holds` | LEE | LEE | DIRECTA | SchedulingController.requestBooking → SchedulingBookingsService.requestBooking → RequestBookingUseCase.execute → BookingMaterializer.materializeBooking → SchedulingBookingsRepository.findHoldByTokenForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:257` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `holdToken` | path | Sí | `string` | — |

### Cuerpo — DTO `RequestBookingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:165` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente que solicita la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:175` |
| `channel` | `string` | Sí | valores: PORTAL, DESK, PHONE | `@IsIn(BOOKING_CHANNELS as readonly string[])` | Canal de la solicitud | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:182` |
| `reasonText` | `string` | No | longitud máxima MAX_REASON_LENGTH | `@IsOptional()` `@IsString()` `@MaxLength(MAX_REASON_LENGTH)` | Motivo de consulta: por qué se pide el turno | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:193` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:204` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | Identificador asociado a bookable slot. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:210` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:216` |
| `remindersScheduled` | `number` | Sí | — | — | Recordatorios programados junto con la cita | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva temporal no encontrada; ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: La reserva temporal ya fue consumida o liberada; ConflictException: La reserva temporal expiró |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Ya tiene una cita confirmada ese día a esa hora{clash.resourceName ? ` en «${…}. Cancélelo primero si quiere cambiarlo por éste.; PreconditionFailedException: El profesional ya tiene {who} de {localTime( first.startAt, fir…} a {localTime( first.endAt, first…}{first.resourceName ? ` en «${…}. No puede estar en dos lug… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:341` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:264` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:197` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:197` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:322` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:103` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. POST /scheduling/internal/dispatch-reminders

- **Origen:** CONTRATO
- **Nombre:** Despachar los recordatorios cuya hora ya llegó
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.dispatchReminders` — `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:102`

### Qué es y para qué sirve (negocio)

Despachar los recordatorios cuya hora ya llegó. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/internal/dispatch-reminders` la atiende `SchedulingInternalController.dispatchReminders` (src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:102). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Valida el cuerpo como `WorkerBatchDto` (1 campo, 0 obligatorios). Delega en `SchedulingWaitlistService.dispatchReminders`. Crea filas en community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza community.public_profiles, iam.devices, messaging.notification_requests, scheduling.appointment_reminders. Lee community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications, iam.users y 15 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.resolveRecipient → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:168` |
| `scheduling.appointment_reminders` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → PostgresWaitlistAdapter.markRemindersSent | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:306` |
| `scheduling.appointment_reminders` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → PostgresWaitlistAdapter.markRemindersSent | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:302` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → SchedulingNoticeRepository.describeBooking | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:171` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingInternalController.dispatchReminders → SchedulingWaitlistService.dispatchReminders → SchedulingAgendaNoticesService.notifyReminders → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:245` |

### Cuerpo — DTO `WorkerBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño máximo del lote | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:604` |

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
| `processed` | `number` | Sí | — | — | Elementos procesados en el lote | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:586` |
| `detail` | `string` | Sí | — | — | Detalle de lo que hizo el worker | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:592` |

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
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:322` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /scheduling/internal/expire-holds

- **Origen:** CONTRATO
- **Nombre:** Liberar las reservas temporales vencidas
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.expireHolds` — `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:47`

### Qué es y para qué sirve (negocio)

Liberar las reservas temporales vencidas. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/internal/expire-holds` la atiende `SchedulingInternalController.expireHolds` (src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:47). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Valida el cuerpo como `WorkerBatchDto` (1 campo, 0 obligatorios). Delega en `SchedulingBookingsService.expireHolds`. Actualiza scheduling.bookable_slots, scheduling.slot_holds. Lee scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.practitioner_service_offerings, scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates, scheduling.slot_holds.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → ServiceSlotLifecycle.discardOneOffSlot → ServiceSlotLifecycle.reopenRetractedConsultationsOf → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.confirmedBookings → SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:896` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → ServiceSlotLifecycle.discardOneOffSlot → ServiceSlotLifecycle.reopenRetractedConsultationsOf → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/expire-holds.use-case.ts:47` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | POR_SQL | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → ServiceSlotLifecycle.discardOneOffSlot → ServiceSlotLifecycle.reopenRetractedConsultationsOf → SchedulingServiceAgendaService.reopenSpan → SchedulingServiceAgendaService.reopen → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:242` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → ServiceSlotLifecycle.isOneOffOnDemand → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → ServiceSlotLifecycle.isOneOffOnDemand → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → ServiceSlotLifecycle.isOneOffOnDemand → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |
| `scheduling.slot_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/expire-holds.use-case.ts:38` |
| `scheduling.slot_holds` | LEE | LEE | DIRECTA | SchedulingInternalController.expireHolds → SchedulingBookingsService.expireHolds → ExpireHoldsUseCase.execute → SchedulingBookingsRepository.findExpiredHolds | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:274` |

### Cuerpo — DTO `WorkerBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño máximo del lote | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:604` |

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
| `processed` | `number` | Sí | — | — | Elementos procesados en el lote | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:586` |
| `detail` | `string` | Sí | — | — | Detalle de lo que hizo el worker | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:592` |

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
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:304` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `A3`

---

## 37. POST /scheduling/internal/promote-waitlist/{slotId}

- **Origen:** CONTRATO
- **Nombre:** Promover candidatos de la lista de espera a un slot con cupo
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.promoteWaitlist` — `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:82`

### Qué es y para qué sirve (negocio)

Promover candidatos de la lista de espera a un slot con cupo. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/internal/promote-waitlist/{slotId}` la atiende `SchedulingInternalController.promoteWaitlist` (src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:82). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Valida el cuerpo como `WorkerBatchDto` (1 campo, 0 obligatorios). Delega en `SchedulingWaitlistService.promoteWaitlist`. Crea filas en community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza community.public_profiles, iam.devices, messaging.notification_requests, scheduling.waitlist_entries. Lee community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications, iam.users y 13 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: slotId | `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:82` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.resolveRecipient → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → SchedulingNoticeRepository.describeSlot → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → SchedulingNoticeRepository.describeSlot → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.findSlotCapacity → SchedulingBookingsRepository.findSlotById | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:226` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → SchedulingAgendaNoticesService.notifySlotReleased → SchedulingNoticeRepository.describeSlot → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:245` |
| `scheduling.waitlist_entries` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:212` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingInternalController.promoteWaitlist → SchedulingWaitlistService.promoteWaitlist → PostgresWaitlistAdapter.markCandidatesFulfilled | `src/modules/scheduling/infrastructure/adapters/postgres-waitlist.adapter.ts:210` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slotId` | path | Sí | `string` | — |

### Cuerpo — DTO `WorkerBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño máximo del lote | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:604` |

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
| `processed` | `number` | Sí | — | — | Elementos procesados en el lote | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:586` |
| `detail` | `string` | Sí | — | — | Detalle de lo que hizo el worker | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:592` |

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
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:313` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. GET /scheduling/internal/waitlist-candidates

- **Origen:** CONTRATO
- **Nombre:** Listar slots con cupo libre y candidatos activos en espera
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingInternalController.listWaitlistCandidates` — `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:69`

### Qué es y para qué sirve (negocio)

Listar slots con cupo libre y candidatos activos en espera. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/internal/waitlist-candidates` la atiende `SchedulingInternalController.listWaitlistCandidates` (src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:69). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Delega en `SchedulingWaitlistService.findSlotsWithCandidates`. Lee scheduling.bookable_slots, scheduling.waitlist_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/scheduling/presentation/controllers/scheduling-internal.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingInternalController.listWaitlistCandidates → SchedulingWaitlistService.findSlotsWithCandidates → PostgresWaitlistAdapter.findSlotsWithActiveCandidates → SchedulingBookingsRepository.findSlotsWithWaitlistCandidates | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1370` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingInternalController.listWaitlistCandidates → SchedulingWaitlistService.findSlotsWithCandidates → PostgresWaitlistAdapter.findSlotsWithActiveCandidates → SchedulingBookingsRepository.findSlotsWithWaitlistCandidates | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1353` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tamaño máximo del lote |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<WaitlistCandidateSlotsResponseDto>` · DTO `WaitlistCandidateSlotsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `slotIds` | `array<string>` | Sí | formato uuid | — | Slots candidatos a promoción, del más próximo al más lejano | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:620` |

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
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:333` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /scheduling/resources

- **Origen:** CONTRATO
- **Nombre:** Listar los recursos agendables de un tenant
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingAgendaController.listResources` — `src/modules/scheduling/presentation/controllers/scheduling-agenda.controller.ts:33`

### Qué es y para qué sirve (negocio)

Listar los recursos agendables de un tenant. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources` la atiende `SchedulingAgendaController.listResources` (src/modules/scheduling/presentation/controllers/scheduling-agenda.controller.ts:33). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingAgendaService.listResources`. Lee common.addresses, practice.care_spaces, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling-agenda.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PracticeProfilesDirectoryAdapter.resolveSitesForResources → PractitionerSitesService.resolveSitesForResources → PractitionerSitesService.loadSites → PractitionerSitesService.projectSite | `src/modules/practice/services/practitioner-sites.service.ts:620` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PracticeProfilesDirectoryAdapter.resolveSitesForResources → PractitionerSitesService.resolveSitesForResources → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:61` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PracticeProfilesDirectoryAdapter.resolveSitesForResources → PractitionerSitesService.resolveSitesForResources → PractitionerSitesService.loadSites → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:69` |
| `practice.practices` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PracticeProfilesDirectoryAdapter.resolveSitesForResources → PractitionerSitesService.resolveSitesForResources → PractitionerSitesService.loadSites → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → PracticeProfilesDirectoryAdapter.resolveSitesForResources → PractitionerSitesService.resolveSitesForResources → PractitionerRoleAssignmentsRepository.findCurrentWithSite | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:121` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingAgendaController.listResources → SchedulingAgendaService.listResources → SchedulingAgendaRepository.findResources | `src/modules/scheduling/infrastructure/repositories/scheduling-agenda.repository.ts:91` |

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
| `items` | `array<ResourceListItemDto>` | Sí | — | — | Recursos de esta página. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:209` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:97` |
| `items[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:103` |
| `items[].resourceTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a resource type concept. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:109` |
| `items[].resourceRefType` | `string` | Sí | — | — | Tipo de la entidad referenciada por el recurso. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:115` |
| `items[].resourceRefId` | `string` | Sí | formato uuid | — | Identificador asociado a resource ref. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:121` |
| `items[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional detrás del recurso, cuando la referencia apunta a un perfil profesional y la persona pudo resolverse. El selector del paciente pregunta «¿con quién te querés atender?» — la respuesta honesta es una persona, no el nombre interno de la agenda. `null` para salas, equipos, o cuando el perfil referido no existe: la ausencia es un estado real que el cliente debe poder distinguir. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:132` |
| `items[].practiceId` | `string` | No | formato uuid; admite null | — | Identificador asociado a practice. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:138` |
| `items[].timeZone` | `string` | No | admite null | — | Zona horaria IANA del recurso. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:144` |
| `items[].capacity` | `number` | Sí | — | — | Atenciones simultáneas que admite. 1 cuando el recurso no lo declara. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:150` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:156` |
| `items[].site` | `ResourceSiteDto` | No | — | — | Dónde se atiende con este recurso. Derivado de lo que el recurso ya declara —la asignación de rol vigente si apunta a un profesional, el espacio de atención si apunta a un box— y no de una columna propia: guardarlo dos veces sería tener dos verdades sobre el mismo hecho. `null` es un estado corriente y no un error: un recurso sin asignación vigente con sede no tiene dónde que mostrar, y la agenda sigue sirviendo para elegir horario. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:171` |
| `items[].site.id` | `string` | No | formato uuid | — | Identificador de la sede. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:184` |
| `items[].site.name` | `string` | No | — | — | Nombre legible de la sede. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:188` |
| `items[].site.code` | `string` | No | — | — | Código único dentro de la práctica. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:192` |
| `items[].site.addressText` | `string` | No | admite null | — | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:196` |
| `items[].site.timeZone` | `string` | No | admite null | — | Zona horaria IANA de la sede, si la declara. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:200` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:215` |

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

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. POST /scheduling/resources

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un recurso agendable
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createResource` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:167`

### Qué es y para qué sirve (negocio)

Dar de alta un recurso agendable. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources` la atiende `SchedulingController.createResource` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:167). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CreateResourceDto` (8 campos, 5 obligatorios). Delega en `SchedulingCatalogService.createResource`. Crea filas en scheduling.schedulable_resources. Lee practice.practice_sites, practice.practices, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingController.createResource → SchedulingCatalogService.createResource → CreateResourceUseCase.execute → CatalogAccess.assertAffiliationWithOrganization → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.createResource → SchedulingCatalogService.createResource → CreateResourceUseCase.execute → CatalogAccess.assertAffiliationWithOrganization → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingController.createResource → SchedulingCatalogService.createResource → CreateResourceUseCase.execute → CatalogAccess.assertAffiliationWithOrganization → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.findOfPractitioner | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:31` |
| `scheduling.schedulable_resources` | ESCRIBE | CREA | DIRECTA | SchedulingController.createResource → SchedulingCatalogService.createResource → CreateResourceUseCase.execute → SchedulingCatalogRepository.createResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:305` |

### Cuerpo — DTO `CreateResourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:37` |
| `resourceType` | `string` | Sí | valores: PRACTITIONER, ROOM, EQUIPMENT | `@IsIn(RESOURCE_TYPES as readonly string[])` | Tipo de recurso | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:44` |
| `resourceRefType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Tipo de la entidad referenciada (referencia polimórfica), p. ej. practitioner_profiles | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:56` |
| `resourceRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id de la entidad referenciada | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:63` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:71` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:79` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA del recurso | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:88` |
| `capacity` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Atenciones simultáneas que admite | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:100` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:111` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:117` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:123` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Un profesional solo puede publicar su propia agenda: el recurso debe apuntar a su perfil profesional.; ForbiddenException: El tenant indicado no es uno de los del actor. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación. Cuando la acepten va a poder publicar su agenda acá. / Su vínculo con esta organización… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:180` |
| INTEGRACION | `test/integration/fx1-doctor-publica-agenda.int-spec.ts:90` |
| INTEGRACION | `test/integration/fx10-mostrador-atomico.int-spec.ts:172` |
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:143` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:85` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:96` |
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:101` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:185` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:143` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:123` |
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:74` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:142` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:95` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:179` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:75` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:195` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:146` |
| INTEGRACION | `test/integration/p40-orden-basada-en-notas.int-spec.ts:208` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:66` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:55` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:198` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:102` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. POST /scheduling/resources/{id}/close-slots

- **Origen:** CONTRATO
- **Nombre:** Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.closeSlots` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:445`

### Qué es y para qué sirve (negocio)

Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/close-slots` la atiende `SchedulingController.closeSlots` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:445). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CloseSlotsDto` (4 campos, 2 obligatorios). Delega en `SchedulingCatalogService.closeSlots`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.availability_exceptions, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, iam.devices, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 13 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:445` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:445` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction | `src/modules/scheduling/application/bookings/use-cases/cancel-booking.use-case.ts:286` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.describe → SchedulingCatalogRepository.findBookingsOfSlots | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:905` |
| `scheduling.availability_exceptions` | ESCRIBE | CREA | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → SchedulingCatalogRepository.createException | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:729` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute | `src/modules/scheduling/application/catalog/use-cases/close-slots.use-case.ts:268` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → SchedulingCatalogRepository.findSlotsOfResourceForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:887` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1213` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.closeSlots → SchedulingCatalogService.closeSlots → CloseSlotsUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseSlotsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exceptionType` | `string` | Sí | valores: ABSENCE, HOLIDAY, VACATION, CONFERENCE, ERRAND, EXTRA, OTHER | `@IsIn(EXCEPTION_TYPES)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1276` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1283` |
| `slotIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@ArrayNotEmpty()` `@IsUUID(undefined, { each: true })` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1296` |
| `cancelAffectedBookings` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true: cancela las citas de esos cupos y avisa a cada paciente. Ausente o false: si hay citas, responde 409 con la lista (failureCode BOOKINGS_REQUIRE_CONFIRMATION) y no cierra. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1309` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "exceptionType": "ABSENCE",
  "slotIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "exceptionType": "ABSENCE",
  "reason": "Texto descriptivo de ejemplo",
  "slotIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "cancelAffectedBookings": false
}
```

</details>

### Respuesta — `Promise<CloseSlotsResponseDto>` · DTO `CloseSlotsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `closedSlots` | `number` | Sí | — | — | Cuántos cupos quedaron cerrados. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1316` |
| `cancelledBookings` | `number` | Sí | — | — | Citas canceladas (o rechazadas) al cerrar, con aviso al paciente. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1320` |
| `exceptionId` | `string` | Sí | formato uuid | — | La excepción que se creó para que regenerar no los devuelva. Es la parte que el pedido pone entre paréntesis y que es su razón de ser: sin ella, cerrar un cupo dura hasta la próxima generación. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1329` |
| `from` | `string` | Sí | formato date-time | — | Desde cuándo cubre la excepción. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1333` |
| `to` | `string` | Sí | formato date-time | — | Hasta cuándo. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1337` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado; ResourceNotFoundException: Ninguno de esos cupos es de esta agenda; ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: Esos ratos tienen pacientes citados: confirme para cancelar cada cita y avisar a cada persona; ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es; PreconditionFailedException: Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda antes de bloquear.; PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:212` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. POST /scheduling/resources/{id}/delay

- **Origen:** CONTRATO
- **Nombre:** Informar una demora que alcanza a toda la agenda del recurso
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.delayResource` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:841`

### Qué es y para qué sirve (negocio)

Informar una demora que alcanza a toda la agenda del recurso. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/delay` la atiende `SchedulingController.delayResource` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:841). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Valida el cuerpo como `DelayResourceDto` (4 campos, 1 obligatorio). Delega en `SchedulingDelayService.delayResource`. Crea filas en audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza audit.appointment_bookings_history, community.public_profiles, iam.devices, messaging.notification_requests. Lee audit.appointment_bookings_history, community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:841` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:841` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.recordDelay → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.recordDelay → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.recordDelay → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingDelayService.notify → MessagingAgendaNoticeAdapter.emitMany → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.resolveRecipient → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:442` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingNoticeRepository.findAffectedBookings | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:435` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.delayResource → SchedulingDelayService.delayResource → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DelayResourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `delayMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(MIN_DELAY_MINUTES)` | Minutos de demora estimados | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:761` |
| `message` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(MAX_DELAY_MESSAGE_LENGTH)` | Mensaje del profesional para los pacientes | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:773` |
| `from` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Inicio de la ventana afectada (ISO 8601). Por omisión, ahora. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:786` |
| `to` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Fin de la ventana afectada (ISO 8601). Por omisión, el fin del día. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:799` |

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
| `notified` | `number` | Sí | — | — | Pacientes que recibieron el aviso | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:808` |
| `affected` | `number` | Sí | — | — | Citas alcanzadas por la demora | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:814` |
| `bookingIds` | `array<string>` | Sí | formato uuid | — | Las citas alcanzadas, para que la pantalla pueda decir cuáles fueron. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:820` |
| `detail` | `string` | Sí | — | — | Qué pasó, en una frase. Incluye por qué un aviso no llegó cuando no llegó. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:826` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una demora mayor a cuatro horas se resuelve reprogramando la cita, no avisando; PreconditionFailedException: La ventana de la demora termina antes de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:83` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. GET /scheduling/resources/{id}/exceptions

- **Origen:** CONTRATO
- **Nombre:** Listar las excepciones de disponibilidad de un recurso
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listExceptions` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:400`

### Qué es y para qué sirve (negocio)

Listar las excepciones de disponibilidad de un recurso. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{id}/exceptions` la atiende `SchedulingController.listExceptions` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:400). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER, PATIENT. Delega en `SchedulingCatalogService.listExceptions`. Lee scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:400` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:400` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.listExceptions → SchedulingCatalogService.listExceptions → ListExceptionsUseCase.execute → SchedulingCatalogRepository.patientHasBookingWithResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1038` |
| `scheduling.availability_exceptions` | LEE | LEE | DIRECTA | SchedulingController.listExceptions → SchedulingCatalogService.listExceptions → ListExceptionsUseCase.execute → SchedulingCatalogRepository.findExceptionsByResourceInRange | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1145` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listExceptions → SchedulingCatalogService.listExceptions → ListExceptionsUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

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
| `items` | `array<AvailabilityExceptionDto>` | Sí | — | — | Las excepciones, de la más próxima a la más lejana. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:723` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:683` |
| `items[].exceptionTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de excepción, como concepto. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:687` |
| `items[].reasonLabel` | `string` | Sí | — | — | El motivo catalogado, en palabras. **Viaja para todos**, incluido el paciente: es una etiqueta de una lista cerrada —«Vacaciones», «Congreso o capacitación»— y no puede contener nada que el profesional no haya elegido a propósito. Es la mitad segura del motivo. La otra —`reason`, el texto libre— sólo la ve quien administra la agenda. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:700` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Comienzo del bloqueo. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:704` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Fin del bloqueo. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:708` |
| `items[].reason` | `string` | No | — | — | Por qué, si se declaró. Lo lee el profesional, no el paciente. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:712` |
| `items[].isAvailable` | `boolean` | No | — | — | `true` cuando la excepción ABRE disponibilidad en vez de cerrarla. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:716` |
| `count` | `number` | Sí | — | — | Cuántas son. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:727` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: No puede ver los bloqueos de esta agenda |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana no es una fecha válida; PreconditionFailedException: La ventana debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:229` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:223` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. POST /scheduling/resources/{id}/exceptions

- **Origen:** CONTRATO
- **Nombre:** Registrar una excepción de disponibilidad
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createException` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:543`

### Qué es y para qué sirve (negocio)

Registrar una excepción de disponibilidad. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/exceptions` la atiende `SchedulingController.createException` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:543). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `CreateExceptionDto` (6 campos, 3 obligatorios). Delega en `SchedulingCatalogService.createException`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.availability_exceptions, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, iam.devices, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots. Lee audit.appointment_bookings_history, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 13 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:543` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:543` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction | `src/modules/scheduling/application/bookings/use-cases/cancel-booking.use-case.ts:286` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.describe → SchedulingCatalogRepository.findBookingsOfSlots | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:905` |
| `scheduling.availability_exceptions` | ESCRIBE | CREA | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → SchedulingCatalogRepository.createException | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:729` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute | `src/modules/scheduling/application/catalog/use-cases/create-exception.use-case.ts:153` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → SchedulingCatalogRepository.findOpenSlotsInWindow | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1159` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1213` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.createException → SchedulingCatalogService.createException → CreateExceptionUseCase.execute → CreateExceptionUseCase.cancelBookingsOfBlock → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateExceptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exceptionType` | `string` | Sí | valores: ABSENCE, HOLIDAY, VACATION, CONFERENCE, ERRAND, EXTRA, OTHER | `@IsIn(EXCEPTION_TYPES)` | Motivo de la excepción | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:865` |
| `startAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:872` |
| `endAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:879` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Texto libre del motivo. OBLIGATORIO cuando el tipo es OTHER; lo lee el profesional | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:891` |
| `isAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true cuando la excepción **añade** disponibilidad extraordinaria | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:903` |
| `cancelAffectedBookings` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true: cancela las citas del rato y avisa a cada paciente. Ausente o false: si hay citas, responde 422 con la lista (failureCode BOOKINGS_REQUIRE_CONFIRMATION) y no bloquea. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:919` |

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
  "isAvailable": false,
  "cancelAffectedBookings": false
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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Eligió «Otro» como motivo: escriba cuál es; PreconditionFailedException: La excepción debe empezar antes de terminar; PreconditionFailedException: Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda antes de bloquear.; PreconditionFailedException: Tiene una cita confirmada en ese rato{first.resourceName ? ` en «${…}. Reprográmela primero o elija otro horario.; PreconditionFailedException: Ese rato tiene {n} {n === 1 ? 'cita' : 'citas'} con paciente. Confirme para cancelarlas y avisar a cada persona. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:133` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:210` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:237` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `A4`

---

## 45. GET /scheduling/resources/{id}/flexible-availability

- **Origen:** CONTRATO
- **Nombre:** Horas que se pueden pedir en un horario flexible
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingFlexibleController.availability` — `src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:40`

### Qué es y para qué sirve (negocio)

Horas que se pueden pedir en un horario flexible. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{id}/flexible-availability` la atiende `SchedulingFlexibleController.availability` (src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:40). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingFlexibleBookingService.availability`. Lee scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.booking_policies, scheduling.practitioner_service_offerings, scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:40` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.confirmedBookings → SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:896` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingFlexibleBookingService.offersOf → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | POR_SQL | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:242` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingFlexibleBookingService.practitionerSite → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingFlexibleBookingService.offersOf → SchedulingCatalogRepository.findFlexibleTemplatesOfResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:539` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingFlexibleBookingService.offersOf → SchedulingCatalogRepository.findFlexibleTemplatesOfResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:534` |
| `scheduling.slot_holds` | LEE | LEE | POR_SQL | SchedulingFlexibleController.availability → SchedulingFlexibleBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FlexibleAvailabilityResponseDto>` · DTO `FlexibleAvailabilityResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resourceId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:44` |
| `stepMinutes` | `number` | Sí | — | — | Cada cuántos minutos se ofrece una hora. Al retener se acepta cualquier minuto dentro de la franja. | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:50` |
| `items` | `array<FlexibleStartDto>` | Sí | — | — | Horas libres, ordenadas. Vacío si la agenda no tiene horario flexible publicado o no queda lugar. | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:57` |
| `items[].templateId` | `string` | Sí | formato uuid | — | Plantilla flexible que la ofrece | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:30` |
| `items[].startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:33` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Hasta cuándo se reserva: inicio más el tiempo por paciente | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agenda no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar.; PreconditionFailedException: Se pueden mirar hasta {MAX_QUERY_DAYS} días de una vez. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:243` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingFlexibleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. POST /scheduling/resources/{id}/flexible-holds

- **Origen:** CONTRATO
- **Nombre:** Retener una hora de un horario flexible
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingFlexibleController.placeHold` — `src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:61`

### Qué es y para qué sirve (negocio)

Retener una hora de un horario flexible. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/flexible-holds` la atiende `SchedulingFlexibleController.placeHold` (src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:61). Exige sesión con alguno de los roles PATIENT, SCHEDULING_ADMIN, SCHEDULING_AGENT. Valida el cuerpo como `CreateFlexibleHoldDto` (2 campos, 1 obligatorio). Delega en `SchedulingFlexibleBookingService.placeHold`. Crea filas en scheduling.bookable_slots, scheduling.slot_holds. Lee practice.practice_sites, practice.practices, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.practitioner_affiliations, scheduling.appointment_bookings, scheduling.availability_exceptions y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-flexible.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.findOfPractitioner | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:31` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.assertPatientBelowCap → SchedulingBookingsRepository.countActiveBookingsForPatient | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:688` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingCatalogRepository.createSlot | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:752` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.offersOf → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | POR_SQL | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveServiceSlotsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:242` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.practitionerSite → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.offersOf → SchedulingCatalogRepository.findFlexibleTemplatesOfResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:539` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingFlexibleBookingService.offersOf → SchedulingCatalogRepository.findFlexibleTemplatesOfResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:534` |
| `scheduling.slot_holds` | ESCRIBE | CREA | DIRECTA | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingBookingsRepository.createHold | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:237` |
| `scheduling.slot_holds` | LEE | LEE | POR_SQL | SchedulingFlexibleController.placeHold → SchedulingFlexibleBookingService.placeHold → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateFlexibleHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `startAt` | `string` | Sí | formato date-time | `@IsISO8601()` | La hora que pidió el paciente, en un minuto entero, dentro de una franja flexible | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:68` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente para el que se reserva | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:76` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "startAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "startAt": "2026-07-31T12:00:00.000Z",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FlexibleHoldResponseDto>` · DTO `FlexibleHoldResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:81` |
| `holdToken` | `string` | Sí | — | — | Token con el que se confirma o solicita la reserva. Se entrega una sola vez. | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:87` |
| `expiresAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:89` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | El cupo que nació para este turno | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:95` |
| `startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:97` |
| `endAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-flexible.dto.ts:98` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No cuenta con autorización de tutoría sobre el paciente indicado; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agenda no encontrada |
| 409 | `CONFLICT` | ConflictException: Esa hora ya no está disponible. Elija otra.; ConflictException: El paciente alcanzó el máximo de citas activas |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La hora pedida tiene que caer en un minuto entero.; PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación. / Su vínculo con esta organización ya no está vigente.; PreconditionFailedException: Esa hora no está dentro del horario que atiende este profesional.; PreconditionFailedException: Esa cita empieza demasiado pronto: hay que pedirla con al menos {notice} minutos de anticipación.; PreconditionFailedException: Sólo se puede pedir con hasta {advance} días de anticipación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:261` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingFlexibleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 47. POST /scheduling/resources/{id}/shift-slots

- **Origen:** CONTRATO
- **Nombre:** Correr los cupos de una agenda N minutos
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.shiftSlots` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:477`

### Qué es y para qué sirve (negocio)

Correr los cupos de una agenda N minutos. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/shift-slots` la atiende `SchedulingController.shiftSlots` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:477). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `ShiftSlotsDto` (4 campos, 3 obligatorios). Delega en `SchedulingCatalogService.shiftSlots`. Crea filas en community.conversation_participants, community.conversations, community.public_profiles, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza community.public_profiles, iam.devices, messaging.notification_requests, scheduling.bookable_slots. Lee community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, iam.authentication_credentials, iam.devices, iam.email_verifications, iam.users y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:477` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:477` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:344` |
| `community.public_profiles` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:302` |
| `community.user_blocks` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:129` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.enqueueEmail → SchedulingNoticeRepository.findEmailForUser | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:138` |
| `iam.users` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → MessagingAgendaNoticeAdapter.sendByChat → SupportAdminNoticeAdapter.notify → SupportAdminNoticeAdapter.getOrCreateRecipientProfile | `src/modules/scheduling/infrastructure/adapters/support-admin-notice.adapter.ts:150` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → SchedulingNoticeRepository.findAccountForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:95` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SlotMoveNotifier.notifyOfMove → SchedulingCatalogRepository.findBookingsOfSlots | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:905` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute | `src/modules/scheduling/application/catalog/use-cases/shift-slots.use-case.ts:82` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SchedulingCatalogRepository.findSlotsOfResourceForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:887` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.shiftSlots → SchedulingCatalogService.shiftSlots → ShiftSlotsUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ShiftSlotsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shiftMinutes` | `number` | Sí | mínimo -240; máximo 240 | `@IsInt()` `@Min(MIN_SHIFT_MINUTES)` `@Max(MAX_SHIFT_MINUTES)` | Minutos a correr. Negativo adelanta. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1211` |
| `from` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1216` |
| `to` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1221` |
| `slotIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID(undefined, { each: true })` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1235` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "shiftMinutes": 20,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "shiftMinutes": 20,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "slotIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<ShiftSlotsResponseDto>` · DTO `ShiftSlotsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `movedSlots` | `number` | Sí | — | — | Cuántos cupos se corrieron. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1242` |
| `notified` | `number` | Sí | — | — | A cuántas personas se les avisó. Menor que `movedSlots` es lo corriente: los cupos libres se mueven y no hay a quién avisarle. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1251` |
| `shiftMinutes` | `number` | Sí | — | — | Los minutos que se aplicaron, para que el cliente confirme lo que pidió. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1255` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana termina antes de empezar; PreconditionFailedException: Mover cero minutos no cambia nada: elija cuánto correr la agenda |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:167` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:378` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. GET /scheduling/resources/{id}/slots

- **Origen:** CONTRATO
- **Nombre:** UC-41-14: agenda publicada del recurso en una ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.getResourceAgenda` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:120`

### Qué es y para qué sirve (negocio)

UC-41-14: agenda publicada del recurso en una ventana. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{id}/slots` la atiende `SchedulingController.getResourceAgenda` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:120). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingCatalogService.getResourceAgenda`. Lee scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:120` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.getResourceAgenda → SchedulingCatalogService.getResourceAgenda → GetResourceAgendaUseCase.execute → SchedulingCatalogRepository.findSlotsByResourceInRange | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1120` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.getResourceAgenda → SchedulingCatalogService.getResourceAgenda → GetResourceAgendaUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |

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
| `resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:85` |
| `from` | `string` | Sí | formato date-time | — | Valor de from mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:91` |
| `to` | `string` | Sí | formato date-time | — | Valor de to mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:97` |
| `items` | `array<BookableSlotItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:103` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del slot; es lo que se manda a `POST /scheduling/slots/:id/holds` | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:20` |
| `items[].resourceId` | `string` | No | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:26` |
| `items[].scheduleTemplateId` | `string` | No | formato uuid | — | Identificador asociado a schedule template. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:32` |
| `items[].serviceConceptId` | `string` | No | formato uuid | — | Identificador asociado a service concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:38` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:44` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:50` |
| `items[].capacity` | `number` | Sí | — | — | Cupos totales del slot | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:56` |
| `items[].remainingCapacity` | `number` | Sí | — | — | Cupos libres ahora mismo | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:62` |
| `items[].available` | `boolean` | Sí | — | — | Si queda cupo. Derivado: no requiere resolver terminología | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:70` |
| `items[].statusConceptId` | `string` | No | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:76` |
| `count` | `number` | Sí | — | — | Número de elementos devueltos. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:109` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:115` |
| `truncated` | `boolean` | Sí | — | — | Si la ventana tenía más slots que el tope pedido. Se declara en vez de recortar en silencio: una agenda a la que le faltan huecos sin avisar se lee como una agenda llena | `src/modules/scheduling/presentation/dto/scheduling-read.dto.ts:124` |

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
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:132` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:159` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:126` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:92` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. GET /scheduling/resources/{id}/templates

- **Origen:** CONTRATO
- **Nombre:** Listar las plantillas de agenda de un recurso
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listTemplates` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:244`

### Qué es y para qué sirve (negocio)

Listar las plantillas de agenda de un recurso. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{id}/templates` la atiende `SchedulingController.listTemplates` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:244). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.listTemplates`. Lee scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:244` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:244` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listTemplates → SchedulingCatalogService.listTemplates → ListTemplatesUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.listTemplates → SchedulingCatalogService.listTemplates → ListTemplatesUseCase.execute → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.listTemplates → SchedulingCatalogService.listTemplates → ListTemplatesUseCase.execute → SchedulingCatalogRepository.findTemplatesByResource | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:449` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TemplateListDto>` · DTO `TemplateListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TemplateDetailDto>` | Sí | — | — | Las plantillas publicadas, de la más reciente a la más vieja. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:666` |
| `items[].latestVersionId` | `string` | Sí | formato uuid | — | Última versión | sin fuente |
| `items[].responseWindowDays` | `number` | Sí | — | — | Días de plazo para responder | sin fuente |
| `items[].effectiveFrom` | `string` | No | formato date-time | — | Valor de effective from mantenido por la instancia. | sin fuente |
| `items[].effectiveTo` | `string` | No | formato date-time | — | Valor de effective to mantenido por la instancia. | sin fuente |
| `items[].questions` | `array<QuestionDto>` | Sí | — | — | Valor de questions mantenido por la instancia. | sin fuente |
| `items[].questions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/surveys/dto/responses.dto.ts:55` |
| `items[].questions[].position` | `number` | Sí | — | — | Posición dentro del cuestionario | `src/modules/surveys/dto/responses.dto.ts:61` |
| `items[].questions[].questionText` | `string` | Sí | — | — | Enunciado | `src/modules/surveys/dto/responses.dto.ts:67` |
| `items[].questions[].answerType` | `string` | Sí | valores: TEXT, SCALE, BOOLEAN, SINGLE_CHOICE, MULTIPLE_CHOICE | — | Valor de answer type mantenido por la instancia. | `src/modules/surveys/dto/responses.dto.ts:73` |
| `items[].questions[].required` | `boolean` | Sí | — | — | Si es obligatoria | `src/modules/surveys/dto/responses.dto.ts:79` |
| `items[].questions[].source` | `string` | No | valores: SYSTEM, PRACTITIONER | — | SYSTEM: pregunta base de ALOVIDA. PRACTITIONER: pregunta de la encuesta del profesional (siempre opcional). Sólo la informa la lectura del paciente. | `src/modules/surveys/dto/responses.dto.ts:90` |
| `items[].questions[].options` | `array<string>` | No | — | — | Opciones de elección | `src/modules/surveys/dto/responses.dto.ts:96` |
| `items[].questions[].scaleMin` | `number` | No | — | — | Mínimo de la escala | `src/modules/surveys/dto/responses.dto.ts:102` |
| `items[].questions[].scaleMax` | `number` | No | — | — | Máximo de la escala | `src/modules/surveys/dto/responses.dto.ts:108` |
| `items[].assignments` | `array<TemplateAssignmentDto>` | No | — | — | Asociaciones activas de la encuesta, de cualquiera de sus versiones. Si una misma cosa está asociada a dos versiones se informa la más alta, que es la que se reparte. Sólo en plantillas del profesional. | sin fuente |
| `items[].assignments[].id` | `string` | No | formato uuid | — | Identificador de la asignación. | `src/modules/surveys/dto/responses.dto.ts:163` |
| `items[].assignments[].targetType` | `string` | No | valores: APPOINTMENT, SERVICE, CARE_TYPE | — | Qué se evalúa. | `src/modules/surveys/dto/responses.dto.ts:167` |
| `items[].assignments[].targetId` | `string` | No | formato uuid | — | La reserva (`APPOINTMENT`), el servicio del catálogo, `billing.service_catalog.id` (`SERVICE`), o el tipo de atención «consulta» (`CARE_TYPE`). | `src/modules/surveys/dto/responses.dto.ts:174` |
| `items[].assignments[].targetName` | `string` | No | admite null | — | Nombre del servicio del catálogo cuando `targetType` es `SERVICE`; ausente en el resto. | `src/modules/surveys/dto/responses.dto.ts:181` |
| `items[].assignments[].active` | `boolean` | No | — | — | Siempre `true`: sólo se informan las activas. | `src/modules/surveys/dto/responses.dto.ts:185` |
| `count` | `number` | Sí | — | — | Cuántas son. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:670` |

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
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:315` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:200` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. POST /scheduling/resources/{id}/templates

- **Origen:** CONTRATO
- **Nombre:** Publicar una plantilla de agenda con sus franjas
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.createTemplate` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:211`

### Qué es y para qué sirve (negocio)

Publicar una plantilla de agenda con sus franjas. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/resources/{id}/templates` la atiende `SchedulingController.createTemplate` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:211). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `SchedulingCreateTemplateDto` (16 campos, 5 obligatorios). Delega en `SchedulingCatalogService.createTemplate`. Crea filas en scheduling.schedule_rules, scheduling.schedule_templates. Lee scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:211` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:211` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → CreateTemplateUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | ESCRIBE | CREA | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → CreateTemplateUseCase.execute → SchedulingCatalogRepository.createRule | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:486` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → CreateTemplateUseCase.execute → AgendaOverlapGuard.assertNoOverlapWithOtherAgendas → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:627` |
| `scheduling.schedule_templates` | ESCRIBE | CREA | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → CreateTemplateUseCase.execute → SchedulingCatalogRepository.createTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:403` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.createTemplate → SchedulingCatalogService.createTemplate → CreateTemplateUseCase.execute → AgendaOverlapGuard.assertNoOverlapWithOtherAgendas → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:621` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SchedulingCreateTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:404` |
| `rules` | `array<ScheduleRuleDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ScheduleRuleDto)` | Franjas semanales de la plantilla | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:417` |
| `rules[].dayOfWeek` | `number` | Sí | mínimo 0; máximo 6 | `@IsInt()` `@Min(0)` `@Max(6)` | 0 = domingo … 6 = sábado | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:275` |
| `rules[].startTime` | `string` | Sí | patrón runtime /^\d{2}:\d{2}(:\d{2})?$/ | `@Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'startTime debe tener formato HH:MM o HH:MM:SS', })` | Hora de inicio HH:MM:SS | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:284` |
| `rules[].endTime` | `string` | Sí | patrón runtime /^\d{2}:\d{2}(:\d{2})?$/ | `@Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'endTime debe tener formato HH:MM o HH:MM:SS', })` | Hora de fin HH:MM:SS | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:293` |
| `rules[].slotMinutes` | `number` | No | mínimo 5 | `@IsOptional()` `@IsInt()` `@Min(5)` | Duración del slot en minutos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:302` |
| `rules[].capacityPerSlot` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Cupos por slot | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:311` |
| `rules[].gapMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Minutos de respiro entre un turno y el siguiente. Ausente ≡ 0 | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:335` |
| `rules[].bookingMode` | `string` | No | valores: CONSULTATIONS, SERVICES, MIXED | `@IsOptional()` `@IsIn(RULE_BOOKING_MODES as readonly string[])` | Qué admite la franja: consultas, servicios o ambos. Ausente ≡ CONSULTATIONS | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:348` |
| `rules[].telemedicineEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | La franja atiende también por telemedicina. Ausente ≡ false (sólo presencial) | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:364` |
| `rules[].flexibleHours` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Horario flexible de esta franja: sin turnos fijos, el paciente elige la hora. No admite slotMinutes, capacityPerSlot ni gapMinutes. Ausente ≡ false | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:382` |
| `slotMinutes` | `number` | No | mínimo 5 | `@IsOptional()` `@IsInt()` `@Min(5)` | Duración por defecto del slot, en minutos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:429` |
| `bookingPolicyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:437` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:445` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:453` |
| `flexibleHours` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Horario flexible: sin turnos fijos, el paciente elige la hora dentro de la franja. slotMinutes es lo que se reserva por paciente. Ausente ≡ false | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:474` |

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
      "capacityPerSlot": 1,
      "gapMinutes": 1,
      "bookingMode": "CONSULTATIONS",
      "telemedicineEnabled": false,
      "flexibleHours": false
    }
  ],
  "slotMinutes": 30,
  "bookingPolicyId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "flexibleHours": false
}
```

</details>

### Respuesta — `Promise<TemplateResponseDto>` · DTO `TemplateResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:738` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:744` |
| `ruleCount` | `number` | Sí | — | — | Franjas creadas | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:750` |
| `flexibleHours` | `boolean` | Sí | — | — | true cuando el horario es flexible, sin turnos fijos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:756` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:762` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La franja debe empezar antes de terminar; PreconditionFailedException: Dos franjas de esta agenda se solapan entre sí; PreconditionFailedException: Ya tiene «{other.resourceName}» el {existing.label}, que se cruza con estehorario. Cambie el horario o el día, o edite esa otra agenda. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:194` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:110` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:169` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:138` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:159` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:110` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:272` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:94` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:122` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:167` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:80` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:70` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:213` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:122` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 51. GET /scheduling/resources/{resourceId}/waitlist

- **Origen:** CONTRATO
- **Nombre:** Listar quiénes esperan turno en una agenda
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listResourceWaitlist` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:814`

### Qué es y para qué sirve (negocio)

Listar quiénes esperan turno en una agenda. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/resources/{resourceId}/waitlist` la atiende `SchedulingController.listResourceWaitlist` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:814). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. Delega en `SchedulingWaitlistService.listForResource`. Lee profiles.person_profiles, profiles.persons, scheduling.schedulable_resources, scheduling.waitlist_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:814` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: resourceId | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:814` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.listResourceWaitlist → SchedulingWaitlistService.listForResource → PostgresWaitlistAdapter.findEntriesForResource → SchedulingNoticeRepository.findWaitlistByResource → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.listResourceWaitlist → SchedulingWaitlistService.listForResource → PostgresWaitlistAdapter.findEntriesForResource → SchedulingNoticeRepository.findWaitlistByResource | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:367` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listResourceWaitlist → SchedulingWaitlistService.listForResource → SchedulingWaitlistService.assertOperatesAgenda → PostgresWaitlistAdapter.findResourcePractitioner → SchedulingNoticeRepository.findResourcePractitionerProfileId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:412` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingController.listResourceWaitlist → SchedulingWaitlistService.listForResource → PostgresWaitlistAdapter.findEntriesForResource → SchedulingNoticeRepository.findWaitlistByResource | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:353` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `resourceId` | path | Sí | `string` | — |
| `includeClosed` | query | No | `string` | Incluye las cubiertas y canceladas (por omisión, no) |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListWaitlistResponseDto>` · DTO `ListWaitlistResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<WaitlistEntryItemDto>` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:933` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:861` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:864` |
| `items[].resourceId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:867` |
| `items[].resourceLabel` | `string` | Sí | — | — | Nombre del profesional o del recurso | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:874` |
| `items[].desiredFrom` | `string` | No | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:877` |
| `items[].desiredTo` | `string` | No | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:880` |
| `items[].priority` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:883` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:886` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:889` |
| `items[].patientName` | `string` | No | — | — | Nombre del paciente que espera | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:899` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: sólo ve quién la espera quien atiende en ella. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:354` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. GET /scheduling/service-availability

- **Origen:** CONTRATO
- **Nombre:** Horarios donde cabe un servicio
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingServiceOfferingsController.availability` — `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:109`

### Qué es y para qué sirve (negocio)

Horarios donde cabe un servicio. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/service-availability` la atiende `SchedulingServiceOfferingsController.availability` (src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:109). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingServiceBookingService.availability`. Lee billing.service_catalog, scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.booking_policies, scheduling.practitioner_service_offerings, scheduling.schedulable_resources, scheduling.schedule_rules y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | offeringId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceBookingService.visibleOffering → SchedulingOfferingsRepository.findCatalogItem | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:124` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.confirmedBookings → SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:896` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceAgendaService.bandsOfServices → SchedulingServiceAgendaService.policyOf → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceBookingService.visibleOffering → SchedulingOfferingsRepository.findOfferingById | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:53` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingOfferingsRepository.findResourcesOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:132` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceAgendaService.bandsOfServices → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:627` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceAgendaService.bandsOfServices → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:621` |
| `scheduling.slot_holds` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.availability → SchedulingServiceBookingService.availability → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `offeringId` | query | Sí | `string` | — |
| `resourceId` | query | No | `string` | Una sede en particular; sin ella se buscan en todas las del profesional |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ServiceAvailabilityResponseDto>` · DTO `ServiceAvailabilityResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `offeringId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:272` |
| `minDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:273` |
| `maxDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:274` |
| `items` | `array<ServiceStartDto>` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:277` |
| `items[].resourceId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:251` |
| `items[].startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:254` |
| `items[].endAtMax` | `string` | Sí | formato date-time | — | Hasta cuándo se reserva: inicio más la duración máxima | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:260` |
| `items[].endAtMin` | `string` | Sí | formato date-time | — | Cuándo podría terminar como pronto: inicio más la duración mínima | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:267` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana debe empezar antes de terminar.; PreconditionFailedException: Se pueden mirar hasta {MAX_QUERY_DAYS} días de una vez. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingServiceOfferingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. GET /scheduling/service-offerings

- **Origen:** CONTRATO
- **Nombre:** Los servicios que ofrece un profesional
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingServiceOfferingsController.list` — `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:53`

### Qué es y para qué sirve (negocio)

Los servicios que ofrece un profesional. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/service-offerings` la atiende `SchedulingServiceOfferingsController.list` (src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:53). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT. Delega en `SchedulingServiceOfferingsService.list`. Lee billing.service_catalog, scheduling.practitioner_service_offerings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.list → SchedulingServiceOfferingsService.list → SchedulingOfferingsRepository.findCatalogItems | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:116` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.list → SchedulingServiceOfferingsService.list → SchedulingOfferingsRepository.listOfferings | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practitionerProfileId` | query | No | `string` | Profesional cuyas ofertas se listan. Un profesional que no la manda ve las suyas. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ServiceOfferingListDto>` · DTO `ServiceOfferingListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ServiceOfferingDto>` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:221` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:185` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:188` |
| `items[].serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:191` |
| `items[].serviceCode` | `string` | Sí | — | — | Código del servicio en el catálogo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:194` |
| `items[].serviceName` | `string` | Sí | — | — | Nombre del servicio en el catálogo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:197` |
| `items[].price` | `string` | Sí | — | — | Precio de catálogo, con dos decimales | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:200` |
| `items[].currencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:203` |
| `items[].minDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:205` |
| `items[].maxDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:206` |
| `items[].prepMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:207` |
| `items[].cleanupMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:208` |
| `items[].isPatientBookable` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:209` |
| `items[].requiresApproval` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:210` |
| `items[].channel` | `string` | No | valores: PRESENCIAL, TELECONSULTA, DOMICILIO | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:213` |
| `items[].isActive` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:215` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique de qué profesional quiere ver los servicios. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingServiceOfferingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. POST /scheduling/service-offerings

- **Origen:** CONTRATO
- **Nombre:** Declarar cómo ofrezco un servicio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingServiceOfferingsController.create` — `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:73`

### Qué es y para qué sirve (negocio)

Declarar cómo ofrezco un servicio. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/service-offerings` la atiende `SchedulingServiceOfferingsController.create` (src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:73). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN. Valida el cuerpo como `CreateServiceOfferingDto` (9 campos, 3 obligatorios). Delega en `SchedulingServiceOfferingsService.create`. Crea filas en scheduling.practitioner_service_offerings. Lee billing.service_catalog, practice.practitioner_role_assignments, scheduling.practitioner_service_offerings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN | `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.create → SchedulingServiceOfferingsService.create → SchedulingOfferingsRepository.findCatalogItem | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:124` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.create → SchedulingServiceOfferingsService.create → SchedulingServiceOfferingsService.assertServiceReachable → PracticeProfilesDirectoryAdapter.findActivePracticeIdsForPractitioner → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |
| `scheduling.practitioner_service_offerings` | ESCRIBE | CREA | DIRECTA | SchedulingServiceOfferingsController.create → SchedulingServiceOfferingsService.create → SchedulingOfferingsRepository.createOffering | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:91` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.create → SchedulingServiceOfferingsService.create → SchedulingOfferingsRepository.findOfferingOf | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:62` |

### Cuerpo — DTO `CreateServiceOfferingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `serviceCatalogId` | `string` | Sí | formato uuid | `@IsUUID()` | Servicio del catálogo de la práctica que se ofrece | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:31` |
| `minDurationMinutes` | `number` | Sí | mínimo 1; máximo 720 | `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(MAX_SERVICE_DURATION_MINUTES)` | Lo mínimo que puede tardar, en minutos | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:42` |
| `maxDurationMinutes` | `number` | Sí | mínimo 1; máximo 720 | `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(MAX_SERVICE_DURATION_MINUTES)` | Lo máximo que puede tardar. Es el tiempo que se reserva en la agenda | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:54` |
| `prepMinutes` | `number` | No | mínimo 0; máximo 240 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(0)` `@Max(MAX_SERVICE_BUFFER_MINUTES)` | Preparación antes de atender; el paciente no la ve | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:66` |
| `cleanupMinutes` | `number` | No | mínimo 0; máximo 240 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(0)` `@Max(MAX_SERVICE_BUFFER_MINUTES)` | Limpieza o cierre después de atender; el paciente no la ve | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:78` |
| `isPatientBookable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el paciente puede pedirlo por su cuenta desde el portal | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:86` |
| `requiresApproval` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si cada pedido espera la aceptación del profesional en vez de confirmarse solo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:95` |
| `channel` | `string` | No | valores: PRESENCIAL, TELECONSULTA, DOMICILIO | `@IsOptional()` `@IsIn(APPOINTMENT_CHANNELS as readonly string[])` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:100` |
| `practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sólo para quien administra agendas: el profesional dueño de la oferta. Un profesional siempre la crea para sí mismo. | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:110` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "minDurationMinutes": 1,
  "maxDurationMinutes": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "minDurationMinutes": 1,
  "maxDurationMinutes": 1,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "isPatientBookable": true,
  "requiresApproval": false,
  "channel": "PRESENCIAL",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ServiceOfferingDto>` · DTO `ServiceOfferingDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:185` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:188` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:191` |
| `serviceCode` | `string` | Sí | — | — | Código del servicio en el catálogo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:194` |
| `serviceName` | `string` | Sí | — | — | Nombre del servicio en el catálogo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:197` |
| `price` | `string` | Sí | — | — | Precio de catálogo, con dos decimales | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:200` |
| `currencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:203` |
| `minDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:205` |
| `maxDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:206` |
| `prepMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:207` |
| `cleanupMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:208` |
| `isPatientBookable` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:209` |
| `requiresApproval` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:210` |
| `channel` | `string` | No | valores: PRESENCIAL, TELECONSULTA, DOMICILIO | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:213` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:215` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo puede crear ofertas para usted.; ForbiddenException: Sólo un profesional ofrece servicios. |
| 409 | `CONFLICT` | ConflictException: Ya ofrece ese servicio. Edite la oferta que ya tiene. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique de qué profesional es la oferta.; PreconditionFailedException: Ese servicio está inactivo en el catálogo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingServiceOfferingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. PATCH /scheduling/service-offerings/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar o apagar la oferta de un servicio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingServiceOfferingsController.update` — `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:93`

### Qué es y para qué sirve (negocio)

Editar o apagar la oferta de un servicio. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /scheduling/service-offerings/{id}` la atiende `SchedulingServiceOfferingsController.update` (src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:93). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN. Valida el cuerpo como `UpdateServiceOfferingDto` (8 campos, 0 obligatorios). Delega en `SchedulingServiceOfferingsService.update`. Actualiza scheduling.practitioner_service_offerings. Lee billing.service_catalog, scheduling.practitioner_service_offerings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN | `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:93` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.update → SchedulingServiceOfferingsService.update → SchedulingOfferingsRepository.findCatalogItem | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:124` |
| `scheduling.practitioner_service_offerings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingServiceOfferingsController.update → SchedulingServiceOfferingsService.update | `src/modules/scheduling/application/service-offerings/scheduling-service-offerings.service.ts:159` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.update → SchedulingServiceOfferingsService.update → SchedulingOfferingsRepository.findOfferingById | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:53` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateServiceOfferingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `minDurationMinutes` | `number` | No | mínimo 1; máximo 720 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(MAX_SERVICE_DURATION_MINUTES)` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:121` |
| `maxDurationMinutes` | `number` | No | mínimo 1; máximo 720 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(MAX_SERVICE_DURATION_MINUTES)` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:129` |
| `prepMinutes` | `number` | No | mínimo 0; máximo 240 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(0)` `@Max(MAX_SERVICE_BUFFER_MINUTES)` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:137` |
| `cleanupMinutes` | `number` | No | mínimo 0; máximo 240 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(0)` `@Max(MAX_SERVICE_BUFFER_MINUTES)` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:145` |
| `isPatientBookable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:150` |
| `requiresApproval` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:155` |
| `channel` | `string` | No | valores: PRESENCIAL, TELECONSULTA, DOMICILIO | `@IsOptional()` `@IsIn(APPOINTMENT_CHANNELS as readonly string[])` | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:160` |
| `isActive` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Falso para dejar de ofrecerlo sin borrarlo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:167` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "minDurationMinutes": 1,
  "maxDurationMinutes": 1,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "isPatientBookable": true,
  "requiresApproval": true,
  "channel": "PRESENCIAL",
  "isActive": true
}
```

</details>

### Respuesta — `Promise<ServiceOfferingDto>` · DTO `ServiceOfferingDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:185` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:188` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:191` |
| `serviceCode` | `string` | Sí | — | — | Código del servicio en el catálogo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:194` |
| `serviceName` | `string` | Sí | — | — | Nombre del servicio en el catálogo | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:197` |
| `price` | `string` | Sí | — | — | Precio de catálogo, con dos decimales | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:200` |
| `currencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:203` |
| `minDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:205` |
| `maxDurationMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:206` |
| `prepMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:207` |
| `cleanupMinutes` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:208` |
| `isPatientBookable` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:209` |
| `requiresApproval` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:210` |
| `channel` | `string` | No | valores: PRESENCIAL, TELECONSULTA, DOMICILIO | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:213` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:215` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Oferta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingServiceOfferingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 56. POST /scheduling/service-offerings/{id}/holds

- **Origen:** CONTRATO
- **Nombre:** Retener el turno de un servicio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingServiceOfferingsController.placeHold` — `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:129`

### Qué es y para qué sirve (negocio)

Retener el turno de un servicio. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/service-offerings/{id}/holds` la atiende `SchedulingServiceOfferingsController.placeHold` (src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:129). Exige sesión con alguno de los roles PATIENT, SCHEDULING_ADMIN, SCHEDULING_AGENT. Valida el cuerpo como `CreateServiceHoldDto` (3 campos, 2 obligatorios). Delega en `SchedulingServiceBookingService.placeHold`. Crea filas en scheduling.bookable_slots, scheduling.slot_holds. Actualiza scheduling.bookable_slots. Lee billing.service_catalog, practice.practice_sites, practice.practices, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.practitioner_affiliations, scheduling.appointment_bookings y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, SCHEDULING_ADMIN, SCHEDULING_AGENT | `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling-service-offerings.controller.ts:129` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingOfferingsRepository.findCatalogItem | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:124` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceBookingService.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceBookingService.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.tenantsOfSites | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:55` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceBookingService.assertAffiliationCurrent → PractitionerAffiliationGateService.evaluate → ProfilesAffiliationsAdapter.findOfPractitioner | `src/modules/scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts:31` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.confirmedBookings → SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:896` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.retract | `src/modules/scheduling/application/service-offerings/scheduling-service-agenda.service.ts:228` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingCatalogRepository.createSlot | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:752` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.retract → SchedulingCatalogRepository.findOpenSlotsOfProfessionalInWindow | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:685` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.bandsOfServices → SchedulingServiceAgendaService.policyOf → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceBookingService.visibleOffering → SchedulingOfferingsRepository.findOfferingById | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:53` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.bandsOfServices → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:627` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.bandsOfServices → SchedulingCatalogRepository.findRulesByResourceOwner | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:621` |
| `scheduling.slot_holds` | ESCRIBE | CREA | DIRECTA | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingBookingsRepository.createHold | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:237` |
| `scheduling.slot_holds` | LEE | LEE | POR_SQL | SchedulingServiceOfferingsController.placeHold → SchedulingServiceBookingService.placeHold → SchedulingServiceAgendaService.practitionerBusyTime → SchedulingOfferingsRepository.findLiveHoldsOfProfessional | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:159` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateServiceHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resourceId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede donde se atiende | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:284` |
| `startAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Cuándo empieza la atención | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:291` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente para el que se reserva | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:299` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ServiceHoldResponseDto>` · DTO `ServiceHoldResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:304` |
| `holdToken` | `string` | Sí | — | — | Token con el que se confirma o solicita la reserva. Se entrega una sola vez. | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:310` |
| `expiresAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:312` |
| `bookableSlotId` | `string` | Sí | formato uuid | — | El cupo que nació para este turno | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:318` |
| `startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:320` |
| `endAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:321` |
| `retractedSlots` | `number` | Sí | — | — | Cupos de consulta que este turno retiró de la agenda del profesional | `src/modules/scheduling/presentation/dto/scheduling-service-offerings.dto.ts:327` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No cuenta con autorización de tutoría sobre el paciente indicado; ForbiddenException: La agenda indicada pertenece a otra organización. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agenda no encontrada |
| 409 | `CONFLICT` | ConflictException: Ese horario ya no está disponible para este servicio. Elija otro. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese horario ya pasó.; PreconditionFailedException: Su vínculo con esta organización todavía está pendiente de aprobación. / Su vínculo con esta organización ya no está vigente.; PreconditionFailedException: Esa cita empieza demasiado pronto: hay que pedirla con al menos {group.minNoticeMinutes} minutos de anticipación.; PreconditionFailedException: Sólo se puede pedir con hasta {group.maxAdvanceDays} días de anticipación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingServiceOfferingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 57. GET /scheduling/slots

- **Origen:** CONTRATO
- **Nombre:** Consultar los cupos de una ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingAgendaController.listSlots` — `src/modules/scheduling/presentation/controllers/scheduling-agenda.controller.ts:46`

### Qué es y para qué sirve (negocio)

Consultar los cupos de una ventana. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/slots` la atiende `SchedulingAgendaController.listSlots` (src/modules/scheduling/presentation/controllers/scheduling-agenda.controller.ts:46). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingAgendaService.listSlots`. Lee scheduling.bookable_slots.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling-agenda.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingAgendaController.listSlots → SchedulingAgendaService.listSlots → SchedulingAgendaRepository.findSlots | `src/modules/scheduling/infrastructure/repositories/scheduling-agenda.repository.ts:132` |

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
| `items` | `array<SlotListItemDto>` | Sí | — | — | Cupos de esta página, del más próximo al más lejano. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:359` |
| `items[].id` | `string` | Sí | formato uuid | — | Id a enviar para reservar el cupo | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:302` |
| `items[].resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:308` |
| `items[].scheduleTemplateId` | `string` | No | formato uuid; admite null | — | Identificador asociado a schedule template. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:314` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:320` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:326` |
| `items[].capacity` | `number` | Sí | — | — | Cupos totales del slot. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:332` |
| `items[].remainingCapacity` | `number` | Sí | — | — | Cupos que quedan libres. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:338` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:344` |
| `items[].serviceConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a service concept. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:350` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:365` |
| `limit` | `number` | Sí | — | — | Tope aplicado. | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:371` |
| `truncated` | `boolean` | Sí | — | — | Si la ventana excede el tope y hay que estrecharla | `src/modules/scheduling/presentation/dto/scheduling-agenda.dto.ts:381` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:89` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:240` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 58. POST /scheduling/slots/{id}/holds

- **Origen:** CONTRATO
- **Nombre:** Reservar temporalmente un cupo del slot
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.placeHold` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:688`

### Qué es y para qué sirve (negocio)

Reservar temporalmente un cupo del slot. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/slots/{id}/holds` la atiende `SchedulingController.placeHold` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:688). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `CreateHoldDto` (1 campo, 0 obligatorios). Delega en `SchedulingBookingsService.placeHold`. Crea filas en scheduling.slot_holds. Actualiza scheduling.bookable_slots. Lee profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.booking_policies, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:688` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:688` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → BookingAccess.assertMayActForPatient → ProfilesPatientRepresentationAdapter.assertMayActForPatient → PatientRepresentationService.assertMayActForPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → SchedulingBookingsRepository.countActiveBookingsForPatient | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:688` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute | `src/modules/scheduling/application/bookings/use-cases/place-hold.use-case.ts:146` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → SchedulingBookingsRepository.findSlotForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:211` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → SlotPolicyResolver.resolvePolicy → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → SlotPolicyResolver.resolvePolicy → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |
| `scheduling.slot_holds` | ESCRIBE | CREA | DIRECTA | SchedulingController.placeHold → SchedulingBookingsService.placeHold → PlaceHoldUseCase.execute → SchedulingBookingsRepository.createHold | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:237` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente para el que se reserva | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:65` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:76` |
| `holdToken` | `string` | Sí | — | — | Token con el que se confirma la reserva. Se entrega una sola vez. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:85` |
| `expiresAt` | `string` | Sí | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:91` |
| `remainingCapacity` | `number` | Sí | — | — | Cupos que quedan libres en el slot | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:97` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Slot no encontrado |
| 409 | `CONFLICT` | ConflictException: El slot no tiene cupos disponibles; ConflictException: El paciente alcanzó el máximo de citas activas |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El slot está bloqueado; PreconditionFailedException: Ese horario ya no está disponible.; PreconditionFailedException: Ese horario ya pasó. / Esa cita empieza demasiado pronto: hay que pedirla con al menos {noticeMinutes} minutos de anticipación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:254` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:335` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:258` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:191` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:192` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:317` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:143` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:98` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:104` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:252` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:163` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `P1`

---

## 59. DELETE /scheduling/templates/{id}

- **Origen:** CONTRATO
- **Nombre:** Retirar una plantilla de agenda y soltar sus cupos libres
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.retireTemplate` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:322`

### Qué es y para qué sirve (negocio)

Retirar una plantilla de agenda y soltar sus cupos libres. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /scheduling/templates/{id}` la atiende `SchedulingController.retireTemplate` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:322). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.retireTemplate`. Crea filas en audit.appointment_bookings_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, scheduling.booking_cancellations. Actualiza audit.appointment_bookings_history, iam.devices, messaging.notification_requests, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedule_templates. Borra de scheduling.bookable_slots, scheduling.slot_holds. Lee audit.appointment_bookings_history, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:322` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:322` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.appointment_bookings_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | ESCRIBE | CREA | POR_REGISTRO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `audit.appointment_bookings_history` | LEE | LEE | POR_REGISTRO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → BookingTransitionRecorder.recordTransition → AuditBookingHistoryAdapter.append | `src/modules/scheduling/infrastructure/adapters/audit-booking-history.adapter.ts:23` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → MessagingAgendaNoticeAdapter.emit → MessagingAgendaNoticeAdapter.deliver → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | POR_SQL | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.describeBooking → SchedulingNoticeRepository.describeSite | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:230` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.announce → CancelBookingUseCase.announceChange → BookingChangeNotifier.notifyChange → SchedulingNoticeRepository.findResourceAccount → SchedulingNoticeRepository.findAccountForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:77` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction | `src/modules/scheduling/application/bookings/use-cases/cancel-booking.use-case.ts:286` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.findBookingsOfTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:818` |
| `scheduling.bookable_slots` | BORRA | BORRA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1000` |
| `scheduling.bookable_slots` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:991` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.findSlotsOfTemplateForUpdate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1207` |
| `scheduling.booking_cancellations` | ESCRIBE | CREA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → SchedulingBookingsRepository.createCancellation | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1213` |
| `scheduling.booking_policies` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → SchedulingCatalogRepository.findPolicyById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:380` |
| `scheduling.booking_reschedules` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:972` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → BlockedBookingsCanceller.cancelAll → CancelBookingUseCase.cancelInTransaction → ServiceSlotLifecycle.isFlexible → SchedulingCatalogRepository.findRulesByTemplates | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:471` |
| `scheduling.schedule_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1010` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |
| `scheduling.slot_holds` | BORRA | BORRA | DIRECTA | SchedulingController.retireTemplate → SchedulingCatalogService.retireTemplate → RetireTemplateUseCase.execute → SchedulingCatalogRepository.retireTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:997` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `affectedBookings` | query | No | `string` | cancel: cancela las citas vivas del horario y avisa a cada paciente. keep o ausente: las conserva, como siempre. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RetireTemplateResponseDto>` · DTO `RetireTemplateResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | La plantilla retirada. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:983` |
| `statusConceptId` | `string` | Sí | formato uuid | — | El estado con el que queda: `TPL_RETIRED`. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:987` |
| `releasedSlots` | `number` | Sí | — | — | Cupos libres que se soltaron al retirar el horario | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:993` |
| `keptSlots` | `number` | Sí | — | — | Cupos conservados porque tienen una cita detrás | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1004` |
| `liveBookings` | `number` | Sí | — | — | Citas confirmadas o presentadas que siguen vivas en cupos conservados | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1016` |
| `liveBookingIds` | `array<string>` | Sí | formato uuid | — | Ids (nunca nombres) de esas citas, hasta un tope. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1020` |
| `truncated` | `boolean` | Sí | — | — | `true` si hay más citas vivas que las listadas en `liveBookingIds`. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1024` |
| `cancelledBookings` | `number` | Sí | — | — | Citas canceladas por este retiro, con aviso al paciente. Sólo es mayor que 0 cuando se pidió `?affectedBookings=cancel` (24/10/2026). | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1031` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado; ResourceNotFoundException: Cita no encontrada |
| 409 | `CONFLICT` | ConflictException: La cita ya está cancelada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda antes de bloquear.; PreconditionFailedException: Puede cancelar hasta {Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:228` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:295` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:239` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 60. PATCH /scheduling/templates/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una plantilla de agenda ya publicada
- **Bloque:** Práctica y Agenda
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.updateTemplate` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:291`

### Qué es y para qué sirve (negocio)

Editar una plantilla de agenda ya publicada. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`PATCH /scheduling/templates/{id}` la atiende `SchedulingController.updateTemplate` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:291). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `SchedulingUpdateTemplateDto` (15 campos, 0 obligatorios). Delega en `SchedulingCatalogService.updateTemplate`. Crea filas en scheduling.schedule_rules. Actualiza scheduling.schedule_templates. Borra de scheduling.schedule_rules. Lee scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:291` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:291` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.updateTemplate → SchedulingCatalogService.updateTemplate → UpdateTemplateUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | BORRA | BORRA | DIRECTA | SchedulingController.updateTemplate → SchedulingCatalogService.updateTemplate → UpdateTemplateUseCase.execute → SchedulingCatalogRepository.deleteRulesByTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:573` |
| `scheduling.schedule_rules` | ESCRIBE | CREA | DIRECTA | SchedulingController.updateTemplate → SchedulingCatalogService.updateTemplate → UpdateTemplateUseCase.execute → SchedulingCatalogRepository.createRule | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:486` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.updateTemplate → SchedulingCatalogService.updateTemplate → UpdateTemplateUseCase.execute → SchedulingCatalogRepository.findRulesByTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:516` |
| `scheduling.schedule_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.updateTemplate → SchedulingCatalogService.updateTemplate → UpdateTemplateUseCase.execute | `src/modules/scheduling/application/catalog/use-cases/update-template.use-case.ts:99` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.updateTemplate → SchedulingCatalogService.updateTemplate → UpdateTemplateUseCase.execute → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SchedulingUpdateTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:499` |
| `rules` | `array<ScheduleRuleDto>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ScheduleRuleDto)` | Franjas semanales de la plantilla. Si viene, reemplaza TODAS las existentes. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:511` |
| `rules[].dayOfWeek` | `number` | No | mínimo 0; máximo 6 | `@IsInt()` `@Min(0)` `@Max(6)` | 0 = domingo … 6 = sábado | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:275` |
| `rules[].startTime` | `string` | No | patrón runtime /^\d{2}:\d{2}(:\d{2})?$/ | `@Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'startTime debe tener formato HH:MM o HH:MM:SS', })` | Hora de inicio HH:MM:SS | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:284` |
| `rules[].endTime` | `string` | No | patrón runtime /^\d{2}:\d{2}(:\d{2})?$/ | `@Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'endTime debe tener formato HH:MM o HH:MM:SS', })` | Hora de fin HH:MM:SS | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:293` |
| `rules[].slotMinutes` | `number` | No | mínimo 5 | `@IsOptional()` `@IsInt()` `@Min(5)` | Duración del slot en minutos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:302` |
| `rules[].capacityPerSlot` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Cupos por slot | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:311` |
| `rules[].gapMinutes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Minutos de respiro entre un turno y el siguiente. Ausente ≡ 0 | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:335` |
| `rules[].bookingMode` | `string` | No | valores: CONSULTATIONS, SERVICES, MIXED | `@IsOptional()` `@IsIn(RULE_BOOKING_MODES as readonly string[])` | Qué admite la franja: consultas, servicios o ambos. Ausente ≡ CONSULTATIONS | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:348` |
| `rules[].telemedicineEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | La franja atiende también por telemedicina. Ausente ≡ false (sólo presencial) | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:364` |
| `rules[].flexibleHours` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Horario flexible de esta franja: sin turnos fijos, el paciente elige la hora. No admite slotMinutes, capacityPerSlot ni gapMinutes. Ausente ≡ false | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:382` |
| `slotMinutes` | `number` | No | mínimo 5 | `@IsOptional()` `@IsInt()` `@Min(5)` | Duración por defecto del slot, en minutos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:519` |
| `bookingPolicyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:524` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:529` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:534` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
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
      "capacityPerSlot": 1,
      "gapMinutes": 1,
      "bookingMode": "CONSULTATIONS",
      "telemedicineEnabled": false,
      "flexibleHours": false
    }
  ],
  "slotMinutes": 5,
  "bookingPolicyId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<TemplateResponseDto>` · DTO `TemplateResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:738` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:744` |
| `ruleCount` | `number` | Sí | — | — | Franjas creadas | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:750` |
| `flexibleHours` | `boolean` | Sí | — | — | true cuando el horario es flexible, sin turnos fijos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:756` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:762` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La franja debe empezar antes de terminar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:136` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 61. POST /scheduling/templates/{id}/generate-slots

- **Origen:** CONTRATO
- **Nombre:** Materializar los slots de la plantilla en una ventana
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.generateSlots` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:366`

### Qué es y para qué sirve (negocio)

Materializar los slots de la plantilla en una ventana. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/templates/{id}/generate-slots` la atiende `SchedulingController.generateSlots` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:366). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Valida el cuerpo como `GenerateSlotsDto` (2 campos, 2 obligatorios). Delega en `SchedulingCatalogService.generateSlots`. Crea filas en scheduling.bookable_slots. Lee scheduling.appointment_bookings, scheduling.availability_exceptions, scheduling.bookable_slots, scheduling.schedulable_resources, scheduling.schedule_rules, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:366` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:366` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → GenerateSlotsUseCase.execute → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.confirmedBookings → SchedulingBookingsRepository.findProfessionalCommitmentsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:896` |
| `scheduling.availability_exceptions` | LEE | LEE | POR_SQL | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → GenerateSlotsUseCase.execute → SchedulingProfessionalTimeService.commitments → SchedulingProfessionalTimeService.busyTime → SchedulingBookingsRepository.findProfessionalBusyExceptionsOverlapping | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1068` |
| `scheduling.bookable_slots` | ESCRIBE | CREA | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → GenerateSlotsUseCase.execute → SchedulingCatalogRepository.createSlot | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:752` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → GenerateSlotsUseCase.execute → SchedulingCatalogRepository.findSlotsByTemplateInRange | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1051` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → GenerateSlotsUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_rules` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → GenerateSlotsUseCase.execute → SchedulingCatalogRepository.findRulesByTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:516` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.generateSlots → SchedulingCatalogService.generateSlots → GenerateSlotsUseCase.execute → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `GenerateSlotsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `from` | `string` | Sí | formato date-time | `@IsISO8601()` | Inicio de la ventana a materializar | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:775` |
| `to` | `string` | Sí | formato date-time | `@IsISO8601()` | Fin de la ventana (exclusivo) | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:785` |

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
| `templateId` | `string` | Sí | formato uuid | — | Identificador asociado a template. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:796` |
| `created` | `number` | Sí | — | — | Slots creados en esta ejecución | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:802` |
| `skipped` | `number` | Sí | — | — | Slots que ya existían y se conservaron | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:808` |
| `omittedByCommitments` | `number` | Sí | — | — | Cupos omitidos por chocar con compromisos del profesional (citas confirmadas en cualquiera de sus sedes) | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:821` |

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
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:126` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:209` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:158` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:178` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:135` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:294` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:115` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:211` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:230` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:167` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:86` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:234` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:153` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 62. GET /scheduling/templates/{id}/live-bookings

- **Origen:** CONTRATO
- **Nombre:** Listar las citas vivas de una plantilla antes de retirarla
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listTemplateLiveBookings` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:351`

### Qué es y para qué sirve (negocio)

Listar las citas vivas de una plantilla antes de retirarla. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/templates/{id}/live-bookings` la atiende `SchedulingController.listTemplateLiveBookings` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:351). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.listTemplateLiveBookings`. Lee profiles.person_profiles, profiles.persons, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:351` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:351` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.listTemplateLiveBookings → SchedulingCatalogService.listTemplateLiveBookings → ListTemplateLiveBookingsUseCase.execute → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.listTemplateLiveBookings → SchedulingCatalogService.listTemplateLiveBookings → ListTemplateLiveBookingsUseCase.execute → BlockedBookingsCanceller.describe → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | SchedulingController.listTemplateLiveBookings → SchedulingCatalogService.listTemplateLiveBookings → ListTemplateLiveBookingsUseCase.execute → BlockedBookingsCanceller.describe → SchedulingCatalogRepository.findBookingsOfSlots | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:905` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | SchedulingController.listTemplateLiveBookings → SchedulingCatalogService.listTemplateLiveBookings → ListTemplateLiveBookingsUseCase.execute → SchedulingCatalogRepository.findSlotsOfTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:1195` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listTemplateLiveBookings → SchedulingCatalogService.listTemplateLiveBookings → ListTemplateLiveBookingsUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.listTemplateLiveBookings → SchedulingCatalogService.listTemplateLiveBookings → ListTemplateLiveBookingsUseCase.execute → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TemplateLiveBookingsResponseDto>` · DTO `TemplateLiveBookingsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `templateId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1073` |
| `total` | `number` | Sí | — | — | Citas vivas en total: las cancelables y las de pacientes ya recibidos. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1077` |
| `bookings` | `array<AffectedBookingDto>` | Sí | — | — | Las que un retiro con `affectedBookings=cancel` cancelaría (o rechazaría). | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1081` |
| `bookings[].bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1053` |
| `bookings[].startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1056` |
| `bookings[].endAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1059` |
| `bookings[].patientName` | `string` | Sí | admite null | — | El nombre del paciente; `null` si no se pudo resolver. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1063` |
| `bookings[].pending` | `boolean` | Sí | — | — | Solicitud sin responder: se rechaza en vez de cancelarse. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1067` |
| `present` | `array<AffectedBookingDto>` | Sí | — | — | Pacientes ya recibidos: frenan el retiro con cancelación (422). | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1085` |
| `present[].bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1053` |
| `present[].startAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1056` |
| `present[].endAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1059` |
| `present[].patientName` | `string` | Sí | admite null | — | El nombre del paciente; `null` si no se pudo resolver. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1063` |
| `present[].pending` | `boolean` | Sí | — | — | Solicitud sin responder: se rechaza en vez de cancelarse. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:1067` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta agenda es de otro profesional: solo la administra quien atiende en ella.; ForbiddenException: Esta agenda es de otra organización: no puede ver ni cancelar sus citas. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Recurso de la plantilla no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 63. POST /scheduling/templates/{id}/reactivate

- **Origen:** CONTRATO
- **Nombre:** Reactivar un horario retirado
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.reactivateTemplate` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:263`

### Qué es y para qué sirve (negocio)

Reactivar un horario retirado. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/templates/{id}/reactivate` la atiende `SchedulingController.reactivateTemplate` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:263). Exige sesión con alguno de los roles SCHEDULING_ADMIN, PRACTITIONER. Delega en `SchedulingCatalogService.reactivateTemplate`. Actualiza scheduling.schedule_templates. Lee scheduling.schedulable_resources, scheduling.schedule_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, PRACTITIONER | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:263` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:263` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.reactivateTemplate → SchedulingCatalogService.reactivateTemplate → ReactivateTemplateUseCase.execute → SchedulingCatalogRepository.findResourceById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:334` |
| `scheduling.schedule_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SchedulingController.reactivateTemplate → SchedulingCatalogService.reactivateTemplate → ReactivateTemplateUseCase.execute → SchedulingCatalogRepository.reactivateTemplate | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:921` |
| `scheduling.schedule_templates` | LEE | LEE | DIRECTA | SchedulingController.reactivateTemplate → SchedulingCatalogService.reactivateTemplate → ReactivateTemplateUseCase.execute → SchedulingCatalogRepository.findTemplateById | `src/modules/scheduling/infrastructure/repositories/scheduling-catalog.repository.ts:432` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReactivateTemplateResponseDto>` · DTO `ReactivateTemplateResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | La plantilla reactivada. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:966` |
| `statusConceptId` | `string` | Sí | formato uuid | — | El estado con el que queda: `TPL_PUBLISHED`. | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:970` |
| `slotsPendientes` | `boolean` | Sí | — | — | true cuando el horario quedó vigente sin cupos materializados y hay que generarlos | `src/modules/scheduling/presentation/dto/scheduling-catalog.dto.ts:977` |

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
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:303` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 64. GET /scheduling/waitlist

- **Origen:** CONTRATO
- **Nombre:** Listar las entradas de lista de espera de un paciente
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.listWaitlist` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:783`

### Qué es y para qué sirve (negocio)

Listar las entradas de lista de espera de un paciente. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /scheduling/waitlist` la atiende `SchedulingController.listWaitlist` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:783). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. Delega en `SchedulingWaitlistService.listForPatient`. Lee profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.person_profiles, profiles.persons, scheduling.schedulable_resources, scheduling.waitlist_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:783` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → SchedulingWaitlistService.assertMaySeePatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → SchedulingWaitlistService.assertMaySeePatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → SchedulingWaitlistService.assertMaySeePatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile → SchedulingNoticeRepository.resolvePersonId | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient → SchedulingNoticeRepository.describeResource → SchedulingNoticeRepository.findDisplayNameForProfile | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:154` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient → SchedulingNoticeRepository.describeResource | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:245` |
| `scheduling.waitlist_entries` | LEE | LEE | DIRECTA | SchedulingController.listWaitlist → SchedulingWaitlistService.listForPatient → PostgresWaitlistAdapter.findEntriesForPatient → SchedulingNoticeRepository.findWaitlistByPatient | `src/modules/scheduling/infrastructure/repositories/scheduling-notice.repository.ts:304` |

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
| `items` | `array<WaitlistEntryItemDto>` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:933` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:861` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:864` |
| `items[].resourceId` | `string` | No | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:867` |
| `items[].resourceLabel` | `string` | Sí | — | — | Nombre del profesional o del recurso | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:874` |
| `items[].desiredFrom` | `string` | No | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:877` |
| `items[].desiredTo` | `string` | No | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:880` |
| `items[].priority` | `number` | Sí | — | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:883` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:886` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:889` |
| `items[].patientName` | `string` | No | — | — | Nombre del paciente que espera | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:899` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular y el personal de agenda pueden ver esta lista de espera. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:409` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:62` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 65. POST /scheduling/waitlist

- **Origen:** CONTRATO
- **Nombre:** Inscribir a un paciente en la lista de espera
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SchedulingController.enrollWaitlist` — `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:761`

### Qué es y para qué sirve (negocio)

Inscribir a un paciente en la lista de espera. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /scheduling/waitlist` la atiende `SchedulingController.enrollWaitlist` (src/modules/scheduling/presentation/controllers/scheduling.controller.ts:761). Exige sesión con alguno de los roles SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. Valida el cuerpo como `CreateWaitlistEntryDto` (6 campos, 2 obligatorios). Delega en `SchedulingWaitlistService.enroll`. Crea filas en scheduling.waitlist_entries. Lee profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:761` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | SchedulingController.enrollWaitlist → SchedulingWaitlistService.enroll → SchedulingWaitlistService.assertMaySeePatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SchedulingController.enrollWaitlist → SchedulingWaitlistService.enroll → SchedulingWaitlistService.assertMaySeePatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SchedulingController.enrollWaitlist → SchedulingWaitlistService.enroll → SchedulingWaitlistService.assertMaySeePatient → ProfilesPatientRepresentationAdapter.representsPatient → PatientRepresentationService.representsPatient → PatientRepresentationService.isOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.waitlist_entries` | ESCRIBE | CREA | DIRECTA | SchedulingController.enrollWaitlist → SchedulingWaitlistService.enroll → PostgresWaitlistAdapter.enroll → SchedulingBookingsRepository.createWaitlistEntry | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1241` |

### Cuerpo — DTO `CreateWaitlistEntryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:460` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:467` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Recurso deseado | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:475` |
| `desiredFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:483` |
| `desiredTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:491` |
| `priority` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Prioridad; a mayor valor, antes se promueve | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:503` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:514` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:520` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/scheduling/presentation/dto/scheduling-bookings.dto.ts:526` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular y el personal de agenda pueden ver esta lista de espera. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:398` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:284` |
| CONTROLADOR | `src/modules/scheduling/presentation/controllers/scheduling.controller.spec.ts:191` |

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:SchedulingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_
- Ciclo de vida de una cita — etapa `A5`

---

## 66. GET /tenants/{tenantId}/agenda

- **Origen:** CONTRATO
- **Nombre:** La agenda de la organización
- **Bloque:** Práctica y Agenda
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantAgendaController.list` — `src/modules/scheduling/presentation/controllers/tenant-agenda.controller.ts:36`

### Qué es y para qué sirve (negocio)

La agenda de la organización. Dentro del módulo (descripción del modelo, en inglés): «The full booking (agenda) layer on top of the clinical appointment record.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_41_scheduling.puml:49`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/agenda` la atiende `TenantAgendaController.list` (src/modules/scheduling/presentation/controllers/tenant-agenda.controller.ts:36). Exige sesión; el controlador no declara roles. Delega en `SchedulingTenantAgendaService.list`. Lee directory.tenant_memberships, profiles.persons, scheduling.appointment_bookings, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/scheduling/presentation/controllers/tenant-agenda.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/scheduling/presentation/controllers/tenant-agenda.controller.ts:36` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.list → DirectoryTenantDirectoryAdapter.assertCanRead → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `profiles.persons` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.list → SchedulingTenantAgendaService.project → DirectoryTenantDirectoryAdapter.findDisplayNames | `src/modules/scheduling/infrastructure/adapters/directory-tenant-directory.adapter.ts:27` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.list → SchedulingBookingsRepository.findTenantAgenda | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:647` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.list → SchedulingBookingsRepository.findTenantAgenda | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:657` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | TenantAgendaController.list → SchedulingTenantAgendaService.list → SchedulingAgendaRepository.findResources | `src/modules/scheduling/infrastructure/repositories/scheduling-agenda.repository.ts:91` |

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
| `items` | `array<TenantAgendaItemDto>` | Sí | — | — | Las citas, en orden cronológico. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:116` |
| `items[].bookingId` | `string` | Sí | formato uuid | — | La cita. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:77` |
| `items[].startAt` | `string` | Sí | formato date-time | — | Cuándo empieza. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:81` |
| `items[].endAt` | `string` | Sí | formato date-time | — | Cuándo termina. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:85` |
| `items[].resourceId` | `string` | Sí | formato uuid; admite null | — | El recurso —la sede— donde se atiende. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:89` |
| `items[].resourceName` | `string` | Sí | admite null | — | Nombre de la sede, para no obligar a la pantalla a cruzarlo. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:93` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid; admite null | — | El profesional que atiende, si el recurso apunta a uno. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:97` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | El paciente citado. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:101` |
| `items[].patientName` | `string` | Sí | admite null | — | Nombre del paciente: la organización lo recibe en la puerta. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:105` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la cita. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:109` |
| `truncated` | `boolean` | Sí | — | — | Si la ventana devolvió tantas citas como el tope permitía. Una agenda a la que le faltan citas sin avisar se lee como una agenda más vacía de lo que está, que es exactamente la lectura contraria a la que una recepción necesita. | `src/modules/scheduling/presentation/dto/tenant-agenda.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana no es una fecha válida; PreconditionFailedException: La ventana debe empezar antes de terminar; PreconditionFailedException: El rango no puede superar los {MAX_AGENDA_RANGE_DAYS} días |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/scheduling.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 41 — Scheduling (agenda) — etapa `ctrl:TenantAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

