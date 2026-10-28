<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `authz`

- **Procesos:** 2 · **Máquinas de estado:** 0
- **Operaciones:** 32 (27 con decisiones propias, 5 sin ellas)
- Inventario de endpoints del módulo: [authz](../endpoints/authz.md)

## Proceso: Módulo 06 — authz (Authorization, Purpose of Use & Field Masking)

- **Código:** `authz` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 32
- **Actores:** CLINICAL_APPROVER · CLINICIAN · PATIENT · PRACTITIONER · SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/authz/README.md`

### Para qué sirve

Autorización de la plataforma: catálogo de permisos, políticas ABAC, roles con herencia, asignaciones y excepciones por usuario, accesos clínicos con propósito de uso, break-the-glass, enmascaramiento de campos, grants polimórficos y el PDP (invalidación de cache + evaluación de decisiones efectivas).

_Fuente: `src/modules/authz/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:AuthzAdminController` | Operaciones de AuthzAdminController que el README no asigna a un caso de uso | GET /authz/internal-users | SECURITY_ADMIN | BAJO | 4 |
|  |  | GET /authz/permissions | SECURITY_ADMIN | BAJO | 1 |
|  |  | GET /authz/roles/{roleId}/permissions | SECURITY_ADMIN | BAJO | 3 |
|  |  | GET /authz/users/{userId}/role-assignments | SECURITY_ADMIN | BAJO | 3 |
|  |  | DELETE /authz/users/{userId}/role-assignments/{assignmentId} | SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:AuthzCareRelationshipsController` | Operaciones de AuthzCareRelationshipsController que el README no asigna a un caso de uso | GET /authz/care-relationships | CLINICIAN · SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /authz/care-relationships | CLINICIAN · SECURITY_ADMIN | MEDIO | 6 |
|  |  | POST /authz/care-relationships/{id}/respond | PATIENT | MEDIO | 8 |
|  |  | POST /authz/care-relationships/{id}/revoke | CLINICIAN · SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /authz/care-relationships/request | CLINICIAN · PRACTITIONER | MEDIO | 17 |
|  |  | GET /authz/care-relationships/requests/mine | PATIENT | BAJO | 1 |
|  |  | GET /authz/legal-representations | SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /authz/legal-representations | SECURITY_ADMIN | MEDIO | 6 |
|  |  | POST /authz/legal-representations/{id}/revoke | SECURITY_ADMIN | BAJO | 1 |
| `ctrl:AuthzCatalogController` | Operaciones de AuthzCatalogController que el README no asigna a un caso de uso | POST /authz/permission-categories | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /authz/permissions | SECURITY_ADMIN | MEDIO | 3 |
| `ctrl:AuthzClinicalController` | Operaciones de AuthzClinicalController que el README no asigna a un caso de uso | DELETE /authz/clinical-access-grants/{grantId} | CLINICAL_APPROVER · SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /authz/patients/{patientProfileId}/break-the-glass | CLINICAL_APPROVER · SECURITY_ADMIN | MEDIO | 14 |
|  |  | POST /authz/patients/{patientProfileId}/clinical-access-grants | CLINICAL_APPROVER · SECURITY_ADMIN | MEDIO | 11 |
| `ctrl:AuthzGrantsController` | Operaciones de AuthzGrantsController que el README no asigna a un caso de uso | POST /authz/resource-scope-grants | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /authz/users/{userId}/permission-grants | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /authz/users/{userId}/role-assignments | SECURITY_ADMIN | MEDIO | 3 |
| `ctrl:AuthzMeController` | Operaciones de AuthzMeController que el README no asigna a un caso de uso | GET /authz/me/access | PATIENT | BAJO | 5 |
|  |  | POST /authz/me/care-relationships/{id}/revoke | PATIENT | BAJO | 3 |
|  |  | POST /authz/me/clinical-access-grants/{grantId}/revoke | PATIENT | MEDIO | 6 |
| `ctrl:AuthzPdpController` | Operaciones de AuthzPdpController que el README no asigna a un caso de uso | POST /authz/decisions/evaluate | SECURITY_ADMIN | BAJO | 11 |
|  |  | POST /authz/pdp/cache/invalidate | SECURITY_ADMIN | BAJO | 0 |
| `ctrl:AuthzPoliciesController` | Operaciones de AuthzPoliciesController que el README no asigna a un caso de uso | POST /authz/tenants/{tenantId}/access-policies | SECURITY_ADMIN | MEDIO | 2 |
| `ctrl:AuthzRolesController` | Operaciones de AuthzRolesController que el README no asigna a un caso de uso | GET /authz/roles | SECURITY_ADMIN | BAJO | 1 |
|  |  | POST /authz/roles | SECURITY_ADMIN | MEDIO | 2 |
|  |  | PUT /authz/roles/{roleId}/field-permissions | SECURITY_ADMIN | MEDIO | 4 |
|  |  | PUT /authz/roles/{roleId}/permissions | SECURITY_ADMIN | MEDIO | 4 |

### Diagrama 1 de 2 — etapas `ctrl:AuthzAdminController`, `ctrl:AuthzCareRelationshipsController`, `ctrl:AuthzCatalogController`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a14(["CLINICIAN · SECURITY_ADMIN"]):::actor
  a22(["PATIENT"]):::actor
  a30(["CLINICIAN · PRACTITIONER"]):::actor
  a42(["CLINICAL_APPROVER · SECURITY_ADMIN"]):::actor
  t3[("authz.roles")]:::tabla
  t4[("authz.user_role_assignments")]:::tabla
  t5[("iam.user_global_roles")]:::tabla
  t6[("iam.users")]:::tabla
  t8[("authz.permissions")]:::tabla
  t10[("authz.role_permissions")]:::tabla
  t15[("authz.care_relationships")]:::tabla
  t17[("directory.tenant_memberships")]:::tabla
  t18[("profiles.patient_profiles")]:::tabla
  t19[("profiles.person_account_links")]:::tabla
  t20[("scheduling.appointment_bookings")]:::tabla
  t23[("audit.audit_log")]:::tabla
  t24[("iam.sessions")]:::tabla
  t25[("messaging.domain_events")]:::tabla
  e27>"authz.care_relationship.responded"]:::evento
  t31[("iam.devices")]:::tabla
  t35[("authz.patient_legal_representations")]:::tabla
  t39[("authz.permission_categories")]:::tabla
  t43[("authz.clinical_access_grants")]:::tabla
  t45[("audit.data_access_log")]:::tabla
  t46[("authz.break_glass_sessions")]:::tabla
  t47[("clinical.encounters")]:::tabla
  e49>"authz.break_glass.activated"]:::evento
  t51[("consent.consents")]:::tabla
  t54[("authz.resource_scope_grants")]:::tabla
  t56[("authz.user_permission_grants")]:::tabla
  t59[("profiles.persons")]:::tabla
  subgraph s0["ctrl:AuthzAdminController · Operaciones de AuthzAdminController que el README n…"]
    o1["GET /authz/internal-users"]:::op
    o7["GET /authz/permissions"]:::op
    o9["GET /authz/roles/{roleId}/permissions"]:::op
    o11["GET /authz/users/{userId}/role-assignments"]:::op
    o12["DELETE /authz/users/{userId}/role-assignments/{assignmentId}"]:::op
  end
  t26[("+2 tablas más")]
  t32[("+11 tablas más")]
  subgraph s1["ctrl:AuthzCareRelationshipsController · Operaciones de AuthzCareRelationshipsCo…"]
    o13["GET /authz/care-relationships"]:::op
    o16["POST /authz/care-relationships"]:::op
    o21["POST /authz/care-relationships/{id}/respond"]:::op
    o28["POST /authz/care-relationships/{id}/revoke"]:::op
    o29["POST /authz/care-relationships/request"]:::op
    o33["GET /authz/care-relationships/requests/mine"]:::op
    o34["GET /authz/legal-representations"]:::op
    o36["POST /authz/legal-representations"]:::op
    o37["POST /authz/legal-representations/{id}/revoke"]:::op
  end
  subgraph s2["ctrl:AuthzCatalogController · Operaciones de AuthzCatalogController que el READ…"]
    o38["POST /authz/permission-categories"]:::op
    o40["POST /authz/permissions"]:::op
  end
  t48[("+8 tablas más")]
  t52[("+5 tablas más")]
  subgraph s3["ctrl:AuthzClinicalController · Operaciones de AuthzClinicalController que el RE…"]
    o41["DELETE /authz/clinical-access-grants/{grantId}"]:::op
    o44["POST /authz/patients/{patientProfileId}/break-the-glass"]:::op
    o50["POST /authz/patients/{patientProfileId}/clinical-access-grants"]:::op
  end
  subgraph s4["ctrl:AuthzGrantsController · Operaciones de AuthzGrantsController que el README…"]
    o53["POST /authz/resource-scope-grants"]:::op
    o55["POST /authz/users/{userId}/permission-grants"]:::op
    o57["POST /authz/users/{userId}/role-assignments"]:::op
  end
  subgraph s5["ctrl:AuthzMeController · Operaciones de AuthzMeController que el README no asig…"]
    o58["GET /authz/me/access"]:::op
    o60["POST /authz/me/care-relationships/{id}/revoke"]:::op
    o61["POST /authz/me/clinical-access-grants/{grantId}/revoke"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  a2 --> o7
  o7 -->|"LEE"| t8
  a2 --> o9
  o9 -->|"LEE"| t8
  o9 -->|"LEE"| t10
  o9 -->|"LEE"| t3
  a2 --> o11
  o11 -->|"LEE"| t3
  o11 -->|"LEE"| t4
  o11 -->|"LEE"| t6
  a2 --> o12
  o12 -->|"ACTUALIZA"| t4
  o12 -->|"LEE"| t4
  a14 --> o13
  o13 -->|"LEE"| t15
  a14 --> o16
  o16 -->|"CREA"| t15
  o16 -->|"LEE"| t15
  o16 -->|"LEE"| t17
  o16 -->|"LEE"| t18
  o16 -->|"LEE"| t19
  o16 -->|"LEE"| t20
  a22 --> o21
  o21 -->|"CREA"| t23
  o21 -->|"LEE"| t23
  o21 -->|"ACTUALIZA"| t15
  o21 -->|"LEE"| t15
  o21 -->|"LEE"| t24
  o21 -->|"CREA"| t25
  o21 -.-> t26
  o21 -->|"evento"| e27
  a14 --> o28
  o28 -->|"LEE"| t15
  a30 --> o29
  o29 -->|"CREA"| t23
  o29 -->|"LEE"| t23
  o29 -->|"CREA"| t15
  o29 -->|"LEE"| t15
  o29 -->|"ACTUALIZA"| t31
  o29 -->|"LEE"| t31
  o29 -.-> t32
  a22 --> o33
  o33 -->|"LEE"| t15
  a2 --> o34
  o34 -->|"LEE"| t35
  a2 --> o36
  o36 -->|"CREA"| t35
  o36 -->|"LEE"| t35
  o36 -->|"LEE"| t17
  o36 -->|"LEE"| t18
  o36 -->|"LEE"| t19
  o36 -->|"LEE"| t20
  a2 --> o37
  o37 -->|"LEE"| t35
  a2 --> o38
  o38 -->|"CREA"| t39
  o38 -->|"LEE"| t39
  a2 --> o40
  o40 -->|"LEE"| t39
  o40 -->|"CREA"| t8
  o40 -->|"LEE"| t8
  a42 --> o41
  o41 -->|"CREA"| t23
  o41 -->|"LEE"| t23
  o41 -->|"LEE"| t43
  o41 -->|"LEE"| t24
  a42 --> o44
  o44 -->|"CREA"| t23
  o44 -->|"LEE"| t23
  o44 -->|"CREA"| t45
  o44 -->|"CREA"| t46
  o44 -->|"CREA"| t43
  o44 -->|"LEE"| t47
  o44 -.-> t48
  o44 -->|"evento"| e49
  a42 --> o50
  o50 -->|"CREA"| t23
  o50 -->|"LEE"| t23
  o50 -->|"CREA"| t43
  o50 -->|"LEE"| t43
  o50 -->|"LEE"| t47
  o50 -->|"LEE"| t51
  o50 -.-> t52
  a2 --> o53
  o53 -->|"LEE"| t8
  o53 -->|"CREA"| t54
  o53 -->|"LEE"| t54
  a2 --> o55
  o55 -->|"LEE"| t8
  o55 -->|"CREA"| t56
  o55 -->|"LEE"| t56
  a2 --> o57
  o57 -->|"LEE"| t3
  o57 -->|"CREA"| t4
  o57 -->|"LEE"| t4
  a22 --> o58
  o58 -->|"LEE"| t15
  o58 -->|"LEE"| t43
  o58 -->|"LEE"| t18
  o58 -->|"LEE"| t19
  o58 -->|"LEE"| t59
  a22 --> o60
  o60 -->|"LEE"| t15
  o60 -->|"LEE"| t18
  o60 -->|"LEE"| t19
  a22 --> o61
  o61 -->|"CREA"| t23
  o61 -->|"LEE"| t23
  o61 -->|"LEE"| t43
  o61 -->|"LEE"| t24
  o61 -->|"LEE"| t18
  o61 -->|"LEE"| t19
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:AuthzPdpController`, `ctrl:AuthzPoliciesController`, `ctrl:AuthzRolesController`

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("authz.access_policies")]:::tabla
  t4[("authz.care_relationships")]:::tabla
  t5[("authz.clinical_access_grants")]:::tabla
  t6[("authz.field_permissions")]:::tabla
  t7[("authz.patient_legal_representations")]:::tabla
  t8[("authz.permissions")]:::tabla
  t13[("authz.roles")]:::tabla
  t17[("authz.role_permissions")]:::tabla
  t9[("+5 tablas más")]
  subgraph s0["ctrl:AuthzPdpController · Operaciones de AuthzPdpController que el README no as…"]
    o1["POST /authz/decisions/evaluate"]:::op
    o10["POST /authz/pdp/cache/invalidate"]:::op
  end
  subgraph s1["ctrl:AuthzPoliciesController · Operaciones de AuthzPoliciesController que el RE…"]
    o11["POST /authz/tenants/{tenantId}/access-policies"]:::op
  end
  subgraph s2["ctrl:AuthzRolesController · Operaciones de AuthzRolesController que el README n…"]
    o12["GET /authz/roles"]:::op
    o14["POST /authz/roles"]:::op
    o15["PUT /authz/roles/{roleId}/field-permissions"]:::op
    o16["PUT /authz/roles/{roleId}/permissions"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  o1 -->|"LEE"| t8
  o1 -.-> t9
  a2 --> o10
  a2 --> o11
  o11 -->|"CREA"| t3
  o11 -->|"LEE"| t3
  a2 --> o12
  o12 -->|"LEE"| t13
  a2 --> o14
  o14 -->|"CREA"| t13
  o14 -->|"LEE"| t13
  a2 --> o15
  o15 -->|"ACTUALIZA"| t6
  o15 -->|"CREA"| t6
  o15 -->|"LEE"| t6
  o15 -->|"LEE"| t13
  a2 --> o16
  o16 -->|"LEE"| t8
  o16 -->|"ACTUALIZA"| t17
  o16 -->|"CREA"| t17
  o16 -->|"LEE"| t13
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
| `P1` | `POST /consent/consents` — captura consentimiento de directiva de privacidad (+ provisiones + evento `granted`). | POST /consent/consents | SECURITY_ADMIN | MEDIO | 7 |
| `P2` | El PDP clínico (`authz-pdp.service.ts`) evalúa cada acceso posterior a PHI de ese paciente contra: rol global (RBAC) **Y** `ClinicalAccessGrantsRepository` **Y** relación asistencial vigente **Y** rango de la acción (`READ`/`WRITE`/`DELETE`) vs. nivel del grant. | _sin operación HTTP (lo hace el sistema)_ | — | — | — |
| `P3` | El profesional accede a PHI solo si las cuatro condiciones se cumplen simultáneamente. | _sin operación HTTP (lo hace el sistema)_ | — | — | — |
| `A1` | **Retiro de consentimiento** (`POST /consent/consents/{id}/withdraw`): dispara re-evaluación de accesos activos — no es un flag pasivo, invalida el acceso hacia adelante. | POST /consent/consents/{id}/withdraw | SECURITY_ADMIN | MEDIO | 7 |
| `A2` | **Objeción del paciente** (`POST /consent/patient-objections`): puede materializar una restricción de privacidad de inmediato (UC-07-07) o quedar pendiente de resolución (`POST /consent/patient-objections/{id}/resolve`, `upheld`/`rejected`). | POST /consent/patient-objections | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /consent/patient-objections/{id}/resolve | SECURITY_ADMIN | MEDIO | 5 |
| `A3` | **Autorización HIPAA específica** (`POST /consent/hipaa-authorizations`): divulgación puntual a un tercero, revocable independientemente (`.../revoke`) del consentimiento general. | POST /consent/hipaa-authorizations | SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /consent/hipaa-authorizations/{id}/revoke | SECURITY_ADMIN | MEDIO | 2 |
| `A4` | **Expiración**: `POST /consent/internal/expiration-sweep` (worker) barre consentimientos vencidos. | POST /consent/internal/expiration-sweep | SYSTEM · SECURITY_ADMIN | MEDIO | 7 |
| `A5` | **Break-the-glass** (módulo `authz`): acceso de emergencia excepcional fuera del flujo normal, auditado explícitamente — no documentado en detalle en esta fase, ver `docs/security/access-control.md` (Fase 13). | _sin operación HTTP (lo hace el sistema)_ | — | — | — |

### Diagrama — etapas `P1`, `P2`, `P3`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a22(["SYSTEM · SECURITY_ADMIN"]):::actor
  t3[("consent.consent_events")]:::tabla
  t4[("consent.consent_provisions")]:::tabla
  t5[("consent.consents")]:::tabla
  t6[("consent.processing_legal_bases")]:::tabla
  t7[("consent.processing_purposes")]:::tabla
  t10[("audit.audit_log")]:::tabla
  t11[("authz.clinical_access_grants")]:::tabla
  t14[("consent.patient_objections")]:::tabla
  t15[("consent.privacy_restrictions")]:::tabla
  t18[("consent.hipaa_authorizations")]:::tabla
  t19[("profiles.patient_profiles")]:::tabla
  t8[("+1 tablas más")]
  subgraph s0["P1 · `POST /consent/consents` — captura consentimiento de directiva de privacid…"]
    o1["POST /consent/consents"]:::op
  end
  subgraph s1["P2 · El PDP clínico (`authz-pdp.service.ts`) evalúa cada acceso posterior a PHI…"]
  end
  subgraph s2["P3 · El profesional accede a PHI solo si las cuatro condiciones se cumplen simu…"]
  end
  t12[("+1 tablas más")]
  subgraph s3["A1 · **Retiro de consentimiento** (`POST /consent/consents/{id}/withdraw`): dis…"]
    o9["POST /consent/consents/{id}/withdraw"]:::op
  end
  subgraph s4["A2 · **Objeción del paciente** (`POST /consent/patient-objections`): puede mate…"]
    o13["POST /consent/patient-objections"]:::op
    o16["POST /consent/patient-objections/{id}/resolve"]:::op
  end
  subgraph s5["A3 · **Autorización HIPAA específica** (`POST /consent/hipaa-authorizations`):…"]
    o17["POST /consent/hipaa-authorizations"]:::op
    o20["POST /consent/hipaa-authorizations/{id}/revoke"]:::op
  end
  t23[("+1 tablas más")]
  subgraph s6["A4 · **Expiración**: `POST /consent/internal/expiration-sweep` (worker) barre c…"]
    o21["POST /consent/internal/expiration-sweep"]:::op
  end
  subgraph s7["A5 · **Break-the-glass** (módulo `authz`): acceso de emergencia excepcional fue…"]
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  o1 -.-> t8
  a2 --> o9
  o9 -->|"CREA"| t10
  o9 -->|"LEE"| t10
  o9 -->|"ACTUALIZA"| t11
  o9 -->|"LEE"| t11
  o9 -->|"CREA"| t3
  o9 -->|"LEE"| t5
  o9 -.-> t12
  a2 --> o13
  o13 -->|"CREA"| t3
  o13 -->|"CREA"| t14
  o13 -->|"LEE"| t14
  o13 -->|"CREA"| t15
  a2 --> o16
  o16 -->|"CREA"| t3
  o16 -->|"ACTUALIZA"| t14
  o16 -->|"LEE"| t14
  o16 -->|"ACTUALIZA"| t15
  o16 -->|"LEE"| t15
  a2 --> o17
  o17 -->|"CREA"| t3
  o17 -->|"CREA"| t18
  o17 -->|"LEE"| t6
  o17 -->|"LEE"| t7
  o17 -->|"LEE"| t19
  a2 --> o20
  o20 -->|"CREA"| t3
  o20 -->|"LEE"| t18
  a22 --> o21
  o21 -->|"CREA"| t3
  o21 -->|"ACTUALIZA"| t5
  o21 -->|"LEE"| t5
  o21 -->|"ACTUALIZA"| t18
  o21 -->|"LEE"| t18
  o21 -->|"ACTUALIZA"| t15
  o21 -.-> t23
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
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

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
  n7["Llama a AuthzClinicalScopeService.resolveTenant"]:::llamada
  n5 -->|"no"| n7
  n8{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n7 --> n8
  n9(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n8 -->|"sí"| n9
  n10["Llama a AuthzClinicalScopeService.assertPatientInTenant"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a AuthzClinicalScopeRepository.patientExists"]:::llamada
  n10 --> n11
  n12[("LEE profiles.patient_profiles")]:::efecto
  n11 --> n12
  n13["Llama a AuthzClinicalScopeRepository.patientHasFootprintInTenant"]:::llamada
  n12 --> n13
  n14[("LEE profiles.person_account_links · LEE scheduling.appointment_bookings · LEE directory.tenant_memberships")]:::efecto
  n13 --> n14
  n15{"!linked"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a CareRelationshipsRepository.findActiveInTenant"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE authz.care_relationships")]:::efecto
  n17 --> n18
  n19{"existing"}:::decision
  n18 --> n19
  n20(["409 CONFLICT Ya existe una relación asistencial activa para ese practicante"]):::error
  n19 -->|"sí"| n20
  n21["Llama a CareRelationshipsRepository.create"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA authz.care_relationships")]:::efecto
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
  n5["Llama a AuthzClinicalScopeService.scopeRevocation"]:::llamada
  n4 --> n5
  n6{"activeTenantId === undefined"}:::decision
  n5 --> n6
  n7{"!resource"}:::decision
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CareRelationshipsRepository.findById"]:::llamada
  n7 -->|"no"| n9
  n6 -->|"no"| n9
  n10[("LEE authz.care_relationships")]:::efecto
  n9 --> n10
  n11{"rel.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La relación asistencial no está activa"]):::error
  n11 -->|"sí"| n12
  n13(("200 Responde con éxito")):::ok
  n11 -->|"no"| n13
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
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

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
  n7["Llama a AuthzClinicalScopeService.resolveTenant"]:::llamada
  n6 --> n7
  n8{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n7 --> n8
  n9(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n8 -->|"sí"| n9
  n10["Llama a AuthzClinicalScopeService.assertPatientExists"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a AuthzClinicalScopeRepository.patientExists"]:::llamada
  n10 --> n11
  n12[("LEE profiles.patient_profiles")]:::efecto
  n11 --> n12
  n13{"!(await this.scopeRepo.patientExists(tx, patientProfileId))"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15["Llama a CareRelationshipsRepository.findActiveInTenant"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE authz.care_relationships")]:::efecto
  n15 --> n16
  n17{"active"}:::decision
  n16 --> n17
  n18(["409 CONFLICT Ya existe una relación asistencial activa con ese paciente"]):::error
  n17 -->|"sí"| n18
  n19["Llama a CareRelationshipsRepository.findPendingInTenant"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE authz.care_relationships")]:::efecto
  n19 --> n20
  n21{"pending"}:::decision
  n20 --> n21
  n22(["409 CONFLICT Ya hay una solicitud pendiente de respuesta para ese paciente"]):::error
  n21 -->|"sí"| n22
  n23["Llama a CareRelationshipsRepository.create"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA authz.care_relationships")]:::efecto
  n23 --> n24
  n25["Llama a AuditTrailService.record"]:::llamada
  n24 --> n25
  n26["Llama a AuditLogRepository.append"]:::llamada
  n25 --> n26
  n27["Llama a AuditLogRepository.findChainTip"]:::llamada
  n26 --> n27
  n28[("LEE audit.audit_log")]:::efecto
  n27 --> n28
  n29[("CREA audit.audit_log")]:::efecto
  n28 --> n29
  n30["Llama a AuthzCareRelationshipsService.resolvePatientUserId"]:::llamada
  n29 --> n30
  n31["Llama a PersonAccountLinksRepository.findActiveByPerson"]:::llamada
  n30 --> n31
  n32[("LEE profiles.person_account_links")]:::efecto
  n31 --> n32
  n33{"recipientUserId"}:::decision
  n32 --> n33
  n34["Llama a NotificationsService.emitInApp"]:::llamada
  n33 -->|"sí"| n34
  n35["Intenta"]:::intento
  n34 --> n35
  n36["Llama a NotificationsService.writeInApp"]:::llamada
  n35 --> n36
  n37["Llama a NotificationsRepository.findActiveChannelByType"]:::llamada
  n36 --> n37
  n38[("LEE messaging.message_channels")]:::efecto
  n37 --> n38
  n39{"!channel"}:::decision
  n38 --> n39
  n40(["422 PRECONDITION_FAILED No hay canal in-app activo: falta correr el seed de mensajería"]):::error
  n39 -->|"sí"| n40
  n41{"input.destination"}:::decision
  n39 -->|"no"| n41
  n42["Llama a NotificationsRepository.findUnreadInAppForResource"]:::llamada
  n41 -->|"sí"| n42
  n43[("LEE messaging.in_app_notifications")]:::efecto
  n42 --> n43
  n44["Llama a NotificationsRepository.createNotificationRequest"]:::llamada
  n43 --> n44
  n41 -->|"no"| n44
  n45[("CREA messaging.notification_requests")]:::efecto
  n44 --> n45
  n46["Llama a NotificationsRepository.findChannelConfigs"]:::llamada
  n45 --> n46
  n47[("LEE messaging.provider_channel_configs")]:::efecto
  n46 --> n47
  n48{"!config"}:::decision
  n47 --> n48
  n49(["422 PRECONDITION_FAILED El canal in-app no tiene configuración de proveedor activa"]):::error
  n48 -->|"sí"| n49
  n50["Llama a NotificationsRepository.findProviderById"]:::llamada
  n48 -->|"no"| n50
  n51[("LEE messaging.messaging_providers")]:::efecto
  n50 --> n51
  n52{"!provider"}:::decision
  n51 --> n52
  n53(["404 NOT_FOUND El proveedor configurado para el canal in-app no existe"]):::error
  n52 -->|"sí"| n53
  n54["Llama a NotificationsRepository.createDelivery"]:::llamada
  n52 -->|"no"| n54
  n55[("CREA messaging.notification_deliveries")]:::efecto
  n54 --> n55
  n56["Llama a NotificationsRepository.createInAppNotification"]:::llamada
  n55 --> n56
  n57[("CREA messaging.in_app_notifications")]:::efecto
  n56 --> n57
  n58{"!result.suppressed && result.inAppNotificationId && result.availableAt && new Date(result.availableAt).getTim…"}:::decision
  n57 --> n58
  n59["Llama a WebPushService.pushToUser"]:::llamada
  n58 -->|"sí"| n59
  n60["Intenta"]:::intento
  n59 --> n60
  n61[("LEE iam.devices")]:::efecto
  n60 --> n61
  n62(("201 Responde con éxito")):::ok
  n61 --> n62
  n58 -->|"no"| n62
  n33 -->|"no"| n62
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
  n5["Llama a AuthzClinicalScopeService.scopeRevocation"]:::llamada
  n4 --> n5
  n6{"activeTenantId === undefined"}:::decision
  n5 --> n6
  n7{"!resource"}:::decision
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ClinicalAccessGrantsRepository.findById"]:::llamada
  n7 -->|"no"| n9
  n6 -->|"no"| n9
  n10[("LEE authz.clinical_access_grants")]:::efecto
  n9 --> n10
  n11{"grant.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED El acceso clínico no está activo"]):::error
  n11 -->|"sí"| n12
  n13["Llama a AuditTrailService.record"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a AuditLogRepository.append"]:::llamada
  n13 --> n14
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

#### 7. GET /authz/internal-users

Usuarios internos con sus roles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: El cursor de paginación no es válido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzAdminReadService.internalUsers"]:::llamada
  n2 --> n3
  n4{"k && (typeof k.n !== 'string' || typeof k.i !== 'string')"}:::decision
  n3 --> n4
  n5(["400 VALIDATION_FAILED El cursor de paginación no es válido"]):::error
  n4 -->|"sí"| n5
  n6["Llama a AuthzAdminReadRepository.internalUsers"]:::llamada
  n4 -->|"no"| n6
  n7{"f.roleCode"}:::decision
  n6 --> n7
  n8[("LEE authz.user_role_assignments · LEE authz.roles")]:::efecto
  n7 -->|"sí"| n8
  n9[("LEE authz.user_role_assignments · LEE authz.roles · LEE iam.user_global_roles")]:::efecto
  n7 -->|"no"| n9
  n10[("LEE iam.users")]:::efecto
  n8 --> n10
  n9 --> n10
  n11["Llama a AuthzAdminReadRepository.activeAssignmentsOf"]:::llamada
  n10 --> n11
  n12[("LEE authz.user_role_assignments · LEE authz.roles")]:::efecto
  n11 --> n12
  n13["Llama a AuthzAdminReadRepository.globalRolesOf"]:::llamada
  n12 --> n13
  n14[("LEE iam.user_global_roles")]:::efecto
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

#### 8. POST /authz/legal-representations

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
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

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
  n7["Llama a AuthzClinicalScopeService.resolveTenant"]:::llamada
  n5 -->|"no"| n7
  n8{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n7 --> n8
  n9(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n8 -->|"sí"| n9
  n10["Llama a AuthzClinicalScopeService.assertPatientInTenant"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a AuthzClinicalScopeRepository.patientExists"]:::llamada
  n10 --> n11
  n12[("LEE profiles.patient_profiles")]:::efecto
  n11 --> n12
  n13["Llama a AuthzClinicalScopeRepository.patientHasFootprintInTenant"]:::llamada
  n12 --> n13
  n14[("LEE profiles.person_account_links · LEE scheduling.appointment_bookings · LEE directory.tenant_memberships")]:::efecto
  n13 --> n14
  n15{"!linked"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PatientLegalRepresentationsRepository.findActiveInTenant"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE authz.patient_legal_representations")]:::efecto
  n17 --> n18
  n19{"existing"}:::decision
  n18 --> n19
  n20(["409 CONFLICT Ya existe una representación legal activa para ese usuario"]):::error
  n19 -->|"sí"| n20
  n21["Llama a PatientLegalRepresentationsRepository.create"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA authz.patient_legal_representations")]:::efecto
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

#### 9. POST /authz/legal-representations/{id}/revoke

Revocar o expirar una representación legal

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
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
  n5["Llama a AuthzClinicalScopeService.scopeRevocation"]:::llamada
  n4 --> n5
  n6{"activeTenantId === undefined"}:::decision
  n5 --> n6
  n7{"!resource"}:::decision
  n6 -->|"sí"| n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PatientLegalRepresentationsRepository.findById"]:::llamada
  n7 -->|"no"| n9
  n6 -->|"no"| n9
  n10[("LEE authz.patient_legal_representations")]:::efecto
  n9 --> n10
  n11{"rep.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La representación legal no está activa"]):::error
  n11 -->|"sí"| n12
  n13(("200 Responde con éxito")):::ok
  n11 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. GET /authz/me/access

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

#### 11. POST /authz/me/care-relationships/{id}/revoke

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
  n17["Llama a AuthzClinicalScopeService.scopeRevocation"]:::llamada
  n16 --> n17
  n18{"activeTenantId === undefined"}:::decision
  n17 --> n18
  n19{"!resource"}:::decision
  n18 -->|"sí"| n19
  n20(["↩ (relanza el error capturado)"]):::error
  n19 -->|"sí"| n20
  n21["Llama a CareRelationshipsRepository.findById"]:::llamada
  n19 -->|"no"| n21
  n18 -->|"no"| n21
  n22[("LEE authz.care_relationships")]:::efecto
  n21 --> n22
  n23{"rel.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n22 --> n23
  n24(["422 PRECONDITION_FAILED La relación asistencial no está activa"]):::error
  n23 -->|"sí"| n24
  n25(("200 Responde con éxito")):::ok
  n23 -->|"no"| n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /authz/me/clinical-access-grants/{grantId}/revoke

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
  n15["Llama a AuthzClinicalScopeService.scopeRevocation"]:::llamada
  n14 --> n15
  n16{"activeTenantId === undefined"}:::decision
  n15 --> n16
  n17{"!resource"}:::decision
  n16 -->|"sí"| n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"sí"| n18
  n19["Llama a ClinicalAccessGrantsRepository.findById"]:::llamada
  n17 -->|"no"| n19
  n16 -->|"no"| n19
  n20[("LEE authz.clinical_access_grants")]:::efecto
  n19 --> n20
  n21{"grant.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED El acceso clínico no está activo"]):::error
  n21 -->|"sí"| n22
  n23["Llama a AuditTrailService.record"]:::llamada
  n21 -->|"no"| n23
  n24["Llama a AuditLogRepository.append"]:::llamada
  n23 --> n24
  n25[("CREA audit.audit_log")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /authz/patients/{patientProfileId}/break-the-glass

Break-the-glass / anulación de emergencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzClinicalService.breakTheGlass"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AuthzClinicalScopeService.resolveTenant"]:::llamada
  n4 --> n5
  n6{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n5 --> n6
  n7(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n6 -->|"sí"| n7
  n8["Llama a AuthzClinicalScopeService.assertPatientInTenant"]:::llamada
  n6 -->|"no"| n8
  n9["Llama a AuthzClinicalScopeRepository.patientExists"]:::llamada
  n8 --> n9
  n10[("LEE profiles.patient_profiles")]:::efecto
  n9 --> n10
  n11["Llama a AuthzClinicalScopeRepository.patientHasFootprintInTenant"]:::llamada
  n10 --> n11
  n12[("LEE profiles.person_account_links · LEE scheduling.appointment_bookings · LEE directory.tenant_memberships")]:::efecto
  n11 --> n12
  n13{"!linked"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"dto.encounterId"}:::decision
  n13 -->|"no"| n15
  n16["Llama a AuthzClinicalScopeService.assertEncounterOfPatient"]:::llamada
  n15 -->|"sí"| n16
  n17["Llama a AuthzClinicalScopeRepository.encounterScope"]:::llamada
  n16 --> n17
  n18[("LEE clinical.encounters")]:::efecto
  n17 --> n18
  n19["Llama a ClinicalAccessGrantsRepository.create"]:::llamada
  n18 --> n19
  n15 -->|"no"| n19
  n20[("CREA authz.clinical_access_grants")]:::efecto
  n19 --> n20
  n21["Llama a BreakGlassSessionsRepository.create"]:::llamada
  n20 --> n21
  n22[("CREA authz.break_glass_sessions")]:::efecto
  n21 --> n22
  n23["Llama a DataAccessLogRepository.record"]:::llamada
  n22 --> n23
  n24[("CREA audit.data_access_log")]:::efecto
  n23 --> n24
  n25["Llama a OutboxService.publishDomainEvent"]:::llamada
  n24 --> n25
  n26["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n25 --> n26
  n27["Transacción: startActiveSpan(…)"]:::transaccion
  n26 --> n27
  n28["Intenta"]:::intento
  n27 --> n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"si falla"| n29
  n30["Llama a OutboxService.persistDomainEvent"]:::llamada
  n28 --> n30
  n31["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n30 --> n31
  n32[("LEE messaging.outbox_messages")]:::efecto
  n31 --> n32
  n33["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n32 --> n33
  n34[("CREA messaging.domain_events")]:::efecto
  n33 --> n34
  n35["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n34 --> n35
  n36[("CREA messaging.outbox_messages")]:::efecto
  n35 --> n36
  n37>"Evento authz.break_glass.activated"]:::evento
  n36 --> n37
  n38["Llama a AuditTrailService.record"]:::llamada
  n37 --> n38
  n39["Llama a AuditLogRepository.append"]:::llamada
  n38 --> n39
  n40["Llama a AuditLogRepository.findChainTip"]:::llamada
  n39 --> n40
  n41[("LEE audit.audit_log")]:::efecto
  n40 --> n41
  n42[("CREA audit.audit_log")]:::efecto
  n41 --> n42
  n43(("201 Responde con éxito")):::ok
  n42 --> n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /authz/patients/{patientProfileId}/clinical-access-grants

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
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

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
  n9["Llama a AuthzClinicalScopeService.resolveTenant"]:::llamada
  n7 -->|"no"| n9
  n10{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n9 --> n10
  n11(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n10 -->|"sí"| n11
  n12["Llama a AuthzClinicalScopeService.assertPatientInTenant"]:::llamada
  n10 -->|"no"| n12
  n13["Llama a AuthzClinicalScopeRepository.patientExists"]:::llamada
  n12 --> n13
  n14[("LEE profiles.patient_profiles")]:::efecto
  n13 --> n14
  n15["Llama a AuthzClinicalScopeRepository.patientHasFootprintInTenant"]:::llamada
  n14 --> n15
  n16[("LEE profiles.person_account_links · LEE scheduling.appointment_bookings · LEE directory.tenant_memberships")]:::efecto
  n15 --> n16
  n17{"!linked"}:::decision
  n16 --> n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"sí"| n18
  n19{"dto.encounterId"}:::decision
  n17 -->|"no"| n19
  n20["Llama a AuthzClinicalScopeService.assertEncounterOfPatient"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a AuthzClinicalScopeRepository.encounterScope"]:::llamada
  n20 --> n21
  n22[("LEE clinical.encounters")]:::efecto
  n21 --> n22
  n23{"dto.consentId"}:::decision
  n22 --> n23
  n19 -->|"no"| n23
  n24["Llama a AuthzClinicalScopeService.assertConsentOfPatient"]:::llamada
  n23 -->|"sí"| n24
  n25["Llama a AuthzClinicalScopeRepository.consentScope"]:::llamada
  n24 --> n25
  n26[("LEE consent.consents")]:::efecto
  n25 --> n26
  n27["Llama a ClinicalAccessGrantsRepository.findActiveInTenant"]:::llamada
  n26 --> n27
  n23 -->|"no"| n27
  n28[("LEE authz.clinical_access_grants")]:::efecto
  n27 --> n28
  n29{"existing"}:::decision
  n28 --> n29
  n30(["409 CONFLICT Ya existe un acceso clínico activo para ese usuario"]):::error
  n29 -->|"sí"| n30
  n31["Llama a ClinicalAccessGrantsRepository.create"]:::llamada
  n29 -->|"no"| n31
  n32[("CREA authz.clinical_access_grants")]:::efecto
  n31 --> n32
  n33["Llama a AuditTrailService.record"]:::llamada
  n32 --> n33
  n34["Llama a AuditLogRepository.append"]:::llamada
  n33 --> n34
  n35["Llama a AuditLogRepository.findChainTip"]:::llamada
  n34 --> n35
  n36[("LEE audit.audit_log")]:::efecto
  n35 --> n36
  n37[("CREA audit.audit_log")]:::efecto
  n36 --> n37
  n38(("201 Responde con éxito")):::ok
  n37 --> n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /authz/permission-categories

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

#### 16. GET /authz/permissions

Catálogo de permisos, paginado por código

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: El cursor de paginación no es válido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzAdminReadService.permissions"]:::llamada
  n2 --> n3
  n4{"despues && typeof despues.code !== 'string'"}:::decision
  n3 --> n4
  n5(["400 VALIDATION_FAILED El cursor de paginación no es válido"]):::error
  n4 -->|"sí"| n5
  n6["Llama a AuthzAdminReadRepository.permissions"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE authz.permissions")]:::efecto
  n6 --> n7
  n8(("200 Responde con éxito")):::ok
  n7 --> n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /authz/permissions

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

#### 18. POST /authz/resource-scope-grants

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

#### 19. POST /authz/roles

Componer un rol (con herencia opcional)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El rol padre no existe |
| 409 | `CONFLICT` | ConflictException: El código de rol está reservado por la plataforma; ConflictException: Ya existe un rol con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzRolesService.createRole"]:::llamada
  n2 --> n3
  n4{"RESERVED_ROLE_CODES.has(dto.code.trim().toUpperCase())"}:::decision
  n3 --> n4
  n5(["409 CONFLICT El código de rol está reservado por la plataforma"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a RolesRepository.findByCode"]:::llamada
  n6 --> n7
  n8[("LEE authz.roles")]:::efecto
  n7 --> n8
  n9{"clash"}:::decision
  n8 --> n9
  n10(["409 CONFLICT Ya existe un rol con ese código"]):::error
  n9 -->|"sí"| n10
  n11{"dto.parentRoleId"}:::decision
  n9 -->|"no"| n11
  n12["Llama a RolesRepository.findById"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE authz.roles")]:::efecto
  n12 --> n13
  n14{"!parent"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND El rol padre no existe"]):::error
  n14 -->|"sí"| n15
  n16["Llama a RolesRepository.create"]:::llamada
  n14 -->|"no"| n16
  n11 -->|"no"| n16
  n17[("CREA authz.roles")]:::efecto
  n16 --> n17
  n18(("201 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. PUT /authz/roles/{roleId}/field-permissions

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

#### 21. GET /authz/roles/{roleId}/permissions

Permisos activos de un rol, con su efecto y ámbito

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzAdminReadService.rolePermissions"]:::llamada
  n2 --> n3
  n4["Llama a AuthzAdminReadRepository.roleCodeOf"]:::llamada
  n3 --> n4
  n5[("LEE authz.roles")]:::efecto
  n4 --> n5
  n6{"roleCode === null"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Rol no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a AuthzAdminReadRepository.rolePermissions"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE authz.role_permissions · LEE authz.permissions")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 22. PUT /authz/roles/{roleId}/permissions

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

#### 23. POST /authz/tenants/{tenantId}/access-policies

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

#### 24. POST /authz/users/{userId}/permission-grants

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

#### 25. GET /authz/users/{userId}/role-assignments

Asignaciones de rol de un usuario, activas o no

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzAdminReadService.assignmentsOf"]:::llamada
  n2 --> n3
  n4["Llama a AuthzAdminReadRepository.userExists"]:::llamada
  n3 --> n4
  n5[("LEE iam.users")]:::efecto
  n4 --> n5
  n6{"!(await this.repo.userExists(em, userId))"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Usuario no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a AuthzAdminReadRepository.assignmentsOfUser"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE authz.user_role_assignments · LEE authz.roles")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 26. POST /authz/users/{userId}/role-assignments

Asignar un rol a un usuario con vigencia y ámbito

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 409 | `CONFLICT` | ConflictException: El usuario ya tiene ese rol asignado y activo en ese ámbito |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique el rol a asignar por `roleId` o por `roleCode`; PreconditionFailedException: El rol no es asignable; PreconditionFailedException: Un rol de ámbito global se asigna sin tenant, sede ni consultorio; PreconditionFailedException: validFrom debe ser anterior a validTo |
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
  n15{"role.scopeConceptId === AUTHZ.SCOPE_GLOBAL && (dto.tenantId || dto.branchId || dto.practiceId)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Un rol de ámbito global se asigna sin tenant, sede ni consultorio"]):::error
  n15 -->|"sí"| n16
  n17{"dto.validFrom && dto.validTo && dto.validFrom ›= dto.validTo"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED validFrom debe ser anterior a validTo"]):::error
  n17 -->|"sí"| n18
  n19["Llama a UserRoleAssignmentsRepository.findActive"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE authz.user_role_assignments")]:::efecto
  n19 --> n20
  n21{"existing"}:::decision
  n20 --> n21
  n22(["409 CONFLICT El usuario ya tiene ese rol asignado y activo en ese ámbito"]):::error
  n21 -->|"sí"| n22
  n23["Llama a UserRoleAssignmentsRepository.create"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA authz.user_role_assignments")]:::efecto
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

#### 27. DELETE /authz/users/{userId}/role-assignments/{assignmentId}

Revocar una asignación de rol (revocación lógica: la fila queda como historia)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación de rol no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La asignación de rol no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AuthzAssignmentRevocationService.revoke"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5[("LEE authz.user_role_assignments")]:::efecto
  n4 --> n5
  n6{"!asignacion"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Asignación de rol no encontrada"]):::error
  n6 -->|"sí"| n7
  n8{"asignacion.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED La asignación de rol no está activa"]):::error
  n8 -->|"sí"| n9
  n10[("ACTUALIZA authz.user_role_assignments")]:::efecto
  n8 -->|"no"| n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
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
