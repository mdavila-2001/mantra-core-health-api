<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `scheduling`

Referencia exhaustiva de 53 operación(es) del módulo `scheduling`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `scheduling`, `scheduling-agenda`, `scheduling-bookings`, `scheduling-confirmation`, `scheduling-internal`, `scheduling-tenant-agenda`
- **Controladores:** `SchedulingAgendaController`, `SchedulingBookingsController`, `SchedulingConfirmationController`, `SchedulingController`, `SchedulingInternalController`, `TenantAgendaController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /scheduling/activity-types](#1-get-scheduling-activity-types) — Listar las tipologías de actividad de la agenda
2. [POST /scheduling/appointments/direct](#2-post-scheduling-appointments-direct) — Asignar una cita puntual a un paciente (nace confirmada)
3. [POST /scheduling/appointments/walk-in](#3-post-scheduling-appointments-walk-in) — Turno de mostrador atómico (walk-in)
4. [POST /scheduling/booking-policies](#4-post-scheduling-booking-policies) — Definir una política de reserva
5. [GET /scheduling/bookings](#5-get-scheduling-bookings) — UC-41-15: lista citas por paciente, recurso y/o ventana
6. [GET /scheduling/bookings/{id}](#6-get-scheduling-bookings-id) — UC-41-15: consulta una cita
7. [POST /scheduling/bookings/{id}/accept](#7-post-scheduling-bookings-id-accept) — Aceptar la solicitud de cita
8. [POST /scheduling/bookings/{id}/cancel](#8-post-scheduling-bookings-id-cancel) — Cancelar la cita y liberar el cupo
9. [POST /scheduling/bookings/{id}/check-in](#9-post-scheduling-bookings-id-check-in) — Registrar la llegada del paciente
10. [POST /scheduling/bookings/{id}/complete](#10-post-scheduling-bookings-id-complete) — Completar la atención
11. [POST /scheduling/bookings/{id}/delay](#11-post-scheduling-bookings-id-delay) — Informar una demora sobre una cita
12. [GET /scheduling/bookings/{id}/payment-state](#12-get-scheduling-bookings-id-payment-state) — Leer el estado de pago de una cita
13. [PUT /scheduling/bookings/{id}/payment-state](#13-put-scheduling-bookings-id-payment-state) — Marcar el estado de pago de una cita
14. [POST /scheduling/bookings/{id}/propose-schedule](#14-post-scheduling-bookings-id-propose-schedule) — Proponer otro horario para la solicitud
15. [POST /scheduling/bookings/{id}/reject](#15-post-scheduling-bookings-id-reject) — Rechazar la solicitud de cita
16. [POST /scheduling/bookings/{id}/reminders](#16-post-scheduling-bookings-id-reminders) — Programar recordatorios para la cita
17. [POST /scheduling/bookings/{id}/request-info](#17-post-scheduling-bookings-id-request-info) — Pedir documentación u orden médica antes de aceptar
18. [POST /scheduling/bookings/{id}/reschedule](#18-post-scheduling-bookings-id-reschedule) — Reprogramar la cita a otro slot
19. [POST /scheduling/bookings/{id}/start](#19-post-scheduling-bookings-id-start) — Iniciar la atención
20. [GET /scheduling/confirmation-rules](#20-get-scheduling-confirmation-rules) — Listar las reglas de un tenant
21. [POST /scheduling/confirmation-rules](#21-post-scheduling-confirmation-rules) — Crear una regla de confirmación
22. [POST /scheduling/confirmation-rules/{id}/activate](#22-post-scheduling-confirmation-rules-id-activate) — Reactivar una regla desactivada
23. [POST /scheduling/confirmation-rules/{id}/deactivate](#23-post-scheduling-confirmation-rules-id-deactivate) — Desactivar una regla (sin borrado duro)
24. [POST /scheduling/confirmation-rules/evaluate](#24-post-scheduling-confirmation-rules-evaluate) — Evaluar una solicitud de reserva contra las reglas vigentes
25. [GET /scheduling/exception-types](#25-get-scheduling-exception-types) — Listar los motivos de bloqueo de agenda
26. [DELETE /scheduling/exceptions/{id}](#26-delete-scheduling-exceptions-id) — Eliminar una excepción de disponibilidad
27. [PATCH /scheduling/exceptions/{id}](#27-patch-scheduling-exceptions-id) — Editar una excepción de disponibilidad
28. [POST /scheduling/holds/{holdToken}/confirm](#28-post-scheduling-holds-holdtoken-confirm) — Confirmar la cita a partir de la reserva temporal
29. [POST /scheduling/holds/{holdToken}/request](#29-post-scheduling-holds-holdtoken-request) — Solicitar la cita a partir de la reserva temporal
30. [POST /scheduling/internal/dispatch-reminders](#30-post-scheduling-internal-dispatch-reminders) — Despachar los recordatorios cuya hora ya llegó
31. [POST /scheduling/internal/expire-holds](#31-post-scheduling-internal-expire-holds) — Liberar las reservas temporales vencidas
32. [POST /scheduling/internal/promote-waitlist/{slotId}](#32-post-scheduling-internal-promote-waitlist-slotid) — Promover candidatos de la lista de espera a un slot con cupo
33. [GET /scheduling/internal/waitlist-candidates](#33-get-scheduling-internal-waitlist-candidates) — Listar slots con cupo libre y candidatos activos en espera
34. [GET /scheduling/resources](#34-get-scheduling-resources) — Listar los recursos agendables de un tenant
35. [POST /scheduling/resources](#35-post-scheduling-resources) — Dar de alta un recurso agendable
36. [POST /scheduling/resources/{id}/close-slots](#36-post-scheduling-resources-id-close-slots) — Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos
37. [POST /scheduling/resources/{id}/delay](#37-post-scheduling-resources-id-delay) — Informar una demora que alcanza a toda la agenda del recurso
38. [GET /scheduling/resources/{id}/exceptions](#38-get-scheduling-resources-id-exceptions) — Listar las excepciones de disponibilidad de un recurso
39. [POST /scheduling/resources/{id}/exceptions](#39-post-scheduling-resources-id-exceptions) — Registrar una excepción de disponibilidad
40. [POST /scheduling/resources/{id}/shift-slots](#40-post-scheduling-resources-id-shift-slots) — Correr los cupos de una agenda N minutos
41. [GET /scheduling/resources/{id}/slots](#41-get-scheduling-resources-id-slots) — UC-41-14: agenda publicada del recurso en una ventana
42. [GET /scheduling/resources/{id}/templates](#42-get-scheduling-resources-id-templates) — Listar las plantillas de agenda de un recurso
43. [POST /scheduling/resources/{id}/templates](#43-post-scheduling-resources-id-templates) — Publicar una plantilla de agenda con sus franjas
44. [GET /scheduling/resources/{resourceId}/waitlist](#44-get-scheduling-resources-resourceid-waitlist) — Listar quiénes esperan turno en una agenda
45. [GET /scheduling/slots](#45-get-scheduling-slots) — Consultar los cupos de una ventana
46. [POST /scheduling/slots/{id}/holds](#46-post-scheduling-slots-id-holds) — Reservar temporalmente un cupo del slot
47. [DELETE /scheduling/templates/{id}](#47-delete-scheduling-templates-id) — Retirar una plantilla de agenda y soltar sus cupos libres
48. [PATCH /scheduling/templates/{id}](#48-patch-scheduling-templates-id) — Editar una plantilla de agenda ya publicada
49. [POST /scheduling/templates/{id}/generate-slots](#49-post-scheduling-templates-id-generate-slots) — Materializar los slots de la plantilla en una ventana
50. [POST /scheduling/templates/{id}/reactivate](#50-post-scheduling-templates-id-reactivate) — Reactivar un horario retirado
51. [GET /scheduling/waitlist](#51-get-scheduling-waitlist) — Listar las entradas de lista de espera de un paciente
52. [POST /scheduling/waitlist](#52-post-scheduling-waitlist) — Inscribir a un paciente en la lista de espera
53. [GET /tenants/{tenantId}/agenda](#53-get-tenants-tenantid-agenda) — La agenda de la organización

---

## 1. GET /scheduling/activity-types

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Listar las tipologías de actividad de la agenda
- **Operation ID:** `SchedulingController_listActivityTypes`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.listActivityTypes](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Catálogo para pintar el día: clave, concepto, etiqueta en castellano y tono del sistema de diseño.

Contexto declarado en el controlador: Las tipologías de actividad que la agenda sabe pintar (carril 12). El propietario lo pidió así: «con otros colores los otros procedimientos (TURNOS, OPERACIONES, ETC.) catalogado por tipología raíz». La columna existía y no había un solo concepto que ponerle. Manda `tone` y no un color: el color concreto es del sistema de diseño. Un `#RRGGBB` desde el servidor obligaría a redesplegarlo para cambiar la paleta y rompería el tema oscuro.

### Descripción del sistema

NestJS resuelve `GET /scheduling/activity-types` en `SchedulingController_listActivityTypes`. El controlador delega en `SchedulingCatalogService.listActivityTypes`. No recibe body. El tipo de retorno estático es `ActivityTypeListDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/activity-types HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/activity-types HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `ActivityTypeListDto` | No |
| 400 | Consulta completada correctamente. | `ActivityTypeListDto` | No |
| 401 | Consulta completada correctamente. | `ActivityTypeListDto` | No |
| 403 | Consulta completada correctamente. | `ActivityTypeListDto` | No |
| 429 | Consulta completada correctamente. | `ActivityTypeListDto` | No |
| 500 | Consulta completada correctamente. | `ActivityTypeListDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ActivityTypeListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "type": "APPOINTMENT",
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "label": "Operación o procedimiento",
      "tone": "primary"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ActivityTypeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"type":"APPOINTMENT","conceptId":"00000000-0000-4000-8000-000000000001","label":"Operación o procedimiento","tone":"primary"}]` |
| `items[].type` | Sí | `string` | valores: `APPOINTMENT`, `PROCEDURE`, `FOLLOW_UP`, `TELEHEALTH`, `OTHER` | Clave estable con la que se identifica la tipología. | `APPOINTMENT` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | El concepto real detrás, que es lo que guarda `appointments`. | `00000000-0000-4000-8000-000000000001` |
| `items[].label` | Sí | `string` | Sin restricción adicional declarada | Cómo se llama en pantalla, en castellano. | `Operación o procedimiento` |
| `items[].tone` | Sí | `string` | valores: `primary`, `secondary`, `info`, `warning`, `success` | El tono con el que se pinta, del sistema de diseño. `error` queda reservado para los BLOQUEOS —el propietario los pidió «con rojo»— así que ninguna tipología lo usa: si una actividad se pintara igual que un bloqueo, la agenda diría que ese rato está cerrado cuando no lo está. | `primary` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/activity-types"
}
```

---

## 2. POST /scheduling/appointments/direct

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Asignar una cita puntual a un paciente (nace confirmada)
- **Operation ID:** `SchedulingController_createDirectAppointment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.createDirectAppointment](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Cupo único + reserva en una transacción. Retira los horarios libres que pise y lo informa; la regla madre rechaza si el profesional ya está comprometido.

Contexto declarado en el controlador: AG-2 · La cita puntual: el doctor asigna, el paciente se entera. «Volvé el jueves a las 10» — lo que los consultorios hacen todos los días y el sistema no permitía: toda cita nacía de un cupo publicado que el paciente tomaba. Ésta nace CONFIRMADA (ya se acordó en persona), con campana al paciente y la salida de «pedir cambio».

### Descripción del sistema

NestJS resuelve `POST /scheduling/appointments/direct` en `SchedulingController_createDirectAppointment`. El controlador delega en `SchedulingBookingsService.createDirectAppointment`. Valida el body como `CreateDirectAppointmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<DirectAppointmentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDirectAppointmentDto`; los campos opcionales se omiten.

```http
POST /scheduling/appointments/direct HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `durationMinutes` | Sí | `number` | mínimo 5; máximo 480 | Sin descripción específica en el contrato OpenAPI. | `5` |
| `reasonText` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `channel` | No | `string` | valores: `PRESENCIAL`, `TELECONSULTA`, `DOMICILIO` | Modalidad de la atención. Ausente = PRESENCIAL. No es el canal de la reserva. | `PRESENCIAL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/appointments/direct HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5,
  "reasonText": "Texto descriptivo de ejemplo",
  "channel": "PRESENCIAL"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DirectAppointmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DirectAppointmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "bookableSlotId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "retractedSlots": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | La reserva creada, ya confirmada. | `00000000-0000-4000-8000-000000000001` |
| `bookableSlotId` | Sí | `string` | formato `uuid` | El cupo único que la respalda. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado con el que nace: confirmada. | `00000000-0000-4000-8000-000000000001` |
| `retractedSlots` | Sí | `number` | Sin restricción adicional declarada | Cupos ofrecidos que esta cita retiró. Si el rato pisaba horarios libres que el doctor mismo ofrecía —en cualquiera de sus sedes—, se retiran en la misma transacción y acá se informa cuántos: el front lo muestra como AVISO («esto quitó N horarios disponibles»), no como pregunta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Un profesional solo puede asignar citas en su propia agenda. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El paciente ya tiene un turno confirmado en ese rato${           choque.resourceName ? ` en «${choque.resourceName}»` : ''         }. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | veredicto === 'pendiente'         ? 'Tu vínculo con esta organización todavía está pendiente de ' +             'aprobación, así que todavía no podés comprometer turnos suyos.'         : 'Tu vínculo con esta organización ya no está vigente, así que no ' +             'podés aceptar turnos suyos. Las citas que ya confirmaste siguen ' +             'en pie: hablá con la organización para reactivarlo.' | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional ya tiene ${quien} de ${horaLocal(         primero.startAt,         primero.timeZone,       )} a ${horaLocal(         primero.endAt,         primero.timeZone,       )}${primero.resourceName ? ` en «${primero.resourceName}»` : ''}. No puede estar en dos lugares a la vez. | Excepción explícita en src/modules/scheduling/services/scheduling-professional-time.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/appointments/direct"
}
```

---

## 3. POST /scheduling/appointments/walk-in

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Turno de mostrador atómico (walk-in)
- **Operation ID:** `SchedulingController_createWalkInAppointment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.createWalkInAppointment](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Registra al paciente sin cuenta, reserva, abre el encuentro y arranca la atención en una sola transacción. 404 recurso; 409 documento ya registrado; 422 choque de horario.

Contexto declarado en el controlador: AC-3.3 · El turno de mostrador atómico: quien llega sin cuenta de portal se registra, reserva y empieza a ser atendido en un solo paso. Registra al paciente sin cuenta, reserva la cita, abre el encuentro clínico y arranca la atención — todo en una sola transacción. La reserva nace `IN_PROGRESS`, no `CONFIRMED`: quien llegó al mostrador ya está ahí, no esperando un check-in posterior. 404 si el recurso no existe; 409 si el documento ya está registrado (retomar al paciente existente con `GET /profiles/patients?nationalId=`); 422 si el horario choca con otro turno del profesional o del paciente.

### Descripción del sistema

NestJS resuelve `POST /scheduling/appointments/walk-in` en `SchedulingController_createWalkInAppointment`. El controlador delega en `SchedulingWalkInService.createWalkInAppointment`. Valida el body como `WalkInAppointmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<WalkInAppointmentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `WalkInAppointmentDto`; los campos opcionales se omiten.

```http
POST /scheduling/appointments/walk-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patient` | Sí | `WalkInPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"name":"Lucía","middleName":"Andrea","lastName":"Mamani","motherLastName":"Quispe","nationalId":"00000000-0000-4000-8000-000000000001","issuerAdministrativeAreaConceptId":"00000000-0000-4000-8000-000000000001","birthDate":"2026-07-31","phone":"+59170000000","occupationConceptId":"00000000-0000-4000-8000-000000000001","occupationFreeText":"valor-ejemplo","guardianName":"Nombre de ejemplo","guardianPhone":"+59170000000","guardianRelationshipConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `patient.name` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `patient.middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Andrea` |
| `patient.lastName` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Mamani` |
| `patient.motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Quispe` |
| `patient.nationalId` | Sí | `string` | longitud mínima 4; longitud máxima 40; patrón runtime `/^[A-Za-z0-9.-]+$/` | Documento de identidad del paciente | `00000000-0000-4000-8000-000000000001` |
| `patient.issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `patient.birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `patient.phone` | Sí | `string` | longitud máxima 40; patrón runtime `PHONE_PATTERN` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `+59170000000` |
| `patient.occupationConceptId` | No | `string` | formato `uuid` | Ocupación del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `patient.occupationFreeText` | No | `string` | longitud máxima 200 | Ocupación en texto libre, para cuando no está en el catálogo | `valor-ejemplo` |
| `patient.guardianName` | No | `string` | longitud mínima 1; longitud máxima 200 | Nombre del tutor o persona autorizada | `Nombre de ejemplo` |
| `patient.guardianPhone` | No | `string` | longitud máxima 40; patrón runtime `/^[+]?[0-9 ()-]{6,}$/` | Teléfono del tutor, en formato E.164 o nacional | `+59170000000` |
| `patient.guardianRelationshipConceptId` | No | `string` | formato `uuid` | Parentesco del contacto de emergencia (conjunto related-person-relationship) | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `durationMinutes` | Sí | `number` | mínimo 5; máximo 480 | Sin descripción específica en el contrato OpenAPI. | `5` |
| `reasonText` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `channel` | No | `string` | valores: `PRESENCIAL`, `TELECONSULTA`, `DOMICILIO` | Modalidad de la atención. Ausente = PRESENCIAL. No es el canal de la reserva. | `PRESENCIAL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/appointments/walk-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WalkInAppointmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WalkInAppointmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "patientCode": "CODIGO_EJEMPLO",
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "bookableSlotId": "00000000-0000-4000-8000-000000000001",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "retractedSlots": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | El perfil de paciente recién creado. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | La persona recién creada. | `00000000-0000-4000-8000-000000000001` |
| `patientCode` | Sí | `string` | Sin restricción adicional declarada | El código de paciente asignado. | `CODIGO_EJEMPLO` |
| `bookingId` | Sí | `string` | formato `uuid` | La reserva creada, ya `IN_PROGRESS`. | `00000000-0000-4000-8000-000000000001` |
| `bookableSlotId` | Sí | `string` | formato `uuid` | El cupo único que la respalda. | `00000000-0000-4000-8000-000000000001` |
| `appointmentId` | Sí | `string` | formato `uuid` | La cita clínica que respalda la reserva. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | Sí | `string` | formato `uuid` | El encuentro abierto, listo para registrar la atención. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la reserva: nace `IN_PROGRESS`. | `00000000-0000-4000-8000-000000000001` |
| `retractedSlots` | Sí | `number` | Sin restricción adicional declarada | Cupos ofrecidos que este turno retiró. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Un profesional solo puede asignar citas en su propia agenda. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El paciente ya tiene un turno confirmado en ese rato${           choque.resourceName ? ` en «${choque.resourceName}»` : ''         }. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | veredicto === 'pendiente'         ? 'Tu vínculo con esta organización todavía está pendiente de ' +             'aprobación, así que todavía no podés comprometer turnos suyos.'         : 'Tu vínculo con esta organización ya no está vigente, así que no ' +             'podés aceptar turnos suyos. Las citas que ya confirmaste siguen ' +             'en pie: hablá con la organización para reactivarlo.' | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional ya tiene ${quien} de ${horaLocal(         primero.startAt,         primero.timeZone,       )} a ${horaLocal(         primero.endAt,         primero.timeZone,       )}${primero.resourceName ? ` en «${primero.resourceName}»` : ''}. No puede estar en dos lugares a la vez. | Excepción explícita en src/modules/scheduling/services/scheduling-professional-time.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/appointments/walk-in"
}
```

---

## 4. POST /scheduling/booking-policies

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Definir una política de reserva
- **Operation ID:** `SchedulingController_createPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.createPolicy](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Definir una política de reserva. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/booking-policies` en `SchedulingController_createPolicy`. El controlador delega en `SchedulingCatalogService.createPolicy`. Valida el body como `CreateBookingPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<BookingPolicyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBookingPolicyDto`; los campos opcionales se omiten.

```http
POST /scheduling/booking-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código único de la política dentro del tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `practiceId` | No | `string` | formato `uuid` | Práctica a la que aplica la política | `00000000-0000-4000-8000-000000000001` |
| `minNoticeMinutes` | No | `number` | mínimo 0 | Antelación mínima para reservar, en minutos | `1` |
| `maxAdvanceDays` | No | `number` | mínimo 1 | Máximo de días de antelación | `1` |
| `cancellationWindowMinutes` | No | `number` | mínimo 0 | Ventana sin penalización para cancelar, en minutos | `1` |
| `noShowFeeAmount` | No | `string` | Sin restricción adicional declarada | Cargo por inasistencia | `50.00` |
| `maxActivePerPatient` | No | `number` | mínimo 1 | Citas activas simultáneas por paciente | `1` |
| `holdTtlSeconds` | No | `number` | mínimo 30 | Vigencia de la reserva temporal del slot, en segundos | `300` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/booking-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BookingPolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingPolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | El tenant indicado no es uno de los del actor. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 409 | `CONFLICT` | Ya existe una política con ese código | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/booking-policies"
}
```

---

## 5. GET /scheduling/bookings

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** UC-41-15: lista citas por paciente, recurso y/o ventana
- **Operation ID:** `SchedulingBookingsController_searchBookings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.searchBookings](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

UC-41-15: lista citas por paciente, recurso y/o ventana. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-41-15: listado de citas. Va declarado antes que las rutas `:id/...` porque Nest resuelve por orden de declaración; `bookings/:id` no colisiona con ellas, pero mantener la lectura arriba deja el orden explícito.

### Descripción del sistema

NestJS resuelve `GET /scheduling/bookings` en `SchedulingBookingsController_searchBookings`. El controlador delega en `SchedulingBookingsService.searchBookings`. No recibe body. El tipo de retorno estático es `Promise<SearchBookingsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | formato `date-time` | Instante ISO 8601 | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Instante ISO 8601 | `2026-07-31T12:00:00.000Z` |
| `includeCancelled` | query | No | `string` | Sin restricción adicional declarada | Incluye las canceladas y no-show (por defecto, no) | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/bookings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/bookings?patientProfileId=00000000-0000-4000-8000-000000000001&resourceId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&includeCancelled=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchBookingsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchBookingsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchBookingsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchBookingsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchBookingsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchBookingsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchBookingsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "paymentState": {
        "state": "PENDING",
        "label": "Parcialmente pagada",
        "conceptId": "00000000-0000-4000-8000-000000000001",
        "insuranceUsed": true,
        "markedByUserId": "00000000-0000-4000-8000-000000000001",
        "markedAt": "2026-07-31T12:00:00.000Z"
      },
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "bookableSlotId": "00000000-0000-4000-8000-000000000001",
      "appointmentId": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "bookingChannelConceptId": "00000000-0000-4000-8000-000000000001",
      "typeConceptId": "00000000-0000-4000-8000-000000000001",
      "confirmedAt": "2026-07-31T12:00:00.000Z",
      "checkedInAt": "2026-07-31T12:00:00.000Z",
      "reasonText": "Texto descriptivo de ejemplo",
      "patientName": "Nombre de ejemplo",
      "insuranceCarrierName": "Nombre de ejemplo",
      "insuranceClaim": {
        "id": "00000000-0000-4000-8000-000000000001",
        "claimIdentifier": "SOL-0001",
        "statusCode": "CLAIM_SUBMITTED",
        "statusDisplay": "Reclamo enviado",
        "submittedAt": "2026-07-31T12:00:00.000Z"
      },
      "rescheduledFrom": "2026-07-31T12:00:00.000Z",
      "statusReason": {
        "reasonText": "Texto descriptivo de ejemplo",
        "actorKind": "PATIENT",
        "toStateConceptId": "00000000-0000-4000-8000-000000000001",
        "changedAt": "2026-07-31T12:00:00.000Z"
      },
      "delayNotice": {
        "delayMinutes": 1,
        "message": "valor-ejemplo",
        "announcedAt": "2026-07-31T12:00:00.000Z"
      },
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<BookingItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"paymentState":{"state":"PENDING","label":"Parcialmente pagada","conceptId":"00000000-0000-4000-8000-000000000001","insuranceUsed":true,"markedByUserId":"00000000-0000-4000-8000-000000000001","markedAt":"2026-07-31T12:00:00.000Z"},"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","bookableSlotId":"00000000-0000-4000-8000-000000000001","appointmentId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z","statusConceptId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001","bookingChannelConceptId":"00000000-0000-4000-8000-000000000001","typeConceptId":"00000000-0000-4000-8000-000000000001","confirmedAt":"2026-07-31T12:00:00.000Z","checkedInAt":"2026-07-31T12:00:00.000Z","reasonText":"Texto descriptivo de ejemplo","patientName":"Nombre de ejemplo","insuranceCarrierName":"Nombre de ejemplo","insuranceClaim":{"id":"00000000-0000-4000-8000-000000000001","claimIdentifier":"SOL-0001","statusCode":"CLAIM_SUBMITTED","statusDisplay":"Reclamo enviado","submittedAt":"2026-07-31T12:00:00.000Z"},"rescheduledFrom":"2026-07-31T12:00:00.000Z","statusReason":{"reasonText":"Texto descriptivo de ejemplo","actorKind":"PATIENT","toStateConceptId":"00000000-0000-4000-8000-000000000001","changedAt":"2026-07-31T12:00:00.000Z"},"delayNotice":{"delayMinutes":1,"message":"valor-ejemplo","announcedAt":"2026-07-31T12:00:00.000Z"},"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].paymentState` | No | `PaymentStateDto` | Sin restricción adicional declarada | El estado de pago, si alguien lo marcó (TAREA-13 punto 5). **Se omite cuando no hay marca**, y no viaja como «pendiente de pago»: pendiente es una afirmación que alguien firmó, la ausencia es que del pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`. Viene en la misma consulta que la página, no una por fila. | `{"state":"PENDING","label":"Parcialmente pagada","conceptId":"00000000-0000-4000-8000-000000000001","insuranceUsed":true,"markedByUserId":"00000000-0000-4000-8000-000000000001","markedAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].paymentState.state` | No | `string` | valores: `PENDING`, `PARTIALLY_PAID`, `PAID` | Clave estable del estado. | `PENDING` |
| `items[].paymentState.label` | No | `string` | Sin restricción adicional declarada | Cómo se llama en pantalla, en castellano. | `Parcialmente pagada` |
| `items[].paymentState.conceptId` | No | `string` | formato `uuid` | El concepto real detrás, por si el cliente lo necesita. | `00000000-0000-4000-8000-000000000001` |
| `items[].paymentState.insuranceUsed` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].paymentState.markedByUserId` | No | `string` | formato `uuid` | Quién la dejó en este estado. | `00000000-0000-4000-8000-000000000001` |
| `items[].paymentState.markedAt` | No | `string` | formato `date-time` | Cuándo. | `2026-07-31T12:00:00.000Z` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | No | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | No | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `items[].bookableSlotId` | No | `string` | formato `uuid` | Identificador asociado a bookable slot. | `00000000-0000-4000-8000-000000000001` |
| `items[].appointmentId` | No | `string` | formato `uuid`; admite null | Cita clínica que respalda la reserva. Es el valor que acepta POST /clinical/encounters/check-in en su `appointmentId`. | `00000000-0000-4000-8000-000000000001` |
| `items[].encounterId` | No | `string` | formato `uuid`; admite null | Encuentro clínico de la cita que respalda la reserva; es el encounterId con el que la lectura de notas identifica cada atención. | `00000000-0000-4000-8000-000000000001` |
| `items[].startAt` | No | `string` | formato `date-time`; admite null | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `2026-07-31T12:00:00.000Z` |
| `items[].endAt` | No | `string` | formato `date-time`; admite null | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].bookingChannelConceptId` | No | `string` | formato `uuid` | Identificador asociado a booking channel concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].typeConceptId` | No | `string` | formato `uuid` | Qué clase de actividad es: consulta, procedimiento, control… Vive en `clinical.appointments.type_concept_id` y viaja acá porque la agenda del día pinta cada bloque según su tipología —el pedido del propietario habla de «TURNOS, OPERACIONES, ETC.»— y colorear por algo que la respuesta no trae es imposible. **Es un identificador de concepto, no un enum.** El catálogo de tipologías lo define el propietario (P-12-2) y todavía no está publicado: quien lo consuma hoy puede agrupar por id, no traducirlo a un nombre. Se omite cuando la cita no tiene contraparte clínica —una reserva que nunca llegó a confirmarse no crea `clinical.appointments`— o cuando la tiene y no declara tipo. Omitido, no vacío: `null` diría «no tiene tipo», que es una afirmación distinta. | `00000000-0000-4000-8000-000000000001` |
| `items[].confirmedAt` | No | `string` | formato `date-time` | Valor de confirmed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].checkedInAt` | No | `string` | formato `date-time` | Valor de checked in at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].reasonText` | No | `string` | Sin restricción adicional declarada | Valor de reason text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `items[].patientName` | No | `string` | Sin restricción adicional declarada | Nombre del paciente. Viaja con la **misma regla que el motivo de consulta**: lo ve el titular y el profesional que atiende en esa agenda, y no la vista de la organización. El médico necesita saber a quién espera —la agenda del día sin nombres es una lista de identificadores— y la organización ya opera con el perfil. | `Nombre de ejemplo` |
| `items[].insuranceCarrierName` | No | `string` | admite null | La aseguradora del paciente titular, o `null` si no declara ninguna (ALV-021 — «Particular» o el nombre de la cobertura). Viaja con la **misma regla de privacidad que `patientName`**: es un dato del paciente y lo ve quien ya puede verlo a él. `null` es la respuesta comprobada —«se buscó y no tiene»—; **ausente** es que no se comprobó porque quien mira no tiene el permiso, que es distinto de que el paciente no tenga seguro. | `Nombre de ejemplo` |
| `items[].insuranceClaim` | No | `BookingInsuranceClaimDto` | admite null | La solicitud de seguro más reciente de la cita (cita → encuentro clínico → solicitud), o `null` si se comprobó y no tiene. Viaja con la **misma regla de privacidad que `insuranceCarrierName`**: se **omite** cuando quien mira no puede ver al paciente. Hoy sólo lo trae el listado. Se resuelve en lote para toda la página. | `{"id":"00000000-0000-4000-8000-000000000001","claimIdentifier":"SOL-0001","statusCode":"CLAIM_SUBMITTED","statusDisplay":"Reclamo enviado","submittedAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].insuranceClaim.id` | Sí | `string` | formato `uuid` | `insurance.insurance_claims.id`: con esto se abre el detalle. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceClaim.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Número de la solicitud, el que se le dicta a la aseguradora. | `SOL-0001` |
| `items[].insuranceClaim.statusCode` | Sí | `string` | Sin restricción adicional declarada | Código del concepto de estado (`CLAIM_SUBMITTED`, `CLAIM_ADJUDICATED`, `CLAIM_PAID`, `CLAIM_REVERSED`…). Un código desconocido no es error. | `CLAIM_SUBMITTED` |
| `items[].insuranceClaim.statusDisplay` | Sí | `string` | Sin restricción adicional declarada | Etiqueta del estado en castellano, tal como está en el catálogo. | `Reclamo enviado` |
| `items[].insuranceClaim.submittedAt` | Sí | `string` | formato `date-time`; admite null | Cuándo se envió; `null` si todavía no se envió. | `2026-07-31T12:00:00.000Z` |
| `items[].rescheduledFrom` | No | `string` | formato `date-time` | De cuándo se movió, si la cita se reprogramó. Ausente cuando nunca se movió — que es distinto de «se movió y no sé desde cuándo». Es el instante ORIGINAL, no el id del cupo: la tarjeta dice «reprogramada desde el 20/08 a las 15:30», y resolverlo en la pantalla costaría una petición por cita para pintar una línea. | `2026-07-31T12:00:00.000Z` |
| `items[].statusReason` | No | `BookingStatusReasonDto` | Sin restricción adicional declarada | Motivo del último cambio que lo exigía (cancelación, rechazo o reprogramación), con quién lo hizo y cuándo. | `{"reasonText":"Texto descriptivo de ejemplo","actorKind":"PATIENT","toStateConceptId":"00000000-0000-4000-8000-000000000001","changedAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].statusReason.reasonText` | No | `string` | Sin restricción adicional declarada | Lo que escribió quien hizo el cambio | `Texto descriptivo de ejemplo` |
| `items[].statusReason.actorKind` | No | `string` | valores: `PATIENT`, `PROVIDER` | Desde qué lado se hizo el cambio. Permite decir «tu médico canceló» en vez de «la cita fue cancelada». | `PATIENT` |
| `items[].statusReason.toStateConceptId` | No | `string` | formato `uuid` | Estado al que llevó el cambio, si fue una transición | `00000000-0000-4000-8000-000000000001` |
| `items[].statusReason.changedAt` | No | `string` | formato `date-time` | Valor de changed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].delayNotice` | No | `BookingDelayNoticeDto` | Sin restricción adicional declarada | Última demora informada por el profesional, con sus minutos y su mensaje. | `{"delayMinutes":1,"message":"valor-ejemplo","announcedAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].delayNotice.delayMinutes` | No | `number` | Sin restricción adicional declarada | Minutos de demora informados | `1` |
| `items[].delayNotice.message` | No | `string` | Sin restricción adicional declarada | Mensaje del profesional | `valor-ejemplo` |
| `items[].delayNotice.announcedAt` | No | `string` | formato `date-time` | Cuándo se informó. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Número de elementos devueltos. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Si había más citas que el tope pedido | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Indique al menos patientProfileId o resourceId para listar citas | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings"
}
```

---

## 6. GET /scheduling/bookings/{id}

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** UC-41-15: consulta una cita
- **Operation ID:** `SchedulingBookingsController_getBooking`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.getBooking](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

UC-41-15: consulta una cita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-41-15: una cita concreta.

### Descripción del sistema

NestJS resuelve `GET /scheduling/bookings/{id}` en `SchedulingBookingsController_getBooking`. El controlador delega en `SchedulingBookingsService.getBookingById`. No recibe body. El tipo de retorno estático es `Promise<BookingItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/bookings/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/bookings/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BookingItemDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<BookingItemDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<BookingItemDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<BookingItemDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<BookingItemDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<BookingItemDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<BookingItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "paymentState": {
    "state": "PENDING",
    "label": "Parcialmente pagada",
    "conceptId": "00000000-0000-4000-8000-000000000001",
    "insuranceUsed": true,
    "markedByUserId": "00000000-0000-4000-8000-000000000001",
    "markedAt": "2026-07-31T12:00:00.000Z"
  },
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "bookableSlotId": "00000000-0000-4000-8000-000000000001",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "bookingChannelConceptId": "00000000-0000-4000-8000-000000000001",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "confirmedAt": "2026-07-31T12:00:00.000Z",
  "checkedInAt": "2026-07-31T12:00:00.000Z",
  "reasonText": "Texto descriptivo de ejemplo",
  "patientName": "Nombre de ejemplo",
  "insuranceCarrierName": "Nombre de ejemplo",
  "insuranceClaim": {
    "id": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "SOL-0001",
    "statusCode": "CLAIM_SUBMITTED",
    "statusDisplay": "Reclamo enviado",
    "submittedAt": "2026-07-31T12:00:00.000Z"
  },
  "rescheduledFrom": "2026-07-31T12:00:00.000Z",
  "statusReason": {
    "reasonText": "Texto descriptivo de ejemplo",
    "actorKind": "PATIENT",
    "toStateConceptId": "00000000-0000-4000-8000-000000000001",
    "changedAt": "2026-07-31T12:00:00.000Z"
  },
  "delayNotice": {
    "delayMinutes": 1,
    "message": "valor-ejemplo",
    "announcedAt": "2026-07-31T12:00:00.000Z"
  },
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `paymentState` | No | `PaymentStateDto` | Sin restricción adicional declarada | El estado de pago, si alguien lo marcó (TAREA-13 punto 5). **Se omite cuando no hay marca**, y no viaja como «pendiente de pago»: pendiente es una afirmación que alguien firmó, la ausencia es que del pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`. Viene en la misma consulta que la página, no una por fila. | `{"state":"PENDING","label":"Parcialmente pagada","conceptId":"00000000-0000-4000-8000-000000000001","insuranceUsed":true,"markedByUserId":"00000000-0000-4000-8000-000000000001","markedAt":"2026-07-31T12:00:00.000Z"}` |
| `paymentState.state` | No | `string` | valores: `PENDING`, `PARTIALLY_PAID`, `PAID` | Clave estable del estado. | `PENDING` |
| `paymentState.label` | No | `string` | Sin restricción adicional declarada | Cómo se llama en pantalla, en castellano. | `Parcialmente pagada` |
| `paymentState.conceptId` | No | `string` | formato `uuid` | El concepto real detrás, por si el cliente lo necesita. | `00000000-0000-4000-8000-000000000001` |
| `paymentState.insuranceUsed` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `paymentState.markedByUserId` | No | `string` | formato `uuid` | Quién la dejó en este estado. | `00000000-0000-4000-8000-000000000001` |
| `paymentState.markedAt` | No | `string` | formato `date-time` | Cuándo. | `2026-07-31T12:00:00.000Z` |
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | No | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `bookableSlotId` | No | `string` | formato `uuid` | Identificador asociado a bookable slot. | `00000000-0000-4000-8000-000000000001` |
| `appointmentId` | No | `string` | formato `uuid`; admite null | Cita clínica que respalda la reserva. Es el valor que acepta POST /clinical/encounters/check-in en su `appointmentId`. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid`; admite null | Encuentro clínico de la cita que respalda la reserva; es el encounterId con el que la lectura de notas identifica cada atención. | `00000000-0000-4000-8000-000000000001` |
| `startAt` | No | `string` | formato `date-time`; admite null | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `2026-07-31T12:00:00.000Z` |
| `endAt` | No | `string` | formato `date-time`; admite null | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `bookingChannelConceptId` | No | `string` | formato `uuid` | Identificador asociado a booking channel concept. | `00000000-0000-4000-8000-000000000001` |
| `typeConceptId` | No | `string` | formato `uuid` | Qué clase de actividad es: consulta, procedimiento, control… Vive en `clinical.appointments.type_concept_id` y viaja acá porque la agenda del día pinta cada bloque según su tipología —el pedido del propietario habla de «TURNOS, OPERACIONES, ETC.»— y colorear por algo que la respuesta no trae es imposible. **Es un identificador de concepto, no un enum.** El catálogo de tipologías lo define el propietario (P-12-2) y todavía no está publicado: quien lo consuma hoy puede agrupar por id, no traducirlo a un nombre. Se omite cuando la cita no tiene contraparte clínica —una reserva que nunca llegó a confirmarse no crea `clinical.appointments`— o cuando la tiene y no declara tipo. Omitido, no vacío: `null` diría «no tiene tipo», que es una afirmación distinta. | `00000000-0000-4000-8000-000000000001` |
| `confirmedAt` | No | `string` | formato `date-time` | Valor de confirmed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `checkedInAt` | No | `string` | formato `date-time` | Valor de checked in at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `reasonText` | No | `string` | Sin restricción adicional declarada | Valor de reason text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `patientName` | No | `string` | Sin restricción adicional declarada | Nombre del paciente. Viaja con la **misma regla que el motivo de consulta**: lo ve el titular y el profesional que atiende en esa agenda, y no la vista de la organización. El médico necesita saber a quién espera —la agenda del día sin nombres es una lista de identificadores— y la organización ya opera con el perfil. | `Nombre de ejemplo` |
| `insuranceCarrierName` | No | `string` | admite null | La aseguradora del paciente titular, o `null` si no declara ninguna (ALV-021 — «Particular» o el nombre de la cobertura). Viaja con la **misma regla de privacidad que `patientName`**: es un dato del paciente y lo ve quien ya puede verlo a él. `null` es la respuesta comprobada —«se buscó y no tiene»—; **ausente** es que no se comprobó porque quien mira no tiene el permiso, que es distinto de que el paciente no tenga seguro. | `Nombre de ejemplo` |
| `insuranceClaim` | No | `BookingInsuranceClaimDto` | admite null | La solicitud de seguro más reciente de la cita (cita → encuentro clínico → solicitud), o `null` si se comprobó y no tiene. Viaja con la **misma regla de privacidad que `insuranceCarrierName`**: se **omite** cuando quien mira no puede ver al paciente. Hoy sólo lo trae el listado. Se resuelve en lote para toda la página. | `{"id":"00000000-0000-4000-8000-000000000001","claimIdentifier":"SOL-0001","statusCode":"CLAIM_SUBMITTED","statusDisplay":"Reclamo enviado","submittedAt":"2026-07-31T12:00:00.000Z"}` |
| `insuranceClaim.id` | Sí | `string` | formato `uuid` | `insurance.insurance_claims.id`: con esto se abre el detalle. | `00000000-0000-4000-8000-000000000001` |
| `insuranceClaim.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Número de la solicitud, el que se le dicta a la aseguradora. | `SOL-0001` |
| `insuranceClaim.statusCode` | Sí | `string` | Sin restricción adicional declarada | Código del concepto de estado (`CLAIM_SUBMITTED`, `CLAIM_ADJUDICATED`, `CLAIM_PAID`, `CLAIM_REVERSED`…). Un código desconocido no es error. | `CLAIM_SUBMITTED` |
| `insuranceClaim.statusDisplay` | Sí | `string` | Sin restricción adicional declarada | Etiqueta del estado en castellano, tal como está en el catálogo. | `Reclamo enviado` |
| `insuranceClaim.submittedAt` | Sí | `string` | formato `date-time`; admite null | Cuándo se envió; `null` si todavía no se envió. | `2026-07-31T12:00:00.000Z` |
| `rescheduledFrom` | No | `string` | formato `date-time` | De cuándo se movió, si la cita se reprogramó. Ausente cuando nunca se movió — que es distinto de «se movió y no sé desde cuándo». Es el instante ORIGINAL, no el id del cupo: la tarjeta dice «reprogramada desde el 20/08 a las 15:30», y resolverlo en la pantalla costaría una petición por cita para pintar una línea. | `2026-07-31T12:00:00.000Z` |
| `statusReason` | No | `BookingStatusReasonDto` | Sin restricción adicional declarada | Motivo del último cambio que lo exigía (cancelación, rechazo o reprogramación), con quién lo hizo y cuándo. | `{"reasonText":"Texto descriptivo de ejemplo","actorKind":"PATIENT","toStateConceptId":"00000000-0000-4000-8000-000000000001","changedAt":"2026-07-31T12:00:00.000Z"}` |
| `statusReason.reasonText` | No | `string` | Sin restricción adicional declarada | Lo que escribió quien hizo el cambio | `Texto descriptivo de ejemplo` |
| `statusReason.actorKind` | No | `string` | valores: `PATIENT`, `PROVIDER` | Desde qué lado se hizo el cambio. Permite decir «tu médico canceló» en vez de «la cita fue cancelada». | `PATIENT` |
| `statusReason.toStateConceptId` | No | `string` | formato `uuid` | Estado al que llevó el cambio, si fue una transición | `00000000-0000-4000-8000-000000000001` |
| `statusReason.changedAt` | No | `string` | formato `date-time` | Valor de changed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `delayNotice` | No | `BookingDelayNoticeDto` | Sin restricción adicional declarada | Última demora informada por el profesional, con sus minutos y su mensaje. | `{"delayMinutes":1,"message":"valor-ejemplo","announcedAt":"2026-07-31T12:00:00.000Z"}` |
| `delayNotice.delayMinutes` | No | `number` | Sin restricción adicional declarada | Minutos de demora informados | `1` |
| `delayNotice.message` | No | `string` | Sin restricción adicional declarada | Mensaje del profesional | `valor-ejemplo` |
| `delayNotice.announcedAt` | No | `string` | formato `date-time` | Cuándo se informó. | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}"
}
```

---

## 7. POST /scheduling/bookings/{id}/accept

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Aceptar la solicitud de cita
- **Operation ID:** `SchedulingBookingsController_accept`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.accept](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Solo la acepta quien atiende esa agenda (o quien administra la agenda de la organización).

Contexto declarado en el controlador: El profesional acepta la solicitud (corrección #11): la cita queda confirmada y recién ahí se programan sus recordatorios.

### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/accept` en `SchedulingBookingsController_accept`. El controlador delega en `SchedulingBookingsService.accept`. Valida el body como `AcceptBookingDto` y consume `application/json`. El tipo de retorno estático es `Promise<BookingDecisionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AcceptBookingDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reminderOffsetsMinutes` | No | `array<number>` | mínimo 0 | Minutos de antelación de los recordatorios a programar | `[1440,120]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reminderOffsetsMinutes": [
    1440,
    120
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingDecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "desplazadas": [
    {}
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado en el que quedó la cita | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | Sí | `string` | formato `date-time` | Valor de occurred at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `desplazadas` | Sí | `array<object>` | formato `uuid` | Citas pendientes que quedaron canceladas por chocar con ésta | `[{}]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cita es de otra agenda: solo la opera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | veredicto === 'pendiente'         ? 'Tu vínculo con esta organización todavía está pendiente de ' +             'aprobación, así que todavía no podés comprometer turnos suyos.'         : 'Tu vínculo con esta organización ya no está vigente, así que no ' +             'podés aceptar turnos suyos. Las citas que ya confirmaste siguen ' +             'en pie: hablá con la organización para reactivarlo.' | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional ya tiene ${quien} de ${horaLocal(         primero.startAt,         primero.timeZone,       )} a ${horaLocal(         primero.endAt,         primero.timeZone,       )}${primero.resourceName ? ` en «${primero.resourceName}»` : ''}. No puede estar en dos lugares a la vez. | Excepción explícita en src/modules/scheduling/services/scheduling-professional-time.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/accept"
}
```

---

## 8. POST /scheduling/bookings/{id}/cancel

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Cancelar la cita y liberar el cupo
- **Operation ID:** `SchedulingBookingsController_cancel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.cancel](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

El cargo por inasistencia solo aplica si la política lo define y es un no-show.


### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/cancel` en `SchedulingBookingsController_cancel`. El controlador delega en `SchedulingBookingsService.cancel`. Valida el body como `CancelBookingDto` y consume `application/json`. El tipo de retorno estático es `Promise<CancelBookingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CancelBookingDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cancelledBy": "PATIENT",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cancelledBy` | Sí | `string` | valores: `PATIENT`, `PROVIDER` | Quién origina la cancelación | `PATIENT` |
| `isNoShow` | No | `boolean` | Sin restricción adicional declarada | true si la cita se marca como inasistencia (aplica el cargo de la política) | `false` |
| `reasonText` | Sí | `string` | longitud mínima 5; longitud máxima 500 | Motivo de la cancelación. Obligatorio: se le muestra a la otra parte en el detalle de la cita. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cancelledBy": "PATIENT",
  "isNoShow": false,
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CancelBookingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "feeAmount": "valor-ejemplo",
  "capacityReleased": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `feeAmount` | No | `string` | Sin restricción adicional declarada | Cargo aplicado, si la política lo contempla | `valor-ejemplo` |
| `capacityReleased` | Sí | `boolean` | Sin restricción adicional declarada | Cupo devuelto al slot | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Slot no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-waitlist.service.ts |
| 409 | `CONFLICT` | La cita ya está cancelada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Podés cancelar hasta ${Math.round(windowMinutes / 60)} horas antes del turno. Si ya no podés asistir, comunicate con el consultorio. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/cancel"
}
```

---

## 9. POST /scheduling/bookings/{id}/check-in

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Registrar la llegada del paciente
- **Operation ID:** `SchedulingBookingsController_checkIn`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.checkIn](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Registrar la llegada del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/check-in` en `SchedulingBookingsController_checkIn`. El controlador delega en `SchedulingBookingsService.checkIn`. No recibe body. El tipo de retorno estático es `Promise<CheckInResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/check-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/check-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CheckInResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CheckInResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "checkedInAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `checkedInAt` | Sí | `string` | formato `date-time` | Valor de checked in at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/check-in"
}
```

---

## 10. POST /scheduling/bookings/{id}/complete

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Completar la atención
- **Operation ID:** `SchedulingBookingsController_complete`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.complete](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Cierra la cita en curso. Tampoco valida el reloj: solo el estado y quién la opera.

Contexto declarado en el controlador: Completa la atención (corrección #15). El paciente ve «completada» apenas ocurre, sin refresco artificial.

### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/complete` en `SchedulingBookingsController_complete`. El controlador delega en `SchedulingBookingsService.complete`. No recibe body. El tipo de retorno estático es `Promise<BookingDecisionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingDecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "desplazadas": [
    {}
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado en el que quedó la cita | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | Sí | `string` | formato `date-time` | Valor de occurred at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `desplazadas` | Sí | `array<object>` | formato `uuid` | Citas pendientes que quedaron canceladas por chocar con ésta | `[{}]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cita es de otra agenda: solo la opera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/complete"
}
```

---

## 11. POST /scheduling/bookings/{id}/delay

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Informar una demora sobre una cita
- **Operation ID:** `SchedulingBookingsController_delay`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.delay](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Sólo la informa quien atiende esa agenda. No mueve el turno: avisa que empieza más tarde.

Contexto declarado en el controlador: P8: el profesional avisa que se demora sobre **esta** cita. No cambia el estado de la cita ni toca su cupo: es comunicación. La demora queda en el historial del turno —así el paciente la ve aunque no abra la campana— y sale como aviso in-app.

### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/delay` en `SchedulingBookingsController_delay`. El controlador delega en `SchedulingDelayService.delayBooking`. Valida el body como `DelayBookingDto` y consume `application/json`. El tipo de retorno estático es `Promise<DelayNoticeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DelayBookingDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/delay HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "delayMinutes": 20
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `delayMinutes` | Sí | `number` | mínimo 5; máximo 240 | Minutos de demora estimados | `20` |
| `message` | No | `string` | longitud máxima 300 | Mensaje del profesional para el paciente | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/delay HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "delayMinutes": 20,
  "message": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DelayNoticeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "notified": 1,
  "affected": 1,
  "bookingIds": [
    "valor-ejemplo"
  ],
  "detail": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `notified` | Sí | `number` | Sin restricción adicional declarada | Pacientes que recibieron el aviso | `1` |
| `affected` | Sí | `number` | Sin restricción adicional declarada | Citas alcanzadas por la demora | `1` |
| `bookingIds` | Sí | `array<string>` | formato `uuid` | Las citas alcanzadas, para que la pantalla pueda decir cuáles fueron. | `["valor-ejemplo"]` |
| `detail` | Sí | `string` | Sin restricción adicional declarada | Qué pasó, en una frase. Incluye por qué un aviso no llegó cuando no llegó. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-delay.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-delay.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una demora mayor a cuatro horas se resuelve reprogramando el turno, no avisando | Excepción explícita en src/modules/scheduling/services/scheduling-delay.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/delay"
}
```

---

## 12. GET /scheduling/bookings/{id}/payment-state

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Leer el estado de pago de una cita
- **Operation ID:** `SchedulingBookingsController_getPaymentState`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.getPaymentState](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Devuelve null si todavía nadie lo marcó: la ausencia de estado no es «pendiente».

Contexto declarado en el controlador: Lee el estado de pago de la cita. Devuelve `null` cuando nadie lo marcó todavía, que **no** es lo mismo que «pendiente de pago»: pendiente es algo que alguien firmó.

### Descripción del sistema

NestJS resuelve `GET /scheduling/bookings/{id}/payment-state` en `SchedulingBookingsController_getPaymentState`. El controlador delega en `SchedulingBookingsService.getPaymentState`. No recibe body. El tipo de retorno estático es `Promise<PaymentStateDto | null>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/bookings/00000000-0000-4000-8000-000000000001/payment-state HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/bookings/00000000-0000-4000-8000-000000000001/payment-state HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PaymentStateDto | null>` | No |
| 400 | Consulta completada correctamente. | `Promise<PaymentStateDto | null>` | No |
| 401 | Consulta completada correctamente. | `Promise<PaymentStateDto | null>` | No |
| 403 | Consulta completada correctamente. | `Promise<PaymentStateDto | null>` | No |
| 404 | Consulta completada correctamente. | `Promise<PaymentStateDto | null>` | No |
| 429 | Consulta completada correctamente. | `Promise<PaymentStateDto | null>` | No |
| 500 | Consulta completada correctamente. | `Promise<PaymentStateDto | null>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentStateDto | null`. Ejemplo completo derivado de ese DTO:

```json
{
  "state": "PENDING",
  "label": "Parcialmente pagada",
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "insuranceUsed": true,
  "markedByUserId": "00000000-0000-4000-8000-000000000001",
  "markedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `state` | Sí | `string` | valores: `PENDING`, `PARTIALLY_PAID`, `PAID` | Clave estable del estado. | `PENDING` |
| `label` | Sí | `string` | Sin restricción adicional declarada | Cómo se llama en pantalla, en castellano. | `Parcialmente pagada` |
| `conceptId` | Sí | `string` | formato `uuid` | El concepto real detrás, por si el cliente lo necesita. | `00000000-0000-4000-8000-000000000001` |
| `insuranceUsed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `markedByUserId` | Sí | `string` | formato `uuid` | Quién la dejó en este estado. | `00000000-0000-4000-8000-000000000001` |
| `markedAt` | Sí | `string` | formato `date-time` | Cuándo. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cita es de otra agenda: solo la opera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/payment-state"
}
```

---

## 13. PUT /scheduling/bookings/{id}/payment-state

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Marcar el estado de pago de una cita
- **Operation ID:** `SchedulingBookingsController_setPaymentState`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.setPaymentState](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Pendiente de pago, parcialmente pagada o pagada, más la marca separada de uso de seguro. Una cita cancelada o rechazada responde 422.

Contexto declarado en el controlador: Marca el estado de pago de la cita — TAREA-13, punto 5. `PUT` y no `POST` porque es **idempotente**: hay una fila por cita y volver a mandar el mismo estado deja exactamente el mismo resultado. Las otras operaciones de este controlador son `POST` porque cada una es un acto distinto —aceptar dos veces no es aceptar—; marcar un pago dos veces sí. Quién puede: los mismos que responden la solicitud. **El paciente no**: decir que una cita está pagada es una afirmación del prestador, y dejársela hacer a quien debe el dinero sería confiar en el campo equivocado.

### Descripción del sistema

NestJS resuelve `PUT /scheduling/bookings/{id}/payment-state` en `SchedulingBookingsController_setPaymentState`. El controlador delega en `SchedulingBookingsService.setPaymentState`. Valida el body como `SetPaymentStateDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentStateDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetPaymentStateDto`; los campos opcionales se omiten.

```http
PUT /scheduling/bookings/00000000-0000-4000-8000-000000000001/payment-state HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "state": "PENDING"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `state` | Sí | `string` | valores: `PENDING`, `PARTIALLY_PAID`, `PAID` | Estado de pago de la cita | `PENDING` |
| `insuranceUsed` | No | `boolean` | Sin restricción adicional declarada | Marca de que la cita se cubrió con seguro | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /scheduling/bookings/00000000-0000-4000-8000-000000000001/payment-state HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "state": "PENDING",
  "insuranceUsed": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentStateDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentStateDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "state": "PENDING",
  "label": "Parcialmente pagada",
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "insuranceUsed": true,
  "markedByUserId": "00000000-0000-4000-8000-000000000001",
  "markedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `state` | Sí | `string` | valores: `PENDING`, `PARTIALLY_PAID`, `PAID` | Clave estable del estado. | `PENDING` |
| `label` | Sí | `string` | Sin restricción adicional declarada | Cómo se llama en pantalla, en castellano. | `Parcialmente pagada` |
| `conceptId` | Sí | `string` | formato `uuid` | El concepto real detrás, por si el cliente lo necesita. | `00000000-0000-4000-8000-000000000001` |
| `insuranceUsed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `markedByUserId` | Sí | `string` | formato `uuid` | Quién la dejó en este estado. | `00000000-0000-4000-8000-000000000001` |
| `markedAt` | Sí | `string` | formato `date-time` | Cuándo. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cita es de otra agenda: solo la opera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/payment-state"
}
```

---

## 14. POST /scheduling/bookings/{id}/propose-schedule

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Proponer otro horario para la solicitud
- **Operation ID:** `SchedulingBookingsController_proposeSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.proposeSchedule](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Proponer otro horario para la solicitud. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-41-19: el centro propone otro horario para la solicitud — CARRIL 11. Distinto de `reschedule`: aquélla mueve una cita **vigente** a pedido de quien la tiene; ésta contrapropone sobre lo que todavía no se aceptó, y la solicitud sigue pendiente de que la persona lo mire.

### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/propose-schedule` en `SchedulingBookingsController_proposeSchedule`. El controlador delega en `SchedulingBookingsService.proposeSchedule`. Valida el body como `ProposeScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProposeScheduleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProposeScheduleDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/propose-schedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proposedSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `proposedSlotId` | Sí | `string` | formato `uuid` | Cupo propuesto | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | Sí | `string` | longitud máxima 500 | Motivo de la propuesta | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/propose-schedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proposedSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProposeScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProposeScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "fromSlotId": "00000000-0000-4000-8000-000000000001",
  "toSlotId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Solicitud sobre la que se propuso. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado en el que quedó (concept id): sigue pendiente. | `00000000-0000-4000-8000-000000000001` |
| `fromSlotId` | Sí | `string` | formato `uuid` | Cupo que se liberó. | `00000000-0000-4000-8000-000000000001` |
| `toSlotId` | Sí | `string` | formato `uuid` | Cupo que quedó tomado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cita es de otra agenda: solo la opera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cupo propuesto no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | El cupo propuesto no tiene lugar | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El horario propuesto es el que ya tiene la solicitud | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo se opera así sobre una solicitud pendiente | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/propose-schedule"
}
```

---

## 15. POST /scheduling/bookings/{id}/reject

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Rechazar la solicitud de cita
- **Operation ID:** `SchedulingBookingsController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.reject](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Libera el cupo y deja el motivo, que el paciente ve en el detalle de su turno.

Contexto declarado en el controlador: El profesional rechaza la solicitud, con motivo obligatorio (correcciones #11 y #14).

### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/reject` en `SchedulingBookingsController_reject`. El controlador delega en `SchedulingBookingsService.reject`. Valida el body como `RejectBookingDto` y consume `application/json`. El tipo de retorno estático es `Promise<CancelBookingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RejectBookingDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reasonText` | Sí | `string` | longitud mínima 5; longitud máxima 500 | Motivo del rechazo. Obligatorio: el paciente lo ve en el detalle de su turno. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CancelBookingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CancelBookingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "feeAmount": "valor-ejemplo",
  "capacityReleased": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `feeAmount` | No | `string` | Sin restricción adicional declarada | Cargo aplicado, si la política lo contempla | `valor-ejemplo` |
| `capacityReleased` | Sí | `boolean` | Sin restricción adicional declarada | Cupo devuelto al slot | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Slot no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-waitlist.service.ts |
| 409 | `CONFLICT` | La cita ya está cancelada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Podés cancelar hasta ${Math.round(windowMinutes / 60)} horas antes del turno. Si ya no podés asistir, comunicate con el consultorio. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/reject"
}
```

---

## 16. POST /scheduling/bookings/{id}/reminders

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Programar recordatorios para la cita
- **Operation ID:** `SchedulingBookingsController_scheduleReminders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.scheduleReminders](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Programar recordatorios para la cita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/reminders` en `SchedulingBookingsController_scheduleReminders`. El controlador delega en `SchedulingWaitlistService.scheduleReminders`. Valida el body como `ScheduleRemindersDto` y consume `application/json`. El tipo de retorno estático es `Promise<ScheduleRemindersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ScheduleRemindersDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/reminders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "offsetsMinutes": [
    1440,
    120
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `offsetsMinutes` | Sí | `array<number>` | mínimo 0 | Minutos de antelación de cada recordatorio | `[1440,120]` |
| `channel` | No | `string` | valores: `SMS`, `EMAIL` | Canal de envío | `SMS` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/reminders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "offsetsMinutes": [
    1440,
    120
  ],
  "channel": "SMS"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ScheduleRemindersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScheduleRemindersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "scheduled": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `scheduled` | Sí | `number` | Sin restricción adicional declarada | Valor de scheduled mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-waitlist.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/reminders"
}
```

---

## 17. POST /scheduling/bookings/{id}/request-info

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Pedir documentación u orden médica antes de aceptar
- **Operation ID:** `SchedulingBookingsController_requestInfo`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.requestInfo](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

No libera el cupo: pedir un papel no le quita el horario a nadie.

Contexto declarado en el controlador: UC-41-18: el centro pide documentación, una orden médica o avisa cómo prepararse, antes de aceptar — CARRIL 11. No la alcanza `PATIENT`: es el prestador el que pide. La persona lee lo que le pidieron en el motivo de su propia cita.

### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/request-info` en `SchedulingBookingsController_requestInfo`. El controlador delega en `SchedulingBookingsService.requestInfo`. Valida el body como `RequestBookingInfoDto` y consume `application/json`. El tipo de retorno estático es `Promise<BookingDecisionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestBookingInfoDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/request-info HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "infoRequested": "DOCUMENTATION",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `infoRequested` | Sí | `string` | valores: `DOCUMENTATION`, `MEDICAL_ORDER`, `PREPARATION` | Qué falta antes de poder aceptar | `DOCUMENTATION` |
| `reasonText` | Sí | `string` | longitud máxima 500 | Mensaje para el paciente | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/request-info HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "infoRequested": "DOCUMENTATION",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingDecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "desplazadas": [
    {}
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado en el que quedó la cita | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | Sí | `string` | formato `date-time` | Valor de occurred at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `desplazadas` | Sí | `array<object>` | formato `uuid` | Citas pendientes que quedaron canceladas por chocar con ésta | `[{}]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cita es de otra agenda: solo la opera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se opera así sobre una solicitud pendiente | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/request-info"
}
```

---

## 18. POST /scheduling/bookings/{id}/reschedule

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Reprogramar la cita a otro slot
- **Operation ID:** `SchedulingBookingsController_reschedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.reschedule](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Reprogramar la cita a otro slot. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/reschedule` en `SchedulingBookingsController_reschedule`. El controlador delega en `SchedulingBookingsService.reschedule`. Valida el body como `RescheduleBookingDto` y consume `application/json`. El tipo de retorno estático es `Promise<RescheduleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RescheduleBookingDto`; los campos opcionales se omiten.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/reschedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "toSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `toSlotId` | Sí | `string` | formato `uuid` | Slot destino | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | Sí | `string` | longitud mínima 5; longitud máxima 500 | Motivo del cambio. Obligatorio: se le muestra a la otra parte en el detalle de la cita. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/reschedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "toSlotId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RescheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RescheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "fromSlotId": "00000000-0000-4000-8000-000000000001",
  "toSlotId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `fromSlotId` | Sí | `string` | formato `uuid` | Identificador asociado a from slot. | `00000000-0000-4000-8000-000000000001` |
| `toSlotId` | Sí | `string` | formato `uuid` | Identificador asociado a to slot. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Slot destino no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | El slot destino no tiene cupos | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se reprograma una cita vigente | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | El slot destino es el mismo que el actual | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/reschedule"
}
```

---

## 19. POST /scheduling/bookings/{id}/start

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-bookings`
- **Nombre:** Iniciar la atención
- **Operation ID:** `SchedulingBookingsController_start`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingBookingsController.start](../../src/modules/scheduling/controllers/scheduling-bookings.controller.ts)

### Descripción de negocio

Disponible sobre cualquier cita confirmada, en cualquier momento: no exige que haya llegado el día agendado.

Contexto declarado en el controlador: Inicia la atención (corrección #15). **No valida la fecha**: una cita confirmada se empieza cuando el profesional decide, no cuando el reloj lo permite.

### Descripción del sistema

NestJS resuelve `POST /scheduling/bookings/{id}/start` en `SchedulingBookingsController_start`. El controlador delega en `SchedulingBookingsService.start`. No recibe body. El tipo de retorno estático es `Promise<BookingDecisionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/start HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/start HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BookingDecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingDecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "desplazadas": [
    {}
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Identificador asociado a booking. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado en el que quedó la cita | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | Sí | `string` | formato `date-time` | Valor de occurred at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `desplazadas` | Sí | `array<object>` | formato `uuid` | Citas pendientes que quedaron canceladas por chocar con ésta | `[{}]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cita es de otra agenda: solo la opera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Transición de estado de cita no permitida | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/bookings/{id}/start"
}
```

---

## 20. GET /scheduling/confirmation-rules

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-confirmation`
- **Nombre:** Listar las reglas de un tenant
- **Operation ID:** `SchedulingConfirmationController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingConfirmationController.list](../../src/modules/scheduling/controllers/scheduling-confirmation.controller.ts)

### Descripción de negocio

Listar las reglas de un tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene list.

### Descripción del sistema

NestJS resuelve `GET /scheduling/confirmation-rules` en `SchedulingConfirmationController_list`. El controlador delega en `SchedulingConfirmationService.listRules`. No recibe body. El tipo de retorno estático es `Promise<ConfirmationRuleResponseDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `includeDisabled` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/confirmation-rules?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/confirmation-rules?tenantId=00000000-0000-4000-8000-000000000001&includeDisabled=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<ConfirmationRuleResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<ConfirmationRuleResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<ConfirmationRuleResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<ConfirmationRuleResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<ConfirmationRuleResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConfirmationRuleResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "scopeId": "00000000-0000-4000-8000-000000000001",
    "priority": 1,
    "decisionConceptId": "00000000-0000-4000-8000-000000000001",
    "enabled": true,
    "version": 1
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/confirmation-rules"
}
```

---

## 21. POST /scheduling/confirmation-rules

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-confirmation`
- **Nombre:** Crear una regla de confirmación
- **Operation ID:** `SchedulingConfirmationController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingConfirmationController.create](../../src/modules/scheduling/controllers/scheduling-confirmation.controller.ts)

### Descripción de negocio

Crear una regla de confirmación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create.

### Descripción del sistema

NestJS resuelve `POST /scheduling/confirmation-rules` en `SchedulingConfirmationController_create`. El controlador delega en `SchedulingConfirmationService.createRule`. Valida el body como `CreateConfirmationRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConfirmationRuleResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConfirmationRuleDto`; los campos opcionales se omiten.

```http
POST /scheduling/confirmation-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scope": "TENANT",
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "condition": {},
  "decision": "AUTO_CONFIRM"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scope` | Sí | `string` | valores: `TENANT`, `PRACTICE`, `RESOURCE`, `SERVICE` | Tipo de alcance de la regla | `TENANT` |
| `scopeId` | No | `string` | formato `uuid` | Alcance concreto (practice/resource/service). Omitido = todo el tipo. | `00000000-0000-4000-8000-000000000001` |
| `priority` | No | `number` | Sin restricción adicional declarada | Menor número = mayor prioridad | `100` |
| `effectiveFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `effectiveTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `condition` | Sí | `object` | Sin restricción adicional declarada | Condición determinista { field, op, value } o combinador all/any/not. | `{}` |
| `decision` | Sí | `string` | valores: `AUTO_CONFIRM`, `AUTO_REJECT`, `MANUAL_REVIEW` | Decisión de la regla | `AUTO_CONFIRM` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/confirmation-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConfirmationRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeId": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "enabled": true,
  "version": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `scopeTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a scope type concept. | `00000000-0000-4000-8000-000000000001` |
| `scopeId` | No | `string` | formato `uuid` | Identificador asociado a scope. | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | Sin restricción adicional declarada | Valor de priority mantenido por la instancia. | `1` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `enabled` | Sí | `boolean` | Sin restricción adicional declarada | Valor de enabled mantenido por la instancia. | `true` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/confirmation-rules"
}
```

---

## 22. POST /scheduling/confirmation-rules/{id}/activate

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-confirmation`
- **Nombre:** Reactivar una regla desactivada
- **Operation ID:** `SchedulingConfirmationController_activate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingConfirmationController.activate](../../src/modules/scheduling/controllers/scheduling-confirmation.controller.ts)

### Descripción de negocio

Reactivar una regla desactivada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación activate.

### Descripción del sistema

NestJS resuelve `POST /scheduling/confirmation-rules/{id}/activate` en `SchedulingConfirmationController_activate`. El controlador delega en `SchedulingConfirmationService.activateRule`. No recibe body. El tipo de retorno estático es `Promise<ConfirmationRuleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /scheduling/confirmation-rules/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /scheduling/confirmation-rules/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConfirmationRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeId": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "enabled": true,
  "version": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `scopeTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a scope type concept. | `00000000-0000-4000-8000-000000000001` |
| `scopeId` | No | `string` | formato `uuid` | Identificador asociado a scope. | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | Sin restricción adicional declarada | Valor de priority mantenido por la instancia. | `1` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `enabled` | Sí | `boolean` | Sin restricción adicional declarada | Valor de enabled mantenido por la instancia. | `true` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Regla no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-confirmation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/confirmation-rules/{id}/activate"
}
```

---

## 23. POST /scheduling/confirmation-rules/{id}/deactivate

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-confirmation`
- **Nombre:** Desactivar una regla (sin borrado duro)
- **Operation ID:** `SchedulingConfirmationController_deactivate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingConfirmationController.deactivate](../../src/modules/scheduling/controllers/scheduling-confirmation.controller.ts)

### Descripción de negocio

Desactivar una regla (sin borrado duro). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación deactivate.

### Descripción del sistema

NestJS resuelve `POST /scheduling/confirmation-rules/{id}/deactivate` en `SchedulingConfirmationController_deactivate`. El controlador delega en `SchedulingConfirmationService.deactivateRule`. No recibe body. El tipo de retorno estático es `Promise<ConfirmationRuleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /scheduling/confirmation-rules/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /scheduling/confirmation-rules/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConfirmationRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConfirmationRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeId": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "enabled": true,
  "version": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `scopeTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a scope type concept. | `00000000-0000-4000-8000-000000000001` |
| `scopeId` | No | `string` | formato `uuid` | Identificador asociado a scope. | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | Sin restricción adicional declarada | Valor de priority mantenido por la instancia. | `1` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `enabled` | Sí | `boolean` | Sin restricción adicional declarada | Valor de enabled mantenido por la instancia. | `true` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Regla no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-confirmation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/confirmation-rules/{id}/deactivate"
}
```

---

## 24. POST /scheduling/confirmation-rules/evaluate

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-confirmation`
- **Nombre:** Evaluar una solicitud de reserva contra las reglas vigentes
- **Operation ID:** `SchedulingConfirmationController_evaluate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingConfirmationController.evaluate](../../src/modules/scheduling/controllers/scheduling-confirmation.controller.ts)

### Descripción de negocio

Evaluar una solicitud de reserva contra las reglas vigentes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación evaluate.

### Descripción del sistema

NestJS resuelve `POST /scheduling/confirmation-rules/evaluate` en `SchedulingConfirmationController_evaluate`. El controlador delega en `SchedulingConfirmationService.evaluateBookingRequest`. Valida el body como `EvaluateBookingRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<EvaluateBookingResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EvaluateBookingRequestDto`; los campos opcionales se omiten.

```http
POST /scheduling/confirmation-rules/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "requestData": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | No | `string` | formato `uuid` | Práctica de la solicitud | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | No | `string` | formato `uuid` | Recurso de la solicitud | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Servicio de la solicitud | `00000000-0000-4000-8000-000000000001` |
| `requestData` | Sí | `object` | Sin restricción adicional declarada | Datos congelados de la solicitud sobre los que se evalúan las condiciones. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/confirmation-rules/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "requestData": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvaluateBookingResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvaluateBookingResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "decision": "AUTO_CONFIRM",
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "explanation": {
    "ruleId": "00000000-0000-4000-8000-000000000001",
    "ruleVersion": 1,
    "reason": "Texto descriptivo de ejemplo",
    "variables": {
      "clave": "valor"
    },
    "evaluatedRuleIds": [
      "valor-ejemplo"
    ]
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `AUTO_CONFIRM`, `AUTO_REJECT`, `MANUAL_REVIEW` | Decisión determinista | `AUTO_CONFIRM` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `explanation` | Sí | `EvaluationExplanationDto` | Sin restricción adicional declarada | Valor de explanation mantenido por la instancia. | `{"ruleId":"00000000-0000-4000-8000-000000000001","ruleVersion":1,"reason":"Texto descriptivo de ejemplo","variables":{"clave":"valor"},"evaluatedRuleIds":["valor-ejemplo"]}` |
| `explanation.ruleId` | No | `string` | formato `uuid` | Regla aplicada; ausente si ninguna resultó concluyente. | `00000000-0000-4000-8000-000000000001` |
| `explanation.ruleVersion` | No | `number` | Sin restricción adicional declarada | Versión de la regla aplicada | `1` |
| `explanation.reason` | Sí | `string` | Sin restricción adicional declarada | Motivo de la decisión | `Texto descriptivo de ejemplo` |
| `explanation.variables` | Sí | `object` | Sin restricción adicional declarada | Variables congeladas usadas en la evaluación | `{"clave":"valor"}` |
| `explanation.evaluatedRuleIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de reglas evaluadas antes de concluir | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/confirmation-rules/evaluate"
}
```

---

## 25. GET /scheduling/exception-types

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Listar los motivos de bloqueo de agenda
- **Operation ID:** `SchedulingController_listExceptionTypes`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.listExceptionTypes](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Catálogo para el formulario: clave, concepto, etiqueta en castellano, si exige texto libre y si bloquea u abre horario.

Contexto declarado en el controlador: Los motivos de bloqueo que el formulario puede ofrecer (TAREA-11, punto 4). Existe porque el catálogo estaba en la base y **no lo publicaba nadie**: `exception_type_concept_id` es obligatoria y la pantalla no tenía de dónde sacar las opciones, así que en la práctica todo bloqueo nacía con el mismo valor. Es una lectura de catálogo, no de datos de nadie: sin filtro por tenant y abierta a cualquiera que pueda crear una excepción.

### Descripción del sistema

NestJS resuelve `GET /scheduling/exception-types` en `SchedulingController_listExceptionTypes`. El controlador delega en `SchedulingCatalogService.listExceptionTypes`. No recibe body. El tipo de retorno estático es `ExceptionTypeListDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/exception-types HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/exception-types HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `ExceptionTypeListDto` | No |
| 400 | Consulta completada correctamente. | `ExceptionTypeListDto` | No |
| 401 | Consulta completada correctamente. | `ExceptionTypeListDto` | No |
| 403 | Consulta completada correctamente. | `ExceptionTypeListDto` | No |
| 429 | Consulta completada correctamente. | `ExceptionTypeListDto` | No |
| 500 | Consulta completada correctamente. | `ExceptionTypeListDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExceptionTypeListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "type": {},
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "label": "Congreso o capacitación",
      "requiresText": true,
      "blocks": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ExceptionTypeDto>` | Sin restricción adicional declarada | Los motivos, en el orden en que se muestran. | `[{"type":{},"conceptId":"00000000-0000-4000-8000-000000000001","label":"Congreso o capacitación","requiresText":true,"blocks":true}]` |
| `items[].type` | Sí | `object` | Sin restricción adicional declarada | Clave estable con la que se envía al crear la excepción. | `{}` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | El concepto real detrás, por si el cliente lo necesita. | `00000000-0000-4000-8000-000000000001` |
| `items[].label` | Sí | `string` | Sin restricción adicional declarada | Cómo se llama en pantalla, en castellano. | `Congreso o capacitación` |
| `items[].requiresText` | Sí | `boolean` | Sin restricción adicional declarada | true en «Otro»: exige texto libre | `true` |
| `items[].blocks` | Sí | `boolean` | Sin restricción adicional declarada | false en la atención extraordinaria | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/exception-types"
}
```

---

## 26. DELETE /scheduling/exceptions/{id}

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Eliminar una excepción de disponibilidad
- **Operation ID:** `SchedulingController_removeException`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.removeException](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Los cupos que la excepción bloqueó siguen bloqueados; se regeneran con la plantilla.

Contexto declarado en el controlador: Elimina una excepción de disponibilidad (el tiempo ocupado de AG-3). Borrar NO resucita los cupos que la excepción bloqueó: se regeneran con la plantilla si corresponde. Es la semántica menos sorprendente y está documentada en el servicio.

### Descripción del sistema

NestJS resuelve `DELETE /scheduling/exceptions/{id}` en `SchedulingController_removeException`. El controlador delega en `SchedulingCatalogService.removeException`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /scheduling/exceptions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /scheduling/exceptions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Excepción no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/exceptions/{id}"
}
```

---

## 27. PATCH /scheduling/exceptions/{id}

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Editar una excepción de disponibilidad
- **Operation ID:** `SchedulingController_updateException`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.updateException](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Cambia rango, motivo y descripción conservando el id. Agrandar cierra cupos; achicar no los reabre.

Contexto declarado en el controlador: Edita un bloqueo sin borrarlo (AC-11-7). **Agrandar el rango cierra los cupos nuevos; achicarlo no reabre ninguno.** Es la P-11-3, y se resuelve por la consecuencia: cerrar de más ofrece menos turnos y el profesional lo pidió; reabrir ofrecería turnos que nadie decidió ofrecer. El módulo queda con una sola regla: **los cupos sólo los crea publicar el horario.**

### Descripción del sistema

NestJS resuelve `PATCH /scheduling/exceptions/{id}` en `SchedulingController_updateException`. El controlador delega en `SchedulingCatalogService.updateException`. Valida el body como `UpdateExceptionDto` y consume `application/json`. El tipo de retorno estático es `Promise<UpdateExceptionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateExceptionDto`; los campos opcionales se omiten.

```http
PATCH /scheduling/exceptions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `exceptionType` | No | `string` | valores: `ABSENCE`, `HOLIDAY`, `VACATION`, `CONFERENCE`, `ERRAND`, `EXTRA`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ABSENCE` |
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `startAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /scheduling/exceptions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exceptionType": "ABSENCE",
  "reason": "Texto descriptivo de ejemplo",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<UpdateExceptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `UpdateExceptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "blockedSlots": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | El MISMO id que antes: editar no borra y recrea. | `00000000-0000-4000-8000-000000000001` |
| `startAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `blockedSlots` | Sí | `number` | Sin restricción adicional declarada | Cupos que se cerraron porque el rango creció. Achicar el rango **no reabre ninguno**, y por eso no hay campo para eso: en este módulo los cupos sólo los crea publicar el horario. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Excepción no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El bloqueo termina antes de empezar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Elegiste «Otro» como motivo: escribí cuál es | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/exceptions/{id}"
}
```

---

## 28. POST /scheduling/holds/{holdToken}/confirm

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Confirmar la cita a partir de la reserva temporal
- **Operation ID:** `SchedulingController_confirmBooking`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.confirmBooking](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Confirmar la cita a partir de la reserva temporal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/holds/{holdToken}/confirm` en `SchedulingController_confirmBooking`. El controlador delega en `SchedulingBookingsService.confirmBooking`. Valida el body como `ConfirmBookingDto` y consume `application/json`. El tipo de retorno estático es `Promise<BookingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `holdToken` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConfirmBookingDto`; los campos opcionales se omiten.

```http
POST /scheduling/holds/valor-ejemplo/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "PORTAL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PATIENT`.
- Deben ser UUID válidos: `holdToken`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente titular de la cita | `00000000-0000-4000-8000-000000000001` |
| `channel` | Sí | `string` | valores: `PORTAL`, `DESK`, `PHONE` | Canal de la reserva | `PORTAL` |
| `reasonText` | No | `string` | longitud máxima 500 | Motivo de consulta | `Texto descriptivo de ejemplo` |
| `reminderOffsetsMinutes` | No | `array<number>` | mínimo 0 | Minutos de antelación de los recordatorios a programar | `[1440,120]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/holds/valor-ejemplo/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BookingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "bookableSlotId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "remindersScheduled": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `bookableSlotId` | Sí | `string` | formato `uuid` | Identificador asociado a bookable slot. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `remindersScheduled` | Sí | `number` | Sin restricción adicional declarada | Recordatorios programados junto con la cita | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reserva temporal no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Slot no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | La reserva temporal ya fue consumida o liberada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | La reserva temporal expiró | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Ese horario ya pasó. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Ya tenés un turno confirmado ese día a esa hora${             choque.resourceName ? ` en «${choque.resourceName}»` : ''           }. Cancelalo primero si querés cambiarlo por éste. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional ya tiene ${quien} de ${horaLocal(         primero.startAt,         primero.timeZone,       )} a ${horaLocal(         primero.endAt,         primero.timeZone,       )}${primero.resourceName ? ` en «${primero.resourceName}»` : ''}. No puede estar en dos lugares a la vez. | Excepción explícita en src/modules/scheduling/services/scheduling-professional-time.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/holds/{holdToken}/confirm"
}
```

---

## 29. POST /scheduling/holds/{holdToken}/request

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Solicitar la cita a partir de la reserva temporal
- **Operation ID:** `SchedulingController_requestBooking`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.requestBooking](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

La cita nace PENDING_CONFIRMATION: ocupa el cupo pero no está comprometida hasta que el profesional la acepta.

Contexto declarado en el controlador: El paciente **solicita** el turno: queda pendiente de que el profesional lo acepte (corrección #11). Es la otra salida de la misma retención: `confirm` compromete la agenda —lo hace el mostrador— y `request` pide. Se declara como ruta propia y no como una bandera del cuerpo porque son dos actos distintos con dos permisos distintos, y una bandera que cambia quién puede hacer qué es una bandera que tarde o temprano llega en `true` desde donde no debe.

### Descripción del sistema

NestJS resuelve `POST /scheduling/holds/{holdToken}/request` en `SchedulingController_requestBooking`. El controlador delega en `SchedulingBookingsService.requestBooking`. Valida el body como `RequestBookingDto` y consume `application/json`. El tipo de retorno estático es `Promise<BookingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `holdToken` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestBookingDto`; los campos opcionales se omiten.

```http
POST /scheduling/holds/valor-ejemplo/request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "PORTAL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PATIENT`.
- Deben ser UUID válidos: `holdToken`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente que solicita la cita | `00000000-0000-4000-8000-000000000001` |
| `channel` | Sí | `string` | valores: `PORTAL`, `DESK`, `PHONE` | Canal de la solicitud | `PORTAL` |
| `reasonText` | No | `string` | longitud máxima MAX_REASON_LENGTH | Motivo de consulta: por qué se pide el turno | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/holds/valor-ejemplo/request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "channel": "PORTAL",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BookingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BookingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "bookableSlotId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "remindersScheduled": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `bookableSlotId` | Sí | `string` | formato `uuid` | Identificador asociado a bookable slot. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `remindersScheduled` | Sí | `number` | Sin restricción adicional declarada | Recordatorios programados junto con la cita | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reserva temporal no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 404 | `NOT_FOUND` | Slot no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | La reserva temporal ya fue consumida o liberada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | La reserva temporal expiró | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Ese horario ya pasó. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | Ya tenés un turno confirmado ese día a esa hora${             choque.resourceName ? ` en «${choque.resourceName}»` : ''           }. Cancelalo primero si querés cambiarlo por éste. | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional ya tiene ${quien} de ${horaLocal(         primero.startAt,         primero.timeZone,       )} a ${horaLocal(         primero.endAt,         primero.timeZone,       )}${primero.resourceName ? ` en «${primero.resourceName}»` : ''}. No puede estar en dos lugares a la vez. | Excepción explícita en src/modules/scheduling/services/scheduling-professional-time.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/holds/{holdToken}/request"
}
```

---

## 30. POST /scheduling/internal/dispatch-reminders

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-internal`
- **Nombre:** Despachar los recordatorios cuya hora ya llegó
- **Operation ID:** `SchedulingInternalController_dispatchReminders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingInternalController.dispatchReminders](../../src/modules/scheduling/controllers/scheduling-internal.controller.ts)

### Descripción de negocio

Despachar los recordatorios cuya hora ya llegó. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/internal/dispatch-reminders` en `SchedulingInternalController_dispatchReminders`. El controlador delega en `SchedulingWaitlistService.dispatchReminders`. Valida el body como `WorkerBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorkerBatchResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `WorkerBatchDto`; los campos opcionales se omiten.

```http
POST /scheduling/internal/dispatch-reminders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SYSTEM_WORKER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1 | Tamaño máximo del lote | `100` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/internal/dispatch-reminders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 100
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkerBatchResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "processed": 1,
  "detail": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `processed` | Sí | `number` | Sin restricción adicional declarada | Elementos procesados en el lote | `1` |
| `detail` | Sí | `string` | Sin restricción adicional declarada | Detalle de lo que hizo el worker | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SYSTEM_WORKER. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/internal/dispatch-reminders"
}
```

---

## 31. POST /scheduling/internal/expire-holds

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-internal`
- **Nombre:** Liberar las reservas temporales vencidas
- **Operation ID:** `SchedulingInternalController_expireHolds`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingInternalController.expireHolds](../../src/modules/scheduling/controllers/scheduling-internal.controller.ts)

### Descripción de negocio

Toma el lote con SKIP LOCKED para que varios workers no compitan.


### Descripción del sistema

NestJS resuelve `POST /scheduling/internal/expire-holds` en `SchedulingInternalController_expireHolds`. El controlador delega en `SchedulingBookingsService.expireHolds`. Valida el body como `WorkerBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorkerBatchResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `WorkerBatchDto`; los campos opcionales se omiten.

```http
POST /scheduling/internal/expire-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SYSTEM_WORKER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1 | Tamaño máximo del lote | `100` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/internal/expire-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 100
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkerBatchResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "processed": 1,
  "detail": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `processed` | Sí | `number` | Sin restricción adicional declarada | Elementos procesados en el lote | `1` |
| `detail` | Sí | `string` | Sin restricción adicional declarada | Detalle de lo que hizo el worker | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SYSTEM_WORKER. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/internal/expire-holds"
}
```

---

## 32. POST /scheduling/internal/promote-waitlist/{slotId}

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-internal`
- **Nombre:** Promover candidatos de la lista de espera a un slot con cupo
- **Operation ID:** `SchedulingInternalController_promoteWaitlist`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingInternalController.promoteWaitlist](../../src/modules/scheduling/controllers/scheduling-internal.controller.ts)

### Descripción de negocio

Marca a los candidatos; la reserva la confirma el paciente.


### Descripción del sistema

NestJS resuelve `POST /scheduling/internal/promote-waitlist/{slotId}` en `SchedulingInternalController_promoteWaitlist`. El controlador delega en `SchedulingWaitlistService.promoteWaitlist`. Valida el body como `WorkerBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorkerBatchResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slotId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `WorkerBatchDto`; los campos opcionales se omiten.

```http
POST /scheduling/internal/promote-waitlist/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SYSTEM_WORKER`.
- Deben ser UUID válidos: `slotId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1 | Tamaño máximo del lote | `100` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/internal/promote-waitlist/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 100
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorkerBatchResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkerBatchResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "processed": 1,
  "detail": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `processed` | Sí | `number` | Sin restricción adicional declarada | Elementos procesados en el lote | `1` |
| `detail` | Sí | `string` | Sin restricción adicional declarada | Detalle de lo que hizo el worker | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SYSTEM_WORKER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Slot no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-waitlist.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/internal/promote-waitlist/{slotId}"
}
```

---

## 33. GET /scheduling/internal/waitlist-candidates

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-internal`
- **Nombre:** Listar slots con cupo libre y candidatos activos en espera
- **Operation ID:** `SchedulingInternalController_listWaitlistCandidates`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingInternalController.listWaitlistCandidates](../../src/modules/scheduling/controllers/scheduling-internal.controller.ts)

### Descripción de negocio

Listar slots con cupo libre y candidatos activos en espera. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-41-12 (descubrimiento). `promote-waitlist/:slotId` exige un slot puntual y `expire-holds` no devuelve ids, así que este endpoint es lo que le permite al worker saber qué slot promover en cada tick.

### Descripción del sistema

NestJS resuelve `GET /scheduling/internal/waitlist-candidates` en `SchedulingInternalController_listWaitlistCandidates`. El controlador delega en `SchedulingWaitlistService.findSlotsWithCandidates`. No recibe body. El tipo de retorno estático es `Promise<WaitlistCandidateSlotsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tamaño máximo del lote | `100` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/internal/waitlist-candidates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SYSTEM_WORKER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/internal/waitlist-candidates?limit=100 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WaitlistCandidateSlotsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<WaitlistCandidateSlotsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<WaitlistCandidateSlotsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<WaitlistCandidateSlotsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<WaitlistCandidateSlotsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<WaitlistCandidateSlotsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WaitlistCandidateSlotsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "slotIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `slotIds` | Sí | `array<string>` | formato `uuid` | Slots candidatos a promoción, del más próximo al más lejano | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SYSTEM_WORKER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/internal/waitlist-candidates"
}
```

---

## 34. GET /scheduling/resources

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-agenda`
- **Nombre:** Listar los recursos agendables de un tenant
- **Operation ID:** `SchedulingAgendaController_listResources`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingAgendaController.listResources](../../src/modules/scheduling/controllers/scheduling-agenda.controller.ts)

### Descripción de negocio

Listar los recursos agendables de un tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Recursos agendables del tenant.

### Descripción del sistema

NestJS resuelve `GET /scheduling/resources` en `SchedulingAgendaController_listResources`. El controlador delega en `SchedulingAgendaService.listResources`. No recibe body. El tipo de retorno estático es `Promise<ListResourcesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | query | Sí | `string` | formato `uuid` | Tenant dueño de la agenda | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | query | No | `string` | formato `uuid` | Filtrar por práctica | `00000000-0000-4000-8000-000000000001` |
| `resourceType` | query | No | `string` | valores: `PRACTITIONER`, `ROOM`, `EQUIPMENT` | Filtrar por tipo de recurso | `PRACTITIONER` |
| `includeInactive` | query | No | `boolean` | Sin restricción adicional declarada | Incluir los recursos dados de baja | `false` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/resources?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/resources?tenantId=00000000-0000-4000-8000-000000000001&practiceId=00000000-0000-4000-8000-000000000001&resourceType=PRACTITIONER&includeInactive=false HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListResourcesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListResourcesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListResourcesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListResourcesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListResourcesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListResourcesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListResourcesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "resourceRefType": "health_practitioner_profiles",
      "resourceRefId": "00000000-0000-4000-8000-000000000001",
      "practitionerName": "Nombre de ejemplo",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "timeZone": "America/La_Paz",
      "capacity": 1,
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "site": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Nombre de ejemplo",
        "code": "CODIGO_EJEMPLO",
        "addressText": "Av. Brasil 1234, La Paz",
        "timeZone": "America/La_Paz"
      }
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ResourceListItemDto>` | Sin restricción adicional declarada | Recursos de esta página. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","resourceTypeConceptId":"00000000-0000-4000-8000-000000000001","resourceRefType":"health_practitioner_profiles","resourceRefId":"00000000-0000-4000-8000-000000000001","practitionerName":"Nombre de ejemplo","practiceId":"00000000-0000-4000-8000-000000000001","timeZone":"America/La_Paz","capacity":1,"stateConceptId":"00000000-0000-4000-8000-000000000001","site":{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","code":"CODIGO_EJEMPLO","addressText":"Av. Brasil 1234, La Paz","timeZone":"America/La_Paz"}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].resourceTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a resource type concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceRefType` | Sí | `string` | Sin restricción adicional declarada | Tipo de la entidad referenciada por el recurso. | `health_practitioner_profiles` |
| `items[].resourceRefId` | Sí | `string` | formato `uuid` | Identificador asociado a resource ref. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerName` | Sí | `string` | admite null | Nombre del profesional detrás del recurso, cuando la referencia apunta a un perfil profesional y la persona pudo resolverse. El selector del paciente pregunta «¿con quién te querés atender?» — la respuesta honesta es una persona, no el nombre interno de la agenda. `null` para salas, equipos, o cuando el perfil referido no existe: la ausencia es un estado real que el cliente debe poder distinguir. | `Nombre de ejemplo` |
| `items[].practiceId` | No | `string` | formato `uuid`; admite null | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `items[].timeZone` | No | `string` | admite null | Zona horaria IANA del recurso. | `America/La_Paz` |
| `items[].capacity` | Sí | `number` | Sin restricción adicional declarada | Atenciones simultáneas que admite. 1 cuando el recurso no lo declara. | `1` |
| `items[].stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].site` | No | `ResourceSiteDto` | Sin restricción adicional declarada | Dónde se atiende con este recurso. Derivado de lo que el recurso ya declara —la asignación de rol vigente si apunta a un profesional, el espacio de atención si apunta a un box— y no de una columna propia: guardarlo dos veces sería tener dos verdades sobre el mismo hecho. `null` es un estado corriente y no un error: un recurso sin asignación vigente con sede no tiene dónde que mostrar, y la agenda sigue sirviendo para elegir horario. | `{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","code":"CODIGO_EJEMPLO","addressText":"Av. Brasil 1234, La Paz","timeZone":"America/La_Paz"}` |
| `items[].site.id` | No | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `items[].site.name` | No | `string` | Sin restricción adicional declarada | Nombre legible de la sede. | `Nombre de ejemplo` |
| `items[].site.code` | No | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `items[].site.addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
| `items[].site.timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources"
}
```

---

## 35. POST /scheduling/resources

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Dar de alta un recurso agendable
- **Operation ID:** `SchedulingController_createResource`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.createResource](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Dar de alta un recurso agendable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/resources` en `SchedulingController_createResource`. El controlador delega en `SchedulingCatalogService.createResource`. Valida el body como `CreateResourceDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateResourceDto`; los campos opcionales se omiten.

```http
POST /scheduling/resources HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PRACTITIONER",
  "resourceRefType": "valor-ejemplo",
  "resourceRefId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resourceType` | Sí | `string` | valores: `PRACTITIONER`, `ROOM`, `EQUIPMENT` | Tipo de recurso | `PRACTITIONER` |
| `resourceRefType` | Sí | `string` | longitud máxima 100 | Tipo de la entidad referenciada (referencia polimórfica), p. ej. practitioner_profiles | `valor-ejemplo` |
| `resourceRefId` | Sí | `string` | formato `uuid` | Id de la entidad referenciada | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `practiceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA del recurso | `America/La_Paz` |
| `capacity` | No | `number` | mínimo 1 | Atenciones simultáneas que admite | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/resources HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Un profesional solo puede publicar su propia agenda: el recurso debe ' +           'apuntar a su perfil profesional. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 403 | `FORBIDDEN` | El tenant indicado no es uno de los del actor. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | veredicto === 'pendiente'         ? 'Tu vínculo con esta organización todavía está pendiente de ' +             'aprobación. Cuando la acepten vas a poder publicar tu agenda acá.'         : 'Tu vínculo con esta organización no está vigente, así que no podés ' +             'publicar agenda acá. Hablá con ellos para reactivarlo.' | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources"
}
```

---

## 36. POST /scheduling/resources/{id}/close-slots

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Cerrar cupos sueltos, dejando el bloqueo que impide regenerarlos
- **Operation ID:** `SchedulingController_closeSlots`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.closeSlots](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Bloquea los cupos nombrados y crea la excepción que cubre su rango. Rechaza si alguno tiene cita viva.

Contexto declarado en el controlador: Cierra cupos sueltos y deja el bloqueo que impide que vuelvan. Lo que el pedido pone entre paréntesis es su razón de ser: cerrar un cupo **sin** dejar la excepción sirve hasta que alguien regenera, y ahí el rato que el profesional había cerrado se ofrece otra vez. Un cupo con cita viva NO se cierra por acá: se rechaza entero y se nombran cuáles. Cancelar el turno de alguien exige motivo y avisa a esa persona; hacerlo de arrastre sería decidir por quien está esperando.

### Descripción del sistema

NestJS resuelve `POST /scheduling/resources/{id}/close-slots` en `SchedulingController_closeSlots`. El controlador delega en `SchedulingCatalogService.closeSlots`. Valida el body como `CloseSlotsDto` y consume `application/json`. El tipo de retorno estático es `Promise<CloseSlotsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseSlotsDto`; los campos opcionales se omiten.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/close-slots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exceptionType": "ABSENCE",
  "slotIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `exceptionType` | Sí | `string` | valores: `ABSENCE`, `HOLIDAY`, `VACATION`, `CONFERENCE`, `ERRAND`, `EXTRA`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ABSENCE` |
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `slotIds` | Sí | `array<string>` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/close-slots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exceptionType": "ABSENCE",
  "reason": "Texto descriptivo de ejemplo",
  "slotIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CloseSlotsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CloseSlotsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "closedSlots": 1,
  "exceptionId": "00000000-0000-4000-8000-000000000001",
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `closedSlots` | Sí | `number` | Sin restricción adicional declarada | Cuántos cupos quedaron cerrados. | `1` |
| `exceptionId` | Sí | `string` | formato `uuid` | La excepción que se creó para que regenerar no los devuelva. Es la parte que el pedido pone entre paréntesis y que es su razón de ser: sin ella, cerrar un cupo dura hasta la próxima generación. | `00000000-0000-4000-8000-000000000001` |
| `from` | Sí | `string` | formato `date-time` | Desde cuándo cubre la excepción. | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Hasta cuándo. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Ninguno de esos cupos es de esta agenda | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 409 | `CONFLICT` | Esos ratos tienen pacientes citados: cancelá cada turno antes de cerrarlos | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Elegiste «Otro» como motivo: escribí cuál es | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/close-slots"
}
```

---

## 37. POST /scheduling/resources/{id}/delay

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Informar una demora que alcanza a toda la agenda del recurso
- **Operation ID:** `SchedulingController_delayResource`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.delayResource](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Avisa a los pacientes con cita vigente en la ventana. No mueve ningún turno ni toca los cupos.

Contexto declarado en el controlador: P8: «me demoro veinte minutos hoy». Es como el profesional lo dice en la práctica —la demora es de la jornada, no de un turno suelto— y por eso cuelga del recurso. Alcanza a las citas vigentes de la ventana informada; por omisión, de ahora al fin del día.

### Descripción del sistema

NestJS resuelve `POST /scheduling/resources/{id}/delay` en `SchedulingController_delayResource`. El controlador delega en `SchedulingDelayService.delayResource`. Valida el body como `DelayResourceDto` y consume `application/json`. El tipo de retorno estático es `Promise<DelayNoticeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DelayResourceDto`; los campos opcionales se omiten.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/delay HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "delayMinutes": 20
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `delayMinutes` | Sí | `number` | mínimo 5; máximo 240 | Minutos de demora estimados | `20` |
| `message` | No | `string` | longitud máxima 300 | Mensaje del profesional para los pacientes | `valor-ejemplo` |
| `from` | No | `string` | formato `date-time` | Inicio de la ventana afectada (ISO 8601). Por omisión, ahora. | `2026-07-31T12:00:00.000Z` |
| `to` | No | `string` | formato `date-time` | Fin de la ventana afectada (ISO 8601). Por omisión, el fin del día. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/delay HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "delayMinutes": 20,
  "message": "valor-ejemplo",
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DelayNoticeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DelayNoticeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "notified": 1,
  "affected": 1,
  "bookingIds": [
    "valor-ejemplo"
  ],
  "detail": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `notified` | Sí | `number` | Sin restricción adicional declarada | Pacientes que recibieron el aviso | `1` |
| `affected` | Sí | `number` | Sin restricción adicional declarada | Citas alcanzadas por la demora | `1` |
| `bookingIds` | Sí | `array<string>` | formato `uuid` | Las citas alcanzadas, para que la pantalla pueda decir cuáles fueron. | `["valor-ejemplo"]` |
| `detail` | Sí | `string` | Sin restricción adicional declarada | Qué pasó, en una frase. Incluye por qué un aviso no llegó cuando no llegó. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-delay.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-delay.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana de la demora termina antes de empezar | Excepción explícita en src/modules/scheduling/services/scheduling-delay.service.ts |
| 422 | `PRECONDITION_FAILED` | Una demora mayor a cuatro horas se resuelve reprogramando el turno, no avisando | Excepción explícita en src/modules/scheduling/services/scheduling-delay.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/delay"
}
```

---

## 38. GET /scheduling/resources/{id}/exceptions

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Listar las excepciones de disponibilidad de un recurso
- **Operation ID:** `SchedulingController_listExceptions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.listExceptions](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

El profesional ve el texto libre del motivo; un paciente con cita ve sólo la etiqueta catalogada.

Contexto declarado en el controlador: UC-41-04 (lectura): las excepciones de un recurso en una ventana. El hueco gemelo del `GET` de plantillas: se podían crear excepciones y no leerlas. Sin esto, el calendario del médico no puede distinguir un día **bloqueado** de un día **sin agenda** —los dos aparecen sin cupos—, y ésa es justamente la diferencia que hay que mostrarle.

### Descripción del sistema

NestJS resuelve `GET /scheduling/resources/{id}/exceptions` en `SchedulingController_listExceptions`. El controlador delega en `SchedulingCatalogService.listExceptions`. No recibe body. El tipo de retorno estático es `Promise<AvailabilityExceptionListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | Sin restricción adicional declarada | Inicio de la ventana (ISO 8601) | `valor-ejemplo` |
| `to` | query | Sí | `string` | Sin restricción adicional declarada | Fin de la ventana (ISO 8601) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/exceptions?from=valor-ejemplo&to=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`, `PATIENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/exceptions?from=valor-ejemplo&to=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AvailabilityExceptionListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AvailabilityExceptionListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AvailabilityExceptionListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AvailabilityExceptionListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<AvailabilityExceptionListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AvailabilityExceptionListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AvailabilityExceptionListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AvailabilityExceptionListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "exceptionTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "reasonLabel": "Vacaciones",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z",
      "reason": "Texto descriptivo de ejemplo",
      "isAvailable": true
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<AvailabilityExceptionDto>` | Sin restricción adicional declarada | Las excepciones, de la más próxima a la más lejana. | `[{"id":"00000000-0000-4000-8000-000000000001","exceptionTypeConceptId":"00000000-0000-4000-8000-000000000001","reasonLabel":"Vacaciones","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z","reason":"Texto descriptivo de ejemplo","isAvailable":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].exceptionTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de excepción, como concepto. | `00000000-0000-4000-8000-000000000001` |
| `items[].reasonLabel` | Sí | `string` | Sin restricción adicional declarada | El motivo catalogado, en palabras. **Viaja para todos**, incluido el paciente: es una etiqueta de una lista cerrada —«Vacaciones», «Congreso o capacitación»— y no puede contener nada que el profesional no haya elegido a propósito. Es la mitad segura del motivo. La otra —`reason`, el texto libre— sólo la ve quien administra la agenda. | `Vacaciones` |
| `items[].startAt` | Sí | `string` | formato `date-time` | Comienzo del bloqueo. | `2026-07-31T12:00:00.000Z` |
| `items[].endAt` | Sí | `string` | formato `date-time` | Fin del bloqueo. | `2026-07-31T12:00:00.000Z` |
| `items[].reason` | No | `string` | Sin restricción adicional declarada | Por qué, si se declaró. Lo lee el profesional, no el paciente. | `Texto descriptivo de ejemplo` |
| `items[].isAvailable` | No | `boolean` | Sin restricción adicional declarada | `true` cuando la excepción ABRE disponibilidad en vez de cerrarla. | `true` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas son. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No podés ver los bloqueos de esta agenda | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/exceptions"
}
```

---

## 39. POST /scheduling/resources/{id}/exceptions

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Registrar una excepción de disponibilidad
- **Operation ID:** `SchedulingController_createException`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.createException](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Bloquea los slots libres que se solapan; las citas ya reservadas no se tocan.


### Descripción del sistema

NestJS resuelve `POST /scheduling/resources/{id}/exceptions` en `SchedulingController_createException`. El controlador delega en `SchedulingCatalogService.createException`. Valida el body como `CreateExceptionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExceptionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateExceptionDto`; los campos opcionales se omiten.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/exceptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exceptionType": "ABSENCE",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `exceptionType` | Sí | `string` | valores: `ABSENCE`, `HOLIDAY`, `VACATION`, `CONFERENCE`, `ERRAND`, `EXTRA`, `OTHER` | Motivo de la excepción | `ABSENCE` |
| `startAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `reason` | No | `string` | longitud máxima 500 | Texto libre del motivo. OBLIGATORIO cuando el tipo es OTHER; lo lee el profesional | `Texto descriptivo de ejemplo` |
| `isAvailable` | No | `boolean` | Sin restricción adicional declarada | true cuando la excepción **añade** disponibilidad extraordinaria | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/exceptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exceptionType": "ABSENCE",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo",
  "isAvailable": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExceptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "shipmentId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "failedAttemptProofId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `shipmentId` | Sí | `string` | formato `uuid` | Identificador asociado a shipment. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `priorityConceptId` | Sí | `string` | formato `uuid` | Prioridad a la que sube el sujeto | `00000000-0000-4000-8000-000000000001` |
| `eventId` | Sí | `string` | formato `uuid` | Identificador asociado a event. | `00000000-0000-4000-8000-000000000001` |
| `failedAttemptProofId` | No | `string` | formato `uuid` | Constancia del intento fallido | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Elegiste «Otro» como motivo: escribí cuál es | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | La excepción debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Tenés una cita confirmada en ese rato${               primera.resourceName ? ` en «${primera.resourceName}»` : ''             }. Reprogramala primero o elegí otro horario. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/exceptions"
}
```

---

## 40. POST /scheduling/resources/{id}/shift-slots

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Correr los cupos de una agenda N minutos
- **Operation ID:** `SchedulingController_shiftSlots`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.shiftSlots](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Mueve todos los cupos de la ventana, o sólo los que se nombren, y avisa a quien tenía turno. Todo o nada.

Contexto declarado en el controlador: Corre los cupos de una agenda N minutos — «mover horario» del carril 12. Distinto de «avisar demora», que **sólo avisa** y deja los cupos donde estaban. Acá el turno de la persona pasa a ser otro, así que se escribe y se avisa. Todo o nada: si un cupo no puede moverse porque su horario nuevo pisa otra cita del mismo profesional, no se mueve ninguno. La colisión la rechaza la base con `ex_appointments_practitioner_time`, no este código.

### Descripción del sistema

NestJS resuelve `POST /scheduling/resources/{id}/shift-slots` en `SchedulingController_shiftSlots`. El controlador delega en `SchedulingCatalogService.shiftSlots`. Valida el body como `ShiftSlotsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ShiftSlotsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ShiftSlotsDto`; los campos opcionales se omiten.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/shift-slots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "shiftMinutes": 20,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `shiftMinutes` | Sí | `number` | mínimo -240; máximo 240 | Minutos a correr. Negativo adelanta. | `20` |
| `from` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `slotIds` | No | `array<string>` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/shift-slots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "shiftMinutes": 20,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "slotIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ShiftSlotsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ShiftSlotsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "movedSlots": 1,
  "notified": 1,
  "shiftMinutes": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `movedSlots` | Sí | `number` | Sin restricción adicional declarada | Cuántos cupos se corrieron. | `1` |
| `notified` | Sí | `number` | Sin restricción adicional declarada | A cuántas personas se les avisó. Menor que `movedSlots` es lo corriente: los cupos libres se mueven y no hay a quién avisarle. | `1` |
| `shiftMinutes` | Sí | `number` | Sin restricción adicional declarada | Los minutos que se aplicaron, para que el cliente confirme lo que pidió. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana termina antes de empezar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Mover cero minutos no cambia nada: elegí cuánto correr la agenda | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/shift-slots"
}
```

---

## 41. GET /scheduling/resources/{id}/slots

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** UC-41-14: agenda publicada del recurso en una ventana
- **Operation ID:** `SchedulingController_getResourceAgenda`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.getResourceAgenda](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

UC-41-14: agenda publicada del recurso en una ventana. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-41-14: agenda publicada del recurso en una ventana de tiempo. Es lo que permite pintar un calendario y elegir un hueco: devuelve el `slotId` que después consume `POST /scheduling/slots/:id/holds`.

### Descripción del sistema

NestJS resuelve `GET /scheduling/resources/{id}/slots` en `SchedulingController_getResourceAgenda`. El controlador delega en `SchedulingCatalogService.getResourceAgenda`. No recibe body. El tipo de retorno estático es `Promise<ResourceAgendaResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | formato `date-time` | Inicio de la ventana (ISO 8601) | `2026-07-31T12:00:00.000Z` |
| `to` | query | Sí | `string` | formato `date-time` | Fin de la ventana (ISO 8601) | `2026-07-31T12:00:00.000Z` |
| `onlyAvailable` | query | No | `string` | Sin restricción adicional declarada | Por defecto `true`: sólo los slots con cupo. `false` devuelve la agenda completa, ocupados incluidos | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/slots?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/slots?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&onlyAvailable=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResourceAgendaResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ResourceAgendaResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ResourceAgendaResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ResourceAgendaResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ResourceAgendaResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ResourceAgendaResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ResourceAgendaResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceAgendaResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "scheduleTemplateId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "available": true,
      "statusConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1,
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `resourceId` | Sí | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `from` | Sí | `string` | formato `date-time` | Valor de from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Valor de to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items` | Sí | `array<BookableSlotItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","scheduleTemplateId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z","capacity":1,"remainingCapacity":1,"available":true,"statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Id del slot; es lo que se manda a `POST /scheduling/slots/:id/holds` | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | No | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `items[].scheduleTemplateId` | No | `string` | formato `uuid` | Identificador asociado a schedule template. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].startAt` | Sí | `string` | formato `date-time` | Valor de start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].endAt` | Sí | `string` | formato `date-time` | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].capacity` | Sí | `number` | Sin restricción adicional declarada | Cupos totales del slot | `1` |
| `items[].remainingCapacity` | Sí | `number` | Sin restricción adicional declarada | Cupos libres ahora mismo | `1` |
| `items[].available` | Sí | `boolean` | Sin restricción adicional declarada | Si queda cupo. Derivado: no requiere resolver terminología | `true` |
| `items[].statusConceptId` | No | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Número de elementos devueltos. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Si la ventana tenía más slots que el tope pedido. Se declara en vez de recortar en silencio: una agenda a la que le faltan huecos sin avisar se lee como una agenda llena | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/slots"
}
```

---

## 42. GET /scheduling/resources/{id}/templates

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Listar las plantillas de agenda de un recurso
- **Operation ID:** `SchedulingController_listTemplates`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.listTemplates](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Listar las plantillas de agenda de un recurso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-41-02 (lectura): las plantillas publicadas de un recurso. Vive junto a su POST hermano porque son las dos caras del mismo hecho. Sin esta lectura, publicar un horario era escribirlo en un papel y tirarlo: `scheduling` no tenía forma de volver a leer una plantilla, y por eso «Mi agenda» no podía existir. Un recurso sin plantillas devuelve `[]` con 200, no 404: existe y todavía no publicó horario.

### Descripción del sistema

NestJS resuelve `GET /scheduling/resources/{id}/templates` en `SchedulingController_listTemplates`. El controlador delega en `SchedulingCatalogService.listTemplates`. No recibe body. El tipo de retorno estático es `Promise<TemplateListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/templates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/templates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TemplateListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TemplateListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TemplateListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TemplateListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<TemplateListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TemplateListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TemplateListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TemplateListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "latestVersionId": "00000000-0000-4000-8000-000000000001",
      "responseWindowDays": 1,
      "effectiveFrom": "2026-07-31T12:00:00.000Z",
      "effectiveTo": "2026-07-31T12:00:00.000Z",
      "questions": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "position": 1,
          "questionText": "valor-ejemplo",
          "answerType": "TEXT",
          "required": true,
          "options": [
            "valor-ejemplo"
          ],
          "scaleMin": 1,
          "scaleMax": 1
        }
      ]
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<TemplateDetailDto>` | Sin restricción adicional declarada | Las plantillas publicadas, de la más reciente a la más vieja. | `[{"latestVersionId":"00000000-0000-4000-8000-000000000001","responseWindowDays":1,"effectiveFrom":"2026-07-31T12:00:00.000Z","effectiveTo":"2026-07-31T12:00:00.000Z","questions":[{"id":"00000000-0000-4000-8000-000000000001","position":1,"questionText":"valor-ejemplo","answerType":"TEXT","required":true,"options":["valor-ejemplo"],"scaleMin":1,"scaleMax":1}]}]` |
| `items[].latestVersionId` | Sí | `string` | formato `uuid` | Última versión | `00000000-0000-4000-8000-000000000001` |
| `items[].responseWindowDays` | Sí | `number` | Sin restricción adicional declarada | Días de plazo para responder | `1` |
| `items[].effectiveFrom` | No | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].effectiveTo` | No | `string` | formato `date-time` | Valor de effective to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].questions` | Sí | `array<QuestionDto>` | Sin restricción adicional declarada | Valor de questions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","position":1,"questionText":"valor-ejemplo","answerType":"TEXT","required":true,"options":["valor-ejemplo"],"scaleMin":1,"scaleMax":1}]` |
| `items[].questions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].questions[].position` | Sí | `number` | Sin restricción adicional declarada | Posición dentro del cuestionario | `1` |
| `items[].questions[].questionText` | Sí | `string` | Sin restricción adicional declarada | Enunciado | `valor-ejemplo` |
| `items[].questions[].answerType` | Sí | `string` | valores: `TEXT`, `SCALE`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE` | Valor de answer type mantenido por la instancia. | `TEXT` |
| `items[].questions[].required` | Sí | `boolean` | Sin restricción adicional declarada | Si es obligatoria | `true` |
| `items[].questions[].options` | No | `array<string>` | Sin restricción adicional declarada | Opciones de elección | `["valor-ejemplo"]` |
| `items[].questions[].scaleMin` | No | `number` | Sin restricción adicional declarada | Mínimo de la escala | `1` |
| `items[].questions[].scaleMax` | No | `number` | Sin restricción adicional declarada | Máximo de la escala | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas son. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/templates"
}
```

---

## 43. POST /scheduling/resources/{id}/templates

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Publicar una plantilla de agenda con sus franjas
- **Operation ID:** `SchedulingController_createTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.createTemplate](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Publicar una plantilla de agenda con sus franjas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/resources/{id}/templates` en `SchedulingController_createTemplate`. El controlador delega en `SchedulingCatalogService.createTemplate`. Valida el body como `SchedulingCreateTemplateDto` y consume `application/json`. El tipo de retorno estático es `Promise<TemplateResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SchedulingCreateTemplateDto`; los campos opcionales se omiten.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/templates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `rules` | Sí | `array<ScheduleRuleDto>` | Sin restricción adicional declarada | Franjas semanales de la plantilla | `[{"dayOfWeek":1,"startTime":"08:00:00","endTime":"12:00:00","slotMinutes":5,"capacityPerSlot":1,"gapMinutes":1}]` |
| `rules[].dayOfWeek` | Sí | `number` | mínimo 0; máximo 6 | 0 = domingo … 6 = sábado | `1` |
| `rules[].startTime` | Sí | `string` | patrón runtime `/^\d{2}:\d{2}(:\d{2})?$/` | Hora de inicio HH:MM:SS | `08:00:00` |
| `rules[].endTime` | Sí | `string` | patrón runtime `/^\d{2}:\d{2}(:\d{2})?$/` | Hora de fin HH:MM:SS | `12:00:00` |
| `rules[].slotMinutes` | No | `number` | mínimo 5 | Duración del slot en minutos | `5` |
| `rules[].capacityPerSlot` | No | `number` | mínimo 1 | Cupos por slot | `1` |
| `rules[].gapMinutes` | No | `number` | mínimo 0 | Minutos de respiro entre un turno y el siguiente. Ausente ≡ 0 | `1` |
| `slotMinutes` | No | `number` | Sin restricción adicional declarada | Duración por defecto del slot, en minutos | `30` |
| `bookingPolicyId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/resources/00000000-0000-4000-8000-000000000001/templates HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "rules": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00:00",
      "endTime": "12:00:00",
      "slotMinutes": 5,
      "capacityPerSlot": 1,
      "gapMinutes": 1
    }
  ],
  "slotMinutes": 30,
  "bookingPolicyId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TemplateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TemplateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "ruleCount": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `ruleCount` | Sí | `number` | Sin restricción adicional declarada | Franjas creadas | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La franja debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El turno de ${slotMinutes} min no entra en la franja de ${rule.startTime} a ${rule.endTime} (${duracionFranja} min) | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Dos franjas de esta agenda se solapan entre sí | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Ya tenés «${otra.resourceName}» el ${existente.etiqueta}, que se cruza con este ` +             'horario. Cambiá el horario o el día, o editá esa otra agenda. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{id}/templates"
}
```

---

## 44. GET /scheduling/resources/{resourceId}/waitlist

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Listar quiénes esperan turno en una agenda
- **Operation ID:** `SchedulingController_listResourceWaitlist`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.listResourceWaitlist](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Listar quiénes esperan turno en una agenda. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P8 · quiénes esperan una agenda — la vista de quien atiende. La contraria de la de arriba, y la que faltaba: la lista de espera promovía sola y avisaba sola, y el profesional dueño de la agenda no tenía forma de saber cuánta gente la esperaba ni desde cuándo. Sin esto, la pantalla del médico sólo podía mostrar el resultado de la promoción, nunca la cola. La agenda va en la ruta —igual que en `POST resources/{id}/delay`— porque es el sujeto de la lectura y **de la autorización**: quien no atiende en ella recibe 403, tenga el rol que tenga.

### Descripción del sistema

NestJS resuelve `GET /scheduling/resources/{resourceId}/waitlist` en `SchedulingController_listResourceWaitlist`. El controlador delega en `SchedulingWaitlistService.listForResource`. No recibe body. El tipo de retorno estático es `Promise<ListWaitlistResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `resourceId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `includeClosed` | query | No | `string` | Sin restricción adicional declarada | Incluye las cubiertas y canceladas (por omisión, no) | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/waitlist HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`.
- Deben ser UUID válidos: `resourceId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/resources/00000000-0000-4000-8000-000000000001/waitlist?includeClosed=valor-ejemplo&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListWaitlistResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "resourceLabel": "valor-ejemplo",
      "desiredFrom": "2026-07-31T12:00:00.000Z",
      "desiredTo": "2026-07-31T12:00:00.000Z",
      "priority": 1,
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "patientName": "Nombre de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<WaitlistEntryItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","resourceLabel":"valor-ejemplo","desiredFrom":"2026-07-31T12:00:00.000Z","desiredTo":"2026-07-31T12:00:00.000Z","priority":1,"statusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","patientName":"Nombre de ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceLabel` | Sí | `string` | Sin restricción adicional declarada | Nombre del profesional o del recurso | `valor-ejemplo` |
| `items[].desiredFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].desiredTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].priority` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].patientName` | No | `string` | Sin restricción adicional declarada | Nombre del paciente que espera | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: sólo ve quién la espera quien atiende en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-waitlist.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/resources/{resourceId}/waitlist"
}
```

---

## 45. GET /scheduling/slots

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-agenda`
- **Nombre:** Consultar los cupos de una ventana
- **Operation ID:** `SchedulingAgendaController_listSlots`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingAgendaController.listSlots](../../src/modules/scheduling/controllers/scheduling-agenda.controller.ts)

### Descripción de negocio

El `id` de cada cupo es el que se envía a `POST /scheduling/slots/{id}/holds`.

Contexto declarado en el controlador: Cupos de una ventana. Con `onlyAvailable=true` devuelve los que el portal puede ofrecer: abiertos y con capacidad libre.

### Descripción del sistema

NestJS resuelve `GET /scheduling/slots` en `SchedulingAgendaController_listSlots`. El controlador delega en `SchedulingAgendaService.listSlots`. No recibe body. El tipo de retorno estático es `Promise<ListSlotsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `resourceId` | query | No | `string` | formato `uuid` | Recurso cuya agenda se consulta | `00000000-0000-4000-8000-000000000001` |
| `scheduleTemplateId` | query | No | `string` | formato `uuid` | Plantilla que materializó los cupos | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | formato `date-time` | Inicio de la ventana consultada | `2026-07-31T12:00:00.000Z` |
| `to` | query | Sí | `string` | formato `date-time` | Fin de la ventana (exclusivo) | `2026-07-31T12:00:00.000Z` |
| `onlyAvailable` | query | No | `boolean` | Sin restricción adicional declarada | Sólo cupos con capacidad libre y abiertos: lo que el portal ofrece para reservar | `false` |
| `limit` | query | No | `number` | máximo 500 | Sin descripción específica en OpenAPI. | `200` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/slots?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/slots?resourceId=00000000-0000-4000-8000-000000000001&scheduleTemplateId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&onlyAvailable=false&limit=200 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListSlotsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListSlotsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListSlotsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListSlotsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListSlotsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListSlotsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListSlotsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "scheduleTemplateId": "00000000-0000-4000-8000-000000000001",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z",
      "capacity": 1,
      "remainingCapacity": 1,
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1,
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SlotListItemDto>` | Sin restricción adicional declarada | Cupos de esta página, del más próximo al más lejano. | `[{"id":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","scheduleTemplateId":"00000000-0000-4000-8000-000000000001","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z","capacity":1,"remainingCapacity":1,"statusConceptId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Id a enviar para reservar el cupo | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | Sí | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `items[].scheduleTemplateId` | No | `string` | formato `uuid`; admite null | Identificador asociado a schedule template. | `00000000-0000-4000-8000-000000000001` |
| `items[].startAt` | Sí | `string` | formato `date-time` | Valor de start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].endAt` | Sí | `string` | formato `date-time` | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].capacity` | Sí | `number` | Sin restricción adicional declarada | Cupos totales del slot. | `1` |
| `items[].remainingCapacity` | Sí | `number` | Sin restricción adicional declarada | Cupos que quedan libres. | `1` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | No | `string` | formato `uuid`; admite null | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado. | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Si la ventana excede el tope y hay que estrecharla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La ventana debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana no puede superar ${MAX_WINDOW_DAYS} días | Excepción explícita en src/modules/scheduling/services/scheduling-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/slots"
}
```

---

## 46. POST /scheduling/slots/{id}/holds

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Reservar temporalmente un cupo del slot
- **Operation ID:** `SchedulingController_placeHold`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.placeHold](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Anti-double-booking: el slot se bloquea con FOR UPDATE y el cupo se devuelve solo si el hold expira.


### Descripción del sistema

NestJS resuelve `POST /scheduling/slots/{id}/holds` en `SchedulingController_placeHold`. El controlador delega en `SchedulingBookingsService.placeHold`. Valida el body como `CreateHoldDto` y consume `application/json`. El tipo de retorno estático es `Promise<HoldResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateHoldDto`; los campos opcionales se omiten.

```http
POST /scheduling/slots/00000000-0000-4000-8000-000000000001/holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PATIENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | No | `string` | formato `uuid` | Paciente para el que se reserva | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/slots/00000000-0000-4000-8000-000000000001/holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HoldResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HoldResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HoldResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "holdToken": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "remainingCapacity": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `holdToken` | Sí | `string` | Sin restricción adicional declarada | Token con el que se confirma la reserva. Se entrega una sola vez. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `remainingCapacity` | Sí | `number` | Sin restricción adicional declarada | Cupos que quedan libres en el slot | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Slot no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | El slot no tiene cupos disponibles | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | El paciente alcanzó el máximo de citas activas | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El slot está bloqueado | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 422 | `PRECONDITION_FAILED` | yaPaso             ? 'Ese horario ya pasó.'             : `Ese turno empieza demasiado pronto: hay que pedirlo con al menos ${minutosDeAviso} minutos de anticipación.` | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/slots/{id}/holds"
}
```

---

## 47. DELETE /scheduling/templates/{id}

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Retirar una plantilla de agenda y soltar sus cupos libres
- **Operation ID:** `SchedulingController_retireTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.retireTemplate](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

La plantilla queda en TPL_RETIRED y deja de publicarse; los cupos con citas se conservan. Rechaza con 409 si tiene citas confirmadas o presentadas.

Contexto declarado en el controlador: Retirar un horario publicado (TAREA-10, punto 6). `DELETE` y no `PATCH` porque para quien lo usa **es** el botón de dar de baja el horario; lo que cambia es qué significa dar de baja acá, y eso lo dice el cuerpo de la respuesta. No es `@HttpCode(NO_CONTENT)` como el borrado de una excepción: éste devuelve cuánto soltó y cuánto conservó. Responde **409 con la lista** cuando el horario tiene citas comprometidas: no lo retira y nombra lo que hay que resolver primero.

### Descripción del sistema

NestJS resuelve `DELETE /scheduling/templates/{id}` en `SchedulingController_retireTemplate`. El controlador delega en `SchedulingCatalogService.retireTemplate`. No recibe body. El tipo de retorno estático es `Promise<RetireTemplateResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /scheduling/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /scheduling/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetireTemplateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetireTemplateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "releasedSlots": 1,
  "keptSlots": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | La plantilla retirada. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | El estado con el que queda: `TPL_RETIRED`. | `00000000-0000-4000-8000-000000000001` |
| `releasedSlots` | Sí | `number` | Sin restricción adicional declarada | Cupos libres que se soltaron al retirar el horario | `1` |
| `keptSlots` | Sí | `number` | Sin restricción adicional declarada | Cupos conservados porque tienen una cita detrás | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso de la plantilla no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 409 | `CONFLICT` | El horario tiene citas comprometidas: resolvelas antes de retirarlo | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/templates/{id}"
}
```

---

## 48. PATCH /scheduling/templates/{id}

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Editar una plantilla de agenda ya publicada
- **Operation ID:** `SchedulingController_updateTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.updateTemplate](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Todo opcional; lo que no se manda se conserva. `rules`, si viene, reemplaza el conjunto entero y no toca los cupos ya materializados.

Contexto declarado en el controlador: Editar un horario publicado (TAREA-10, punto 16 — `/schedule/edit`). `PATCH` y no `POST`: es la edición de campos de una plantilla que ya existe, no un acto con nombre propio como `reactivate`. Todo opcional; omitir un campo lo conserva. Si `rules` viene, reemplaza el conjunto entero — no hay «agregar una franja» sola.

### Descripción del sistema

NestJS resuelve `PATCH /scheduling/templates/{id}` en `SchedulingController_updateTemplate`. El controlador delega en `SchedulingCatalogService.updateTemplate`. Valida el body como `SchedulingUpdateTemplateDto` y consume `application/json`. El tipo de retorno estático es `Promise<TemplateResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SchedulingUpdateTemplateDto`; los campos opcionales se omiten.

```http
PATCH /scheduling/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `rules` | No | `array<ScheduleRuleDto>` | Sin restricción adicional declarada | Franjas semanales de la plantilla. Si viene, reemplaza TODAS las existentes. | `[{"dayOfWeek":1,"startTime":"08:00:00","endTime":"12:00:00","slotMinutes":5,"capacityPerSlot":1,"gapMinutes":1}]` |
| `rules[].dayOfWeek` | No | `number` | mínimo 0; máximo 6 | 0 = domingo … 6 = sábado | `1` |
| `rules[].startTime` | No | `string` | patrón runtime `/^\d{2}:\d{2}(:\d{2})?$/` | Hora de inicio HH:MM:SS | `08:00:00` |
| `rules[].endTime` | No | `string` | patrón runtime `/^\d{2}:\d{2}(:\d{2})?$/` | Hora de fin HH:MM:SS | `12:00:00` |
| `rules[].slotMinutes` | No | `number` | mínimo 5 | Duración del slot en minutos | `5` |
| `rules[].capacityPerSlot` | No | `number` | mínimo 1 | Cupos por slot | `1` |
| `rules[].gapMinutes` | No | `number` | mínimo 0 | Minutos de respiro entre un turno y el siguiente. Ausente ≡ 0 | `1` |
| `slotMinutes` | No | `number` | Sin restricción adicional declarada | Duración por defecto del slot, en minutos | `1` |
| `bookingPolicyId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /scheduling/templates/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "rules": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00:00",
      "endTime": "12:00:00",
      "slotMinutes": 5,
      "capacityPerSlot": 1,
      "gapMinutes": 1
    }
  ],
  "slotMinutes": 1,
  "bookingPolicyId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TemplateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TemplateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "ruleCount": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `ruleCount` | Sí | `number` | Sin restricción adicional declarada | Franjas creadas | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La franja debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El turno de ${slotMinutesDeLaFranja} min no entra en la franja de ${rule.startTime} a ${rule.endTime} (${duracionFranja} min) | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/templates/{id}"
}
```

---

## 49. POST /scheduling/templates/{id}/generate-slots

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Materializar los slots de la plantilla en una ventana
- **Operation ID:** `SchedulingController_generateSlots`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.generateSlots](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Idempotente: los slots ya existentes se conservan y se cuentan como `skipped`.


### Descripción del sistema

NestJS resuelve `POST /scheduling/templates/{id}/generate-slots` en `SchedulingController_generateSlots`. El controlador delega en `SchedulingCatalogService.generateSlots`. Valida el body como `GenerateSlotsDto` y consume `application/json`. El tipo de retorno estático es `Promise<GenerateSlotsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GenerateSlotsDto`; los campos opcionales se omiten.

```http
POST /scheduling/templates/00000000-0000-4000-8000-000000000001/generate-slots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `from` | Sí | `string` | formato `date-time` | Inicio de la ventana a materializar | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Fin de la ventana (exclusivo) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/templates/00000000-0000-4000-8000-000000000001/generate-slots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GenerateSlotsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GenerateSlotsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "templateId": "00000000-0000-4000-8000-000000000001",
  "created": 1,
  "skipped": 1,
  "omittedByCommitments": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `templateId` | Sí | `string` | formato `uuid` | Identificador asociado a template. | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `number` | Sin restricción adicional declarada | Slots creados en esta ejecución | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Slots que ya existían y se conservaron | `1` |
| `omittedByCommitments` | Sí | `number` | Sin restricción adicional declarada | Cupos omitidos por chocar con compromisos del profesional (citas confirmadas en cualquiera de sus sedes) | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/templates/{id}/generate-slots"
}
```

---

## 50. POST /scheduling/templates/{id}/reactivate

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Reactivar un horario retirado
- **Operation ID:** `SchedulingController_reactivateTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.reactivateTemplate](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Lo devuelve a vigente. No regenera los cupos: hay que llamar a generate-slots con la ventana que corresponda.

Contexto declarado en el controlador: Vuelve a poner en vigencia un horario pausado — «me fui de viaje y volví». `POST` y no `PATCH` porque es un acto con nombre, no la edición de un campo: es la contraparte exacta de `retire`, y las dos se leen juntas en el mismo controlador.

### Descripción del sistema

NestJS resuelve `POST /scheduling/templates/{id}/reactivate` en `SchedulingController_reactivateTemplate`. El controlador delega en `SchedulingCatalogService.reactivateTemplate`. No recibe body. El tipo de retorno estático es `Promise<ReactivateTemplateResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /scheduling/templates/00000000-0000-4000-8000-000000000001/reactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /scheduling/templates/00000000-0000-4000-8000-000000000001/reactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReactivateTemplateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReactivateTemplateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "slotsPendientes": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | La plantilla reactivada. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | El estado con el que queda: `TPL_PUBLISHED`. | `00000000-0000-4000-8000-000000000001` |
| `slotsPendientes` | Sí | `boolean` | Sin restricción adicional declarada | true cuando el horario quedó vigente sin cupos materializados y hay que generarlos | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta agenda es de otro profesional: solo la administra quien atiende ' +           'en ella. | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 404 | `NOT_FOUND` | Recurso de la plantilla no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/templates/{id}/reactivate"
}
```

---

## 51. GET /scheduling/waitlist

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Listar las entradas de lista de espera de un paciente
- **Operation ID:** `SchedulingController_listWaitlist`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.listWaitlist](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Listar las entradas de lista de espera de un paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P8 · UC-41-11 (lectura): en qué listas de espera está un paciente. Faltaba: el módulo dejaba anotarse y no ofrecía forma de comprobarlo, así que «estás en espera» sólo podía ser una suposición del cliente.

### Descripción del sistema

NestJS resuelve `GET /scheduling/waitlist` en `SchedulingController_listWaitlist`. El controlador delega en `SchedulingWaitlistService.listForPatient`. No recibe body. El tipo de retorno estático es `Promise<ListWaitlistResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `includeClosed` | query | No | `string` | Sin restricción adicional declarada | Incluye las cubiertas y canceladas (por omisión, no) | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /scheduling/waitlist?patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /scheduling/waitlist?patientProfileId=00000000-0000-4000-8000-000000000001&includeClosed=valor-ejemplo&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListWaitlistResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListWaitlistResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "resourceLabel": "valor-ejemplo",
      "desiredFrom": "2026-07-31T12:00:00.000Z",
      "desiredTo": "2026-07-31T12:00:00.000Z",
      "priority": 1,
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "patientName": "Nombre de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<WaitlistEntryItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","resourceLabel":"valor-ejemplo","desiredFrom":"2026-07-31T12:00:00.000Z","desiredTo":"2026-07-31T12:00:00.000Z","priority":1,"statusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","patientName":"Nombre de ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceLabel` | Sí | `string` | Sin restricción adicional declarada | Nombre del profesional o del recurso | `valor-ejemplo` |
| `items[].desiredFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].desiredTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].priority` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].patientName` | No | `string` | Sin restricción adicional declarada | Nombre del paciente que espera | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular y el personal de agenda pueden ver esta lista de espera. | Excepción explícita en src/modules/scheduling/services/scheduling-waitlist.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/waitlist"
}
```

---

## 52. POST /scheduling/waitlist

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Inscribir a un paciente en la lista de espera
- **Operation ID:** `SchedulingController_enrollWaitlist`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.enrollWaitlist](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Inscribir a un paciente en la lista de espera. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/waitlist` en `SchedulingController_enrollWaitlist`. El controlador delega en `SchedulingWaitlistService.enroll`. Valida el body como `CreateWaitlistEntryDto` y consume `application/json`. El tipo de retorno estático es `Promise<WaitlistEntryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateWaitlistEntryDto`; los campos opcionales se omiten.

```http
POST /scheduling/waitlist HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PATIENT`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | No | `string` | formato `uuid` | Recurso deseado | `00000000-0000-4000-8000-000000000001` |
| `desiredFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `desiredTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `priority` | No | `number` | mínimo 0 | Prioridad; a mayor valor, antes se promueve | `0` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/waitlist HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "desiredFrom": "2026-07-31T12:00:00.000Z",
  "desiredTo": "2026-07-31T12:00:00.000Z",
  "priority": 0
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WaitlistEntryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WaitlistEntryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | Sin restricción adicional declarada | Valor de priority mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/scheduling/waitlist"
}
```

---

## 53. GET /tenants/{tenantId}/agenda

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling-tenant-agenda`
- **Nombre:** La agenda de la organización
- **Operation ID:** `TenantAgendaController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantAgendaController.list](../../src/modules/scheduling/controllers/tenant-agenda.controller.ts)

### Descripción de negocio

Las citas de los recursos de esta organización en la ventana pedida. El motivo de consulta NO viaja: es del paciente y de su médico. El filtro por organización va en la consulta, no comprobado después.

Contexto declarado en el controlador: Las citas de la organización en una ventana.

### Descripción del sistema

NestJS resuelve `GET /tenants/{tenantId}/agenda` en `TenantAgendaController_list`. El controlador delega en `SchedulingTenantAgendaService.listar`. No recibe body. El tipo de retorno estático es `Promise<TenantAgendaResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-08-19T00:00:00.000Z` |
| `to` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-08-26T00:00:00.000Z` |
| `practitionerProfileId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 500 | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/agenda?from=2026-08-19T00%3A00%3A00.000Z&to=2026-08-26T00%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/agenda?from=2026-08-19T00%3A00%3A00.000Z&to=2026-08-26T00%3A00%3A00.000Z&practitionerProfileId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TenantAgendaResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TenantAgendaResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TenantAgendaResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TenantAgendaResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<TenantAgendaResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TenantAgendaResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TenantAgendaResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantAgendaResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "bookingId": "00000000-0000-4000-8000-000000000001",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "resourceName": "Nombre de ejemplo",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "patientName": "Nombre de ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<TenantAgendaItemDto>` | Sin restricción adicional declarada | Las citas, en orden cronológico. | `[{"bookingId":"00000000-0000-4000-8000-000000000001","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z","resourceId":"00000000-0000-4000-8000-000000000001","resourceName":"Nombre de ejemplo","practitionerProfileId":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","patientName":"Nombre de ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].bookingId` | Sí | `string` | formato `uuid` | La cita. | `00000000-0000-4000-8000-000000000001` |
| `items[].startAt` | Sí | `string` | formato `date-time` | Cuándo empieza. | `2026-07-31T12:00:00.000Z` |
| `items[].endAt` | Sí | `string` | formato `date-time` | Cuándo termina. | `2026-07-31T12:00:00.000Z` |
| `items[].resourceId` | Sí | `string` | formato `uuid`; admite null | El recurso —la sede— donde se atiende. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceName` | Sí | `string` | admite null | Nombre de la sede, para no obligar a la pantalla a cruzarlo. | `Nombre de ejemplo` |
| `items[].practitionerProfileId` | Sí | `string` | formato `uuid`; admite null | El profesional que atiende, si el recurso apunta a uno. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | El paciente citado. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientName` | Sí | `string` | admite null | Nombre del paciente: la organización lo recibe en la puerta. | `Nombre de ejemplo` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la cita. | `00000000-0000-4000-8000-000000000001` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Si la ventana devolvió tantas citas como el tope permitía. Una agenda a la que le faltan citas sin avisar se lee como una agenda más vacía de lo que está, que es exactamente la lectura contraria a la que una recepción necesita. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana no es una fecha válida | Excepción explícita en src/modules/scheduling/services/scheduling-tenant-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-tenant-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El rango no puede superar los ${MAX_RANGO_AGENDA_DIAS} días | Excepción explícita en src/modules/scheduling/services/scheduling-tenant-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/agenda"
}
```

---

