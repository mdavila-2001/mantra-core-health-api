<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `consent`

- **Procesos:** 2 · **Máquinas de estado:** 0
- **Operaciones:** 22 (15 con decisiones propias, 7 sin ellas)
- Inventario de endpoints del módulo: [consent](../endpoints/consent.md)

## Proceso: Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence)

- **Código:** `consent` · **Agrupación:** MIXTO · **Operaciones:** 22
- **Actores:** CLINICIAN · PATIENT · PRACTITIONER · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/consent/README.md`

### Para qué sirve

Directivas de privacidad, bases legales de procesamiento y evidencia de consentimiento. Implementa los 12 casos de uso UC-07-01..12 como endpoints REST, siguiendo el stack de referencia (IAM): controladores finos, servicios dueños de la transacción, repositorios stateless y conceptos de dominio versionados.

_Fuente: `src/modules/consent/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-07-01` | Capturar consentimiento de directiva de privacidad (+ provisiones + evento granted) | POST /consent/consents | SECURITY_ADMIN | MEDIO | 4 |
| `UC-07-02` | Retirar consentimiento y disparar re-evaluación de accesos | POST /consent/consents/{id}/withdraw | SECURITY_ADMIN | MEDIO | 8 |
| `UC-07-03` | Registrar objeción y (opcional) materializar restricción (include UC-07-07) | POST /consent/patient-objections | SECURITY_ADMIN | MEDIO | 4 |
| `UC-07-04` | Otorgar autorización HIPAA de divulgación | POST /consent/hipaa-authorizations | SECURITY_ADMIN | MEDIO | 2 |
| `UC-07-05` | Revocar autorización HIPAA | POST /consent/hipaa-authorizations/{id}/revoke | SECURITY_ADMIN | MEDIO | 3 |
| `UC-07-06` | Establecer/versionar base legal (supersede la anterior) | POST /consent/processing-legal-bases | SECURITY_ADMIN | MEDIO | 3 |
| `UC-07-07` | Aplicar restricción de privacidad que afecta RLS clínico | POST /consent/privacy-restrictions | SECURITY_ADMIN | MEDIO | 2 |
| `UC-07-08` | Capturar consentimiento informado de tratamiento | POST /consent/treatment-informed-consents | SECURITY_ADMIN | MEDIO | 2 |
| `UC-07-09` | Actualizar provisiones granulares (soft-close + insert) | PATCH /consent/consents/{id}/provisions | SECURITY_ADMIN | MEDIO | 5 |
| `UC-07-10` | Registrar evidencia inmutable (append-only) | POST /consent/consent-evidence | SECURITY_ADMIN | MEDIO | 1 |
| `UC-07-11` | Barrido de expiraciones (worker) | POST /consent/internal/expiration-sweep | SYSTEM · SECURITY_ADMIN | MEDIO | 7 |
| `UC-07-12` | Resolver objeción (upheld/rejected) | POST /consent/patient-objections/{id}/resolve | SECURITY_ADMIN | MEDIO | 5 |
| `ctrl:ConsentMeController` | Operaciones de ConsentMeController que el README no asigna a un caso de uso | GET /consent/me/consents | PATIENT | BAJO | 4 |
|  |  | POST /consent/me/consents/{id}/withdraw | PATIENT | MEDIO | 10 |
|  |  | GET /consent/me/hipaa-authorizations | PATIENT | BAJO | 4 |
|  |  | GET /consent/me/objections | PATIENT | BAJO | 4 |
|  |  | GET /consent/me/treatment-informed-consents | PATIENT | BAJO | 3 |
| `ctrl:EncounterInformedConsentsController` | Operaciones de EncounterInformedConsentsController que el README no asigna a un caso de uso | GET /consent/encounters/{encounterId}/informed-consent | CLINICIAN · PRACTITIONER | BAJO | 20 |
|  |  | POST /consent/encounters/{encounterId}/informed-consent | CLINICIAN · PRACTITIONER | MEDIO | 19 |
| `ctrl:PractitionerAccessRequestsController` | Operaciones de PractitionerAccessRequestsController que el README no asigna a un caso de uso | POST /consent/practitioner-access-requests | PRACTITIONER · CLINICIAN | MEDIO | 19 |
|  |  | POST /consent/practitioner-access-requests/{id}/decision | PATIENT | MEDIO | 23 |
|  |  | GET /consent/practitioner-access-requests/mine | PATIENT | BAJO | 4 |

### Diagrama 1 de 2 — etapas `UC-07-01`, `UC-07-02`, `UC-07-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a25(["SYSTEM · SECURITY_ADMIN"]):::actor
  a29(["PATIENT"]):::actor
  a39(["CLINICIAN · PRACTITIONER"]):::actor
  t3[("consent.consent_events")]:::tabla
  t4[("consent.consent_provisions")]:::tabla
  t5[("consent.consents")]:::tabla
  t7[("audit.audit_log")]:::tabla
  t8[("authz.clinical_access_grants")]:::tabla
  t11[("consent.patient_objections")]:::tabla
  t12[("consent.privacy_restrictions")]:::tabla
  t14[("consent.hipaa_authorizations")]:::tabla
  t17[("consent.processing_legal_bases")]:::tabla
  t20[("consent.treatment_informed_consents")]:::tabla
  t23[("consent.consent_evidence")]:::tabla
  t30[("consent.processing_purposes")]:::tabla
  t31[("profiles.patient_profiles")]:::tabla
  t32[("profiles.person_account_links")]:::tabla
  t40[("authz.access_policies")]:::tabla
  t41[("authz.care_relationships")]:::tabla
  t42[("authz.field_permissions")]:::tabla
  t43[("authz.patient_legal_representations")]:::tabla
  t44[("authz.permissions")]:::tabla
  subgraph s0["UC-07-01 · Capturar consentimiento de directiva de privacidad (+ provisiones +…"]
    o1["POST /consent/consents"]:::op
  end
  t9[("+2 tablas más")]
  subgraph s1["UC-07-02 · Retirar consentimiento y disparar re-evaluación de accesos"]
    o6["POST /consent/consents/{id}/withdraw"]:::op
  end
  subgraph s2["UC-07-03 · Registrar objeción y (opcional) materializar restricción (include UC…"]
    o10["POST /consent/patient-objections"]:::op
  end
  subgraph s3["UC-07-04 · Otorgar autorización HIPAA de divulgación"]
    o13["POST /consent/hipaa-authorizations"]:::op
  end
  subgraph s4["UC-07-05 · Revocar autorización HIPAA"]
    o15["POST /consent/hipaa-authorizations/{id}/revoke"]:::op
  end
  subgraph s5["UC-07-06 · Establecer/versionar base legal (supersede la anterior)"]
    o16["POST /consent/processing-legal-bases"]:::op
  end
  subgraph s6["UC-07-07 · Aplicar restricción de privacidad que afecta RLS clínico"]
    o18["POST /consent/privacy-restrictions"]:::op
  end
  subgraph s7["UC-07-08 · Capturar consentimiento informado de tratamiento"]
    o19["POST /consent/treatment-informed-consents"]:::op
  end
  subgraph s8["UC-07-09 · Actualizar provisiones granulares (soft-close + insert)"]
    o21["PATCH /consent/consents/{id}/provisions"]:::op
  end
  subgraph s9["UC-07-10 · Registrar evidencia inmutable (append-only)"]
    o22["POST /consent/consent-evidence"]:::op
  end
  t26[("+1 tablas más")]
  subgraph s10["UC-07-11 · Barrido de expiraciones (worker)"]
    o24["POST /consent/internal/expiration-sweep"]:::op
  end
  subgraph s11["UC-07-12 · Resolver objeción (upheld/rejected)"]
    o27["POST /consent/patient-objections/{id}/resolve"]:::op
  end
  t34[("+4 tablas más")]
  subgraph s12["ctrl:ConsentMeController · Operaciones de ConsentMeController que el README no…"]
    o28["GET /consent/me/consents"]:::op
    o33["POST /consent/me/consents/{id}/withdraw"]:::op
    o35["GET /consent/me/hipaa-authorizations"]:::op
    o36["GET /consent/me/objections"]:::op
    o37["GET /consent/me/treatment-informed-consents"]:::op
  end
  t45[("+14 tablas más")]
  t47[("+13 tablas más")]
  subgraph s13["ctrl:EncounterInformedConsentsController · Operaciones de EncounterInformedCons…"]
    o38["GET /consent/encounters/{encounterId}/informed-consent"]:::op
    o46["POST /consent/encounters/{encounterId}/informed-consent"]:::op
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
  o13 -->|"CREA"| t14
  a2 --> o15
  o15 -->|"CREA"| t3
  o15 -->|"ACTUALIZA"| t14
  o15 -->|"LEE"| t14
  a2 --> o16
  o16 -->|"ACTUALIZA"| t17
  o16 -->|"CREA"| t17
  o16 -->|"LEE"| t17
  a2 --> o18
  o18 -->|"CREA"| t3
  o18 -->|"CREA"| t12
  a2 --> o19
  o19 -->|"CREA"| t3
  o19 -->|"CREA"| t20
  a2 --> o21
  o21 -->|"CREA"| t3
  o21 -->|"ACTUALIZA"| t4
  o21 -->|"CREA"| t4
  o21 -->|"LEE"| t4
  o21 -->|"LEE"| t5
  a2 --> o22
  o22 -->|"CREA"| t23
  a25 --> o24
  o24 -->|"CREA"| t3
  o24 -->|"ACTUALIZA"| t5
  o24 -->|"LEE"| t5
  o24 -->|"ACTUALIZA"| t14
  o24 -->|"LEE"| t14
  o24 -->|"ACTUALIZA"| t12
  o24 -.-> t26
  a2 --> o27
  o27 -->|"CREA"| t3
  o27 -->|"ACTUALIZA"| t11
  o27 -->|"LEE"| t11
  o27 -->|"ACTUALIZA"| t12
  o27 -->|"LEE"| t12
  a29 --> o28
  o28 -->|"LEE"| t5
  o28 -->|"LEE"| t30
  o28 -->|"LEE"| t31
  o28 -->|"LEE"| t32
  a29 --> o33
  o33 -->|"CREA"| t7
  o33 -->|"LEE"| t7
  o33 -->|"ACTUALIZA"| t8
  o33 -->|"LEE"| t8
  o33 -->|"CREA"| t3
  o33 -->|"ACTUALIZA"| t5
  o33 -.-> t34
  a29 --> o35
  o35 -->|"LEE"| t14
  o35 -->|"LEE"| t30
  o35 -->|"LEE"| t31
  o35 -->|"LEE"| t32
  a29 --> o36
  o36 -->|"LEE"| t11
  o36 -->|"LEE"| t30
  o36 -->|"LEE"| t31
  o36 -->|"LEE"| t32
  a29 --> o37
  o37 -->|"LEE"| t20
  o37 -->|"LEE"| t31
  o37 -->|"LEE"| t32
  a39 --> o38
  o38 -->|"LEE"| t40
  o38 -->|"LEE"| t41
  o38 -->|"LEE"| t8
  o38 -->|"LEE"| t42
  o38 -->|"LEE"| t43
  o38 -->|"LEE"| t44
  o38 -.-> t45
  a39 --> o46
  o46 -->|"LEE"| t40
  o46 -->|"LEE"| t41
  o46 -->|"LEE"| t8
  o46 -->|"LEE"| t42
  o46 -->|"LEE"| t43
  o46 -->|"LEE"| t44
  o46 -.-> t47
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:PractitionerAccessRequestsController`

```mermaid
flowchart LR
  a2(["PRACTITIONER · CLINICIAN"]):::actor
  a9(["PATIENT"]):::actor
  t3[("audit.audit_log")]:::tabla
  t4[("consent.consent_events")]:::tabla
  t5[("consent.consent_provisions")]:::tabla
  t6[("consent.consents")]:::tabla
  t10[("authz.clinical_access_grants")]:::tabla
  t13[("profiles.patient_profiles")]:::tabla
  t14[("profiles.person_account_links")]:::tabla
  t7[("+13 tablas más")]
  t11[("+17 tablas más")]
  subgraph s0["ctrl:PractitionerAccessRequestsController · Operaciones de PractitionerAccessRe…"]
    o1["POST /consent/practitioner-access-requests"]:::op
    o8["POST /consent/practitioner-access-requests/{id}/decision"]:::op
    o12["GET /consent/practitioner-access-requests/mine"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  o1 -->|"CREA"| t6
  o1 -->|"LEE"| t6
  o1 -.-> t7
  a9 --> o8
  o8 -->|"CREA"| t3
  o8 -->|"LEE"| t3
  o8 -->|"CREA"| t10
  o8 -->|"LEE"| t10
  o8 -->|"CREA"| t4
  o8 -->|"ACTUALIZA"| t5
  o8 -.-> t11
  a9 --> o12
  o12 -->|"LEE"| t5
  o12 -->|"LEE"| t6
  o12 -->|"LEE"| t13
  o12 -->|"LEE"| t14
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

#### 1. POST /consent/consents

Capturar consentimiento de directiva de privacidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un consentimiento activo para este propósito |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ConsentsService.capture"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ConsentsRepository.findActiveByPurpose"]:::llamada
  n4 --> n5
  n6[("LEE consent.consents")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un consentimiento activo para este propósito"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ConsentsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA consent.consents")]:::efecto
  n9 --> n10
  n11["Repite: por cada const provision de dto.provisions ?? []"]:::bucle
  n10 --> n11
  n12["Llama a ConsentsService.createProvision"]:::llamada
  n11 -->|"cada elemento"| n12
  n13["Llama a ConsentProvisionsRepository.create"]:::llamada
  n12 --> n13
  n14[("CREA consent.consent_provisions")]:::efecto
  n13 --> n14
  n15["Llama a ConsentEventsRepository.record"]:::llamada
  n14 --> n15
  n11 -->|"al terminar"| n15
  n16[("CREA consent.consent_events")]:::efecto
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

#### 2. PATCH /consent/consents/{id}/provisions

Actualizar provisiones granulares (data class / actor / acción)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 409 | `CONFLICT` | ConflictException: El consentimiento no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ConsentsService.amendProvisions"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ConsentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE consent.consents")]:::efecto
  n5 --> n6
  n7{"!consent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Consentimiento no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"consent.statusConceptId !== CONS.CONSENT_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT El consentimiento no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ConsentProvisionsRepository.findOpenByConsent"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE consent.consent_provisions")]:::efecto
  n11 --> n12
  n13["Repite: por cada const prov de open"]:::bucle
  n12 --> n13
  n14[("ACTUALIZA consent.consent_provisions")]:::efecto
  n13 -->|"cada elemento"| n14
  n15["Repite: por cada const provision de dto.provisions"]:::bucle
  n14 --> n15
  n13 -->|"al terminar"| n15
  n16["Llama a ConsentsService.createProvision"]:::llamada
  n15 -->|"cada elemento"| n16
  n17["Llama a ConsentProvisionsRepository.create"]:::llamada
  n16 --> n17
  n18[("CREA consent.consent_provisions")]:::efecto
  n17 --> n18
  n19["Llama a ConsentEventsRepository.record"]:::llamada
  n18 --> n19
  n15 -->|"al terminar"| n19
  n20[("CREA consent.consent_events")]:::efecto
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

#### 3. POST /consent/consents/{id}/withdraw

Revocar/retirar consentimiento y disparar re-evaluación de accesos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 409 | `CONFLICT` | ConflictException: El consentimiento no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ConsentsService.withdraw"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ConsentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE consent.consents")]:::efecto
  n5 --> n6
  n7{"!consent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Consentimiento no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"consent.statusConceptId !== CONS.CONSENT_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT El consentimiento no está activo"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA consent.consents · ACTUALIZA consent.consents · ACTUALIZA consent.consents · ACTUALIZA consent.cons…")]:::efecto
  n9 -->|"no"| n11
  n12["Llama a ConsentEventsRepository.record"]:::llamada
  n11 --> n12
  n13[("CREA consent.consent_events")]:::efecto
  n12 --> n13
  n14["Llama a ClinicalAccessGrantsRepository.revokeForConsent"]:::llamada
  n13 --> n14
  n15["Llama a ClinicalAccessGrantsRepository.findActiveByConsent"]:::llamada
  n14 --> n15
  n16[("LEE authz.clinical_access_grants")]:::efecto
  n15 --> n16
  n17["Repite: por cada const grant de grants"]:::bucle
  n16 --> n17
  n18[("ACTUALIZA authz.clinical_access_grants · ACTUALIZA authz.clinical_access_grants")]:::efecto
  n17 -->|"cada elemento"| n18
  n19["Llama a AuditTrailService.record"]:::llamada
  n18 --> n19
  n17 -->|"al terminar"| n19
  n20["Llama a AuditLogRepository.append"]:::llamada
  n19 --> n20
  n21["Llama a AuditLogRepository.findChainTip"]:::llamada
  n20 --> n21
  n22[("LEE audit.audit_log")]:::efecto
  n21 --> n22
  n23[("CREA audit.audit_log")]:::efecto
  n22 --> n23
  n24(("200 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /consent/encounters/{encounterId}/informed-consent

Consentimientos informados registrados en el encuentro

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a EncounterInformedConsentsService.listForEncounter"]:::llamada
  n2 --> n3
  n4["Llama a EncountersRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE clinical.encounters")]:::efecto
  n4 --> n5
  n6{"!encounter"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Encuentro no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a ClinicalReadService.assertCanReadHistory"]:::llamada
  n6 -->|"no"| n8
  n9{"!actor.roles.some((role) =› ROLES_THAT_ATTEND.includes(role))"}:::decision
  n8 --> n9
  n10["Llama a ClinicalReadService.assertOwnRecord"]:::llamada
  n9 -->|"sí"| n10
  n11["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n10 --> n11
  n12[("LEE profiles.person_account_links")]:::efecto
  n11 --> n12
  n13["Llama a PatientProfilesRepository.findById"]:::llamada
  n12 --> n13
  n14[("LEE profiles.patient_profiles")]:::efecto
  n13 --> n14
  n15{"!link || !profile || profile.profileId !== link.personId"}:::decision
  n14 --> n15
  n16(["403 FORBIDDEN {WITHOUT_ACCESS_TO_HISTORY}"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n15 -->|"no"| n17
  n9 -->|"no"| n17
  n18[("LEE profiles.person_account_links")]:::efecto
  n17 --> n18
  n19["Llama a HealthPractitionerProfilesRepository.findById"]:::llamada
  n18 --> n19
  n20[("LEE profiles.health_practitioner_profiles")]:::efecto
  n19 --> n20
  n21["Llama a ClinicalReadService.isAttending"]:::llamada
  n20 --> n21
  n22["Llama a SchedulingBookingsRepository.hasConsultationInProgress"]:::llamada
  n21 --> n22
  n23[("LEE scheduling.appointment_bookings · LEE scheduling.schedulable_resources")]:::efecto
  n22 --> n23
  n24["Llama a ClinicalReadService.assertOwnRecord"]:::llamada
  n23 --> n24
  n25["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n24 --> n25
  n26[("LEE profiles.person_account_links")]:::efecto
  n25 --> n26
  n27["Llama a PatientProfilesRepository.findById"]:::llamada
  n26 --> n27
  n28[("LEE profiles.patient_profiles")]:::efecto
  n27 --> n28
  n29{"!link || !profile || profile.profileId !== link.personId"}:::decision
  n28 --> n29
  n30(["403 FORBIDDEN {WITHOUT_ACCESS_TO_HISTORY}"]):::error
  n29 -->|"sí"| n30
  n31[("LEE consent.treatment_informed_consents")]:::efecto
  n29 -->|"no"| n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /consent/encounters/{encounterId}/informed-consent

Registrar el consentimiento informado del encuentro

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EncounterInformedConsentsService.register"]:::llamada
  n2 --> n3
  n4["Llama a EncountersRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE clinical.encounters")]:::efecto
  n4 --> n5
  n6{"!encounter"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Encuentro no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a ClinicalReadService.assertCanWriteHistory"]:::llamada
  n6 -->|"no"| n8
  n9{"actor.roles.some((role) =› ROLES_THAT_ATTEND.includes(role))"}:::decision
  n8 --> n9
  n10["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE profiles.person_account_links")]:::efecto
  n10 --> n11
  n12["Llama a HealthPractitionerProfilesRepository.findById"]:::llamada
  n11 --> n12
  n13[("LEE profiles.health_practitioner_profiles")]:::efecto
  n12 --> n13
  n14["Llama a ClinicalReadService.isAttending"]:::llamada
  n13 --> n14
  n15["Llama a SchedulingBookingsRepository.hasConsultationInProgress"]:::llamada
  n14 --> n15
  n16[("LEE scheduling.appointment_bookings · LEE scheduling.schedulable_resources")]:::efecto
  n15 --> n16
  n17(["403 FORBIDDEN {WITHOUT_ACCESS_TO_HISTORY}"]):::error
  n16 --> n17
  n9 -->|"no"| n17
  n18["Llama a TreatmentInformedConsentsService.sign"]:::llamada
  n19["Transacción: transactional(…)"]:::transaccion
  n18 --> n19
  n20["Llama a TreatmentInformedConsentsRepository.create"]:::llamada
  n19 --> n20
  n21[("CREA consent.treatment_informed_consents")]:::efecto
  n20 --> n21
  n22["Llama a ConsentEventsRepository.record"]:::llamada
  n21 --> n22
  n23[("CREA consent.consent_events")]:::efecto
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

#### 6. POST /consent/hipaa-authorizations

Otorgar autorización HIPAA de divulgación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: expiresAt es obligatorio cuando expirationType=DATE; PreconditionFailedException: expirationEventText es obligatorio cuando expirationType=EVENT |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a HipaaAuthorizationsService.grant"]:::llamada
  n2 --> n3
  n4{"dto.expirationType === 'DATE' && !dto.expiresAt"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED expiresAt es obligatorio cuando expirationType=DATE"]):::error
  n4 -->|"sí"| n5
  n6{"dto.expirationType === 'EVENT' && !dto.expirationEventText"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED expirationEventText es obligatorio cuando expirationType=EVENT"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9["Llama a HipaaAuthorizationsRepository.create"]:::llamada
  n8 --> n9
  n10[("CREA consent.hipaa_authorizations")]:::efecto
  n9 --> n10
  n11["Llama a ConsentEventsRepository.record"]:::llamada
  n10 --> n11
  n12[("CREA consent.consent_events")]:::efecto
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

#### 7. POST /consent/hipaa-authorizations/{id}/revoke

Revocar autorización HIPAA

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Autorización HIPAA no encontrada |
| 409 | `CONFLICT` | ConflictException: La autorización no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a HipaaAuthorizationsService.revoke"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a HipaaAuthorizationsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE consent.hipaa_authorizations")]:::efecto
  n5 --> n6
  n7{"!auth"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Autorización HIPAA no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"auth.statusConceptId !== CONS.HIPAA_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La autorización no está activa"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA consent.hipaa_authorizations · ACTUALIZA consent.hipaa_authorizations")]:::efecto
  n9 -->|"no"| n11
  n12["Llama a ConsentEventsRepository.record"]:::llamada
  n11 --> n12
  n13[("CREA consent.consent_events")]:::efecto
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

#### 8. POST /consent/internal/expiration-sweep

Expirar consentimientos y autorizaciones vencidas (barrido)

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
  n3["Llama a ConsentSweepService.sweep"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ConsentsRepository.findExpirable"]:::llamada
  n4 --> n5
  n6[("LEE consent.consents")]:::efecto
  n5 --> n6
  n7["Repite: por cada const consent de consents"]:::bucle
  n6 --> n7
  n8[("ACTUALIZA consent.consents")]:::efecto
  n7 -->|"cada elemento"| n8
  n9["Llama a ConsentEventsRepository.record"]:::llamada
  n8 --> n9
  n10[("CREA consent.consent_events")]:::efecto
  n9 --> n10
  n11["Llama a HipaaAuthorizationsRepository.findExpirable"]:::llamada
  n10 --> n11
  n7 -->|"al terminar"| n11
  n12[("LEE consent.hipaa_authorizations")]:::efecto
  n11 --> n12
  n13["Repite: por cada const auth de auths"]:::bucle
  n12 --> n13
  n14[("ACTUALIZA consent.hipaa_authorizations")]:::efecto
  n13 -->|"cada elemento"| n14
  n15["Llama a ConsentEventsRepository.record"]:::llamada
  n14 --> n15
  n16[("CREA consent.consent_events")]:::efecto
  n15 --> n16
  n17["Llama a PrivacyRestrictionsRepository.findExpirable"]:::llamada
  n16 --> n17
  n13 -->|"al terminar"| n17
  n18[("LEE consent.privacy_restrictions")]:::efecto
  n17 --> n18
  n19["Repite: por cada const restriction de restrictions"]:::bucle
  n18 --> n19
  n20[("ACTUALIZA consent.privacy_restrictions")]:::efecto
  n19 -->|"cada elemento"| n20
  n21["Llama a ConsentEventsRepository.record"]:::llamada
  n20 --> n21
  n22[("CREA consent.consent_events")]:::efecto
  n21 --> n22
  n23(("200 Responde con éxito")):::ok
  n22 --> n23
  n19 -->|"al terminar"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /consent/me/consents/{id}/withdraw

Retirar uno de mis consentimientos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 409 | `CONFLICT` | ConflictException: El consentimiento no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ConsentMeService.withdrawOwn"]:::llamada
  n2 --> n3
  n4["Llama a ConsentMeService.ownPatientProfileId"]:::llamada
  n3 --> n4
  n5["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n4 --> n5
  n6[("LEE profiles.person_account_links")]:::efecto
  n5 --> n6
  n7["Llama a PatientProfilesRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE profiles.patient_profiles")]:::efecto
  n7 --> n8
  n9[("LEE consent.consents")]:::efecto
  n8 --> n9
  n10{"!consent || consent.categoryConceptId === CONS.CATEGORY_PRACTITIONER_ACCESS"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Consentimiento no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a ConsentsService.withdraw"]:::llamada
  n10 -->|"no"| n12
  n13["Transacción: transactional(…)"]:::transaccion
  n12 --> n13
  n14["Llama a ConsentsRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE consent.consents")]:::efecto
  n14 --> n15
  n16{"!consent"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Consentimiento no encontrado"]):::error
  n16 -->|"sí"| n17
  n18{"consent.statusConceptId !== CONS.CONSENT_ACTIVE"}:::decision
  n16 -->|"no"| n18
  n19(["409 CONFLICT El consentimiento no está activo"]):::error
  n18 -->|"sí"| n19
  n20[("ACTUALIZA consent.consents · ACTUALIZA consent.consents · ACTUALIZA consent.consents · ACTUALIZA consent.cons…")]:::efecto
  n18 -->|"no"| n20
  n21["Llama a ConsentEventsRepository.record"]:::llamada
  n20 --> n21
  n22[("CREA consent.consent_events")]:::efecto
  n21 --> n22
  n23["Llama a ClinicalAccessGrantsRepository.revokeForConsent"]:::llamada
  n22 --> n23
  n24["Llama a ClinicalAccessGrantsRepository.findActiveByConsent"]:::llamada
  n23 --> n24
  n25[("LEE authz.clinical_access_grants")]:::efecto
  n24 --> n25
  n26["Repite: por cada const grant de grants"]:::bucle
  n25 --> n26
  n27[("ACTUALIZA authz.clinical_access_grants · ACTUALIZA authz.clinical_access_grants")]:::efecto
  n26 -->|"cada elemento"| n27
  n28["Llama a AuditTrailService.record"]:::llamada
  n27 --> n28
  n26 -->|"al terminar"| n28
  n29["Llama a AuditLogRepository.append"]:::llamada
  n28 --> n29
  n30[("CREA audit.audit_log")]:::efecto
  n29 --> n30
  n31(("200 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /consent/patient-objections

Registrar objeción del paciente y materializar restricción

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una objeción abierta para este propósito |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PatientObjectionsService.raise"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PatientObjectionsRepository.findOpenByPurpose"]:::llamada
  n4 --> n5
  n6[("LEE consent.patient_objections")]:::efecto
  n5 --> n6
  n7{"open"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una objeción abierta para este propósito"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PatientObjectionsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA consent.patient_objections")]:::efecto
  n9 --> n10
  n11{"dto.applyRestriction"}:::decision
  n10 --> n11
  n12["Llama a PrivacyRestrictionsRepository.create"]:::llamada
  n11 -->|"sí"| n12
  n13[("CREA consent.privacy_restrictions")]:::efecto
  n12 --> n13
  n14["Llama a ConsentEventsRepository.record"]:::llamada
  n13 --> n14
  n15[("CREA consent.consent_events")]:::efecto
  n14 --> n15
  n16["Llama a ConsentEventsRepository.record"]:::llamada
  n15 --> n16
  n11 -->|"no"| n16
  n17[("CREA consent.consent_events")]:::efecto
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

#### 11. POST /consent/patient-objections/{id}/resolve

Resolver objeción del paciente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeción no encontrada |
| 409 | `CONFLICT` | ConflictException: La objeción no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PatientObjectionsService.resolve"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a PatientObjectionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE consent.patient_objections")]:::efecto
  n5 --> n6
  n7{"!objection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeción no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"objection.statusConceptId !== CONS.OBJECTION_STATUS_RAISED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La objeción no está abierta"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA consent.patient_objections · ACTUALIZA consent.patient_objections · ACTUALIZA consent.patient_objec…")]:::efecto
  n9 -->|"no"| n11
  n12{"dto.resolution === 'REJECTED'"}:::decision
  n11 --> n12
  n13["Llama a PrivacyRestrictionsRepository.findActiveByPatient"]:::llamada
  n12 -->|"sí"| n13
  n14[("LEE consent.privacy_restrictions")]:::efecto
  n13 --> n14
  n15["Repite: por cada const restriction de active"]:::bucle
  n14 --> n15
  n16[("ACTUALIZA consent.privacy_restrictions · ACTUALIZA consent.privacy_restrictions")]:::efecto
  n15 -->|"cada elemento"| n16
  n17["Llama a ConsentEventsRepository.record"]:::llamada
  n16 --> n17
  n15 -->|"al terminar"| n17
  n12 -->|"no"| n17
  n18[("CREA consent.consent_events")]:::efecto
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

#### 12. POST /consent/practitioner-access-requests

Pedir acceso al expediente de un paciente encontrado en la búsqueda

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Solicitud de notificación no encontrada; ResourceNotFoundException: El proveedor configurado para el canal no existe |
| 409 | `CONFLICT` | ConflictException: Ya existe una solicitud pendiente o un vínculo activo con este paciente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal; PreconditionFailedException: La notificación está suprimida; PreconditionFailedException: La notificación ya no admite intentos; PreconditionFailedException: El canal no tiene configuración de proveedor activa; PreconditionFailedException: Una notificación in-app necesita destinatario interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PractitionerAccessRequestsService.request"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ConsentsRepository.findByPatientCreatorCategory"]:::llamada
  n4 --> n5
  n6[("LEE consent.consents")]:::efecto
  n5 --> n6
  n7{"inCourse"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una solicitud pendiente o un vínculo activo con este paciente"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ConsentsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA consent.consents")]:::efecto
  n9 --> n10
  n11["Repite: por cada const specialtyId de dto.specialtyConceptIds"]:::bucle
  n10 --> n11
  n12["Llama a ConsentProvisionsRepository.create"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("CREA consent.consent_provisions")]:::efecto
  n12 --> n13
  n14["Llama a ConsentEventsRepository.record"]:::llamada
  n13 --> n14
  n11 -->|"al terminar"| n14
  n15[("CREA consent.consent_events")]:::efecto
  n14 --> n15
  n16["Llama a AuditTrailService.record"]:::llamada
  n15 --> n16
  n17["Llama a AuditLogRepository.append"]:::llamada
  n16 --> n17
  n18["Llama a AuditLogRepository.findChainTip"]:::llamada
  n17 --> n18
  n19[("LEE audit.audit_log")]:::efecto
  n18 --> n19
  n20[("CREA audit.audit_log")]:::efecto
  n19 --> n20
  n21["Llama a PractitionerAccessRequestsService.resolveUserIdForPatient"]:::llamada
  n20 --> n21
  n22["Llama a PersonAccountLinksRepository.findActiveByPerson"]:::llamada
  n21 --> n22
  n23[("LEE profiles.person_account_links")]:::efecto
  n22 --> n23
  n24{"patientUserId"}:::decision
  n23 --> n24
  n25["Llama a MessagingPractitionerAccessNoticeAdapter.emit"]:::llamada
  n24 -->|"sí"| n25
  n26["Intenta"]:::intento
  n25 --> n26
  n27["Llama a MessagingPractitionerAccessNoticeAdapter.issue"]:::llamada
  n26 --> n27
  n28["Llama a NotificationsService.createRequest"]:::llamada
  n27 --> n28
  n29{"!dto.recipientUserId && !dto.recipientAddress"}:::decision
  n28 --> n29
  n30(["422 PRECONDITION_FAILED La notificación necesita destinatario interno o dirección de destino"]):::error
  n29 -->|"sí"| n30
  n31["Transacción: transactional(…)"]:::transaccion
  n29 -->|"no"| n31
  n32{"!channel"}:::decision
  n31 --> n32
  n33(["404 NOT_FOUND Canal no encontrado"]):::error
  n32 -->|"sí"| n33
  n34{"channel.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n32 -->|"no"| n34
  n35(["422 PRECONDITION_FAILED El canal no está activo"]):::error
  n34 -->|"sí"| n35
  n36{"dto.templateId"}:::decision
  n34 -->|"no"| n36
  n37{"!template"}:::decision
  n36 -->|"sí"| n37
  n38(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n37 -->|"sí"| n38
  n39{"template.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n37 -->|"no"| n39
  n40(["422 PRECONDITION_FAILED La plantilla no está publicada"]):::error
  n39 -->|"sí"| n40
  n41{"template.channelId !== dto.channelId"}:::decision
  n39 -->|"no"| n41
  n42(["422 PRECONDITION_FAILED La plantilla es de otro canal"]):::error
  n41 -->|"sí"| n42
  n43["Llama a NotificationsService.deliverNotification"]:::llamada
  n41 -->|"no"| n43
  n36 -->|"no"| n43
  n44["Transacción: transactional(…)"]:::transaccion
  n43 --> n44
  n45{"!request"}:::decision
  n44 --> n45
  n46(["404 NOT_FOUND Solicitud de notificación no encontrada"]):::error
  n45 -->|"sí"| n46
  n47{"request.statusConceptId === CONCEPTS.NOTIF_SUPPRESSED"}:::decision
  n45 -->|"no"| n47
  n48(["422 PRECONDITION_FAILED La notificación está suprimida"]):::error
  n47 -->|"sí"| n48
  n49{"request.statusConceptId !== CONCEPTS.NOTIF_PENDING && request.statusConceptId !== CONCEPTS.NOTIF_SENDING"}:::decision
  n47 -->|"no"| n49
  n50(["422 PRECONDITION_FAILED La notificación ya no admite intentos"]):::error
  n49 -->|"sí"| n50
  n51{"!config"}:::decision
  n49 -->|"no"| n51
  n52(["422 PRECONDITION_FAILED El canal no tiene configuración de proveedor activa"]):::error
  n51 -->|"sí"| n52
  n53{"!provider"}:::decision
  n51 -->|"no"| n53
  n54(["404 NOT_FOUND El proveedor configurado para el canal no existe"]):::error
  n53 -->|"sí"| n54
  n55{"sent && channel?.channelTypeConceptId === CONCEPTS.CHANNEL_TYPE_IN_APP"}:::decision
  n53 -->|"no"| n55
  n56{"!request.recipientUserId"}:::decision
  n55 -->|"sí"| n56
  n57(["422 PRECONDITION_FAILED Una notificación in-app necesita destinatario interno"]):::error
  n56 -->|"sí"| n57
  n58[("ACTUALIZA messaging.notification_requests")]:::efecto
  n56 -->|"no"| n58
  n55 -->|"no"| n58
  n59(("201 Responde con éxito")):::ok
  n58 --> n59
  n24 -->|"no"| n59
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /consent/practitioner-access-requests/{id}/decision

Aceptar (con las especialidades autorizadas) o rechazar la solicitud

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Solicitud de notificación no encontrada; ResourceNotFoundException: El proveedor configurado para el canal no existe |
| 409 | `CONFLICT` | ConflictException: Esta solicitud ya fue decidida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no tiene profesional asociado; PreconditionFailedException: Sólo se pueden autorizar especialidades que el profesional pidió; PreconditionFailedException: Aceptar exige autorizar al menos una especialidad; si no autoriza ninguna, rechace la solicitud; PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal; PreconditionFailedException: La notificación está suprimida; PreconditionFailedException: La notificación ya no admite intentos; PreconditionFailedException: El canal no tiene configuración de proveedor activa; PreconditionFailedException: Una notificación in-app necesita destinatario interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a PractitionerAccessRequestsService.decide"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ConsentsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE consent.consents")]:::efecto
  n5 --> n6
  n7{"!consent || consent.categoryConceptId !== CONS.CATEGORY_PRACTITIONER_ACCESS"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE profiles.person_account_links")]:::efecto
  n9 --> n10
  n11["Llama a PatientProfilesRepository.findById"]:::llamada
  n10 --> n11
  n12[("LEE profiles.patient_profiles")]:::efecto
  n11 --> n12
  n13{"!profile || profile.profileId !== consent.patientProfileId"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Solicitud no encontrada"]):::error
  n13 -->|"sí"| n14
  n15{"consent.statusConceptId !== CONS.ACCESS_REQUEST_PENDING"}:::decision
  n13 -->|"no"| n15
  n16(["409 CONFLICT Esta solicitud ya fue decidida"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ConsentProvisionsRepository.findOpenByConsent"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE consent.consent_provisions")]:::efecto
  n17 --> n18
  n19{"!practitionerUserId"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED La solicitud no tiene profesional asociado"]):::error
  n19 -->|"sí"| n20
  n21{"dto.decision === 'DECLINED'"}:::decision
  n19 -->|"no"| n21
  n22[("ACTUALIZA consent.consents · ACTUALIZA consent.consents · ACTUALIZA consent.consents")]:::efecto
  n21 -->|"sí"| n22
  n23["Repite: por cada const provision de requested"]:::bucle
  n22 --> n23
  n24[("ACTUALIZA consent.consent_provisions")]:::efecto
  n23 -->|"cada elemento"| n24
  n25["Llama a ConsentEventsRepository.record"]:::llamada
  n24 --> n25
  n23 -->|"al terminar"| n25
  n26[("CREA consent.consent_events")]:::efecto
  n25 --> n26
  n27["Llama a AuditTrailService.record"]:::llamada
  n26 --> n27
  n28["Llama a AuditLogRepository.append"]:::llamada
  n27 --> n28
  n29["Llama a AuditLogRepository.findChainTip"]:::llamada
  n28 --> n29
  n30[("LEE audit.audit_log")]:::efecto
  n29 --> n30
  n31[("CREA audit.audit_log")]:::efecto
  n30 --> n31
  n32{"invalid.length › 0"}:::decision
  n31 --> n32
  n21 -->|"no"| n32
  n33(["422 PRECONDITION_FAILED Sólo se pueden autorizar especialidades que el profesional pidió"]):::error
  n32 -->|"sí"| n33
  n34{"authorized.length === 0"}:::decision
  n32 -->|"no"| n34
  n35(["422 PRECONDITION_FAILED Aceptar exige autorizar al menos una especialidad; si no autoriza ninguna, rechace la…"]):::error
  n34 -->|"sí"| n35
  n36[("ACTUALIZA consent.consents · ACTUALIZA consent.consents · ACTUALIZA consent.consents · ACTUALIZA consent.cons…")]:::efecto
  n34 -->|"no"| n36
  n37["Repite: por cada const provision de requested"]:::bucle
  n36 --> n37
  n38[("ACTUALIZA consent.consent_provisions")]:::efecto
  n37 -->|"cada elemento"| n38
  n39["Llama a ConsentEventsRepository.record"]:::llamada
  n38 --> n39
  n37 -->|"al terminar"| n39
  n40[("CREA consent.consent_events")]:::efecto
  n39 --> n40
  n41["Llama a ClinicalAccessGrantsRepository.findActive"]:::llamada
  n40 --> n41
  n42[("LEE authz.clinical_access_grants")]:::efecto
  n41 --> n42
  n43{"!existing"}:::decision
  n42 --> n43
  n44["Llama a ClinicalAccessGrantsRepository.create"]:::llamada
  n43 -->|"sí"| n44
  n45[("CREA authz.clinical_access_grants")]:::efecto
  n44 --> n45
  n46["Llama a AuditTrailService.record"]:::llamada
  n45 --> n46
  n43 -->|"no"| n46
  n47["Llama a AuditLogRepository.append"]:::llamada
  n46 --> n47
  n48["Llama a AuditLogRepository.findChainTip"]:::llamada
  n47 --> n48
  n49[("LEE audit.audit_log")]:::efecto
  n48 --> n49
  n50[("CREA audit.audit_log")]:::efecto
  n49 --> n50
  n51["Llama a MessagingPractitionerAccessNoticeAdapter.emit"]:::llamada
  n50 --> n51
  n52["Intenta"]:::intento
  n51 --> n52
  n53["Llama a MessagingPractitionerAccessNoticeAdapter.issue"]:::llamada
  n52 --> n53
  n54["Llama a NotificationsService.createRequest"]:::llamada
  n53 --> n54
  n55{"!dto.recipientUserId && !dto.recipientAddress"}:::decision
  n54 --> n55
  n56(["422 PRECONDITION_FAILED La notificación necesita destinatario interno o dirección de destino"]):::error
  n55 -->|"sí"| n56
  n57["Transacción: transactional(…)"]:::transaccion
  n55 -->|"no"| n57
  n58{"!channel"}:::decision
  n57 --> n58
  n59(["404 NOT_FOUND Canal no encontrado"]):::error
  n58 -->|"sí"| n59
  n60{"channel.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n58 -->|"no"| n60
  n61(["422 PRECONDITION_FAILED El canal no está activo"]):::error
  n60 -->|"sí"| n61
  n62{"dto.templateId"}:::decision
  n60 -->|"no"| n62
  n63{"!template"}:::decision
  n62 -->|"sí"| n63
  n64(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n63 -->|"sí"| n64
  n65{"template.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n63 -->|"no"| n65
  n66(["422 PRECONDITION_FAILED La plantilla no está publicada"]):::error
  n65 -->|"sí"| n66
  n67{"template.channelId !== dto.channelId"}:::decision
  n65 -->|"no"| n67
  n68(["422 PRECONDITION_FAILED La plantilla es de otro canal"]):::error
  n67 -->|"sí"| n68
  n69["Llama a NotificationsService.deliverNotification"]:::llamada
  n67 -->|"no"| n69
  n62 -->|"no"| n69
  n70["Transacción: transactional(…)"]:::transaccion
  n69 --> n70
  n71["… el resto del árbol (14 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. GET /consent/practitioner-access-requests/mine

Mis solicitudes de vínculo pendientes de decisión

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
  n3["Llama a PractitionerAccessRequestsService.listMineAsPatient"]:::llamada
  n2 --> n3
  n4["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n3 --> n4
  n5[("LEE profiles.person_account_links")]:::efecto
  n4 --> n5
  n6["Llama a PatientProfilesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE profiles.patient_profiles")]:::efecto
  n6 --> n7
  n8["Llama a ConsentsRepository.findPendingForPatient"]:::llamada
  n7 --> n8
  n9[("LEE consent.consents")]:::efecto
  n8 --> n9
  n10["Repite: por cada const consent de pending"]:::bucle
  n9 --> n10
  n11["Llama a ConsentProvisionsRepository.findOpenByConsent"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE consent.consent_provisions")]:::efecto
  n11 --> n12
  n13(("200 Responde con éxito")):::ok
  n12 --> n13
  n10 -->|"al terminar"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /consent/processing-legal-bases

Establecer/versionar base legal de procesamiento

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
  n3["Llama a ProcessingLegalBasesService.version"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ProcessingLegalBasesRepository.findCurrentVersion"]:::llamada
  n4 --> n5
  n6[("LEE consent.processing_legal_bases")]:::efecto
  n5 --> n6
  n7{"current"}:::decision
  n6 --> n7
  n8[("ACTUALIZA consent.processing_legal_bases · ACTUALIZA consent.processing_legal_bases")]:::efecto
  n7 -->|"sí"| n8
  n9["Llama a ProcessingLegalBasesRepository.create"]:::llamada
  n8 --> n9
  n7 -->|"no"| n9
  n10[("CREA consent.processing_legal_bases")]:::efecto
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

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| POST /consent/consent-evidence | 201, 400, 401, 403, 429 | 1 |
| GET /consent/me/consents | 200, 401, 403, 429 | 4 |
| GET /consent/me/hipaa-authorizations | 200, 401, 403, 429 | 4 |
| GET /consent/me/objections | 200, 401, 403, 429 | 4 |
| GET /consent/me/treatment-informed-consents | 200, 401, 403, 429 | 3 |
| POST /consent/privacy-restrictions | 201, 400, 401, 403, 429 | 2 |
| POST /consent/treatment-informed-consents | 201, 400, 401, 403, 429 | 2 |
