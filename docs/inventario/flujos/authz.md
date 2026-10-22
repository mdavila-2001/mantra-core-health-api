<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `authz`

- **Procesos:** 2 · **Máquinas de estado:** 0
- **Operaciones:** 27 (22 con decisiones propias, 5 sin ellas)
- Inventario de endpoints del módulo: [authz](../endpoints/authz.md)

## Proceso: Módulo 06 — authz (Authorization, Purpose of Use & Field Masking)

- **Código:** `authz` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 27
- **Actores:** CLINICAL_APPROVER · CLINICIAN · PATIENT · PRACTITIONER · SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/authz/README.md`

### Para qué sirve

Autorización de la plataforma: catálogo de permisos, políticas ABAC, roles con herencia, asignaciones y excepciones por usuario, accesos clínicos con propósito de uso, break-the-glass, enmascaramiento de campos, grants polimórficos y el PDP (invalidación de cache + evaluación de decisiones efectivas).

_Fuente: `src/modules/authz/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:AuthzCareRelationshipsController` | Operaciones de AuthzCareRelationshipsController que el README no asigna a un caso de uso | GET /authz/care-relationships | CLINICIAN · SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /authz/care-relationships | CLINICIAN · SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /authz/care-relationships/{id}/respond | PATIENT | MEDIO | 8 |
|  |  | POST /authz/care-relationships/{id}/revoke | CLINICIAN · SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /authz/care-relationships/request | CLINICIAN · PRACTITIONER | MEDIO | 14 |
|  |  | GET /authz/care-relationships/requests/mine | PATIENT | BAJO | 1 |
|  |  | GET /authz/legal-representations | SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /authz/legal-representations | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /authz/legal-representations/{id}/revoke | SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:AuthzCatalogController` | Operaciones de AuthzCatalogController que el README no asigna a un caso de uso | POST /authz/permission-categories | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /authz/permissions | SECURITY_ADMIN | MEDIO | 3 |
| `ctrl:AuthzClinicalController` | Operaciones de AuthzClinicalController que el README no asigna a un caso de uso | DELETE /authz/clinical-access-grants/{grantId} | CLINICAL_APPROVER · SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /authz/patients/{patientProfileId}/break-the-glass | CLINICAL_APPROVER · SECURITY_ADMIN | MEDIO | 9 |
|  |  | POST /authz/patients/{patientProfileId}/clinical-access-grants | CLINICAL_APPROVER · SECURITY_ADMIN | MEDIO | 5 |
| `ctrl:AuthzGrantsController` | Operaciones de AuthzGrantsController que el README no asigna a un caso de uso | POST /authz/resource-scope-grants | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /authz/users/{userId}/permission-grants | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /authz/users/{userId}/role-assignments | SECURITY_ADMIN | MEDIO | 3 |
| `ctrl:AuthzMeController` | Operaciones de AuthzMeController que el README no asigna a un caso de uso | GET /authz/me/access | PATIENT | BAJO | 5 |
|  |  | POST /authz/me/care-relationships/{id}/revoke | PATIENT | MEDIO | 4 |
|  |  | POST /authz/me/clinical-access-grants/{grantId}/revoke | PATIENT | MEDIO | 7 |
| `ctrl:AuthzPdpController` | Operaciones de AuthzPdpController que el README no asigna a un caso de uso | POST /authz/decisions/evaluate | SECURITY_ADMIN | BAJO | 11 |
|  |  | POST /authz/pdp/cache/invalidate | SECURITY_ADMIN | BAJO | 0 |
| `ctrl:AuthzPoliciesController` | Operaciones de AuthzPoliciesController que el README no asigna a un caso de uso | POST /authz/tenants/{tenantId}/access-policies | SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:AuthzRolesController` | Operaciones de AuthzRolesController que el README no asigna a un caso de uso | GET /authz/roles | SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /authz/roles | SECURITY_ADMIN | MEDIO | 2 |
|  |  | PUT /authz/roles/{roleId}/field-permissions | SECURITY_ADMIN | MEDIO | 4 |
|  |  | PUT /authz/roles/{roleId}/permissions | SECURITY_ADMIN | MEDIO | 4 |

### Diagrama 1 de 2 — etapas `ctrl:AuthzCareRelationshipsController`, `ctrl:AuthzCatalogController`, `ctrl:AuthzClinicalController`…

```mermaid
flowchart LR
  a2(["CLINICIAN · SECURITY_ADMIN"]):::actor
  a6(["PATIENT"]):::actor
  a14(["CLINICIAN · PRACTITIONER"]):::actor
  a19(["SECURITY_ADMIN"]):::actor
  a28(["CLINICAL_APPROVER · SECURITY_ADMIN"]):::actor
  t3[("authz.care_relationships")]:::tabla
  t7[("audit.audit_log")]:::tabla
  t8[("iam.sessions")]:::tabla
  t9[("messaging.domain_events")]:::tabla
  e11>"authz.care_relationship.responded"]:::evento
  t15[("messaging.in_app_notifications")]:::tabla
  t20[("authz.patient_legal_representations")]:::tabla
  t24[("authz.permission_categories")]:::tabla
  t26[("authz.permissions")]:::tabla
  t29[("authz.clinical_access_grants")]:::tabla
  t31[("audit.data_access_log")]:::tabla
  t32[("authz.break_glass_sessions")]:::tabla
  e34>"authz.break_glass.activated"]:::evento
  t37[("authz.resource_scope_grants")]:::tabla
  t39[("authz.user_permission_grants")]:::tabla
  t41[("authz.roles")]:::tabla
  t42[("authz.user_role_assignments")]:::tabla
  t44[("profiles.patient_profiles")]:::tabla
  t45[("profiles.person_account_links")]:::tabla
  t46[("profiles.persons")]:::tabla
  t51[("authz.access_policies")]:::tabla
  t52[("authz.field_permissions")]:::tabla
  t10[("+2 tablas más")]
  t16[("+8 tablas más")]
  subgraph s0["ctrl:AuthzCareRelationshipsController · Operaciones de AuthzCareRelationshipsCo…"]
    o1["GET /authz/care-relationships"]:::op
    o4["POST /authz/care-relationships"]:::op
    o5["POST /authz/care-relationships/{id}/respond"]:::op
    o12["POST /authz/care-relationships/{id}/revoke"]:::op
    o13["POST /authz/care-relationships/request"]:::op
    o17["GET /authz/care-relationships/requests/mine"]:::op
    o18["GET /authz/legal-representations"]:::op
    o21["POST /authz/legal-representations"]:::op
    o22["POST /authz/legal-representations/{id}/revoke"]:::op
  end
  subgraph s1["ctrl:AuthzCatalogController · Operaciones de AuthzCatalogController que el READ…"]
    o23["POST /authz/permission-categories"]:::op
    o25["POST /authz/permissions"]:::op
  end
  t33[("+3 tablas más")]
  subgraph s2["ctrl:AuthzClinicalController · Operaciones de AuthzClinicalController que el RE…"]
    o27["DELETE /authz/clinical-access-grants/{grantId}"]:::op
    o30["POST /authz/patients/{patientProfileId}/break-the-glass"]:::op
    o35["POST /authz/patients/{patientProfileId}/clinical-access-grants"]:::op
  end
  subgraph s3["ctrl:AuthzGrantsController · Operaciones de AuthzGrantsController que el README…"]
    o36["POST /authz/resource-scope-grants"]:::op
    o38["POST /authz/users/{userId}/permission-grants"]:::op
    o40["POST /authz/users/{userId}/role-assignments"]:::op
  end
  t49[("+1 tablas más")]
  subgraph s4["ctrl:AuthzMeController · Operaciones de AuthzMeController que el README no asig…"]
    o43["GET /authz/me/access"]:::op
    o47["POST /authz/me/care-relationships/{id}/revoke"]:::op
    o48["POST /authz/me/clinical-access-grants/{grantId}/revoke"]:::op
  end
  t53[("+5 tablas más")]
  subgraph s5["ctrl:AuthzPdpController · Operaciones de AuthzPdpController que el README no as…"]
    o50["POST /authz/decisions/evaluate"]:::op
    o54["POST /authz/pdp/cache/invalidate"]:::op
  end
  subgraph s6["ctrl:AuthzPoliciesController · Operaciones de AuthzPoliciesController que el RE…"]
    o55["POST /authz/tenants/{tenantId}/access-policies"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"CREA"| t3
  o4 -->|"LEE"| t3
  a6 --> o5
  o5 -->|"CREA"| t7
  o5 -->|"LEE"| t7
  o5 -->|"ACTUALIZA"| t3
  o5 -->|"LEE"| t3
  o5 -->|"LEE"| t8
  o5 -->|"CREA"| t9
  o5 -.-> t10
  o5 -->|"evento"| e11
  a2 --> o12
  o12 -->|"ACTUALIZA"| t3
  o12 -->|"LEE"| t3
  a14 --> o13
  o13 -->|"CREA"| t7
  o13 -->|"LEE"| t7
  o13 -->|"CREA"| t3
  o13 -->|"LEE"| t3
  o13 -->|"LEE"| t8
  o13 -->|"CREA"| t15
  o13 -.-> t16
  a6 --> o17
  o17 -->|"LEE"| t3
  a19 --> o18
  o18 -->|"LEE"| t20
  a19 --> o21
  o21 -->|"CREA"| t20
  o21 -->|"LEE"| t20
  a19 --> o22
  o22 -->|"ACTUALIZA"| t20
  o22 -->|"LEE"| t20
  a19 --> o23
  o23 -->|"CREA"| t24
  o23 -->|"LEE"| t24
  a19 --> o25
  o25 -->|"LEE"| t24
  o25 -->|"CREA"| t26
  o25 -->|"LEE"| t26
  a28 --> o27
  o27 -->|"CREA"| t7
  o27 -->|"LEE"| t7
  o27 -->|"ACTUALIZA"| t29
  o27 -->|"LEE"| t29
  o27 -->|"LEE"| t8
  a28 --> o30
  o30 -->|"CREA"| t7
  o30 -->|"LEE"| t7
  o30 -->|"CREA"| t31
  o30 -->|"CREA"| t32
  o30 -->|"CREA"| t29
  o30 -->|"LEE"| t8
  o30 -.-> t33
  o30 -->|"evento"| e34
  a28 --> o35
  o35 -->|"CREA"| t7
  o35 -->|"LEE"| t7
  o35 -->|"CREA"| t29
  o35 -->|"LEE"| t29
  o35 -->|"LEE"| t8
  a19 --> o36
  o36 -->|"LEE"| t26
  o36 -->|"CREA"| t37
  o36 -->|"LEE"| t37
  a19 --> o38
  o38 -->|"LEE"| t26
  o38 -->|"CREA"| t39
  o38 -->|"LEE"| t39
  a19 --> o40
  o40 -->|"LEE"| t41
  o40 -->|"CREA"| t42
  o40 -->|"LEE"| t42
  a6 --> o43
  o43 -->|"LEE"| t3
  o43 -->|"LEE"| t29
  o43 -->|"LEE"| t44
  o43 -->|"LEE"| t45
  o43 -->|"LEE"| t46
  a6 --> o47
  o47 -->|"ACTUALIZA"| t3
  o47 -->|"LEE"| t3
  o47 -->|"LEE"| t44
  o47 -->|"LEE"| t45
  a6 --> o48
  o48 -->|"CREA"| t7
  o48 -->|"LEE"| t7
  o48 -->|"ACTUALIZA"| t29
  o48 -->|"LEE"| t29
  o48 -->|"LEE"| t8
  o48 -->|"LEE"| t44
  o48 -.-> t49
  a19 --> o50
  o50 -->|"LEE"| t51
  o50 -->|"LEE"| t3
  o50 -->|"LEE"| t29
  o50 -->|"LEE"| t52
  o50 -->|"LEE"| t20
  o50 -->|"LEE"| t26
  o50 -.-> t53
  a19 --> o54
  a19 --> o55
  o55 -->|"CREA"| t51
  o55 -->|"LEE"| t51
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:AuthzRolesController`

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("authz.roles")]:::tabla
  t6[("authz.field_permissions")]:::tabla
  t8[("authz.permissions")]:::tabla
  t9[("authz.role_permissions")]:::tabla
  subgraph s0["ctrl:AuthzRolesController · Operaciones de AuthzRolesController que el README n…"]
    o1["GET /authz/roles"]:::op
    o4["POST /authz/roles"]:::op
    o5["PUT /authz/roles/{roleId}/field-permissions"]:::op
    o7["PUT /authz/roles/{roleId}/permissions"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"CREA"| t3
  o4 -->|"LEE"| t3
  a2 --> o5
  o5 -->|"ACTUALIZA"| t6
  o5 -->|"CREA"| t6
  o5 -->|"LEE"| t6
  o5 -->|"LEE"| t3
  a2 --> o7
  o7 -->|"LEE"| t8
  o7 -->|"ACTUALIZA"| t9
  o7 -->|"CREA"| t9
  o7 -->|"LEE"| t3
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Flujo crítico: Consentimiento y acceso clínico

- **Código:** `critico:consent` · **Agrupación:** CURADO_EN_DOCUMENTO · **Operaciones:** 7
- **Actores:** `PATIENT` (otorga/retira consentimiento), `CLINICIAN`/`PRACTITIONER` (solicita acceso), `COMPLIANCE_OFFICER`/`PRIVACY_OFFICER` (supervisión).
- **Revisión:** CURADO_EN_DOCUMENTO
- **Fuentes:** `docs/business/critical-workflows.md:84`

### Para qué sirve

el acceso a PHI no puede depender solo de un rol (`CLINICIAN`) — debe respetar el consentimiento y la relación asistencial vigentes del paciente concreto, y reaccionar de inmediato cuando ese consentimiento se retira.

_Fuente: `docs/business/critical-workflows.md:86`_

### Precondiciones

existe una relación asistencial (`CareRelationshipsRepository`) o una representación legal vigente entre el profesional y el paciente.

_Fuente: `docs/business/critical-workflows.md:93`_

### Reglas de negocio

las bases legales de procesamiento son versionadas — una nueva *supersede* a la anterior, nunca la reemplaza en el histórico. La evidencia de consentimiento es append-only e inmutable (`consent.consent_evidence`, IMMUTABLE) — un consentimiento otorgado no se edita ni borra, solo se revoca hacia adelante.

_Fuente: `docs/business/critical-workflows.md:120`_

### Estados y transiciones

consentimiento `granted → withdrawn`; objeción `raised → upheld \| rejected`; base legal `active → superseded`.

_Fuente: `docs/business/critical-workflows.md:125`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `P1` | `POST /consent/consents` — captura consentimiento de directiva de privacidad (+ provisiones + evento `granted`). | POST /consent/consents | SECURITY_ADMIN | MEDIO | 4 |
| `P2` | El PDP clínico (`authz-pdp.service.ts`) evalúa cada acceso posterior a PHI de ese paciente contra: rol global (RBAC) **Y** `ClinicalAccessGrantsRepository` **Y** relación asistencial vigente **Y** rango de la acción (`READ`/`WRITE`/`DELETE`) vs. nivel del grant. | _sin operación HTTP (lo hace el sistema)_ | — | — | — |
| `P3` | El profesional accede a PHI solo si las cuatro condiciones se cumplen simultáneamente. | _sin operación HTTP (lo hace el sistema)_ | — | — | — |
| `A1` | **Retiro de consentimiento** (`POST /consent/consents/{id}/withdraw`): dispara re-evaluación de accesos activos — no es un flag pasivo, invalida el acceso hacia adelante. | POST /consent/consents/{id}/withdraw | SECURITY_ADMIN | MEDIO | 8 |
| `A2` | **Objeción del paciente** (`POST /consent/patient-objections`): puede materializar una restricción de privacidad de inmediato (UC-07-07) o quedar pendiente de resolución (`POST /consent/patient-objections/{id}/resolve`, `upheld`/`rejected`). | POST /consent/patient-objections | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /consent/patient-objections/{id}/resolve | SECURITY_ADMIN | MEDIO | 5 |
| `A3` | **Autorización HIPAA específica** (`POST /consent/hipaa-authorizations`): divulgación puntual a un tercero, revocable independientemente (`.../revoke`) del consentimiento general. | POST /consent/hipaa-authorizations | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /consent/hipaa-authorizations/{id}/revoke | SECURITY_ADMIN | MEDIO | 3 |
| `A4` | **Expiración**: `POST /consent/internal/expiration-sweep` (worker) barre consentimientos vencidos. | POST /consent/internal/expiration-sweep | SYSTEM · SECURITY_ADMIN | MEDIO | 7 |
| `A5` | **Break-the-glass** (módulo `authz`): acceso de emergencia excepcional fuera del flujo normal, auditado explícitamente — no documentado en detalle en esta fase, ver `docs/security/access-control.md` (Fase 13). | _sin operación HTTP (lo hace el sistema)_ | — | — | — |

### Diagrama — etapas `P1`, `P2`, `P3`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a18(["SYSTEM · SECURITY_ADMIN"]):::actor
  t3[("consent.consent_events")]:::tabla
  t4[("consent.consent_provisions")]:::tabla
  t5[("consent.consents")]:::tabla
  t7[("audit.audit_log")]:::tabla
  t8[("authz.clinical_access_grants")]:::tabla
  t11[("consent.patient_objections")]:::tabla
  t12[("consent.privacy_restrictions")]:::tabla
  t15[("consent.hipaa_authorizations")]:::tabla
  subgraph s0["P1 · `POST /consent/consents` — captura consentimiento de directiva de privacid…"]
    o1["POST /consent/consents"]:::op
  end
  subgraph s1["P2 · El PDP clínico (`authz-pdp.service.ts`) evalúa cada acceso posterior a PHI…"]
  end
  subgraph s2["P3 · El profesional accede a PHI solo si las cuatro condiciones se cumplen simu…"]
  end
  t9[("+2 tablas más")]
  subgraph s3["A1 · **Retiro de consentimiento** (`POST /consent/consents/{id}/withdraw`): dis…"]
    o6["POST /consent/consents/{id}/withdraw"]:::op
  end
  subgraph s4["A2 · **Objeción del paciente** (`POST /consent/patient-objections`): puede mate…"]
    o10["POST /consent/patient-objections"]:::op
    o13["POST /consent/patient-objections/{id}/resolve"]:::op
  end
  subgraph s5["A3 · **Autorización HIPAA específica** (`POST /consent/hipaa-authorizations`):…"]
    o14["POST /consent/hipaa-authorizations"]:::op
    o16["POST /consent/hipaa-authorizations/{id}/revoke"]:::op
  end
  t19[("+1 tablas más")]
  subgraph s6["A4 · **Expiración**: `POST /consent/internal/expiration-sweep` (worker) barre c…"]
    o17["POST /consent/internal/expiration-sweep"]:::op
  end
  subgraph s7["A5 · **Break-the-glass** (módulo `authz`): acceso de emergencia excepcional fue…"]
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  o1 -->|"LEE"| t5
  a2 --> o6
  o6 -->|"CREA"| t7
  o6 -->|"LEE"| t7
  o6 -->|"ACTUALIZA"| t8
  o6 -->|"LEE"| t8
  o6 -->|"CREA"| t3
  o6 -->|"ACTUALIZA"| t5
  o6 -.-> t9
  a2 --> o10
  o10 -->|"CREA"| t3
  o10 -->|"CREA"| t11
  o10 -->|"LEE"| t11
  o10 -->|"CREA"| t12
  a2 --> o13
  o13 -->|"CREA"| t3
  o13 -->|"ACTUALIZA"| t11
  o13 -->|"LEE"| t11
  o13 -->|"ACTUALIZA"| t12
  o13 -->|"LEE"| t12
  a2 --> o14
  o14 -->|"CREA"| t3
  o14 -->|"CREA"| t15
  a2 --> o16
  o16 -->|"CREA"| t3
  o16 -->|"ACTUALIZA"| t15
  o16 -->|"LEE"| t15
  a18 --> o17
  o17 -->|"CREA"| t3
  o17 -->|"ACTUALIZA"| t5
  o17 -->|"LEE"| t5
  o17 -->|"ACTUALIZA"| t15
  o17 -->|"LEE"| t15
  o17 -->|"ACTUALIZA"| t12
  o17 -.-> t19
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /authz/care-relationships

Establecer una relación asistencial

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una relación asistencial activa para ese practicante |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: validTo debe ser posterior a validFrom |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCareRelationshipsService.establishCareRelationship"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"dto.validTo && dto.validTo ‹= validFrom"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED validTo debe ser posterior a validFrom"]):::error
  n5 -->|"sí"| n6
  n7["Llama a CareRelationshipsRepository.findActive"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE authz.care_relationships")]:::efecto
  n7 --> n8
  n9{"existing"}:::decision
  n8 --> n9
  n10(["409 CONFLICT Ya existe una relación asistencial activa para ese practicante"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CareRelationshipsRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA authz.care_relationships")]:::efecto
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

#### 2. POST /authz/care-relationships/{id}/respond

Responder (aceptar/rechazar) una solicitud de relación asistencial

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo el paciente titular puede responder esta solicitud; PreconditionFailedException: La solicitud ya fue respondida o ya no está pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCareRelationshipsService.respondToCareRelationshipRequest"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CareRelationshipsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.care_relationships")]:::efecto
  n5 --> n6
  n7{"!rel"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"!actor.patientProfileId || actor.patientProfileId !== rel.patientProfileId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Sólo el paciente titular puede responder esta solicitud"]):::error
  n9 -->|"sí"| n10
  n11{"rel.statusConceptId !== CONCEPTS.STATE_PENDING"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La solicitud ya fue respondida o ya no está pendiente"]):::error
  n11 -->|"sí"| n12
  n13{"dto.decision === 'ACCEPT'"}:::decision
  n11 -->|"no"| n13
  n14[("ACTUALIZA authz.care_relationships · ACTUALIZA authz.care_relationships")]:::efecto
  n13 -->|"sí"| n14
  n15[("ACTUALIZA authz.care_relationships · ACTUALIZA authz.care_relationships")]:::efecto
  n13 -->|"no"| n15
  n16["Llama a AuditTrailService.record"]:::llamada
  n14 --> n16
  n15 --> n16
  n17["Llama a AuditLogRepository.append"]:::llamada
  n16 --> n17
  n18["Llama a AuditLogRepository.findChainTip"]:::llamada
  n17 --> n18
  n19[("LEE audit.audit_log")]:::efecto
  n18 --> n19
  n20[("CREA audit.audit_log")]:::efecto
  n19 --> n20
  n21["Llama a OutboxService.publishDomainEvent"]:::llamada
  n20 --> n21
  n22["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n21 --> n22
  n23["Transacción: startActiveSpan(…)"]:::transaccion
  n22 --> n23
  n24["Intenta"]:::intento
  n23 --> n24
  n25(["↩ (relanza el error capturado)"]):::error
  n24 -->|"si falla"| n25
  n26["Llama a OutboxService.persistDomainEvent"]:::llamada
  n24 --> n26
  n27["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n26 --> n27
  n28[("LEE messaging.outbox_messages")]:::efecto
  n27 --> n28
  n29["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n28 --> n29
  n30[("CREA messaging.domain_events")]:::efecto
  n29 --> n30
  n31["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n30 --> n31
  n32[("CREA messaging.outbox_messages")]:::efecto
  n31 --> n32
  n33>"Evento authz.care_relationship.responded"]:::evento
  n32 --> n33
  n34(("200 Responde con éxito")):::ok
  n33 --> n34
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /authz/care-relationships/{id}/revoke

Revocar o expirar una relación asistencial

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Relación asistencial no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La relación asistencial no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCareRelationshipsService.revokeCareRelationship"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CareRelationshipsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.care_relationships")]:::efecto
  n5 --> n6
  n7{"!rel"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Relación asistencial no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"rel.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La relación asistencial no está activa"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA authz.care_relationships · ACTUALIZA authz.care_relationships")]:::efecto
  n9 -->|"no"| n11
  n12{"!expired"}:::decision
  n11 --> n12
  n13[("ACTUALIZA authz.care_relationships")]:::efecto
  n12 -->|"sí"| n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  n12 -->|"no"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /authz/care-relationships/request

Solicitar autorización del paciente para una relación asistencial

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El proveedor configurado para el canal in-app no existe |
| 409 | `CONFLICT` | ConflictException: Ya existe una relación asistencial activa con ese paciente; ConflictException: Ya hay una solicitud pendiente de respuesta para ese paciente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo un practicante con perfil propio puede solicitar acceso a un expediente; PreconditionFailedException: No hay canal in-app activo: falta correr el seed de mensajería; PreconditionFailedException: El canal in-app no tiene configuración de proveedor activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCareRelationshipsService.requestCareRelationship"]:::llamada
  n2 --> n3
  n4{"!actor.practitionerProfileId"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Sólo un practicante con perfil propio puede solicitar acceso a un expediente"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a CareRelationshipsRepository.findActive"]:::llamada
  n6 --> n7
  n8[("LEE authz.care_relationships")]:::efecto
  n7 --> n8
  n9{"active"}:::decision
  n8 --> n9
  n10(["409 CONFLICT Ya existe una relación asistencial activa con ese paciente"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CareRelationshipsRepository.findPending"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE authz.care_relationships")]:::efecto
  n11 --> n12
  n13{"pending"}:::decision
  n12 --> n13
  n14(["409 CONFLICT Ya hay una solicitud pendiente de respuesta para ese paciente"]):::error
  n13 -->|"sí"| n14
  n15["Llama a CareRelationshipsRepository.create"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA authz.care_relationships")]:::efecto
  n15 --> n16
  n17["Llama a AuditTrailService.record"]:::llamada
  n16 --> n17
  n18["Llama a AuditLogRepository.append"]:::llamada
  n17 --> n18
  n19["Llama a AuditLogRepository.findChainTip"]:::llamada
  n18 --> n19
  n20[("LEE audit.audit_log")]:::efecto
  n19 --> n20
  n21[("CREA audit.audit_log")]:::efecto
  n20 --> n21
  n22["Llama a AuthzCareRelationshipsService.resolvePatientUserId"]:::llamada
  n21 --> n22
  n23["Llama a PersonAccountLinksRepository.findActiveByPerson"]:::llamada
  n22 --> n23
  n24[("LEE profiles.person_account_links")]:::efecto
  n23 --> n24
  n25{"recipientUserId"}:::decision
  n24 --> n25
  n26["Llama a NotificationsService.emitInApp"]:::llamada
  n25 -->|"sí"| n26
  n27["Intenta"]:::intento
  n26 --> n27
  n28["Llama a NotificationsService.writeInApp"]:::llamada
  n27 --> n28
  n29["Llama a NotificationsRepository.findActiveChannelByType"]:::llamada
  n28 --> n29
  n30[("LEE messaging.message_channels")]:::efecto
  n29 --> n30
  n31{"!channel"}:::decision
  n30 --> n31
  n32(["422 PRECONDITION_FAILED No hay canal in-app activo: falta correr el seed de mensajería"]):::error
  n31 -->|"sí"| n32
  n33{"input.destination"}:::decision
  n31 -->|"no"| n33
  n34["Llama a NotificationsRepository.findUnreadInAppForResource"]:::llamada
  n33 -->|"sí"| n34
  n35[("LEE messaging.in_app_notifications")]:::efecto
  n34 --> n35
  n36["Llama a NotificationsRepository.createNotificationRequest"]:::llamada
  n35 --> n36
  n33 -->|"no"| n36
  n37[("CREA messaging.notification_requests")]:::efecto
  n36 --> n37
  n38["Llama a NotificationsRepository.findChannelConfigs"]:::llamada
  n37 --> n38
  n39[("LEE messaging.provider_channel_configs")]:::efecto
  n38 --> n39
  n40{"!config"}:::decision
  n39 --> n40
  n41(["422 PRECONDITION_FAILED El canal in-app no tiene configuración de proveedor activa"]):::error
  n40 -->|"sí"| n41
  n42["Llama a NotificationsRepository.findProviderById"]:::llamada
  n40 -->|"no"| n42
  n43[("LEE messaging.messaging_providers")]:::efecto
  n42 --> n43
  n44{"!provider"}:::decision
  n43 --> n44
  n45(["404 NOT_FOUND El proveedor configurado para el canal in-app no existe"]):::error
  n44 -->|"sí"| n45
  n46["Llama a NotificationsRepository.createDelivery"]:::llamada
  n44 -->|"no"| n46
  n47[("CREA messaging.notification_deliveries")]:::efecto
  n46 --> n47
  n48["Llama a NotificationsRepository.createInAppNotification"]:::llamada
  n47 --> n48
  n49[("CREA messaging.in_app_notifications")]:::efecto
  n48 --> n49
  n50(("201 Responde con éxito")):::ok
  n49 --> n50
  n25 -->|"no"| n50
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. DELETE /authz/clinical-access-grants/{grantId}

Revocar o expirar una concesión de acceso clínico

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Acceso clínico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El acceso clínico no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzClinicalService.revokeClinicalAccess"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ClinicalAccessGrantsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.clinical_access_grants")]:::efecto
  n5 --> n6
  n7{"!grant"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Acceso clínico no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"grant.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El acceso clínico no está activo"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA authz.clinical_access_grants · ACTUALIZA authz.clinical_access_grants")]:::efecto
  n9 -->|"no"| n11
  n12{"!expired"}:::decision
  n11 --> n12
  n13[("ACTUALIZA authz.clinical_access_grants")]:::efecto
  n12 -->|"sí"| n13
  n14["Llama a AuditTrailService.record"]:::llamada
  n13 --> n14
  n12 -->|"no"| n14
  n15["Llama a AuditLogRepository.append"]:::llamada
  n14 --> n15
  n16["Llama a AuditLogRepository.findChainTip"]:::llamada
  n15 --> n16
  n17[("LEE audit.audit_log")]:::efecto
  n16 --> n17
  n18[("CREA audit.audit_log")]:::efecto
  n17 --> n18
  n19(("200 Responde con éxito")):::ok
  n18 --> n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /authz/decisions/evaluate

Recalcular la decisión de autorización efectiva (PDP)

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
  n3["Llama a AuthzPdpService.evaluate"]:::llamada
  n2 --> n3
  n4["Llama a PermissionsRepository.findByResourceAction"]:::llamada
  n3 --> n4
  n5[("LEE authz.permissions")]:::efecto
  n4 --> n5
  n6["Llama a UserRoleAssignmentsRepository.findActiveForUser"]:::llamada
  n5 --> n6
  n7[("LEE authz.user_role_assignments")]:::efecto
  n6 --> n7
  n8["Llama a AuthzPdpService.resolveRoleInheritance"]:::llamada
  n7 --> n8
  n9["Repite: mientras queue.length › 0"]:::bucle
  n8 --> n9
  n10["Llama a RolesRepository.findById"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE authz.roles")]:::efecto
  n10 --> n11
  n12{"!permission"}:::decision
  n11 --> n12
  n9 -->|"al terminar"| n12
  n13["Llama a RolePermissionsRepository.findActiveForRoles"]:::llamada
  n12 -->|"no"| n13
  n14[("LEE authz.role_permissions")]:::efecto
  n13 --> n14
  n15["Llama a UserPermissionGrantsRepository.findActiveForUser"]:::llamada
  n14 --> n15
  n16[("LEE authz.user_permission_grants")]:::efecto
  n15 --> n16
  n17{"dto.resourceId"}:::decision
  n16 --> n17
  n18["Llama a ResourceScopeGrantsRepository.findForSubjectResource"]:::llamada
  n17 -->|"sí"| n18
  n19[("LEE authz.resource_scope_grants")]:::efecto
  n18 --> n19
  n20["Llama a AccessPoliciesRepository.findActiveForTarget"]:::llamada
  n12 -->|"sí"| n20
  n19 --> n20
  n17 -->|"no"| n20
  n21[("LEE authz.access_policies")]:::efecto
  n20 --> n21
  n22{"dto.patientProfileId"}:::decision
  n21 --> n22
  n23["Llama a ClinicalAccessGrantsRepository.findActiveForUserPatient"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE authz.clinical_access_grants")]:::efecto
  n23 --> n24
  n25{"dto.practitionerProfileId"}:::decision
  n24 --> n25
  n26["Llama a CareRelationshipsRepository.findActiveForPractitionerPatient"]:::llamada
  n25 -->|"sí"| n26
  n27[("LEE authz.care_relationships")]:::efecto
  n26 --> n27
  n28["Llama a PatientLegalRepresentationsRepository.findActiveForRepresentativePatient"]:::llamada
  n27 --> n28
  n25 -->|"no"| n28
  n29[("LEE authz.patient_legal_representations")]:::efecto
  n28 --> n29
  n30["Llama a AuthzPdpService.computeMaskedFields"]:::llamada
  n29 --> n30
  n22 -->|"no"| n30
  n31["Llama a FieldPermissionsRepository.findForRoles"]:::llamada
  n30 --> n31
  n32[("LEE authz.field_permissions")]:::efecto
  n31 --> n32
  n33(("200 Responde con éxito")):::ok
  n32 --> n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /authz/legal-representations

Registrar una representación legal del paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una representación legal activa para ese usuario |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: validTo debe ser posterior a validFrom |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCareRelationshipsService.establishLegalRepresentation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"dto.validTo && dto.validTo ‹= validFrom"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED validTo debe ser posterior a validFrom"]):::error
  n5 -->|"sí"| n6
  n7["Llama a PatientLegalRepresentationsRepository.findActive"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE authz.patient_legal_representations")]:::efecto
  n7 --> n8
  n9{"existing"}:::decision
  n8 --> n9
  n10(["409 CONFLICT Ya existe una representación legal activa para ese usuario"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PatientLegalRepresentationsRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA authz.patient_legal_representations")]:::efecto
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

#### 8. POST /authz/legal-representations/{id}/revoke

Revocar o expirar una representación legal

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Representación legal no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La representación legal no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCareRelationshipsService.revokeLegalRepresentation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PatientLegalRepresentationsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.patient_legal_representations")]:::efecto
  n5 --> n6
  n7{"!rep"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Representación legal no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"rep.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La representación legal no está activa"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA authz.patient_legal_representations · ACTUALIZA authz.patient_legal_representations")]:::efecto
  n9 -->|"no"| n11
  n12{"!expired"}:::decision
  n11 --> n12
  n13[("ACTUALIZA authz.patient_legal_representations")]:::efecto
  n12 -->|"sí"| n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  n12 -->|"no"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. GET /authz/me/access

Quién ve mi historia

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
  n3["Llama a AuthzMeService.listMyAccess"]:::llamada
  n2 --> n3
  n4["Llama a AuthzMeService.ownPatientProfileId"]:::llamada
  n3 --> n4
  n5["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n4 --> n5
  n6[("LEE profiles.person_account_links")]:::efecto
  n5 --> n6
  n7["Llama a PatientProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE profiles.patient_profiles")]:::efecto
  n7 --> n8
  n9["Llama a CareRelationshipsRepository.findAllByPatient"]:::llamada
  n8 --> n9
  n10[("LEE authz.care_relationships")]:::efecto
  n9 --> n10
  n11["Llama a ClinicalAccessGrantsRepository.findAllByPatient"]:::llamada
  n10 --> n11
  n12[("LEE authz.clinical_access_grants")]:::efecto
  n11 --> n12
  n13["Llama a AuthzMeService.namesByPersonId"]:::llamada
  n12 --> n13
  n14[("LEE profiles.persons")]:::efecto
  n13 --> n14
  n15["Llama a AuthzMeService.namesByUserId"]:::llamada
  n14 --> n15
  n16["Repite: por cada const userId de new Set(userIds)"]:::bucle
  n15 --> n16
  n17["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n16 -->|"cada elemento"| n17
  n18[("LEE profiles.person_account_links")]:::efecto
  n17 --> n18
  n19["Llama a AuthzMeService.namesByPersonId"]:::llamada
  n18 --> n19
  n16 -->|"al terminar"| n19
  n20[("LEE profiles.persons")]:::efecto
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

#### 10. POST /authz/me/care-relationships/{id}/revoke

Revocar una de mis relaciones asistenciales

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Relación asistencial no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud sigue pendiente: respóndala en lugar de revocarla; PreconditionFailedException: La relación asistencial no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzMeService.revokeMyCareRelationship"]:::llamada
  n2 --> n3
  n4["Llama a AuthzMeService.ownPatientProfileId"]:::llamada
  n3 --> n4
  n5["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n4 --> n5
  n6[("LEE profiles.person_account_links")]:::efecto
  n5 --> n6
  n7["Llama a PatientProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE profiles.patient_profiles")]:::efecto
  n7 --> n8
  n9["Llama a CareRelationshipsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE authz.care_relationships")]:::efecto
  n9 --> n10
  n11{"!relation || relation.patientProfileId !== patientProfileId"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Relación asistencial no encontrada"]):::error
  n11 -->|"sí"| n12
  n13{"relation.statusConceptId === CONCEPTS.STATE_PENDING"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED La solicitud sigue pendiente: respóndala en lugar de revocarla"]):::error
  n13 -->|"sí"| n14
  n15["Llama a AuthzCareRelationshipsService.revokeCareRelationship"]:::llamada
  n13 -->|"no"| n15
  n16["Transacción: transactional(…)"]:::transaccion
  n15 --> n16
  n17["Llama a CareRelationshipsRepository.findById"]:::llamada
  n16 --> n17
  n18[("LEE authz.care_relationships")]:::efecto
  n17 --> n18
  n19{"!rel"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND Relación asistencial no encontrada"]):::error
  n19 -->|"sí"| n20
  n21{"rel.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED La relación asistencial no está activa"]):::error
  n21 -->|"sí"| n22
  n23[("ACTUALIZA authz.care_relationships · ACTUALIZA authz.care_relationships")]:::efecto
  n21 -->|"no"| n23
  n24{"!expired"}:::decision
  n23 --> n24
  n25[("ACTUALIZA authz.care_relationships")]:::efecto
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

#### 11. POST /authz/me/clinical-access-grants/{grantId}/revoke

Revocar uno de los accesos clínicos a mi historia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Acceso clínico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El acceso clínico no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzMeService.revokeMyClinicalGrant"]:::llamada
  n2 --> n3
  n4["Llama a AuthzMeService.ownPatientProfileId"]:::llamada
  n3 --> n4
  n5["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n4 --> n5
  n6[("LEE profiles.person_account_links")]:::efecto
  n5 --> n6
  n7["Llama a PatientProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE profiles.patient_profiles")]:::efecto
  n7 --> n8
  n9["Llama a ClinicalAccessGrantsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE authz.clinical_access_grants")]:::efecto
  n9 --> n10
  n11{"!grant || grant.patientProfileId !== patientProfileId"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Acceso clínico no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a AuthzClinicalService.revokeClinicalAccess"]:::llamada
  n11 -->|"no"| n13
  n14["Transacción: transactional(…)"]:::transaccion
  n13 --> n14
  n15["Llama a ClinicalAccessGrantsRepository.findById"]:::llamada
  n14 --> n15
  n16[("LEE authz.clinical_access_grants")]:::efecto
  n15 --> n16
  n17{"!grant"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Acceso clínico no encontrado"]):::error
  n17 -->|"sí"| n18
  n19{"grant.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El acceso clínico no está activo"]):::error
  n19 -->|"sí"| n20
  n21[("ACTUALIZA authz.clinical_access_grants · ACTUALIZA authz.clinical_access_grants")]:::efecto
  n19 -->|"no"| n21
  n22{"!expired"}:::decision
  n21 --> n22
  n23[("ACTUALIZA authz.clinical_access_grants")]:::efecto
  n22 -->|"sí"| n23
  n24["Llama a AuditTrailService.record"]:::llamada
  n23 --> n24
  n22 -->|"no"| n24
  n25["Llama a AuditLogRepository.append"]:::llamada
  n24 --> n25
  n26[("CREA audit.audit_log")]:::efecto
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /authz/patients/{patientProfileId}/break-the-glass

Break-the-glass / anulación de emergencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzClinicalService.breakTheGlass"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ClinicalAccessGrantsRepository.create"]:::llamada
  n4 --> n5
  n6[("CREA authz.clinical_access_grants")]:::efecto
  n5 --> n6
  n7["Llama a BreakGlassSessionsRepository.create"]:::llamada
  n6 --> n7
  n8[("CREA authz.break_glass_sessions")]:::efecto
  n7 --> n8
  n9["Llama a DataAccessLogRepository.record"]:::llamada
  n8 --> n9
  n10[("CREA audit.data_access_log")]:::efecto
  n9 --> n10
  n11["Llama a OutboxService.publishDomainEvent"]:::llamada
  n10 --> n11
  n12["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n11 --> n12
  n13["Transacción: startActiveSpan(…)"]:::transaccion
  n12 --> n13
  n14["Intenta"]:::intento
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"si falla"| n15
  n16["Llama a OutboxService.persistDomainEvent"]:::llamada
  n14 --> n16
  n17["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n16 --> n17
  n18[("LEE messaging.outbox_messages")]:::efecto
  n17 --> n18
  n19["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n18 --> n19
  n20[("CREA messaging.domain_events")]:::efecto
  n19 --> n20
  n21["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n20 --> n21
  n22[("CREA messaging.outbox_messages")]:::efecto
  n21 --> n22
  n23>"Evento authz.break_glass.activated"]:::evento
  n22 --> n23
  n24["Llama a AuditTrailService.record"]:::llamada
  n23 --> n24
  n25["Llama a AuditLogRepository.append"]:::llamada
  n24 --> n25
  n26["Llama a AuditLogRepository.findChainTip"]:::llamada
  n25 --> n26
  n27[("LEE audit.audit_log")]:::efecto
  n26 --> n27
  n28[("CREA audit.audit_log")]:::efecto
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

#### 13. POST /authz/patients/{patientProfileId}/clinical-access-grants

Otorgar acceso clínico con propósito de uso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un acceso clínico activo para ese usuario |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: validTo debe ser posterior a validFrom; PreconditionFailedException: Se requiere consentimiento salvo para tratamiento directo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzClinicalService.grantClinicalAccess"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"dto.validTo ‹= validFrom"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED validTo debe ser posterior a validFrom"]):::error
  n5 -->|"sí"| n6
  n7{"dto.purposeOfUse !== 'TREATMENT' && !dto.consentId"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED Se requiere consentimiento salvo para tratamiento directo"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ClinicalAccessGrantsRepository.findActive"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE authz.clinical_access_grants")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12(["409 CONFLICT Ya existe un acceso clínico activo para ese usuario"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ClinicalAccessGrantsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA authz.clinical_access_grants")]:::efecto
  n13 --> n14
  n15["Llama a AuditTrailService.record"]:::llamada
  n14 --> n15
  n16["Llama a AuditLogRepository.append"]:::llamada
  n15 --> n16
  n17["Llama a AuditLogRepository.findChainTip"]:::llamada
  n16 --> n17
  n18[("LEE audit.audit_log")]:::efecto
  n17 --> n18
  n19[("CREA audit.audit_log")]:::efecto
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

#### 14. POST /authz/permission-categories

Definir una categoría de permiso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una categoría con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCatalogService.createCategory"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PermissionCategoriesRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE authz.permission_categories")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una categoría con ese código"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PermissionCategoriesRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA authz.permission_categories")]:::efecto
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

#### 15. POST /authz/permissions

Definir un permiso del catálogo global

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un permiso con ese código; ConflictException: La categoría referenciada no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzCatalogService.createPermission"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PermissionsRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE authz.permissions")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un permiso con ese código"]):::error
  n7 -->|"sí"| n8
  n9{"dto.categoryId"}:::decision
  n7 -->|"no"| n9
  n10["Llama a PermissionCategoriesRepository.findById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE authz.permission_categories")]:::efecto
  n10 --> n11
  n12{"!category"}:::decision
  n11 --> n12
  n13(["409 CONFLICT La categoría referenciada no existe"]):::error
  n12 -->|"sí"| n13
  n14["Llama a PermissionsRepository.create"]:::llamada
  n12 -->|"no"| n14
  n9 -->|"no"| n14
  n15[("CREA authz.permissions")]:::efecto
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

#### 16. POST /authz/resource-scope-grants

Otorgar acceso a un recurso específico (grant polimórfico)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Permiso no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un grant para ese (sujeto, permiso, recurso) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzGrantsService.grantResourceScope"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PermissionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.permissions")]:::efecto
  n5 --> n6
  n7{"!permission"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Permiso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ResourceScopeGrantsRepository.findExisting"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE authz.resource_scope_grants")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12(["409 CONFLICT Ya existe un grant para ese (sujeto, permiso, recurso)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ResourceScopeGrantsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA authz.resource_scope_grants")]:::efecto
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

#### 17. POST /authz/roles

Componer un rol (con herencia opcional)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El rol padre no existe |
| 409 | `CONFLICT` | ConflictException: Ya existe un rol con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzRolesService.createRole"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a RolesRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE authz.roles")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un rol con ese código"]):::error
  n7 -->|"sí"| n8
  n9{"dto.parentRoleId"}:::decision
  n7 -->|"no"| n9
  n10["Llama a RolesRepository.findById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE authz.roles")]:::efecto
  n10 --> n11
  n12{"!parent"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND El rol padre no existe"]):::error
  n12 -->|"sí"| n13
  n14["Llama a RolesRepository.create"]:::llamada
  n12 -->|"no"| n14
  n9 -->|"no"| n14
  n15[("CREA authz.roles")]:::efecto
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

#### 18. PUT /authz/roles/{roleId}/field-permissions

Configurar el enmascaramiento de campos del rol

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: canWrite=true requiere canRead=true |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzRolesService.setFieldPermissions"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a RolesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.roles")]:::efecto
  n5 --> n6
  n7{"!role"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Rol no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Repite: por cada const field de dto.fields"]:::bucle
  n7 -->|"no"| n9
  n10{"field.canWrite && !field.canRead"}:::decision
  n9 -->|"cada elemento"| n10
  n11(["422 PRECONDITION_FAILED canWrite=true requiere canRead=true"]):::error
  n10 -->|"sí"| n11
  n12["Repite: por cada const field de dto.fields"]:::bucle
  n10 -->|"no"| n12
  n9 -->|"al terminar"| n12
  n13["Llama a FieldPermissionsRepository.findOneByKey"]:::llamada
  n12 -->|"cada elemento"| n13
  n14[("LEE authz.field_permissions")]:::efecto
  n13 --> n14
  n15{"existing"}:::decision
  n14 --> n15
  n16[("ACTUALIZA authz.field_permissions · ACTUALIZA authz.field_permissions · ACTUALIZA authz.field_permissions · A…")]:::efecto
  n15 -->|"sí"| n16
  n17["Llama a FieldPermissionsRepository.create"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA authz.field_permissions")]:::efecto
  n17 --> n18
  n19(("200 Responde con éxito")):::ok
  n16 --> n19
  n18 --> n19
  n12 -->|"al terminar"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. PUT /authz/roles/{roleId}/permissions

Asignar permisos al rol (reemplaza los activos)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado; ResourceNotFoundException: Permiso no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzRolesService.setPermissions"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a RolesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.roles")]:::efecto
  n5 --> n6
  n7{"!role"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Rol no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Repite: por cada const item de dto.permissions"]:::bucle
  n7 -->|"no"| n9
  n10["Llama a PermissionsRepository.findById"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE authz.permissions")]:::efecto
  n10 --> n11
  n12{"!permission"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Permiso no encontrado"]):::error
  n12 -->|"sí"| n13
  n14["Llama a RolePermissionsRepository.revokeAllForRole"]:::llamada
  n12 -->|"no"| n14
  n9 -->|"al terminar"| n14
  n15[("ACTUALIZA authz.role_permissions")]:::efecto
  n14 --> n15
  n16["Repite: por cada const item de dto.permissions"]:::bucle
  n15 --> n16
  n17["Llama a RolePermissionsRepository.create"]:::llamada
  n16 -->|"cada elemento"| n17
  n18[("CREA authz.role_permissions")]:::efecto
  n17 --> n18
  n19(("200 Responde con éxito")):::ok
  n18 --> n19
  n16 -->|"al terminar"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /authz/tenants/{tenantId}/access-policies

Definir una política de acceso ABAC con enmascaramiento

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política activa con esa prioridad para el recurso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzPoliciesService.create"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"dto.priority !== undefined"}:::decision
  n4 --> n5
  n6["Llama a AccessPoliciesRepository.findByTenantTargetPriority"]:::llamada
  n5 -->|"sí"| n6
  n7[("LEE authz.access_policies")]:::efecto
  n6 --> n7
  n8{"clash"}:::decision
  n7 --> n8
  n9(["409 CONFLICT Ya existe una política activa con esa prioridad para el recurso"]):::error
  n8 -->|"sí"| n9
  n10["Llama a AccessPoliciesRepository.create"]:::llamada
  n8 -->|"no"| n10
  n5 -->|"no"| n10
  n11[("CREA authz.access_policies")]:::efecto
  n10 --> n11
  n12(("201 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /authz/users/{userId}/permission-grants

Otorgar una excepción de permiso por usuario

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Permiso no encontrado |
| 409 | `CONFLICT` | ConflictException: El usuario ya tiene una excepción activa para ese permiso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzGrantsService.grantPermission"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PermissionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE authz.permissions")]:::efecto
  n5 --> n6
  n7{"!permission"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Permiso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a UserPermissionGrantsRepository.findActive"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE authz.user_permission_grants")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El usuario ya tiene una excepción activa para ese permiso"]):::error
  n11 -->|"sí"| n12
  n13["Llama a UserPermissionGrantsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA authz.user_permission_grants")]:::efecto
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

#### 22. POST /authz/users/{userId}/role-assignments

Asignar un rol a un usuario con vigencia y ámbito

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 409 | `CONFLICT` | ConflictException: El usuario ya tiene ese rol asignado y activo en ese ámbito |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique el rol a asignar por `roleId` o por `roleCode`; PreconditionFailedException: El rol no es asignable; PreconditionFailedException: validFrom debe ser anterior a validTo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzGrantsService.assignRole"]:::llamada
  n2 --> n3
  n4{"!dto.roleId && !dto.roleCode"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Indique el rol a asignar por `roleId` o por `roleCode`"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a RolesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE authz.roles")]:::efecto
  n7 --> n8
  n9["Llama a RolesRepository.findByCode"]:::llamada
  n8 --> n9
  n10[("LEE authz.roles")]:::efecto
  n9 --> n10
  n11{"!role"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Rol no encontrado"]):::error
  n11 -->|"sí"| n12
  n13{"!role.isAssignable"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El rol no es asignable"]):::error
  n13 -->|"sí"| n14
  n15{"dto.validFrom && dto.validTo && dto.validFrom ›= dto.validTo"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED validFrom debe ser anterior a validTo"]):::error
  n15 -->|"sí"| n16
  n17["Llama a UserRoleAssignmentsRepository.findActive"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE authz.user_role_assignments")]:::efecto
  n17 --> n18
  n19{"existing"}:::decision
  n18 --> n19
  n20(["409 CONFLICT El usuario ya tiene ese rol asignado y activo en ese ámbito"]):::error
  n19 -->|"sí"| n20
  n21["Llama a UserRoleAssignmentsRepository.create"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA authz.user_role_assignments")]:::efecto
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
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
| GET /authz/care-relationships | 200, 400, 401, 403, 429 | 1 |
| GET /authz/care-relationships/requests/mine | 200, 401, 403, 429 | 1 |
| GET /authz/legal-representations | 200, 400, 401, 403, 429 | 1 |
| POST /authz/pdp/cache/invalidate | 200, 400, 401, 403, 429 | 0 |
| GET /authz/roles | 200, 401, 403, 429 | 1 |
