<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `telemetry`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 35 (24 con decisiones propias, 11 sin ellas)
- Inventario de endpoints del módulo: [telemetry](../endpoints/telemetry.md)

## Proceso: Módulo Telemetry (28)

- **Código:** `telemetry` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 35
- **Actores:** Cualquier sesión válida · DATA_PLATFORM_ADMIN · DPO · MARKETING_MANAGER · PLATFORM_ADMIN · Público (sin sesión) · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/telemetry/README.md`

### Para qué sirve

Telemetría de producto: consentimiento de tracking, esquemas de eventos, actividad, contexto de cliente, Core Web Vitals, journeys, conversiones y analítica administrativa. Persiste en el esquema PostgreSQL `telemetry`. Puede reenviar, después del commit y por mejor esfuerzo, eventos minimizados a un proveedor externo.

_Fuente: `src/modules/telemetry/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:TelemetryAnalyticsController` | Operaciones de TelemetryAnalyticsController que el README no asigna a un caso de uso | GET /admin/analytics/devices | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 3 |
|  |  | GET /admin/analytics/funnels | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 3 |
|  |  | GET /admin/analytics/funnels/{funnelId}/report | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 6 |
|  |  | GET /admin/analytics/overview | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 1 |
|  |  | GET /admin/analytics/pipeline-health | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 2 |
|  |  | GET /admin/analytics/sessions | PLATFORM_ADMIN · SECURITY_ADMIN · DPO | BAJO | 2 |
|  |  | GET /admin/analytics/sessions/{id} | PLATFORM_ADMIN · SECURITY_ADMIN · DPO | BAJO | 3 |
|  |  | GET /admin/analytics/timeseries | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 1 |
|  |  | GET /admin/analytics/web-vitals | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 3 |
| `ctrl:TelemetryClickHeatmapController` | Operaciones de TelemetryClickHeatmapController que el README no asigna a un caso de uso | GET /admin/analytics/heatmap | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 2 |
| `ctrl:TelemetryClientErrorsController` | Operaciones de TelemetryClientErrorsController que el README no asigna a un caso de uso | POST /telemetry/client-errors | Público (sin sesión) | ALTO | 3 |
| `ctrl:TelemetryConsentController` | Operaciones de TelemetryConsentController que el README no asigna a un caso de uso | POST /telemetry/analytics-subjects | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /telemetry/disclosure-acceptances | Cualquier sesión válida | ALTO | 3 |
|  |  | POST /telemetry/tracking-consents | Cualquier sesión válida | ALTO | 2 |
|  |  | POST /telemetry/tracking-consents/{id}/withdraw | Cualquier sesión válida | ALTO | 4 |
|  |  | GET /telemetry/tracking-consents/me | Cualquier sesión válida | BAJO | 1 |
| `ctrl:TelemetryErrorsAnalyticsController` | Operaciones de TelemetryErrorsAnalyticsController que el README no asigna a un caso de uso | GET /admin/analytics/errors | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 4 |
|  |  | GET /admin/analytics/errors/fingerprints | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 3 |
|  |  | GET /admin/analytics/errors/fingerprints/{fingerprint} | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 3 |
|  |  | GET /admin/analytics/errors/routes-not-found | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 3 |
| `ctrl:TelemetryEventsController` | Operaciones de TelemetryEventsController que el README no asigna a un caso de uso | POST /telemetry/activity-events | Cualquier sesión válida | ALTO | 10 |
|  |  | POST /telemetry/client-contexts | Cualquier sesión válida | ALTO | 5 |
|  |  | POST /telemetry/conversion-events | Cualquier sesión válida | ALTO | 7 |
|  |  | POST /telemetry/session-journeys/{id}/close | Cualquier sesión válida | ALTO | 4 |
|  |  | POST /telemetry/web-vitals | Cualquier sesión válida | ALTO | 6 |
| `ctrl:TelemetryGovernanceController` | Operaciones de TelemetryGovernanceController que el README no asigna a un caso de uso | POST /telemetry/disclosure-versions | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /telemetry/event-schemas | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /telemetry/funnels | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /telemetry/tracking-purposes | SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:TelemetryOnboardingAnalyticsController` | Operaciones de TelemetryOnboardingAnalyticsController que el README no asigna a un caso de uso | GET /admin/analytics/onboarding/funnel | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 0 |
|  |  | GET /admin/analytics/onboarding/heatmap | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 0 |
|  |  | POST /telemetry/onboarding-events | Público (sin sesión) | BAJO | 0 |
| `ctrl:TelemetryPartsAnalyticsController` | Operaciones de TelemetryPartsAnalyticsController que el README no asigna a un caso de uso | GET /admin/analytics/parts | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 5 |
|  |  | GET /admin/analytics/parts/{routeCode} | PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MARKETING_MANAGER · DPO | BAJO | 5 |
| `ctrl:TelemetryRetentionController` | Operaciones de TelemetryRetentionController que el README no asigna a un caso de uso | POST /telemetry/retention/purge | SYSTEM | ALTO | 10 |

### Diagrama 1 de 2 — etapas `ctrl:TelemetryAnalyticsController`, `ctrl:TelemetryClickHeatmapController`, `ctrl:TelemetryClientErrorsController`…

```mermaid
flowchart LR
  a2(["PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MAR…"]):::actor
  a16(["PLATFORM_ADMIN · SECURITY_ADMIN · DPO"]):::actor
  a24(["Público (sin sesión)"]):::actor
  a29(["SECURITY_ADMIN"]):::actor
  a32(["Cualquier sesión válida"]):::actor
  t3[("telemetry.client_contexts")]:::tabla
  t4[("telemetry.user_activity_events")]:::tabla
  t5[("terminology.catalog_concepts")]:::tabla
  t7[("telemetry.activity_event_schema_definitions")]:::tabla
  t8[("telemetry.funnel_definitions")]:::tabla
  t9[("telemetry.funnel_steps")]:::tabla
  t11[("telemetry.conversion_events")]:::tabla
  t12[("telemetry.session_journeys")]:::tabla
  t18[("telemetry.user_activity_event_properties")]:::tabla
  t21[("telemetry.web_vitals")]:::tabla
  t25[("iam.sessions")]:::tabla
  t26[("iam.users")]:::tabla
  t27[("telemetry.client_error_events")]:::tabla
  t30[("telemetry.analytics_subjects")]:::tabla
  t33[("telemetry.tracking_disclosure_acceptances")]:::tabla
  t34[("telemetry.tracking_disclosure_versions")]:::tabla
  t36[("telemetry.tracking_consents")]:::tabla
  t37[("telemetry.tracking_purpose_definitions")]:::tabla
  t41[("read_models.frontend_routes")]:::tabla
  t42[("read_models.portal_surfaces")]:::tabla
  subgraph s0["ctrl:TelemetryAnalyticsController · Operaciones de TelemetryAnalyticsController…"]
    o1["GET /admin/analytics/devices"]:::op
    o6["GET /admin/analytics/funnels"]:::op
    o10["GET /admin/analytics/funnels/{funnelId}/report"]:::op
    o13["GET /admin/analytics/overview"]:::op
    o14["GET /admin/analytics/pipeline-health"]:::op
    o15["GET /admin/analytics/sessions"]:::op
    o17["GET /admin/analytics/sessions/{id}"]:::op
    o19["GET /admin/analytics/timeseries"]:::op
    o20["GET /admin/analytics/web-vitals"]:::op
  end
  subgraph s1["ctrl:TelemetryClickHeatmapController · Operaciones de TelemetryClickHeatmapCont…"]
    o22["GET /admin/analytics/heatmap"]:::op
  end
  subgraph s2["ctrl:TelemetryClientErrorsController · Operaciones de TelemetryClientErrorsCont…"]
    o23["POST /telemetry/client-errors"]:::op
  end
  subgraph s3["ctrl:TelemetryConsentController · Operaciones de TelemetryConsentController que…"]
    o28["POST /telemetry/analytics-subjects"]:::op
    o31["POST /telemetry/disclosure-acceptances"]:::op
    o35["POST /telemetry/tracking-consents"]:::op
    o38["POST /telemetry/tracking-consents/{id}/withdraw"]:::op
    o39["GET /telemetry/tracking-consents/me"]:::op
  end
  subgraph s4["ctrl:TelemetryErrorsAnalyticsController · Operaciones de TelemetryErrorsAnalyti…"]
    o40["GET /admin/analytics/errors"]:::op
    o43["GET /admin/analytics/errors/fingerprints"]:::op
    o44["GET /admin/analytics/errors/fingerprints/{fingerprint}"]:::op
    o45["GET /admin/analytics/errors/routes-not-found"]:::op
  end
  t47[("+4 tablas más")]
  t50[("+1 tablas más")]
  subgraph s5["ctrl:TelemetryEventsController · Operaciones de TelemetryEventsController que e…"]
    o46["POST /telemetry/activity-events"]:::op
    o48["POST /telemetry/client-contexts"]:::op
    o49["POST /telemetry/conversion-events"]:::op
    o51["POST /telemetry/session-journeys/{id}/close"]:::op
    o52["POST /telemetry/web-vitals"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  a2 --> o6
  o6 -->|"LEE"| t7
  o6 -->|"LEE"| t8
  o6 -->|"LEE"| t9
  a2 --> o10
  o10 -->|"LEE"| t7
  o10 -->|"LEE"| t11
  o10 -->|"LEE"| t8
  o10 -->|"LEE"| t9
  o10 -->|"LEE"| t12
  o10 -->|"LEE"| t4
  a2 --> o13
  o13 -->|"LEE"| t4
  a2 --> o14
  o14 -->|"LEE"| t3
  o14 -->|"LEE"| t4
  a16 --> o15
  o15 -->|"LEE"| t12
  o15 -->|"LEE"| t4
  a16 --> o17
  o17 -->|"LEE"| t12
  o17 -->|"LEE"| t18
  o17 -->|"LEE"| t4
  a2 --> o19
  o19 -->|"LEE"| t4
  a2 --> o20
  o20 -->|"LEE"| t12
  o20 -->|"LEE"| t4
  o20 -->|"LEE"| t21
  a2 --> o22
  o22 -->|"LEE"| t18
  o22 -->|"LEE"| t4
  a24 --> o23
  o23 -->|"LEE"| t25
  o23 -->|"LEE"| t26
  o23 -->|"CREA"| t27
  a29 --> o28
  o28 -->|"CREA"| t30
  o28 -->|"LEE"| t30
  a32 --> o31
  o31 -->|"CREA"| t33
  o31 -->|"LEE"| t33
  o31 -->|"LEE"| t34
  a32 --> o35
  o35 -->|"CREA"| t36
  o35 -->|"LEE"| t37
  a32 --> o38
  o38 -->|"ACTUALIZA"| t30
  o38 -->|"LEE"| t30
  o38 -->|"CREA"| t36
  o38 -->|"LEE"| t36
  a32 --> o39
  o39 -->|"LEE"| t36
  a2 --> o40
  o40 -->|"LEE"| t41
  o40 -->|"LEE"| t42
  o40 -->|"LEE"| t27
  o40 -->|"LEE"| t4
  a2 --> o43
  o43 -->|"LEE"| t41
  o43 -->|"LEE"| t42
  o43 -->|"LEE"| t27
  a2 --> o44
  o44 -->|"LEE"| t41
  o44 -->|"LEE"| t42
  o44 -->|"LEE"| t27
  a2 --> o45
  o45 -->|"LEE"| t41
  o45 -->|"LEE"| t42
  o45 -->|"LEE"| t27
  a32 --> o46
  o46 -->|"LEE"| t25
  o46 -->|"LEE"| t7
  o46 -->|"LEE"| t30
  o46 -->|"CREA"| t12
  o46 -->|"LEE"| t12
  o46 -->|"LEE"| t36
  o46 -.-> t47
  a32 --> o48
  o48 -->|"LEE"| t25
  o48 -->|"LEE"| t30
  o48 -->|"CREA"| t3
  o48 -->|"CREA"| t12
  o48 -->|"LEE"| t12
  a32 --> o49
  o49 -->|"LEE"| t25
  o49 -->|"LEE"| t30
  o49 -->|"CREA"| t11
  o49 -->|"LEE"| t11
  o49 -->|"LEE"| t8
  o49 -->|"LEE"| t12
  o49 -.-> t50
  a32 --> o51
  o51 -->|"LEE"| t25
  o51 -->|"ACTUALIZA"| t12
  o51 -->|"LEE"| t12
  o51 -->|"LEE"| t4
  a32 --> o52
  o52 -->|"LEE"| t25
  o52 -->|"LEE"| t30
  o52 -->|"LEE"| t3
  o52 -->|"LEE"| t12
  o52 -->|"LEE"| t4
  o52 -->|"CREA"| t21
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:TelemetryGovernanceController`, `ctrl:TelemetryOnboardingAnalyticsController`, `ctrl:TelemetryPartsAnalyticsController`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a12(["PLATFORM_ADMIN · SECURITY_ADMIN · DATA_PLATFORM_ADMIN · MAR…"]):::actor
  a15(["Público (sin sesión)"]):::actor
  a24(["SYSTEM"]):::actor
  t3[("telemetry.tracking_disclosure_versions")]:::tabla
  t5[("telemetry.activity_event_schema_definitions")]:::tabla
  t6[("telemetry.tracking_purpose_definitions")]:::tabla
  t8[("telemetry.funnel_definitions")]:::tabla
  t9[("telemetry.funnel_steps")]:::tabla
  t17[("telemetry.client_error_events")]:::tabla
  t18[("telemetry.session_journeys")]:::tabla
  t19[("telemetry.user_activity_event_properties")]:::tabla
  t20[("telemetry.user_activity_events")]:::tabla
  t21[("telemetry.web_vitals")]:::tabla
  t25[("telemetry.conversion_events")]:::tabla
  subgraph s0["ctrl:TelemetryGovernanceController · Operaciones de TelemetryGovernanceControll…"]
    o1["POST /telemetry/disclosure-versions"]:::op
    o4["POST /telemetry/event-schemas"]:::op
    o7["POST /telemetry/funnels"]:::op
    o10["POST /telemetry/tracking-purposes"]:::op
  end
  subgraph s1["ctrl:TelemetryOnboardingAnalyticsController · Operaciones de TelemetryOnboardin…"]
    o11["GET /admin/analytics/onboarding/funnel"]:::op
    o13["GET /admin/analytics/onboarding/heatmap"]:::op
    o14["POST /telemetry/onboarding-events"]:::op
  end
  subgraph s2["ctrl:TelemetryPartsAnalyticsController · Operaciones de TelemetryPartsAnalytics…"]
    o16["GET /admin/analytics/parts"]:::op
    o22["GET /admin/analytics/parts/{routeCode}"]:::op
  end
  t26[("+4 tablas más")]
  subgraph s3["ctrl:TelemetryRetentionController · Operaciones de TelemetryRetentionController…"]
    o23["POST /telemetry/retention/purge"]:::op
  end
  a2 --> o1
  o1 -->|"ACTUALIZA"| t3
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"CREA"| t5
  o4 -->|"LEE"| t5
  o4 -->|"LEE"| t6
  a2 --> o7
  o7 -->|"LEE"| t5
  o7 -->|"CREA"| t8
  o7 -->|"LEE"| t8
  o7 -->|"CREA"| t9
  o7 -->|"LEE"| t6
  a2 --> o10
  o10 -->|"CREA"| t6
  o10 -->|"LEE"| t6
  a12 --> o11
  a12 --> o13
  a15 --> o14
  a12 --> o16
  o16 -->|"LEE"| t17
  o16 -->|"LEE"| t18
  o16 -->|"LEE"| t19
  o16 -->|"LEE"| t20
  o16 -->|"LEE"| t21
  a12 --> o22
  o22 -->|"LEE"| t17
  o22 -->|"LEE"| t18
  o22 -->|"LEE"| t19
  o22 -->|"LEE"| t20
  o22 -->|"LEE"| t21
  a24 --> o23
  o23 -->|"LEE"| t5
  o23 -->|"BORRA"| t17
  o23 -->|"LEE"| t17
  o23 -->|"ACTUALIZA"| t25
  o23 -->|"ACTUALIZA"| t18
  o23 -->|"LEE"| t6
  o23 -.-> t26
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/analytics/devices

Desglose de dispositivos (tipo, SO, navegador, versión de app); bots aparte; lo no medido se declara

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
  n3["Llama a TelemetryAnalyticsService.devices"]:::llamada
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
  n9["Llama a TelemetryAnalyticsRepository.devices"]:::llamada
  n5 --> n9
  n10["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n9 --> n10
  n11[("LEE telemetry.user_activity_events")]:::efecto
  n10 --> n11
  n12[("LEE telemetry.client_contexts · LEE telemetry.client_contexts · LEE terminology.catalog_concepts · LEE teleme…")]:::efecto
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

#### 2. GET /admin/analytics/funnels/{funnelId}/report

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
  n20["Llama a TelemetryAnalyticsRepository.rowInTenant"]:::llamada
  n19 --> n20
  n21["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n20 --> n21
  n22[("LEE telemetry.user_activity_events")]:::efecto
  n21 --> n22
  n23[("LEE telemetry.user_activity_events · LEE telemetry.session_journeys")]:::efecto
  n22 --> n23
  n24[("LEE telemetry.conversion_events")]:::efecto
  n23 --> n24
  n25(("200 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /admin/analytics/heatmap

Mapa de calor de clics de una pantalla: celdas normalizadas, elementos y tamaño; lo no medido se declara

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryClickHeatmapService.heatmap"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryClickHeatmapService.scope"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a TelemetryClickHeatmapRepository.totals"]:::llamada
  n5 --> n9
  n10["Llama a TelemetryClickHeatmapRepository.clicks"]:::llamada
  n9 --> n10
  n11[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n10 --> n11
  n12["Llama a TelemetryClickHeatmapRepository.cells"]:::llamada
  n11 --> n12
  n13["Llama a TelemetryClickHeatmapRepository.clicks"]:::llamada
  n12 --> n13
  n14[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n13 --> n14
  n15["Llama a TelemetryClickHeatmapRepository.elements"]:::llamada
  n14 --> n15
  n16["Llama a TelemetryClickHeatmapRepository.clicks"]:::llamada
  n15 --> n16
  n17[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n16 --> n17
  n18["Llama a TelemetryClickHeatmapRepository.sizes"]:::llamada
  n17 --> n18
  n19["Llama a TelemetryClickHeatmapRepository.clicks"]:::llamada
  n18 --> n19
  n20[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n19 --> n20
  n21["Llama a TelemetryClickHeatmapRepository.scroll"]:::llamada
  n20 --> n21
  n22[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n21 --> n22
  n23["Llama a TelemetryClickHeatmapRepository.views"]:::llamada
  n22 --> n23
  n24[("LEE telemetry.user_activity_events")]:::efecto
  n23 --> n24
  n25(("200 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /admin/analytics/overview

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

#### 5. GET /admin/analytics/parts/{routeCode}



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Parte no registrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryPartsAnalyticsService.part"]:::llamada
  n2 --> n3
  n4{"!part"}:::decision
  n3 --> n4
  n5(["404 NOT_FOUND Parte no registrada"]):::error
  n4 -->|"sí"| n5
  n6["Llama a TelemetryPartsRepository.usageByRoute"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE telemetry.user_activity_events")]:::efecto
  n6 --> n7
  n8["Llama a TelemetryPartsRepository.viewsSeries"]:::llamada
  n7 --> n8
  n9[("LEE telemetry.user_activity_events")]:::efecto
  n8 --> n9
  n10["Llama a TelemetryPartsRepository.screenSizes"]:::llamada
  n9 --> n10
  n11[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n10 --> n11
  n12["Llama a TelemetryPartsRepository.keyActions"]:::llamada
  n11 --> n12
  n13[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n12 --> n13
  n14["Llama a TelemetryPartsRepository.dwellByRoute"]:::llamada
  n13 --> n14
  n15[("LEE telemetry.user_activity_events · LEE telemetry.user_activity_event_properties")]:::efecto
  n14 --> n15
  n16["Llama a TelemetryClientErrorsReadRepository.fingerprints"]:::llamada
  n15 --> n16
  n17[("LEE telemetry.client_error_events")]:::efecto
  n16 --> n17
  n18["Llama a TelemetryAnalyticsRepository.webVitals"]:::llamada
  n17 --> n18
  n19["Llama a TelemetryAnalyticsRepository.rowInTenant"]:::llamada
  n18 --> n19
  n20["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n19 --> n20
  n21[("LEE telemetry.user_activity_events")]:::efecto
  n20 --> n21
  n22[("LEE telemetry.user_activity_events · LEE telemetry.session_journeys")]:::efecto
  n21 --> n22
  n23[("LEE telemetry.web_vitals · LEE telemetry.web_vitals")]:::efecto
  n22 --> n23
  n24(("200 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /admin/analytics/pipeline-health

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
  n10[("LEE telemetry.user_activity_events")]:::efecto
  n9 --> n10
  n11["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n10 --> n11
  n12[("LEE telemetry.user_activity_events")]:::efecto
  n11 --> n12
  n13[("LEE telemetry.client_contexts")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. GET /admin/analytics/sessions

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
  n10["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n9 --> n10
  n11[("LEE telemetry.user_activity_events")]:::efecto
  n10 --> n11
  n12[("LEE telemetry.session_journeys")]:::efecto
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

#### 8. GET /admin/analytics/sessions/{id}

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
  n5["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n4 --> n5
  n6[("LEE telemetry.user_activity_events")]:::efecto
  n5 --> n6
  n7[("LEE telemetry.session_journeys")]:::efecto
  n6 --> n7
  n8{"!session"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Sesión no encontrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a TelemetryAnalyticsRepository.sessionTimeline"]:::llamada
  n8 -->|"no"| n10
  n11[("LEE telemetry.user_activity_event_properties · LEE telemetry.user_activity_events")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. GET /admin/analytics/timeseries

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

#### 10. GET /admin/analytics/web-vitals

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
  n10["Llama a TelemetryAnalyticsRepository.rowInTenant"]:::llamada
  n9 --> n10
  n11["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n10 --> n11
  n12[("LEE telemetry.user_activity_events")]:::efecto
  n11 --> n12
  n13[("LEE telemetry.user_activity_events · LEE telemetry.session_journeys")]:::efecto
  n12 --> n13
  n14[("LEE telemetry.web_vitals · LEE telemetry.web_vitals")]:::efecto
  n13 --> n14
  n15["Llama a TelemetryAnalyticsRepository.webVitalsByRoute"]:::llamada
  n14 --> n15
  n16["Llama a TelemetryAnalyticsRepository.rowInTenant"]:::llamada
  n15 --> n16
  n17["Llama a TelemetryAnalyticsRepository.sessionInTenant"]:::llamada
  n16 --> n17
  n18[("LEE telemetry.user_activity_events")]:::efecto
  n17 --> n18
  n19[("LEE telemetry.user_activity_events · LEE telemetry.session_journeys")]:::efecto
  n18 --> n19
  n20[("LEE telemetry.web_vitals")]:::efecto
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

#### 11. POST /telemetry/activity-events

Capturar evento(s) de actividad consent-aware (batch)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Esquema de evento no encontrado; ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Journey de sesión no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión autenticada no está registrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryEventsService.captureActivityEvents"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TelemetryEventsService.actorSessionId"]:::llamada
  n4 --> n5
  n6["Llama a ActorSessionsRepository.findIdByToken"]:::llamada
  n5 --> n6
  n7[("LEE iam.sessions")]:::efecto
  n6 --> n7
  n8{"!id"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED La sesión autenticada no está registrada"]):::error
  n8 -->|"sí"| n9
  n10["Repite: por cada const item de dto.events"]:::bucle
  n8 -->|"no"| n10
  n11["Llama a ActivityEventSchemaDefinitionsRepository.findById"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE telemetry.activity_event_schema_definitions")]:::efecto
  n11 --> n12
  n13{"!schema"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Esquema de evento no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"item.analyticsSubjectId"}:::decision
  n13 -->|"no"| n15
  n16["Llama a TelemetryEventsService.assertOwnedSubject"]:::llamada
  n15 -->|"sí"| n16
  n17["Llama a AnalyticsSubjectsRepository.findById"]:::llamada
  n16 --> n17
  n18[("LEE telemetry.analytics_subjects")]:::efecto
  n17 --> n18
  n19{"!subject || subject.userId !== actor.id"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND Sujeto de analítica no encontrado"]):::error
  n19 -->|"sí"| n20
  n21["Llama a TelemetryEventsService.assertOwnedJourney"]:::llamada
  n19 -->|"no"| n21
  n15 -->|"no"| n21
  n22["Llama a SessionJourneysRepository.findById"]:::llamada
  n21 --> n22
  n23[("LEE telemetry.session_journeys")]:::efecto
  n22 --> n23
  n24["Llama a ActorSessionsRepository.belongsToUser"]:::llamada
  n23 --> n24
  n25[("LEE iam.sessions")]:::efecto
  n24 --> n25
  n26{"!journey || !(await this.sessionsRepo.belongsToUser(tx, journey.sessionId, actor.id))"}:::decision
  n25 --> n26
  n27(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n26 -->|"sí"| n27
  n28["Llama a TelemetryEventsService.purposeAllowsAnonymous"]:::llamada
  n26 -->|"no"| n28
  n29["Llama a TrackingPurposeDefinitionsRepository.findById"]:::llamada
  n28 --> n29
  n30[("LEE telemetry.tracking_purpose_definitions")]:::efecto
  n29 --> n30
  n31["Llama a TelemetryEventsService.consentAllows"]:::llamada
  n30 --> n31
  n32["Llama a TrackingConsentsRepository.findLatest"]:::llamada
  n31 --> n32
  n33[("LEE telemetry.tracking_consents")]:::efecto
  n32 --> n33
  n34{"anonymous && !isAnonymousSafeRouteTemplate(item.routeTemplate)"}:::decision
  n33 --> n34
  n35(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n34 -->|"sí"| n35
  n36{"item.eventIdempotencyKey"}:::decision
  n34 -->|"no"| n36
  n37["Llama a UserActivityEventsRepository.findByIdempotencyKey"]:::llamada
  n36 -->|"sí"| n37
  n38[("LEE telemetry.user_activity_events")]:::efecto
  n37 --> n38
  n39["Llama a TelemetryEventsService.validateProperties"]:::llamada
  n38 --> n39
  n36 -->|"no"| n39
  n40["Intenta"]:::intento
  n39 --> n40
  n41{"!(error instanceof EventPropertyRejection)"}:::decision
  n40 -->|"si falla"| n41
  n42(["↩ (relanza el error capturado)"]):::error
  n41 -->|"sí"| n42
  n43(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n41 -->|"no"| n43
  n44["Llama a TelemetryEventsService.openJourney"]:::llamada
  n40 --> n44
  n45["Llama a SessionJourneysRepository.findOpenBySession"]:::llamada
  n44 --> n45
  n46[("LEE telemetry.session_journeys")]:::efecto
  n45 --> n46
  n47["Llama a SessionJourneysRepository.create"]:::llamada
  n46 --> n47
  n48[("CREA telemetry.session_journeys")]:::efecto
  n47 --> n48
  n49{"anonymous"}:::decision
  n48 --> n49
  n50["Llama a UserActivityEventsRepository.insertAnonymous"]:::llamada
  n49 -->|"sí"| n50
  n51["Intenta"]:::intento
  n50 --> n51
  n52[("CREA telemetry.user_activity_events")]:::efecto
  n51 --> n52
  n53(["↩ (relanza el error capturado)"]):::error
  n51 -->|"si falla"| n53
  n54["Llama a UserActivityEventsRepository.create"]:::llamada
  n49 -->|"no"| n54
  n55[("CREA telemetry.user_activity_events")]:::efecto
  n54 --> n55
  n56["Repite: por cada const prop de properties"]:::bucle
  n52 --> n56
  n55 --> n56
  n57["Llama a UserActivityEventPropertiesRepository.create"]:::llamada
  n56 -->|"cada elemento"| n57
  n58[("CREA telemetry.user_activity_event_properties")]:::efecto
  n57 --> n58
  n59(("201 Responde con éxito")):::ok
  n58 --> n59
  n56 -->|"al terminar"| n59
  n10 -->|"al terminar"| n59
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /telemetry/client-contexts

Registrar contexto de cliente/dispositivo + journey

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Journey de sesión no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión autenticada no está registrada |
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
  n5["Llama a TelemetryEventsService.actorSessionId"]:::llamada
  n4 --> n5
  n6["Llama a ActorSessionsRepository.findIdByToken"]:::llamada
  n5 --> n6
  n7[("LEE iam.sessions")]:::efecto
  n6 --> n7
  n8{"!id"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED La sesión autenticada no está registrada"]):::error
  n8 -->|"sí"| n9
  n10{"dto.analyticsSubjectId"}:::decision
  n8 -->|"no"| n10
  n11["Llama a TelemetryEventsService.assertOwnedSubject"]:::llamada
  n10 -->|"sí"| n11
  n12["Llama a AnalyticsSubjectsRepository.findById"]:::llamada
  n11 --> n12
  n13[("LEE telemetry.analytics_subjects")]:::efecto
  n12 --> n13
  n14{"!subject || subject.userId !== actor.id"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Sujeto de analítica no encontrado"]):::error
  n14 -->|"sí"| n15
  n16["Llama a TelemetryEventsService.assertOwnedJourney"]:::llamada
  n14 -->|"no"| n16
  n10 -->|"no"| n16
  n17["Llama a SessionJourneysRepository.findById"]:::llamada
  n16 --> n17
  n18[("LEE telemetry.session_journeys")]:::efecto
  n17 --> n18
  n19["Llama a ActorSessionsRepository.belongsToUser"]:::llamada
  n18 --> n19
  n20[("LEE iam.sessions")]:::efecto
  n19 --> n20
  n21{"!journey || !(await this.sessionsRepo.belongsToUser(tx, journey.sessionId, actor.id))"}:::decision
  n20 --> n21
  n22(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n21 -->|"sí"| n22
  n23["Llama a TelemetryEventsService.openJourney"]:::llamada
  n21 -->|"no"| n23
  n24["Llama a SessionJourneysRepository.findOpenBySession"]:::llamada
  n23 --> n24
  n25[("LEE telemetry.session_journeys")]:::efecto
  n24 --> n25
  n26["Llama a SessionJourneysRepository.create"]:::llamada
  n25 --> n26
  n27[("CREA telemetry.session_journeys")]:::efecto
  n26 --> n27
  n28["Llama a ClientContextsRepository.create"]:::llamada
  n27 --> n28
  n29[("CREA telemetry.client_contexts")]:::efecto
  n28 --> n29
  n30(("201 Responde con éxito")):::ok
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /telemetry/client-errors



| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryClientErrorsService.ingest"]:::llamada
  n2 --> n3
  n4["Llama a TelemetryClientErrorsService.optionalActor"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6["Llama a SessionValidator.assertActive"]:::llamada
  n5 --> n6
  n7{"!payload.sid"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9[("LEE iam.sessions · LEE iam.users")]:::efecto
  n7 -->|"no"| n9
  n10{"rows.length === 0"}:::decision
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12["Llama a TelemetryClientErrorsRepository.sessionIdOf"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE iam.sessions")]:::efecto
  n12 --> n13
  n14["Llama a TelemetryClientErrorsRepository.insertMany"]:::llamada
  n13 --> n14
  n15[("CREA telemetry.client_error_events")]:::efecto
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

#### 14. POST /telemetry/conversion-events

Registrar evento de conversión con atribución

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Funnel no encontrado; ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Journey de sesión no encontrado; ResourceNotFoundException: Evento de actividad no encontrado |
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
  n9["Llama a TelemetryEventsService.assertOwnedSubject"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a AnalyticsSubjectsRepository.findById"]:::llamada
  n9 --> n10
  n11[("LEE telemetry.analytics_subjects")]:::efecto
  n10 --> n11
  n12{"!subject || subject.userId !== actor.id"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Sujeto de analítica no encontrado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a TelemetryEventsService.assertOwnedJourney"]:::llamada
  n12 -->|"no"| n14
  n15["Llama a SessionJourneysRepository.findById"]:::llamada
  n14 --> n15
  n16[("LEE telemetry.session_journeys")]:::efecto
  n15 --> n16
  n17["Llama a ActorSessionsRepository.belongsToUser"]:::llamada
  n16 --> n17
  n18[("LEE iam.sessions")]:::efecto
  n17 --> n18
  n19{"!journey || !(await this.sessionsRepo.belongsToUser(tx, journey.sessionId, actor.id))"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n19 -->|"sí"| n20
  n21{"dto.completionEventId"}:::decision
  n19 -->|"no"| n21
  n22["Llama a TelemetryEventsService.assertOwnedEvent"]:::llamada
  n21 -->|"sí"| n22
  n23["Llama a UserActivityEventsRepository.findById"]:::llamada
  n22 --> n23
  n24[("LEE telemetry.user_activity_events")]:::efecto
  n23 --> n24
  n25{"!event || event.userId !== actor.id"}:::decision
  n24 --> n25
  n26(["404 NOT_FOUND Evento de actividad no encontrado"]):::error
  n25 -->|"sí"| n26
  n27["Llama a ConversionEventsRepository.findExisting"]:::llamada
  n25 -->|"no"| n27
  n21 -->|"no"| n27
  n28[("LEE telemetry.conversion_events")]:::efecto
  n27 --> n28
  n29["Llama a ConversionEventsRepository.create"]:::llamada
  n28 --> n29
  n30[("CREA telemetry.conversion_events")]:::efecto
  n29 --> n30
  n31(("201 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /telemetry/disclosure-acceptances

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

#### 16. POST /telemetry/disclosure-versions

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

#### 17. POST /telemetry/event-schemas

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

#### 18. POST /telemetry/funnels

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

#### 19. POST /telemetry/retention/purge



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TelemetryRetentionService.purge"]:::llamada
  n2 --> n3
  n4[("LEE telemetry.tracking_purpose_definitions")]:::efecto
  n3 --> n4
  n5["Repite: por cada const purpose de purposes"]:::bucle
  n4 --> n5
  n6["Llama a TelemetryRetentionService.purgePurpose"]:::llamada
  n5 -->|"cada elemento"| n6
  n7["Repite: mientras batches ‹ maxBatches"]:::bucle
  n6 --> n7
  n8[("LEE telemetry.user_activity_events · LEE telemetry.activity_event_schema_definitions")]:::efecto
  n7 -->|"cada elemento"| n8
  n9["Transacción: transactional(…)"]:::transaccion
  n8 --> n9
  n10[("ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.web_vitals…")]:::efecto
  n9 --> n10
  n11["Llama a TelemetryRetentionService.purgeClientErrors"]:::llamada
  n10 --> n11
  n7 -->|"al terminar"| n11
  n5 -->|"al terminar"| n11
  n12["Repite: mientras batches ‹ maxBatches"]:::bucle
  n11 --> n12
  n13[("BORRA telemetry.client_error_events · LEE telemetry.client_error_events")]:::efecto
  n12 -->|"cada elemento"| n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  n12 -->|"al terminar"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /telemetry/session-journeys/{id}/close

Cerrar journey de sesión y consolidar métricas

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Journey de sesión no encontrado; ResourceNotFoundException: Evento de actividad no encontrado |
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
  n5["Llama a TelemetryEventsService.assertOwnedJourney"]:::llamada
  n4 --> n5
  n6["Llama a SessionJourneysRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE telemetry.session_journeys")]:::efecto
  n6 --> n7
  n8["Llama a ActorSessionsRepository.belongsToUser"]:::llamada
  n7 --> n8
  n9[("LEE iam.sessions")]:::efecto
  n8 --> n9
  n10{"!journey || !(await this.sessionsRepo.belongsToUser(tx, journey.sessionId, actor.id))"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n10 -->|"sí"| n11
  n12{"dto.exitEventId"}:::decision
  n10 -->|"no"| n12
  n13["Llama a TelemetryEventsService.assertOwnedEvent"]:::llamada
  n12 -->|"sí"| n13
  n14["Llama a UserActivityEventsRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE telemetry.user_activity_events")]:::efecto
  n14 --> n15
  n16{"!event || event.userId !== actor.id"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Evento de actividad no encontrado"]):::error
  n16 -->|"sí"| n17
  n18{"journey.journeyStatusConceptId === TELE.JOURNEY_CLOSED"}:::decision
  n16 -->|"no"| n18
  n12 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED El journey ya está cerrado"]):::error
  n18 -->|"sí"| n19
  n20[("ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_journeys")]:::efecto
  n18 -->|"no"| n20
  n21{"dto.exitEventId"}:::decision
  n20 --> n21
  n22[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n21 -->|"sí"| n22
  n23[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n22 --> n23
  n21 -->|"no"| n23
  n24{"dto.eventCount !== undefined"}:::decision
  n23 --> n24
  n25[("ACTUALIZA telemetry.session_journeys")]:::efecto
  n24 -->|"sí"| n25
  n26[("ACTUALIZA telemetry.session_journeys · ACTUALIZA telemetry.session_journeys")]:::efecto
  n25 --> n26
  n24 -->|"no"| n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /telemetry/tracking-consents

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

#### 22. POST /telemetry/tracking-consents/{id}/withdraw

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
  n7{"!consent || consent.userId !== actor.id"}:::decision
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

#### 23. POST /telemetry/tracking-purposes

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

#### 24. POST /telemetry/web-vitals

Registrar métricas Core Web Vitals por ruta (batch)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Journey de sesión no encontrado; ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Evento de actividad no encontrado; ResourceNotFoundException: Contexto de cliente no encontrado |
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
  n6["Llama a TelemetryEventsService.assertOwnedJourney"]:::llamada
  n5 -->|"cada elemento"| n6
  n7["Llama a SessionJourneysRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE telemetry.session_journeys")]:::efecto
  n7 --> n8
  n9["Llama a ActorSessionsRepository.belongsToUser"]:::llamada
  n8 --> n9
  n10[("LEE iam.sessions")]:::efecto
  n9 --> n10
  n11{"!journey || !(await this.sessionsRepo.belongsToUser(tx, journey.sessionId, actor.id))"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Journey de sesión no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a TelemetryEventsService.assertOwnedSubject"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a AnalyticsSubjectsRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE telemetry.analytics_subjects")]:::efecto
  n14 --> n15
  n16{"!subject || subject.userId !== actor.id"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Sujeto de analítica no encontrado"]):::error
  n16 -->|"sí"| n17
  n18["Llama a TelemetryEventsService.assertOwnedEvent"]:::llamada
  n16 -->|"no"| n18
  n19["Llama a UserActivityEventsRepository.findById"]:::llamada
  n18 --> n19
  n20[("LEE telemetry.user_activity_events")]:::efecto
  n19 --> n20
  n21{"!event || event.userId !== actor.id"}:::decision
  n20 --> n21
  n22(["404 NOT_FOUND Evento de actividad no encontrado"]):::error
  n21 -->|"sí"| n22
  n23["Llama a TelemetryEventsService.assertOwnedContext"]:::llamada
  n21 -->|"no"| n23
  n24["Llama a ClientContextsRepository.findById"]:::llamada
  n23 --> n24
  n25[("LEE telemetry.client_contexts")]:::efecto
  n24 --> n25
  n26["Llama a ActorSessionsRepository.belongsToUser"]:::llamada
  n25 --> n26
  n27[("LEE iam.sessions")]:::efecto
  n26 --> n27
  n28{"!context || !context.sessionId || !(await this.sessionsRepo.belongsToUser(tx, context.sessionId, actor.id))"}:::decision
  n27 --> n28
  n29(["404 NOT_FOUND Contexto de cliente no encontrado"]):::error
  n28 -->|"sí"| n29
  n30["Llama a WebVitalsRepository.create"]:::llamada
  n28 -->|"no"| n30
  n31[("CREA telemetry.web_vitals")]:::efecto
  n30 --> n31
  n32(("201 Responde con éxito")):::ok
  n31 --> n32
  n5 -->|"al terminar"| n32
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
| GET /admin/analytics/errors | 200, 401, 403, 429 | 4 |
| GET /admin/analytics/errors/fingerprints | 200, 401, 403, 429 | 3 |
| GET /admin/analytics/errors/fingerprints/{fingerprint} | 200, 401, 403, 429 | 3 |
| GET /admin/analytics/errors/routes-not-found | 200, 401, 403, 429 | 3 |
| GET /admin/analytics/funnels | 200, 401, 403, 429 | 3 |
| GET /admin/analytics/onboarding/funnel | 200, 401, 403, 429 | 0 |
| GET /admin/analytics/onboarding/heatmap | 200, 400, 401, 403, 429 | 0 |
| GET /admin/analytics/parts | 200, 401, 403, 429 | 5 |
| POST /telemetry/analytics-subjects | 201, 400, 401, 403, 429 | 2 |
| POST /telemetry/onboarding-events | 200, 400, 401, 429 | 0 |
| GET /telemetry/tracking-consents/me | 200, 400, 401, 403, 429 | 1 |
