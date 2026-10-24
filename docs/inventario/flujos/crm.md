<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `crm`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 16 (15 con decisiones propias, 1 sin ellas)
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
|  |  | POST /crm/activities | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | POST /crm/cases | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | POST /crm/cases/{id}/comments | CRM_ADMIN · CRM_AGENT | MEDIO | 2 |
|  |  | POST /crm/cases/{id}/resolve | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | PATCH /crm/cases/{id}/status | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | PATCH /crm/contacts/{id}/channels/{cid}/opt-in | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | POST /crm/leads | CRM_ADMIN · CRM_AGENT | MEDIO | 1 |
|  |  | POST /crm/leads/{id}/convert | CRM_ADMIN · CRM_AGENT | MEDIO | 4 |
|  |  | PATCH /crm/leads/{id}/qualify | CRM_ADMIN · CRM_AGENT | MEDIO | 2 |
|  |  | POST /crm/opportunities/{id}/advance-stage | CRM_ADMIN · CRM_AGENT | MEDIO | 4 |
|  |  | POST /crm/opportunities/{id}/lose | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
|  |  | POST /crm/opportunities/{id}/win | CRM_ADMIN · CRM_AGENT | MEDIO | 3 |
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
  t15[("crm.crm_case_status_history")]:::tabla
  t17[("crm.crm_case_comments")]:::tabla
  t21[("crm.contact_channel_endpoints")]:::tabla
  t23[("crm.leads")]:::tabla
  t25[("crm.opportunities")]:::tabla
  t26[("crm.opportunity_stage_history")]:::tabla
  t29[("crm.pipeline_stages")]:::tabla
  t33[("crm.partnership_agreements")]:::tabla
  t34[("crm.partnerships")]:::tabla
  subgraph s0["ctrl:CrmController · Operaciones de CrmController que el README no asigna a un…"]
    o1["POST /crm/accounts"]:::op
    o6["GET /crm/accounts/{id}/360"]:::op
    o9["POST /crm/accounts/{id}/team-members"]:::op
    o11["POST /crm/activities"]:::op
    o14["POST /crm/cases"]:::op
    o16["POST /crm/cases/{id}/comments"]:::op
    o18["POST /crm/cases/{id}/resolve"]:::op
    o19["PATCH /crm/cases/{id}/status"]:::op
    o20["PATCH /crm/contacts/{id}/channels/{cid}/opt-in"]:::op
    o22["POST /crm/leads"]:::op
    o24["POST /crm/leads/{id}/convert"]:::op
    o27["PATCH /crm/leads/{id}/qualify"]:::op
    o28["POST /crm/opportunities/{id}/advance-stage"]:::op
    o30["POST /crm/opportunities/{id}/lose"]:::op
    o31["POST /crm/opportunities/{id}/win"]:::op
    o32["POST /crm/partnerships"]:::op
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
  o11 -->|"CREA"| t7
  o11 -->|"CREA"| t12
  o11 -->|"CREA"| t13
  a2 --> o14
  o14 -->|"CREA"| t15
  o14 -->|"CREA"| t8
  o14 -->|"LEE"| t8
  a2 --> o16
  o16 -->|"CREA"| t17
  o16 -->|"LEE"| t8
  a2 --> o18
  o18 -->|"CREA"| t15
  o18 -->|"ACTUALIZA"| t8
  o18 -->|"LEE"| t8
  a2 --> o19
  o19 -->|"CREA"| t15
  o19 -->|"ACTUALIZA"| t8
  o19 -->|"LEE"| t8
  a2 --> o20
  o20 -->|"ACTUALIZA"| t21
  o20 -->|"LEE"| t21
  o20 -->|"LEE"| t4
  a2 --> o22
  o22 -->|"CREA"| t23
  a2 --> o24
  o24 -->|"ACTUALIZA"| t23
  o24 -->|"LEE"| t23
  o24 -->|"CREA"| t25
  o24 -->|"CREA"| t26
  a2 --> o27
  o27 -->|"ACTUALIZA"| t23
  o27 -->|"LEE"| t23
  a2 --> o28
  o28 -->|"ACTUALIZA"| t25
  o28 -->|"LEE"| t25
  o28 -->|"CREA"| t26
  o28 -->|"LEE"| t29
  a2 --> o30
  o30 -->|"ACTUALIZA"| t25
  o30 -->|"LEE"| t25
  o30 -->|"CREA"| t26
  a2 --> o31
  o31 -->|"ACTUALIZA"| t25
  o31 -->|"LEE"| t25
  o31 -->|"CREA"| t26
  a10 --> o32
  o32 -->|"CREA"| t33
  o32 -->|"CREA"| t34
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

#### 2. GET /crm/accounts/{id}/360

Vista 360 de la cuenta

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuenta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CrmServiceService.getAccount360"]:::llamada
  n2 --> n3
  n4["Llama a CrmSalesRepository.findAccountById"]:::llamada
  n3 --> n4
  n5[("LEE crm.crm_accounts")]:::efecto
  n4 --> n5
  n6{"!account"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Cuenta no encontrada"]):::error
  n6 -->|"sí"| n7
  n8["Llama a CrmServiceRepository.findActivitiesByAccount"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE crm.crm_activities")]:::efecto
  n8 --> n9
  n10["Llama a CrmServiceRepository.findCasesByAccount"]:::llamada
  n9 --> n10
  n11[("LEE crm.crm_cases")]:::efecto
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

#### 3. POST /crm/accounts/{id}/team-members

Sumar un usuario al equipo de la cuenta

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cuenta no encontrada |
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
  n7{"!account"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Cuenta no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CrmSalesRepository.findTeamMember"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE crm.account_team_members")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El usuario ya pertenece al equipo de la cuenta"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CrmSalesRepository.createTeamMember"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA crm.account_team_members")]:::efecto
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

#### 4. POST /crm/activities

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
  n5["Llama a CrmServiceRepository.createActivity"]:::llamada
  n4 --> n5
  n6[("CREA crm.crm_activities")]:::efecto
  n5 --> n6
  n7{"dto.activityType === 'TASK'"}:::decision
  n6 --> n7
  n8["Llama a CrmServiceRepository.createTask"]:::llamada
  n7 -->|"sí"| n8
  n9[("CREA crm.crm_tasks")]:::efecto
  n8 --> n9
  n10{"dto.activityType === 'NOTE'"}:::decision
  n7 -->|"no"| n10
  n11{"!dto.bodyText"}:::decision
  n10 -->|"sí"| n11
  n12(["422 PRECONDITION_FAILED Una nota requiere `bodyText`"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CrmServiceRepository.createNote"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA crm.crm_notes")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n9 --> n15
  n14 --> n15
  n10 -->|"no"| n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /crm/cases

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
  n9["Llama a CrmServiceRepository.createCase"]:::llamada
  n8 --> n9
  n10[("CREA crm.crm_cases")]:::efecto
  n9 --> n10
  n11["Llama a CrmServiceRepository.recordCaseStatusChange"]:::llamada
  n10 --> n11
  n12[("CREA crm.crm_case_status_history")]:::efecto
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

#### 6. POST /crm/cases/{id}/comments

Comentar el caso

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso no encontrado |
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
  n7{"!serviceCase"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Caso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED No se comenta un caso cerrado"]):::error
  n9 -->|"sí"| n10
  n11["Llama a CrmServiceRepository.createCaseComment"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA crm.crm_case_comments")]:::efecto
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

#### 7. POST /crm/cases/{id}/resolve

Resolver el caso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso no encontrado |
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
  n7{"!serviceCase"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Caso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"serviceCase.statusConceptId === target"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El caso ya está en ese estado"]):::error
  n9 -->|"sí"| n10
  n11{"serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT Un caso cerrado no se reabre por esta vía"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA crm.crm_cases")]:::efecto
  n11 -->|"no"| n13
  n14{"CLOSING_STATES.includes(target)"}:::decision
  n13 --> n14
  n15[("ACTUALIZA crm.crm_cases")]:::efecto
  n14 -->|"sí"| n15
  n16["Llama a CrmServiceRepository.recordCaseStatusChange"]:::llamada
  n15 --> n16
  n14 -->|"no"| n16
  n17[("CREA crm.crm_case_status_history")]:::efecto
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

#### 8. PATCH /crm/cases/{id}/status

Transicionar el estado del caso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso no encontrado |
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
  n7{"!serviceCase"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Caso no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"serviceCase.statusConceptId === target"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El caso ya está en ese estado"]):::error
  n9 -->|"sí"| n10
  n11{"serviceCase.statusConceptId === CONCEPTS.CASE_CLOSED"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT Un caso cerrado no se reabre por esta vía"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA crm.crm_cases")]:::efecto
  n11 -->|"no"| n13
  n14{"CLOSING_STATES.includes(target)"}:::decision
  n13 --> n14
  n15[("ACTUALIZA crm.crm_cases")]:::efecto
  n14 -->|"sí"| n15
  n16["Llama a CrmServiceRepository.recordCaseStatusChange"]:::llamada
  n15 --> n16
  n14 -->|"no"| n16
  n17[("CREA crm.crm_case_status_history")]:::efecto
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

#### 9. PATCH /crm/contacts/{id}/channels/{cid}/opt-in

Registrar el consentimiento del canal de contacto

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contacto no encontrado; ResourceNotFoundException: Canal de contacto no encontrado |
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
  n7{"!contact"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Contacto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CrmSalesRepository.findChannelEndpointForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE crm.contact_channel_endpoints")]:::efecto
  n9 --> n10
  n11{"!endpoint"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Canal de contacto no encontrado"]):::error
  n11 -->|"sí"| n12
  n13{"endpoint.contactId !== contactId"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El canal no pertenece a ese contacto"]):::error
  n13 -->|"sí"| n14
  n15[("ACTUALIZA crm.contact_channel_endpoints")]:::efecto
  n13 -->|"no"| n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /crm/leads/{id}/convert

Convertir el lead en oportunidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lead no encontrado |
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
  n7{"!lead"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Lead no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"lead.leadStatusConceptId === CONCEPTS.LEAD_CONVERTED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT El lead ya fue convertido"]):::error
  n9 -->|"sí"| n10
  n11{"lead.leadStatusConceptId !== CONCEPTS.LEAD_QUALIFIED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Solo se convierte un lead calificado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CrmSalesRepository.createOpportunity"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA crm.opportunities")]:::efecto
  n13 --> n14
  n15[("ACTUALIZA crm.leads · ACTUALIZA crm.leads · ACTUALIZA crm.leads")]:::efecto
  n14 --> n15
  n16["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n15 --> n16
  n17[("CREA crm.opportunity_stage_history")]:::efecto
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

#### 11. PATCH /crm/leads/{id}/qualify

Calificar o descartar el lead

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lead no encontrado |
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
  n7{"!lead"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Lead no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"lead.leadStatusConceptId === CONCEPTS.LEAD_CONVERTED"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT El lead ya fue convertido"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA crm.leads · ACTUALIZA crm.leads")]:::efecto
  n9 -->|"no"| n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /crm/opportunities/{id}/advance-stage

Avanzar la oportunidad de etapa

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Oportunidad no encontrada; ResourceNotFoundException: Etapa no encontrada |
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
  n7{"!opportunity"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Oportunidad no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La oportunidad ya está cerrada"]):::error
  n9 -->|"sí"| n10
  n11{"opportunity.stageId === dto.toStageId"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La oportunidad ya está en esa etapa"]):::error
  n11 -->|"sí"| n12
  n13["Llama a CrmSalesRepository.findStageById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE crm.pipeline_stages")]:::efecto
  n13 --> n14
  n15{"!stage"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Etapa no encontrada"]):::error
  n15 -->|"sí"| n16
  n17[("ACTUALIZA crm.opportunities")]:::efecto
  n15 -->|"no"| n17
  n18{"stage.probabilityPercent !== undefined"}:::decision
  n17 --> n18
  n19[("ACTUALIZA crm.opportunities")]:::efecto
  n18 -->|"sí"| n19
  n20["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n19 --> n20
  n18 -->|"no"| n20
  n21[("CREA crm.opportunity_stage_history")]:::efecto
  n20 --> n21
  n22(("200 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /crm/opportunities/{id}/lose

Marcar la oportunidad como perdida con su motivo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Oportunidad no encontrada |
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
  n8{"!opportunity"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Oportunidad no encontrada"]):::error
  n8 -->|"sí"| n9
  n10{"opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN"}:::decision
  n8 -->|"no"| n10
  n11(["409 CONFLICT La oportunidad ya está cerrada"]):::error
  n10 -->|"sí"| n11
  n12[("ACTUALIZA crm.opportunities · ACTUALIZA crm.opportunities")]:::efecto
  n10 -->|"no"| n12
  n13{"won"}:::decision
  n12 --> n13
  n14[("ACTUALIZA crm.opportunities")]:::efecto
  n13 -->|"sí"| n14
  n15{"lostReasonConceptId"}:::decision
  n14 --> n15
  n13 -->|"no"| n15
  n16[("ACTUALIZA crm.opportunities")]:::efecto
  n15 -->|"sí"| n16
  n17["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n16 --> n17
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

#### 14. POST /crm/opportunities/{id}/win

Marcar la oportunidad como ganada

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Oportunidad no encontrada |
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
  n8{"!opportunity"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Oportunidad no encontrada"]):::error
  n8 -->|"sí"| n9
  n10{"opportunity.statusConceptId !== CONCEPTS.OPPORTUNITY_OPEN"}:::decision
  n8 -->|"no"| n10
  n11(["409 CONFLICT La oportunidad ya está cerrada"]):::error
  n10 -->|"sí"| n11
  n12[("ACTUALIZA crm.opportunities · ACTUALIZA crm.opportunities")]:::efecto
  n10 -->|"no"| n12
  n13{"won"}:::decision
  n12 --> n13
  n14[("ACTUALIZA crm.opportunities")]:::efecto
  n13 -->|"sí"| n14
  n15{"lostReasonConceptId"}:::decision
  n14 --> n15
  n13 -->|"no"| n15
  n16[("ACTUALIZA crm.opportunities")]:::efecto
  n15 -->|"sí"| n16
  n17["Llama a CrmSalesRepository.recordStageChange"]:::llamada
  n16 --> n17
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

#### 15. POST /crm/partnerships

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
| POST /crm/leads | 201, 400, 401, 403, 429 | 1 |
