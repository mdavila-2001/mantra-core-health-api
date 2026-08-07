<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `scheduling`

Referencia exhaustiva de 26 operación(es) del módulo `scheduling`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `scheduling`, `scheduling-agenda`, `scheduling-bookings`, `scheduling-confirmation`, `scheduling-internal`
- **Controladores:** `SchedulingAgendaController`, `SchedulingBookingsController`, `SchedulingConfirmationController`, `SchedulingController`, `SchedulingInternalController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /scheduling/booking-policies](#1-post-scheduling-booking-policies) — Definir una política de reserva
2. [GET /scheduling/bookings](#2-get-scheduling-bookings) — UC-41-15: lista citas por paciente, recurso y/o ventana
3. [GET /scheduling/bookings/{id}](#3-get-scheduling-bookings-id) — UC-41-15: consulta una cita
4. [POST /scheduling/bookings/{id}/cancel](#4-post-scheduling-bookings-id-cancel) — Cancelar la cita y liberar el cupo
5. [POST /scheduling/bookings/{id}/check-in](#5-post-scheduling-bookings-id-check-in) — Registrar la llegada del paciente
6. [POST /scheduling/bookings/{id}/reminders](#6-post-scheduling-bookings-id-reminders) — Programar recordatorios para la cita
7. [POST /scheduling/bookings/{id}/reschedule](#7-post-scheduling-bookings-id-reschedule) — Reprogramar la cita a otro slot
8. [GET /scheduling/confirmation-rules](#8-get-scheduling-confirmation-rules) — Listar las reglas de un tenant
9. [POST /scheduling/confirmation-rules](#9-post-scheduling-confirmation-rules) — Crear una regla de confirmación
10. [POST /scheduling/confirmation-rules/{id}/activate](#10-post-scheduling-confirmation-rules-id-activate) — Reactivar una regla desactivada
11. [POST /scheduling/confirmation-rules/{id}/deactivate](#11-post-scheduling-confirmation-rules-id-deactivate) — Desactivar una regla (sin borrado duro)
12. [POST /scheduling/confirmation-rules/evaluate](#12-post-scheduling-confirmation-rules-evaluate) — Evaluar una solicitud de reserva contra las reglas vigentes
13. [POST /scheduling/holds/{holdToken}/confirm](#13-post-scheduling-holds-holdtoken-confirm) — Confirmar la cita a partir de la reserva temporal
14. [POST /scheduling/internal/dispatch-reminders](#14-post-scheduling-internal-dispatch-reminders) — Despachar los recordatorios cuya hora ya llegó
15. [POST /scheduling/internal/expire-holds](#15-post-scheduling-internal-expire-holds) — Liberar las reservas temporales vencidas
16. [POST /scheduling/internal/promote-waitlist/{slotId}](#16-post-scheduling-internal-promote-waitlist-slotid) — Promover candidatos de la lista de espera a un slot con cupo
17. [GET /scheduling/internal/waitlist-candidates](#17-get-scheduling-internal-waitlist-candidates) — Listar slots con cupo libre y candidatos activos en espera
18. [GET /scheduling/resources](#18-get-scheduling-resources) — Listar los recursos agendables de un tenant
19. [POST /scheduling/resources](#19-post-scheduling-resources) — Dar de alta un recurso agendable
20. [POST /scheduling/resources/{id}/exceptions](#20-post-scheduling-resources-id-exceptions) — Registrar una excepción de disponibilidad
21. [GET /scheduling/resources/{id}/slots](#21-get-scheduling-resources-id-slots) — UC-41-14: agenda publicada del recurso en una ventana
22. [POST /scheduling/resources/{id}/templates](#22-post-scheduling-resources-id-templates) — Publicar una plantilla de agenda con sus franjas
23. [GET /scheduling/slots](#23-get-scheduling-slots) — Consultar los cupos de una ventana
24. [POST /scheduling/slots/{id}/holds](#24-post-scheduling-slots-id-holds) — Reservar temporalmente un cupo del slot
25. [POST /scheduling/templates/{id}/generate-slots](#25-post-scheduling-templates-id-generate-slots) — Materializar los slots de la plantilla en una ventana
26. [POST /scheduling/waitlist](#26-post-scheduling-waitlist) — Inscribir a un paciente en la lista de espera

---

## 1. POST /scheduling/booking-policies

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
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
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

## 2. GET /scheduling/bookings

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
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "bookableSlotId": "00000000-0000-4000-8000-000000000001",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "bookingChannelConceptId": "00000000-0000-4000-8000-000000000001",
      "confirmedAt": "2026-07-31T12:00:00.000Z",
      "checkedInAt": "2026-07-31T12:00:00.000Z",
      "reasonText": "Texto descriptivo de ejemplo",
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
| `items` | Sí | `array<BookingItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","bookableSlotId":"00000000-0000-4000-8000-000000000001","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z","statusConceptId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001","bookingChannelConceptId":"00000000-0000-4000-8000-000000000001","confirmedAt":"2026-07-31T12:00:00.000Z","checkedInAt":"2026-07-31T12:00:00.000Z","reasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | No | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | No | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `items[].bookableSlotId` | No | `string` | formato `uuid` | Identificador asociado a bookable slot. | `00000000-0000-4000-8000-000000000001` |
| `items[].startAt` | No | `string` | formato `date-time`; admite null | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `2026-07-31T12:00:00.000Z` |
| `items[].endAt` | No | `string` | formato `date-time`; admite null | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].bookingChannelConceptId` | No | `string` | formato `uuid` | Identificador asociado a booking channel concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].confirmedAt` | No | `string` | formato `date-time` | Valor de confirmed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].checkedInAt` | No | `string` | formato `date-time` | Valor de checked in at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].reasonText` | No | `string` | Sin restricción adicional declarada | Valor de reason text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
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

## 3. GET /scheduling/bookings/{id}

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
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "bookableSlotId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "bookingChannelConceptId": "00000000-0000-4000-8000-000000000001",
  "confirmedAt": "2026-07-31T12:00:00.000Z",
  "checkedInAt": "2026-07-31T12:00:00.000Z",
  "reasonText": "Texto descriptivo de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | No | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `bookableSlotId` | No | `string` | formato `uuid` | Identificador asociado a bookable slot. | `00000000-0000-4000-8000-000000000001` |
| `startAt` | No | `string` | formato `date-time`; admite null | Instante de la cita, tomado del slot. `null` si la cita quedó sin slot | `2026-07-31T12:00:00.000Z` |
| `endAt` | No | `string` | formato `date-time`; admite null | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Identificador asociado a service concept. | `00000000-0000-4000-8000-000000000001` |
| `bookingChannelConceptId` | No | `string` | formato `uuid` | Identificador asociado a booking channel concept. | `00000000-0000-4000-8000-000000000001` |
| `confirmedAt` | No | `string` | formato `date-time` | Valor de confirmed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `checkedInAt` | No | `string` | formato `date-time` | Valor de checked in at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `reasonText` | No | `string` | Sin restricción adicional declarada | Valor de reason text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
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

## 4. POST /scheduling/bookings/{id}/cancel

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
  "cancelledBy": "PATIENT"
}
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
| `cancelledBy` | Sí | `string` | valores: `PATIENT`, `PROVIDER` | Quién origina la cancelación | `PATIENT` |
| `isNoShow` | No | `boolean` | Sin restricción adicional declarada | true si la cita se marca como inasistencia (aplica el cargo de la política) | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /scheduling/bookings/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cancelledBy": "PATIENT",
  "isNoShow": false
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cita no encontrada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 409 | `CONFLICT` | La cita ya está cancelada | Excepción explícita en src/modules/scheduling/services/scheduling-bookings.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
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

## 5. POST /scheduling/bookings/{id}/check-in

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

## 6. POST /scheduling/bookings/{id}/reminders

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
| `offsetsMinutes` | Sí | `array<number>` | Sin restricción adicional declarada | Minutos de antelación de cada recordatorio | `[1440,120]` |
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

## 7. POST /scheduling/bookings/{id}/reschedule

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
  "toSlotId": "00000000-0000-4000-8000-000000000001"
}
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
| `toSlotId` | Sí | `string` | formato `uuid` | Slot destino | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | longitud máxima 500 | Motivo del cambio | `Texto descriptivo de ejemplo` |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT. | Roles/tenant/guards de autorización |
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

## 8. GET /scheduling/confirmation-rules

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

## 9. POST /scheduling/confirmation-rules

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

## 10. POST /scheduling/confirmation-rules/{id}/activate

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

## 11. POST /scheduling/confirmation-rules/{id}/deactivate

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

## 12. POST /scheduling/confirmation-rules/evaluate

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

## 13. POST /scheduling/holds/{holdToken}/confirm

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
| `reminderOffsetsMinutes` | No | `array<number>` | Sin restricción adicional declarada | Minutos de antelación de los recordatorios a programar | `[1440,120]` |

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

## 14. POST /scheduling/internal/dispatch-reminders

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

## 15. POST /scheduling/internal/expire-holds

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

## 16. POST /scheduling/internal/promote-waitlist/{slotId}

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

## 17. GET /scheduling/internal/waitlist-candidates

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

## 18. GET /scheduling/resources

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
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "timeZone": "America/La_Paz",
      "capacity": 1,
      "stateConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ResourceListItemDto>` | Sin restricción adicional declarada | Recursos de esta página. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","resourceTypeConceptId":"00000000-0000-4000-8000-000000000001","resourceRefType":"health_practitioner_profiles","resourceRefId":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","timeZone":"America/La_Paz","capacity":1,"stateConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].resourceTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a resource type concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceRefType` | Sí | `string` | Sin restricción adicional declarada | Tipo de la entidad referenciada por el recurso. | `health_practitioner_profiles` |
| `items[].resourceRefId` | Sí | `string` | formato `uuid` | Identificador asociado a resource ref. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceId` | No | `string` | formato `uuid`; admite null | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `items[].timeZone` | No | `string` | admite null | Zona horaria IANA del recurso. | `America/La_Paz` |
| `items[].capacity` | Sí | `number` | Sin restricción adicional declarada | Atenciones simultáneas que admite. 1 cuando el recurso no lo declara. | `1` |
| `items[].stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
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

## 19. POST /scheduling/resources

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
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
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
  "path": "/scheduling/resources"
}
```

---

## 20. POST /scheduling/resources/{id}/exceptions

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
| `exceptionType` | Sí | `string` | valores: `ABSENCE`, `HOLIDAY`, `EXTRA` | Tipo de excepción | `ABSENCE` |
| `startAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `reason` | No | `string` | longitud máxima 500 | Motivo visible en agenda | `Texto descriptivo de ejemplo` |
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
| 422 | `PRECONDITION_FAILED` | La excepción debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
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

## 21. GET /scheduling/resources/{id}/slots

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

## 22. POST /scheduling/resources/{id}/templates

- **Módulo:** `scheduling`
- **Etiqueta OpenAPI:** `scheduling`
- **Nombre:** Publicar una plantilla de agenda con sus franjas
- **Operation ID:** `SchedulingController_createTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SchedulingController.createTemplate](../../src/modules/scheduling/controllers/scheduling.controller.ts)

### Descripción de negocio

Publicar una plantilla de agenda con sus franjas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /scheduling/resources/{id}/templates` en `SchedulingController_createTemplate`. El controlador delega en `SchedulingCatalogService.createTemplate`. Valida el body como `CreateTemplateDto` y consume `application/json`. El tipo de retorno estático es `Promise<TemplateResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTemplateDto`; los campos opcionales se omiten.

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
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `rules` | Sí | `array<ScheduleRuleDto>` | mínimo 1 elemento(s) | Franjas semanales de la plantilla | `[{"dayOfWeek":1,"startTime":"08:00:00","endTime":"12:00:00","slotMinutes":5,"capacityPerSlot":1}]` |
| `rules[].dayOfWeek` | Sí | `number` | mínimo 0; máximo 6 | 0 = domingo … 6 = sábado | `1` |
| `rules[].startTime` | Sí | `string` | patrón runtime `/^\d{2}:\d{2}(:\d{2})?$/` | Hora de inicio HH:MM:SS | `08:00:00` |
| `rules[].endTime` | Sí | `string` | patrón runtime `/^\d{2}:\d{2}(:\d{2})?$/` | Hora de fin HH:MM:SS | `12:00:00` |
| `rules[].slotMinutes` | No | `number` | mínimo 5 | Duración del slot en minutos | `5` |
| `rules[].capacityPerSlot` | No | `number` | mínimo 1 | Cupos por slot | `1` |
| `slotMinutes` | No | `number` | mínimo 5 | Duración por defecto del slot, en minutos | `30` |
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
      "capacityPerSlot": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Recurso no encontrado | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La franja debe empezar antes de terminar | Excepción explícita en src/modules/scheduling/services/scheduling-catalog.service.ts |
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

## 23. GET /scheduling/slots

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

## 24. POST /scheduling/slots/{id}/holds

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

## 25. POST /scheduling/templates/{id}/generate-slots

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
- Roles admitidos por `@Roles`: `SCHEDULING_ADMIN`.
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
  "skipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `templateId` | Sí | `string` | formato `uuid` | Identificador asociado a template. | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `number` | Sin restricción adicional declarada | Slots creados en esta ejecución | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Slots que ya existían y se conservaron | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
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

## 26. POST /scheduling/waitlist

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

