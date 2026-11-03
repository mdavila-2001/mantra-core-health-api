<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `app`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 6 (2 con decisiones propias, 4 sin ellas)
- Inventario de endpoints del módulo: [app](../endpoints/app.md)

## Proceso: app

- **Código:** `app` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 6
- **Actores:** Cualquier sesión válida · PLATFORM_ADMIN · Público (sin sesión) · SECURITY_ADMIN · SRE
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** —

### Para qué sirve

_Sin fuente: ni el README del módulo ni el modelo lo describen._

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:AppController` | Operaciones de AppController que el README no asigna a un caso de uso | GET / | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /health | Público (sin sesión) | BAJO | 0 |
|  |  | GET /liveness | Público (sin sesión) | BAJO | 0 |
|  |  | GET /readiness | Público (sin sesión) | BAJO | 1 |
| `ctrl:DataSourcesController` | Operaciones de DataSourcesController que el README no asigna a un caso de uso | GET /health/data-sources | PLATFORM_ADMIN · SRE · SECURITY_ADMIN | BAJO | 0 |
|  |  | GET /health/data-sources/metrics | PLATFORM_ADMIN · SRE · SECURITY_ADMIN | BAJO | 0 |

### Diagrama — etapas `ctrl:AppController`, `ctrl:DataSourcesController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a4(["Público (sin sesión)"]):::actor
  a9(["PLATFORM_ADMIN · SRE · SECURITY_ADMIN"]):::actor
  t7[("terminology.catalog_concepts")]:::tabla
  subgraph s0["ctrl:AppController · Operaciones de AppController que el README no asigna a un…"]
    o1["GET /"]:::op
    o3["GET /health"]:::op
    o5["GET /liveness"]:::op
    o6["GET /readiness"]:::op
  end
  subgraph s1["ctrl:DataSourcesController · Operaciones de DataSourcesController que el README…"]
    o8["GET /health/data-sources"]:::op
    o10["GET /health/data-sources/metrics"]:::op
  end
  a2 --> o1
  a4 --> o3
  a4 --> o5
  a4 --> o6
  o6 -->|"LEE"| t7
  a9 --> o8
  a9 --> o10
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /health/data-sources

Estado y enrutado de las fuentes de datos (requiere autenticación)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DataSourceConfigurationError: No hay ninguna conexión registrada como «{name}». Registradas: {known}. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DataSourcesHealthService.report"]:::llamada
  n2 --> n3
  n4["Llama a ConnectionRegistry.healthCheckAll"]:::llamada
  n3 --> n4
  n5["Llama a ConnectionRegistry.get"]:::llamada
  n4 --> n5
  n6{"!connection"}:::decision
  n5 --> n6
  n7(["500 INTERNAL No hay ninguna conexión registrada como «{name}». Registradas: {known}."]):::error
  n6 -->|"sí"| n7
  n8["Repite: forEach(…)"]:::bucle
  n6 -->|"no"| n8
  n9["Llama a ConnectionRegistry.get"]:::llamada
  n8 -->|"cada elemento"| n9
  n10{"!connection"}:::decision
  n9 --> n10
  n11(["500 INTERNAL No hay ninguna conexión registrada como «{name}». Registradas: {known}."]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  n8 -->|"al terminar"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /readiness

Sonda de readiness de dependencias obligatorias

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | SchemaIntegrityIncompleteError: Integridad del esquema incompleta: {report?.blockingCount ?? 0} restricciones sin aplicar; SeedCoreIncompleteError: Seeds núcleo fallidos: {failed.join(', ')}; SeedCoreIncompleteError: Catálogo de conceptos sin materializar: faltan {ids.length - present} de {ids.length}; Error: Redis no respondió PONG; Error: OpenSearch está en estado red; Error: El rol de runtime {violations.join('; ')}: las políticas no aíslan nada |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AppReadinessService.check"]:::llamada
  n2 --> n3
  n4["Llama a AppReadinessService.collect"]:::llamada
  n3 --> n4
  n5["Transacción: probe(…)"]:::transaccion
  n4 --> n5
  n6["Llama a AppReadinessService.checkSchemaIntegrity"]:::llamada
  n5 --> n6
  n7{"this.schemaIntegrity && !this.schemaIntegrity.isComplete()"}:::decision
  n6 --> n7
  n8(["500 INTERNAL Integridad del esquema incompleta: {report?.blockingCount ?? 0} restricciones sin aplicar"]):::error
  n7 -->|"sí"| n8
  n9["Llama a AppReadinessService.checkSeedCore"]:::llamada
  n7 -->|"no"| n9
  n10{"failed.length › 0"}:::decision
  n9 --> n10
  n11(["500 INTERNAL Seeds núcleo fallidos: {failed.join(', ')}"]):::error
  n10 -->|"sí"| n11
  n12[("LEE terminology.catalog_concepts")]:::efecto
  n10 -->|"no"| n12
  n13{"present ‹ ids.length"}:::decision
  n12 --> n13
  n14(["500 INTERNAL Catálogo de conceptos sin materializar: faltan {ids.length - present} de {ids.length}"]):::error
  n13 -->|"sí"| n14
  n15["Llama a RedisRuntimeService.ping"]:::llamada
  n13 -->|"no"| n15
  n16{"response !== 'PONG'"}:::decision
  n15 --> n16
  n17(["500 INTERNAL Redis no respondió PONG"]):::error
  n16 -->|"sí"| n17
  n18["Llama a SearchIndexService.ping"]:::llamada
  n16 -->|"no"| n18
  n19{"response.body.status === 'red'"}:::decision
  n18 --> n19
  n20(["500 INTERNAL OpenSearch está en estado red"]):::error
  n19 -->|"sí"| n20
  n21["Llama a AppReadinessService.checkRls"]:::llamada
  n19 -->|"no"| n21
  n22{"violations.length › 0"}:::decision
  n21 --> n22
  n23(["500 INTERNAL El rol de runtime {violations.join('; ')}: las políticas no aíslan nada"]):::error
  n22 -->|"sí"| n23
  n24{"Object.values(checks).some((check) =› check.status === 'down')"}:::decision
  n22 -->|"no"| n24
  n25(["↩ (relanza el error capturado)"]):::error
  n24 -->|"sí"| n25
  n26(("200 Responde con éxito")):::ok
  n24 -->|"no"| n26
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
| GET / | 200, 401, 403, 429 | 0 |
| GET /health | 200, 401, 429 | 0 |
| GET /health/data-sources/metrics | 200, 401, 403, 429 | 0 |
| GET /liveness | 200, 401, 429 | 0 |
