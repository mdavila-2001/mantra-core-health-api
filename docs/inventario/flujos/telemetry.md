<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `telemetry`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 22 (19 con decisiones propias, 3 sin ellas)
- Inventario de endpoints del módulo: [telemetry](../endpoints/telemetry.md)

## Proceso: Módulo Telemetry (28)

- **Código:** `telemetry` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 22
- **Actores:** Cualquier sesión válida · DATA_PLATFORM_ADMIN · DPO · MARKETING_MANAGER · PLATFORM_ADMIN · SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/telemetry/README.md`

### Para qué sirve

Telemetría de producto: consentimiento de tracking, esquemas de eventos, actividad, contexto de cliente, Core Web Vitals, journeys, conversiones y analítica administrativa. Persiste en el esquema PostgreSQL `telemetry`. Puede reenviar, después del commit y por mejor esfuerzo, eventos minimizados a un proveedor externo.

_Fuente: `src/modules/telemetry/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:TelemetryAnalyticsController` | Operaciones de TelemetryAnalyticsController que el README no asigna a un caso de uso | GET /admin/analytics/funnels | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 3 |
|  |  | GET /admin/analytics/funnels/{funnelId}/report | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 5 |
|  |  | GET /admin/analytics/overview | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 1 |
|  |  | GET /admin/analytics/pipeline-health | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 2 |
|  |  | GET /admin/analytics/sessions | PLATFORM_ADMIN · SECURITY_ADMIN · DPO | BAJO | 1 |
|  |  | GET /admin/analytics/sessions/{id} | PLATFORM_ADMIN · SECURITY_ADMIN · DPO | BAJO | 3 |
|  |  | GET /admin/analytics/timeseries | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 1 |
|  |  | GET /admin/analytics/web-vitals | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 1 |
| `ctrl:TelemetryConsentController` | Operaciones de TelemetryConsentController que el README no asigna a un caso de uso | POST /telemetry/analytics-subjects | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /telemetry/disclosure-acceptances | Cualquier sesión válida | ALTO | 3 |
|  |  | POST /telemetry/tracking-consents | Cualquier sesión válida | ALTO | 2 |
|  |  | POST /telemetry/tracking-consents/{id}/withdraw | Cualquier sesión válida | ALTO | 4 |
|  |  | GET /telemetry/tracking-consents/me | Cualquier sesión válida | BAJO | 1 |
| `ctrl:TelemetryEventsController` | Operaciones de TelemetryEventsController que el README no asigna a un caso de uso | POST /telemetry/activity-events | Cualquier sesión válida | ALTO | 8 |
|  |  | POST /telemetry/client-contexts | Cualquier sesión válida | ALTO | 4 |
|  |  | POST /telemetry/conversion-events | Cualquier sesión válida | ALTO | 6 |
|  |  | POST /telemetry/session-journeys/{id}/close | Cualquier sesión válida | ALTO | 2 |
|  |  | POST /telemetry/web-vitals | Cualquier sesión válida | ALTO | 2 |
| `ctrl:TelemetryGovernanceController` | Operaciones de TelemetryGovernanceController que el README no asigna a un caso de uso | POST /telemetry/disclosure-versions | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /telemetry/event-schemas | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /telemetry/funnels | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /telemetry/tracking-purposes | SECURITY_ADMIN | MEDIO | 2 |

### Diagrama — etapas `ctrl:TelemetryAnalyticsController`, `ctrl:TelemetryConsentController`, `ctrl:TelemetryEventsController`…

```mermaid
flowchart LR
  a2(["PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MAR…"]):::actor
  a13(["PLATFORM_ADMIN · SECURITY_ADMIN · DPO"]):::actor
  a21(["SECURITY_ADMIN"]):::actor
  a24(["Cualquier sesión válida"]):::actor
  t3[("telemetry.activity_event_schema_definitions")]:::tabla
  t4[("telemetry.funnel_definitions")]:::tabla
  t5[("telemetry.funnel_steps")]:::tabla
  t7[("telemetry.conversion_events")]:::tabla
  t8[("telemetry.user_activity_events")]:::tabla
  t11[("telemetry.client_contexts")]:::tabla
  t14[("telemetry.session_journeys")]:::tabla
  t16[("telemetry.user_activity_event_properties")]:::tabla
  t19[("telemetry.web_vitals")]:::tabla
  t22[("telemetry.analytics_subjects")]:::tabla
  t25[("telemetry.tracking_disclosure_acceptances")]:::tabla
  t26[("telemetry.tracking_disclosure_versions")]:::tabla
  t28[("telemetry.tracking_consents")]:::tabla
  t29[("telemetry.tracking_purpose_definitions")]:::tabla
  subgraph s0["ctrl:TelemetryAnalyticsController · Operaciones de TelemetryAnalyticsController…"]
    o1["GET /admin/analytics/funnels"]:::op
    o6["GET /admin/analytics/funnels/{funnelId}/report"]:::op
    o9["GET /admin/analytics/overview"]:::op
    o10["GET /admin/analytics/pipeline-health"]:::op
    o12["GET /admin/analytics/sessions"]:::op
    o15["GET /admin/analytics/sessions/{id}"]:::op
    o17["GET /admin/analytics/timeseries"]:::op
    o18["GET /admin/analytics/web-vitals"]:::op
  end
  subgraph s1["ctrl:TelemetryConsentController · Operaciones de TelemetryConsentController que…"]
    o20["POST /telemetry/analytics-subjects"]:::op
    o23["POST /telemetry/disclosure-acceptances"]:::op
    o27["POST /telemetry/tracking-consents"]:::op
    o30["POST /telemetry/tracking-consents/{id}/withdraw"]:::op
    o31["GET /telemetry/tracking-consents/me"]:::op
  end
  t33[("+2 tablas más")]
  subgraph s2["ctrl:TelemetryEventsController · Operaciones de TelemetryEventsController que e…"]
    o32["POST /telemetry/activity-events"]:::op
    o34["POST /telemetry/client-contexts"]:::op
    o35["POST /telemetry/conversion-events"]:::op
    o36["POST /telemetry/session-journeys/{id}/close"]:::op
    o37["POST /telemetry/web-vitals"]:::op
  end
  subgraph s3["ctrl:TelemetryGovernanceController · Operaciones de TelemetryGovernanceControll…"]
    o38["POST /telemetry/disclosure-versions"]:::op
    o39["POST /telemetry/event-schemas"]:::op
    o40["POST /telemetry/funnels"]:::op
    o41["POST /telemetry/tracking-purposes"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  a2 --> o6
  o6 -->|"LEE"| t3
  o6 -->|"LEE"| t7
  o6 -->|"LEE"| t4
  o6 -->|"LEE"| t5
  o6 -->|"LEE"| t8
  a2 --> o9
  o9 -->|"LEE"| t8
  a2 --> o10
  o10 -->|"LEE"| t11
  o10 -->|"LEE"| t8
  a13 --> o12
  o12 -->|"LEE"| t14
  a13 --> o15
  o15 -->|"LEE"| t14
  o15 -->|"LEE"| t16
  o15 -->|"LEE"| t8
  a2 --> o17
  o17 -->|"LEE"| t8
  a2 --> o18
  o18 -->|"LEE"| t19
  a21 --> o20
  o20 -->|"CREA"| t22
  o20 -->|"LEE"| t22
  a24 --> o23
  o23 -->|"CREA"| t25
  o23 -->|"LEE"| t25
  o23 -->|"LEE"| t26
  a24 --> o27
  o27 -->|"CREA"| t28
  o27 -->|"LEE"| t29
  a24 --> o30
  o30 -->|"ACTUALIZA"| t22
  o30 -->|"LEE"| t22
  o30 -->|"CREA"| t28
  o30 -->|"LEE"| t28
  a24 --> o31
  o31 -->|"LEE"| t28
  a24 --> o32
  o32 -->|"LEE"| t3
  o32 -->|"ACTUALIZA"| t14
  o32 -->|"CREA"| t14
  o32 -->|"LEE"| t14
  o32 -->|"LEE"| t28
  o32 -->|"CREA"| t16
  o32 -.-> t33
  a24 --> o34
  o34 -->|"CREA"| t11
  o34 -->|"ACTUALIZA"| t14
  o34 -->|"CREA"| t14
  o34 -->|"LEE"| t14
  a24 --> o35
  o35 -->|"LEE"| t22
  o35 -->|"CREA"| t7
  o35 -->|"LEE"| t7
  o35 -->|"LEE"| t4
  o35 -->|"ACTUALIZA"| t14
  o35 -->|"LEE"| t14
  a24 --> o36
  o36 -->|"ACTUALIZA"| t14
  o36 -->|"LEE"| t14
  a24 --> o37
  o37 -->|"LEE"| t14
  o37 -->|"CREA"| t19
  a21 --> o38
  o38 -->|"ACTUALIZA"| t26
  o38 -->|"CREA"| t26
  o38 -->|"LEE"| t26
  a21 --> o39
  o39 -->|"CREA"| t3
  o39 -->|"LEE"| t3
  o39 -->|"LEE"| t29
  a21 --> o40
  o40 -->|"LEE"| t3
  o40 -->|"CREA"| t4
  o40 -->|"LEE"| t4
  o40 -->|"CREA"| t5
  o40 -->|"LEE"| t29
  a21 --> o41
  o41 -->|"CREA"| t29
  o41 -->|"LEE"| t29
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/analytics/funnels/{funnelId}/report

Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Embudo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryAnalyticsService.funnelReport"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryAnalyticsService.scope"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a TelemetryAnalyticsService.listFunnels"]:::llamada
  n5 --> n9
  n10["Llama a TelemetryAnalyticsRepository.listFunnels"]:::llamada
  n9 --> n10
  n11[("LEE telemetry.funnel_steps · LEE telemetry.activity_event_schema_definitions · LEE telemetry.funnel_definitio…")]:::efecto
  n10 --> n11
  n12{"!funnel"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Embudo no encontrado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a TelemetryAnalyticsRepository.funnelReach"]:::llamada
  n12 -->|"no"| n14
  n15["Repite: forEach(…)"]:::bucle
  n14 --> n15
  n16{"index === 0"}:::decision
  n15 -->|"cada elemento"| n16
  n17[("LEE telemetry.user_activity_events")]:::efecto
  n16 -->|"sí"| n17
  n18[("LEE telemetry.user_activity_events")]:::efecto
  n16 -->|"no"| n18
  n19["Llama a TelemetryAnalyticsRepository.serverConversions"]:::llamada
  n17 --> n19
  n18 --> n19
  n15 -->|"al terminar"| n19
  n20[("LEE telemetry.conversion_events")]:::efecto
  n19 --> n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /admin/analytics/overview

Totales, rutas y eventos principales de la ventana

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryAnalyticsService.overview"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryAnalyticsService.scope"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a TelemetryAnalyticsRepository.overview"]:::llamada
  n5 --> n9
  n10[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_events · LEE telemetry.user_activity_events")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /admin/analytics/pipeline-health

Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryAnalyticsService.pipelineHealth"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryAnalyticsService.scope"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a TelemetryAnalyticsRepository.pipelineHealth"]:::llamada
  n5 --> n9
  n10[("LEE telemetry.user_activity_events · LEE telemetry.client_contexts")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /admin/analytics/sessions

Sesiones de la ventana (sin identificadores de sesión ni sujeto)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryAnalyticsService.listSessions"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryAnalyticsService.scope"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a TelemetryAnalyticsRepository.listSessions"]:::llamada
  n5 --> n9
  n10[("LEE telemetry.session_journeys")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /admin/analytics/sessions/{id}

Timeline de una sesión: eventos y nombres de propiedad, sin valores

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryAnalyticsService.getSession"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryAnalyticsRepository.findSession"]:::llamada
  n3 --> n4
  n5[("LEE telemetry.session_journeys")]:::efecto
  n4 --> n5
  n6{"!session"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Sesión no encontrada"]):::error
  n6 -->|"sí"| n7
  n8["Llama a TelemetryAnalyticsRepository.sessionTimeline"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE telemetry.user_activity_event_properties · LEE telemetry.user_activity_events")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /admin/analytics/timeseries

Eventos y sesiones por hora o día (UTC), cubos vacíos en 0

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryAnalyticsService.timeseries"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryAnalyticsService.scope"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a TelemetryAnalyticsRepository.timeseries"]:::llamada
  n5 --> n9
  n10[("LEE telemetry.user_activity_events")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. GET /admin/analytics/web-vitals

p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryAnalyticsService.webVitals"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryAnalyticsService.scope"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a TelemetryAnalyticsRepository.webVitals"]:::llamada
  n5 --> n9
  n10[("LEE telemetry.web_vitals · LEE telemetry.web_vitals")]:::efecto
  n9 --> n10
  n11["Llama a TelemetryAnalyticsRepository.webVitalsByRoute"]:::llamada
  n10 --> n11
  n12[("LEE telemetry.web_vitals")]:::efecto
  n11 --> n12
  n13(("200 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /telemetry/activity-events

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

#### 9. POST /telemetry/client-contexts

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

#### 10. POST /telemetry/conversion-events

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

#### 11. POST /telemetry/disclosure-acceptances

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

#### 12. POST /telemetry/disclosure-versions

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

#### 13. POST /telemetry/event-schemas

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

#### 14. POST /telemetry/funnels

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

#### 15. POST /telemetry/session-journeys/{id}/close

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

#### 16. POST /telemetry/tracking-consents

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

#### 17. POST /telemetry/tracking-consents/{id}/withdraw

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

#### 18. POST /telemetry/tracking-purposes

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

#### 19. POST /telemetry/web-vitals

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
| GET /admin/analytics/funnels | 200, 401, 403, 429 | 3 |
| POST /telemetry/analytics-subjects | 201, 400, 401, 403, 429 | 2 |
| GET /telemetry/tracking-consents/me | 200, 400, 401, 403, 429 | 1 |
