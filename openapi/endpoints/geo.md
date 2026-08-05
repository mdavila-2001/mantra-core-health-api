<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `geo`

Referencia exhaustiva de 10 operación(es) del módulo `geo`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `geo-geofences`, `geo-tracked-subjects`, `geo-tracking-sessions`, `geo-trips`
- **Controladores:** `GeoGeofencesController`, `GeoTrackedSubjectsController`, `GeoTrackingSessionsController`, `GeoTripsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /geo/geofence-events](#1-post-geo-geofence-events) — Registrar un evento de entrada/salida de geofence
2. [POST /geo/geofences](#2-post-geo-geofences) — Definir y activar un geofence (circle o polygon)
3. [POST /geo/tracked-subjects](#3-post-geo-tracked-subjects) — Alta de sujeto rastreado con consentimiento de ubicación
4. [GET /geo/tracked-subjects/{id}/last-position](#4-get-geo-tracked-subjects-id-last-position) — Consultar la última posición conocida del sujeto
5. [POST /geo/tracked-subjects/{id}/pings](#5-post-geo-tracked-subjects-id-pings) — Ingerir un batch de pings de ubicación de alta frecuencia
6. [POST /geo/tracked-subjects/{id}/revoke-consent](#6-post-geo-tracked-subjects-id-revoke-consent) — Revocar consentimiento de ubicación y pausar el rastreo
7. [POST /geo/tracking-sessions](#7-post-geo-tracking-sessions) — Iniciar una sesión de tracking de un sujeto
8. [POST /geo/tracking-sessions/{id}/close](#8-post-geo-tracking-sessions-id-close) — Cerrar una sesión de tracking
9. [POST /geo/trips](#9-post-geo-trips) — Iniciar un viaje (trip)
10. [POST /geo/trips/{id}/close](#10-post-geo-trips-id-close) — Cerrar un viaje con distancia/duración

---

## 1. POST /geo/geofence-events

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-geofences`
- **Nombre:** Registrar un evento de entrada/salida de geofence
- **Operation ID:** `GeoGeofencesController_recordEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoGeofencesController.recordEvent](../../src/modules/geo/controllers/geo-geofences.controller.ts)

### Descripción de negocio

Registrar un evento de entrada/salida de geofence. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/geofence-events` en `GeoGeofencesController_recordEvent`. El controlador delega en `GeoGeofencesService.recordEvent`. Valida el body como `RecordGeofenceEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<GeofenceEventResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordGeofenceEventDto`; los campos opcionales se omiten.

```http
POST /geo/geofence-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "geofenceId": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "eventType": "ENTER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `geofenceId` | Sí | `string` | formato `uuid` | Geofence cruzado | `00000000-0000-4000-8000-000000000001` |
| `trackedSubjectId` | Sí | `string` | formato `uuid` | Sujeto rastreado que cruzó | `00000000-0000-4000-8000-000000000001` |
| `eventType` | Sí | `string` | valores: `ENTER`, `EXIT` | Tipo de transición | `ENTER` |
| `locationPingId` | No | `string` | formato `uuid` | Ping que originó el evento | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | No | `string` | formato `date-time` | Instante del cruce | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /geo/geofence-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "geofenceId": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "eventType": "ENTER",
  "locationPingId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GeofenceEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GeofenceEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "geofenceId": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "eventType": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `geofenceId` | Sí | `string` | formato `uuid` | Identificador asociado a geofence. | `00000000-0000-4000-8000-000000000001` |
| `trackedSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a tracked subject. | `00000000-0000-4000-8000-000000000001` |
| `eventType` | Sí | `string` | formato `uuid` | Concept id del tipo de evento | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | No | `string` | formato `date-time` | Valor de occurred at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Geofence no encontrado | Excepción explícita en src/modules/geo/services/geo-geofences.service.ts |
| 404 | `NOT_FOUND` | Sujeto rastreado no encontrado | Excepción explícita en src/modules/geo/services/geo-geofences.service.ts |
| 409 | `CONFLICT` | El sujeto ya está en ese estado respecto al geofence | Excepción explícita en src/modules/geo/services/geo-geofences.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El geofence no está activo | Excepción explícita en src/modules/geo/services/geo-geofences.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/geofence-events"
}
```

---

## 2. POST /geo/geofences

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-geofences`
- **Nombre:** Definir y activar un geofence (circle o polygon)
- **Operation ID:** `GeoGeofencesController_define`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoGeofencesController.define](../../src/modules/geo/controllers/geo-geofences.controller.ts)

### Descripción de negocio

Definir y activar un geofence (circle o polygon). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/geofences` en `GeoGeofencesController_define`. El controlador delega en `GeoGeofencesService.define`. Valida el body como `CreateGeofenceDto` y consume `application/json`. El tipo de retorno estático es `Promise<GeofenceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateGeofenceDto`; los campos opcionales se omiten.

```http
POST /geo/geofences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "shapeType": "CIRCLE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario (RLS) | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre único del geofence dentro del tenant | `Nombre de ejemplo` |
| `shapeType` | Sí | `string` | valores: `CIRCLE`, `POLYGON` | Forma del geofence | `CIRCLE` |
| `radiusM` | No | `number` | mayor que 0 | Radio en metros (obligatorio si CIRCLE) | `1` |
| `centerLat` | No | `number` | Sin restricción adicional declarada | Latitud del centro (obligatorio si CIRCLE) | `1` |
| `centerLng` | No | `number` | Sin restricción adicional declarada | Longitud del centro (obligatorio si CIRCLE) | `1` |
| `geometryJson` | No | `object` | Sin restricción adicional declarada | GeoJSON del polígono (obligatorio si POLYGON) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /geo/geofences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "shapeType": "CIRCLE",
  "radiusM": 1,
  "centerLat": 1,
  "centerLng": 1,
  "geometryJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GeofenceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GeofenceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "shapeType": "00000000-0000-4000-8000-000000000001",
  "state": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `shapeType` | Sí | `string` | formato `uuid` | Concept id de la forma | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un geofence con ese nombre en el tenant | Excepción explícita en src/modules/geo/services/geo-geofences.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un geofence circular requiere radiusM, centerLat y centerLng | Excepción explícita en src/modules/geo/services/geo-geofences.service.ts |
| 422 | `PRECONDITION_FAILED` | Un geofence poligonal requiere geometryJson | Excepción explícita en src/modules/geo/services/geo-geofences.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/geofences"
}
```

---

## 3. POST /geo/tracked-subjects

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-tracked-subjects`
- **Nombre:** Alta de sujeto rastreado con consentimiento de ubicación
- **Operation ID:** `GeoTrackedSubjectsController_enroll`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTrackedSubjectsController.enroll](../../src/modules/geo/controllers/geo-tracked-subjects.controller.ts)

### Descripción de negocio

Alta de sujeto rastreado con consentimiento de ubicación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/tracked-subjects` en `GeoTrackedSubjectsController_enroll`. El controlador delega en `GeoTrackedSubjectsService.enroll`. Valida el body como `CreateTrackedSubjectDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackedSubjectResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTrackedSubjectDto`; los campos opcionales se omiten.

```http
POST /geo/tracked-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `subjectId` | Sí | `string` | formato `uuid` | Id del recurso rastreado (ambulancia/persona) | `00000000-0000-4000-8000-000000000001` |
| `subjectType` | No | `string` | valores: `PERSON`, `VEHICLE` | Tipo de sujeto (discriminador polimórfico) | `PERSON` |
| `deviceId` | No | `string` | formato `uuid` | Dispositivo GPS asociado | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario (RLS) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /geo/tracked-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "PERSON",
  "deviceId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackedSubjectResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackedSubjectResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "00000000-0000-4000-8000-000000000001",
  "state": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `subjectId` | Sí | `string` | formato `uuid` | Identificador asociado a subject. | `00000000-0000-4000-8000-000000000001` |
| `subjectType` | Sí | `string` | formato `uuid` | Concept id del tipo de sujeto | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado del sujeto | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El sujeto ya está siendo rastreado | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
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
  "path": "/geo/tracked-subjects"
}
```

---

## 4. GET /geo/tracked-subjects/{id}/last-position

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-tracked-subjects`
- **Nombre:** Consultar la última posición conocida del sujeto
- **Operation ID:** `GeoTrackedSubjectsController_lastPosition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTrackedSubjectsController.lastPosition](../../src/modules/geo/controllers/geo-tracked-subjects.controller.ts)

### Descripción de negocio

Consultar la última posición conocida del sujeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /geo/tracked-subjects/{id}/last-position` en `GeoTrackedSubjectsController_lastPosition`. El controlador delega en `GeoTrackedSubjectsService.lastPosition`. No recibe body. El tipo de retorno estático es `Promise<LastPositionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /geo/tracked-subjects/00000000-0000-4000-8000-000000000001/last-position HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /geo/tracked-subjects/00000000-0000-4000-8000-000000000001/last-position HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LastPositionResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<LastPositionResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LastPositionResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LastPositionResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<LastPositionResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LastPositionResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LastPositionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LastPositionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "pingId": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "latitude": "valor-ejemplo",
  "longitude": "valor-ejemplo",
  "accuracyM": "valor-ejemplo",
  "capturedAt": "2026-07-31T12:00:00.000Z",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pingId` | Sí | `string` | formato `uuid` | Id del ping | `00000000-0000-4000-8000-000000000001` |
| `trackedSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a tracked subject. | `00000000-0000-4000-8000-000000000001` |
| `latitude` | Sí | `string` | Sin restricción adicional declarada | Latitud en grados decimales | `valor-ejemplo` |
| `longitude` | Sí | `string` | Sin restricción adicional declarada | Longitud en grados decimales | `valor-ejemplo` |
| `accuracyM` | No | `string` | Sin restricción adicional declarada | Precisión horizontal (m) | `valor-ejemplo` |
| `capturedAt` | No | `string` | formato `date-time` | Valor de captured at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sujeto rastreado no encontrado | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
| 404 | `NOT_FOUND` | El sujeto no tiene posiciones registradas | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/tracked-subjects/{id}/last-position"
}
```

---

## 5. POST /geo/tracked-subjects/{id}/pings

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-tracked-subjects`
- **Nombre:** Ingerir un batch de pings de ubicación de alta frecuencia
- **Operation ID:** `GeoTrackedSubjectsController_ingestPings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTrackedSubjectsController.ingestPings](../../src/modules/geo/controllers/geo-tracked-subjects.controller.ts)

### Descripción de negocio

Ingerir un batch de pings de ubicación de alta frecuencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/tracked-subjects/{id}/pings` en `GeoTrackedSubjectsController_ingestPings`. El controlador delega en `GeoTrackedSubjectsService.ingestPings`. Valida el body como `IngestPingsDto` y consume `application/json`. El tipo de retorno estático es `Promise<IngestPingsResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IngestPingsDto`; los campos opcionales se omiten.

```http
POST /geo/tracked-subjects/00000000-0000-4000-8000-000000000001/pings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pings": [
    {
      "latitude": -12.0464,
      "longitude": -77.0428
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pings` | Sí | `array<LocationPingDto>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Batch de pings de alta frecuencia | `[{"latitude":-12.0464,"longitude":-77.0428,"accuracyM":1,"altitudeM":1,"speedMps":1,"headingDeg":1,"batteryPct":1,"network":"CELLULAR","deviceId":"00000000-0000-4000-8000-000000000001","capturedAt":"2026-07-31T12:00:00.000Z"}]` |
| `pings[].latitude` | Sí | `number` | mínimo -90; máximo 90 | Latitud en grados decimales | `-12.0464` |
| `pings[].longitude` | Sí | `number` | mínimo -180; máximo 180 | Longitud en grados decimales | `-77.0428` |
| `pings[].accuracyM` | No | `number` | mínimo 0 | Precisión horizontal (m) | `1` |
| `pings[].altitudeM` | No | `number` | Sin restricción adicional declarada | Altitud (m) | `1` |
| `pings[].speedMps` | No | `number` | mínimo 0 | Velocidad (m/s) | `1` |
| `pings[].headingDeg` | No | `number` | Sin restricción adicional declarada | Rumbo (grados) | `1` |
| `pings[].batteryPct` | No | `number` | mínimo 0; máximo 100 | Batería (%) | `1` |
| `pings[].network` | No | `string` | valores: `CELLULAR`, `WIFI` | Red de captura | `CELLULAR` |
| `pings[].deviceId` | No | `string` | formato `uuid` | Dispositivo que capturó el ping | `00000000-0000-4000-8000-000000000001` |
| `pings[].capturedAt` | No | `string` | formato `date-time` | Instante de captura en el dispositivo | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /geo/tracked-subjects/00000000-0000-4000-8000-000000000001/pings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pings": [
    {
      "latitude": -12.0464,
      "longitude": -77.0428,
      "accuracyM": 1,
      "altitudeM": 1,
      "speedMps": 1,
      "headingDeg": 1,
      "batteryPct": 1,
      "network": "CELLULAR",
      "deviceId": "00000000-0000-4000-8000-000000000001",
      "capturedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IngestPingsResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IngestPingsResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "recorded": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `recorded` | Sí | `number` | Sin restricción adicional declarada | Nº de pings registrados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sujeto rastreado no encontrado | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El sujeto no está activo para rastreo | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay una sesión de tracking abierta para el sujeto | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/tracked-subjects/{id}/pings"
}
```

---

## 6. POST /geo/tracked-subjects/{id}/revoke-consent

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-tracked-subjects`
- **Nombre:** Revocar consentimiento de ubicación y pausar el rastreo
- **Operation ID:** `GeoTrackedSubjectsController_revokeConsent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTrackedSubjectsController.revokeConsent](../../src/modules/geo/controllers/geo-tracked-subjects.controller.ts)

### Descripción de negocio

Revocar consentimiento de ubicación y pausar el rastreo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/tracked-subjects/{id}/revoke-consent` en `GeoTrackedSubjectsController_revokeConsent`. El controlador delega en `GeoTrackedSubjectsService.revokeConsent`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /geo/tracked-subjects/00000000-0000-4000-8000-000000000001/revoke-consent HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /geo/tracked-subjects/00000000-0000-4000-8000-000000000001/revoke-consent HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sujeto rastreado no encontrado | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
| 422 | `PRECONDITION_FAILED` | El rastreo del sujeto ya está suspendido | Excepción explícita en src/modules/geo/services/geo-tracked-subjects.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/tracked-subjects/{id}/revoke-consent"
}
```

---

## 7. POST /geo/tracking-sessions

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-tracking-sessions`
- **Nombre:** Iniciar una sesión de tracking de un sujeto
- **Operation ID:** `GeoTrackingSessionsController_start`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTrackingSessionsController.start](../../src/modules/geo/controllers/geo-tracking-sessions.controller.ts)

### Descripción de negocio

Iniciar una sesión de tracking de un sujeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/tracking-sessions` en `GeoTrackingSessionsController_start`. El controlador delega en `GeoTrackingSessionsService.start`. Valida el body como `StartTrackingSessionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackingSessionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartTrackingSessionDto`; los campos opcionales se omiten.

```http
POST /geo/tracking-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `trackedSubjectId` | Sí | `string` | formato `uuid` | Sujeto rastreado a seguir | `00000000-0000-4000-8000-000000000001` |
| `purposeConceptId` | No | `string` | formato `uuid` | Concept id del propósito de la sesión | `00000000-0000-4000-8000-000000000001` |
| `relatedResourceType` | No | `string` | longitud máxima 100 | Tipo de recurso relacionado (p. ej. encounter/dispatch) | `valor-ejemplo` |
| `relatedResourceId` | No | `string` | formato `uuid` | Id del recurso relacionado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /geo/tracking-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "relatedResourceType": "valor-ejemplo",
  "relatedResourceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingSessionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackedSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a tracked subject. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado de la sesión | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | No | `string` | formato `date-time` | Valor de started at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | No | `string` | formato `date-time` | Valor de ended at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sujeto rastreado no encontrado | Excepción explícita en src/modules/geo/services/geo-tracking-sessions.service.ts |
| 409 | `CONFLICT` | El sujeto ya tiene una sesión de tracking abierta | Excepción explícita en src/modules/geo/services/geo-tracking-sessions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El sujeto no está activo para rastreo | Excepción explícita en src/modules/geo/services/geo-tracking-sessions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/tracking-sessions"
}
```

---

## 8. POST /geo/tracking-sessions/{id}/close

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-tracking-sessions`
- **Nombre:** Cerrar una sesión de tracking
- **Operation ID:** `GeoTrackingSessionsController_close`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTrackingSessionsController.close](../../src/modules/geo/controllers/geo-tracking-sessions.controller.ts)

### Descripción de negocio

Cerrar una sesión de tracking. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/tracking-sessions/{id}/close` en `GeoTrackingSessionsController_close`. El controlador delega en `GeoTrackingSessionsService.close`. No recibe body. El tipo de retorno estático es `Promise<TrackingSessionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /geo/tracking-sessions/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /geo/tracking-sessions/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingSessionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingSessionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackedSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a tracked subject. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado de la sesión | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | No | `string` | formato `date-time` | Valor de started at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | No | `string` | formato `date-time` | Valor de ended at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión de tracking no encontrada | Excepción explícita en src/modules/geo/services/geo-tracking-sessions.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no está abierta | Excepción explícita en src/modules/geo/services/geo-tracking-sessions.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión tiene viajes en progreso | Excepción explícita en src/modules/geo/services/geo-tracking-sessions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/tracking-sessions/{id}/close"
}
```

---

## 9. POST /geo/trips

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-trips`
- **Nombre:** Iniciar un viaje (trip)
- **Operation ID:** `GeoTripsController_start`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTripsController.start](../../src/modules/geo/controllers/geo-trips.controller.ts)

### Descripción de negocio

Iniciar un viaje (trip). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/trips` en `GeoTripsController_start`. El controlador delega en `GeoTripsService.start`. Valida el body como `StartTripDto` y consume `application/json`. El tipo de retorno estático es `Promise<TripResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartTripDto`; los campos opcionales se omiten.

```http
POST /geo/trips HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingSessionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `trackingSessionId` | Sí | `string` | formato `uuid` | Sesión de tracking OPEN a la que pertenece el viaje | `00000000-0000-4000-8000-000000000001` |
| `originAddressId` | No | `string` | formato `uuid` | Dirección de origen | `00000000-0000-4000-8000-000000000001` |
| `destinationAddressId` | No | `string` | formato `uuid` | Dirección de destino | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /geo/trips HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingSessionId": "00000000-0000-4000-8000-000000000001",
  "originAddressId": "00000000-0000-4000-8000-000000000001",
  "destinationAddressId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TripResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TripResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackingSessionId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "distanceM": "valor-ejemplo",
  "durationS": 1,
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackingSessionId` | No | `string` | formato `uuid` | Identificador asociado a tracking session. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del viaje | `00000000-0000-4000-8000-000000000001` |
| `distanceM` | No | `string` | Sin restricción adicional declarada | Distancia recorrida (m) | `valor-ejemplo` |
| `durationS` | No | `number` | Sin restricción adicional declarada | Duración (s) | `1` |
| `startedAt` | No | `string` | formato `date-time` | Valor de started at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | No | `string` | formato `date-time` | Valor de ended at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión de tracking no encontrada | Excepción explícita en src/modules/geo/services/geo-trips.service.ts |
| 409 | `CONFLICT` | La sesión ya tiene un viaje en progreso | Excepción explícita en src/modules/geo/services/geo-trips.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión de tracking no está abierta | Excepción explícita en src/modules/geo/services/geo-trips.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/trips"
}
```

---

## 10. POST /geo/trips/{id}/close

- **Módulo:** `geo`
- **Etiqueta OpenAPI:** `geo-trips`
- **Nombre:** Cerrar un viaje con distancia/duración
- **Operation ID:** `GeoTripsController_close`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GeoTripsController.close](../../src/modules/geo/controllers/geo-trips.controller.ts)

### Descripción de negocio

Cerrar un viaje con distancia/duración. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /geo/trips/{id}/close` en `GeoTripsController_close`. El controlador delega en `GeoTripsService.close`. Valida el body como `CloseTripDto` y consume `application/json`. El tipo de retorno estático es `Promise<TripResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseTripDto`; los campos opcionales se omiten.

```http
POST /geo/trips/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `distanceM` | No | `number` | mínimo 0 | Distancia recorrida (m) | `1` |
| `durationS` | No | `number` | mínimo 0 | Duración del viaje (s) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /geo/trips/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "distanceM": 1,
  "durationS": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TripResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TripResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackingSessionId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "distanceM": "valor-ejemplo",
  "durationS": 1,
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackingSessionId` | No | `string` | formato `uuid` | Identificador asociado a tracking session. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del viaje | `00000000-0000-4000-8000-000000000001` |
| `distanceM` | No | `string` | Sin restricción adicional declarada | Distancia recorrida (m) | `valor-ejemplo` |
| `durationS` | No | `number` | Sin restricción adicional declarada | Duración (s) | `1` |
| `startedAt` | No | `string` | formato `date-time` | Valor de started at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | No | `string` | formato `date-time` | Valor de ended at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Viaje no encontrado | Excepción explícita en src/modules/geo/services/geo-trips.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El viaje no está en progreso | Excepción explícita en src/modules/geo/services/geo-trips.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/geo/trips/{id}/close"
}
```

---

