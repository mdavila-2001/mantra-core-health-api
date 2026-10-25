<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `geo`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 10 (10 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [geo](../endpoints/geo.md)

## Proceso: Módulo Geo (13) — Geolocation and Mobile Tracking

- **Código:** `geo` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 10
- **Actores:** SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/geo/README.md`

### Para qué sirve

Geolocalización y rastreo móvil: sujetos rastreados, sesiones de tracking, pings de ubicación de alta frecuencia, geofences con sus eventos de cruce, y viajes.

_Fuente: `src/modules/geo/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:GeoGeofencesController` | Operaciones de GeoGeofencesController que el README no asigna a un caso de uso | POST /geo/geofence-events | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /geo/geofences | SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:GeoTrackedSubjectsController` | Operaciones de GeoTrackedSubjectsController que el README no asigna a un caso de uso | POST /geo/tracked-subjects | SECURITY_ADMIN | MEDIO | 2 |
|  |  | GET /geo/tracked-subjects/{id}/last-position | SECURITY_ADMIN | BAJO | 2 |
|  |  | POST /geo/tracked-subjects/{id}/pings | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /geo/tracked-subjects/{id}/revoke-consent | SECURITY_ADMIN | MEDIO | 3 |
| `ctrl:GeoTrackingSessionsController` | Operaciones de GeoTrackingSessionsController que el README no asigna a un caso de uso | POST /geo/tracking-sessions | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /geo/tracking-sessions/{id}/close | SECURITY_ADMIN | BAJO | 3 |
| `ctrl:GeoTripsController` | Operaciones de GeoTripsController que el README no asigna a un caso de uso | POST /geo/trips | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /geo/trips/{id}/close | SECURITY_ADMIN | BAJO | 3 |

### Diagrama — etapas `ctrl:GeoGeofencesController`, `ctrl:GeoTrackedSubjectsController`, `ctrl:GeoTrackingSessionsController`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("geo.geofence_events")]:::tabla
  t4[("geo.geofences")]:::tabla
  t5[("geo.tracked_subjects")]:::tabla
  t9[("geo.location_pings")]:::tabla
  t11[("geo.tracking_sessions")]:::tabla
  t15[("geo.trips")]:::tabla
  subgraph s0["ctrl:GeoGeofencesController · Operaciones de GeoGeofencesController que el READ…"]
    o1["POST /geo/geofence-events"]:::op
    o6["POST /geo/geofences"]:::op
  end
  subgraph s1["ctrl:GeoTrackedSubjectsController · Operaciones de GeoTrackedSubjectsController…"]
    o7["POST /geo/tracked-subjects"]:::op
    o8["GET /geo/tracked-subjects/{id}/last-position"]:::op
    o10["POST /geo/tracked-subjects/{id}/pings"]:::op
    o12["POST /geo/tracked-subjects/{id}/revoke-consent"]:::op
  end
  subgraph s2["ctrl:GeoTrackingSessionsController · Operaciones de GeoTrackingSessionsControll…"]
    o13["POST /geo/tracking-sessions"]:::op
    o14["POST /geo/tracking-sessions/{id}/close"]:::op
  end
  subgraph s3["ctrl:GeoTripsController · Operaciones de GeoTripsController que el README no as…"]
    o16["POST /geo/trips"]:::op
    o17["POST /geo/trips/{id}/close"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  a2 --> o6
  o6 -->|"CREA"| t4
  o6 -->|"LEE"| t4
  a2 --> o7
  o7 -->|"CREA"| t5
  o7 -->|"LEE"| t5
  a2 --> o8
  o8 -->|"LEE"| t9
  o8 -->|"LEE"| t5
  a2 --> o10
  o10 -->|"CREA"| t9
  o10 -->|"LEE"| t5
  o10 -->|"LEE"| t11
  a2 --> o12
  o12 -->|"LEE"| t5
  o12 -->|"ACTUALIZA"| t11
  o12 -->|"LEE"| t11
  a2 --> o13
  o13 -->|"LEE"| t5
  o13 -->|"CREA"| t11
  o13 -->|"LEE"| t11
  a2 --> o14
  o14 -->|"LEE"| t5
  o14 -->|"LEE"| t11
  o14 -->|"LEE"| t15
  a2 --> o16
  o16 -->|"LEE"| t5
  o16 -->|"LEE"| t11
  o16 -->|"CREA"| t15
  o16 -->|"LEE"| t15
  a2 --> o17
  o17 -->|"LEE"| t5
  o17 -->|"LEE"| t11
  o17 -->|"LEE"| t15
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /geo/geofence-events

Registrar un evento de entrada/salida de geofence

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El sujeto ya está en ese estado respecto al geofence |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El geofence no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoGeofencesService.recordEvent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a GeofencesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE geo.geofences")]:::efecto
  n5 --> n6
  n7["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE geo.tracked_subjects")]:::efecto
  n7 --> n8
  n9{"geofence.stateConceptId !== GEO.GEOFENCE_ACTIVE"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED El geofence no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a GeofenceEventsRepository.findLast"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE geo.geofence_events")]:::efecto
  n11 --> n12
  n13{"last && last.eventTypeConceptId === eventTypeConceptId"}:::decision
  n12 --> n13
  n14(["409 CONFLICT El sujeto ya está en ese estado respecto al geofence"]):::error
  n13 -->|"sí"| n14
  n15["Llama a GeofenceEventsRepository.record"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA geo.geofence_events")]:::efecto
  n15 --> n16
  n17(("201 Responde con éxito")):::ok
  n16 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /geo/geofences

Definir y activar un geofence (circle o polygon)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un geofence con ese nombre en el tenant |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un geofence circular requiere radiusM, centerLat y centerLng; PreconditionFailedException: Un geofence poligonal requiere geometryJson |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoGeofencesService.define"]:::llamada
  n2 --> n3
  n4{"dto.shapeType === 'CIRCLE'"}:::decision
  n3 --> n4
  n5{"dto.radiusM === undefined || dto.centerLat === undefined || dto.centerLng === undefined"}:::decision
  n4 -->|"sí"| n5
  n6(["422 PRECONDITION_FAILED Un geofence circular requiere radiusM, centerLat y centerLng"]):::error
  n5 -->|"sí"| n6
  n7{"!dto.geometryJson"}:::decision
  n4 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED Un geofence poligonal requiere geometryJson"]):::error
  n7 -->|"sí"| n8
  n9["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n9
  n7 -->|"no"| n9
  n10["Llama a GeofencesRepository.findByTenantAndName"]:::llamada
  n9 --> n10
  n11[("LEE geo.geofences")]:::efecto
  n10 --> n11
  n12{"clash"}:::decision
  n11 --> n12
  n13(["409 CONFLICT Ya existe un geofence con ese nombre en el tenant"]):::error
  n12 -->|"sí"| n13
  n14["Llama a GeofencesRepository.create"]:::llamada
  n12 -->|"no"| n14
  n15[("CREA geo.geofences")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /geo/tracked-subjects

Alta de sujeto rastreado con consentimiento de ubicación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El sujeto ya está siendo rastreado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTrackedSubjectsService.enroll"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackedSubjectsRepository.findActiveBySubject"]:::llamada
  n4 --> n5
  n6[("LEE geo.tracked_subjects")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El sujeto ya está siendo rastreado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackedSubjectsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA geo.tracked_subjects")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /geo/tracked-subjects/{id}/last-position

Consultar la última posición conocida del sujeto

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El sujeto no tiene posiciones registradas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTrackedSubjectsService.lastPosition"]:::llamada
  n2 --> n3
  n4["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE geo.tracked_subjects")]:::efecto
  n4 --> n5
  n6["Llama a LocationPingsRepository.findLastBySubject"]:::llamada
  n5 --> n6
  n7[("LEE geo.location_pings")]:::efecto
  n6 --> n7
  n8{"!ping"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND El sujeto no tiene posiciones registradas"]):::error
  n8 -->|"sí"| n9
  n10(("200 Responde con éxito")):::ok
  n8 -->|"no"| n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /geo/tracked-subjects/{id}/pings

Ingerir un batch de pings de ubicación de alta frecuencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sujeto no está activo para rastreo; PreconditionFailedException: No hay una sesión de tracking abierta para el sujeto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTrackedSubjectsService.ingestPings"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE geo.tracked_subjects")]:::efecto
  n5 --> n6
  n7{"subject.stateConceptId !== GEO.SUBJECT_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El sujeto no está activo para rastreo"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackingSessionsRepository.findOpenBySubject"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE geo.tracking_sessions")]:::efecto
  n9 --> n10
  n11{"!openSession"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED No hay una sesión de tracking abierta para el sujeto"]):::error
  n11 -->|"sí"| n12
  n13["Repite: por cada const p de dto.pings"]:::bucle
  n11 -->|"no"| n13
  n14["Llama a LocationPingsRepository.record"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("CREA geo.location_pings")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
  n13 -->|"al terminar"| n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /geo/tracked-subjects/{id}/revoke-consent

Revocar consentimiento de ubicación y pausar el rastreo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rastreo del sujeto ya está suspendido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTrackedSubjectsService.revokeConsent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE geo.tracked_subjects")]:::efecto
  n5 --> n6
  n7{"subject.stateConceptId === GEO.SUBJECT_SUSPENDED"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El rastreo del sujeto ya está suspendido"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackingSessionsRepository.findAllOpenBySubject"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE geo.tracking_sessions")]:::efecto
  n9 --> n10
  n11["Repite: por cada const session de openSessions"]:::bucle
  n10 --> n11
  n12[("ACTUALIZA geo.tracking_sessions · ACTUALIZA geo.tracking_sessions")]:::efecto
  n11 -->|"cada elemento"| n12
  n13(("200 Responde con éxito")):::ok
  n12 --> n13
  n11 -->|"al terminar"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /geo/tracking-sessions

Iniciar una sesión de tracking de un sujeto

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El sujeto ya tiene una sesión de tracking abierta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sujeto no está activo para rastreo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTrackingSessionsService.start"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE geo.tracked_subjects")]:::efecto
  n5 --> n6
  n7{"subject.stateConceptId !== GEO.SUBJECT_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El sujeto no está activo para rastreo"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackingSessionsRepository.findOpenBySubject"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE geo.tracking_sessions")]:::efecto
  n9 --> n10
  n11{"open"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El sujeto ya tiene una sesión de tracking abierta"]):::error
  n11 -->|"sí"| n12
  n13["Llama a TrackingSessionsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA geo.tracking_sessions")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /geo/tracking-sessions/{id}/close

Cerrar una sesión de tracking

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no está abierta; PreconditionFailedException: La sesión tiene viajes en progreso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTrackingSessionsService.close"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingSessionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE geo.tracking_sessions")]:::efecto
  n5 --> n6
  n7["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE geo.tracked_subjects")]:::efecto
  n7 --> n8
  n9{"session.statusConceptId !== GEO.SESSION_OPEN"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED La sesión no está abierta"]):::error
  n9 -->|"sí"| n10
  n11["Llama a TripsRepository.countBySessionAndStatus"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE geo.trips")]:::efecto
  n11 --> n12
  n13{"inProgress › 0"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La sesión tiene viajes en progreso"]):::error
  n13 -->|"sí"| n14
  n15(("200 Responde con éxito")):::ok
  n13 -->|"no"| n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /geo/trips

Iniciar un viaje (trip)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La sesión ya tiene un viaje en progreso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión de tracking no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTripsService.start"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a GeoTripsService.loadSessionInTenant"]:::llamada
  n4 --> n5
  n6["Llama a TrackingSessionsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE geo.tracking_sessions")]:::efecto
  n6 --> n7
  n8["Llama a GeoTripsService.sessionTenant"]:::llamada
  n7 --> n8
  n9["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE geo.tracked_subjects")]:::efecto
  n9 --> n10
  n11{"session.statusConceptId !== GEO.SESSION_OPEN"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La sesión de tracking no está abierta"]):::error
  n11 -->|"sí"| n12
  n13["Llama a TripsRepository.findInProgressBySession"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE geo.trips")]:::efecto
  n13 --> n14
  n15{"active"}:::decision
  n14 --> n15
  n16(["409 CONFLICT La sesión ya tiene un viaje en progreso"]):::error
  n15 -->|"sí"| n16
  n17["Llama a TripsRepository.create"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA geo.trips")]:::efecto
  n17 --> n18
  n19(("201 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /geo/trips/{id}/close

Cerrar un viaje con distancia/duración

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El viaje no está en progreso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a GeoTripsService.close"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TripsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE geo.trips")]:::efecto
  n5 --> n6
  n7["Llama a TrackingSessionsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE geo.tracking_sessions")]:::efecto
  n7 --> n8
  n9["Llama a GeoTripsService.sessionTenant"]:::llamada
  n8 --> n9
  n10["Llama a TrackedSubjectsRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE geo.tracked_subjects")]:::efecto
  n10 --> n11
  n12{"trip.statusConceptId !== GEO.TRIP_IN_PROGRESS"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED El viaje no está en progreso"]):::error
  n12 -->|"sí"| n13
  n14(("200 Responde con éxito")):::ok
  n12 -->|"no"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

