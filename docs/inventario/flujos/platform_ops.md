<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `platform_ops`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 15 (15 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [platform_ops](../endpoints/platform_ops.md)

## Proceso: Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases

- **Código:** `platform_ops` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 15
- **Actores:** CAPACITY_PLANNER · CHANGE_APPROVER · DEPLOY_PIPELINE · INCIDENT_COMMANDER · PLATFORM_ADMIN · RELEASE_MANAGER · SRE · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/platform_ops/README.md`

### Para qué sirve

Solicitudes de cambio con aprobación del CAB, artefactos inmutables, despliegues con reversión, health checks que derivan incidentes, ciclo de vida del incidente con timeline append-only, postmortems, SLO y presupuesto de error con congelamiento de despliegues, capacidad, revisiones de preparación, runbooks versionados y ejercicios de resiliencia.

_Fuente: `src/modules/platform_ops/README.md:3`_

### Flujo general declarado en el README

```text
cambio (requested)
   ├─ approvals ──> in_review ──> approved   (rechazo ⇒ rejected, y ahí acaba)
   │
artefacto (inmutable, direccionado por contenido)
   │
deployments  [puertas: cambio approved · ORR "go" en producción · sin congelamiento]
   ├─ en curso ─────────────> succeeded ⇒ pasa a vigente y el cambio queda implementado
   └─ failed ───────────────> el vigente no cambia de manos
        └─ rollback ────────> despliegue nuevo al artefacto estable + el fallido a rolled_back

health-checks/:id/runs
   └─ N fallos consecutivos ⇒ incidente open (uno solo mientras siga vivo)
        └─ PATCH incidents ──> acknowledged ──> mitigated ──> resolved
             └─ postmortem ──> acciones + mejoras en el backlog

slo/:id/measurements ──> pass | warn | fail
   └─ error-budget/burn-events ──> warning | critical | exhausted
        └─ exhausted + política que congela ⇒ los despliegues quedan bloqueados

capacity-plans/:id/measurements ──> utilización; cruzar el guardrail permite recomputar el plan
readiness-reviews/:id/complete ──> go | no_go; lo abierto pasa al backlog
runbooks/:id/versions ──> versión inmutable y vigente; runbook-executions deja rastro
resilience-exercises/:id/complete ──> pass | fail derivado del objetivo de recuperación
```

_Fuente: `src/modules/platform_ops/README.md:45`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-46-01` | Registrar solicitud de cambio | POST /ops/change-requests | RELEASE_MANAGER · PLATFORM_ADMIN | MEDIO | 4 |
| `UC-46-02` | Decisión del CAB, multi-paso | POST /ops/change-requests/{id}/approvals | CHANGE_APPROVER · PLATFORM_ADMIN | MEDIO | 4 |
| `UC-46-03` | Publicar artefacto inmutable | POST /ops/artifacts | DEPLOY_PIPELINE · RELEASE_MANAGER · PLATFORM_ADMIN | MEDIO | 4 |
| `UC-46-04` | Ejecutar despliegue con puertas | POST /ops/deployments | RELEASE_MANAGER · DEPLOY_PIPELINE · PLATFORM_ADMIN | MEDIO | 9 |
| `UC-46-05` | Revertir despliegue | POST /ops/deployments/{id}/rollback | SRE · RELEASE_MANAGER · PLATFORM_ADMIN | MEDIO | 3 |
| `UC-46-06` | Corrida y derivación de incidente | POST /ops/health-checks/{id}/runs | SYSTEM · SRE · PLATFORM_ADMIN | MEDIO | 6 |
| `UC-46-07` | Ciclo de vida del incidente | PATCH /ops/incidents/{id} | INCIDENT_COMMANDER · SRE · PLATFORM_ADMIN | MEDIO | 7 |
| `UC-46-08` | Postmortem y acciones | POST /ops/incidents/{id}/postmortem | SRE · INCIDENT_COMMANDER · PLATFORM_ADMIN | MEDIO | 5 |
| `UC-46-09` | Medición de ventana SLO | POST /ops/slo/{id}/measurements | SYSTEM · SRE · PLATFORM_ADMIN | MEDIO | 3 |
| `UC-46-10` | Quema y congelamiento | POST /ops/error-budget/{policyId}/burn-events | SYSTEM · SRE · PLATFORM_ADMIN | MEDIO | 3 |
| `UC-46-11` | Medición de capacidad | POST /ops/capacity-plans/{id}/measurements | CAPACITY_PLANNER · SRE · PLATFORM_ADMIN | MEDIO | 3 |
| `UC-46-12` | Cerrar revisión de preparación | POST /ops/readiness-reviews/{id}/complete | RELEASE_MANAGER · PLATFORM_ADMIN | MEDIO | 4 |
| `UC-46-13` | Versión y ejecución de runbook | POST /ops/runbook-executions | SRE · PLATFORM_ADMIN | MEDIO | 4 |
|  |  | POST /ops/runbooks/{id}/versions | SRE · PLATFORM_ADMIN | MEDIO | 4 |
| `UC-46-14` | Cerrar ejercicio de resiliencia | POST /ops/resilience-exercises/{id}/complete | SRE · PLATFORM_ADMIN | MEDIO | 4 |

### Diagrama — etapas `UC-46-01`, `UC-46-02`, `UC-46-03`…

```mermaid
flowchart LR
  a2(["RELEASE_MANAGER · PLATFORM_ADMIN"]):::actor
  a7(["CHANGE_APPROVER · PLATFORM_ADMIN"]):::actor
  a10(["DEPLOY_PIPELINE · RELEASE_MANAGER · PLATFORM_ADMIN"]):::actor
  a14(["RELEASE_MANAGER · DEPLOY_PIPELINE · PLATFORM_ADMIN"]):::actor
  a18(["SRE · RELEASE_MANAGER · PLATFORM_ADMIN"]):::actor
  a20(["SYSTEM · SRE · PLATFORM_ADMIN"]):::actor
  a26(["INCIDENT_COMMANDER · SRE · PLATFORM_ADMIN"]):::actor
  a31(["SRE · INCIDENT_COMMANDER · PLATFORM_ADMIN"]):::actor
  a42(["CAPACITY_PLANNER · SRE · PLATFORM_ADMIN"]):::actor
  a49(["SRE · PLATFORM_ADMIN"]):::actor
  t3[("platform_ops.change_requests")]:::tabla
  t4[("platform_ops.maintenance_windows")]:::tabla
  t5[("platform_ops.service_components")]:::tabla
  t8[("platform_ops.change_approvals")]:::tabla
  t11[("platform_ops.artifacts")]:::tabla
  t12[("platform_ops.tool_registry")]:::tabla
  t15[("platform_ops.deployments")]:::tabla
  t21[("platform_ops.health_check_runs")]:::tabla
  t22[("platform_ops.health_checks")]:::tabla
  t23[("platform_ops.health_incidents")]:::tabla
  t24[("platform_ops.incident_timeline_events")]:::tabla
  t27[("platform_ops.incident_communications")]:::tabla
  t28[("platform_ops.incident_responders")]:::tabla
  t32[("platform_ops.operational_improvement_items")]:::tabla
  t33[("platform_ops.postmortem_action_items")]:::tabla
  t34[("platform_ops.postmortems")]:::tabla
  t36[("platform_ops.service_level_objectives")]:::tabla
  t37[("platform_ops.slo_measurements")]:::tabla
  t39[("platform_ops.error_budget_burn_events")]:::tabla
  t40[("platform_ops.error_budget_policies")]:::tabla
  t43[("platform_ops.capacity_measurements")]:::tabla
  t44[("platform_ops.capacity_plans")]:::tabla
  t46[("platform_ops.operational_readiness_reviews")]:::tabla
  t47[("platform_ops.readiness_review_findings")]:::tabla
  t50[("platform_ops.runbook_executions")]:::tabla
  t51[("platform_ops.runbook_versions")]:::tabla
  t53[("platform_ops.runbooks")]:::tabla
  t55[("platform_ops.recovery_objectives")]:::tabla
  t56[("platform_ops.resilience_exercises")]:::tabla
  subgraph s0["UC-46-01 · Registrar solicitud de cambio"]
    o1["POST /ops/change-requests"]:::op
  end
  subgraph s1["UC-46-02 · Decisión del CAB, multi-paso"]
    o6["POST /ops/change-requests/{id}/approvals"]:::op
  end
  subgraph s2["UC-46-03 · Publicar artefacto inmutable"]
    o9["POST /ops/artifacts"]:::op
  end
  t16[("+3 tablas más")]
  subgraph s3["UC-46-04 · Ejecutar despliegue con puertas"]
    o13["POST /ops/deployments"]:::op
  end
  subgraph s4["UC-46-05 · Revertir despliegue"]
    o17["POST /ops/deployments/{id}/rollback"]:::op
  end
  subgraph s5["UC-46-06 · Corrida y derivación de incidente"]
    o19["POST /ops/health-checks/{id}/runs"]:::op
  end
  t29[("+1 tablas más")]
  subgraph s6["UC-46-07 · Ciclo de vida del incidente"]
    o25["PATCH /ops/incidents/{id}"]:::op
  end
  subgraph s7["UC-46-08 · Postmortem y acciones"]
    o30["POST /ops/incidents/{id}/postmortem"]:::op
  end
  subgraph s8["UC-46-09 · Medición de ventana SLO"]
    o35["POST /ops/slo/{id}/measurements"]:::op
  end
  subgraph s9["UC-46-10 · Quema y congelamiento"]
    o38["POST /ops/error-budget/{policyId}/burn-events"]:::op
  end
  subgraph s10["UC-46-11 · Medición de capacidad"]
    o41["POST /ops/capacity-plans/{id}/measurements"]:::op
  end
  subgraph s11["UC-46-12 · Cerrar revisión de preparación"]
    o45["POST /ops/readiness-reviews/{id}/complete"]:::op
  end
  subgraph s12["UC-46-13 · Versión y ejecución de runbook"]
    o48["POST /ops/runbook-executions"]:::op
    o52["POST /ops/runbooks/{id}/versions"]:::op
  end
  subgraph s13["UC-46-14 · Cerrar ejercicio de resiliencia"]
    o54["POST /ops/resilience-exercises/{id}/complete"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  a7 --> o6
  o6 -->|"CREA"| t8
  o6 -->|"LEE"| t8
  o6 -->|"ACTUALIZA"| t3
  o6 -->|"LEE"| t3
  a10 --> o9
  o9 -->|"CREA"| t11
  o9 -->|"LEE"| t11
  o9 -->|"LEE"| t5
  o9 -->|"LEE"| t12
  a14 --> o13
  o13 -->|"LEE"| t11
  o13 -->|"ACTUALIZA"| t3
  o13 -->|"LEE"| t3
  o13 -->|"ACTUALIZA"| t15
  o13 -->|"CREA"| t15
  o13 -->|"LEE"| t15
  o13 -.-> t16
  a18 --> o17
  o17 -->|"ACTUALIZA"| t15
  o17 -->|"CREA"| t15
  o17 -->|"LEE"| t15
  a20 --> o19
  o19 -->|"CREA"| t21
  o19 -->|"LEE"| t21
  o19 -->|"LEE"| t22
  o19 -->|"CREA"| t23
  o19 -->|"LEE"| t23
  o19 -->|"CREA"| t24
  a26 --> o25
  o25 -->|"ACTUALIZA"| t23
  o25 -->|"LEE"| t23
  o25 -->|"CREA"| t27
  o25 -->|"ACTUALIZA"| t28
  o25 -->|"CREA"| t28
  o25 -->|"LEE"| t28
  o25 -.-> t29
  a31 --> o30
  o30 -->|"LEE"| t23
  o30 -->|"CREA"| t32
  o30 -->|"CREA"| t33
  o30 -->|"CREA"| t34
  o30 -->|"LEE"| t34
  a20 --> o35
  o35 -->|"LEE"| t36
  o35 -->|"CREA"| t37
  o35 -->|"LEE"| t37
  a20 --> o38
  o38 -->|"CREA"| t39
  o38 -->|"LEE"| t40
  o38 -->|"LEE"| t37
  a42 --> o41
  o41 -->|"CREA"| t43
  o41 -->|"ACTUALIZA"| t44
  o41 -->|"LEE"| t44
  a2 --> o45
  o45 -->|"CREA"| t32
  o45 -->|"ACTUALIZA"| t46
  o45 -->|"LEE"| t46
  o45 -->|"LEE"| t47
  a49 --> o48
  o48 -->|"LEE"| t23
  o48 -->|"CREA"| t24
  o48 -->|"CREA"| t50
  o48 -->|"LEE"| t51
  a49 --> o52
  o52 -->|"CREA"| t51
  o52 -->|"LEE"| t51
  o52 -->|"ACTUALIZA"| t53
  o52 -->|"LEE"| t53
  a49 --> o54
  o54 -->|"CREA"| t32
  o54 -->|"LEE"| t55
  o54 -->|"ACTUALIZA"| t56
  o54 -->|"LEE"| t56
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /ops/artifacts

Publicar un artefacto inmutable

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Componente no encontrado; ResourceNotFoundException: Herramienta no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe un artefacto con esa referencia; ConflictException: El componente ya publicó esa versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La herramienta no está homologada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReleasesService.publishArtifact"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsReleasesRepository.findComponentById"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.service_components")]:::efecto
  n5 --> n6
  n7{"!component"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Componente no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"dto.producedByToolId"}:::decision
  n7 -->|"no"| n9
  n10["Llama a OpsReleasesRepository.findToolById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE platform_ops.tool_registry")]:::efecto
  n10 --> n11
  n12{"!tool"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Herramienta no encontrada"]):::error
  n12 -->|"sí"| n13
  n14{"!tool.isApproved"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED La herramienta no está homologada"]):::error
  n14 -->|"sí"| n15
  n16["Llama a OpsReleasesRepository.findArtifactByRef"]:::llamada
  n14 -->|"no"| n16
  n9 -->|"no"| n16
  n17[("LEE platform_ops.artifacts")]:::efecto
  n16 --> n17
  n18{"duplicateRef"}:::decision
  n17 --> n18
  n19(["409 CONFLICT Ya existe un artefacto con esa referencia"]):::error
  n18 -->|"sí"| n19
  n20["Llama a OpsReleasesRepository.findArtifactByVersion"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE platform_ops.artifacts")]:::efecto
  n20 --> n21
  n22{"duplicateVersion"}:::decision
  n21 --> n22
  n23(["409 CONFLICT El componente ya publicó esa versión"]):::error
  n22 -->|"sí"| n23
  n24["Llama a OpsReleasesRepository.createArtifact"]:::llamada
  n22 -->|"no"| n24
  n25[("CREA platform_ops.artifacts")]:::efecto
  n24 --> n25
  n26(("201 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /ops/capacity-plans/{id}/measurements

Registrar una medición de capacidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan de capacidad no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La capacidad debe ser mayor que cero; PreconditionFailedException: El plan de capacidad no está activo; PreconditionFailedException: La medición cae fuera del horizonte del plan |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReliabilityService.recordCapacityMeasurement"]:::llamada
  n2 --> n3
  n4{"capacity ‹= 0"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La capacidad debe ser mayor que cero"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a OpsReliabilityRepository.findCapacityPlanForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE platform_ops.capacity_plans")]:::efecto
  n7 --> n8
  n9{"!plan"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Plan de capacidad no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"plan.statusConceptId !== CONCEPTS.CAPACITY_PLAN_ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El plan de capacidad no está activo"]):::error
  n11 -->|"sí"| n12
  n13{"measuredAt ‹ plan.planningHorizonStart || measuredAt › plan.planningHorizonEnd"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED La medición cae fuera del horizonte del plan"]):::error
  n13 -->|"sí"| n14
  n15["Llama a OpsReliabilityRepository.createCapacityMeasurement"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA platform_ops.capacity_measurements")]:::efecto
  n15 --> n16
  n17{"guardrailCrossed && (dto.demandForecastJson || dto.scalingPolicyJson)"}:::decision
  n16 --> n17
  n18{"dto.demandForecastJson"}:::decision
  n17 -->|"sí"| n18
  n19[("ACTUALIZA platform_ops.capacity_plans")]:::efecto
  n18 -->|"sí"| n19
  n20{"dto.scalingPolicyJson"}:::decision
  n19 --> n20
  n18 -->|"no"| n20
  n21[("ACTUALIZA platform_ops.capacity_plans")]:::efecto
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

#### 3. POST /ops/change-requests

Registrar una solicitud de cambio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Componente no encontrado; ResourceNotFoundException: Ventana de mantenimiento no encontrada |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar un número de cambio libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana planificada está invertida; PreconditionFailedException: El componente no está activo; PreconditionFailedException: La ventana de mantenimiento está cerrada; PreconditionFailedException: El cambio empieza antes que su ventana; PreconditionFailedException: El cambio termina después que su ventana |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReleasesService.createChangeRequest"]:::llamada
  n2 --> n3
  n4{"plannedStartAt && plannedEndAt && plannedEndAt ‹= plannedStartAt"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La ventana planificada está invertida"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a OpsReleasesRepository.findComponentById"]:::llamada
  n6 --> n7
  n8[("LEE platform_ops.service_components")]:::efecto
  n7 --> n8
  n9{"!component"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Componente no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"component.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El componente no está activo"]):::error
  n11 -->|"sí"| n12
  n13{"dto.maintenanceWindowId"}:::decision
  n11 -->|"no"| n13
  n14["Llama a OpsReleasesRepository.findWindowForUpdate"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE platform_ops.maintenance_windows")]:::efecto
  n14 --> n15
  n16{"!window"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Ventana de mantenimiento no encontrada"]):::error
  n16 -->|"sí"| n17
  n18{"window.statusConceptId === CONCEPTS.MAINTENANCE_WINDOW_CLOSED"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La ventana de mantenimiento está cerrada"]):::error
  n18 -->|"sí"| n19
  n20{"plannedStartAt && plannedStartAt ‹ window.startsAt"}:::decision
  n18 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED El cambio empieza antes que su ventana"]):::error
  n20 -->|"sí"| n21
  n22{"plannedEndAt && plannedEndAt › window.endsAt"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED El cambio termina después que su ventana"]):::error
  n22 -->|"sí"| n23
  n24["Llama a OpsReleasesService.nextChangeNumber"]:::llamada
  n22 -->|"no"| n24
  n13 -->|"no"| n24
  n25["Llama a OpsReleasesRepository.countChangeRequests"]:::llamada
  n24 --> n25
  n26[("LEE platform_ops.change_requests")]:::efecto
  n25 --> n26
  n27["Repite: ciclo for"]:::bucle
  n26 --> n27
  n28["Llama a OpsReleasesRepository.findChangeRequestByNumber"]:::llamada
  n27 -->|"cada elemento"| n28
  n29[("LEE platform_ops.change_requests")]:::efecto
  n28 --> n29
  n30(["409 CONFLICT No se pudo asignar un número de cambio libre"]):::error
  n29 --> n30
  n27 -->|"al terminar"| n30
  n31["Llama a OpsReleasesRepository.createChangeRequest"]:::llamada
  n32[("CREA platform_ops.change_requests")]:::efecto
  n31 --> n32
  n33(("201 Responde con éxito")):::ok
  n32 --> n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /ops/change-requests/{id}/approvals

Registrar la decisión del CAB

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de cambio no encontrada |
| 409 | `CONFLICT` | ConflictException: Ese aprobador ya votó en este paso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud ya no admite decisiones; PreconditionFailedException: Quien solicita el cambio no puede aprobarlo; PreconditionFailedException: El paso anterior todavía no está aprobado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReleasesService.recordApproval"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsReleasesRepository.findChangeRequestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.change_requests")]:::efecto
  n5 --> n6
  n7{"!change"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud de cambio no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"!DECIDABLE_CHANGE_STATES.includes(change.statusConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La solicitud ya no admite decisiones"]):::error
  n9 -->|"sí"| n10
  n11{"change.requestedByUserId === actor.id"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Quien solicita el cambio no puede aprobarlo"]):::error
  n11 -->|"sí"| n12
  n13["Llama a OpsReleasesRepository.findApprovals"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE platform_ops.change_approvals")]:::efecto
  n13 --> n14
  n15{"approvals.some( (approval) =› approval.approvalStep === dto.approvalStep && approval.approverUserId === actor…"}:::decision
  n14 --> n15
  n16(["409 CONFLICT Ese aprobador ya votó en este paso"]):::error
  n15 -->|"sí"| n16
  n17{"dto.approvalStep › 1 && !approvedSteps.includes(dto.approvalStep - 1)"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El paso anterior todavía no está aprobado"]):::error
  n17 -->|"sí"| n18
  n19["Llama a OpsReleasesRepository.createApproval"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA platform_ops.change_approvals")]:::efecto
  n19 --> n20
  n21{"!approved"}:::decision
  n20 --> n21
  n22[("ACTUALIZA platform_ops.change_requests")]:::efecto
  n21 -->|"sí"| n22
  n23[("ACTUALIZA platform_ops.change_requests")]:::efecto
  n21 -->|"no"| n23
  n24(("201 Responde con éxito")):::ok
  n22 --> n24
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /ops/deployments

Ejecutar un despliegue

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de cambio no encontrada; ResourceNotFoundException: Artefacto no encontrado |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar un número de despliegue libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El cambio no está aprobado; PreconditionFailedException: El artefacto no está activo; PreconditionFailedException: El artefacto pertenece a otro componente; PreconditionFailedException: Producción exige una revisión de preparación con decisión "go"; PreconditionFailedException: Los despliegues están congelados por agotamiento del error budget |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReleasesService.createDeployment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsReleasesRepository.findChangeRequestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.change_requests")]:::efecto
  n5 --> n6
  n7{"!change"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud de cambio no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"change.statusConceptId !== CONCEPTS.CHANGE_APPROVED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El cambio no está aprobado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a OpsReleasesRepository.findArtifactById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE platform_ops.artifacts")]:::efecto
  n11 --> n12
  n13{"!artifact"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Artefacto no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"artifact.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El artefacto no está activo"]):::error
  n15 -->|"sí"| n16
  n17{"artifact.serviceComponentId !== change.serviceComponentId"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El artefacto pertenece a otro componente"]):::error
  n17 -->|"sí"| n18
  n19{"dto.environment === 'PRODUCTION'"}:::decision
  n17 -->|"no"| n19
  n20["Llama a OpsPracticesRepository.findGoReview"]:::llamada
  n19 -->|"sí"| n20
  n21[("LEE platform_ops.operational_readiness_reviews")]:::efecto
  n20 --> n21
  n22{"!review"}:::decision
  n21 --> n22
  n23(["422 PRECONDITION_FAILED Producción exige una revisión de preparación con decisión 'go'"]):::error
  n22 -->|"sí"| n23
  n24["Llama a OpsReleasesService.deploymentsFrozen"]:::llamada
  n22 -->|"no"| n24
  n19 -->|"no"| n24
  n25["Llama a OpsReliabilityRepository.findFreezingPolicies"]:::llamada
  n24 --> n25
  n26[("LEE platform_ops.error_budget_policies")]:::efecto
  n25 --> n26
  n27["Repite: por cada const policy de policies"]:::bucle
  n26 --> n27
  n28["Llama a OpsReliabilityRepository.findLatestBurnEvent"]:::llamada
  n27 -->|"cada elemento"| n28
  n29[("LEE platform_ops.error_budget_burn_events")]:::efecto
  n28 --> n29
  n30{"await this.deploymentsFrozen(tx)"}:::decision
  n29 --> n30
  n27 -->|"al terminar"| n30
  n31(["422 PRECONDITION_FAILED Los despliegues están congelados por agotamiento del error budget"]):::error
  n30 -->|"sí"| n31
  n32["Llama a OpsReleasesRepository.findCurrentDeploymentForUpdate"]:::llamada
  n30 -->|"no"| n32
  n33[("LEE platform_ops.deployments")]:::efecto
  n32 --> n33
  n34["Llama a OpsReleasesService.nextDeploymentNumber"]:::llamada
  n33 --> n34
  n35["Llama a OpsReleasesRepository.countDeployments"]:::llamada
  n34 --> n35
  n36[("LEE platform_ops.deployments")]:::efecto
  n35 --> n36
  n37["Repite: ciclo for"]:::bucle
  n36 --> n37
  n38["Llama a OpsReleasesRepository.findDeploymentByNumber"]:::llamada
  n37 -->|"cada elemento"| n38
  n39[("LEE platform_ops.deployments")]:::efecto
  n38 --> n39
  n40(["409 CONFLICT No se pudo asignar un número de despliegue libre"]):::error
  n39 --> n40
  n37 -->|"al terminar"| n40
  n41["Llama a OpsReleasesRepository.createDeployment"]:::llamada
  n42[("CREA platform_ops.deployments")]:::efecto
  n41 --> n42
  n43{"succeeded && current"}:::decision
  n42 --> n43
  n44[("ACTUALIZA platform_ops.deployments")]:::efecto
  n43 -->|"sí"| n44
  n45{"succeeded"}:::decision
  n44 --> n45
  n43 -->|"no"| n45
  n46[("ACTUALIZA platform_ops.change_requests · ACTUALIZA platform_ops.change_requests · ACTUALIZA platform_ops.chan…")]:::efecto
  n45 -->|"sí"| n46
  n47(("201 Responde con éxito")):::ok
  n46 --> n47
  n45 -->|"no"| n47
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /ops/deployments/{id}/rollback

Revertir un despliegue

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Despliegue no encontrado |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar un número de despliegue libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El despliegue no está en un estado reversible; PreconditionFailedException: El despliegue ya no es el vigente; PreconditionFailedException: No hay un despliegue estable anterior al que volver; PreconditionFailedException: El destino de la reversión es de otro componente o entorno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReleasesService.rollbackDeployment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsReleasesRepository.findDeploymentForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.deployments")]:::efecto
  n5 --> n6
  n7{"!source"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Despliegue no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"source.statusConceptId !== CONCEPTS.DEPLOY_SUCCEEDED && source.statusConceptId !== CONCEPTS.DEPLOY_FAILED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El despliegue no está en un estado reversible"]):::error
  n9 -->|"sí"| n10
  n11{"!source.isCurrent"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El despliegue ya no es el vigente"]):::error
  n11 -->|"sí"| n12
  n13["Llama a OpsReleasesRepository.findDeploymentById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE platform_ops.deployments")]:::efecto
  n13 --> n14
  n15["Llama a OpsReleasesRepository.findPreviousSucceededDeployment"]:::llamada
  n14 --> n15
  n16[("LEE platform_ops.deployments")]:::efecto
  n15 --> n16
  n17{"!target"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED No hay un despliegue estable anterior al que volver"]):::error
  n17 -->|"sí"| n18
  n19{"target.serviceComponentId !== source.serviceComponentId || target.environmentConceptId !== source.environment…"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El destino de la reversión es de otro componente o entorno"]):::error
  n19 -->|"sí"| n20
  n21["Llama a OpsReleasesService.nextDeploymentNumber"]:::llamada
  n19 -->|"no"| n21
  n22["Llama a OpsReleasesRepository.countDeployments"]:::llamada
  n21 --> n22
  n23[("LEE platform_ops.deployments")]:::efecto
  n22 --> n23
  n24["Repite: ciclo for"]:::bucle
  n23 --> n24
  n25["Llama a OpsReleasesRepository.findDeploymentByNumber"]:::llamada
  n24 -->|"cada elemento"| n25
  n26[("LEE platform_ops.deployments")]:::efecto
  n25 --> n26
  n27(["409 CONFLICT No se pudo asignar un número de despliegue libre"]):::error
  n26 --> n27
  n24 -->|"al terminar"| n27
  n28["Llama a OpsReleasesRepository.createDeployment"]:::llamada
  n29[("CREA platform_ops.deployments")]:::efecto
  n28 --> n29
  n30[("ACTUALIZA platform_ops.deployments · ACTUALIZA platform_ops.deployments")]:::efecto
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

#### 7. POST /ops/error-budget/{policyId}/burn-events

Registrar la quema del presupuesto de error

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Política de error budget no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La política no está activa; PreconditionFailedException: La política no tiene ninguna medición del objetivo sobre la que evaluar; PreconditionFailedException: El ritmo de quema no alcanza el umbral de aviso de la política |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReliabilityService.recordBurnEvent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsReliabilityRepository.findPolicyForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.error_budget_policies")]:::efecto
  n5 --> n6
  n7{"!policy"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Política de error budget no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"policy.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La política no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a OpsReliabilityRepository.findLatestMeasurement"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE platform_ops.slo_measurements")]:::efecto
  n11 --> n12
  n13{"!measurement"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La política no tiene ninguna medición del objetivo sobre la que evaluar"]):::error
  n13 -->|"sí"| n14
  n15{"!exhausted && burnRate ‹ warning"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El ritmo de quema no alcanza el umbral de aviso de la política"]):::error
  n15 -->|"sí"| n16
  n17["Llama a OpsReliabilityRepository.createBurnEvent"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA platform_ops.error_budget_burn_events")]:::efecto
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

#### 8. POST /ops/health-checks/{id}/runs

Registrar una corrida de health check

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Health check no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El health check no está activo; PreconditionFailedException: El health check está deshabilitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsIncidentsService.recordHealthRun"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsIncidentsRepository.findHealthCheckById"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.health_checks")]:::efecto
  n5 --> n6
  n7{"!check"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Health check no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"check.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El health check no está activo"]):::error
  n9 -->|"sí"| n10
  n11{"check.isEnabled === false"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El health check está deshabilitado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a OpsIncidentsRepository.findRecentRuns"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE platform_ops.health_check_runs")]:::efecto
  n13 --> n14
  n15["Llama a OpsIncidentsRepository.createHealthRun"]:::llamada
  n14 --> n15
  n16[("CREA platform_ops.health_check_runs")]:::efecto
  n15 --> n16
  n17["Llama a OpsIncidentsRepository.findOpenIncidentByCheckForUpdate"]:::llamada
  n16 --> n17
  n18[("LEE platform_ops.health_incidents")]:::efecto
  n17 --> n18
  n19{"live"}:::decision
  n18 --> n19
  n20["Llama a OpsIncidentsRepository.createTimelineEvent"]:::llamada
  n19 -->|"sí"| n20
  n21[("CREA platform_ops.incident_timeline_events")]:::efecto
  n20 --> n21
  n22["Llama a OpsIncidentsService.nextIncidentNumber"]:::llamada
  n21 --> n22
  n19 -->|"no"| n22
  n23["Llama a OpsIncidentsRepository.countIncidents"]:::llamada
  n22 --> n23
  n24[("LEE platform_ops.health_incidents")]:::efecto
  n23 --> n24
  n25["Llama a OpsIncidentsRepository.createIncident"]:::llamada
  n24 --> n25
  n26[("CREA platform_ops.health_incidents")]:::efecto
  n25 --> n26
  n27["Llama a OpsIncidentsRepository.createTimelineEvent"]:::llamada
  n26 --> n27
  n28[("CREA platform_ops.incident_timeline_events")]:::efecto
  n27 --> n28
  n29(("201 Responde con éxito")):::ok
  n28 --> n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. PATCH /ops/incidents/{id}

Mover el incidente, sumar respondientes y publicar comunicaciones

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El incidente ya está resuelto; PreconditionFailedException: La transición no es válida desde el estado actual; PreconditionFailedException: Resolver exige causa raíz y descripción de la resolución |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsIncidentsService.updateIncident"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsIncidentsRepository.findIncidentForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.health_incidents")]:::efecto
  n5 --> n6
  n7{"!incident"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Incidente no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"incident.statusConceptId === CONCEPTS.INCIDENT_RESOLVED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El incidente ya está resuelto"]):::error
  n9 -->|"sí"| n10
  n11{"dto.transition !== 'UPDATE'"}:::decision
  n9 -->|"no"| n11
  n12["Llama a OpsIncidentsService.applyTransition"]:::llamada
  n11 -->|"sí"| n12
  n13{"!transition.from.includes(incident.statusConceptId)"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La transición no es válida desde el estado actual"]):::error
  n13 -->|"sí"| n14
  n15{"dto.transition === 'RESOLVE'"}:::decision
  n13 -->|"no"| n15
  n16{"!rootCause || !resolution"}:::decision
  n15 -->|"sí"| n16
  n17(["422 PRECONDITION_FAILED Resolver exige causa raíz y descripción de la resolución"]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA platform_ops.health_incidents · ACTUALIZA platform_ops.health_incidents · ACTUALIZA platform_ops.he…")]:::efecto
  n16 -->|"no"| n18
  n19{"dto.transition === 'ACKNOWLEDGE'"}:::decision
  n18 --> n19
  n15 -->|"no"| n19
  n20[("ACTUALIZA platform_ops.health_incidents")]:::efecto
  n19 -->|"sí"| n20
  n21[("ACTUALIZA platform_ops.health_incidents")]:::efecto
  n20 --> n21
  n19 -->|"no"| n21
  n22{"dto.rootCauseText"}:::decision
  n21 --> n22
  n23[("ACTUALIZA platform_ops.health_incidents")]:::efecto
  n22 -->|"sí"| n23
  n24[("ACTUALIZA platform_ops.health_incidents")]:::efecto
  n23 --> n24
  n22 -->|"no"| n24
  n25{"dto.resolutionText"}:::decision
  n24 --> n25
  n26[("ACTUALIZA platform_ops.health_incidents")]:::efecto
  n25 -->|"sí"| n26
  n27[("ACTUALIZA platform_ops.health_incidents")]:::efecto
  n26 --> n27
  n25 -->|"no"| n27
  n28["Llama a OpsIncidentsRepository.createTimelineEvent"]:::llamada
  n27 --> n28
  n29[("CREA platform_ops.incident_timeline_events")]:::efecto
  n28 --> n29
  n30{"dto.summary"}:::decision
  n11 -->|"no"| n30
  n31["Llama a OpsIncidentsRepository.createTimelineEvent"]:::llamada
  n30 -->|"sí"| n31
  n32[("CREA platform_ops.incident_timeline_events")]:::efecto
  n31 --> n32
  n33["Repite: por cada const responder de dto.responders ?? []"]:::bucle
  n29 --> n33
  n32 --> n33
  n30 -->|"no"| n33
  n34["Llama a OpsIncidentsRepository.findResponder"]:::llamada
  n33 -->|"cada elemento"| n34
  n35[("LEE platform_ops.incident_responders")]:::efecto
  n34 --> n35
  n36{"existing"}:::decision
  n35 --> n36
  n37{"responder.acknowledged && !existing.acknowledgedAt"}:::decision
  n36 -->|"sí"| n37
  n38[("ACTUALIZA platform_ops.incident_responders")]:::efecto
  n37 -->|"sí"| n38
  n39["Llama a OpsIncidentsRepository.createResponder"]:::llamada
  n38 --> n39
  n37 -->|"no"| n39
  n36 -->|"no"| n39
  n40[("CREA platform_ops.incident_responders")]:::efecto
  n39 --> n40
  n41["Llama a OpsIncidentsRepository.createTimelineEvent"]:::llamada
  n40 --> n41
  n42[("CREA platform_ops.incident_timeline_events")]:::efecto
  n41 --> n42
  n43["Repite: por cada const communication de dto.communications ?? []"]:::bucle
  n42 --> n43
  n33 -->|"al terminar"| n43
  n44["Llama a OpsIncidentsRepository.createCommunication"]:::llamada
  n43 -->|"cada elemento"| n44
  n45[("CREA platform_ops.incident_communications")]:::efecto
  n44 --> n45
  n46["Llama a OpsIncidentsRepository.createTimelineEvent"]:::llamada
  n45 --> n46
  n47[("CREA platform_ops.incident_timeline_events")]:::efecto
  n46 --> n47
  n48(("200 Responde con éxito")):::ok
  n47 --> n48
  n43 -->|"al terminar"| n48
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /ops/incidents/{id}/postmortem

Abrir el postmortem del incidente resuelto

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidente no encontrado |
| 409 | `CONFLICT` | ConflictException: El incidente ya tiene postmortem |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El código de acción está repetido; PreconditionFailedException: El incidente todavía no está resuelto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsIncidentsService.openPostmortem"]:::llamada
  n2 --> n3
  n4["Llama a OpsIncidentsService.assertUniqueActionCodes"]:::llamada
  n3 --> n4
  n5["Repite: por cada const action de dto.actionItems"]:::bucle
  n4 --> n5
  n6{"seen.has(action.actionCode)"}:::decision
  n5 -->|"cada elemento"| n6
  n7(["422 PRECONDITION_FAILED El código de acción está repetido"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n5 -->|"al terminar"| n8
  n9["Llama a OpsIncidentsRepository.findIncidentForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE platform_ops.health_incidents")]:::efecto
  n9 --> n10
  n11{"!incident"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Incidente no encontrado"]):::error
  n11 -->|"sí"| n12
  n13{"incident.statusConceptId !== CONCEPTS.INCIDENT_RESOLVED"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El incidente todavía no está resuelto"]):::error
  n13 -->|"sí"| n14
  n15["Llama a OpsIncidentsRepository.findPostmortemByIncident"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE platform_ops.postmortems")]:::efecto
  n15 --> n16
  n17{"previous"}:::decision
  n16 --> n17
  n18(["409 CONFLICT El incidente ya tiene postmortem"]):::error
  n17 -->|"sí"| n18
  n19["Llama a OpsIncidentsRepository.createPostmortem"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA platform_ops.postmortems")]:::efecto
  n19 --> n20
  n21["Repite: por cada const action de dto.actionItems"]:::bucle
  n20 --> n21
  n22["Llama a OpsIncidentsRepository.createActionItem"]:::llamada
  n21 -->|"cada elemento"| n22
  n23[("CREA platform_ops.postmortem_action_items")]:::efecto
  n22 --> n23
  n24["Llama a OpsImprovementsRepository.createImprovementItem"]:::llamada
  n23 --> n24
  n25[("CREA platform_ops.operational_improvement_items")]:::efecto
  n24 --> n25
  n26(("201 Responde con éxito")):::ok
  n25 --> n26
  n21 -->|"al terminar"| n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /ops/readiness-reviews/{id}/complete

Cerrar la revisión de preparación con su decisión

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Revisión de preparación no encontrada; ResourceNotFoundException: El hallazgo no pertenece a esta revisión |
| 409 | `CONFLICT` | ConflictException: El hallazgo ya no está abierto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La revisión no está en curso; PreconditionFailedException: Quedan hallazgos críticos o altos sin resolver |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsPracticesService.completeReadinessReview"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsPracticesRepository.findReviewForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.operational_readiness_reviews")]:::efecto
  n5 --> n6
  n7{"!review"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Revisión de preparación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"review.statusConceptId !== CONCEPTS.ORR_IN_PROGRESS"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La revisión no está en curso"]):::error
  n9 -->|"sí"| n10
  n11["Llama a OpsPracticesRepository.findFindingsForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE platform_ops.readiness_review_findings")]:::efecto
  n11 --> n12
  n13["Repite: por cada const resolved de dto.resolvedFindings ?? []"]:::bucle
  n12 --> n13
  n14{"!finding"}:::decision
  n13 -->|"cada elemento"| n14
  n15(["404 NOT_FOUND El hallazgo no pertenece a esta revisión"]):::error
  n14 -->|"sí"| n15
  n16{"finding.statusConceptId !== CONCEPTS.FINDING_OPEN"}:::decision
  n14 -->|"no"| n16
  n17(["409 CONFLICT El hallazgo ya no está abierto"]):::error
  n16 -->|"sí"| n17
  n18{"dto.decision === 'GO'"}:::decision
  n16 -->|"no"| n18
  n13 -->|"al terminar"| n18
  n19{"blocking"}:::decision
  n18 -->|"sí"| n19
  n20(["422 PRECONDITION_FAILED Quedan hallazgos críticos o altos sin resolver"]):::error
  n19 -->|"sí"| n20
  n21["Llama a OpsImprovementsRepository.createImprovementItem"]:::llamada
  n19 -->|"no"| n21
  n18 -->|"no"| n21
  n22[("CREA platform_ops.operational_improvement_items")]:::efecto
  n21 --> n22
  n23[("ACTUALIZA platform_ops.operational_readiness_reviews · ACTUALIZA platform_ops.operational_readiness_reviews ·…")]:::efecto
  n22 --> n23
  n24{"dto.evidenceJson"}:::decision
  n23 --> n24
  n25[("ACTUALIZA platform_ops.operational_readiness_reviews")]:::efecto
  n24 -->|"sí"| n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  n24 -->|"no"| n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /ops/resilience-exercises/{id}/complete

Cerrar un ejercicio de resiliencia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejercicio de resiliencia no encontrado |
| 409 | `CONFLICT` | ConflictException: El ejercicio ya está cerrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El ejercicio termina antes de empezar; PreconditionFailedException: El componente no tiene objetivo de recuperación vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsPracticesService.completeResilienceExercise"]:::llamada
  n2 --> n3
  n4{"endedAt ‹ startedAt"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED El ejercicio termina antes de empezar"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a OpsPracticesRepository.findExerciseForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE platform_ops.resilience_exercises")]:::efecto
  n7 --> n8
  n9{"!exercise"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Ejercicio de resiliencia no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"exercise.resultConceptId"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT El ejercicio ya está cerrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a OpsPracticesRepository.findRecoveryObjectiveForUpdate"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE platform_ops.recovery_objectives")]:::efecto
  n13 --> n14
  n15{"!objective"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El componente no tiene objetivo de recuperación vigente"]):::error
  n15 -->|"sí"| n16
  n17[("ACTUALIZA platform_ops.resilience_exercises · ACTUALIZA platform_ops.resilience_exercises · ACTUALIZA platfor…")]:::efecto
  n15 -->|"no"| n17
  n18{"rtoBreached || rpoBreached"}:::decision
  n17 --> n18
  n19["Llama a OpsImprovementsRepository.createImprovementItem"]:::llamada
  n18 -->|"sí"| n19
  n20[("CREA platform_ops.operational_improvement_items")]:::efecto
  n19 --> n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  n18 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /ops/runbook-executions

Registrar la ejecución de un runbook

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de runbook no encontrada; ResourceNotFoundException: Incidente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución termina antes de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OpsPracticesService.recordRunbookExecution"]:::llamada
  n2 --> n3
  n4{"endedAt && endedAt ‹ startedAt"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La ejecución termina antes de empezar"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a OpsPracticesRepository.findRunbookVersionById"]:::llamada
  n6 --> n7
  n8[("LEE platform_ops.runbook_versions")]:::efecto
  n7 --> n8
  n9{"!version"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Versión de runbook no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"dto.healthIncidentId"}:::decision
  n9 -->|"no"| n11
  n12["Llama a OpsIncidentsRepository.findIncidentById"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE platform_ops.health_incidents")]:::efecto
  n12 --> n13
  n14{"!incident"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Incidente no encontrado"]):::error
  n14 -->|"sí"| n15
  n16["Llama a OpsPracticesRepository.createRunbookExecution"]:::llamada
  n14 -->|"no"| n16
  n11 -->|"no"| n16
  n17[("CREA platform_ops.runbook_executions")]:::efecto
  n16 --> n17
  n18{"dto.healthIncidentId"}:::decision
  n17 --> n18
  n19["Llama a OpsIncidentsRepository.createTimelineEvent"]:::llamada
  n18 -->|"sí"| n19
  n20[("CREA platform_ops.incident_timeline_events")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  n18 -->|"no"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /ops/runbooks/{id}/versions

Publicar una versión del runbook

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Runbook no encontrado |
| 409 | `CONFLICT` | ConflictException: Esa versión del runbook ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El runbook no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsPracticesService.publishRunbookVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OpsPracticesRepository.findRunbookForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE platform_ops.runbooks")]:::efecto
  n5 --> n6
  n7{"!runbook"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Runbook no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"runbook.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El runbook no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a OpsPracticesRepository.findLatestRunbookVersion"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE platform_ops.runbook_versions")]:::efecto
  n11 --> n12
  n13["Llama a OpsPracticesRepository.findRunbookVersion"]:::llamada
  n12 --> n13
  n14[("LEE platform_ops.runbook_versions")]:::efecto
  n13 --> n14
  n15{"taken"}:::decision
  n14 --> n15
  n16(["409 CONFLICT Esa versión del runbook ya existe"]):::error
  n15 -->|"sí"| n16
  n17["Llama a OpsPracticesRepository.createRunbookVersion"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA platform_ops.runbook_versions")]:::efecto
  n17 --> n18
  n19[("ACTUALIZA platform_ops.runbooks")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /ops/slo/{id}/measurements

Registrar la medición de una ventana del SLO

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objetivo de nivel de servicio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana de medición está invertida; PreconditionFailedException: Una ventana sin eventos no mide nada; PreconditionFailedException: Los eventos buenos no pueden superar a los totales; PreconditionFailedException: El objetivo no está activo; PreconditionFailedException: La ventana precede a la vigencia del objetivo; PreconditionFailedException: La ventana excede la vigencia del objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OpsReliabilityService.recordSloMeasurement"]:::llamada
  n2 --> n3
  n4{"windowEnd ‹= windowStart"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La ventana de medición está invertida"]):::error
  n4 -->|"sí"| n5
  n6{"totalEvents ‹= 0n"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED Una ventana sin eventos no mide nada"]):::error
  n6 -->|"sí"| n7
  n8{"goodEvents › totalEvents"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Los eventos buenos no pueden superar a los totales"]):::error
  n8 -->|"sí"| n9
  n10["Transacción: transactional(…)"]:::transaccion
  n8 -->|"no"| n10
  n11["Llama a OpsReliabilityRepository.findSloById"]:::llamada
  n10 --> n11
  n12[("LEE platform_ops.service_level_objectives")]:::efecto
  n11 --> n12
  n13{"!slo"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Objetivo de nivel de servicio no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"slo.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El objetivo no está activo"]):::error
  n15 -->|"sí"| n16
  n17{"windowEnd ‹= slo.effectiveFrom"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED La ventana precede a la vigencia del objetivo"]):::error
  n17 -->|"sí"| n18
  n19{"slo.effectiveTo && windowEnd › slo.effectiveTo"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED La ventana excede la vigencia del objetivo"]):::error
  n19 -->|"sí"| n20
  n21["Llama a OpsReliabilityRepository.findMeasurementByWindow"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE platform_ops.slo_measurements")]:::efecto
  n21 --> n22
  n23["Llama a OpsReliabilityRepository.createSloMeasurement"]:::llamada
  n22 --> n23
  n24[("CREA platform_ops.slo_measurements")]:::efecto
  n23 --> n24
  n25(("201 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

