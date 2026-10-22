<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `ops_console`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 9 (3 con decisiones propias, 6 sin ellas)
- Inventario de endpoints del módulo: [ops_console](../endpoints/ops_console.md)

## Proceso: Operations console module

- **Código:** `ops_console` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 9
- **Actores:** GOVERNANCE_ADMIN · PLATFORM_ADMIN · RELEASE_MANAGER · SECURITY_ADMIN · SRE
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/ops_console/README.md`

### Para qué sirve

Esta carpeta contiene las consultas de la consola global de operaciones: readiness, incidentes, despliegues, cambios, SLO y respaldos. Sus rutas son de sólo lectura y están reservadas a roles operativos de plataforma.

_Fuente: `src/modules/ops_console/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:OpsConsoleController` | Operaciones de OpsConsoleController que el README no asigna a un caso de uso | GET /admin/ops/backups | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 2 |
|  |  | GET /admin/ops/change-requests | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 1 |
|  |  | GET /admin/ops/deployments | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 2 |
|  |  | GET /admin/ops/incidents | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 2 |
|  |  | GET /admin/ops/incidents/{id} | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 3 |
|  |  | GET /admin/ops/readiness | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 14 |
|  |  | GET /admin/ops/slos | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 3 |
|  |  | GET /admin/ops/traffic | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 2 |
|  |  | GET /admin/ops/traffic/endpoints | PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · GOVERNANCE_ADMIN | BAJO | 1 |

### Diagrama — etapas `ctrl:OpsConsoleController`

```mermaid
flowchart LR
  a2(["PLATFORM_ADMIN · SRE · SECURITY_ADMIN · RELEASE_MANAGER · G…"]):::actor
  t3[("system_ops.backup_policies")]:::tabla
  t4[("system_ops.restore_test_runs")]:::tabla
  t6[("platform_ops.change_requests")]:::tabla
  t8[("platform_ops.deployments")]:::tabla
  t9[("platform_ops.service_components")]:::tabla
  t11[("platform_ops.health_incidents")]:::tabla
  t13[("platform_ops.incident_timeline_events")]:::tabla
  t15[("data_catalog.catalog_annotations")]:::tabla
  t16[("data_catalog.catalog_objects")]:::tabla
  t17[("data_catalog.catalog_scan_runs")]:::tabla
  t20[("platform_ops.service_level_indicators")]:::tabla
  t21[("platform_ops.service_level_objectives")]:::tabla
  t22[("platform_ops.slo_measurements")]:::tabla
  t24[("iam.sessions")]:::tabla
  t25[("time_series.service_sli_series")]:::tabla
  t18[("+8 tablas más")]
  subgraph s0["ctrl:OpsConsoleController · Operaciones de OpsConsoleController que el README n…"]
    o1["GET /admin/ops/backups"]:::op
    o5["GET /admin/ops/change-requests"]:::op
    o7["GET /admin/ops/deployments"]:::op
    o10["GET /admin/ops/incidents"]:::op
    o12["GET /admin/ops/incidents/{id}"]:::op
    o14["GET /admin/ops/readiness"]:::op
    o19["GET /admin/ops/slos"]:::op
    o23["GET /admin/ops/traffic"]:::op
    o26["GET /admin/ops/traffic/endpoints"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"LEE"| t6
  a2 --> o7
  o7 -->|"LEE"| t8
  o7 -->|"LEE"| t9
  a2 --> o10
  o10 -->|"LEE"| t11
  o10 -->|"LEE"| t9
  a2 --> o12
  o12 -->|"LEE"| t11
  o12 -->|"LEE"| t13
  o12 -->|"LEE"| t9
  a2 --> o14
  o14 -->|"LEE"| t15
  o14 -->|"LEE"| t16
  o14 -->|"LEE"| t17
  o14 -->|"LEE"| t8
  o14 -->|"LEE"| t11
  o14 -->|"LEE"| t9
  o14 -.-> t18
  a2 --> o19
  o19 -->|"LEE"| t20
  o19 -->|"LEE"| t21
  o19 -->|"LEE"| t22
  a2 --> o23
  o23 -->|"LEE"| t24
  o23 -->|"LEE"| t25
  a2 --> o26
  o26 -->|"LEE"| t25
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/ops/incidents/{id}

Incidente con su timeline

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OpsConsoleService.getIncident"]:::llamada
  n2 --> n3
  n4["Llama a OpsConsoleRepository.findIncident"]:::llamada
  n3 --> n4
  n5[("LEE platform_ops.health_incidents · LEE platform_ops.service_components · LEE platform_ops.incident_timeline_…")]:::efecto
  n4 --> n5
  n6{"!found"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Incidente no encontrado"]):::error
  n6 -->|"sí"| n7
  n8(("200 Responde con éxito")):::ok
  n6 -->|"no"| n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /admin/ops/traffic

Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos

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
  n3["Llama a OpsTrafficService.traffic"]:::llamada
  n2 --> n3
  n4["Llama a OpsTrafficService.resolveWindow"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a OpsTrafficRepository.readWindow"]:::llamada
  n5 --> n9
  n10["Transacción: scoped(…)"]:::transaccion
  n9 --> n10
  n11[("LEE time_series.service_sli_series · LEE time_series.service_sli_series · LEE time_series.service_sli_series…")]:::efecto
  n10 --> n11
  n12["Llama a OpsTrafficRepository.readActiveUsers"]:::llamada
  n11 --> n12
  n13[("LEE iam.sessions")]:::efecto
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

#### 3. GET /admin/ops/traffic/endpoints

Endpoints tocados en la ventana, por plantilla de ruta

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
  n3["Llama a OpsTrafficService.endpoints"]:::llamada
  n2 --> n3
  n4["Llama a OpsTrafficService.resolveWindow"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6{"error instanceof WindowError"}:::decision
  n5 -->|"si falla"| n6
  n7(["500 INTERNAL {HttpStatus.UNPROCESSABLE_ENTITY}"]):::error
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n6 -->|"no"| n8
  n9["Llama a OpsTrafficRepository.readEndpoints"]:::llamada
  n5 --> n9
  n10["Transacción: scoped(…)"]:::transaccion
  n9 --> n10
  n11[("LEE time_series.service_sli_series · LEE time_series.service_sli_series")]:::efecto
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

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| GET /admin/ops/backups | 200, 401, 403, 429 | 2 |
| GET /admin/ops/change-requests | 200, 401, 403, 429 | 1 |
| GET /admin/ops/deployments | 200, 401, 403, 429 | 2 |
| GET /admin/ops/incidents | 200, 401, 403, 429 | 2 |
| GET /admin/ops/readiness | 200, 401, 403, 429 | 14 |
| GET /admin/ops/slos | 200, 401, 403, 429 | 3 |
