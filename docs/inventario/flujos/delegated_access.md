<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `delegated_access`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 11 (11 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [delegated_access](../endpoints/delegated_access.md)

## Proceso: Módulo 29 — Delegated Access and Scoped Infrastructure Users

- **Código:** `delegated_access` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 11
- **Actores:** SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/delegated_access/README.md`

### Para qué sirve

Delegación scoped de acceso: usuarios de organización con alcance y vigencia, sets de permisos delegados versionados, delegaciones de practitioner, solicitudes con aprobación previa, grants temporales por propósito, revocación en cascada, barrido de expiración y evaluación del actor efectivo (con step-up). Sin impersonación: delegante y delegado quedan siempre auditados en `delegation_events`.

_Fuente: `src/modules/delegated_access/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-29-01` | Asignar usuario de organización (scoped, vigente) | POST /org/{tenantMembershipId}/user-assignments | SECURITY_ADMIN | MEDIO | 2 |
| `UC-29-02` | Publicar set de permisos delegados (v1) | POST /delegated-permission-sets | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /delegated-permission-sets/{id}/versions | SECURITY_ADMIN | ALTO | 4 |
| `UC-29-03` | Crear delegación de practitioner | POST /practitioner-delegates | SECURITY_ADMIN | MEDIO | 4 |
| `UC-29-04` | Solicitar acceso delegado (aprobación previa) | POST /practitioner-delegates/{id}/access-requests | SECURITY_ADMIN | MEDIO | 4 |
| `UC-29-05` | Aprobar/Denegar y emitir grant scoped | POST /access-requests/{id}/decision | SECURITY_ADMIN | MEDIO | 4 |
| `UC-29-06` | Grant pre-autorizado por-propósito y temporal | POST /practitioner-delegates/{id}/grants | SECURITY_ADMIN | MEDIO | 3 |
| `UC-29-07` | Revocar delegación inmediata (cascada) | POST /practitioner-delegates/{id}/revoke | SECURITY_ADMIN | MEDIO | 5 |
| `UC-29-08` | Expirar delegaciones y grants vencidos | POST /delegated-access/expiry-sweep | SYSTEM · SECURITY_ADMIN | MEDIO | 7 |
| `UC-29-09` | Evaluar actor efectivo por propósito (step-up) | POST /authz/effective-actor/evaluate | SECURITY_ADMIN | MEDIO | 4 |
| `UC-29-10` | Reasignar supervisor / suspender (cascada) | PATCH /org/user-assignments/{id} | SECURITY_ADMIN | MEDIO | 3 |

### Diagrama — etapas `UC-29-01`, `UC-29-02`, `UC-29-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a18(["SYSTEM · SECURITY_ADMIN"]):::actor
  t3[("delegated_access.organization_user_assignments")]:::tabla
  t5[("delegated_access.delegated_permission_set_items")]:::tabla
  t6[("delegated_access.delegated_permission_sets")]:::tabla
  t9[("delegated_access.delegation_events")]:::tabla
  t10[("delegated_access.practitioner_delegate_assignments")]:::tabla
  t12[("delegated_access.delegated_access_approval_reques…")]:::tabla
  t14[("delegated_access.delegated_access_grants")]:::tabla
  subgraph s0["UC-29-01 · Asignar usuario de organización (scoped, vigente)"]
    o1["POST /org/{tenantMembershipId}/user-assignments"]:::op
  end
  subgraph s1["UC-29-02 · Publicar set de permisos delegados (v1)"]
    o4["POST /delegated-permission-sets"]:::op
    o7["POST /delegated-permission-sets/{id}/versions"]:::op
  end
  subgraph s2["UC-29-03 · Crear delegación de practitioner"]
    o8["POST /practitioner-delegates"]:::op
  end
  subgraph s3["UC-29-04 · Solicitar acceso delegado (aprobación previa)"]
    o11["POST /practitioner-delegates/{id}/access-requests"]:::op
  end
  subgraph s4["UC-29-05 · Aprobar/Denegar y emitir grant scoped"]
    o13["POST /access-requests/{id}/decision"]:::op
  end
  subgraph s5["UC-29-06 · Grant pre-autorizado por-propósito y temporal"]
    o15["POST /practitioner-delegates/{id}/grants"]:::op
  end
  subgraph s6["UC-29-07 · Revocar delegación inmediata (cascada)"]
    o16["POST /practitioner-delegates/{id}/revoke"]:::op
  end
  t19[("+1 tablas más")]
  subgraph s7["UC-29-08 · Expirar delegaciones y grants vencidos"]
    o17["POST /delegated-access/expiry-sweep"]:::op
  end
  subgraph s8["UC-29-09 · Evaluar actor efectivo por propósito (step-up)"]
    o20["POST /authz/effective-actor/evaluate"]:::op
  end
  subgraph s9["UC-29-10 · Reasignar supervisor / suspender (cascada)"]
    o21["PATCH /org/user-assignments/{id}"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"CREA"| t5
  o4 -->|"CREA"| t6
  o4 -->|"LEE"| t6
  a2 --> o7
  o7 -->|"BORRA"| t5
  o7 -->|"CREA"| t5
  o7 -->|"ACTUALIZA"| t6
  o7 -->|"LEE"| t6
  a2 --> o8
  o8 -->|"LEE"| t6
  o8 -->|"CREA"| t9
  o8 -->|"LEE"| t3
  o8 -->|"CREA"| t10
  a2 --> o11
  o11 -->|"CREA"| t12
  o11 -->|"LEE"| t12
  o11 -->|"CREA"| t9
  o11 -->|"LEE"| t10
  a2 --> o13
  o13 -->|"ACTUALIZA"| t12
  o13 -->|"LEE"| t12
  o13 -->|"CREA"| t14
  o13 -->|"CREA"| t9
  a2 --> o15
  o15 -->|"CREA"| t14
  o15 -->|"CREA"| t9
  o15 -->|"LEE"| t10
  a2 --> o16
  o16 -->|"ACTUALIZA"| t12
  o16 -->|"ACTUALIZA"| t14
  o16 -->|"CREA"| t9
  o16 -->|"ACTUALIZA"| t10
  o16 -->|"LEE"| t10
  a18 --> o17
  o17 -->|"ACTUALIZA"| t14
  o17 -->|"LEE"| t14
  o17 -->|"CREA"| t9
  o17 -->|"ACTUALIZA"| t3
  o17 -->|"LEE"| t3
  o17 -->|"ACTUALIZA"| t10
  o17 -.-> t19
  a2 --> o20
  o20 -->|"LEE"| t14
  o20 -->|"LEE"| t5
  o20 -->|"CREA"| t9
  o20 -->|"LEE"| t10
  a2 --> o21
  o21 -->|"ACTUALIZA"| t3
  o21 -->|"LEE"| t3
  o21 -->|"ACTUALIZA"| t10
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /access-requests/{id}/decision

Aprobar/Denegar solicitud y emitir grant scoped

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AccessRequestsService.decide"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DelegatedAccessApprovalRequestsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.delegated_access_approval_requests")]:::efecto
  n5 --> n6
  n7{"!request"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"request.statusConceptId !== DELEG.REQUEST_OPEN"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La solicitud no está abierta"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA delegated_access.delegated_access_approval_requests · ACTUALIZA delegated_access.delegated_access_a…")]:::efecto
  n9 -->|"no"| n11
  n12{"approved"}:::decision
  n11 --> n12
  n13["Llama a DelegatedAccessGrantsRepository.create"]:::llamada
  n12 -->|"sí"| n13
  n14[("CREA delegated_access.delegated_access_grants")]:::efecto
  n13 --> n14
  n15["Llama a DelegationEventsRepository.record"]:::llamada
  n14 --> n15
  n12 -->|"no"| n15
  n16[("CREA delegated_access.delegation_events")]:::efecto
  n15 --> n16
  n17(("200 Responde con éxito")):::ok
  n16 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /authz/effective-actor/evaluate

Evaluar actor efectivo por propósito (step-up)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DelegatedAccessEvaluationService.evaluate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n5 --> n6
  n7{"!delegate"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Delegación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"!withinWindow"}:::decision
  n7 -->|"no"| n9
  n10["Llama a DelegationEventsRepository.record"]:::llamada
  n9 -->|"sí"| n10
  n11[("CREA delegated_access.delegation_events")]:::efecto
  n10 --> n11
  n12["Llama a DelegatedAccessGrantsRepository.findActiveMatch"]:::llamada
  n11 --> n12
  n9 -->|"no"| n12
  n13[("LEE delegated_access.delegated_access_grants")]:::efecto
  n12 --> n13
  n14{"!grant"}:::decision
  n13 --> n14
  n15["Llama a DelegationEventsRepository.record"]:::llamada
  n14 -->|"sí"| n15
  n16[("CREA delegated_access.delegation_events")]:::efecto
  n15 --> n16
  n17{"dto.permissionId"}:::decision
  n16 --> n17
  n14 -->|"no"| n17
  n18["Llama a DelegatedPermissionSetItemsRepository.findBySetAndPermission"]:::llamada
  n17 -->|"sí"| n18
  n19[("LEE delegated_access.delegated_permission_set_items")]:::efecto
  n18 --> n19
  n20{"requiresStepUp"}:::decision
  n19 --> n20
  n17 -->|"no"| n20
  n21["Llama a DelegationEventsRepository.record"]:::llamada
  n20 -->|"sí"| n21
  n22[("CREA delegated_access.delegation_events")]:::efecto
  n21 --> n22
  n23["Llama a DelegationEventsRepository.record"]:::llamada
  n22 --> n23
  n20 -->|"no"| n23
  n24[("CREA delegated_access.delegation_events")]:::efecto
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

#### 3. POST /delegated-access/expiry-sweep

Expirar delegaciones y grants vencidos (barrido)

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
  n3["Llama a DelegatedAccessEvaluationService.expirySweep"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DelegatedAccessGrantsRepository.findOverdueActive"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.delegated_access_grants")]:::efecto
  n5 --> n6
  n7["Repite: por cada const grant de grants"]:::bucle
  n6 --> n7
  n8[("ACTUALIZA delegated_access.delegated_access_grants")]:::efecto
  n7 -->|"cada elemento"| n8
  n9["Llama a DelegationEventsRepository.record"]:::llamada
  n8 --> n9
  n10[("CREA delegated_access.delegation_events")]:::efecto
  n9 --> n10
  n11["Llama a PractitionerDelegateAssignmentsRepository.findOverdueActive"]:::llamada
  n10 --> n11
  n7 -->|"al terminar"| n11
  n12[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n11 --> n12
  n13["Repite: por cada const delegate de delegates"]:::bucle
  n12 --> n13
  n14[("ACTUALIZA delegated_access.practitioner_delegate_assignments")]:::efecto
  n13 -->|"cada elemento"| n14
  n15["Llama a DelegationEventsRepository.record"]:::llamada
  n14 --> n15
  n16[("CREA delegated_access.delegation_events")]:::efecto
  n15 --> n16
  n17["Llama a OrganizationUserAssignmentsRepository.findOverdueActive"]:::llamada
  n16 --> n17
  n13 -->|"al terminar"| n17
  n18[("LEE delegated_access.organization_user_assignments")]:::efecto
  n17 --> n18
  n19["Repite: por cada const assignment de orgAssignments"]:::bucle
  n18 --> n19
  n20[("ACTUALIZA delegated_access.organization_user_assignments")]:::efecto
  n19 -->|"cada elemento"| n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  n19 -->|"al terminar"| n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /delegated-permission-sets

Publicar set de permisos delegados (scoped)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un set con ese código en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PermissionSetsService.createSet"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DelegatedPermissionSetsRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un set con ese código en el tenant"]):::error
  n7 -->|"sí"| n8
  n9["Llama a DelegatedPermissionSetsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA delegated_access.delegated_permission_sets")]:::efecto
  n9 --> n10
  n11["Repite: por cada const item de dto.items"]:::bucle
  n10 --> n11
  n12["Llama a DelegatedPermissionSetItemsRepository.create"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("CREA delegated_access.delegated_permission_set_items")]:::efecto
  n12 --> n13
  n14(("201 Responde con éxito")):::ok
  n13 --> n14
  n11 -->|"al terminar"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /delegated-permission-sets/{id}/versions

Versionar set de permisos delegados

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Set de permisos no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PermissionSetsService.publishVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n5 --> n6
  n7{"!set"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Set de permisos no encontrado"]):::error
  n7 -->|"sí"| n8
  n9[("ACTUALIZA delegated_access.delegated_permission_sets · ACTUALIZA delegated_access.delegated_permission_sets")]:::efecto
  n7 -->|"no"| n9
  n10["Llama a DelegatedPermissionSetItemsRepository.deleteBySet"]:::llamada
  n9 --> n10
  n11[("BORRA delegated_access.delegated_permission_set_items")]:::efecto
  n10 --> n11
  n12["Repite: por cada const item de dto.items"]:::bucle
  n11 --> n12
  n13["Llama a DelegatedPermissionSetItemsRepository.create"]:::llamada
  n12 -->|"cada elemento"| n13
  n14[("CREA delegated_access.delegated_permission_set_items")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  n12 -->|"al terminar"| n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /org/{tenantMembershipId}/user-assignments

Asignar usuario de organización con alcance y vigencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una asignación activa con ese rol y alcance |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OrgUserAssignmentsService.createAssignment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OrganizationUserAssignmentsRepository.findActiveOverlap"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.organization_user_assignments")]:::efecto
  n5 --> n6
  n7{"overlap"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una asignación activa con ese rol y alcance"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OrganizationUserAssignmentsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA delegated_access.organization_user_assignments")]:::efecto
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

#### 7. PATCH /org/user-assignments/{id}

Reasignar supervisor / suspender asignación de organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación no encontrada |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: row_version no coincide |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay cambios que aplicar; PreconditionFailedException: La asignación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OrgUserAssignmentsService.updateAssignment"]:::llamada
  n2 --> n3
  n4{"dto.supervisorUserId === undefined && dto.accessScope === undefined && !dto.suspend"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED No hay cambios que aplicar"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a OrganizationUserAssignmentsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments")]:::efecto
  n7 --> n8
  n9{"!assignment"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Asignación no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"assignment.statusConceptId !== STATUS.ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La asignación no está activa"]):::error
  n11 -->|"sí"| n12
  n13{"dto.expectedRowVersion !== undefined && dto.expectedRowVersion !== assignment.rowVersion"}:::decision
  n11 -->|"no"| n13
  n14(["409 CONCURRENCY_CONFLICT row_version no coincide"]):::error
  n13 -->|"sí"| n14
  n15{"dto.supervisorUserId !== undefined"}:::decision
  n13 -->|"no"| n15
  n16[("ACTUALIZA delegated_access.organization_user_assignments")]:::efecto
  n15 -->|"sí"| n16
  n17{"dto.accessScope !== undefined"}:::decision
  n16 --> n17
  n15 -->|"no"| n17
  n18[("ACTUALIZA delegated_access.organization_user_assignments")]:::efecto
  n17 -->|"sí"| n18
  n19{"dto.suspend"}:::decision
  n18 --> n19
  n17 -->|"no"| n19
  n20[("ACTUALIZA delegated_access.organization_user_assignments")]:::efecto
  n19 -->|"sí"| n20
  n21["Llama a PractitionerDelegateAssignmentsRepository.suspendByDelegateAssignment"]:::llamada
  n20 --> n21
  n22[("ACTUALIZA delegated_access.practitioner_delegate_assignments")]:::efecto
  n21 --> n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  n19 -->|"no"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /practitioner-delegates

Crear asignación de delegado de practitioner

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación de usuario de organización no encontrada; ResourceNotFoundException: Set de permisos no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El usuario de organización no está activo; PreconditionFailedException: El set de permisos no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PractitionerDelegatesService.createDelegate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OrganizationUserAssignmentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.organization_user_assignments")]:::efecto
  n5 --> n6
  n7{"!orgAssignment"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Asignación de usuario de organización no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"orgAssignment.statusConceptId !== STATUS.ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El usuario de organización no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n11 --> n12
  n13{"!set"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Set de permisos no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"set.statusConceptId !== STATUS.ACTIVE"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El set de permisos no está activo"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PractitionerDelegateAssignmentsRepository.create"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA delegated_access.practitioner_delegate_assignments")]:::efecto
  n17 --> n18
  n19["Llama a DelegationEventsRepository.record"]:::llamada
  n18 --> n19
  n20[("CREA delegated_access.delegation_events")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /practitioner-delegates/{id}/access-requests

Solicitar acceso delegado (aprobación previa)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una solicitud pendiente equivalente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AccessRequestsService.requestAccess"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n5 --> n6
  n7{"!delegate"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Delegación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"delegate.statusConceptId !== STATUS.ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La delegación no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a DelegatedAccessApprovalRequestsRepository.findOpenDuplicate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE delegated_access.delegated_access_approval_requests")]:::efecto
  n11 --> n12
  n13{"dup"}:::decision
  n12 --> n13
  n14(["409 CONFLICT Ya existe una solicitud pendiente equivalente"]):::error
  n13 -->|"sí"| n14
  n15["Llama a DelegatedAccessApprovalRequestsRepository.create"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA delegated_access.delegated_access_approval_requests")]:::efecto
  n15 --> n16
  n17["Llama a DelegationEventsRepository.record"]:::llamada
  n16 --> n17
  n18[("CREA delegated_access.delegation_events")]:::efecto
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

#### 10. POST /practitioner-delegates/{id}/grants

Otorgar grant delegado por-propósito y temporal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PractitionerDelegatesService.issueGrant"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n5 --> n6
  n7{"!delegate"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Delegación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"delegate.statusConceptId !== STATUS.ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La delegación no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a DelegatedAccessGrantsRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA delegated_access.delegated_access_grants")]:::efecto
  n11 --> n12
  n13["Llama a DelegationEventsRepository.record"]:::llamada
  n12 --> n13
  n14[("CREA delegated_access.delegation_events")]:::efecto
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

#### 11. POST /practitioner-delegates/{id}/revoke

Revocar delegación de forma inmediata (cascada authz)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PractitionerDelegatesService.revoke"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n5 --> n6
  n7{"!delegate"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Delegación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9[("ACTUALIZA delegated_access.practitioner_delegate_assignments · ACTUALIZA delegated_access.practitioner_delega…")]:::efecto
  n7 -->|"no"| n9
  n10["Llama a DelegatedAccessGrantsRepository.revokeActiveByAssignment"]:::llamada
  n9 --> n10
  n11[("ACTUALIZA delegated_access.delegated_access_grants")]:::efecto
  n10 --> n11
  n12["Llama a DelegatedAccessApprovalRequestsRepository.cancelOpenByAssignment"]:::llamada
  n11 --> n12
  n13[("ACTUALIZA delegated_access.delegated_access_approval_requests")]:::efecto
  n12 --> n13
  n14["Llama a DelegationEventsRepository.record"]:::llamada
  n13 --> n14
  n15[("CREA delegated_access.delegation_events")]:::efecto
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

