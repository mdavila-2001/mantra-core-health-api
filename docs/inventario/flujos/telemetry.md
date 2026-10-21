<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `telemetry`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 13 (12 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [telemetry](../endpoints/telemetry.md)

## Proceso: src / modules / telemetry

- **Código:** `telemetry` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 13
- **Actores:** Cualquier sesión válida · SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/telemetry/README.md`

### Para qué sirve

Agrupa los componentes relacionados con **telemetry** y mantiene cohesionada esta responsabilidad del sistema.

_Fuente: `src/modules/telemetry/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:TelemetryConsentController` | Operaciones de TelemetryConsentController que el README no asigna a un caso de uso | POST /telemetry/analytics-subjects | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /telemetry/disclosure-acceptances | Cualquier sesión válida | ALTO | 3 |
|  |  | POST /telemetry/tracking-consents | Cualquier sesión válida | ALTO | 2 |
|  |  | POST /telemetry/tracking-consents/{id}/withdraw | Cualquier sesión válida | ALTO | 4 |
| `ctrl:TelemetryEventsController` | Operaciones de TelemetryEventsController que el README no asigna a un caso de uso | POST /telemetry/activity-events | Cualquier sesión válida | ALTO | 8 |
|  |  | POST /telemetry/client-contexts | Cualquier sesión válida | ALTO | 4 |
|  |  | POST /telemetry/conversion-events | Cualquier sesión válida | ALTO | 6 |
|  |  | POST /telemetry/session-journeys/{id}/close | Cualquier sesión válida | ALTO | 2 |
|  |  | POST /telemetry/web-vitals | Cualquier sesión válida | ALTO | 2 |
| `ctrl:TelemetryGovernanceController` | Operaciones de TelemetryGovernanceController que el README no asigna a un caso de uso | POST /telemetry/disclosure-versions | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /telemetry/event-schemas | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /telemetry/funnels | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /telemetry/tracking-purposes | SECURITY_ADMIN | MEDIO | 2 |

### Diagrama — etapas `ctrl:TelemetryConsentController`, `ctrl:TelemetryEventsController`, `ctrl:TelemetryGovernanceController`

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a5(["Cualquier sesión válida"]):::actor
  t3[("telemetry.analytics_subjects")]:::tabla
  t6[("telemetry.tracking_disclosure_acceptances")]:::tabla
  t7[("telemetry.tracking_disclosure_versions")]:::tabla
  t9[("telemetry.tracking_consents")]:::tabla
  t10[("telemetry.tracking_purpose_definitions")]:::tabla
  t13[("telemetry.activity_event_schema_definitions")]:::tabla
  t14[("telemetry.session_journeys")]:::tabla
  t15[("telemetry.user_activity_event_properties")]:::tabla
  t18[("telemetry.client_contexts")]:::tabla
  t20[("telemetry.conversion_events")]:::tabla
  t21[("telemetry.funnel_definitions")]:::tabla
  t24[("telemetry.web_vitals")]:::tabla
  t28[("telemetry.funnel_steps")]:::tabla
  subgraph s0["ctrl:TelemetryConsentController · Operaciones de TelemetryConsentController que…"]
    o1["POST /telemetry/analytics-subjects"]:::op
    o4["POST /telemetry/disclosure-acceptances"]:::op
    o8["POST /telemetry/tracking-consents"]:::op
    o11["POST /telemetry/tracking-consents/{id}/withdraw"]:::op
  end
  t16[("+2 tablas más")]
  subgraph s1["ctrl:TelemetryEventsController · Operaciones de TelemetryEventsController que e…"]
    o12["POST /telemetry/activity-events"]:::op
    o17["POST /telemetry/client-contexts"]:::op
    o19["POST /telemetry/conversion-events"]:::op
    o22["POST /telemetry/session-journeys/{id}/close"]:::op
    o23["POST /telemetry/web-vitals"]:::op
  end
  subgraph s2["ctrl:TelemetryGovernanceController · Operaciones de TelemetryGovernanceControll…"]
    o25["POST /telemetry/disclosure-versions"]:::op
    o26["POST /telemetry/event-schemas"]:::op
    o27["POST /telemetry/funnels"]:::op
    o29["POST /telemetry/tracking-purposes"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  a5 --> o4
  o4 -->|"CREA"| t6
  o4 -->|"LEE"| t6
  o4 -->|"LEE"| t7
  a5 --> o8
  o8 -->|"CREA"| t9
  o8 -->|"LEE"| t10
  a5 --> o11
  o11 -->|"ACTUALIZA"| t3
  o11 -->|"LEE"| t3
  o11 -->|"CREA"| t9
  o11 -->|"LEE"| t9
  a5 --> o12
  o12 -->|"LEE"| t13
  o12 -->|"ACTUALIZA"| t14
  o12 -->|"CREA"| t14
  o12 -->|"LEE"| t14
  o12 -->|"LEE"| t9
  o12 -->|"CREA"| t15
  o12 -.-> t16
  a5 --> o17
  o17 -->|"CREA"| t18
  o17 -->|"ACTUALIZA"| t14
  o17 -->|"CREA"| t14
  o17 -->|"LEE"| t14
  a5 --> o19
  o19 -->|"LEE"| t3
  o19 -->|"CREA"| t20
  o19 -->|"LEE"| t20
  o19 -->|"LEE"| t21
  o19 -->|"ACTUALIZA"| t14
  o19 -->|"LEE"| t14
  a5 --> o22
  o22 -->|"ACTUALIZA"| t14
  o22 -->|"LEE"| t14
  a5 --> o23
  o23 -->|"LEE"| t14
  o23 -->|"CREA"| t24
  a2 --> o25
  o25 -->|"ACTUALIZA"| t7
  o25 -->|"CREA"| t7
  o25 -->|"LEE"| t7
  a2 --> o26
  o26 -->|"CREA"| t13
  o26 -->|"LEE"| t13
  o26 -->|"LEE"| t10
  a2 --> o27
  o27 -->|"LEE"| t13
  o27 -->|"CREA"| t21
  o27 -->|"LEE"| t21
  o27 -->|"CREA"| t28
  o27 -->|"LEE"| t10
  a2 --> o29
  o29 -->|"CREA"| t10
  o29 -->|"LEE"| t10
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /telemetry/activity-events

Capturar evento(s) de actividad consent-aware (batch)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Esquema de evento no encontrado; ResourceNotFoundException: Journey de sesión no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryEventsService.captureActivityEvents"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Repite: por cada const item de dto.events"]:::bucle
  n4 --> n5
  n6["Llama a ActivityEventSchemaDefinitionsRepository.findById"]:::llamada
  n5 -->|"cada elemento"| n6
  n7[("LEE telemetry.activity_event_schema_definitions")]:::efecto
  n6 --> n7
  n8{"!schema"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Esquema de evento no encontrado"]):::error
  n8 -->|"sí"| n9
  n10["Llama a TelemetryEventsService.consentAllows"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a TrackingConsentsRepository.findLatest"]:::llamada
  n10 --> n11
  n12[("LEE telemetry.tracking_consents")]:::efecto
  n11 --> n12
  n13{"item.eventIdempotencyKey"}:::decision
  n12 --> n13
  n14["Llama a UserActivityEventsRepository.findByIdempotencyKey"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE telemetry.user_activity_events")]:::efecto
  n14 --> n15
  n16["Llama a TelemetryEventsService.resolveJourney"]:::llamada
  n15 --> n16
  n13 -->|"no"| n16
  n17{"opts.sessionJourneyId"}:::decision
  n16 --> n17
  n18["Llama a SessionJourneysRepository.findById"]:::llamada
  n17 -->|"sí"| n18
  n19[("LEE telemetry.session_journeys")]:::efecto
  n18 --> n19
  n20{"!found"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n20 -->|"sí"| n21
  n22{"opts.sessionId"}:::decision
  n20 -->|"no"| n22
  n17 -->|"no"| n22
  n23["Llama a SessionJourneysRepository.findOpenBySession"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE telemetry.session_journeys")]:::efecto
  n23 --> n24
  n25["Llama a SessionJourneysRepository.create"]:::llamada
  n24 --> n25
  n22 -->|"no"| n25
  n26[("CREA telemetry.session_journeys")]:::efecto
  n25 --> n26
  n27["Llama a UserActivityEventsRepository.create"]:::llamada
  n26 --> n27
  n28[("CREA telemetry.user_activity_events")]:::efecto
  n27 --> n28
  n29["Repite: por cada const prop de item.properties ?? []"]:::bucle
  n28 --> n29
  n30["Llama a UserActivityEventPropertiesRepository.create"]:::llamada
  n29 -->|"cada elemento"| n30
  n31[("CREA telemetry.user_activity_event_properties")]:::efecto
  n30 --> n31
  n32{"journey"}:::decision
  n31 --> n32
  n29 -->|"al terminar"| n32
  n33[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n32 -->|"sí"| n33
  n34{"!journey.entryEventId"}:::decision
  n33 --> n34
  n35[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n34 -->|"sí"| n35
  n36[("ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_jou…")]:::efecto
  n35 --> n36
  n34 -->|"no"| n36
  n37(("201 Responde con éxito")):::ok
  n36 --> n37
  n32 -->|"no"| n37
  n5 -->|"al terminar"| n37
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /telemetry/client-contexts

Registrar contexto de cliente/dispositivo + journey

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Journey de sesión no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryEventsService.captureClientContext"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TelemetryEventsService.resolveJourney"]:::llamada
  n4 --> n5
  n6{"opts.sessionJourneyId"}:::decision
  n5 --> n6
  n7["Llama a SessionJourneysRepository.findById"]:::llamada
  n6 -->|"sí"| n7
  n8[("LEE telemetry.session_journeys")]:::efecto
  n7 --> n8
  n9{"!found"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"opts.sessionId"}:::decision
  n9 -->|"no"| n11
  n6 -->|"no"| n11
  n12["Llama a SessionJourneysRepository.findOpenBySession"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE telemetry.session_journeys")]:::efecto
  n12 --> n13
  n14["Llama a SessionJourneysRepository.create"]:::llamada
  n13 --> n14
  n11 -->|"no"| n14
  n15[("CREA telemetry.session_journeys")]:::efecto
  n14 --> n15
  n16["Llama a ClientContextsRepository.create"]:::llamada
  n15 --> n16
  n17[("CREA telemetry.client_contexts")]:::efecto
  n16 --> n17
  n18{"journey"}:::decision
  n17 --> n18
  n19[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n18 -->|"sí"| n19
  n20{"!journey.startedAt"}:::decision
  n19 --> n20
  n21[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n20 -->|"sí"| n21
  n22[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n21 --> n22
  n20 -->|"no"| n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  n18 -->|"no"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /telemetry/conversion-events

Registrar evento de conversión con atribución

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Funnel no encontrado; ResourceNotFoundException: Sujeto de analítica no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryEventsService.recordConversion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FunnelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.funnel_definitions")]:::efecto
  n5 --> n6
  n7{"!funnel"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Funnel no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a AnalyticsSubjectsRepository.findById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE telemetry.analytics_subjects")]:::efecto
  n9 --> n10
  n11{"!subject"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Sujeto de analítica no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ConversionEventsRepository.findExisting"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE telemetry.conversion_events")]:::efecto
  n13 --> n14
  n15["Llama a ConversionEventsRepository.create"]:::llamada
  n14 --> n15
  n16[("CREA telemetry.conversion_events")]:::efecto
  n15 --> n16
  n17{"dto.sessionJourneyId"}:::decision
  n16 --> n17
  n18["Llama a SessionJourneysRepository.findById"]:::llamada
  n17 -->|"sí"| n18
  n19[("LEE telemetry.session_journeys")]:::efecto
  n18 --> n19
  n20{"journey"}:::decision
  n19 --> n20
  n21[("ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_journeys")]:::efecto
  n20 -->|"sí"| n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
  n20 -->|"no"| n22
  n17 -->|"no"| n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /telemetry/disclosure-acceptances

Registrar aceptación de disclosure por usuario/sesión

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de disclosure no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryConsentService.acceptDisclosure"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingDisclosureVersionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.tracking_disclosure_versions")]:::efecto
  n5 --> n6
  n7{"!version"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión de disclosure no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackingDisclosureAcceptancesRepository.findExisting"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE telemetry.tracking_disclosure_acceptances")]:::efecto
  n9 --> n10
  n11["Llama a TrackingDisclosureAcceptancesRepository.create"]:::llamada
  n10 --> n11
  n12[("CREA telemetry.tracking_disclosure_acceptances")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /telemetry/disclosure-versions

Publicar versión de disclosure de tracking

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe esa versión del documento |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryGovernanceService.publishDisclosure"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingDisclosureVersionsRepository.findByDocumentVersion"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.tracking_disclosure_versions")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe esa versión del documento"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackingDisclosureVersionsRepository.findOpenByDocument"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE telemetry.tracking_disclosure_versions")]:::efecto
  n9 --> n10
  n11["Repite: por cada const prev de open"]:::bucle
  n10 --> n11
  n12[("ACTUALIZA telemetry.tracking_disclosure_versions")]:::efecto
  n11 -->|"cada elemento"| n12
  n13["Llama a TrackingDisclosureVersionsRepository.create"]:::llamada
  n12 --> n13
  n11 -->|"al terminar"| n13
  n14[("CREA telemetry.tracking_disclosure_versions")]:::efecto
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

#### 6. POST /telemetry/event-schemas

Registrar esquema de evento de actividad (versionado)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Propósito de tracking no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un esquema con ese nombre y versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El propósito de tracking no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryGovernanceService.registerEventSchema"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingPurposeDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.tracking_purpose_definitions")]:::efecto
  n5 --> n6
  n7{"!purpose"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Propósito de tracking no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"purpose.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El propósito de tracking no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ActivityEventSchemaDefinitionsRepository.findByNameVersion"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE telemetry.activity_event_schema_definitions")]:::efecto
  n11 --> n12
  n13{"clash"}:::decision
  n12 --> n13
  n14(["409 CONFLICT Ya existe un esquema con ese nombre y versión"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ActivityEventSchemaDefinitionsRepository.create"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA telemetry.activity_event_schema_definitions")]:::efecto
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

#### 7. POST /telemetry/funnels

Definir funnel y sus pasos

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Propósito de tracking no encontrado |
| 409 | `CONFLICT` | ConflictException: El código de funnel ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esquema de evento de un paso no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryGovernanceService.defineFunnel"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingPurposeDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.tracking_purpose_definitions")]:::efecto
  n5 --> n6
  n7{"!purpose"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Propósito de tracking no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a FunnelDefinitionsRepository.findByCode"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE telemetry.funnel_definitions")]:::efecto
  n9 --> n10
  n11{"clash"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El código de funnel ya existe"]):::error
  n11 -->|"sí"| n12
  n13["Repite: por cada const step de dto.steps"]:::bucle
  n11 -->|"no"| n13
  n14["Llama a ActivityEventSchemaDefinitionsRepository.findById"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("LEE telemetry.activity_event_schema_definitions")]:::efecto
  n14 --> n15
  n16{"!schema"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Esquema de evento de un paso no existe"]):::error
  n16 -->|"sí"| n17
  n18["Llama a FunnelDefinitionsRepository.create"]:::llamada
  n16 -->|"no"| n18
  n13 -->|"al terminar"| n18
  n19[("CREA telemetry.funnel_definitions")]:::efecto
  n18 --> n19
  n20["Repite: por cada const step de dto.steps"]:::bucle
  n19 --> n20
  n21["Llama a FunnelStepsRepository.create"]:::llamada
  n20 -->|"cada elemento"| n21
  n22[("CREA telemetry.funnel_steps")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  n20 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /telemetry/session-journeys/{id}/close

Cerrar journey de sesión y consolidar métricas

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Journey de sesión no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El journey ya está cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryEventsService.closeJourney"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SessionJourneysRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.session_journeys")]:::efecto
  n5 --> n6
  n7{"!journey"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"journey.journeyStatusConceptId === TELE.JOURNEY_CLOSED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El journey ya está cerrado"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_journeys")]:::efecto
  n9 -->|"no"| n11
  n12{"dto.exitEventId"}:::decision
  n11 --> n12
  n13[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n12 -->|"sí"| n13
  n14[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n13 --> n14
  n12 -->|"no"| n14
  n15{"dto.eventCount !== undefined"}:::decision
  n14 --> n15
  n16[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n15 -->|"sí"| n16
  n17[("ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_journeys")]:::efecto
  n16 --> n17
  n15 -->|"no"| n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /telemetry/tracking-consents

Otorgar consentimiento de tracking por propósito

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Propósito de tracking no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El propósito no requiere consentimiento |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryConsentService.grantConsent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingPurposeDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.tracking_purpose_definitions")]:::efecto
  n5 --> n6
  n7{"!purpose"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Propósito de tracking no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"purpose.requiresConsent === false"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El propósito no requiere consentimiento"]):::error
  n9 -->|"sí"| n10
  n11["Llama a TrackingConsentsRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA telemetry.tracking_consents")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /telemetry/tracking-consents/{id}/withdraw

Retirar consentimiento y desactivar sujeto (cascada)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay un consentimiento vigente que retirar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryConsentService.withdrawConsent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingConsentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.tracking_consents")]:::efecto
  n5 --> n6
  n7{"!consent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Consentimiento no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackingConsentsRepository.findLatest"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE telemetry.tracking_consents")]:::efecto
  n9 --> n10
  n11{"!latest || latest.decisionConceptId !== TELE.DECISION_GRANTED"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED No hay un consentimiento vigente que retirar"]):::error
  n11 -->|"sí"| n12
  n13["Llama a TrackingConsentsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA telemetry.tracking_consents")]:::efecto
  n13 --> n14
  n15["Llama a AnalyticsSubjectsRepository.findActiveByConsent"]:::llamada
  n14 --> n15
  n16[("LEE telemetry.analytics_subjects")]:::efecto
  n15 --> n16
  n17["Repite: por cada const subject de subjects"]:::bucle
  n16 --> n17
  n18[("ACTUALIZA telemetry.analytics_subjects")]:::efecto
  n17 -->|"cada elemento"| n18
  n19(("200 Responde con éxito")):::ok
  n18 --> n19
  n17 -->|"al terminar"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /telemetry/tracking-purposes

Definir propósito de tracking y base legal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El código de propósito ya existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryGovernanceService.definePurpose"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TrackingPurposeDefinitionsRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.tracking_purpose_definitions")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El código de propósito ya existe"]):::error
  n7 -->|"sí"| n8
  n9["Llama a TrackingPurposeDefinitionsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA telemetry.tracking_purpose_definitions")]:::efecto
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

#### 12. POST /telemetry/web-vitals

Registrar métricas Core Web Vitals por ruta (batch)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Journey de sesión no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryEventsService.recordWebVitals"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Repite: por cada const m de dto.metrics"]:::bucle
  n4 --> n5
  n6{"m.sessionJourneyId"}:::decision
  n5 -->|"cada elemento"| n6
  n7["Llama a SessionJourneysRepository.findById"]:::llamada
  n6 -->|"sí"| n7
  n8[("LEE telemetry.session_journeys")]:::efecto
  n7 --> n8
  n9{"!j"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a WebVitalsRepository.create"]:::llamada
  n9 -->|"no"| n11
  n6 -->|"no"| n11
  n12[("CREA telemetry.web_vitals")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  n5 -->|"al terminar"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| POST /telemetry/analytics-subjects | 201, 400, 401, 403, 429 | 2 |
