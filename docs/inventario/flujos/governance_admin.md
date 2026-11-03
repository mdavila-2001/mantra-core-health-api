<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `governance_admin`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 5 (3 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [governance_admin](../endpoints/governance_admin.md)

## Proceso: governance_admin

- **Código:** `governance_admin` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 5
- **Actores:** AUDITOR · DATA_PLATFORM_ADMIN · DATA_STEWARD · DPO · GOVERNANCE_ADMIN · PLATFORM_ADMIN · SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** —

### Para qué sirve

_Sin fuente: ni el README del módulo ni el modelo lo describen._

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:AdminDataQualityController` | Operaciones de AdminDataQualityController que el README no asigna a un caso de uso | GET /admin/governance/data-quality/issues | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO · AUDITOR · DATA_STEWARD | BAJO | 3 |
|  |  | GET /admin/governance/data-quality/issues/{id} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO · AUDITOR · DATA_STEWARD | BAJO | 3 |
|  |  | POST /admin/governance/data-quality/issues/{id}/resolution | GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DATA_STEWARD · PLATFORM_ADMIN | MEDIO | 4 |
|  |  | GET /admin/governance/data-quality/rules | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO · AUDITOR · DATA_STEWARD | BAJO | 3 |
|  |  | GET /admin/governance/data-quality/rules/{id} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO · AUDITOR · DATA_STEWARD | BAJO | 5 |

### Diagrama — etapas `ctrl:AdminDataQualityController`

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_P…"]):::actor
  a8(["GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DATA_STEWARD · PLA…"]):::actor
  t3[("health_data.health_data_quality_issues")]:::tabla
  t4[("health_data.health_data_quality_rules")]:::tabla
  t5[("health_data.health_data_quality_runs")]:::tabla
  t10[("health_data.health_data_quality_rule_sets")]:::tabla
  t11[("terminology.catalog_concepts")]:::tabla
  subgraph s0["ctrl:AdminDataQualityController · Operaciones de AdminDataQualityController que…"]
    o1["GET /admin/governance/data-quality/issues"]:::op
    o6["GET /admin/governance/data-quality/issues/{id}"]:::op
    o7["POST /admin/governance/data-quality/issues/{id}/resolution"]:::op
    o9["GET /admin/governance/data-quality/rules"]:::op
    o12["GET /admin/governance/data-quality/rules/{id}"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  a2 --> o6
  o6 -->|"LEE"| t3
  o6 -->|"LEE"| t4
  o6 -->|"LEE"| t5
  a8 --> o7
  o7 -->|"ACTUALIZA"| t3
  o7 -->|"LEE"| t3
  o7 -->|"LEE"| t4
  o7 -->|"LEE"| t5
  a2 --> o9
  o9 -->|"LEE"| t10
  o9 -->|"LEE"| t4
  o9 -->|"LEE"| t11
  a2 --> o12
  o12 -->|"LEE"| t3
  o12 -->|"LEE"| t10
  o12 -->|"LEE"| t4
  o12 -->|"LEE"| t5
  o12 -->|"LEE"| t11
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/governance/data-quality/issues/{id}



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidencia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DataQualityService.getIssue"]:::llamada
  n2 --> n3
  n4["Llama a DataQualityRepository.findIssue"]:::llamada
  n3 --> n4
  n5[("LEE health_data.health_data_quality_issues · LEE health_data.health_data_quality_rules · LEE health_data.heal…")]:::efecto
  n4 --> n5
  n6{"!row"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Incidencia no encontrada"]):::error
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

#### 2. POST /admin/governance/data-quality/issues/{id}/resolution



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidencia no encontrada |
| 409 | `CONFLICT` | ConflictException: La incidencia ya no está abierta: otra persona la cerró con otro desenlace |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DataQualityService.resolve"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DataQualityRepository.closeIfOpen"]:::llamada
  n4 --> n5
  n6[("ACTUALIZA health_data.health_data_quality_issues")]:::efecto
  n5 --> n6
  n7["Llama a DataQualityRepository.findIssue"]:::llamada
  n6 --> n7
  n8[("LEE health_data.health_data_quality_issues · LEE health_data.health_data_quality_rules · LEE health_data.heal…")]:::efecto
  n7 --> n8
  n9{"!row"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Incidencia no encontrada"]):::error
  n9 -->|"sí"| n10
  n11(["409 CONFLICT La incidencia ya no está abierta: otra persona la cerró con otro desenlace"]):::error
  n9 -->|"no"| n11
  n12(("200 Responde con éxito")):::ok
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /admin/governance/data-quality/rules/{id}



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DataQualityService.getRule"]:::llamada
  n2 --> n3
  n4["Llama a DataQualityRepository.findRule"]:::llamada
  n3 --> n4
  n5[("LEE health_data.health_data_quality_rules · LEE health_data.health_data_quality_rule_sets · LEE terminology.c…")]:::efecto
  n4 --> n5
  n6{"!row"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Regla no encontrada"]):::error
  n6 -->|"sí"| n7
  n8["Llama a DataQualityRepository.issueCountsByStatus"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE health_data.health_data_quality_issues")]:::efecto
  n8 --> n9
  n10["Llama a DataQualityRepository.recentRuns"]:::llamada
  n9 --> n10
  n11[("LEE health_data.health_data_quality_runs · LEE terminology.catalog_concepts")]:::efecto
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
| GET /admin/governance/data-quality/issues | 200, 401, 403, 429 | 3 |
| GET /admin/governance/data-quality/rules | 200, 401, 403, 429 | 3 |
