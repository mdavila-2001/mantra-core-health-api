<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `geo`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 10 (10 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 7 · BAJO 3
- **Tablas distintas que tocan:** 6
- **Respuestas de error y detalle contractual:** `openapi/endpoints/geo.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/geo/geofence-events` | Registrar un evento de entrada/salida de geofence | MEDIO | 4 | SECURITY_ADMIN |
| 2 | POST | `/geo/geofences` | Definir y activar un geofence (circle o polygon) | MEDIO | 2 | SECURITY_ADMIN |
| 3 | POST | `/geo/tracked-subjects` | Alta de sujeto rastreado con consentimiento de ubicación | MEDIO | 2 | SECURITY_ADMIN |
| 4 | GET | `/geo/tracked-subjects/{id}/last-position` | Consultar la última posición conocida del sujeto | BAJO | 2 | SECURITY_ADMIN |
| 5 | POST | `/geo/tracked-subjects/{id}/pings` | Ingerir un batch de pings de ubicación de alta frecuencia | MEDIO | 3 | SECURITY_ADMIN |
| 6 | POST | `/geo/tracked-subjects/{id}/revoke-consent` | Revocar consentimiento de ubicación y pausar el rastreo | MEDIO | 3 | SECURITY_ADMIN |
| 7 | POST | `/geo/tracking-sessions` | Iniciar una sesión de tracking de un sujeto | MEDIO | 3 | SECURITY_ADMIN |
| 8 | POST | `/geo/tracking-sessions/{id}/close` | Cerrar una sesión de tracking | BAJO | 3 | SECURITY_ADMIN |
| 9 | POST | `/geo/trips` | Iniciar un viaje (trip) | MEDIO | 4 | SECURITY_ADMIN |
| 10 | POST | `/geo/trips/{id}/close` | Cerrar un viaje con distancia/duración | BAJO | 3 | SECURITY_ADMIN |

---

## 1. POST /geo/geofence-events

- **Origen:** CONTRATO
- **Nombre:** Registrar un evento de entrada/salida de geofence
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoGeofencesController.recordEvent` — `src/modules/geo/controllers/geo-geofences.controller.ts:50`

### Qué es y para qué sirve (negocio)

Registrar un evento de entrada/salida de geofence. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/geofence-events` la atiende `GeoGeofencesController.recordEvent` (src/modules/geo/controllers/geo-geofences.controller.ts:50). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RecordGeofenceEventDto` (5 campos, 3 obligatorios). Delega en `GeoGeofencesService.recordEvent`. Crea filas en geo.geofence_events. Lee geo.geofence_events, geo.geofences, geo.tracked_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-geofences.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.geofence_events` | ESCRIBE | CREA | DIRECTA | GeoGeofencesController.recordEvent → GeoGeofencesService.recordEvent → GeofenceEventsRepository.record | `src/modules/geo/repositories/geofence-events.repository.ts:41` |
| `geo.geofence_events` | LEE | LEE | DIRECTA | GeoGeofencesController.recordEvent → GeoGeofencesService.recordEvent → GeofenceEventsRepository.findLast | `src/modules/geo/repositories/geofence-events.repository.ts:65` |
| `geo.geofences` | LEE | LEE | DIRECTA | GeoGeofencesController.recordEvent → GeoGeofencesService.recordEvent → GeofencesRepository.findById | `src/modules/geo/repositories/geofences.repository.ts:53` |
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoGeofencesController.recordEvent → GeoGeofencesService.recordEvent → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |

### Cuerpo — DTO `RecordGeofenceEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `geofenceId` | `string` | Sí | formato uuid | `@IsUUID()` | Geofence cruzado | `src/modules/geo/dto/record-geofence-event.dto.ts:15` |
| `trackedSubjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Sujeto rastreado que cruzó | `src/modules/geo/dto/record-geofence-event.dto.ts:22` |
| `eventType` | `string` | Sí | valores: ENTER, EXIT | `@IsIn(['ENTER', 'EXIT'])` | Tipo de transición | `src/modules/geo/dto/record-geofence-event.dto.ts:29` |
| `locationPingId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ping que originó el evento | `src/modules/geo/dto/record-geofence-event.dto.ts:40` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` | Instante del cruce | `src/modules/geo/dto/record-geofence-event.dto.ts:52` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "geofenceId": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "eventType": "ENTER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "geofenceId": "00000000-0000-4000-8000-000000000001",
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "eventType": "ENTER",
  "locationPingId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<GeofenceEventResponseDto>` · DTO `GeofenceEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/geo/dto/geofence-event-response.dto.ts:9` |
| `geofenceId` | `string` | Sí | formato uuid | — | Identificador asociado a geofence. | `src/modules/geo/dto/geofence-event-response.dto.ts:15` |
| `trackedSubjectId` | `string` | Sí | formato uuid | — | Identificador asociado a tracked subject. | `src/modules/geo/dto/geofence-event-response.dto.ts:21` |
| `eventType` | `string` | Sí | formato uuid | — | Concept id del tipo de evento | `src/modules/geo/dto/geofence-event-response.dto.ts:27` |
| `occurredAt` | `string` | No | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/geo/dto/geofence-event-response.dto.ts:33` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/geo/dto/geofence-event-response.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El sujeto ya está en ese estado respecto al geofence |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El geofence no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-geofences.controller.spec.ts:42` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoGeofencesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /geo/geofences

- **Origen:** CONTRATO
- **Nombre:** Definir y activar un geofence (circle o polygon)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoGeofencesController.define` — `src/modules/geo/controllers/geo-geofences.controller.ts:33`

### Qué es y para qué sirve (negocio)

Definir y activar un geofence (circle o polygon). Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/geofences` la atiende `GeoGeofencesController.define` (src/modules/geo/controllers/geo-geofences.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateGeofenceDto` (7 campos, 2 obligatorios). Delega en `GeoGeofencesService.define`. Crea filas en geo.geofences. Lee geo.geofences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-geofences.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.geofences` | ESCRIBE | CREA | DIRECTA | GeoGeofencesController.define → GeoGeofencesService.define → GeofencesRepository.create | `src/modules/geo/repositories/geofences.repository.ts:67` |
| `geo.geofences` | LEE | LEE | DIRECTA | GeoGeofencesController.define → GeoGeofencesService.define → GeofencesRepository.findByTenantAndName | `src/modules/geo/repositories/geofences.repository.ts:62` |

### Cuerpo — DTO `CreateGeofenceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obsoleto: el tenant se deriva de la sesión (X-Tenant-Id). Si llega, debe coincidir con él; el servidor nunca lo toma como fuente de verdad. | `src/modules/geo/dto/create-geofence.dto.ts:36` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre único del geofence dentro del tenant | `src/modules/geo/dto/create-geofence.dto.ts:48` |
| `shapeType` | `string` | Sí | valores: CIRCLE, POLYGON | `@IsIn(['CIRCLE', 'POLYGON'])` | Forma del geofence | `src/modules/geo/dto/create-geofence.dto.ts:58` |
| `radiusM` | `number` | No | mayor que 0 | `@IsOptional()` `@IsNumber()` `@IsPositive()` | Radio en metros (obligatorio si CIRCLE) | `src/modules/geo/dto/create-geofence.dto.ts:69` |
| `centerLat` | `number` | No | — | `@IsOptional()` `@IsLatitude()` | Latitud del centro (obligatorio si CIRCLE) | `src/modules/geo/dto/create-geofence.dto.ts:79` |
| `centerLng` | `number` | No | — | `@IsOptional()` `@IsLongitude()` | Longitud del centro (obligatorio si CIRCLE) | `src/modules/geo/dto/create-geofence.dto.ts:89` |
| `geometryJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | GeoJSON del polígono (obligatorio si POLYGON) | `src/modules/geo/dto/create-geofence.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "shapeType": "CIRCLE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<GeofenceResponseDto>` · DTO `GeofenceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/geo/dto/geofence-response.dto.ts:9` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/geo/dto/geofence-response.dto.ts:15` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/geo/dto/geofence-response.dto.ts:21` |
| `shapeType` | `string` | Sí | formato uuid | — | Concept id de la forma | `src/modules/geo/dto/geofence-response.dto.ts:27` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/geo/dto/geofence-response.dto.ts:33` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/geo/dto/geofence-response.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un geofence con ese nombre en el tenant |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un geofence circular requiere radiusM, centerLat y centerLng; PreconditionFailedException: Un geofence poligonal requiere geometryJson |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-geofences.controller.spec.ts:29` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoGeofencesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /geo/tracked-subjects

- **Origen:** CONTRATO
- **Nombre:** Alta de sujeto rastreado con consentimiento de ubicación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTrackedSubjectsController.enroll` — `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:44`

### Qué es y para qué sirve (negocio)

Alta de sujeto rastreado con consentimiento de ubicación. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/tracked-subjects` la atiende `GeoTrackedSubjectsController.enroll` (src/modules/geo/controllers/geo-tracked-subjects.controller.ts:44). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateTrackedSubjectDto` (4 campos, 1 obligatorio). Delega en `GeoTrackedSubjectsService.enroll`. Crea filas en geo.tracked_subjects. Lee geo.tracked_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.tracked_subjects` | ESCRIBE | CREA | DIRECTA | GeoTrackedSubjectsController.enroll → GeoTrackedSubjectsService.enroll → TrackedSubjectsRepository.create | `src/modules/geo/repositories/tracked-subjects.repository.ts:68` |
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTrackedSubjectsController.enroll → GeoTrackedSubjectsService.enroll → TrackedSubjectsRepository.findActiveBySubject | `src/modules/geo/repositories/tracked-subjects.repository.ts:58` |

### Cuerpo — DTO `CreateTrackedSubjectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `subjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del recurso rastreado (ambulancia/persona) | `src/modules/geo/dto/create-tracked-subject.dto.ts:17` |
| `subjectType` | `string` | No | valores: PERSON, VEHICLE | `@IsOptional()` `@IsIn(['PERSON', 'VEHICLE'])` | Tipo de sujeto (discriminador polimórfico) | `src/modules/geo/dto/create-tracked-subject.dto.ts:29` |
| `deviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dispositivo GPS asociado | `src/modules/geo/dto/create-tracked-subject.dto.ts:40` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obsoleto: el tenant se deriva de la sesión (X-Tenant-Id). Si llega, debe coincidir con él; el servidor nunca lo toma como fuente de verdad. | `src/modules/geo/dto/create-tracked-subject.dto.ts:53` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "subjectId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "PERSON",
  "deviceId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TrackedSubjectResponseDto>` · DTO `TrackedSubjectResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/geo/dto/tracked-subject-response.dto.ts:9` |
| `subjectId` | `string` | Sí | formato uuid | — | Identificador asociado a subject. | `src/modules/geo/dto/tracked-subject-response.dto.ts:15` |
| `subjectType` | `string` | Sí | formato uuid | — | Concept id del tipo de sujeto | `src/modules/geo/dto/tracked-subject-response.dto.ts:21` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado del sujeto | `src/modules/geo/dto/tracked-subject-response.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/geo/dto/tracked-subject-response.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El sujeto ya está siendo rastreado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-tracked-subjects.controller.spec.ts:34` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTrackedSubjectsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /geo/tracked-subjects/{id}/last-position

- **Origen:** CONTRATO
- **Nombre:** Consultar la última posición conocida del sujeto
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTrackedSubjectsController.lastPosition` — `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:83`

### Qué es y para qué sirve (negocio)

Consultar la última posición conocida del sujeto. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /geo/tracked-subjects/{id}/last-position` la atiende `GeoTrackedSubjectsController.lastPosition` (src/modules/geo/controllers/geo-tracked-subjects.controller.ts:83). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `GeoTrackedSubjectsService.lastPosition`. Lee geo.location_pings, geo.tracked_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:83` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.location_pings` | LEE | LEE | DIRECTA | GeoTrackedSubjectsController.lastPosition → GeoTrackedSubjectsService.lastPosition → LocationPingsRepository.findLastBySubject | `src/modules/geo/repositories/location-pings.repository.ts:94` |
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTrackedSubjectsController.lastPosition → GeoTrackedSubjectsService.lastPosition → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LastPositionResponseDto>` · DTO `LastPositionResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pingId` | `string` | Sí | formato uuid | — | Id del ping | `src/modules/geo/dto/last-position-response.dto.ts:9` |
| `trackedSubjectId` | `string` | Sí | formato uuid | — | Identificador asociado a tracked subject. | `src/modules/geo/dto/last-position-response.dto.ts:15` |
| `latitude` | `string` | Sí | — | — | Latitud en grados decimales | `src/modules/geo/dto/last-position-response.dto.ts:21` |
| `longitude` | `string` | Sí | — | — | Longitud en grados decimales | `src/modules/geo/dto/last-position-response.dto.ts:27` |
| `accuracyM` | `string` | No | — | — | Precisión horizontal (m) | `src/modules/geo/dto/last-position-response.dto.ts:33` |
| `capturedAt` | `string` | No | formato date-time | — | Valor de captured at mantenido por la instancia. | `src/modules/geo/dto/last-position-response.dto.ts:39` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/geo/dto/last-position-response.dto.ts:45` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El sujeto no tiene posiciones registradas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-tracked-subjects.controller.spec.ts:49` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTrackedSubjectsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /geo/tracked-subjects/{id}/pings

- **Origen:** CONTRATO
- **Nombre:** Ingerir un batch de pings de ubicación de alta frecuencia
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTrackedSubjectsController.ingestPings` — `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:63`

### Qué es y para qué sirve (negocio)

Ingerir un batch de pings de ubicación de alta frecuencia. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/tracked-subjects/{id}/pings` la atiende `GeoTrackedSubjectsController.ingestPings` (src/modules/geo/controllers/geo-tracked-subjects.controller.ts:63). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IngestPingsDto` (11 campos, 3 obligatorios). Delega en `GeoTrackedSubjectsService.ingestPings`. Crea filas en geo.location_pings. Lee geo.tracked_subjects, geo.tracking_sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:63` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.location_pings` | ESCRIBE | CREA | DIRECTA | GeoTrackedSubjectsController.ingestPings → GeoTrackedSubjectsService.ingestPings → LocationPingsRepository.record | `src/modules/geo/repositories/location-pings.repository.ts:65` |
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTrackedSubjectsController.ingestPings → GeoTrackedSubjectsService.ingestPings → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |
| `geo.tracking_sessions` | LEE | LEE | DIRECTA | GeoTrackedSubjectsController.ingestPings → GeoTrackedSubjectsService.ingestPings → TrackingSessionsRepository.findOpenBySubject | `src/modules/geo/repositories/tracking-sessions.repository.ts:57` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IngestPingsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pings` | `array<GeoLocationPingDto>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(1000)` `@ValidateNested({ each: true })` `@Type(() => LocationPingDto)` | Batch de pings de alta frecuencia | `src/modules/geo/dto/ingest-pings.dto.ts:135` |
| `pings[].latitude` | `number` | Sí | — | — | Latitud en grados decimales | sin fuente |
| `pings[].longitude` | `number` | Sí | — | — | Longitud en grados decimales | sin fuente |
| `pings[].accuracyM` | `number` | No | — | — | Precisión horizontal (m) | sin fuente |
| `pings[].altitudeM` | `number` | No | — | — | Altitud (m) | sin fuente |
| `pings[].speedMps` | `number` | No | — | — | Velocidad (m/s) | sin fuente |
| `pings[].headingDeg` | `number` | No | — | — | Rumbo (grados) | sin fuente |
| `pings[].batteryPct` | `number` | No | mínimo 0; máximo 100 | — | Batería (%) | sin fuente |
| `pings[].network` | `string` | No | valores: CELLULAR, WIFI | — | Red de captura | sin fuente |
| `pings[].deviceId` | `string` | No | formato uuid | — | Dispositivo que capturó el ping | sin fuente |
| `pings[].capturedAt` | `string` | No | formato date-time | — | Instante de captura en el dispositivo | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pings": [
    {
      "latitude": -12.0464,
      "longitude": -77.0428
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IngestPingsResultDto>` · DTO `IngestPingsResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recorded` | `number` | Sí | — | — | Nº de pings registrados | `src/modules/geo/dto/ingest-pings.dto.ts:144` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sujeto no está activo para rastreo; PreconditionFailedException: No hay una sesión de tracking abierta para el sujeto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-tracked-subjects.controller.spec.ts:43` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTrackedSubjectsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /geo/tracked-subjects/{id}/revoke-consent

- **Origen:** CONTRATO
- **Nombre:** Revocar consentimiento de ubicación y pausar el rastreo
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTrackedSubjectsController.revokeConsent` — `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:93`

### Qué es y para qué sirve (negocio)

Revocar consentimiento de ubicación y pausar el rastreo. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/tracked-subjects/{id}/revoke-consent` la atiende `GeoTrackedSubjectsController.revokeConsent` (src/modules/geo/controllers/geo-tracked-subjects.controller.ts:93). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `GeoTrackedSubjectsService.revokeConsent`. Actualiza geo.tracking_sessions. Lee geo.tracked_subjects, geo.tracking_sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/geo/controllers/geo-tracked-subjects.controller.ts:93` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTrackedSubjectsController.revokeConsent → GeoTrackedSubjectsService.revokeConsent → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |
| `geo.tracking_sessions` | ESCRIBE | ACTUALIZA | POR_TIPO | GeoTrackedSubjectsController.revokeConsent → GeoTrackedSubjectsService.revokeConsent | `src/modules/geo/services/geo-tracked-subjects.service.ts:266` |
| `geo.tracking_sessions` | LEE | LEE | DIRECTA | GeoTrackedSubjectsController.revokeConsent → GeoTrackedSubjectsService.revokeConsent → TrackingSessionsRepository.findAllOpenBySubject | `src/modules/geo/repositories/tracking-sessions.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/geo/dto/operation-result.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rastreo del sujeto ya está suspendido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-tracked-subjects.controller.spec.ts:55` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTrackedSubjectsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /geo/tracking-sessions

- **Origen:** CONTRATO
- **Nombre:** Iniciar una sesión de tracking de un sujeto
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTrackingSessionsController.start` — `src/modules/geo/controllers/geo-tracking-sessions.controller.ts:35`

### Qué es y para qué sirve (negocio)

Iniciar una sesión de tracking de un sujeto. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/tracking-sessions` la atiende `GeoTrackingSessionsController.start` (src/modules/geo/controllers/geo-tracking-sessions.controller.ts:35). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `StartTrackingSessionDto` (4 campos, 1 obligatorio). Delega en `GeoTrackingSessionsService.start`. Crea filas en geo.tracking_sessions. Lee geo.tracked_subjects, geo.tracking_sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-tracking-sessions.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTrackingSessionsController.start → GeoTrackingSessionsService.start → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |
| `geo.tracking_sessions` | ESCRIBE | CREA | DIRECTA | GeoTrackingSessionsController.start → GeoTrackingSessionsService.start → TrackingSessionsRepository.create | `src/modules/geo/repositories/tracking-sessions.repository.ts:77` |
| `geo.tracking_sessions` | LEE | LEE | DIRECTA | GeoTrackingSessionsController.start → GeoTrackingSessionsService.start → TrackingSessionsRepository.findOpenBySubject | `src/modules/geo/repositories/tracking-sessions.repository.ts:57` |

### Cuerpo — DTO `StartTrackingSessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `trackedSubjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Sujeto rastreado a seguir | `src/modules/geo/dto/start-tracking-session.dto.ts:11` |
| `purposeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del propósito de la sesión | `src/modules/geo/dto/start-tracking-session.dto.ts:22` |
| `relatedResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de recurso relacionado (p. ej. encounter/dispatch) | `src/modules/geo/dto/start-tracking-session.dto.ts:33` |
| `relatedResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso relacionado | `src/modules/geo/dto/start-tracking-session.dto.ts:44` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "trackedSubjectId": "00000000-0000-4000-8000-000000000001",
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "relatedResourceType": "valor-ejemplo",
  "relatedResourceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TrackingSessionResponseDto>` · DTO `TrackingSessionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/geo/dto/tracking-session-response.dto.ts:9` |
| `trackedSubjectId` | `string` | Sí | formato uuid | — | Identificador asociado a tracked subject. | `src/modules/geo/dto/tracking-session-response.dto.ts:15` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado de la sesión | `src/modules/geo/dto/tracking-session-response.dto.ts:24` |
| `startedAt` | `string` | No | formato date-time | — | Valor de started at mantenido por la instancia. | `src/modules/geo/dto/tracking-session-response.dto.ts:30` |
| `endedAt` | `string` | No | formato date-time | — | Valor de ended at mantenido por la instancia. | `src/modules/geo/dto/tracking-session-response.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El sujeto ya tiene una sesión de tracking abierta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sujeto no está activo para rastreo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-tracking-sessions.controller.spec.ts:29` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTrackingSessionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /geo/tracking-sessions/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar una sesión de tracking
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTrackingSessionsController.close` — `src/modules/geo/controllers/geo-tracking-sessions.controller.ts:52`

### Qué es y para qué sirve (negocio)

Cerrar una sesión de tracking. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/tracking-sessions/{id}/close` la atiende `GeoTrackingSessionsController.close` (src/modules/geo/controllers/geo-tracking-sessions.controller.ts:52). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `GeoTrackingSessionsService.close`. Lee geo.tracked_subjects, geo.tracking_sessions, geo.trips.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-tracking-sessions.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/geo/controllers/geo-tracking-sessions.controller.ts:52` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTrackingSessionsController.close → GeoTrackingSessionsService.close → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |
| `geo.tracking_sessions` | LEE | LEE | DIRECTA | GeoTrackingSessionsController.close → GeoTrackingSessionsService.close → TrackingSessionsRepository.findById | `src/modules/geo/repositories/tracking-sessions.repository.ts:46` |
| `geo.trips` | LEE | LEE | DIRECTA | GeoTrackingSessionsController.close → GeoTrackingSessionsService.close → TripsRepository.countBySessionAndStatus | `src/modules/geo/repositories/trips.repository.ts:64` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TrackingSessionResponseDto>` · DTO `TrackingSessionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/geo/dto/tracking-session-response.dto.ts:9` |
| `trackedSubjectId` | `string` | Sí | formato uuid | — | Identificador asociado a tracked subject. | `src/modules/geo/dto/tracking-session-response.dto.ts:15` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado de la sesión | `src/modules/geo/dto/tracking-session-response.dto.ts:24` |
| `startedAt` | `string` | No | formato date-time | — | Valor de started at mantenido por la instancia. | `src/modules/geo/dto/tracking-session-response.dto.ts:30` |
| `endedAt` | `string` | No | formato date-time | — | Valor de ended at mantenido por la instancia. | `src/modules/geo/dto/tracking-session-response.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no está abierta; PreconditionFailedException: La sesión tiene viajes en progreso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-tracking-sessions.controller.spec.ts:37` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTrackingSessionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /geo/trips

- **Origen:** CONTRATO
- **Nombre:** Iniciar un viaje (trip)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTripsController.start` — `src/modules/geo/controllers/geo-trips.controller.ts:35`

### Qué es y para qué sirve (negocio)

Iniciar un viaje (trip). Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/trips` la atiende `GeoTripsController.start` (src/modules/geo/controllers/geo-trips.controller.ts:35). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `StartTripDto` (3 campos, 1 obligatorio). Delega en `GeoTripsService.start`. Crea filas en geo.trips. Lee geo.tracked_subjects, geo.tracking_sessions, geo.trips.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-trips.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTripsController.start → GeoTripsService.start → GeoTripsService.loadSessionInTenant → GeoTripsService.sessionTenant → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |
| `geo.tracking_sessions` | LEE | LEE | DIRECTA | GeoTripsController.start → GeoTripsService.start → GeoTripsService.loadSessionInTenant → TrackingSessionsRepository.findById | `src/modules/geo/repositories/tracking-sessions.repository.ts:46` |
| `geo.trips` | ESCRIBE | CREA | DIRECTA | GeoTripsController.start → GeoTripsService.start → TripsRepository.create | `src/modules/geo/repositories/trips.repository.ts:69` |
| `geo.trips` | LEE | LEE | DIRECTA | GeoTripsController.start → GeoTripsService.start → TripsRepository.findInProgressBySession | `src/modules/geo/repositories/trips.repository.ts:52` |

### Cuerpo — DTO `StartTripDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `trackingSessionId` | `string` | Sí | formato uuid | `@IsUUID()` | Sesión de tracking OPEN a la que pertenece el viaje | `src/modules/geo/dto/start-trip.dto.ts:14` |
| `originAddressId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dirección de origen | `src/modules/geo/dto/start-trip.dto.ts:22` |
| `destinationAddressId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dirección de destino | `src/modules/geo/dto/start-trip.dto.ts:30` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "trackingSessionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "trackingSessionId": "00000000-0000-4000-8000-000000000001",
  "originAddressId": "00000000-0000-4000-8000-000000000001",
  "destinationAddressId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TripResponseDto>` · DTO `TripResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/geo/dto/trip-response.dto.ts:9` |
| `trackingSessionId` | `string` | No | formato uuid | — | Identificador asociado a tracking session. | `src/modules/geo/dto/trip-response.dto.ts:15` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del viaje | `src/modules/geo/dto/trip-response.dto.ts:24` |
| `distanceM` | `string` | No | — | — | Distancia recorrida (m) | `src/modules/geo/dto/trip-response.dto.ts:30` |
| `durationS` | `number` | No | — | — | Duración (s) | `src/modules/geo/dto/trip-response.dto.ts:36` |
| `startedAt` | `string` | No | formato date-time | — | Valor de started at mantenido por la instancia. | `src/modules/geo/dto/trip-response.dto.ts:42` |
| `endedAt` | `string` | No | formato date-time | — | Valor de ended at mantenido por la instancia. | `src/modules/geo/dto/trip-response.dto.ts:48` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La sesión ya tiene un viaje en progreso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión de tracking no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-trips.controller.spec.ts:29` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTripsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /geo/trips/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar un viaje con distancia/duración
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GeoTripsController.close` — `src/modules/geo/controllers/geo-trips.controller.ts:52`

### Qué es y para qué sirve (negocio)

Cerrar un viaje con distancia/duración. Dentro del módulo (descripción del modelo, en inglés): «Real-time location and mobile tracking, primarily for ambulances and field staff: position telemetry, tracking sessions, virtual zones (geofences) and trips.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_13_geo.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /geo/trips/{id}/close` la atiende `GeoTripsController.close` (src/modules/geo/controllers/geo-trips.controller.ts:52). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CloseTripDto` (2 campos, 0 obligatorios). Delega en `GeoTripsService.close`. Lee geo.tracked_subjects, geo.tracking_sessions, geo.trips.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/geo/controllers/geo-trips.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/geo/controllers/geo-trips.controller.ts:52` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `geo.tracked_subjects` | LEE | LEE | DIRECTA | GeoTripsController.close → GeoTripsService.close → GeoTripsService.sessionTenant → TrackedSubjectsRepository.findById | `src/modules/geo/repositories/tracked-subjects.repository.ts:44` |
| `geo.tracking_sessions` | LEE | LEE | DIRECTA | GeoTripsController.close → GeoTripsService.close → TrackingSessionsRepository.findById | `src/modules/geo/repositories/tracking-sessions.repository.ts:46` |
| `geo.trips` | LEE | LEE | DIRECTA | GeoTripsController.close → GeoTripsService.close → TripsRepository.findById | `src/modules/geo/repositories/trips.repository.ts:41` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseTripDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `distanceM` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Distancia recorrida (m) | `src/modules/geo/dto/close-trip.dto.ts:17` |
| `durationS` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Duración del viaje (s) | `src/modules/geo/dto/close-trip.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "distanceM": 1,
  "durationS": 1
}
```

</details>

### Respuesta — `Promise<TripResponseDto>` · DTO `TripResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/geo/dto/trip-response.dto.ts:9` |
| `trackingSessionId` | `string` | No | formato uuid | — | Identificador asociado a tracking session. | `src/modules/geo/dto/trip-response.dto.ts:15` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del viaje | `src/modules/geo/dto/trip-response.dto.ts:24` |
| `distanceM` | `string` | No | — | — | Distancia recorrida (m) | `src/modules/geo/dto/trip-response.dto.ts:30` |
| `durationS` | `number` | No | — | — | Duración (s) | `src/modules/geo/dto/trip-response.dto.ts:36` |
| `startedAt` | `string` | No | formato date-time | — | Valor de started at mantenido por la instancia. | `src/modules/geo/dto/trip-response.dto.ts:42` |
| `endedAt` | `string` | No | formato date-time | — | Valor de ended at mantenido por la instancia. | `src/modules/geo/dto/trip-response.dto.ts:48` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El viaje no está en progreso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/geo.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/geo/controllers/geo-trips.controller.spec.ts:38` |

### Flujos

- Módulo Geo (13) — Geolocation and Mobile Tracking — etapa `ctrl:GeoTripsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

