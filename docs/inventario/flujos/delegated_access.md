<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `delegated_access`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 45 (40 con decisiones propias, 5 sin ellas)
- Inventario de endpoints del módulo: [delegated_access](../endpoints/delegated_access.md)

## Proceso: Módulo 29 — Delegated Access and Scoped Infrastructure Users

- **Código:** `delegated_access` · **Agrupación:** MIXTO · **Operaciones:** 45
- **Actores:** CLINICIAN · Cualquier sesión válida · PATIENT · PRACTITIONER · Público (sin sesión) · SECURITY_ADMIN · SUPPORT_STAFF · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/delegated_access/README.md`

### Para qué sirve

Delegación scoped de acceso: usuarios de organización con alcance y vigencia, sets de permisos delegados versionados, delegaciones de practitioner, solicitudes con aprobación previa, grants temporales por propósito, revocación en cascada, barrido de expiración y evaluación del actor efectivo (con step-up). Sin impersonación: delegante y delegado quedan siempre auditados en `delegation_events`.

_Fuente: `src/modules/delegated_access/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-29-01` | Asignar usuario de organización (scoped, vigente) | POST /org/{tenantMembershipId}/user-assignments | SECURITY_ADMIN | MEDIO | 3 |
| `UC-29-02` | Publicar set de permisos delegados (v1) | POST /delegated-permission-sets | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /delegated-permission-sets/{id}/versions | SECURITY_ADMIN | ALTO | 4 |
| `UC-29-03` | Crear delegación de practitioner | POST /practitioner-delegates | SECURITY_ADMIN | MEDIO | 7 |
| `UC-29-04` | Solicitar acceso delegado (aprobación previa) | POST /practitioner-delegates/{id}/access-requests | SECURITY_ADMIN | MEDIO | 7 |
| `UC-29-05` | Aprobar/Denegar y emitir grant scoped | POST /access-requests/{id}/decision | SECURITY_ADMIN | MEDIO | 8 |
| `UC-29-06` | Grant pre-autorizado por-propósito y temporal | POST /practitioner-delegates/{id}/grants | SECURITY_ADMIN | MEDIO | 6 |
| `UC-29-07` | Revocar delegación inmediata (cascada) | POST /practitioner-delegates/{id}/revoke | SECURITY_ADMIN | MEDIO | 5 |
| `UC-29-08` | Expirar delegaciones y grants vencidos | POST /delegated-access/expiry-sweep | SYSTEM · SECURITY_ADMIN | MEDIO | 7 |
| `UC-29-09` | Evaluar actor efectivo por propósito (step-up) | POST /authz/effective-actor/evaluate | SECURITY_ADMIN | MEDIO | 7 |
| `UC-29-10` | Reasignar supervisor / suspender (cascada) | PATCH /org/user-assignments/{id} | SECURITY_ADMIN | MEDIO | 7 |
| `ctrl:AffiliationInvitationsController` | Operaciones de AffiliationInvitationsController que el README no asigna a un caso de uso | POST /affiliation-invitations/redeem | PRACTITIONER · SUPPORT_STAFF | MEDIO | 39 |
|  |  | GET /org/affiliation-invitations | Cualquier sesión válida | BAJO | 2 |
|  |  | POST /org/affiliation-invitations | Cualquier sesión válida | ALTO | 4 |
|  |  | POST /org/affiliation-invitations/{id}/revoke | Cualquier sesión válida | ALTO | 2 |
| `ctrl:DelegatedPermissionSetsController` | Operaciones de DelegatedPermissionSetsController que el README no asigna a un caso de uso | GET /delegated-permission-sets | SECURITY_ADMIN | BAJO | 1 |
| `ctrl:OrgSupportStaffProvisioningController` | Operaciones de OrgSupportStaffProvisioningController que el README no asigna a un caso de uso | POST /org/support-staff | Cualquier sesión válida | ALTO | 23 |
| `ctrl:PractitionerGovernanceController` | Operaciones de PractitionerGovernanceController que el README no asigna a un caso de uso | GET /approvals/pending | PRACTITIONER · CLINICIAN | BAJO | 14 |
|  |  | GET /me/practitioner/governance-panel | PRACTITIONER · CLINICIAN | BAJO | 15 |
| `ctrl:PractitionerSupportController` | Operaciones de PractitionerSupportController que el README no asigna a un caso de uso | GET /me/practitioner/support-activity | PRACTITIONER · CLINICIAN · SUPPORT_STAFF | BAJO | 0 |
|  |  | POST /me/practitioner/support-invitations | PRACTITIONER · CLINICIAN | MEDIO | 17 |
|  |  | POST /me/practitioner/support-staff | PRACTITIONER · CLINICIAN | MEDIO | 34 |
|  |  | GET /me/practitioner/support-team | PRACTITIONER · CLINICIAN · SUPPORT_STAFF | BAJO | 12 |
|  |  | POST /me/practitioner/support-team/{id}/end | PRACTITIONER · CLINICIAN | MEDIO | 13 |
|  |  | POST /practitioner-delegates/{id}/accept | PRACTITIONER · CLINICIAN | MEDIO | 14 |
|  |  | POST /practitioner-delegates/{id}/reject | PRACTITIONER · CLINICIAN | MEDIO | 14 |
| `ctrl:PrescriptionSharesController` | Operaciones de PrescriptionSharesController que el README no asigna a un caso de uso | GET /clinical/prescription-shares | PATIENT · PRACTITIONER | BAJO | 3 |
|  |  | POST /clinical/prescription-shares | PATIENT · PRACTITIONER | MEDIO | 2 |
|  |  | POST /clinical/prescription-shares/{shareId}/revoke | PATIENT · PRACTITIONER | MEDIO | 2 |
|  |  | GET /clinical/prescription-shares/by-token/{token} | PATIENT · PRACTITIONER | BAJO | 1 |
| `ctrl:PrescriptionSharesPublicController` | Operaciones de PrescriptionSharesPublicController que el README no asigna a un caso de uso | GET /public/prescription-shares/{token} | Público (sin sesión) | ALTO | 6 |
| `ctrl:SupportStaffController` | Operaciones de SupportStaffController que el README no asigna a un caso de uso | GET /me/support-access | SUPPORT_STAFF | BAJO | 12 |
|  |  | GET /me/support-agenda | SUPPORT_STAFF | BAJO | 16 |
|  |  | GET /me/support-catalog | SUPPORT_STAFF | BAJO | 9 |
|  |  | GET /me/support-engagements | SUPPORT_STAFF | BAJO | 12 |
|  |  | POST /me/support-engagements/{id}/confirm | SUPPORT_STAFF | MEDIO | 14 |
|  |  | POST /me/support-engagements/{id}/decline | SUPPORT_STAFF | MEDIO | 14 |
|  |  | POST /me/support-engagements/{id}/leave | SUPPORT_STAFF | MEDIO | 13 |
|  |  | GET /org/support-catalog | Cualquier sesión válida | BAJO | 8 |
|  |  | GET /org/support-engagement-requests | Cualquier sesión válida | BAJO | 12 |
|  |  | POST /org/support-engagement-requests/{id}/decision | Cualquier sesión válida | ALTO | 14 |
|  |  | GET /org/support-engagements | Cualquier sesión válida | BAJO | 12 |
|  |  | POST /org/support-engagements/{id}/end | Cualquier sesión válida | ALTO | 13 |
|  |  | POST /org/team/invitations | Cualquier sesión válida | ALTO | 17 |
|  |  | POST /support-engagement-requests | SUPPORT_STAFF | MEDIO | 16 |

### Diagrama 1 de 2 — etapas `UC-29-01`, `UC-29-02`, `UC-29-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a25(["SYSTEM · SECURITY_ADMIN"]):::actor
  a35(["PRACTITIONER · SUPPORT_STAFF"]):::actor
  a40(["Cualquier sesión válida"]):::actor
  a51(["PRACTITIONER · CLINICIAN"]):::actor
  t3[("delegated_access.organization_user_assignments")]:::tabla
  t4[("directory.tenant_memberships")]:::tabla
  t6[("delegated_access.delegated_permission_set_items")]:::tabla
  t7[("delegated_access.delegated_permission_sets")]:::tabla
  t10[("delegated_access.delegation_events")]:::tabla
  t11[("delegated_access.practitioner_delegate_assignments")]:::tabla
  t12[("practice.practices")]:::tabla
  t15[("clinical.encounters")]:::tabla
  t16[("delegated_access.delegated_access_approval_reques…")]:::tabla
  t19[("delegated_access.delegated_access_grants")]:::tabla
  t22[("profiles.patient_profiles")]:::tabla
  t30[("messaging.domain_events")]:::tabla
  t31[("messaging.outbox_messages")]:::tabla
  e33>"delegated_access.assignment.scope_changed"]:::evento
  t36[("directory.affiliation_invitation_uses")]:::tabla
  t37[("directory.affiliation_invitations")]:::tabla
  t42[("practice.practice_sites")]:::tabla
  t46[("common.contact_points")]:::tabla
  t47[("common.identifiers")]:::tabla
  t48[("iam.authentication_credentials")]:::tabla
  t52[("delegated_access.four_eyes_requests")]:::tabla
  t53[("directory.tenants")]:::tabla
  t54[("iam.users")]:::tabla
  t55[("practice.care_spaces")]:::tabla
  t58[("delegated_access.access_anomalies")]:::tabla
  t59[("delegated_access.access_review_items")]:::tabla
  subgraph s0["UC-29-01 · Asignar usuario de organización (scoped, vigente)"]
    o1["POST /org/{tenantMembershipId}/user-assignments"]:::op
  end
  subgraph s1["UC-29-02 · Publicar set de permisos delegados (v1)"]
    o5["POST /delegated-permission-sets"]:::op
    o8["POST /delegated-permission-sets/{id}/versions"]:::op
  end
  t13[("+1 tablas más")]
  subgraph s2["UC-29-03 · Crear delegación de practitioner"]
    o9["POST /practitioner-delegates"]:::op
  end
  t17[("+1 tablas más")]
  subgraph s3["UC-29-04 · Solicitar acceso delegado (aprobación previa)"]
    o14["POST /practitioner-delegates/{id}/access-requests"]:::op
  end
  t20[("+2 tablas más")]
  subgraph s4["UC-29-05 · Aprobar/Denegar y emitir grant scoped"]
    o18["POST /access-requests/{id}/decision"]:::op
  end
  subgraph s5["UC-29-06 · Grant pre-autorizado por-propósito y temporal"]
    o21["POST /practitioner-delegates/{id}/grants"]:::op
  end
  subgraph s6["UC-29-07 · Revocar delegación inmediata (cascada)"]
    o23["POST /practitioner-delegates/{id}/revoke"]:::op
  end
  t26[("+1 tablas más")]
  subgraph s7["UC-29-08 · Expirar delegaciones y grants vencidos"]
    o24["POST /delegated-access/expiry-sweep"]:::op
  end
  t28[("+1 tablas más")]
  subgraph s8["UC-29-09 · Evaluar actor efectivo por propósito (step-up)"]
    o27["POST /authz/effective-actor/evaluate"]:::op
  end
  t32[("+1 tablas más")]
  subgraph s9["UC-29-10 · Reasignar supervisor / suspender (cascada)"]
    o29["PATCH /org/user-assignments/{id}"]:::op
  end
  t38[("+33 tablas más")]
  subgraph s10["ctrl:AffiliationInvitationsController · Operaciones de AffiliationInvitationsCo…"]
    o34["POST /affiliation-invitations/redeem"]:::op
    o39["GET /org/affiliation-invitations"]:::op
    o41["POST /org/affiliation-invitations"]:::op
    o43["POST /org/affiliation-invitations/{id}/revoke"]:::op
  end
  subgraph s11["ctrl:DelegatedPermissionSetsController · Operaciones de DelegatedPermissionSets…"]
    o44["GET /delegated-permission-sets"]:::op
  end
  t49[("+17 tablas más")]
  subgraph s12["ctrl:OrgSupportStaffProvisioningController · Operaciones de OrgSupportStaffProv…"]
    o45["POST /org/support-staff"]:::op
  end
  t56[("+8 tablas más")]
  t60[("+9 tablas más")]
  subgraph s13["ctrl:PractitionerGovernanceController · Operaciones de PractitionerGovernanceCo…"]
    o50["GET /approvals/pending"]:::op
    o57["GET /me/practitioner/governance-panel"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"CREA"| t6
  o5 -->|"CREA"| t7
  o5 -->|"LEE"| t7
  a2 --> o8
  o8 -->|"BORRA"| t6
  o8 -->|"CREA"| t6
  o8 -->|"ACTUALIZA"| t7
  o8 -->|"LEE"| t7
  a2 --> o9
  o9 -->|"LEE"| t7
  o9 -->|"CREA"| t10
  o9 -->|"LEE"| t3
  o9 -->|"CREA"| t11
  o9 -->|"LEE"| t4
  o9 -->|"LEE"| t12
  o9 -.-> t13
  a2 --> o14
  o14 -->|"LEE"| t15
  o14 -->|"CREA"| t16
  o14 -->|"LEE"| t16
  o14 -->|"LEE"| t7
  o14 -->|"CREA"| t10
  o14 -->|"LEE"| t11
  o14 -.-> t17
  a2 --> o18
  o18 -->|"LEE"| t15
  o18 -->|"ACTUALIZA"| t16
  o18 -->|"LEE"| t16
  o18 -->|"CREA"| t19
  o18 -->|"LEE"| t7
  o18 -->|"CREA"| t10
  o18 -.-> t20
  a2 --> o21
  o21 -->|"LEE"| t15
  o21 -->|"CREA"| t19
  o21 -->|"LEE"| t7
  o21 -->|"CREA"| t10
  o21 -->|"LEE"| t11
  o21 -->|"LEE"| t22
  a2 --> o23
  o23 -->|"ACTUALIZA"| t16
  o23 -->|"ACTUALIZA"| t19
  o23 -->|"LEE"| t7
  o23 -->|"CREA"| t10
  o23 -->|"LEE"| t11
  a25 --> o24
  o24 -->|"ACTUALIZA"| t19
  o24 -->|"LEE"| t19
  o24 -->|"CREA"| t10
  o24 -->|"ACTUALIZA"| t3
  o24 -->|"LEE"| t3
  o24 -->|"ACTUALIZA"| t11
  o24 -.-> t26
  a2 --> o27
  o27 -->|"LEE"| t19
  o27 -->|"LEE"| t6
  o27 -->|"LEE"| t7
  o27 -->|"CREA"| t10
  o27 -->|"LEE"| t3
  o27 -->|"LEE"| t11
  o27 -.-> t28
  a2 --> o29
  o29 -->|"ACTUALIZA"| t3
  o29 -->|"LEE"| t3
  o29 -->|"ACTUALIZA"| t11
  o29 -->|"LEE"| t4
  o29 -->|"CREA"| t30
  o29 -->|"CREA"| t31
  o29 -.-> t32
  o29 -->|"evento"| e33
  a35 --> o34
  o34 -->|"CREA"| t3
  o34 -->|"LEE"| t3
  o34 -->|"CREA"| t36
  o34 -->|"ACTUALIZA"| t37
  o34 -->|"LEE"| t37
  o34 -->|"CREA"| t4
  o34 -.-> t38
  a40 --> o39
  o39 -->|"LEE"| t37
  o39 -->|"LEE"| t4
  a40 --> o41
  o41 -->|"CREA"| t37
  o41 -->|"LEE"| t4
  o41 -->|"LEE"| t42
  o41 -->|"LEE"| t12
  a40 --> o43
  o43 -->|"ACTUALIZA"| t37
  o43 -->|"LEE"| t4
  a2 --> o44
  o44 -->|"LEE"| t7
  a40 --> o45
  o45 -->|"CREA"| t46
  o45 -->|"CREA"| t47
  o45 -->|"CREA"| t3
  o45 -->|"CREA"| t4
  o45 -->|"LEE"| t4
  o45 -->|"CREA"| t48
  o45 -.-> t49
  a51 --> o50
  o50 -->|"LEE"| t52
  o50 -->|"LEE"| t3
  o50 -->|"LEE"| t4
  o50 -->|"LEE"| t53
  o50 -->|"LEE"| t54
  o50 -->|"LEE"| t55
  o50 -.-> t56
  a51 --> o57
  o57 -->|"LEE"| t58
  o57 -->|"LEE"| t59
  o57 -->|"LEE"| t3
  o57 -->|"LEE"| t4
  o57 -->|"LEE"| t53
  o57 -->|"LEE"| t54
  o57 -.-> t60
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:PractitionerSupportController`, `ctrl:PrescriptionSharesController`, `ctrl:PrescriptionSharesPublicController`…

```mermaid
flowchart LR
  a2(["PRACTITIONER · CLINICIAN · SUPPORT_STAFF"]):::actor
  a4(["PRACTITIONER · CLINICIAN"]):::actor
  a26(["PATIENT · PRACTITIONER"]):::actor
  a34(["Público (sin sesión)"]):::actor
  a39(["SUPPORT_STAFF"]):::actor
  a57(["Cualquier sesión válida"]):::actor
  t5[("delegated_access.organization_user_assignments")]:::tabla
  t6[("directory.tenant_memberships")]:::tabla
  t7[("directory.tenants")]:::tabla
  t8[("iam.authentication_credentials")]:::tabla
  t11[("common.contact_points")]:::tabla
  t12[("common.identifiers")]:::tabla
  t15[("iam.users")]:::tabla
  t16[("practice.care_spaces")]:::tabla
  t17[("practice.clinical_units")]:::tabla
  t27[("clinical.medication_requests")]:::tabla
  t28[("delegated_access.shared_access_link_uses")]:::tabla
  t29[("delegated_access.shared_access_links")]:::tabla
  t35[("profiles.health_practitioner_profiles")]:::tabla
  t36[("profiles.jurisdiction_authorizations")]:::tabla
  t37[("profiles.persons")]:::tabla
  t44[("practice.practice_sites")]:::tabla
  t45[("practice.practices")]:::tabla
  t46[("practice.practitioner_role_assignments")]:::tabla
  t9[("+11 tablas más")]
  t13[("+28 tablas más")]
  t18[("+6 tablas más")]
  t20[("+7 tablas más")]
  t22[("+8 tablas más")]
  t24[("+8 tablas más")]
  subgraph s0["ctrl:PractitionerSupportController · Operaciones de PractitionerSupportControll…"]
    o1["GET /me/practitioner/support-activity"]:::op
    o3["POST /me/practitioner/support-invitations"]:::op
    o10["POST /me/practitioner/support-staff"]:::op
    o14["GET /me/practitioner/support-team"]:::op
    o19["POST /me/practitioner/support-team/{id}/end"]:::op
    o21["POST /practitioner-delegates/{id}/accept"]:::op
    o23["POST /practitioner-delegates/{id}/reject"]:::op
  end
  subgraph s1["ctrl:PrescriptionSharesController · Operaciones de PrescriptionSharesController…"]
    o25["GET /clinical/prescription-shares"]:::op
    o30["POST /clinical/prescription-shares"]:::op
    o31["POST /clinical/prescription-shares/{shareId}/revoke"]:::op
    o32["GET /clinical/prescription-shares/by-token/{token}"]:::op
  end
  subgraph s2["ctrl:PrescriptionSharesPublicController · Operaciones de PrescriptionSharesPubl…"]
    o33["GET /public/prescription-shares/{token}"]:::op
  end
  t40[("+6 tablas más")]
  t42[("+10 tablas más")]
  t47[("+3 tablas más")]
  t49[("+6 tablas más")]
  t51[("+8 tablas más")]
  t53[("+8 tablas más")]
  t55[("+7 tablas más")]
  t58[("+2 tablas más")]
  t60[("+6 tablas más")]
  t62[("+8 tablas más")]
  t64[("+6 tablas más")]
  t66[("+7 tablas más")]
  t68[("+11 tablas más")]
  t70[("+10 tablas más")]
  subgraph s3["ctrl:SupportStaffController · Operaciones de SupportStaffController que el READ…"]
    o38["GET /me/support-access"]:::op
    o41["GET /me/support-agenda"]:::op
    o43["GET /me/support-catalog"]:::op
    o48["GET /me/support-engagements"]:::op
    o50["POST /me/support-engagements/{id}/confirm"]:::op
    o52["POST /me/support-engagements/{id}/decline"]:::op
    o54["POST /me/support-engagements/{id}/leave"]:::op
    o56["GET /org/support-catalog"]:::op
    o59["GET /org/support-engagement-requests"]:::op
    o61["POST /org/support-engagement-requests/{id}/decision"]:::op
    o63["GET /org/support-engagements"]:::op
    o65["POST /org/support-engagements/{id}/end"]:::op
    o67["POST /org/team/invitations"]:::op
    o69["POST /support-engagement-requests"]:::op
  end
  a2 --> o1
  a4 --> o3
  o3 -->|"CREA"| t5
  o3 -->|"LEE"| t5
  o3 -->|"CREA"| t6
  o3 -->|"LEE"| t6
  o3 -->|"LEE"| t7
  o3 -->|"LEE"| t8
  o3 -.-> t9
  a4 --> o10
  o10 -->|"CREA"| t11
  o10 -->|"CREA"| t12
  o10 -->|"LEE"| t5
  o10 -->|"CREA"| t6
  o10 -->|"LEE"| t6
  o10 -->|"LEE"| t7
  o10 -.-> t13
  a2 --> o14
  o14 -->|"LEE"| t5
  o14 -->|"LEE"| t6
  o14 -->|"LEE"| t7
  o14 -->|"LEE"| t15
  o14 -->|"LEE"| t16
  o14 -->|"LEE"| t17
  o14 -.-> t18
  a4 --> o19
  o19 -->|"LEE"| t5
  o19 -->|"ACTUALIZA"| t6
  o19 -->|"LEE"| t6
  o19 -->|"LEE"| t7
  o19 -->|"LEE"| t15
  o19 -->|"LEE"| t16
  o19 -.-> t20
  a4 --> o21
  o21 -->|"LEE"| t5
  o21 -->|"ACTUALIZA"| t6
  o21 -->|"CREA"| t6
  o21 -->|"LEE"| t6
  o21 -->|"LEE"| t7
  o21 -->|"LEE"| t15
  o21 -.-> t22
  a4 --> o23
  o23 -->|"LEE"| t5
  o23 -->|"ACTUALIZA"| t6
  o23 -->|"CREA"| t6
  o23 -->|"LEE"| t6
  o23 -->|"LEE"| t7
  o23 -->|"LEE"| t15
  o23 -.-> t24
  a26 --> o25
  o25 -->|"LEE"| t27
  o25 -->|"LEE"| t28
  o25 -->|"LEE"| t29
  a26 --> o30
  o30 -->|"LEE"| t27
  o30 -->|"CREA"| t29
  a26 --> o31
  o31 -->|"ACTUALIZA"| t29
  o31 -->|"LEE"| t29
  a26 --> o32
  o32 -->|"LEE"| t29
  a34 --> o33
  o33 -->|"LEE"| t27
  o33 -->|"CREA"| t28
  o33 -->|"LEE"| t29
  o33 -->|"LEE"| t35
  o33 -->|"LEE"| t36
  o33 -->|"LEE"| t37
  a39 --> o38
  o38 -->|"LEE"| t5
  o38 -->|"LEE"| t6
  o38 -->|"LEE"| t7
  o38 -->|"LEE"| t15
  o38 -->|"LEE"| t16
  o38 -->|"LEE"| t17
  o38 -.-> t40
  a39 --> o41
  o41 -->|"LEE"| t5
  o41 -->|"LEE"| t6
  o41 -->|"LEE"| t7
  o41 -->|"LEE"| t15
  o41 -->|"LEE"| t16
  o41 -->|"LEE"| t17
  o41 -.-> t42
  a39 --> o43
  o43 -->|"LEE"| t7
  o43 -->|"LEE"| t16
  o43 -->|"LEE"| t17
  o43 -->|"LEE"| t44
  o43 -->|"LEE"| t45
  o43 -->|"LEE"| t46
  o43 -.-> t47
  a39 --> o48
  o48 -->|"LEE"| t5
  o48 -->|"LEE"| t6
  o48 -->|"LEE"| t7
  o48 -->|"LEE"| t15
  o48 -->|"LEE"| t16
  o48 -->|"LEE"| t17
  o48 -.-> t49
  a39 --> o50
  o50 -->|"LEE"| t5
  o50 -->|"ACTUALIZA"| t6
  o50 -->|"CREA"| t6
  o50 -->|"LEE"| t6
  o50 -->|"LEE"| t7
  o50 -->|"LEE"| t15
  o50 -.-> t51
  a39 --> o52
  o52 -->|"LEE"| t5
  o52 -->|"ACTUALIZA"| t6
  o52 -->|"CREA"| t6
  o52 -->|"LEE"| t6
  o52 -->|"LEE"| t7
  o52 -->|"LEE"| t15
  o52 -.-> t53
  a39 --> o54
  o54 -->|"LEE"| t5
  o54 -->|"ACTUALIZA"| t6
  o54 -->|"LEE"| t6
  o54 -->|"LEE"| t7
  o54 -->|"LEE"| t15
  o54 -->|"LEE"| t16
  o54 -.-> t55
  a57 --> o56
  o56 -->|"LEE"| t6
  o56 -->|"LEE"| t7
  o56 -->|"LEE"| t16
  o56 -->|"LEE"| t17
  o56 -->|"LEE"| t44
  o56 -->|"LEE"| t45
  o56 -.-> t58
  a57 --> o59
  o59 -->|"LEE"| t5
  o59 -->|"LEE"| t6
  o59 -->|"LEE"| t7
  o59 -->|"LEE"| t15
  o59 -->|"LEE"| t16
  o59 -->|"LEE"| t17
  o59 -.-> t60
  a57 --> o61
  o61 -->|"LEE"| t5
  o61 -->|"ACTUALIZA"| t6
  o61 -->|"CREA"| t6
  o61 -->|"LEE"| t6
  o61 -->|"LEE"| t7
  o61 -->|"LEE"| t15
  o61 -.-> t62
  a57 --> o63
  o63 -->|"LEE"| t5
  o63 -->|"LEE"| t6
  o63 -->|"LEE"| t7
  o63 -->|"LEE"| t15
  o63 -->|"LEE"| t16
  o63 -->|"LEE"| t17
  o63 -.-> t64
  a57 --> o65
  o65 -->|"LEE"| t5
  o65 -->|"ACTUALIZA"| t6
  o65 -->|"LEE"| t6
  o65 -->|"LEE"| t7
  o65 -->|"LEE"| t15
  o65 -->|"LEE"| t16
  o65 -.-> t66
  a57 --> o67
  o67 -->|"CREA"| t5
  o67 -->|"LEE"| t5
  o67 -->|"CREA"| t6
  o67 -->|"LEE"| t6
  o67 -->|"LEE"| t7
  o67 -->|"LEE"| t8
  o67 -.-> t68
  a39 --> o69
  o69 -->|"CREA"| t5
  o69 -->|"LEE"| t5
  o69 -->|"CREA"| t6
  o69 -->|"LEE"| t6
  o69 -->|"LEE"| t7
  o69 -->|"LEE"| t15
  o69 -.-> t70
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AccessRequestsService.decide"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegatedAccessApprovalRequestsRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE delegated_access.delegated_access_approval_requests")]:::efecto
  n8 --> n9
  n10{"!request"}:::decision
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12["Intenta"]:::intento
  n10 -->|"no"| n12
  n13["Llama a DelegationScopeService.loadDelegationInTenant"]:::llamada
  n12 --> n13
  n14["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n14 --> n15
  n16{"!delegate"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n18 --> n19
  n20{"error instanceof ResourceNotFoundException"}:::decision
  n12 -->|"si falla"| n20
  n21(["↩ (relanza el error capturado)"]):::error
  n20 -->|"sí"| n21
  n22(["↩ (relanza el error capturado)"]):::error
  n20 -->|"no"| n22
  n23{"request.statusConceptId !== DELEG.REQUEST_OPEN"}:::decision
  n19 --> n23
  n24(["422 PRECONDITION_FAILED La solicitud no está abierta"]):::error
  n23 -->|"sí"| n24
  n25{"approved"}:::decision
  n23 -->|"no"| n25
  n26["Llama a DelegationScopeService.assertGrantTarget"]:::llamada
  n25 -->|"sí"| n26
  n27{"encounterId"}:::decision
  n26 --> n27
  n28["Llama a DelegationScopeRepository.encounterScope"]:::llamada
  n27 -->|"sí"| n28
  n29[("LEE clinical.encounters")]:::efecto
  n28 --> n29
  n30{"!encounter || encounter.tenantId !== tenantId || (patientProfileId !== undefined && encounter.patientProfileI…"}:::decision
  n29 --> n30
  n31(["↩ (relanza el error capturado)"]):::error
  n30 -->|"sí"| n31
  n32{"patientProfileId"}:::decision
  n30 -->|"no"| n32
  n27 -->|"no"| n32
  n33["Llama a DelegationScopeRepository.patientExists"]:::llamada
  n32 -->|"sí"| n33
  n34[("LEE profiles.patient_profiles")]:::efecto
  n33 --> n34
  n35{"!exists"}:::decision
  n34 --> n35
  n36(["↩ (relanza el error capturado)"]):::error
  n35 -->|"sí"| n36
  n37[("ACTUALIZA delegated_access.delegated_access_approval_requests · ACTUALIZA delegated_access.delegated_access_a…")]:::efecto
  n35 -->|"no"| n37
  n32 -->|"no"| n37
  n25 -->|"no"| n37
  n38{"approved"}:::decision
  n37 --> n38
  n39["Llama a DelegatedAccessGrantsRepository.create"]:::llamada
  n38 -->|"sí"| n39
  n40[("CREA delegated_access.delegated_access_grants")]:::efecto
  n39 --> n40
  n41["Llama a DelegationEventsRepository.record"]:::llamada
  n40 --> n41
  n38 -->|"no"| n41
  n42[("CREA delegated_access.delegation_events")]:::efecto
  n41 --> n42
  n43(("200 Responde con éxito")):::ok
  n42 --> n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /affiliation-invitations/redeem

Canjear un código o QR de afiliación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada; ResourceNotFoundException: Profesional no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo; ConflictException: Ese vínculo ya está en el historial laboral; ConflictException: Ese vínculo con el establecimiento ya está en el historial laboral; ConflictException: Ya pidió vincularse a esa sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El fin del vínculo no puede ser anterior a su inicio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a RedeemAffiliationInvitationService.redeem"]:::llamada
  n2 --> n3
  n4["Llama a RedeemAffiliationInvitationService.claim"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a AffiliationInvitationsRepository.findByTokenHash"]:::llamada
  n5 --> n6
  n7[("LEE directory.affiliation_invitations")]:::efecto
  n6 --> n7
  n8["Llama a AffiliationInvitationsRepository.findPersonOfUser"]:::llamada
  n7 --> n8
  n9[("LEE profiles.person_account_links · LEE profiles.health_practitioner_profiles")]:::efecto
  n8 --> n9
  n10{"invitationStatus(invitation) !== 'ACTIVE' || wrongPerson"}:::decision
  n9 --> n10
  n11["Llama a AffiliationInvitationsRepository.recordUse"]:::llamada
  n10 -->|"sí"| n11
  n12[("CREA directory.affiliation_invitation_uses")]:::efecto
  n11 --> n12
  n13{"invitation.kind_concept_id === AFF_INV.KIND_PRACTITIONER"}:::decision
  n12 --> n13
  n10 -->|"no"| n13
  n14["Llama a AffiliationInvitationsRepository.findFirstActiveSite"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n14 --> n15
  n16["Llama a AffiliationInvitationsRepository.claimUse"]:::llamada
  n15 --> n16
  n13 -->|"no"| n16
  n17[("ACTUALIZA directory.affiliation_invitations")]:::efecto
  n16 --> n17
  n18{"!(await this.invitations.claimUse(tx, invitation.id))"}:::decision
  n17 --> n18
  n19["Llama a AffiliationInvitationsRepository.recordUse"]:::llamada
  n18 -->|"sí"| n19
  n20[("CREA directory.affiliation_invitation_uses")]:::efecto
  n19 --> n20
  n21["Llama a AffiliationInvitationsRepository.recordUse"]:::llamada
  n20 --> n21
  n18 -->|"no"| n21
  n22[("CREA directory.affiliation_invitation_uses")]:::efecto
  n21 --> n22
  n23["Llama a SupportLinksRepository.findOrganizationName"]:::llamada
  n22 --> n23
  n24[("LEE directory.tenants")]:::efecto
  n23 --> n24
  n25{"outcome === Reason.SUPPORT_PRACTITIONER_PROFILE_REQUIRED"}:::decision
  n24 --> n25
  n26(["↩ (relanza el error capturado)"]):::error
  n25 -->|"sí"| n26
  n27{"outcome === Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING"}:::decision
  n25 -->|"no"| n27
  n28(["↩ (relanza el error capturado)"]):::error
  n27 -->|"sí"| n28
  n29(["↩ (relanza el error capturado)"]):::error
  n27 -->|"no"| n29
  n30["Intenta"]:::intento
  n31["Llama a RedeemAffiliationInvitationService.affiliate"]:::llamada
  n30 --> n31
  n32{"invitation.kind_concept_id !== AFF_INV.KIND_PRACTITIONER"}:::decision
  n31 --> n32
  n33["Llama a SupportStaffService.request"]:::llamada
  n32 -->|"sí"| n33
  n34["Transacción: transactional(…)"]:::transaccion
  n33 --> n34
  n35["Llama a SupportStaffService.requireSecretaryPerson"]:::llamada
  n34 --> n35
  n36{"!personId"}:::decision
  n35 --> n36
  n37(["↩ (relanza el error capturado)"]):::error
  n36 -->|"sí"| n37
  n38["Llama a SupportStaffService.createLinks"]:::llamada
  n36 -->|"no"| n38
  n39{"organizationName === undefined"}:::decision
  n38 --> n39
  n40(["404 NOT_FOUND Organización no encontrada"]):::error
  n39 -->|"sí"| n40
  n41["Repite: por cada const target de resolved"]:::bucle
  n39 -->|"no"| n41
  n42{"seen.has(key)"}:::decision
  n41 -->|"cada elemento"| n42
  n43(["409 CONFLICT Ya hay un vínculo vivo con ese mismo objetivo"]):::error
  n42 -->|"sí"| n43
  n44["Intenta"]:::intento
  n42 -->|"no"| n44
  n41 -->|"al terminar"| n44
  n32 -->|"no"| n44
  n45["Llama a ProfilesPractitionersService.addOwnAffiliation"]:::llamada
  n44 --> n45
  n46["Llama a ProfilesPractitionersService.addAffiliation"]:::llamada
  n45 --> n46
  n47{"endDate && endDate ‹ startDate"}:::decision
  n46 --> n47
  n48(["422 PRECONDITION_FAILED El fin del vínculo no puede ser anterior a su inicio"]):::error
  n47 -->|"sí"| n48
  n49["Transacción: transactional(…)"]:::transaccion
  n47 -->|"no"| n49
  n50{"explicitProfile !== null"}:::decision
  n49 --> n50
  n51{"!exists"}:::decision
  n50 -->|"sí"| n51
  n52(["404 NOT_FOUND Profesional no encontrado"]):::error
  n51 -->|"sí"| n52
  n53{"duplicate"}:::decision
  n51 -->|"no"| n53
  n50 -->|"no"| n53
  n54(["409 CONFLICT Ese vínculo ya está en el historial laboral"]):::error
  n53 -->|"sí"| n54
  n55{"dto.healthFacilityConceptId !== undefined"}:::decision
  n53 -->|"no"| n55
  n56{"sameFacility"}:::decision
  n55 -->|"sí"| n56
  n57(["409 CONFLICT Ese vínculo con el establecimiento ya está en el historial laboral"]):::error
  n56 -->|"sí"| n57
  n58{"dto.practiceSiteId"}:::decision
  n56 -->|"no"| n58
  n55 -->|"no"| n58
  n59{"alreadyRequested"}:::decision
  n58 -->|"sí"| n59
  n60(["409 CONFLICT Ya pidió vincularse a esa sede"]):::error
  n59 -->|"sí"| n60
  n61(["↩ (relanza el error capturado)"]):::error
  n44 -->|"si falla"| n61
  n62{"!created"}:::decision
  n59 -->|"no"| n62
  n58 -->|"no"| n62
  n63["Llama a AffiliationInvitationsRepository.releaseUse"]:::llamada
  n62 -->|"sí"| n63
  n64[("ACTUALIZA directory.affiliation_invitations")]:::efecto
  n63 --> n64
  n65["Llama a AffiliationInvitationsRepository.releaseUse"]:::llamada
  n30 -->|"si falla"| n65
  n66[("ACTUALIZA directory.affiliation_invitations")]:::efecto
  n65 --> n66
  n67(["↩ (relanza el error capturado)"]):::error
  n66 --> n67
  n68(("200 Responde con éxito")):::ok
  n64 --> n68
  n62 -->|"no"| n68
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /approvals/pending

Aprobaciones que espera mi decisión

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
  n3["Llama a PractitionerGovernanceService.pendingApprovals"]:::llamada
  n2 --> n3
  n4["Transacción: readWithSystemRls(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PractitionerGovernanceService.teamOf"]:::llamada
  n4 --> n5
  n6["Llama a SupportLinksRepository.findLinks"]:::llamada
  n5 --> n6
  n7[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n6 --> n7
  n8["Repite: por cada const userId de new Set(mine.map((r) =› r.supportUserId))"]:::bucle
  n7 --> n8
  n9["Llama a SupportLinksRepository.findLinks"]:::llamada
  n8 -->|"cada elemento"| n9
  n10[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n9 --> n10
  n11["Llama a PractitionerGovernanceRepository.findPendingForDoctor"]:::llamada
  n10 --> n11
  n8 -->|"al terminar"| n11
  n12[("LEE delegated_access.four_eyes_requests · LEE terminology.catalog_concepts")]:::efecto
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

#### 4. POST /authz/effective-actor/evaluate

Evaluar actor efectivo por propósito (step-up)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DelegatedAccessEvaluationService.evaluate"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegationScopeService.loadDelegationInTenant"]:::llamada
  n7 --> n8
  n9["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n9 --> n10
  n11{"!delegate"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n13 --> n14
  n15["Llama a OrganizationUserAssignmentsRepository.findById"]:::llamada
  n14 --> n15
  n16[("LEE delegated_access.organization_user_assignments")]:::efecto
  n15 --> n16
  n17["Llama a DelegationScopeService.membershipOfAssignment"]:::llamada
  n16 --> n17
  n18["Llama a DelegationScopeRepository.membershipOf"]:::llamada
  n17 --> n18
  n19[("LEE directory.tenant_memberships")]:::efecto
  n18 --> n19
  n20{"!membership || membership.tenantId !== tenantId || membership.userId !== subjectUserId"}:::decision
  n19 --> n20
  n21["Llama a DelegationEventsRepository.record"]:::llamada
  n20 -->|"sí"| n21
  n22[("CREA delegated_access.delegation_events")]:::efecto
  n21 --> n22
  n23{"!withinWindow"}:::decision
  n22 --> n23
  n20 -->|"no"| n23
  n24["Llama a DelegationEventsRepository.record"]:::llamada
  n23 -->|"sí"| n24
  n25[("CREA delegated_access.delegation_events")]:::efecto
  n24 --> n25
  n26["Llama a DelegatedAccessGrantsRepository.findActiveMatch"]:::llamada
  n25 --> n26
  n23 -->|"no"| n26
  n27[("LEE delegated_access.delegated_access_grants")]:::efecto
  n26 --> n27
  n28{"!grant"}:::decision
  n27 --> n28
  n29["Llama a DelegationEventsRepository.record"]:::llamada
  n28 -->|"sí"| n29
  n30[("CREA delegated_access.delegation_events")]:::efecto
  n29 --> n30
  n31{"dto.permissionId"}:::decision
  n30 --> n31
  n28 -->|"no"| n31
  n32["Llama a DelegatedPermissionSetItemsRepository.findBySetAndPermission"]:::llamada
  n31 -->|"sí"| n32
  n33[("LEE delegated_access.delegated_permission_set_items")]:::efecto
  n32 --> n33
  n34{"requiresStepUp"}:::decision
  n33 --> n34
  n31 -->|"no"| n34
  n35["Llama a DelegationEventsRepository.record"]:::llamada
  n34 -->|"sí"| n35
  n36[("CREA delegated_access.delegation_events")]:::efecto
  n35 --> n36
  n37["Llama a DelegationEventsRepository.record"]:::llamada
  n36 --> n37
  n34 -->|"no"| n37
  n38[("CREA delegated_access.delegation_events")]:::efecto
  n37 --> n38
  n39(("200 Responde con éxito")):::ok
  n38 --> n39
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /clinical/prescription-shares

Enlaces de receta de un paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PrescriptionSharesService.listForPatient"]:::llamada
  n2 --> n3
  n4{"!isOwner && !actor.practitionerProfileId"}:::decision
  n3 --> n4
  n5(["404 NOT_FOUND Paciente no encontrado"]):::error
  n4 -->|"sí"| n5
  n6["Llama a SharedAccessLinksRepository.findByPatient"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE delegated_access.shared_access_links")]:::efecto
  n6 --> n7
  n8["Llama a SharedAccessLinksRepository.findItemsForResources"]:::llamada
  n7 --> n8
  n9[("LEE clinical.medication_requests")]:::efecto
  n8 --> n9
  n10["Llama a SharedAccessLinksRepository.countOpenedByLinkIds"]:::llamada
  n9 --> n10
  n11[("LEE delegated_access.shared_access_link_uses")]:::efecto
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

#### 6. POST /clinical/prescription-shares

Compartir una receta con un enlace

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: {{ code: ErrorCode.VALIDATION_FAILED, message: 'Indicá la co…} |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {{ code: ErrorCode.FORBIDDEN, message: 'Solo el paciente o q…} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La receta no tiene medicamentos emitidos y vigentes para compartir. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PrescriptionSharesService.create"]:::llamada
  n2 --> n3
  n4["Llama a PrescriptionSharesService.targetOf"]:::llamada
  n3 --> n4
  n5{"hasEncounter === hasItem"}:::decision
  n4 --> n5
  n6(["400 VALIDATION_FAILED {{ code: ErrorCode.VALIDATION_FAILED, message: 'Indicá la co…}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a SharedAccessLinksRepository.findItemsByEncounter"]:::llamada
  n7 --> n8
  n9[("LEE clinical.medication_requests")]:::efecto
  n8 --> n9
  n10["Llama a PrescriptionSharesService.single"]:::llamada
  n9 --> n10
  n11["Llama a SharedAccessLinksRepository.findItemById"]:::llamada
  n10 --> n11
  n12[("LEE clinical.medication_requests")]:::efecto
  n11 --> n12
  n13{"items.length === 0"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15["Llama a PrescriptionSharesService.assertCanShare"]:::llamada
  n13 -->|"no"| n15
  n16{"!practitionerProfileId"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18{"!issuedAll"}:::decision
  n16 -->|"no"| n18
  n19(["403 FORBIDDEN {{ code: ErrorCode.FORBIDDEN, message: 'Solo el paciente o q…}"]):::error
  n18 -->|"sí"| n19
  n20{"activeItems.length === 0"}:::decision
  n18 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED La receta no tiene medicamentos emitidos y vigentes para compartir."]):::error
  n20 -->|"sí"| n21
  n22["Llama a SharedAccessLinksRepository.create"]:::llamada
  n20 -->|"no"| n22
  n23[("CREA delegated_access.shared_access_links")]:::efecto
  n22 --> n23
  n24(("201 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /clinical/prescription-shares/{shareId}/revoke

Revocar un enlace de receta

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PrescriptionSharesService.revoke"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SharedAccessLinksRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.shared_access_links")]:::efecto
  n5 --> n6
  n7{"!link || !this.ownsOrCreated(link, actor)"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9[("ACTUALIZA delegated_access.shared_access_links · ACTUALIZA delegated_access.shared_access_links · ACTUALIZA d…")]:::efecto
  n7 -->|"no"| n9
  n10(("204 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. GET /clinical/prescription-shares/by-token/{token}

Saber si un enlace es de la sesión

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
  n3["Llama a PrescriptionSharesService.resolveOwnership"]:::llamada
  n2 --> n3
  n4["Llama a PrescriptionSharesService.findByToken"]:::llamada
  n3 --> n4
  n5["Llama a SharedAccessLinksRepository.findByTokenHash"]:::llamada
  n4 --> n5
  n6[("LEE delegated_access.shared_access_links")]:::efecto
  n5 --> n6
  n7{"!link || !this.ownsOrCreated(link, actor)"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9(("200 Responde con éxito")):::ok
  n7 -->|"no"| n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /delegated-access/expiry-sweep

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

#### 10. POST /delegated-permission-sets

Publicar set de permisos delegados (scoped)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un set con ese código en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PermissionSetsService.createSet"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegatedPermissionSetsRepository.findByCode"]:::llamada
  n7 --> n8
  n9[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n8 --> n9
  n10{"clash"}:::decision
  n9 --> n10
  n11(["409 CONFLICT Ya existe un set con ese código en el tenant"]):::error
  n10 -->|"sí"| n11
  n12["Llama a DelegatedPermissionSetsRepository.create"]:::llamada
  n10 -->|"no"| n12
  n13[("CREA delegated_access.delegated_permission_sets")]:::efecto
  n12 --> n13
  n14["Repite: por cada const item de dto.items"]:::bucle
  n13 --> n14
  n15["Llama a DelegatedPermissionSetItemsRepository.create"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("CREA delegated_access.delegated_permission_set_items")]:::efecto
  n15 --> n16
  n17(("201 Responde con éxito")):::ok
  n16 --> n17
  n14 -->|"al terminar"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /delegated-permission-sets/{id}/versions

Versionar set de permisos delegados

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
  n3["Llama a PermissionSetsService.publishVersion"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegationScopeService.loadSetInTenant"]:::llamada
  n7 --> n8
  n9["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n9 --> n10
  n11[("ACTUALIZA delegated_access.delegated_permission_sets · ACTUALIZA delegated_access.delegated_permission_sets")]:::efecto
  n10 --> n11
  n12["Llama a DelegatedPermissionSetItemsRepository.deleteBySet"]:::llamada
  n11 --> n12
  n13[("BORRA delegated_access.delegated_permission_set_items")]:::efecto
  n12 --> n13
  n14["Repite: por cada const item de dto.items"]:::bucle
  n13 --> n14
  n15["Llama a DelegatedPermissionSetItemsRepository.create"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("CREA delegated_access.delegated_permission_set_items")]:::efecto
  n15 --> n16
  n17(("201 Responde con éxito")):::ok
  n16 --> n17
  n14 -->|"al terminar"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. GET /me/practitioner/governance-panel

Panel «Para su atención» del doctor

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
  n3["Llama a PractitionerGovernanceService.panel"]:::llamada
  n2 --> n3
  n4["Transacción: readWithSystemRls(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PractitionerGovernanceService.teamOf"]:::llamada
  n4 --> n5
  n6["Llama a SupportLinksRepository.findLinks"]:::llamada
  n5 --> n6
  n7[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n6 --> n7
  n8["Repite: por cada const userId de new Set(mine.map((r) =› r.supportUserId))"]:::bucle
  n7 --> n8
  n9["Llama a SupportLinksRepository.findLinks"]:::llamada
  n8 -->|"cada elemento"| n9
  n10[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n9 --> n10
  n11["Llama a PractitionerGovernanceRepository.countPendingReviews"]:::llamada
  n10 --> n11
  n8 -->|"al terminar"| n11
  n12[("LEE delegated_access.access_review_items")]:::efecto
  n11 --> n12
  n13["Llama a PractitionerGovernanceRepository.findOpenAnomalies"]:::llamada
  n12 --> n13
  n14[("LEE delegated_access.access_anomalies · LEE terminology.catalog_concepts")]:::efecto
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

#### 13. POST /me/practitioner/support-invitations

Invitar a una secretaria a asistirme

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vinculación no encontrada; ResourceNotFoundException: No hay una secretaria registrada con ese documento; ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.inviteForPractitioner"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SupportLinksRepository.findActiveRoleAssignmentsOfPractitioner"]:::llamada
  n4 --> n5
  n6[("LEE practice.practitioner_role_assignments · LEE practice.practices")]:::efecto
  n5 --> n6
  n7{"!role"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Vinculación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SupportStaffService.requireSecretaryByNationalId"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a SupportLinksRepository.findSecretaryByNationalId"]:::llamada
  n9 --> n10
  n11[("LEE iam.authentication_credentials · LEE profiles.person_account_links · LEE profiles.secretary_profiles")]:::efecto
  n10 --> n11
  n12{"!found"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND No hay una secretaria registrada con ese documento"]):::error
  n12 -->|"sí"| n13
  n14["Llama a SupportStaffService.createLinks"]:::llamada
  n12 -->|"no"| n14
  n15["Llama a SupportLinksRepository.findOrganizationName"]:::llamada
  n14 --> n15
  n16[("LEE directory.tenants")]:::efecto
  n15 --> n16
  n17{"organizationName === undefined"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Organización no encontrada"]):::error
  n17 -->|"sí"| n18
  n19["Repite: por cada const item de input.items"]:::bucle
  n17 -->|"no"| n19
  n20["Llama a SupportStaffService.resolveTarget"]:::llamada
  n19 -->|"cada elemento"| n20
  n21{"según item.targetKind"}:::decision
  n20 --> n21
  n22["Llama a SupportLinksRepository.findSiteInTenant"]:::llamada
  n21 -->|"'SITE'"| n22
  n23[("LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n22 --> n23
  n24["Llama a SupportLinksRepository.findUnitInTenant"]:::llamada
  n21 -->|"'SERVICE'"| n24
  n25[("LEE practice.clinical_units · LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n24 --> n25
  n26["Llama a SupportLinksRepository.findSpaceInTenant"]:::llamada
  n21 -->|"'SPACE'"| n26
  n27[("LEE practice.care_spaces · LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n26 --> n27
  n28["Llama a SupportLinksRepository.findActiveRoleAssignmentInTenant"]:::llamada
  n21 -->|"'PRACTITIONER'"| n28
  n29[("LEE practice.practitioner_role_assignments · LEE practice.practices")]:::efecto
  n28 --> n29
  n30["Llama a SupportLinksRepository.findLinks"]:::llamada
  n23 --> n30
  n25 --> n30
  n27 --> n30
  n29 --> n30
  n21 -->|"otro"| n30
  n19 -->|"al terminar"| n30
  n31[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n30 --> n31
  n32["Repite: por cada const target de resolved"]:::bucle
  n31 --> n32
  n33{"seen.has(key)"}:::decision
  n32 -->|"cada elemento"| n33
  n34(["409 CONFLICT Ya hay un vínculo vivo con ese mismo objetivo"]):::error
  n33 -->|"sí"| n34
  n35["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n33 -->|"no"| n35
  n32 -->|"al terminar"| n35
  n36[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n35 --> n36
  n37["Repite: por cada const target de resolved"]:::bucle
  n36 --> n37
  n38{"target.kind === 'PRACTITIONER'"}:::decision
  n37 -->|"cada elemento"| n38
  n39["Llama a SupportLinksRepository.createPractitionerLink"]:::llamada
  n38 -->|"sí"| n39
  n40[("CREA practice.practitioner_support_assignments")]:::efecto
  n39 --> n40
  n41["Llama a SupportLinksRepository.createLocationLink"]:::llamada
  n38 -->|"no"| n41
  n42[("CREA delegated_access.organization_user_assignments")]:::efecto
  n41 --> n42
  n43["Llama a SupportStaffService.createdView"]:::llamada
  n40 --> n43
  n42 --> n43
  n37 -->|"al terminar"| n43
  n44["Repite: por cada const id de ids"]:::bucle
  n43 --> n44
  n45["Llama a SupportLinksRepository.findLinks"]:::llamada
  n44 -->|"cada elemento"| n45
  n46[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n45 --> n46
  n47(("201 Responde con éxito")):::ok
  n46 --> n47
  n44 -->|"al terminar"| n47
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /me/practitioner/support-staff

Crear cuenta de secretaria y vincularla de inmediato

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vinculación no encontrada o no pertenece al médico |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese documento de identidad; ConflictException: La secretaria ya tiene un vínculo activo con esta vinculación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffProvisioningService.provisionForPractitioner"]:::llamada
  n2 --> n3
  n4{"!actor.practitionerProfileId"}:::decision
  n3 --> n4
  n5(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n4 -->|"sí"| n5
  n6["Llama a SupportStaffProvisioningRepository.findActiveRoleAssignmentOfPractitioner"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE practice.practitioner_role_assignments · LEE practice.practices · LEE directory.tenants")]:::efecto
  n6 --> n7
  n8{"!role"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Vinculación no encontrada o no pertenece al médico"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SupportStaffProvisioningService.obtainSecretary"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a IamSupportStaffSelfRegistrationService.register"]:::llamada
  n10 --> n11
  n12["Transacción: transactional(…)"]:::transaccion
  n11 --> n12
  n13["Llama a CredentialsRepository.findLivePasswordBySubject"]:::llamada
  n12 --> n13
  n14[("LEE iam.authentication_credentials")]:::efecto
  n13 --> n14
  n15{"existing"}:::decision
  n14 --> n15
  n16(["409 CONFLICT Ya existe una cuenta con ese documento de identidad"]):::error
  n15 -->|"sí"| n16
  n17["Llama a UsersRepository.create"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA iam.users")]:::efecto
  n17 --> n18
  n19["Llama a CredentialsRepository.createPassword"]:::llamada
  n18 --> n19
  n20[("CREA iam.authentication_credentials")]:::efecto
  n19 --> n20
  n21["Llama a UserGlobalRolesRepository.create"]:::llamada
  n20 --> n21
  n22[("CREA iam.user_global_roles")]:::efecto
  n21 --> n22
  n23["Llama a UserGlobalRolesRepository.create"]:::llamada
  n22 --> n23
  n24[("CREA iam.user_global_roles")]:::efecto
  n23 --> n24
  n25["Llama a ProfilesRegistrationAdapter.createSecretaryProfile"]:::llamada
  n24 --> n25
  n26[("CREA profiles.secretary_profiles")]:::efecto
  n25 --> n26
  n27["Llama a EmailVerificationsRepository.create"]:::llamada
  n26 --> n27
  n28[("CREA iam.email_verifications")]:::efecto
  n27 --> n28
  n29["Llama a SecurityEventsRepository.record"]:::llamada
  n28 --> n29
  n30[("CREA iam.security_events")]:::efecto
  n29 --> n30
  n31["Transacción: transactional(…)"]:::transaccion
  n30 --> n31
  n32["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n31 --> n32
  n33[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n32 --> n33
  n34["Llama a SupportLinksRepository.findLinks"]:::llamada
  n33 --> n34
  n35[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n34 --> n35
  n36{"alreadyLinked"}:::decision
  n35 --> n36
  n37(["409 CONFLICT La secretaria ya tiene un vínculo activo con esta vinculación"]):::error
  n36 -->|"sí"| n37
  n38["Llama a SupportStaffProvisioningRepository.createActivePractitionerLink"]:::llamada
  n36 -->|"no"| n38
  n39[("CREA practice.practitioner_support_assignments")]:::efecto
  n38 --> n39
  n40(("201 Responde con éxito")):::ok
  n39 --> n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /me/practitioner/support-team/{id}/end

Terminar el vínculo con una secretaria

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se termina un vínculo activo o pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.endForPractitioner"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.end"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SupportStaffService.loadLink"]:::llamada
  n5 --> n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"!(await allowed(link, tx))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"link.status !== 'ACTIVE' && link.status !== 'PENDING'"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED Sólo se termina un vínculo activo o pendiente"]):::error
  n13 -->|"sí"| n14
  n15["Llama a SupportLinksRepository.setStatus"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE delegated_access.organization_user_assignments · LEE practice.practitioner_support_assignments")]:::efecto
  n15 --> n16
  n17["Llama a SupportLinksRepository.closeMembershipIfUnused"]:::llamada
  n16 --> n17
  n18["Llama a SupportLinksRepository.findLinks"]:::llamada
  n17 --> n18
  n19[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n18 --> n19
  n20[("LEE directory.tenant_memberships")]:::efecto
  n19 --> n20
  n21["Repite: por cada const membership de memberships"]:::bucle
  n20 --> n21
  n22[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n21 -->|"cada elemento"| n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  n21 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. GET /me/support-agenda

Agenda de un doctor asignado (403 si no hay vínculo activo)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rango tiene que ser positivo y de {MAX_AGENDA_DAYS} días como mucho |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.agenda"]:::llamada
  n2 --> n3
  n4{"!(span › 0) || span › MAX_AGENDA_DAYS * 24 * 60 * 60 * 1000"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED El rango tiene que ser positivo y de {MAX_AGENDA_DAYS} días como mucho"]):::error
  n4 -->|"sí"| n5
  n6["Llama a SupportStaffService.scopeOf"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!scopeCoversPractitioner( scope, query.tenantId, query.practitionerRoleAssignmentId, )"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11["Transacción: withTenantRls(…)"]:::transaccion
  n9 -->|"no"| n11
  n12["Llama a SupportLinksRepository.findActiveRoleAssignmentInTenant"]:::llamada
  n11 --> n12
  n13[("LEE practice.practitioner_role_assignments · LEE practice.practices")]:::efecto
  n12 --> n13
  n14{"!role"}:::decision
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"sí"| n15
  n16["Llama a SupportLinksRepository.findPractitionerAgenda"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE scheduling.appointment_bookings · LEE scheduling.bookable_slots · LEE scheduling.schedulable_resources ·…")]:::efecto
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

#### 17. GET /me/support-catalog

Sedes, servicios, pisos y doctores de un hospital para pedir

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.catalogForSupport"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.requireSecretaryPerson"]:::llamada
  n3 --> n4
  n5["Llama a SupportLinksRepository.findSecretaryPersonId"]:::llamada
  n4 --> n5
  n6[("LEE profiles.person_account_links · LEE profiles.secretary_profiles")]:::efecto
  n5 --> n6
  n7{"!personId"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SupportStaffService.catalog"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a SupportLinksRepository.findOrganizationName"]:::llamada
  n9 --> n10
  n11[("LEE directory.tenants")]:::efecto
  n10 --> n11
  n12{"organizationName === undefined"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Organización no encontrada"]):::error
  n12 -->|"sí"| n13
  n14["Llama a SupportLinksRepository.findCatalog"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE practice.practice_sites · LEE practice.practices · LEE practice.clinical_units · LEE practice.care_spaces…")]:::efecto
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

#### 18. POST /me/support-engagements/{id}/confirm

Aceptar una invitación de apoyo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.confirmMine"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.decide"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SupportStaffService.loadLink"]:::llamada
  n5 --> n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"guard && !(await guard(tx, link))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"!decider.isSupportStaff && !decider.isOrganizationAdmin && !decider.isPractitioner"}:::decision
  n11 -->|"no"| n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"!mayDecide(link, decider)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Ese vínculo no está esperando su decisión"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SupportLinksRepository.setStatus"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE delegated_access.organization_user_assignments · LEE practice.practitioner_support_assignments")]:::efecto
  n17 --> n18
  n19{"status === 'ACTIVE' && grantsOrganizationAccess(link, decider)"}:::decision
  n18 --> n19
  n20["Llama a SupportLinksRepository.activateMembership"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n20 --> n21
  n22[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n21 --> n22
  n23{"membership.statusConceptId === DIR.MEMBERSHIP_INVITED"}:::decision
  n22 --> n23
  n24[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n23 -->|"sí"| n24
  n25{"status === 'REJECTED'"}:::decision
  n24 --> n25
  n23 -->|"no"| n25
  n19 -->|"no"| n25
  n26["Llama a SupportLinksRepository.closeMembershipIfUnused"]:::llamada
  n25 -->|"sí"| n26
  n27["Llama a SupportLinksRepository.findLinks"]:::llamada
  n26 --> n27
  n28[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n27 --> n28
  n29[("LEE directory.tenant_memberships")]:::efecto
  n28 --> n29
  n30["Repite: por cada const membership de memberships"]:::bucle
  n29 --> n30
  n31[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n30 -->|"cada elemento"| n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  n30 -->|"al terminar"| n32
  n25 -->|"no"| n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. POST /me/support-engagements/{id}/decline

Rechazar una invitación de apoyo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.declineMine"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.decide"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SupportStaffService.loadLink"]:::llamada
  n5 --> n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"guard && !(await guard(tx, link))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"!decider.isSupportStaff && !decider.isOrganizationAdmin && !decider.isPractitioner"}:::decision
  n11 -->|"no"| n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"!mayDecide(link, decider)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Ese vínculo no está esperando su decisión"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SupportLinksRepository.setStatus"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE delegated_access.organization_user_assignments · LEE practice.practitioner_support_assignments")]:::efecto
  n17 --> n18
  n19{"status === 'ACTIVE' && grantsOrganizationAccess(link, decider)"}:::decision
  n18 --> n19
  n20["Llama a SupportLinksRepository.activateMembership"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n20 --> n21
  n22[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n21 --> n22
  n23{"membership.statusConceptId === DIR.MEMBERSHIP_INVITED"}:::decision
  n22 --> n23
  n24[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n23 -->|"sí"| n24
  n25{"status === 'REJECTED'"}:::decision
  n24 --> n25
  n23 -->|"no"| n25
  n19 -->|"no"| n25
  n26["Llama a SupportLinksRepository.closeMembershipIfUnused"]:::llamada
  n25 -->|"sí"| n26
  n27["Llama a SupportLinksRepository.findLinks"]:::llamada
  n26 --> n27
  n28[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n27 --> n28
  n29[("LEE directory.tenant_memberships")]:::efecto
  n28 --> n29
  n30["Repite: por cada const membership de memberships"]:::bucle
  n29 --> n30
  n31[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n30 -->|"cada elemento"| n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  n30 -->|"al terminar"| n32
  n25 -->|"no"| n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. POST /me/support-engagements/{id}/leave

Dejar un vínculo o retirar mi pedido

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se termina un vínculo activo o pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.leaveMine"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.end"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SupportStaffService.loadLink"]:::llamada
  n5 --> n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"!(await allowed(link, tx))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"link.status !== 'ACTIVE' && link.status !== 'PENDING'"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED Sólo se termina un vínculo activo o pendiente"]):::error
  n13 -->|"sí"| n14
  n15["Llama a SupportLinksRepository.setStatus"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE delegated_access.organization_user_assignments · LEE practice.practitioner_support_assignments")]:::efecto
  n15 --> n16
  n17["Llama a SupportLinksRepository.closeMembershipIfUnused"]:::llamada
  n16 --> n17
  n18["Llama a SupportLinksRepository.findLinks"]:::llamada
  n17 --> n18
  n19[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n18 --> n19
  n20[("LEE directory.tenant_memberships")]:::efecto
  n19 --> n20
  n21["Repite: por cada const membership de memberships"]:::bucle
  n20 --> n21
  n22[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n21 -->|"cada elemento"| n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  n21 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. POST /org/{tenantMembershipId}/user-assignments

Asignar usuario de organización con alcance y vigencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Membresía no encontrada |
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
  n5["Llama a OrganizationUserAssignmentsRepository.findMembershipTenantId"]:::llamada
  n4 --> n5
  n6[("LEE directory.tenant_memberships")]:::efecto
  n5 --> n6
  n7{"!tenantId"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Membresía no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OrganizationUserAssignmentsRepository.findActiveOverlap"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE delegated_access.organization_user_assignments")]:::efecto
  n9 --> n10
  n11{"overlap"}:::decision
  n10 --> n11
  n12(["409 CONFLICT Ya existe una asignación activa con ese rol y alcance"]):::error
  n11 -->|"sí"| n12
  n13["Llama a OrganizationUserAssignmentsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA delegated_access.organization_user_assignments")]:::efecto
  n13 --> n14
  n15["Intenta"]:::intento
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"si falla"| n16
  n17(("201 Responde con éxito")):::ok
  n15 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 22. GET /org/affiliation-invitations

Listar los códigos de afiliación de la organización

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AffiliationInvitationsService.list"]:::llamada
  n2 --> n3
  n4["Llama a AffiliationInvitationsService.assertOrganizationAdmin"]:::llamada
  n3 --> n4
  n5["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n4 --> n5
  n6[("LEE directory.tenant_memberships")]:::efecto
  n5 --> n6
  n7(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n6 --> n7
  n8["Llama a AffiliationInvitationsRepository.listByTenant"]:::llamada
  n9[("LEE directory.affiliation_invitations")]:::efecto
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

#### 23. POST /org/affiliation-invitations

Crear un código o QR de afiliación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La organización necesita una sede activa para recibir solicitudes de médicos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AffiliationInvitationsService.create"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AffiliationInvitationsService.assertOrganizationAdmin"]:::llamada
  n4 --> n5
  n6["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n5 --> n6
  n7[("LEE directory.tenant_memberships")]:::efecto
  n6 --> n7
  n8(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n7 --> n8
  n9["Llama a AffiliationInvitationsRepository.findFirstActiveSite"]:::llamada
  n10[("LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n9 --> n10
  n11{"dto.kind === 'PRACTITIONER' && !(await this.invitations.findFirstActiveSite(tx, tenantId))"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La organización necesita una sede activa para recibir solicitudes de médicos"]):::error
  n11 -->|"sí"| n12
  n13["Llama a AffiliationInvitationsRepository.insert"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA directory.affiliation_invitations")]:::efecto
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

#### 24. POST /org/affiliation-invitations/{id}/revoke

Revocar un código o QR de afiliación

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Código de afiliación no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AffiliationInvitationsService.revoke"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AffiliationInvitationsService.assertOrganizationAdmin"]:::llamada
  n4 --> n5
  n6["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n5 --> n6
  n7[("LEE directory.tenant_memberships")]:::efecto
  n6 --> n7
  n8(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n7 --> n8
  n9["Llama a AffiliationInvitationsRepository.revoke"]:::llamada
  n10[("ACTUALIZA directory.affiliation_invitations")]:::efecto
  n9 --> n10
  n11{"!row"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Código de afiliación no encontrado"]):::error
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

#### 25. GET /org/support-catalog

Sedes, servicios, pisos y doctores para invitar

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.catalogForOrganization"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.assertOrganizationAdmin"]:::llamada
  n3 --> n4
  n5["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n4 --> n5
  n6[("LEE directory.tenant_memberships")]:::efecto
  n5 --> n6
  n7{"await this.links.isOrganizationAdmin(em, tenantId, actor.id)"}:::decision
  n6 --> n7
  n8["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n7 -->|"sí"| n8
  n9[("LEE directory.tenant_memberships")]:::efecto
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 --> n10
  n7 -->|"no"| n10
  n11["Llama a SupportStaffService.catalog"]:::llamada
  n12["Llama a SupportLinksRepository.findOrganizationName"]:::llamada
  n11 --> n12
  n13[("LEE directory.tenants")]:::efecto
  n12 --> n13
  n14{"organizationName === undefined"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Organización no encontrada"]):::error
  n14 -->|"sí"| n15
  n16["Llama a SupportLinksRepository.findCatalog"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE practice.practice_sites · LEE practice.practices · LEE practice.clinical_units · LEE practice.care_spaces…")]:::efecto
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

#### 26. GET /org/support-engagement-requests

Solicitudes e invitaciones de apoyo del hospital

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
  n3["Llama a SupportStaffService.listForOrganization"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.assertOrganizationAdmin"]:::llamada
  n3 --> n4
  n5["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n4 --> n5
  n6[("LEE directory.tenant_memberships")]:::efecto
  n5 --> n6
  n7{"await this.links.isOrganizationAdmin(em, tenantId, actor.id)"}:::decision
  n6 --> n7
  n8["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n7 -->|"sí"| n8
  n9[("LEE directory.tenant_memberships")]:::efecto
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 --> n10
  n7 -->|"no"| n10
  n11["Llama a SupportLinksRepository.findLinks"]:::llamada
  n12[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
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

#### 27. POST /org/support-engagement-requests/{id}/decision

Aceptar o rechazar una solicitud de apoyo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.decideForOrganization"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.decide"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SupportStaffService.loadLink"]:::llamada
  n5 --> n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"guard && !(await guard(tx, link))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"!decider.isSupportStaff && !decider.isOrganizationAdmin && !decider.isPractitioner"}:::decision
  n11 -->|"no"| n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"!mayDecide(link, decider)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Ese vínculo no está esperando su decisión"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SupportLinksRepository.setStatus"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE delegated_access.organization_user_assignments · LEE practice.practitioner_support_assignments")]:::efecto
  n17 --> n18
  n19{"status === 'ACTIVE' && grantsOrganizationAccess(link, decider)"}:::decision
  n18 --> n19
  n20["Llama a SupportLinksRepository.activateMembership"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n20 --> n21
  n22[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n21 --> n22
  n23{"membership.statusConceptId === DIR.MEMBERSHIP_INVITED"}:::decision
  n22 --> n23
  n24[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n23 -->|"sí"| n24
  n25{"status === 'REJECTED'"}:::decision
  n24 --> n25
  n23 -->|"no"| n25
  n19 -->|"no"| n25
  n26["Llama a SupportLinksRepository.closeMembershipIfUnused"]:::llamada
  n25 -->|"sí"| n26
  n27["Llama a SupportLinksRepository.findLinks"]:::llamada
  n26 --> n27
  n28[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n27 --> n28
  n29[("LEE directory.tenant_memberships")]:::efecto
  n28 --> n29
  n30["Repite: por cada const membership de memberships"]:::bucle
  n29 --> n30
  n31[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n30 -->|"cada elemento"| n31
  n32["Transacción: decide(…)"]:::transaccion
  n31 --> n32
  n30 -->|"al terminar"| n32
  n25 -->|"no"| n32
  n33["Llama a SupportStaffService.assertOrganizationAdmin"]:::llamada
  n32 --> n33
  n34["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n33 --> n34
  n35[("LEE directory.tenant_memberships")]:::efecto
  n34 --> n35
  n36{"await this.links.isOrganizationAdmin(em, tenantId, actor.id)"}:::decision
  n35 --> n36
  n37["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n36 -->|"sí"| n37
  n38[("LEE directory.tenant_memberships")]:::efecto
  n37 --> n38
  n39(["↩ (relanza el error capturado)"]):::error
  n38 --> n39
  n36 -->|"no"| n39
  n40(("200 Responde con éxito")):::ok
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 28. GET /org/support-engagements

Personal de apoyo del hospital

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
  n3["Llama a SupportStaffService.listEngagementsForOrganization"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.assertOrganizationAdmin"]:::llamada
  n3 --> n4
  n5["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n4 --> n5
  n6[("LEE directory.tenant_memberships")]:::efecto
  n5 --> n6
  n7{"await this.links.isOrganizationAdmin(em, tenantId, actor.id)"}:::decision
  n6 --> n7
  n8["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n7 -->|"sí"| n8
  n9[("LEE directory.tenant_memberships")]:::efecto
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 --> n10
  n7 -->|"no"| n10
  n11["Llama a SupportLinksRepository.findLinks"]:::llamada
  n12[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
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

#### 29. POST /org/support-engagements/{id}/end

Terminar un vínculo de apoyo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.endForOrganization"]:::llamada
  n2 --> n3
  n4["Transacción: end(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SupportStaffService.assertOrganizationAdmin"]:::llamada
  n4 --> n5
  n6["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n5 --> n6
  n7[("LEE directory.tenant_memberships")]:::efecto
  n6 --> n7
  n8{"await this.links.isOrganizationAdmin(em, tenantId, actor.id)"}:::decision
  n7 --> n8
  n9["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n8 -->|"sí"| n9
  n10[("LEE directory.tenant_memberships")]:::efecto
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 --> n11
  n8 -->|"no"| n11
  n12(("200 Responde con éxito")):::ok
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 30. POST /org/support-staff

Crear cuenta de secretaria y vincularla a la organización de inmediato

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese documento de identidad; ConflictException: La cuenta ya tiene una membresía en la organización que no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffProvisioningService.provisionForOrganization"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffProvisioningService.assertOrganizationAdmin"]:::llamada
  n3 --> n4
  n5["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n4 --> n5
  n6[("LEE directory.tenant_memberships")]:::efecto
  n5 --> n6
  n7{"!isAdmin"}:::decision
  n6 --> n7
  n8(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n7 -->|"sí"| n8
  n9["Llama a SupportStaffProvisioningService.obtainSecretary"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a IamSupportStaffSelfRegistrationService.register"]:::llamada
  n9 --> n10
  n11["Transacción: transactional(…)"]:::transaccion
  n10 --> n11
  n12["Llama a CredentialsRepository.findLivePasswordBySubject"]:::llamada
  n11 --> n12
  n13[("LEE iam.authentication_credentials")]:::efecto
  n12 --> n13
  n14{"existing"}:::decision
  n13 --> n14
  n15(["409 CONFLICT Ya existe una cuenta con ese documento de identidad"]):::error
  n14 -->|"sí"| n15
  n16["Llama a UsersRepository.create"]:::llamada
  n14 -->|"no"| n16
  n17[("CREA iam.users")]:::efecto
  n16 --> n17
  n18["Llama a CredentialsRepository.createPassword"]:::llamada
  n17 --> n18
  n19[("CREA iam.authentication_credentials")]:::efecto
  n18 --> n19
  n20["Llama a UserGlobalRolesRepository.create"]:::llamada
  n19 --> n20
  n21[("CREA iam.user_global_roles")]:::efecto
  n20 --> n21
  n22["Llama a UserGlobalRolesRepository.create"]:::llamada
  n21 --> n22
  n23[("CREA iam.user_global_roles")]:::efecto
  n22 --> n23
  n24["Llama a ProfilesRegistrationAdapter.createSecretaryProfile"]:::llamada
  n23 --> n24
  n25[("CREA profiles.secretary_profiles")]:::efecto
  n24 --> n25
  n26["Llama a EmailVerificationsRepository.create"]:::llamada
  n25 --> n26
  n27[("CREA iam.email_verifications")]:::efecto
  n26 --> n27
  n28["Llama a SecurityEventsRepository.record"]:::llamada
  n27 --> n28
  n29[("CREA iam.security_events")]:::efecto
  n28 --> n29
  n30["Transacción: transactional(…)"]:::transaccion
  n29 --> n30
  n31["Llama a SupportStaffProvisioningRepository.ensureActiveTenantMembership"]:::llamada
  n30 --> n31
  n32[("LEE directory.tenant_memberships")]:::efecto
  n31 --> n32
  n33{"existing"}:::decision
  n32 --> n33
  n34{"existing.statusConceptId !== DIR.MEMBERSHIP_ACTIVE"}:::decision
  n33 -->|"sí"| n34
  n35(["409 CONFLICT La cuenta ya tiene una membresía en la organización que no está activa"]):::error
  n34 -->|"sí"| n35
  n36[("CREA directory.tenant_memberships")]:::efecto
  n34 -->|"no"| n36
  n33 -->|"no"| n36
  n37["Llama a SupportStaffProvisioningRepository.createActiveLocationLink"]:::llamada
  n36 --> n37
  n38[("CREA delegated_access.organization_user_assignments")]:::efecto
  n37 --> n38
  n39(("201 Responde con éxito")):::ok
  n38 --> n39
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 31. POST /org/team/invitations

Invitar a una secretaria a lugares o doctores

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay una secretaria registrada con ese documento; ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.inviteForOrganization"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SupportStaffService.assertOrganizationAdmin"]:::llamada
  n4 --> n5
  n6["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n5 --> n6
  n7[("LEE directory.tenant_memberships")]:::efecto
  n6 --> n7
  n8{"await this.links.isOrganizationAdmin(em, tenantId, actor.id)"}:::decision
  n7 --> n8
  n9["Llama a SupportLinksRepository.isOrganizationAdmin"]:::llamada
  n8 -->|"sí"| n9
  n10[("LEE directory.tenant_memberships")]:::efecto
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 --> n11
  n8 -->|"no"| n11
  n12["Llama a SupportStaffService.requireSecretaryByNationalId"]:::llamada
  n13["Llama a SupportLinksRepository.findSecretaryByNationalId"]:::llamada
  n12 --> n13
  n14[("LEE iam.authentication_credentials · LEE profiles.person_account_links · LEE profiles.secretary_profiles")]:::efecto
  n13 --> n14
  n15{"!found"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND No hay una secretaria registrada con ese documento"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SupportStaffService.createLinks"]:::llamada
  n15 -->|"no"| n17
  n18["Llama a SupportLinksRepository.findOrganizationName"]:::llamada
  n17 --> n18
  n19[("LEE directory.tenants")]:::efecto
  n18 --> n19
  n20{"organizationName === undefined"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Organización no encontrada"]):::error
  n20 -->|"sí"| n21
  n22["Repite: por cada const item de input.items"]:::bucle
  n20 -->|"no"| n22
  n23["Llama a SupportStaffService.resolveTarget"]:::llamada
  n22 -->|"cada elemento"| n23
  n24{"según item.targetKind"}:::decision
  n23 --> n24
  n25["Llama a SupportLinksRepository.findSiteInTenant"]:::llamada
  n24 -->|"'SITE'"| n25
  n26[("LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n25 --> n26
  n27["Llama a SupportLinksRepository.findUnitInTenant"]:::llamada
  n24 -->|"'SERVICE'"| n27
  n28[("LEE practice.clinical_units · LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n27 --> n28
  n29["Llama a SupportLinksRepository.findSpaceInTenant"]:::llamada
  n24 -->|"'SPACE'"| n29
  n30[("LEE practice.care_spaces · LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n29 --> n30
  n31["Llama a SupportLinksRepository.findActiveRoleAssignmentInTenant"]:::llamada
  n24 -->|"'PRACTITIONER'"| n31
  n32[("LEE practice.practitioner_role_assignments · LEE practice.practices")]:::efecto
  n31 --> n32
  n33["Llama a SupportLinksRepository.findLinks"]:::llamada
  n26 --> n33
  n28 --> n33
  n30 --> n33
  n32 --> n33
  n24 -->|"otro"| n33
  n22 -->|"al terminar"| n33
  n34[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n33 --> n34
  n35["Repite: por cada const target de resolved"]:::bucle
  n34 --> n35
  n36{"seen.has(key)"}:::decision
  n35 -->|"cada elemento"| n36
  n37(["409 CONFLICT Ya hay un vínculo vivo con ese mismo objetivo"]):::error
  n36 -->|"sí"| n37
  n38["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n36 -->|"no"| n38
  n35 -->|"al terminar"| n38
  n39[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n38 --> n39
  n40["Repite: por cada const target de resolved"]:::bucle
  n39 --> n40
  n41{"target.kind === 'PRACTITIONER'"}:::decision
  n40 -->|"cada elemento"| n41
  n42["Llama a SupportLinksRepository.createPractitionerLink"]:::llamada
  n41 -->|"sí"| n42
  n43[("CREA practice.practitioner_support_assignments")]:::efecto
  n42 --> n43
  n44["Llama a SupportLinksRepository.createLocationLink"]:::llamada
  n41 -->|"no"| n44
  n45[("CREA delegated_access.organization_user_assignments")]:::efecto
  n44 --> n45
  n46["Llama a SupportStaffService.createdView"]:::llamada
  n43 --> n46
  n45 --> n46
  n40 -->|"al terminar"| n46
  n47["Repite: por cada const id de ids"]:::bucle
  n46 --> n47
  n48["Llama a SupportLinksRepository.findLinks"]:::llamada
  n47 -->|"cada elemento"| n48
  n49[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n48 --> n49
  n50(("201 Responde con éxito")):::ok
  n49 --> n50
  n47 -->|"al terminar"| n50
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 32. PATCH /org/user-assignments/{id}

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
  n4{"dto.supervisorUserId === undefined && dto.accessScope === undefined && !targetsChange && !dto.suspend"}:::decision
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
  n17{"scopeChange"}:::decision
  n16 --> n17
  n15 -->|"no"| n17
  n18[("ACTUALIZA delegated_access.organization_user_assignments · ACTUALIZA delegated_access.organization_user_assig…")]:::efecto
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
  n23{"scopeChange"}:::decision
  n22 --> n23
  n19 -->|"no"| n23
  n24["Intenta"]:::intento
  n23 -->|"sí"| n24
  n25(["↩ (relanza el error capturado)"]):::error
  n24 -->|"si falla"| n25
  n26[("LEE directory.tenant_memberships")]:::efecto
  n24 --> n26
  n27["Llama a OutboxService.publishDomainEvent"]:::llamada
  n26 --> n27
  n28["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n27 --> n28
  n29["Transacción: startActiveSpan(…)"]:::transaccion
  n28 --> n29
  n30["Intenta"]:::intento
  n29 --> n30
  n31(["↩ (relanza el error capturado)"]):::error
  n30 -->|"si falla"| n31
  n32["Llama a OutboxService.persistDomainEvent"]:::llamada
  n30 --> n32
  n33["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n32 --> n33
  n34[("LEE messaging.outbox_messages")]:::efecto
  n33 --> n34
  n35["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n34 --> n35
  n36[("CREA messaging.domain_events")]:::efecto
  n35 --> n36
  n37["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n36 --> n37
  n38[("CREA messaging.outbox_messages")]:::efecto
  n37 --> n38
  n39>"Evento delegated_access.assignment.scope_changed"]:::evento
  n38 --> n39
  n40(("200 Responde con éxito")):::ok
  n39 --> n40
  n23 -->|"no"| n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 33. POST /practitioner-delegates

Crear asignación de delegado de practitioner

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El usuario de organización no está activo; PreconditionFailedException: El set de permisos no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PractitionerDelegatesService.createDelegate"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegationScopeService.loadOrgAssignmentInTenant"]:::llamada
  n7 --> n8
  n9["Llama a OrganizationUserAssignmentsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE delegated_access.organization_user_assignments")]:::efecto
  n9 --> n10
  n11["Llama a DelegationScopeService.membershipOfAssignment"]:::llamada
  n10 --> n11
  n12["Llama a DelegationScopeRepository.membershipOf"]:::llamada
  n11 --> n12
  n13[("LEE directory.tenant_memberships")]:::efecto
  n12 --> n13
  n14["Llama a DelegationScopeService.assertRoleAssignmentInTenant"]:::llamada
  n13 --> n14
  n15["Llama a DelegationScopeRepository.roleAssignmentTenant"]:::llamada
  n14 --> n15
  n16[("LEE practice.practitioner_role_assignments · LEE practice.practices")]:::efecto
  n15 --> n16
  n17{"orgAssignment.statusConceptId !== STATUS.ACTIVE"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED El usuario de organización no está activo"]):::error
  n17 -->|"sí"| n18
  n19["Llama a DelegationScopeService.loadSetInTenant"]:::llamada
  n17 -->|"no"| n19
  n20["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n19 --> n20
  n21[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n20 --> n21
  n22{"set.statusConceptId !== STATUS.ACTIVE"}:::decision
  n21 --> n22
  n23(["422 PRECONDITION_FAILED El set de permisos no está activo"]):::error
  n22 -->|"sí"| n23
  n24["Llama a PractitionerDelegateAssignmentsRepository.create"]:::llamada
  n22 -->|"no"| n24
  n25[("CREA delegated_access.practitioner_delegate_assignments")]:::efecto
  n24 --> n25
  n26["Llama a DelegationEventsRepository.record"]:::llamada
  n25 --> n26
  n27[("CREA delegated_access.delegation_events")]:::efecto
  n26 --> n27
  n28(("201 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 34. POST /practitioner-delegates/{id}/accept

Aceptar a una secretaria

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.acceptForPractitioner"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.decide"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SupportStaffService.loadLink"]:::llamada
  n5 --> n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"guard && !(await guard(tx, link))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"!decider.isSupportStaff && !decider.isOrganizationAdmin && !decider.isPractitioner"}:::decision
  n11 -->|"no"| n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"!mayDecide(link, decider)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Ese vínculo no está esperando su decisión"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SupportLinksRepository.setStatus"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE delegated_access.organization_user_assignments · LEE practice.practitioner_support_assignments")]:::efecto
  n17 --> n18
  n19{"status === 'ACTIVE' && grantsOrganizationAccess(link, decider)"}:::decision
  n18 --> n19
  n20["Llama a SupportLinksRepository.activateMembership"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n20 --> n21
  n22[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n21 --> n22
  n23{"membership.statusConceptId === DIR.MEMBERSHIP_INVITED"}:::decision
  n22 --> n23
  n24[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n23 -->|"sí"| n24
  n25{"status === 'REJECTED'"}:::decision
  n24 --> n25
  n23 -->|"no"| n25
  n19 -->|"no"| n25
  n26["Llama a SupportLinksRepository.closeMembershipIfUnused"]:::llamada
  n25 -->|"sí"| n26
  n27["Llama a SupportLinksRepository.findLinks"]:::llamada
  n26 --> n27
  n28[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n27 --> n28
  n29[("LEE directory.tenant_memberships")]:::efecto
  n28 --> n29
  n30["Repite: por cada const membership de memberships"]:::bucle
  n29 --> n30
  n31[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n30 -->|"cada elemento"| n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  n30 -->|"al terminar"| n32
  n25 -->|"no"| n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 35. POST /practitioner-delegates/{id}/access-requests

Solicitar acceso delegado (aprobación previa)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una solicitud pendiente equivalente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AccessRequestsService.requestAccess"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegationScopeService.loadDelegationInTenant"]:::llamada
  n7 --> n8
  n9["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n9 --> n10
  n11{"!delegate"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n13 --> n14
  n15{"delegate.statusConceptId !== STATUS.ACTIVE"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED La delegación no está activa"]):::error
  n15 -->|"sí"| n16
  n17["Llama a DelegationScopeService.assertGrantTarget"]:::llamada
  n15 -->|"no"| n17
  n18{"encounterId"}:::decision
  n17 --> n18
  n19["Llama a DelegationScopeRepository.encounterScope"]:::llamada
  n18 -->|"sí"| n19
  n20[("LEE clinical.encounters")]:::efecto
  n19 --> n20
  n21{"!encounter || encounter.tenantId !== tenantId || (patientProfileId !== undefined && encounter.patientProfileI…"}:::decision
  n20 --> n21
  n22(["↩ (relanza el error capturado)"]):::error
  n21 -->|"sí"| n22
  n23{"patientProfileId"}:::decision
  n21 -->|"no"| n23
  n18 -->|"no"| n23
  n24["Llama a DelegationScopeRepository.patientExists"]:::llamada
  n23 -->|"sí"| n24
  n25[("LEE profiles.patient_profiles")]:::efecto
  n24 --> n25
  n26{"!exists"}:::decision
  n25 --> n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"sí"| n27
  n28["Llama a DelegatedAccessApprovalRequestsRepository.findOpenDuplicate"]:::llamada
  n26 -->|"no"| n28
  n23 -->|"no"| n28
  n29[("LEE delegated_access.delegated_access_approval_requests")]:::efecto
  n28 --> n29
  n30{"dup"}:::decision
  n29 --> n30
  n31(["409 CONFLICT Ya existe una solicitud pendiente equivalente"]):::error
  n30 -->|"sí"| n31
  n32["Llama a DelegatedAccessApprovalRequestsRepository.create"]:::llamada
  n30 -->|"no"| n32
  n33[("CREA delegated_access.delegated_access_approval_requests")]:::efecto
  n32 --> n33
  n34["Llama a DelegationEventsRepository.record"]:::llamada
  n33 --> n34
  n35[("CREA delegated_access.delegation_events")]:::efecto
  n34 --> n35
  n36(("201 Responde con éxito")):::ok
  n35 --> n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 36. POST /practitioner-delegates/{id}/grants

Otorgar grant delegado por-propósito y temporal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PractitionerDelegatesService.issueGrant"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegationScopeService.loadDelegationInTenant"]:::llamada
  n7 --> n8
  n9["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n9 --> n10
  n11{"!delegate"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n13 --> n14
  n15{"delegate.statusConceptId !== STATUS.ACTIVE"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED La delegación no está activa"]):::error
  n15 -->|"sí"| n16
  n17["Llama a DelegationScopeService.assertGrantTarget"]:::llamada
  n15 -->|"no"| n17
  n18{"encounterId"}:::decision
  n17 --> n18
  n19["Llama a DelegationScopeRepository.encounterScope"]:::llamada
  n18 -->|"sí"| n19
  n20[("LEE clinical.encounters")]:::efecto
  n19 --> n20
  n21{"!encounter || encounter.tenantId !== tenantId || (patientProfileId !== undefined && encounter.patientProfileI…"}:::decision
  n20 --> n21
  n22(["↩ (relanza el error capturado)"]):::error
  n21 -->|"sí"| n22
  n23{"patientProfileId"}:::decision
  n21 -->|"no"| n23
  n18 -->|"no"| n23
  n24["Llama a DelegationScopeRepository.patientExists"]:::llamada
  n23 -->|"sí"| n24
  n25[("LEE profiles.patient_profiles")]:::efecto
  n24 --> n25
  n26{"!exists"}:::decision
  n25 --> n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"sí"| n27
  n28["Llama a DelegatedAccessGrantsRepository.create"]:::llamada
  n26 -->|"no"| n28
  n23 -->|"no"| n28
  n29[("CREA delegated_access.delegated_access_grants")]:::efecto
  n28 --> n29
  n30["Llama a DelegationEventsRepository.record"]:::llamada
  n29 --> n30
  n31[("CREA delegated_access.delegation_events")]:::efecto
  n30 --> n31
  n32(("201 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 37. POST /practitioner-delegates/{id}/reject

Rechazar a una secretaria

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.rejectForPractitioner"]:::llamada
  n2 --> n3
  n4["Llama a SupportStaffService.decide"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a SupportStaffService.loadLink"]:::llamada
  n5 --> n6
  n7["Llama a SupportLinksRepository.findLinks"]:::llamada
  n6 --> n7
  n8[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n7 --> n8
  n9{"!link"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"guard && !(await guard(tx, link))"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"!decider.isSupportStaff && !decider.isOrganizationAdmin && !decider.isPractitioner"}:::decision
  n11 -->|"no"| n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"!mayDecide(link, decider)"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Ese vínculo no está esperando su decisión"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SupportLinksRepository.setStatus"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE delegated_access.organization_user_assignments · LEE practice.practitioner_support_assignments")]:::efecto
  n17 --> n18
  n19{"status === 'ACTIVE' && grantsOrganizationAccess(link, decider)"}:::decision
  n18 --> n19
  n20["Llama a SupportLinksRepository.activateMembership"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n20 --> n21
  n22[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n21 --> n22
  n23{"membership.statusConceptId === DIR.MEMBERSHIP_INVITED"}:::decision
  n22 --> n23
  n24[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n23 -->|"sí"| n24
  n25{"status === 'REJECTED'"}:::decision
  n24 --> n25
  n23 -->|"no"| n25
  n19 -->|"no"| n25
  n26["Llama a SupportLinksRepository.closeMembershipIfUnused"]:::llamada
  n25 -->|"sí"| n26
  n27["Llama a SupportLinksRepository.findLinks"]:::llamada
  n26 --> n27
  n28[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n27 --> n28
  n29[("LEE directory.tenant_memberships")]:::efecto
  n28 --> n29
  n30["Repite: por cada const membership de memberships"]:::bucle
  n29 --> n30
  n31[("ACTUALIZA directory.tenant_memberships · ACTUALIZA directory.tenant_memberships")]:::efecto
  n30 -->|"cada elemento"| n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  n30 -->|"al terminar"| n32
  n25 -->|"no"| n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 38. POST /practitioner-delegates/{id}/revoke

Revocar delegación de forma inmediata (cascada authz)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
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
  n3["Llama a PractitionerDelegatesService.revoke"]:::llamada
  n2 --> n3
  n4["Llama a DelegationScopeService.resolveTenant"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["500 INTERNAL {HttpStatus.FORBIDDEN}"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DelegationScopeService.loadDelegationInTenant"]:::llamada
  n7 --> n8
  n9["Llama a PractitionerDelegateAssignmentsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE delegated_access.practitioner_delegate_assignments")]:::efecto
  n9 --> n10
  n11{"!delegate"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DelegatedPermissionSetsRepository.findById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE delegated_access.delegated_permission_sets")]:::efecto
  n13 --> n14
  n15["Llama a DelegatedAccessGrantsRepository.revokeActiveByAssignment"]:::llamada
  n14 --> n15
  n16[("ACTUALIZA delegated_access.delegated_access_grants")]:::efecto
  n15 --> n16
  n17["Llama a DelegatedAccessApprovalRequestsRepository.cancelOpenByAssignment"]:::llamada
  n16 --> n17
  n18[("ACTUALIZA delegated_access.delegated_access_approval_requests")]:::efecto
  n17 --> n18
  n19["Llama a DelegationEventsRepository.record"]:::llamada
  n18 --> n19
  n20[("CREA delegated_access.delegation_events")]:::efecto
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

#### 39. GET /public/prescription-shares/{token}

Comprobar un enlace de receta compartida

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PrescriptionSharesService.readPublic"]:::llamada
  n2 --> n3
  n4["Llama a PrescriptionSharesService.resolve"]:::llamada
  n3 --> n4
  n5["Llama a PrescriptionSharesService.findByToken"]:::llamada
  n4 --> n5
  n6["Llama a SharedAccessLinksRepository.findByTokenHash"]:::llamada
  n5 --> n6
  n7[("LEE delegated_access.shared_access_links")]:::efecto
  n6 --> n7
  n8["Llama a SharedAccessLinksRepository.findItemsByEncounter"]:::llamada
  n7 --> n8
  n9[("LEE clinical.medication_requests")]:::efecto
  n8 --> n9
  n10["Llama a PrescriptionSharesService.single"]:::llamada
  n9 --> n10
  n11["Llama a SharedAccessLinksRepository.findItemById"]:::llamada
  n10 --> n11
  n12[("LEE clinical.medication_requests")]:::efecto
  n11 --> n12
  n13{"!resolved"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"resolved.status !== 'VALID'"}:::decision
  n13 -->|"no"| n15
  n16["Llama a PrescriptionSharesService.recordUse"]:::llamada
  n15 -->|"sí"| n16
  n17["Transacción: transactional(…)"]:::transaccion
  n16 --> n17
  n18["Llama a SharedAccessLinksRepository.appendUse"]:::llamada
  n17 --> n18
  n19[("CREA delegated_access.shared_access_link_uses")]:::efecto
  n18 --> n19
  n20["Llama a PrescriptionSharesService.prescriberOf"]:::llamada
  n19 --> n20
  n15 -->|"no"| n20
  n21["Llama a PrescriberIdentityReader.read"]:::llamada
  n20 --> n21
  n22["Llama a HealthPractitionerProfilesRepository.findById"]:::llamada
  n21 --> n22
  n23[("LEE profiles.health_practitioner_profiles")]:::efecto
  n22 --> n23
  n24["Llama a PersonsRepository.findById"]:::llamada
  n23 --> n24
  n25[("LEE profiles.persons")]:::efecto
  n24 --> n25
  n26["Llama a JurisdictionAuthorizationsRepository.findByPractitioner"]:::llamada
  n25 --> n26
  n27[("LEE profiles.jurisdiction_authorizations")]:::efecto
  n26 --> n27
  n28{"resolved.status === 'VALID'"}:::decision
  n27 --> n28
  n29["Llama a PrescriptionSharesService.recordUse"]:::llamada
  n28 -->|"sí"| n29
  n30["Transacción: transactional(…)"]:::transaccion
  n29 --> n30
  n31["Llama a SharedAccessLinksRepository.appendUse"]:::llamada
  n30 --> n31
  n32[("CREA delegated_access.shared_access_link_uses")]:::efecto
  n31 --> n32
  n33(("200 Responde con éxito")):::ok
  n32 --> n33
  n28 -->|"no"| n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 40. POST /support-engagement-requests

Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SupportStaffService.request"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a SupportStaffService.requireSecretaryPerson"]:::llamada
  n4 --> n5
  n6["Llama a SupportLinksRepository.findSecretaryPersonId"]:::llamada
  n5 --> n6
  n7[("LEE profiles.person_account_links · LEE profiles.secretary_profiles")]:::efecto
  n6 --> n7
  n8{"!personId"}:::decision
  n7 --> n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SupportStaffService.createLinks"]:::llamada
  n8 -->|"no"| n10
  n11["Llama a SupportLinksRepository.findOrganizationName"]:::llamada
  n10 --> n11
  n12[("LEE directory.tenants")]:::efecto
  n11 --> n12
  n13{"organizationName === undefined"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Organización no encontrada"]):::error
  n13 -->|"sí"| n14
  n15["Repite: por cada const item de input.items"]:::bucle
  n13 -->|"no"| n15
  n16["Llama a SupportStaffService.resolveTarget"]:::llamada
  n15 -->|"cada elemento"| n16
  n17{"según item.targetKind"}:::decision
  n16 --> n17
  n18["Llama a SupportLinksRepository.findSiteInTenant"]:::llamada
  n17 -->|"'SITE'"| n18
  n19[("LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n18 --> n19
  n20["Llama a SupportLinksRepository.findUnitInTenant"]:::llamada
  n17 -->|"'SERVICE'"| n20
  n21[("LEE practice.clinical_units · LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n20 --> n21
  n22["Llama a SupportLinksRepository.findSpaceInTenant"]:::llamada
  n17 -->|"'SPACE'"| n22
  n23[("LEE practice.care_spaces · LEE practice.practice_sites · LEE practice.practices")]:::efecto
  n22 --> n23
  n24["Llama a SupportLinksRepository.findActiveRoleAssignmentInTenant"]:::llamada
  n17 -->|"'PRACTITIONER'"| n24
  n25[("LEE practice.practitioner_role_assignments · LEE practice.practices")]:::efecto
  n24 --> n25
  n26["Llama a SupportLinksRepository.findLinks"]:::llamada
  n19 --> n26
  n21 --> n26
  n23 --> n26
  n25 --> n26
  n17 -->|"otro"| n26
  n15 -->|"al terminar"| n26
  n27[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n26 --> n27
  n28["Repite: por cada const target de resolved"]:::bucle
  n27 --> n28
  n29{"seen.has(key)"}:::decision
  n28 -->|"cada elemento"| n29
  n30(["409 CONFLICT Ya hay un vínculo vivo con ese mismo objetivo"]):::error
  n29 -->|"sí"| n30
  n31["Llama a SupportLinksRepository.findOrCreateMembership"]:::llamada
  n29 -->|"no"| n31
  n28 -->|"al terminar"| n31
  n32[("LEE directory.tenant_memberships · CREA directory.tenant_memberships")]:::efecto
  n31 --> n32
  n33["Repite: por cada const target de resolved"]:::bucle
  n32 --> n33
  n34{"target.kind === 'PRACTITIONER'"}:::decision
  n33 -->|"cada elemento"| n34
  n35["Llama a SupportLinksRepository.createPractitionerLink"]:::llamada
  n34 -->|"sí"| n35
  n36[("CREA practice.practitioner_support_assignments")]:::efecto
  n35 --> n36
  n37["Llama a SupportLinksRepository.createLocationLink"]:::llamada
  n34 -->|"no"| n37
  n38[("CREA delegated_access.organization_user_assignments")]:::efecto
  n37 --> n38
  n39["Llama a SupportStaffService.createdView"]:::llamada
  n36 --> n39
  n38 --> n39
  n33 -->|"al terminar"| n39
  n40["Repite: por cada const id de ids"]:::bucle
  n39 --> n40
  n41["Llama a SupportLinksRepository.findLinks"]:::llamada
  n40 -->|"cada elemento"| n41
  n42[("LEE delegated_access.organization_user_assignments · LEE directory.tenant_memberships · LEE directory.tenants…")]:::efecto
  n41 --> n42
  n43(("201 Responde con éxito")):::ok
  n42 --> n43
  n40 -->|"al terminar"| n43
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
| GET /delegated-permission-sets | 200, 401, 403, 429 | 1 |
| GET /me/practitioner/support-activity | 200, 401, 403, 429 | 0 |
| GET /me/practitioner/support-team | 200, 401, 403, 429 | 12 |
| GET /me/support-access | 200, 401, 403, 429 | 12 |
| GET /me/support-engagements | 200, 401, 403, 429 | 12 |
