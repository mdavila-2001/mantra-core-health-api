<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `audit`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 11 (7 con decisiones propias, 4 sin ellas)
- Inventario de endpoints del módulo: [audit](../endpoints/audit.md)

## Proceso: Módulo 10 — Audit, Provenance and Version Histories

- **Código:** `audit` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 11
- **Actores:** SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/audit/README.md`

### Para qué sirve

Auditoría WORM (append-only), cadena hash tamper-evidence, provenance quién-qué-cuándo, historial de versiones point-in-time, DSAR, exportación de evidencia, retención/archivado, detección de anomalías, moderación/gobernanza y acceso de tercero gobernado.

_Fuente: `src/modules/audit/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-10-01` | Registrar acceso/lectura clínica (accounting WORM) + provenance | POST /audit/data-access | SECURITY_ADMIN | MEDIO | 4 |
| `UC-10-04` | Registrar provenance de un cambio y sellar la cadena hash (incluye UC-10-03) | POST /audit/events | SECURITY_ADMIN | MEDIO | 2 |
| `UC-10-05` | Consultar historial / línea de tiempo (audita la propia lectura) | GET /audit/history/{entity}/{id} | SECURITY_ADMIN | MEDIO | 3 |
| `UC-10-06` | Verificar integridad tamper-evidence y atestar | POST /audit/integrity/verify | SECURITY_ADMIN | MEDIO | 2 |
| `UC-10-07` | Exportar evidencia de auditoría (idempotente por query_hash) | POST /compliance/audit-export | SECURITY_ADMIN | MEDIO | 4 |
| `UC-10-08` | Tramitar DSAR (máquina de estados) | POST /privacy/dsar | SECURITY_ADMIN | MEDIO | 4 |
|  |  | PATCH /privacy/dsar/{id} | SECURITY_ADMIN | MEDIO | 4 |
| `UC-10-09` | Aplicar retención / archivado / litigation-hold | POST /audit/retention/apply | SECURITY_ADMIN | ALTO | 3 |
| `UC-10-10` | Detectar acceso anómalo | POST /audit/anomaly/scan | SECURITY_ADMIN | MEDIO | 3 |
| `UC-10-11` | Registrar decisión de moderación / gobernanza | POST /moderation/decisions | SECURITY_ADMIN | MEDIO | 5 |
| `UC-10-12` | Registrar acceso delegado / de tercero gobernado | POST /audit/third-party-access | SECURITY_ADMIN | MEDIO | 6 |

### Diagrama — etapas `UC-10-01`, `UC-10-04`, `UC-10-05`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("audit.audit_log")]:::tabla
  t4[("audit.data_access_log")]:::tabla
  t5[("audit.patient_content_access_log")]:::tabla
  t10[("audit.analytics_governance_log")]:::tabla
  t12[("audit.dsar_requests")]:::tabla
  t17[("audit.moderation_decisions_history")]:::tabla
  t18[("audit.moderation_events")]:::tabla
  t20[("audit.delegated_access_audit_log")]:::tabla
  t21[("audit.identity_verification_access_log")]:::tabla
  t22[("audit.insurance_decision_access_log")]:::tabla
  t23[("audit.pharmacy_inventory_access_log")]:::tabla
  subgraph s0["UC-10-01 · Registrar acceso/lectura clínica (accounting WORM) + provenance"]
    o1["POST /audit/data-access"]:::op
  end
  subgraph s1["UC-10-04 · Registrar provenance de un cambio y sellar la cadena hash (incluye U…"]
    o6["POST /audit/events"]:::op
  end
  subgraph s2["UC-10-05 · Consultar historial / línea de tiempo (audita la propia lectura)"]
    o7["GET /audit/history/{entity}/{id}"]:::op
  end
  subgraph s3["UC-10-06 · Verificar integridad tamper-evidence y atestar"]
    o8["POST /audit/integrity/verify"]:::op
  end
  subgraph s4["UC-10-07 · Exportar evidencia de auditoría (idempotente por query_hash)"]
    o9["POST /compliance/audit-export"]:::op
  end
  subgraph s5["UC-10-08 · Tramitar DSAR (máquina de estados)"]
    o11["POST /privacy/dsar"]:::op
    o13["PATCH /privacy/dsar/{id}"]:::op
  end
  subgraph s6["UC-10-09 · Aplicar retención / archivado / litigation-hold"]
    o14["POST /audit/retention/apply"]:::op
  end
  subgraph s7["UC-10-10 · Detectar acceso anómalo"]
    o15["POST /audit/anomaly/scan"]:::op
  end
  subgraph s8["UC-10-11 · Registrar decisión de moderación / gobernanza"]
    o16["POST /moderation/decisions"]:::op
  end
  subgraph s9["UC-10-12 · Registrar acceso delegado / de tercero gobernado"]
    o19["POST /audit/third-party-access"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  a2 --> o6
  o6 -->|"CREA"| t3
  o6 -->|"LEE"| t3
  a2 --> o7
  o7 -->|"CREA"| t3
  o7 -->|"LEE"| t3
  o7 -->|"CREA"| t4
  a2 --> o8
  o8 -->|"CREA"| t3
  o8 -->|"LEE"| t3
  a2 --> o9
  o9 -->|"CREA"| t10
  o9 -->|"LEE"| t10
  o9 -->|"CREA"| t3
  o9 -->|"LEE"| t3
  a2 --> o11
  o11 -->|"CREA"| t10
  o11 -->|"CREA"| t3
  o11 -->|"LEE"| t3
  o11 -->|"CREA"| t12
  a2 --> o13
  o13 -->|"CREA"| t3
  o13 -->|"LEE"| t3
  o13 -->|"ACTUALIZA"| t12
  o13 -->|"LEE"| t12
  a2 --> o14
  o14 -->|"CREA"| t3
  o14 -->|"LEE"| t3
  o14 -->|"BORRA"| t4
  a2 --> o15
  o15 -->|"CREA"| t3
  o15 -->|"LEE"| t3
  o15 -->|"LEE"| t4
  a2 --> o16
  o16 -->|"CREA"| t10
  o16 -->|"CREA"| t3
  o16 -->|"LEE"| t3
  o16 -->|"CREA"| t17
  o16 -->|"CREA"| t18
  a2 --> o19
  o19 -->|"CREA"| t3
  o19 -->|"LEE"| t3
  o19 -->|"CREA"| t20
  o19 -->|"CREA"| t21
  o19 -->|"CREA"| t22
  o19 -->|"CREA"| t23
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /audit/data-access

Registrar acceso/lectura clínica (accounting WORM)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuditEventsService.recordDataAccess"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DataAccessLogRepository.record"]:::llamada
  n4 --> n5
  n6[("CREA audit.data_access_log")]:::efecto
  n5 --> n6
  n7{"dto.patientProfileId && dto.resourceId"}:::decision
  n6 --> n7
  n8["Llama a DataAccessLogRepository.recordPatientContent"]:::llamada
  n7 -->|"sí"| n8
  n9[("CREA audit.patient_content_access_log")]:::efecto
  n8 --> n9
  n10["Llama a AuditLogRepository.append"]:::llamada
  n9 --> n10
  n7 -->|"no"| n10
  n11["Llama a AuditLogRepository.findChainTip"]:::llamada
  n10 --> n11
  n12[("LEE audit.audit_log")]:::efecto
  n11 --> n12
  n13[("CREA audit.audit_log")]:::efecto
  n12 --> n13
  n14(("201 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /audit/history/{entity}/{id}

Consultar historial / línea de tiempo de un registro

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entidad de historial no soportada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuditHistoryService.getTimeline"]:::llamada
  n2 --> n3
  n4{"!this.historyRepo.isSupported(entity)"}:::decision
  n3 --> n4
  n5(["404 NOT_FOUND Entidad de historial no soportada"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a DataAccessLogRepository.record"]:::llamada
  n6 --> n7
  n8[("CREA audit.data_access_log")]:::efecto
  n7 --> n8
  n9["Llama a AuditLogRepository.append"]:::llamada
  n8 --> n9
  n10["Llama a AuditLogRepository.findChainTip"]:::llamada
  n9 --> n10
  n11[("LEE audit.audit_log")]:::efecto
  n10 --> n11
  n12[("CREA audit.audit_log")]:::efecto
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

#### 3. POST /audit/retention/apply

Aplicar retención / archivado / litigation-hold

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
  n3["Llama a AuditEventsService.applyRetention"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"dto.olderThan && scope === 'data_access_log'"}:::decision
  n4 --> n5
  n6["Llama a DataAccessLogRepository.purgeOlderThan"]:::llamada
  n5 -->|"sí"| n6
  n7[("BORRA audit.data_access_log")]:::efecto
  n6 --> n7
  n8["Llama a AuditLogRepository.append"]:::llamada
  n7 --> n8
  n5 -->|"no"| n8
  n9["Llama a AuditLogRepository.findChainTip"]:::llamada
  n8 --> n9
  n10[("LEE audit.audit_log")]:::efecto
  n9 --> n10
  n11[("CREA audit.audit_log")]:::efecto
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

#### 4. POST /audit/third-party-access

Registrar acceso delegado / de tercero gobernado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el campo requerido para el canal: {field} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ThirdPartyAccessService.record"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"según dto.channel"}:::decision
  n4 --> n5
  n6["Llama a ThirdPartyAccessService.require"]:::llamada
  n5 -->|"'DELEGATED'"| n6
  n7{"!value"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED Falta el campo requerido para el canal: {field}"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ThirdPartyAccessRepository.recordDelegated"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA audit.delegated_access_audit_log")]:::efecto
  n9 --> n10
  n11["Llama a ThirdPartyAccessService.require"]:::llamada
  n5 -->|"'INSURANCE'"| n11
  n12{"!value"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED Falta el campo requerido para el canal: {field}"]):::error
  n12 -->|"sí"| n13
  n14["Llama a ThirdPartyAccessService.require"]:::llamada
  n12 -->|"no"| n14
  n15{"!value"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED Falta el campo requerido para el canal: {field}"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ThirdPartyAccessRepository.recordInsurance"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA audit.insurance_decision_access_log")]:::efecto
  n17 --> n18
  n19["Llama a ThirdPartyAccessService.require"]:::llamada
  n5 -->|"'IDENTITY'"| n19
  n20{"!value"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED Falta el campo requerido para el canal: {field}"]):::error
  n20 -->|"sí"| n21
  n22["Llama a ThirdPartyAccessRepository.recordIdentity"]:::llamada
  n20 -->|"no"| n22
  n23[("CREA audit.identity_verification_access_log")]:::efecto
  n22 --> n23
  n24["Llama a ThirdPartyAccessService.require"]:::llamada
  n5 -->|"por defecto"| n24
  n25{"!value"}:::decision
  n24 --> n25
  n26(["422 PRECONDITION_FAILED Falta el campo requerido para el canal: {field}"]):::error
  n25 -->|"sí"| n26
  n27["Llama a ThirdPartyAccessRepository.recordPharmacy"]:::llamada
  n25 -->|"no"| n27
  n28[("CREA audit.pharmacy_inventory_access_log")]:::efecto
  n27 --> n28
  n29["Llama a AuditLogRepository.append"]:::llamada
  n10 --> n29
  n18 --> n29
  n23 --> n29
  n28 --> n29
  n30["Llama a AuditLogRepository.findChainTip"]:::llamada
  n29 --> n30
  n31[("LEE audit.audit_log")]:::efecto
  n30 --> n31
  n32[("CREA audit.audit_log")]:::efecto
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

#### 5. POST /compliance/audit-export

Exportar evidencia de auditoría para cumplimiento

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una exportación con ese query_hash |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ComplianceService.exportEvidence"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"dto.queryHash"}:::decision
  n4 --> n5
  n6["Llama a AnalyticsGovernanceLogRepository.existsByQueryHash"]:::llamada
  n5 -->|"sí"| n6
  n7[("LEE audit.analytics_governance_log")]:::efecto
  n6 --> n7
  n8{"dup › 0"}:::decision
  n7 --> n8
  n9(["409 CONFLICT Ya existe una exportación con ese query_hash"]):::error
  n8 -->|"sí"| n9
  n10["Llama a AnalyticsGovernanceLogRepository.record"]:::llamada
  n8 -->|"no"| n10
  n5 -->|"no"| n10
  n11[("CREA audit.analytics_governance_log")]:::efecto
  n10 --> n11
  n12["Llama a AuditLogRepository.append"]:::llamada
  n11 --> n12
  n13["Llama a AuditLogRepository.findChainTip"]:::llamada
  n12 --> n13
  n14[("LEE audit.audit_log")]:::efecto
  n13 --> n14
  n15[("CREA audit.audit_log")]:::efecto
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

#### 6. POST /moderation/decisions

Registrar decisión de moderación / gobernanza analítica

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ModerationService.recordDecision"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ModerationRepository.record"]:::llamada
  n4 --> n5
  n6[("CREA audit.moderation_events")]:::efecto
  n5 --> n6
  n7{"dto.governance"}:::decision
  n6 --> n7
  n8["Llama a AnalyticsGovernanceLogRepository.record"]:::llamada
  n7 -->|"sí"| n8
  n9[("CREA audit.analytics_governance_log")]:::efecto
  n8 --> n9
  n10{"dto.moderationDecisionId"}:::decision
  n9 --> n10
  n7 -->|"no"| n10
  n11["Llama a ModerationRepository.recordHistory"]:::llamada
  n10 -->|"sí"| n11
  n12[("CREA audit.moderation_decisions_history")]:::efecto
  n11 --> n12
  n13["Llama a AuditLogRepository.append"]:::llamada
  n12 --> n13
  n10 -->|"no"| n13
  n14["Llama a AuditLogRepository.findChainTip"]:::llamada
  n13 --> n14
  n15[("LEE audit.audit_log")]:::efecto
  n14 --> n15
  n16[("CREA audit.audit_log")]:::efecto
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

#### 7. PATCH /privacy/dsar/{id}

Avanzar la máquina de estados de una solicitud DSAR

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud DSAR no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud DSAR ya está en estado terminal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ComplianceService.updateDsar"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DsarRequestsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE audit.dsar_requests")]:::efecto
  n5 --> n6
  n7{"!dsar"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud DSAR no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"TERMINAL.has(dsar.statusConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La solicitud DSAR ya está en estado terminal"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA audit.dsar_requests")]:::efecto
  n9 -->|"no"| n11
  n12{"dto.status === 'COMPLETED'"}:::decision
  n11 --> n12
  n13[("ACTUALIZA audit.dsar_requests · ACTUALIZA audit.dsar_requests")]:::efecto
  n12 -->|"sí"| n13
  n14["Llama a AuditLogRepository.append"]:::llamada
  n13 --> n14
  n12 -->|"no"| n14
  n15["Llama a AuditLogRepository.findChainTip"]:::llamada
  n14 --> n15
  n16[("LEE audit.audit_log")]:::efecto
  n15 --> n16
  n17[("CREA audit.audit_log")]:::efecto
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

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| POST /audit/anomaly/scan | 200, 400, 401, 403, 429 | 3 |
| POST /audit/events | 201, 400, 401, 403, 429 | 2 |
| POST /audit/integrity/verify | 200, 400, 401, 403, 429 | 2 |
| POST /privacy/dsar | 201, 400, 401, 403, 429 | 4 |
