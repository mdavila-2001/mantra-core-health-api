<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `reporting`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 12 (12 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [reporting](../endpoints/reporting.md)

## Proceso: Módulo 39 — Reportes, Distribución y Tableros

- **Código:** `reporting` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 12
- **Actores:** DATA_STEWARD · REPORTING_ADMIN · REPORT_AUTHOR · REPORT_VIEWER · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/reporting/README.md`

### Para qué sirve

Fuentes de datos gobernadas, definiciones versionadas con parámetros y columnas, corridas parametrizadas con snapshot, programación y distribución periódica, suscripciones y tableros.

_Fuente: `src/modules/reporting/README.md:3`_

### Flujo general declarado en el README

```text
fuente (active, gobernada) ── definición (draft) ── versión ──> definición active, vN
                                    │                                   │
                                    │                                   └─ deprecate ──> deprecated
                                    │                                          + schedules suspended
                                    │
     ├─ execution (queued) ── snapshot ──> succeeded (+ retención)
     │        └─ fallo ── retry ──> queued (+ distribuciones re-pendientes)
     │
     ├─ schedule (active) ── tick ──> execution (queued) + ventana avanzada
     │        └─ suscripciones ──> destinatarios del envío
     │
     └─ distribuciones (pending) ──> messaging las envía y las marca sent

tablero (active) ── widgets ──> apuntan a definiciones no deprecadas
```

_Fuente: `src/modules/reporting/README.md:61`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-39-01` | Registrar fuente gobernada | POST /reporting/data-sources | REPORTING_ADMIN · DATA_STEWARD | MEDIO | 2 |
| `UC-39-02` | Autorar definición con parámetros y columnas | POST /reporting/definitions | REPORTING_ADMIN · REPORT_AUTHOR | MEDIO | 5 |
| `UC-39-03` | Publicar versión | POST /reporting/definitions/{id}/versions/publish | REPORTING_ADMIN · REPORT_AUTHOR | MEDIO | 4 |
| `UC-39-04` | Encolar corrida parametrizada | POST /reporting/definitions/{id}/executions | REPORTING_ADMIN · REPORT_VIEWER | MEDIO | 4 |
| `UC-39-05` | Materializar el artefacto | POST /reporting/executions/{id}/snapshot | SYSTEM | MEDIO | 3 |
| `UC-39-06` | Programar distribución | POST /reporting/definitions/{id}/schedules | REPORTING_ADMIN · REPORT_AUTHOR | MEDIO | 3 |
| `UC-39-07` | Disparar corridas vencidas | POST /reporting/scheduler/tick | SYSTEM | MEDIO | 5 |
| `UC-39-08` | Crear distribuciones | POST /reporting/executions/{id}/distributions | SYSTEM · REPORTING_ADMIN | MEDIO | 4 |
| `UC-39-09` | Suscribirse | POST /reporting/schedules/{id}/subscriptions | REPORT_VIEWER · REPORTING_ADMIN | MEDIO | 4 |
| `UC-39-10` | Componer tablero con widgets | POST /reporting/dashboards | REPORTING_ADMIN · REPORT_AUTHOR | MEDIO | 4 |
| `UC-39-11` | Reintentar corrida fallida | POST /reporting/executions/{id}/retry | SYSTEM · REPORTING_ADMIN | MEDIO | 4 |
| `UC-39-12` | Deprecar definición | POST /reporting/definitions/{id}/deprecate | REPORTING_ADMIN | MEDIO | 3 |

### Diagrama — etapas `UC-39-01`, `UC-39-02`, `UC-39-03`…

```mermaid
flowchart LR
  a2(["REPORTING_ADMIN · DATA_STEWARD"]):::actor
  a5(["REPORTING_ADMIN · REPORT_AUTHOR"]):::actor
  a12(["REPORTING_ADMIN · REPORT_VIEWER"]):::actor
  a15(["SYSTEM"]):::actor
  a21(["SYSTEM · REPORTING_ADMIN"]):::actor
  a25(["REPORT_VIEWER · REPORTING_ADMIN"]):::actor
  a31(["REPORTING_ADMIN"]):::actor
  t3[("reporting.report_data_sources")]:::tabla
  t6[("reporting.report_columns")]:::tabla
  t7[("reporting.report_definitions")]:::tabla
  t8[("reporting.report_parameters")]:::tabla
  t10[("reporting.report_versions")]:::tabla
  t13[("reporting.report_executions")]:::tabla
  t16[("reporting.report_snapshots")]:::tabla
  t18[("reporting.report_schedules")]:::tabla
  t22[("reporting.report_distributions")]:::tabla
  t23[("reporting.report_subscriptions")]:::tabla
  t27[("reporting.dashboard_widgets")]:::tabla
  t28[("reporting.dashboards")]:::tabla
  subgraph s0["UC-39-01 · Registrar fuente gobernada"]
    o1["POST /reporting/data-sources"]:::op
  end
  subgraph s1["UC-39-02 · Autorar definición con parámetros y columnas"]
    o4["POST /reporting/definitions"]:::op
  end
  subgraph s2["UC-39-03 · Publicar versión"]
    o9["POST /reporting/definitions/{id}/versions/publish"]:::op
  end
  subgraph s3["UC-39-04 · Encolar corrida parametrizada"]
    o11["POST /reporting/definitions/{id}/executions"]:::op
  end
  subgraph s4["UC-39-05 · Materializar el artefacto"]
    o14["POST /reporting/executions/{id}/snapshot"]:::op
  end
  subgraph s5["UC-39-06 · Programar distribución"]
    o17["POST /reporting/definitions/{id}/schedules"]:::op
  end
  subgraph s6["UC-39-07 · Disparar corridas vencidas"]
    o19["POST /reporting/scheduler/tick"]:::op
  end
  subgraph s7["UC-39-08 · Crear distribuciones"]
    o20["POST /reporting/executions/{id}/distributions"]:::op
  end
  subgraph s8["UC-39-09 · Suscribirse"]
    o24["POST /reporting/schedules/{id}/subscriptions"]:::op
  end
  subgraph s9["UC-39-10 · Componer tablero con widgets"]
    o26["POST /reporting/dashboards"]:::op
  end
  subgraph s10["UC-39-11 · Reintentar corrida fallida"]
    o29["POST /reporting/executions/{id}/retry"]:::op
  end
  subgraph s11["UC-39-12 · Deprecar definición"]
    o30["POST /reporting/definitions/{id}/deprecate"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  a5 --> o4
  o4 -->|"CREA"| t6
  o4 -->|"LEE"| t3
  o4 -->|"CREA"| t7
  o4 -->|"LEE"| t7
  o4 -->|"CREA"| t8
  a5 --> o9
  o9 -->|"LEE"| t7
  o9 -->|"LEE"| t8
  o9 -->|"CREA"| t10
  o9 -->|"LEE"| t10
  a12 --> o11
  o11 -->|"LEE"| t7
  o11 -->|"CREA"| t13
  o11 -->|"LEE"| t8
  o11 -->|"LEE"| t10
  a15 --> o14
  o14 -->|"LEE"| t13
  o14 -->|"CREA"| t16
  o14 -->|"LEE"| t16
  a5 --> o17
  o17 -->|"LEE"| t7
  o17 -->|"LEE"| t8
  o17 -->|"CREA"| t18
  a15 --> o19
  o19 -->|"LEE"| t7
  o19 -->|"CREA"| t13
  o19 -->|"ACTUALIZA"| t18
  o19 -->|"LEE"| t18
  o19 -->|"LEE"| t10
  a21 --> o20
  o20 -->|"CREA"| t22
  o20 -->|"LEE"| t22
  o20 -->|"LEE"| t13
  o20 -->|"LEE"| t23
  a25 --> o24
  o24 -->|"LEE"| t18
  o24 -->|"ACTUALIZA"| t23
  o24 -->|"CREA"| t23
  o24 -->|"LEE"| t23
  a5 --> o26
  o26 -->|"CREA"| t27
  o26 -->|"CREA"| t28
  o26 -->|"LEE"| t28
  o26 -->|"LEE"| t7
  a21 --> o29
  o29 -->|"LEE"| t7
  o29 -->|"ACTUALIZA"| t22
  o29 -->|"LEE"| t22
  o29 -->|"LEE"| t13
  a31 --> o30
  o30 -->|"LEE"| t7
  o30 -->|"ACTUALIZA"| t18
  o30 -->|"LEE"| t18
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /reporting/dashboards

Componer un tablero con sus widgets

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un tablero con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un widget CHART necesita su tipo de gráfico; PreconditionFailedException: El widget apunta a un reporte deprecado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingDefinitionsService.createDashboard"]:::llamada
  n2 --> n3
  n4["Llama a ReportingDefinitionsRepository.findDashboardByCode"]:::llamada
  n3 --> n4
  n5[("LEE reporting.dashboards")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe un tablero con ese código"]):::error
  n6 -->|"sí"| n7
  n8{"chartWithoutVisualization"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Un widget CHART necesita su tipo de gráfico"]):::error
  n8 -->|"sí"| n9
  n10["Transacción: transactional(…)"]:::transaccion
  n8 -->|"no"| n10
  n11["Repite: por cada const widget de dto.widgets"]:::bucle
  n10 --> n11
  n12["Llama a ReportingDefinitionsRepository.findDefinitionById"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("LEE reporting.report_definitions")]:::efecto
  n12 --> n13
  n14{"definition.stateConceptId === CONCEPTS.REPORT_DEPRECATED"}:::decision
  n13 --> n14
  n15(["422 PRECONDITION_FAILED El widget apunta a un reporte deprecado"]):::error
  n14 -->|"sí"| n15
  n16["Llama a ReportingDefinitionsRepository.createDashboard"]:::llamada
  n14 -->|"no"| n16
  n11 -->|"al terminar"| n16
  n17[("CREA reporting.dashboards")]:::efecto
  n16 --> n17
  n18["Llama a ReportingDefinitionsRepository.createWidget"]:::llamada
  n17 --> n18
  n19[("CREA reporting.dashboard_widgets")]:::efecto
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

#### 2. POST /reporting/data-sources

Registrar una fuente de datos gobernada

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una fuente con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una fuente READ_MODEL necesita su read model gobernado; PreconditionFailedException: Una fuente VIEW necesita el nombre de la vista |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingDefinitionsService.createDataSource"]:::llamada
  n2 --> n3
  n4["Llama a ReportingDefinitionsRepository.findDataSourceByCode"]:::llamada
  n3 --> n4
  n5[("LEE reporting.report_data_sources")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe una fuente con ese código"]):::error
  n6 -->|"sí"| n7
  n8{"dto.sourceType === 'READ_MODEL' && !dto.readModelDefinitionId"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Una fuente READ_MODEL necesita su read model gobernado"]):::error
  n8 -->|"sí"| n9
  n10{"dto.sourceType === 'VIEW' && !dto.viewName"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED Una fuente VIEW necesita el nombre de la vista"]):::error
  n10 -->|"sí"| n11
  n12["Transacción: transactional(…)"]:::transaccion
  n10 -->|"no"| n12
  n13["Llama a ReportingDefinitionsRepository.createDataSource"]:::llamada
  n12 --> n13
  n14[("CREA reporting.report_data_sources")]:::efecto
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

#### 3. POST /reporting/definitions

Autorar una definición con sus parámetros y columnas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una definición con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reporte no público necesita declarar el permiso que exige; PreconditionFailedException: El código de {kind} está repetido; PreconditionFailedException: La fuente de datos no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingDefinitionsService.createDefinition"]:::llamada
  n2 --> n3
  n4["Llama a ReportingDefinitionsRepository.findDefinitionByCode"]:::llamada
  n3 --> n4
  n5[("LEE reporting.report_definitions")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe una definición con ese código"]):::error
  n6 -->|"sí"| n7
  n8{"!dto.isPublic && !dto.requiredPermissionId"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Un reporte no público necesita declarar el permiso que exige"]):::error
  n8 -->|"sí"| n9
  n10["Llama a ReportingDefinitionsService.assertUniqueCodes"]:::llamada
  n8 -->|"no"| n10
  n11["Repite: por cada const code de codes"]:::bucle
  n10 --> n11
  n12{"seen.has(code)"}:::decision
  n11 -->|"cada elemento"| n12
  n13(["422 PRECONDITION_FAILED El código de {kind} está repetido"]):::error
  n12 -->|"sí"| n13
  n14["Llama a ReportingDefinitionsService.assertUniqueCodes"]:::llamada
  n12 -->|"no"| n14
  n11 -->|"al terminar"| n14
  n15["Repite: por cada const code de codes"]:::bucle
  n14 --> n15
  n16{"seen.has(code)"}:::decision
  n15 -->|"cada elemento"| n16
  n17(["422 PRECONDITION_FAILED El código de {kind} está repetido"]):::error
  n16 -->|"sí"| n17
  n18["Transacción: transactional(…)"]:::transaccion
  n16 -->|"no"| n18
  n15 -->|"al terminar"| n18
  n19["Llama a ReportingDefinitionsRepository.findDataSourceById"]:::llamada
  n18 --> n19
  n20[("LEE reporting.report_data_sources")]:::efecto
  n19 --> n20
  n21{"source.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED La fuente de datos no está activa"]):::error
  n21 -->|"sí"| n22
  n23["Llama a ReportingDefinitionsRepository.createDefinition"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA reporting.report_definitions")]:::efecto
  n23 --> n24
  n25["Llama a ReportingDefinitionsRepository.createParameter"]:::llamada
  n24 --> n25
  n26[("CREA reporting.report_parameters")]:::efecto
  n25 --> n26
  n27["Llama a ReportingDefinitionsRepository.createColumn"]:::llamada
  n26 --> n27
  n28[("CREA reporting.report_columns")]:::efecto
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

#### 4. POST /reporting/definitions/{id}/deprecate

Deprecar la definición y suspender sus programaciones

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La definición ya está deprecada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingDefinitionsService.deprecateDefinition"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingDefinitionsRepository.findDefinitionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_definitions")]:::efecto
  n5 --> n6
  n7{"definition.stateConceptId === CONCEPTS.REPORT_DEPRECATED"}:::decision
  n6 --> n7
  n8(["409 CONFLICT La definición ya está deprecada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReportingRunsRepository.findSchedulesByDefinitionForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE reporting.report_schedules")]:::efecto
  n9 --> n10
  n11["Repite: por cada const schedule de schedules"]:::bucle
  n10 --> n11
  n12[("ACTUALIZA reporting.report_schedules · ACTUALIZA reporting.report_schedules")]:::efecto
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

#### 5. POST /reporting/definitions/{id}/executions

Encolar una corrida parametrizada

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición no está activa; PreconditionFailedException: La definición no tiene versión publicada; PreconditionFailedException: Faltan parámetros obligatorios del reporte |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingRunsService.createExecution"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingDefinitionsRepository.findDefinitionById"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_definitions")]:::efecto
  n5 --> n6
  n7{"definition.stateConceptId !== CONCEPTS.REPORT_STATE_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La definición no está activa"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReportingDefinitionsRepository.findActiveVersion"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE reporting.report_versions")]:::efecto
  n9 --> n10
  n11{"!version"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La definición no tiene versión publicada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ReportingDefinitionsRepository.findParametersByDefinition"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE reporting.report_parameters")]:::efecto
  n13 --> n14
  n15["Llama a ReportingRunsService.resolveParameters"]:::llamada
  n14 --> n15
  n16{"missing.length › 0"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Faltan parámetros obligatorios del reporte"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ReportingRunsRepository.createExecution"]:::llamada
  n16 -->|"no"| n18
  n19[("CREA reporting.report_executions")]:::efecto
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

#### 6. POST /reporting/definitions/{id}/schedules

Programar la distribución periódica del reporte

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición no está activa; PreconditionFailedException: Faltan parámetros obligatorios del reporte |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingRunsService.createSchedule"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingDefinitionsRepository.findDefinitionById"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_definitions")]:::efecto
  n5 --> n6
  n7{"definition.stateConceptId !== CONCEPTS.REPORT_STATE_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La definición no está activa"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReportingDefinitionsRepository.findParametersByDefinition"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE reporting.report_parameters")]:::efecto
  n9 --> n10
  n11["Llama a ReportingRunsService.resolveParameters"]:::llamada
  n10 --> n11
  n12{"missing.length › 0"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED Faltan parámetros obligatorios del reporte"]):::error
  n12 -->|"sí"| n13
  n14["Llama a ReportingRunsRepository.createSchedule"]:::llamada
  n12 -->|"no"| n14
  n15[("CREA reporting.report_schedules")]:::efecto
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

#### 7. POST /reporting/definitions/{id}/versions/publish

Publicar una versión del reporte

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa versión ya está publicada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una definición deprecada no admite versiones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingDefinitionsService.publishVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingDefinitionsRepository.findDefinitionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_definitions")]:::efecto
  n5 --> n6
  n7{"definition.stateConceptId === CONCEPTS.REPORT_DEPRECATED"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED Una definición deprecada no admite versiones"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReportingDefinitionsRepository.findVersion"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE reporting.report_versions")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12(["409 CONFLICT Esa versión ya está publicada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ReportingDefinitionsRepository.findParametersByDefinition"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE reporting.report_parameters")]:::efecto
  n13 --> n14
  n15["Llama a ReportingDefinitionsRepository.createVersion"]:::llamada
  n14 --> n15
  n16[("CREA reporting.report_versions")]:::efecto
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

#### 8. POST /reporting/executions/{id}/distributions

Crear las distribuciones del reporte por destinatario

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se distribuye una ejecución que terminó con éxito; PreconditionFailedException: Un destinatario USER necesita su identificador; PreconditionFailedException: Un destinatario ADDRESS necesita su dirección |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingRunsService.dispatchDistributions"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingRunsRepository.findExecutionById"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_executions")]:::efecto
  n5 --> n6
  n7{"execution.statusConceptId !== CONCEPTS.EXECUTION_SUCCEEDED"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED Sólo se distribuye una ejecución que terminó con éxito"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReportingRunsRepository.findDistributionsByExecution"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE reporting.report_distributions")]:::efecto
  n9 --> n10
  n11{"execution.scheduleId"}:::decision
  n10 --> n11
  n12["Llama a ReportingRunsRepository.findActiveSubscriptions"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE reporting.report_subscriptions")]:::efecto
  n12 --> n13
  n14["Repite: por cada const recipient de dto.recipients ?? []"]:::bucle
  n13 --> n14
  n11 -->|"no"| n14
  n15{"recipient.recipientType === 'USER' && !recipient.recipientUserId"}:::decision
  n14 -->|"cada elemento"| n15
  n16(["422 PRECONDITION_FAILED Un destinatario USER necesita su identificador"]):::error
  n15 -->|"sí"| n16
  n17{"recipient.recipientType === 'ADDRESS' && !recipient.recipientAddress"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED Un destinatario ADDRESS necesita su dirección"]):::error
  n17 -->|"sí"| n18
  n19["Repite: por cada const target de targets"]:::bucle
  n17 -->|"no"| n19
  n14 -->|"al terminar"| n19
  n20["Llama a ReportingRunsRepository.createDistribution"]:::llamada
  n19 -->|"cada elemento"| n20
  n21[("CREA reporting.report_distributions")]:::efecto
  n20 --> n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
  n19 -->|"al terminar"| n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /reporting/executions/{id}/retry

Devolver a la cola una corrida fallida

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se reintenta una ejecución fallida; PreconditionFailedException: La definición está deprecada: no se reintenta su corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingRunsService.retryExecution"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingRunsRepository.findExecutionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_executions")]:::efecto
  n5 --> n6
  n7{"execution.statusConceptId !== CONCEPTS.EXECUTION_FAILED"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED Sólo se reintenta una ejecución fallida"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReportingDefinitionsRepository.findDefinitionById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE reporting.report_definitions")]:::efecto
  n9 --> n10
  n11{"definition?.stateConceptId === CONCEPTS.REPORT_DEPRECATED"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La definición está deprecada: no se reintenta su corrida"]):::error
  n11 -->|"sí"| n12
  n13{"dto.requeueDistributions"}:::decision
  n11 -->|"no"| n13
  n14["Llama a ReportingRunsRepository.findDistributionsByExecutionForUpdate"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE reporting.report_distributions")]:::efecto
  n14 --> n15
  n16["Repite: por cada const distribution de distributions"]:::bucle
  n15 --> n16
  n17[("ACTUALIZA reporting.report_distributions · ACTUALIZA reporting.report_distributions")]:::efecto
  n16 -->|"cada elemento"| n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  n16 -->|"al terminar"| n18
  n13 -->|"no"| n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /reporting/executions/{id}/snapshot

Registrar el artefacto materializado y cerrar la corrida

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La ejecución ya está materializada; ConflictException: La ejecución ya tiene snapshot |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una ejecución fallida se reintenta antes de materializar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingRunsService.materializeSnapshot"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingRunsRepository.findExecutionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_executions")]:::efecto
  n5 --> n6
  n7{"execution.statusConceptId === CONCEPTS.EXECUTION_SUCCEEDED"}:::decision
  n6 --> n7
  n8(["409 CONFLICT La ejecución ya está materializada"]):::error
  n7 -->|"sí"| n8
  n9{"execution.statusConceptId === CONCEPTS.EXECUTION_FAILED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Una ejecución fallida se reintenta antes de materializar"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ReportingRunsRepository.findSnapshotByExecution"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE reporting.report_snapshots")]:::efecto
  n11 --> n12
  n13{"existingForExecution"}:::decision
  n12 --> n13
  n14(["409 CONFLICT La ejecución ya tiene snapshot"]):::error
  n13 -->|"sí"| n14
  n15{"dto.contentHash"}:::decision
  n13 -->|"no"| n15
  n16["Llama a ReportingRunsRepository.findSnapshotByHash"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE reporting.report_snapshots")]:::efecto
  n16 --> n17
  n18["Llama a ReportingRunsRepository.createSnapshot"]:::llamada
  n17 --> n18
  n15 -->|"no"| n18
  n19[("CREA reporting.report_snapshots")]:::efecto
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

#### 11. POST /reporting/scheduler/tick

Disparar las programaciones vencidas

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingRunsService.schedulerTick"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingRunsRepository.findDueSchedules"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_schedules")]:::efecto
  n5 --> n6
  n7["Repite: por cada const schedule de due"]:::bucle
  n6 --> n7
  n8["Llama a ReportingDefinitionsRepository.findDefinitionById"]:::llamada
  n7 -->|"cada elemento"| n8
  n9[("LEE reporting.report_definitions")]:::efecto
  n8 --> n9
  n10["Llama a ReportingDefinitionsRepository.findActiveVersion"]:::llamada
  n9 --> n10
  n11[("LEE reporting.report_versions")]:::efecto
  n10 --> n11
  n12{"!definition || definition.stateConceptId !== CONCEPTS.REPORT_STATE_ACTIVE || !version"}:::decision
  n11 --> n12
  n13["Llama a ReportingRunsRepository.createExecution"]:::llamada
  n12 -->|"no"| n13
  n14[("CREA reporting.report_executions")]:::efecto
  n13 --> n14
  n15[("ACTUALIZA reporting.report_schedules · ACTUALIZA reporting.report_schedules")]:::efecto
  n12 -->|"sí"| n15
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  n7 -->|"al terminar"| n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /reporting/schedules/{id}/subscriptions

Suscribirse a una programación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La programación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ReportingRunsService.subscribe"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReportingRunsRepository.findScheduleById"]:::llamada
  n4 --> n5
  n6[("LEE reporting.report_schedules")]:::efecto
  n5 --> n6
  n7{"schedule.stateConceptId !== CONCEPTS.SCHEDULE_STATE_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La programación no está activa"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReportingRunsRepository.findSubscription"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE reporting.report_subscriptions")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12[("ACTUALIZA reporting.report_subscriptions")]:::efecto
  n11 -->|"sí"| n12
  n13["Llama a ReportingRunsRepository.createSubscription"]:::llamada
  n12 --> n13
  n11 -->|"no"| n13
  n14[("CREA reporting.report_subscriptions")]:::efecto
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

