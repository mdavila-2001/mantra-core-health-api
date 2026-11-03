<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `crm`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 16 (14 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [crm](../endpoints/crm.md)

## Proceso: CRM

- **Código:** `crm` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 16
- **Actores:** CRM_ADMIN · CRM_AGENT
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/crm/README.md`

### Para qué sirve

Gestiona cuentas, contactos, equipos, leads, oportunidades, actividades, alianzas, casos y preferencias de contacto mediante `CrmController` bajo `/crm`.

_Fuente: `src/modules/crm/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:CrmController` | Operaciones de CrmController que el README no asigna a un caso de uso | POST /crm/accounts | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | GET /crm/accounts/{id}/360 | CRM_ADMIN · CRM_AGENT | BAJO | 3 |
|  |  | POST /crm/accounts/{id}/team-members | CRM_ADMIN | MEDIO | 3 |
|  |  | POST /crm/activities | CRM_ADMIN · CRM_AGENT | MEDIO | 7 |
|  |  | POST /crm/cases | CRM_ADMIN · CRM_AGENT | MEDIO | 5 |
|  |  | POST /crm/cases/{id}/comments | CRM_ADMIN · CRM_AGENT | MEDIO | 2 |
|  |  | POST /crm/cases/{id}/resolve | CRM_ADMIN · CRM_AGENT | MEDIO | 2 |
|  |  | PATCH /crm/cases/{id}/status | CRM_ADMIN · CRM_AGENT | MEDIO | 2 |
|  |  | PATCH /crm/contacts/{id}/channels/{cid}/opt-in | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | POST /crm/leads | CRM_ADMIN · CRM_AGENT | MEDIO | 1 |
|  |  | POST /crm/leads/{id}/convert | CRM_ADMIN · CRM_AGENT | MEDIO | 6 |
|  |  | PATCH /crm/leads/{id}/qualify | CRM_ADMIN · CRM_AGENT | BAJO | 1 |
|  |  | POST /crm/opportunities/{id}/advance-stage | CRM_ADMIN · CRM_AGENT | MEDIO | 4 |
|  |  | POST /crm/opportunities/{id}/lose | CRM_ADMIN · CRM_AGENT | MEDIO | 2 |
|  |  | POST /crm/opportunities/{id}/win | CRM_ADMIN · CRM_AGENT | MEDIO | 2 |
|  |  | POST /crm/partnerships | CRM_ADMIN | MEDIO | 2 |

### Diagrama — etapas `ctrl:CrmController`

```mermaid
flowchart LR
  a2(["CRM_ADMIN · CRM_AGENT"]):::actor
  a10(["CRM_ADMIN"]):::actor
  t3[("crm.account_team_members")]:::tabla
  t4[("crm.contacts")]:::tabla
  t5[("crm.crm_accounts")]:::tabla
  t7[("crm.crm_activities")]:::tabla
  t8[("crm.crm_cases")]:::tabla
  t12[("crm.crm_notes")]:::tabla
  t13[("crm.crm_tasks")]:::tabla
  t16[("crm.crm_case_status_history")]:::tabla
  t18[("crm.crm_case_comments")]:::tabla
  t22[("crm.contact_channel_endpoints")]:::tabla
  t24[("crm.leads")]:::tabla
  t26[("crm.opportunities")]:::tabla
  t27[("crm.opportunity_stage_history")]:::tabla
  t28[("crm.pipeline_stages")]:::tabla
  t29[("crm.pipelines")]:::tabla
  t35[("crm.partnership_agreements")]:::tabla
  t36[("crm.partnerships")]:::tabla
  t14[("+1 tablas más")]
  subgraph s0["ctrl:CrmController · Operaciones de CrmController que el README no asigna a un…"]
    o1["POST /crm/accounts"]:::op
    o6["GET /crm/accounts/{id}/360"]:::op
    o9["POST /crm/accounts/{id}/team-members"]:::op
    o11["POST /crm/activities"]:::op
    o15["POST /crm/cases"]:::op
    o17["POST /crm/cases/{id}/comments"]:::op
    o19["POST /crm/cases/{id}/resolve"]:::op
    o20["PATCH /crm/cases/{id}/status"]:::op
    o21["PATCH /crm/contacts/{id}/channels/{cid}/opt-in"]:::op
    o23["POST /crm/leads"]:::op
    o25["POST /crm/leads/{id}/convert"]:::op
    o30["PATCH /crm/leads/{id}/qualify"]:::op
    o31["POST /crm/opportunities/{id}/advance-stage"]:::op
    o32["POST /crm/opportunities/{id}/lose"]:::op
    o33["POST /crm/opportunities/{id}/win"]:::op
    o34["POST /crm/partnerships"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  a2 --> o6
  o6 -->|"LEE"| t5
  o6 -->|"LEE"| t7
  o6 -->|"LEE"| t8
  a10 --> o9
  o9 -->|"CREA"| t3
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t5
  a2 --> o11
  o11 -->|"LEE"| t4
  o11 -->|"LEE"| t5
  o11 -->|"CREA"| t7
  o11 -->|"LEE"| t8
  o11 -->|"CREA"| t12
  o11 -->|"CREA"| t13
  o11 -.-> t14
  a2 --> o15
  o15 -->|"LEE"| t4
  o15 -->|"LEE"| t5
  o15 -->|"CREA"| t16
  o15 -->|"CREA"| t8
  o15 -->|"LEE"| t8
  a2 --> o17
  o17 -->|"CREA"| t18
  o17 -->|"LEE"| t8
  a2 --> o19
  o19 -->|"CREA"| t16
  o19 -->|"LEE"| t8
  a2 --> o20
  o20 -->|"CREA"| t16
  o20 -->|"LEE"| t8
  a2 --> o21
  o21 -->|"ACTUALIZA"| t22
  o21 -->|"LEE"| t22
  o21 -->|"LEE"| t4
  a2 --> o23
  o23 -->|"CREA"| t24
  a2 --> o25
  o25 -->|"LEE"| t5
  o25 -->|"LEE"| t24
  o25 -->|"CREA"| t26
  o25 -->|"CREA"| t27
  o25 -->|"LEE"| t28
  o25 -->|"LEE"| t29
  a2 --> o30
  o30 -->|"LEE"| t24
  a2 --> o31
  o31 -->|"LEE"| t26
  o31 -->|"CREA"| t27
  o31 -->|"LEE"| t28
  o31 -->|"LEE"| t29
  a2 --> o32
  o32 -->|"LEE"| t26
  o32 -->|"CREA"| t27
  a2 --> o33
  o33 -->|"LEE"| t26
  o33 -->|"CREA"| t27
  a10 --> o34
  o34 -->|"CREA"| t35
  o34 -->|"CREA"| t36
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /crm/accounts

Crear una cuenta con su contacto principal

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
  n3["Llama a CrmSalesService.createAccount"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmSalesRepository.createAccount"]:::llamada
  n4 --> n5
  n6[("CREA crm.crm_accounts")]:::efecto
  n5 --> n6
  n7{"dto.primaryContactFirstName"}:::decision
  n6 --> n7
  n8["Llama a CrmSalesRepository.createContact"]:::llamada
  n7 -->|"sí"| n8
  n9[("CREA crm.contacts")]:::efecto
  n8 --> n9
  n10["Llama a CrmSalesRepository.createTeamMember"]:::llamada
  n9 --> n10
  n7 -->|"no"| n10
  n11[("CREA crm.account_team_members")]:::efecto
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

#### 2. POST /crm/accounts/{id}/team-members

Sumar un usuario al equipo de la cuenta

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El usuario ya pertenece al equipo de la cuenta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmSalesService.addTeamMember"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmSalesRepository.findAccountById"]:::llamada
  n4 --> n5
  n6[("LEE crm.crm_accounts")]:::efecto
  n5 --> n6
  n7["Llama a CrmSalesRepository.findTeamMember"]:::llamada
  n6 --> n7
  n8[("LEE crm.account_team_members")]:::efecto
  n7 --> n8
  n9{"existing"}:::decision
  n8 --> n9
  n10(["409 CONFLICT El usuario ya pertenece al equipo de la cuenta"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CrmSalesRepository.createTeamMember"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA crm.account_team_members")]:::efecto
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

#### 3. POST /crm/activities

Registrar una actividad y su subtipo

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una nota requiere `bodyText` |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CrmServiceService.createActivity"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmServiceService.assertActivityReferences"]:::llamada
  n4 --> n5
  n6{"dto.crmAccountId"}:::decision
  n5 --> n6
  n7["Llama a CrmSalesRepository.findAccountById"]:::llamada
  n6 -->|"sí"| n7
  n8[("LEE crm.crm_accounts")]:::efecto
  n7 --> n8
  n9{"dto.contactId"}:::decision
  n8 --> n9
  n6 -->|"no"| n9
  n10["Llama a CrmSalesRepository.findContactById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE crm.contacts")]:::efecto
  n10 --> n11
  n12["Llama a CrmSalesRepository.findAccountById"]:::llamada
  n11 --> n12
  n9 -->|"no"| n12
  n13[("LEE crm.crm_accounts")]:::efecto
  n12 --> n13
  n14["Llama a CrmSalesRepository.findOpportunityById"]:::llamada
  n13 --> n14
  n15[("LEE crm.opportunities")]:::efecto
  n14 --> n15
  n16["Llama a CrmServiceRepository.findCaseById"]:::llamada
  n15 --> n16
  n17[("LEE crm.crm_cases")]:::efecto
  n16 --> n17
  n18["Llama a CrmServiceRepository.createActivity"]:::llamada
  n17 --> n18
  n19[("CREA crm.crm_activities")]:::efecto
  n18 --> n19
  n20{"dto.activityType === 'TASK'"}:::decision
  n19 --> n20
  n21["Llama a CrmServiceRepository.createTask"]:::llamada
  n20 -->|"sí"| n21
  n22[("CREA crm.crm_tasks")]:::efecto
  n21 --> n22
  n23{"dto.activityType === 'NOTE'"}:::decision
  n20 -->|"no"| n23
  n24{"!dto.bodyText"}:::decision
  n23 -->|"sí"| n24
  n25(["422 PRECONDITION_FAILED Una nota requiere `bodyText`"]):::error
  n24 -->|"sí"| n25
  n26["Llama a CrmServiceRepository.createNote"]:::llamada
  n24 -->|"no"| n26
  n27[("CREA crm.crm_notes")]:::efecto
  n26 --> n27
  n28(("201 Responde con éxito")):::ok
  n22 --> n28
  n27 --> n28
  n23 -->|"no"| n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /crm/cases

Abrir un caso de servicio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un caso con ese número |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CrmServiceService.createCase"]:::llamada
  n2 --> n3
  n4["Llama a CrmServiceRepository.findCaseByNumber"]:::llamada
  n3 --> n4
  n5[("LEE crm.crm_cases")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe un caso con ese número"]):::error
  n6 -->|"sí"| n7
  n8["Transacción: transactional(…)"]:::transaccion
  n6 -->|"no"| n8
  n9{"dto.crmAccountId"}:::decision
  n8 --> n9
  n10["Llama a CrmSalesRepository.findAccountById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE crm.crm_accounts")]:::efecto
  n10 --> n11
  n12{"dto.primaryContactId"}:::decision
  n11 --> n12
  n9 -->|"no"| n12
  n13["Llama a CrmSalesRepository.findContactById"]:::llamada
  n12 -->|"sí"| n13
  n14[("LEE crm.contacts")]:::efecto
  n13 --> n14
  n15["Llama a CrmServiceRepository.createCase"]:::llamada
  n14 --> n15
  n12 -->|"no"| n15
  n16[("CREA crm.crm_cases")]:::efecto
  n15 --> n16
  n17["Llama a CrmServiceRepository.recordCaseStatusChange"]:::llamada
  n16 --> n17
  n18[("CREA crm.crm_case_status_history")]:::efecto
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

#### 5. POST /crm/cases/{id}/comments

Comentar el caso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se comenta un caso cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmServiceService.addCaseComment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmServiceRepository.findCaseByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE crm.crm_cases")]:::efecto
  n5 --> n6
  n7{"serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED No se comenta un caso cerrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CrmServiceRepository.createCaseComment"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA crm.crm_case_comments")]:::efecto
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

#### 6. POST /crm/cases/{id}/resolve

Resolver el caso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Un caso cerrado no se reabre por esta vía |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso ya está en ese estado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CrmServiceService.changeCaseStatus"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmServiceRepository.findCaseByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE crm.crm_cases")]:::efecto
  n5 --> n6
  n7{"serviceCase.statusConceptId === target"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El caso ya está en ese estado"]):::error
  n7 -->|"sí"| n8
  n9{"serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT Un caso cerrado no se reabre por esta vía"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CrmServiceRepository.recordCaseStatusChange"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA crm.crm_case_status_history")]:::efecto
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

#### 7. PATCH /crm/cases/{id}/status

Transicionar el estado del caso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Un caso cerrado no se reabre por esta vía |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso ya está en ese estado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmServiceService.changeCaseStatus"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmServiceRepository.findCaseByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE crm.crm_cases")]:::efecto
  n5 --> n6
  n7{"serviceCase.statusConceptId === target"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El caso ya está en ese estado"]):::error
  n7 -->|"sí"| n8
  n9{"serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT Un caso cerrado no se reabre por esta vía"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CrmServiceRepository.recordCaseStatusChange"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA crm.crm_case_status_history")]:::efecto
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

#### 8. PATCH /crm/contacts/{id}/channels/{cid}/opt-in

Registrar el consentimiento del canal de contacto

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El canal no pertenece a ese contacto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmServiceService.setChannelOptIn"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmSalesRepository.findContactById"]:::llamada
  n4 --> n5
  n6[("LEE crm.contacts")]:::efecto
  n5 --> n6
  n7["Llama a CrmSalesRepository.findChannelEndpointForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE crm.contact_channel_endpoints")]:::efecto
  n7 --> n8
  n9{"!endpoint"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"endpoint.tenantId && endpoint.tenantId !== tenantId"}:::decision
  n9 -->|"no"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"endpoint.contactId !== contactId"}:::decision
  n11 -->|"no"| n13
  n14["Llama a CrmSalesRepository.findContactById"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE crm.contacts")]:::efecto
  n14 --> n15
  n16{"!owner"}:::decision
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"sí"| n17
  n18(["422 PRECONDITION_FAILED El canal no pertenece a ese contacto"]):::error
  n16 -->|"no"| n18
  n19[("ACTUALIZA crm.contact_channel_endpoints")]:::efecto
  n13 -->|"no"| n19
  n20(("200 Responde con éxito")):::ok
  n19 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /crm/leads/{id}/convert

Convertir el lead en oportunidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El lead ya fue convertido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se convierte un lead calificado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmSalesService.convertLead"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmSalesRepository.findLeadByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE crm.leads")]:::efecto
  n5 --> n6
  n7{"lead.leadStatusConceptId === CONCEPTS.LEAD_CONVERTED"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El lead ya fue convertido"]):::error
  n7 -->|"sí"| n8
  n9{"lead.leadStatusConceptId !== CONCEPTS.LEAD_QUALIFIED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Solo se convierte un lead calificado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CrmSalesRepository.findPipelineById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE crm.pipelines")]:::efecto
  n11 --> n12
  n13["Llama a CrmSalesRepository.findStageById"]:::llamada
  n12 --> n13
  n14[("LEE crm.pipeline_stages · LEE crm.pipelines")]:::efecto
  n13 --> n14
  n15{"!stage"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17{"stage.pipelineId !== dto.pipelineId"}:::decision
  n15 -->|"no"| n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"sí"| n18
  n19{"dto.crmAccountId"}:::decision
  n17 -->|"no"| n19
  n20["Llama a CrmSalesRepository.findAccountById"]:::llamada
  n19 -->|"sí"| n20
  n21[("LEE crm.crm_accounts")]:::efecto
  n20 --> n21
  n22["Llama a CrmSalesRepository.createOpportunity"]:::llamada
  n21 --> n22
  n19 -->|"no"| n22
  n23[("CREA crm.opportunities")]:::efecto
  n22 --> n23
  n24["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n23 --> n24
  n25[("CREA crm.opportunity_stage_history")]:::efecto
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

#### 10. PATCH /crm/leads/{id}/qualify

Calificar o descartar el lead

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El lead ya fue convertido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmSalesService.qualifyLead"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmSalesRepository.findLeadByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE crm.leads")]:::efecto
  n5 --> n6
  n7{"lead.leadStatusConceptId === CONCEPTS.LEAD_CONVERTED"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El lead ya fue convertido"]):::error
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

#### 11. POST /crm/opportunities/{id}/advance-stage

Avanzar la oportunidad de etapa

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La oportunidad ya está cerrada; PreconditionFailedException: La oportunidad ya está en esa etapa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmSalesService.advanceStage"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmSalesRepository.findOpportunityByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE crm.opportunities")]:::efecto
  n5 --> n6
  n7{"opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La oportunidad ya está cerrada"]):::error
  n7 -->|"sí"| n8
  n9{"opportunity.stageId === dto.toStageId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La oportunidad ya está en esa etapa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CrmSalesRepository.findStageById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE crm.pipeline_stages · LEE crm.pipelines")]:::efecto
  n11 --> n12
  n13{"!stage"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15{"stage.pipelineId !== opportunity.pipelineId"}:::decision
  n13 -->|"no"| n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n15 -->|"no"| n17
  n18[("CREA crm.opportunity_stage_history")]:::efecto
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

#### 12. POST /crm/opportunities/{id}/lose

Marcar la oportunidad como perdida con su motivo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La oportunidad ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a CrmSalesService.loseOpportunity"]:::llamada
  n2 --> n3
  n4["Llama a CrmSalesService.closeOpportunity"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a CrmSalesRepository.findOpportunityByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE crm.opportunities")]:::efecto
  n6 --> n7
  n8{"opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN"}:::decision
  n7 --> n8
  n9(["409 CONFLICT La oportunidad ya está cerrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n8 -->|"no"| n10
  n11[("CREA crm.opportunity_stage_history")]:::efecto
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

#### 13. POST /crm/opportunities/{id}/win

Marcar la oportunidad como ganada

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La oportunidad ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CrmSalesService.winOpportunity"]:::llamada
  n2 --> n3
  n4["Llama a CrmSalesService.closeOpportunity"]:::llamada
  n3 --> n4
  n5["Transacción: transactional(…)"]:::transaccion
  n4 --> n5
  n6["Llama a CrmSalesRepository.findOpportunityByIdForUpdate"]:::llamada
  n5 --> n6
  n7[("LEE crm.opportunities")]:::efecto
  n6 --> n7
  n8{"opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN"}:::decision
  n7 --> n8
  n9(["409 CONFLICT La oportunidad ya está cerrada"]):::error
  n8 -->|"sí"| n9
  n10["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n8 -->|"no"| n10
  n11[("CREA crm.opportunity_stage_history")]:::efecto
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

#### 14. POST /crm/partnerships

Registrar una alianza y su acuerdo marco

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
  n3["Llama a CrmServiceService.createPartnership"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CrmServiceRepository.createPartnership"]:::llamada
  n4 --> n5
  n6[("CREA crm.partnerships")]:::efecto
  n5 --> n6
  n7{"dto.commitmentAmount"}:::decision
  n6 --> n7
  n8["Llama a CrmServiceRepository.createAgreement"]:::llamada
  n7 -->|"sí"| n8
  n9[("CREA crm.partnership_agreements")]:::efecto
  n8 --> n9
  n10(("201 Responde con éxito")):::ok
  n9 --> n10
  n7 -->|"no"| n10
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
| GET /crm/accounts/{id}/360 | 200, 400, 401, 403, 429 | 3 |
| POST /crm/leads | 201, 400, 401, 403, 429 | 1 |
