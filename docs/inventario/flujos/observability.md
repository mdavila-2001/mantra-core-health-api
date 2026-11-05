<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `observability`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 14 (11 con decisiones propias, 3 sin ellas)
- Inventario de endpoints del módulo: [observability](../endpoints/observability.md)

## Proceso: observability — portal «Sistema» (módulo 70)

- **Código:** `observability` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 14
- **Actores:** GOVERNANCE_ADMIN · PLATFORM_ADMIN · RELEASE_MANAGER · SECURITY_ADMIN · SRE · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/observability/README.md`

### Para qué sirve

Captura **persistida** de peticiones HTTP, errores y consultas SQL de la API, y su lectura bajo `GET /admin/observability/*`. Es la parte «Sistema» del portal de observabilidad y gobierno (`docs/trabajo/2026-10-31-portal-observabilidad-gobierno/02-observabilidad-sistema.md` del front).

_Fuente: `src/modules/observability/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:ObservabilityController` | Operaciones de ObservabilityController que el README no asigna a un caso de uso | GET /admin/observability/coverage | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 1 |
|  |  | GET /admin/observability/endpoints | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 3 |
|  |  | GET /admin/observability/errors/events | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 2 |
|  |  | GET /admin/observability/errors/groups | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 3 |
|  |  | GET /admin/observability/errors/groups/{id} | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 3 |
|  |  | PATCH /admin/observability/errors/groups/{id} | PLATFORM_ADMIN · SRE | MEDIO | 2 |
|  |  | GET /admin/observability/modules | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 3 |
|  |  | GET /admin/observability/requests/{requestId} | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 2 |
|  |  | GET /admin/observability/sql/slow | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 2 |
|  |  | GET /admin/observability/sql/statements | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 3 |
|  |  | GET /admin/observability/sql/statements/{hash} | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 4 |
|  |  | GET /admin/observability/summary | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 4 |
|  |  | GET /admin/observability/timeseries | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 4 |
| `ctrl:ObservabilitySelftestController` | Operaciones de ObservabilitySelftestController que el README no asigna a un caso de uso | GET /internal/observability/selftest/fail | SYSTEM | BAJO | 0 |

### Diagrama — etapas `ctrl:ObservabilityController`, `ctrl:ObservabilitySelftestController`

```mermaid
flowchart LR
  a2(["PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · G…"]):::actor
  a12(["PLATFORM_ADMIN · SRE"]):::actor
  a24(["SYSTEM"]):::actor
  t3[("observability.instances")]:::tabla
  t5[("observability.error_groups")]:::tabla
  t6[("observability.http_request_minute_series")]:::tabla
  t8[("observability.error_events")]:::tabla
  t15[("observability.slow_request_samples")]:::tabla
  t18[("observability.sql_statement_minute_series")]:::tabla
  t19[("observability.sql_statements")]:::tabla
  subgraph s0["ctrl:ObservabilityController · Operaciones de ObservabilityController que el RE…"]
    o1["GET /admin/observability/coverage"]:::op
    o4["GET /admin/observability/endpoints"]:::op
    o7["GET /admin/observability/errors/events"]:::op
    o9["GET /admin/observability/errors/groups"]:::op
    o10["GET /admin/observability/errors/groups/{id}"]:::op
    o11["PATCH /admin/observability/errors/groups/{id}"]:::op
    o13["GET /admin/observability/modules"]:::op
    o14["GET /admin/observability/requests/{requestId}"]:::op
    o16["GET /admin/observability/sql/slow"]:::op
    o17["GET /admin/observability/sql/statements"]:::op
    o20["GET /admin/observability/sql/statements/{hash}"]:::op
    o21["GET /admin/observability/summary"]:::op
    o22["GET /admin/observability/timeseries"]:::op
  end
  subgraph s1["ctrl:ObservabilitySelftestController · Operaciones de ObservabilitySelftestCont…"]
    o23["GET /internal/observability/selftest/fail"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"LEE"| t5
  o4 -->|"LEE"| t6
  o4 -->|"LEE"| t3
  a2 --> o7
  o7 -->|"LEE"| t8
  o7 -->|"LEE"| t3
  a2 --> o9
  o9 -->|"LEE"| t8
  o9 -->|"LEE"| t5
  o9 -->|"LEE"| t3
  a2 --> o10
  o10 -->|"LEE"| t8
  o10 -->|"LEE"| t5
  o10 -->|"LEE"| t3
  a12 --> o11
  o11 -->|"ACTUALIZA"| t5
  o11 -->|"LEE"| t5
  a2 --> o13
  o13 -->|"LEE"| t5
  o13 -->|"LEE"| t6
  o13 -->|"LEE"| t3
  a2 --> o14
  o14 -->|"LEE"| t8
  o14 -->|"LEE"| t15
  a2 --> o16
  o16 -->|"LEE"| t3
  o16 -->|"LEE"| t15
  a2 --> o17
  o17 -->|"LEE"| t3
  o17 -->|"LEE"| t18
  o17 -->|"LEE"| t19
  a2 --> o20
  o20 -->|"LEE"| t3
  o20 -->|"LEE"| t15
  o20 -->|"LEE"| t18
  o20 -->|"LEE"| t19
  a2 --> o21
  o21 -->|"LEE"| t5
  o21 -->|"LEE"| t6
  o21 -->|"LEE"| t3
  o21 -->|"LEE"| t18
  a2 --> o22
  o22 -->|"LEE"| t8
  o22 -->|"LEE"| t6
  o22 -->|"LEE"| t3
  o22 -->|"LEE"| t18
  a24 --> o23
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/observability/endpoints

Operaciones por tráfico, fallos y latencia

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
  n3["Llama a ObservabilityReadService.endpoints"]:::llamada
  n2 --> n3
  n4["Llama a ObservabilityReadRepository.httpByEndpoint"]:::llamada
  n3 --> n4
  n5["Transacción: scoped(…)"]:::transaccion
  n4 --> n5
  n6[("LEE observability.http_request_minute_series")]:::efecto
  n5 --> n6
  n7["Llama a ObservabilityReadRepository.openGroupCounts"]:::llamada
  n6 --> n7
  n8["Transacción: scoped(…)"]:::transaccion
  n7 --> n8
  n9[("LEE observability.error_groups")]:::efecto
  n8 --> n9
  n10["Llama a ObservabilityReadService.pageSorted"]:::llamada
  n9 --> n10
  n11{"cursor"}:::decision
  n10 --> n11
  n12{"c.s !== sort || typeof c.v !== 'number' || typeof c.m !== 'string' || typeof c.r !== 'string'"}:::decision
  n11 -->|"sí"| n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14["Llama a ObservabilityReadService.envelope"]:::llamada
  n12 -->|"no"| n14
  n11 -->|"no"| n14
  n15["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n14 --> n15
  n16["Transacción: scoped(…)"]:::transaccion
  n15 --> n16
  n17[("LEE observability.instances · LEE observability.instances")]:::efecto
  n16 --> n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /admin/observability/errors/events

Eventos de error (sin mensajes), paginados

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
  n3["Llama a ObservabilityReadService.errorEvents"]:::llamada
  n2 --> n3
  n4{"query.requestId && !REQUEST_ID_PATTERN.test(query.requestId)"}:::decision
  n3 --> n4
  n5(["↩ (relanza el error capturado)"]):::error
  n4 -->|"sí"| n5
  n6{"query.cursor"}:::decision
  n4 -->|"no"| n6
  n7{"typeof c.t !== 'string' || typeof c.id !== 'string'"}:::decision
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ObservabilityReadRepository.listEvents"]:::llamada
  n7 -->|"no"| n9
  n6 -->|"no"| n9
  n10[("LEE observability.error_events")]:::efecto
  n9 --> n10
  n11["Llama a ObservabilityReadService.envelope"]:::llamada
  n10 --> n11
  n12["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n11 --> n12
  n13["Transacción: scoped(…)"]:::transaccion
  n12 --> n13
  n14[("LEE observability.instances · LEE observability.instances")]:::efecto
  n13 --> n14
  n15(("200 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /admin/observability/errors/groups

Grupos de errores (huella estable) con su actividad

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
  n3["Llama a ObservabilityReadService.errorGroups"]:::llamada
  n2 --> n3
  n4{"query.cursor"}:::decision
  n3 --> n4
  n5{"c.s !== sort || typeof c.v !== 'string' || typeof c.id !== 'string'"}:::decision
  n4 -->|"sí"| n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Llama a ObservabilityReadRepository.listErrorGroups"]:::llamada
  n5 -->|"no"| n7
  n4 -->|"no"| n7
  n8[("LEE observability.error_groups")]:::efecto
  n7 --> n8
  n9["Llama a ObservabilityReadRepository.groupActivity"]:::llamada
  n8 --> n9
  n10["Transacción: scoped(…)"]:::transaccion
  n9 --> n10
  n11[("LEE observability.error_events · LEE observability.error_events")]:::efecto
  n10 --> n11
  n12["Llama a ObservabilityReadService.envelope"]:::llamada
  n11 --> n12
  n13["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n12 --> n13
  n14["Transacción: scoped(…)"]:::transaccion
  n13 --> n14
  n15[("LEE observability.instances · LEE observability.instances")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /admin/observability/errors/groups/{id}

Un grupo de errores con sus eventos recientes

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ObservabilityReadService.errorGroup"]:::llamada
  n2 --> n3
  n4["Llama a ObservabilityReadRepository.getErrorGroup"]:::llamada
  n3 --> n4
  n5["Transacción: scoped(…)"]:::transaccion
  n4 --> n5
  n6[("LEE observability.error_groups")]:::efecto
  n5 --> n6
  n7{"!row"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ObservabilityReadRepository.groupActivity"]:::llamada
  n7 -->|"no"| n9
  n10["Transacción: scoped(…)"]:::transaccion
  n9 --> n10
  n11[("LEE observability.error_events · LEE observability.error_events")]:::efecto
  n10 --> n11
  n12["Llama a ObservabilityReadRepository.recentEvents"]:::llamada
  n11 --> n12
  n13[("LEE observability.error_events")]:::efecto
  n12 --> n13
  n14["Llama a ObservabilityReadRepository.eventsByModule"]:::llamada
  n13 --> n14
  n15[("LEE observability.error_events")]:::efecto
  n14 --> n15
  n16["Llama a ObservabilityReadRepository.groupSeries"]:::llamada
  n15 --> n16
  n17[("LEE observability.error_events")]:::efecto
  n16 --> n17
  n18["Llama a ObservabilityReadService.envelope"]:::llamada
  n17 --> n18
  n19["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n18 --> n19
  n20["Transacción: scoped(…)"]:::transaccion
  n19 --> n20
  n21[("LEE observability.instances · LEE observability.instances")]:::efecto
  n20 --> n21
  n22(("200 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. PATCH /admin/observability/errors/groups/{id}

Marcar un grupo como visto, resuelto o ignorado (con motivo y versión)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObservabilityReadService.changeGroupState"]:::llamada
  n2 --> n3
  n4["Llama a ObservabilityReadRepository.getErrorGroup"]:::llamada
  n3 --> n4
  n5["Transacción: scoped(…)"]:::transaccion
  n4 --> n5
  n6[("LEE observability.error_groups")]:::efecto
  n5 --> n6
  n7{"!current"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9{"Number(current.row_version) !== input.expectedVersion"}:::decision
  n7 -->|"no"| n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"errorGroupStateOf(String(current.state_concept_id)) === input.state"}:::decision
  n9 -->|"no"| n11
  n12(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n11 -->|"sí"| n12
  n13{"(input.state === 'RESOLVED' || input.state === 'IGNORED') && (note?.length ?? 0) ‹ 3"}:::decision
  n11 -->|"no"| n13
  n14(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ObservabilityReadRepository.changeState"]:::llamada
  n13 -->|"no"| n15
  n16["Transacción: transactional(…)"]:::transaccion
  n15 --> n16
  n17[("ACTUALIZA observability.error_groups")]:::efecto
  n16 --> n17
  n18{"!updated"}:::decision
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"sí"| n19
  n20(("200 Responde con éxito")):::ok
  n18 -->|"no"| n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /admin/observability/requests/{requestId}

Qué se guardó de una petición (errores y muestra lenta) por su requestId

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
  n3["Llama a ObservabilityReadService.request"]:::llamada
  n2 --> n3
  n4{"!REQUEST_ID_PATTERN.test(requestId)"}:::decision
  n3 --> n4
  n5(["↩ (relanza el error capturado)"]):::error
  n4 -->|"sí"| n5
  n6["Llama a ObservabilityReadRepository.byRequestId"]:::llamada
  n4 -->|"no"| n6
  n7["Transacción: scoped(…)"]:::transaccion
  n6 --> n7
  n8[("LEE observability.error_events · LEE observability.slow_request_samples")]:::efecto
  n7 --> n8
  n9(("200 Responde con éxito")):::ok
  n8 --> n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. GET /admin/observability/sql/slow

Peticiones lentas o con error muestreadas, con su SQL

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
  n3["Llama a ObservabilityReadService.sqlSlow"]:::llamada
  n2 --> n3
  n4{"query.cursor"}:::decision
  n3 --> n4
  n5{"typeof c.t !== 'string' || typeof c.id !== 'string'"}:::decision
  n4 -->|"sí"| n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Llama a ObservabilityReadRepository.listSlowSamples"]:::llamada
  n5 -->|"no"| n7
  n4 -->|"no"| n7
  n8[("LEE observability.slow_request_samples")]:::efecto
  n7 --> n8
  n9["Llama a ObservabilityReadService.envelope"]:::llamada
  n8 --> n9
  n10["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n9 --> n10
  n11["Transacción: scoped(…)"]:::transaccion
  n10 --> n11
  n12[("LEE observability.instances · LEE observability.instances")]:::efecto
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

#### 8. GET /admin/observability/sql/statements

Consultas SQL por coste (huella, nunca parámetros)

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
  n3["Llama a ObservabilityReadService.sqlStatements"]:::llamada
  n2 --> n3
  n4["Llama a ObservabilityReadRepository.sqlStatements"]:::llamada
  n3 --> n4
  n5["Transacción: scoped(…)"]:::transaccion
  n4 --> n5
  n6[("LEE observability.sql_statement_minute_series · LEE observability.sql_statements")]:::efecto
  n5 --> n6
  n7["Llama a ObservabilityReadService.pageSorted"]:::llamada
  n6 --> n7
  n8{"cursor"}:::decision
  n7 --> n8
  n9{"c.s !== sort || typeof c.v !== 'number' || typeof c.m !== 'string' || typeof c.r !== 'string'"}:::decision
  n8 -->|"sí"| n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ObservabilityReadService.envelope"]:::llamada
  n9 -->|"no"| n11
  n8 -->|"no"| n11
  n12["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n11 --> n12
  n13["Transacción: scoped(…)"]:::transaccion
  n12 --> n13
  n14[("LEE observability.instances · LEE observability.instances")]:::efecto
  n13 --> n14
  n15(("200 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. GET /admin/observability/sql/statements/{hash}

Una consulta normalizada y quién la dispara

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY}; DomainException: {HttpStatus.NOT_FOUND} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ObservabilityReadService.sqlStatement"]:::llamada
  n2 --> n3
  n4{"!HASH_PATTERN.test(hash)"}:::decision
  n3 --> n4
  n5(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n4 -->|"sí"| n5
  n6["Llama a ObservabilityReadRepository.sqlStatement"]:::llamada
  n4 -->|"no"| n6
  n7["Transacción: scoped(…)"]:::transaccion
  n6 --> n7
  n8[("LEE observability.sql_statements")]:::efecto
  n7 --> n8
  n9{"!statement"}:::decision
  n8 --> n9
  n10(["500 INTERNAL {HttpStatus.NOT_FOUND}"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ObservabilityReadRepository.sqlStatementSeries"]:::llamada
  n9 -->|"no"| n11
  n12["Transacción: scoped(…)"]:::transaccion
  n11 --> n12
  n13[("LEE observability.sql_statement_minute_series")]:::efecto
  n12 --> n13
  n14["Llama a ObservabilityReadRepository.sqlStatementOperations"]:::llamada
  n13 --> n14
  n15["Transacción: scoped(…)"]:::transaccion
  n14 --> n15
  n16[("LEE observability.sql_statement_minute_series")]:::efecto
  n15 --> n16
  n17["Llama a ObservabilityReadRepository.slowSamplesOfStatement"]:::llamada
  n16 --> n17
  n18[("LEE observability.slow_request_samples")]:::efecto
  n17 --> n18
  n19["Llama a ObservabilityReadService.envelope"]:::llamada
  n18 --> n19
  n20["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n19 --> n20
  n21["Transacción: scoped(…)"]:::transaccion
  n20 --> n21
  n22[("LEE observability.instances · LEE observability.instances")]:::efecto
  n21 --> n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. GET /admin/observability/timeseries

Serie temporal de una métrica (un cubo sin fila es «sin dato»)

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
  n3["Llama a ObservabilityReadService.timeseries"]:::llamada
  n2 --> n3
  n4{"groupBy !== 'none' && !additive.has(metric)"}:::decision
  n3 --> n4
  n5(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n4 -->|"sí"| n5
  n6{"groupBy === 'status_class' && metric !== 'requests'"}:::decision
  n4 -->|"no"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8{"[ 'requests', 'errors4xx', 'errors5xx', 'latency_p95', 'latency_p99', ].includes(metric)"}:::decision
  n6 -->|"no"| n8
  n9["Llama a ObservabilityReadRepository.httpSeries"]:::llamada
  n8 -->|"sí"| n9
  n10["Transacción: scoped(…)"]:::transaccion
  n9 --> n10
  n11[("LEE observability.http_request_minute_series")]:::efecto
  n10 --> n11
  n12{"metric === 'sql_ms' || metric === 'sql_slow'"}:::decision
  n8 -->|"no"| n12
  n13["Llama a ObservabilityReadRepository.sqlSeries"]:::llamada
  n12 -->|"sí"| n13
  n14["Transacción: scoped(…)"]:::transaccion
  n13 --> n14
  n15[("LEE observability.sql_statement_minute_series")]:::efecto
  n14 --> n15
  n16{"metric === 'error_events'"}:::decision
  n12 -->|"no"| n16
  n17["Llama a ObservabilityReadRepository.listEventBuckets"]:::llamada
  n16 -->|"sí"| n17
  n18["Transacción: scoped(…)"]:::transaccion
  n17 --> n18
  n19[("LEE observability.error_events")]:::efecto
  n18 --> n19
  n20["Llama a ObservabilityReadService.envelope"]:::llamada
  n11 --> n20
  n15 --> n20
  n19 --> n20
  n16 -->|"no"| n20
  n21["Llama a ObservabilityReadRepository.instanceActivity"]:::llamada
  n20 --> n21
  n22["Transacción: scoped(…)"]:::transaccion
  n21 --> n22
  n23[("LEE observability.instances · LEE observability.instances")]:::efecto
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

#### 11. GET /internal/observability/selftest/fail



| HTTP | Código | Cuándo |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | TypeError: no se puede leer {String(holder.value.deep)}; Error: selftest: falla controlada |
| 500 | — | Éxito |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"process.env.NODE_ENV === 'production'"}:::decision
  n2 --> n3
  n4(["404 NOT_FOUND NotFoundException"]):::error
  n3 -->|"sí"| n4
  n5{"query.kind === 'type'"}:::decision
  n3 -->|"no"| n5
  n6(["500 INTERNAL no se puede leer {String(holder.value.deep)}"]):::error
  n5 -->|"sí"| n6
  n7(["500 INTERNAL selftest: falla controlada"]):::error
  n5 -->|"no"| n7
  n8(("500 Responde con éxito")):::ok
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
| GET /admin/observability/coverage | 200, 401, 403, 429 | 1 |
| GET /admin/observability/modules | 200, 401, 403, 429 | 3 |
| GET /admin/observability/summary | 200, 401, 403, 429 | 4 |
