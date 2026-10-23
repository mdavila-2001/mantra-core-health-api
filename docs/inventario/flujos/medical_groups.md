<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `medical_groups`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 8 (8 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [medical_groups](../endpoints/medical_groups.md)

## Proceso: Módulo Medical Groups — Grupos médicos (FT-21)

- **Código:** `medical_groups` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 8
- **Actores:** CLINICIAN · PRACTITIONER
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/medical_groups/README.md`

### Para qué sirve

Un **grupo médico** es un evento de equipo alrededor de un servicio del catálogo: un roster de profesionales por cargo o función, el pago acordado por cargo, un paciente y un diagnóstico opcionales, y un ciclo de vida propio que termina en un expediente inmutable.

_Fuente: `src/modules/medical_groups/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:MedicalGroupsController` | Operaciones de MedicalGroupsController que el README no asigna a un caso de uso | GET /medical-groups | PRACTITIONER · CLINICIAN | BAJO | 2 |
|  |  | POST /medical-groups | PRACTITIONER · CLINICIAN | MEDIO | 25 |
|  |  | GET /medical-groups/{id} | PRACTITIONER · CLINICIAN | MEDIO | 3 |
|  |  | PATCH /medical-groups/{id}/exercise-notes | PRACTITIONER · CLINICIAN | MEDIO | 3 |
|  |  | POST /medical-groups/{id}/members/{memberId}/respond | PRACTITIONER · CLINICIAN | MEDIO | 4 |
|  |  | POST /medical-groups/{id}/reschedule-requests | PRACTITIONER · CLINICIAN | MEDIO | 3 |
|  |  | POST /medical-groups/{id}/reschedule-requests/respond | PRACTITIONER · CLINICIAN | MEDIO | 3 |
|  |  | GET /medical-groups/patients/{patientProfileId}/conditions | PRACTITIONER · CLINICIAN | BAJO | 20 |

### Diagrama — etapas `ctrl:MedicalGroupsController`

```mermaid
flowchart LR
  a2(["PRACTITIONER · CLINICIAN"]):::actor
  t3[("medical_groups.group_members")]:::tabla
  t4[("medical_groups.groups")]:::tabla
  t6[("authz.access_policies")]:::tabla
  t7[("authz.care_relationships")]:::tabla
  t8[("authz.clinical_access_grants")]:::tabla
  t9[("authz.field_permissions")]:::tabla
  t10[("authz.patient_legal_representations")]:::tabla
  t11[("authz.permissions")]:::tabla
  t12[("+19 tablas más")]
  t19[("+14 tablas más")]
  subgraph s0["ctrl:MedicalGroupsController · Operaciones de MedicalGroupsController que el RE…"]
    o1["GET /medical-groups"]:::op
    o5["POST /medical-groups"]:::op
    o13["GET /medical-groups/{id}"]:::op
    o14["PATCH /medical-groups/{id}/exercise-notes"]:::op
    o15["POST /medical-groups/{id}/members/{memberId}/respond"]:::op
    o16["POST /medical-groups/{id}/reschedule-requests"]:::op
    o17["POST /medical-groups/{id}/reschedule-requests/respond"]:::op
    o18["GET /medical-groups/patients/{patientProfileId}/conditions"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"LEE"| t6
  o5 -->|"LEE"| t7
  o5 -->|"LEE"| t8
  o5 -->|"LEE"| t9
  o5 -->|"LEE"| t10
  o5 -->|"LEE"| t11
  o5 -.-> t12
  a2 --> o13
  o13 -->|"LEE"| t3
  o13 -->|"ACTUALIZA"| t4
  o13 -->|"LEE"| t4
  a2 --> o14
  o14 -->|"LEE"| t3
  o14 -->|"ACTUALIZA"| t4
  o14 -->|"LEE"| t4
  a2 --> o15
  o15 -->|"ACTUALIZA"| t3
  o15 -->|"LEE"| t3
  o15 -->|"ACTUALIZA"| t4
  o15 -->|"LEE"| t4
  a2 --> o16
  o16 -->|"LEE"| t3
  o16 -->|"ACTUALIZA"| t4
  o16 -->|"LEE"| t4
  a2 --> o17
  o17 -->|"LEE"| t3
  o17 -->|"ACTUALIZA"| t4
  o17 -->|"LEE"| t4
  a2 --> o18
  o18 -->|"LEE"| t6
  o18 -->|"LEE"| t7
  o18 -->|"LEE"| t8
  o18 -->|"LEE"| t9
  o18 -->|"LEE"| t10
  o18 -->|"LEE"| t11
  o18 -.-> t19
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /medical-groups

Listar grupos médicos (histórico/enviadas/recibidas)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.list"]:::llamada
  n2 --> n3
  n4["Llama a MedicalGroupsService.requirePractitioner"]:::llamada
  n3 --> n4
  n5{"actor.practitionerProfileId === undefined"}:::decision
  n4 --> n5
  n6(["401 UNAUTHENTICATED La cuenta no tiene un perfil profesional asociado"]):::error
  n5 -->|"sí"| n6
  n7["Llama a MedicalGroupsService.idsForTab"]:::llamada
  n5 -->|"no"| n7
  n8{"tab === 'recibidas'"}:::decision
  n7 --> n8
  n9["Llama a MedicalGroupMembersRepository.findGroupIdsByInvitee"]:::llamada
  n8 -->|"sí"| n9
  n10[("LEE medical_groups.group_members")]:::efecto
  n9 --> n10
  n11{"tab === 'enviadas'"}:::decision
  n10 --> n11
  n8 -->|"no"| n11
  n12["Llama a MedicalGroupsRepository.findIdsByRequester"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE medical_groups.groups")]:::efecto
  n12 --> n13
  n14["Llama a MedicalGroupMembersRepository.findGroupIdsWithPendingInvites"]:::llamada
  n13 --> n14
  n15[("LEE medical_groups.group_members")]:::efecto
  n14 --> n15
  n16["Llama a MedicalGroupsRepository.findIdsByRequester"]:::llamada
  n15 --> n16
  n11 -->|"no"| n16
  n17[("LEE medical_groups.groups")]:::efecto
  n16 --> n17
  n18["Llama a MedicalGroupMembersRepository.findGroupIdsByInvitee"]:::llamada
  n17 --> n18
  n19[("LEE medical_groups.group_members")]:::efecto
  n18 --> n19
  n20["Llama a MedicalGroupsRepository.findByIdsPage"]:::llamada
  n19 --> n20
  n21[("LEE medical_groups.groups")]:::efecto
  n20 --> n21
  n22["Llama a MedicalGroupMembersRepository.findManyByGroups"]:::llamada
  n21 --> n22
  n23[("LEE medical_groups.group_members")]:::efecto
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

#### 2. POST /medical-groups

Crear grupo médico

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Servicio médico no encontrado; ResourceNotFoundException: Paciente no encontrado; ResourceNotFoundException: Diagnóstico no encontrado; ResourceNotFoundException: Profesional no encontrado |
| 409 | `CONFLICT` | ConflictException: Un mismo profesional no puede repetirse (ni ser también el creador) |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Seleccione primero el paciente para poder elegir un diagnóstico |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.create"]:::llamada
  n2 --> n3
  n4["Llama a MedicalGroupsService.requirePractitioner"]:::llamada
  n3 --> n4
  n5{"actor.practitionerProfileId === undefined"}:::decision
  n4 --> n5
  n6(["401 UNAUTHENTICATED La cuenta no tiene un perfil profesional asociado"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a ServiceCatalogRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE billing.service_catalog")]:::efecto
  n8 --> n9
  n10{"service === null || !service.isActive"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Servicio médico no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a PracticeTenantLookupService.findActivePracticeIdsForPractitioner"]:::llamada
  n10 -->|"no"| n12
  n13["Llama a PractitionerRoleAssignmentsRepository.findActiveByPractitioner"]:::llamada
  n12 --> n13
  n14[("LEE practice.practitioner_role_assignments")]:::efecto
  n13 --> n14
  n15{"!own.includes(service.practiceId)"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Servicio médico no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a PracticeTenantLookupService.findTenantOfPractice"]:::llamada
  n15 -->|"no"| n17
  n18["Llama a PracticesRepository.findById"]:::llamada
  n17 --> n18
  n19[("LEE practice.practices")]:::efecto
  n18 --> n19
  n20{"tenantId === null"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Servicio médico no encontrado"]):::error
  n20 -->|"sí"| n21
  n22{"dto.conditionId !== undefined && dto.patientProfileId === undefined"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED Seleccione primero el paciente para poder elegir un diagnóstico"]):::error
  n22 -->|"sí"| n23
  n24{"dto.patientProfileId !== undefined"}:::decision
  n22 -->|"no"| n24
  n25["Llama a PatientProfilesRepository.findById"]:::llamada
  n24 -->|"sí"| n25
  n26[("LEE profiles.patient_profiles")]:::efecto
  n25 --> n26
  n27{"patient === null"}:::decision
  n26 --> n27
  n28(["404 NOT_FOUND Paciente no encontrado"]):::error
  n27 -->|"sí"| n28
  n29{"dto.conditionId !== undefined"}:::decision
  n27 -->|"no"| n29
  n30["Llama a ClinicalReadService.assertCanReadHistory"]:::llamada
  n29 -->|"sí"| n30
  n31{"!actor.roles.some((role) =› ROLES_THAT_ATTEND.includes(role))"}:::decision
  n30 --> n31
  n32["Llama a ClinicalReadService.assertOwnRecord"]:::llamada
  n31 -->|"sí"| n32
  n33["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n32 --> n33
  n34[("LEE profiles.person_account_links")]:::efecto
  n33 --> n34
  n35["Llama a PatientProfilesRepository.findById"]:::llamada
  n34 --> n35
  n36[("LEE profiles.patient_profiles")]:::efecto
  n35 --> n36
  n37{"!link || !profile || profile.profileId !== link.personId"}:::decision
  n36 --> n37
  n38(["403 FORBIDDEN {WITHOUT_ACCESS_TO_HISTORY}"]):::error
  n37 -->|"sí"| n38
  n39["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n37 -->|"no"| n39
  n31 -->|"no"| n39
  n40[("LEE profiles.person_account_links")]:::efecto
  n39 --> n40
  n41["Llama a HealthPractitionerProfilesRepository.findById"]:::llamada
  n40 --> n41
  n42[("LEE profiles.health_practitioner_profiles")]:::efecto
  n41 --> n42
  n43["Llama a ClinicalReadService.isAttending"]:::llamada
  n42 --> n43
  n44["Llama a SchedulingBookingsRepository.hasConsultationInProgress"]:::llamada
  n43 --> n44
  n45[("LEE scheduling.appointment_bookings · LEE scheduling.schedulable_resources")]:::efecto
  n44 --> n45
  n46["Llama a ClinicalReadService.assertOwnRecord"]:::llamada
  n45 --> n46
  n47["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n46 --> n47
  n48[("LEE profiles.person_account_links")]:::efecto
  n47 --> n48
  n49["Llama a PatientProfilesRepository.findById"]:::llamada
  n48 --> n49
  n50[("LEE profiles.patient_profiles")]:::efecto
  n49 --> n50
  n51{"!link || !profile || profile.profileId !== link.personId"}:::decision
  n50 --> n51
  n52(["403 FORBIDDEN {WITHOUT_ACCESS_TO_HISTORY}"]):::error
  n51 -->|"sí"| n52
  n53["Llama a ConditionsRepository.findById"]:::llamada
  n51 -->|"no"| n53
  n54[("LEE clinical.conditions")]:::efecto
  n53 --> n54
  n55{"condition === null || condition.patientProfileId !== dto.patientProfileId"}:::decision
  n54 --> n55
  n56(["404 NOT_FOUND Diagnóstico no encontrado"]):::error
  n55 -->|"sí"| n56
  n57["Repite: por cada const member de dto.members"]:::bucle
  n55 -->|"no"| n57
  n29 -->|"no"| n57
  n24 -->|"no"| n57
  n58{"seenPractitioners.has(member.practitionerProfileId)"}:::decision
  n57 -->|"cada elemento"| n58
  n59(["409 CONFLICT Un mismo profesional no puede repetirse (ni ser también el creador)"]):::error
  n58 -->|"sí"| n59
  n60["Llama a HealthPractitionerProfilesRepository.findById"]:::llamada
  n58 -->|"no"| n60
  n61[("LEE profiles.health_practitioner_profiles")]:::efecto
  n60 --> n61
  n62{"invited === null"}:::decision
  n61 --> n62
  n63(["404 NOT_FOUND Profesional no encontrado"]):::error
  n62 -->|"sí"| n63
  n64["Llama a MedicalGroupsRepository.create"]:::llamada
  n62 -->|"no"| n64
  n57 -->|"al terminar"| n64
  n65[("CREA medical_groups.groups")]:::efecto
  n64 --> n65
  n66["Llama a MedicalGroupMembersRepository.create"]:::llamada
  n65 --> n66
  n67[("CREA medical_groups.group_members")]:::efecto
  n66 --> n67
  n68["Repite: por cada const member de dto.members"]:::bucle
  n67 --> n68
  n69["Llama a MedicalGroupMembersRepository.create"]:::llamada
  n68 -->|"cada elemento"| n69
  n70[("CREA medical_groups.group_members")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (2 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"al terminar"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /medical-groups/{id}

Consultar un grupo médico (formulario de sólo lectura)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.findOne"]:::llamada
  n2 --> n3
  n4["Llama a MedicalGroupsRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE medical_groups.groups")]:::efecto
  n4 --> n5
  n6{"group === null"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n6 -->|"sí"| n7
  n8["Llama a MedicalGroupMembersRepository.findByGroup"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE medical_groups.group_members")]:::efecto
  n8 --> n9
  n10["Llama a MedicalGroupsService.assertActorSeesGroup"]:::llamada
  n9 --> n10
  n11{"!can"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a MedicalGroupsService.closeIfExpired"]:::llamada
  n11 -->|"no"| n13
  n14[("ACTUALIZA medical_groups.groups")]:::efecto
  n13 --> n14
  n15{"group.status !== MEDICAL_GROUP_STATUS.CLOSED"}:::decision
  n14 --> n15
  n16[("ACTUALIZA medical_groups.groups")]:::efecto
  n15 -->|"sí"| n16
  n17(("200 Responde con éxito")):::ok
  n16 --> n17
  n15 -->|"no"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. PATCH /medical-groups/{id}/exercise-notes

Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El expediente ya está cerrado y es inmutable; PreconditionFailedException: Todavía no se realizó la cita: las notas del procedimiento se cargan después |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.updateExerciseNotes"]:::llamada
  n2 --> n3
  n4["Llama a MedicalGroupsService.requirePractitioner"]:::llamada
  n3 --> n4
  n5{"actor.practitionerProfileId === undefined"}:::decision
  n4 --> n5
  n6(["401 UNAUTHENTICATED La cuenta no tiene un perfil profesional asociado"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a MedicalGroupsRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE medical_groups.groups")]:::efecto
  n8 --> n9
  n10{"group === null"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a MedicalGroupMembersRepository.findByGroup"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE medical_groups.group_members")]:::efecto
  n12 --> n13
  n14["Llama a MedicalGroupsService.assertActorIsActiveMember"]:::llamada
  n13 --> n14
  n15{"!can"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a MedicalGroupsService.closeIfExpired"]:::llamada
  n15 -->|"no"| n17
  n18[("ACTUALIZA medical_groups.groups")]:::efecto
  n17 --> n18
  n19{"group.status !== MEDICAL_GROUP_STATUS.CLOSED"}:::decision
  n18 --> n19
  n20[("ACTUALIZA medical_groups.groups")]:::efecto
  n19 -->|"sí"| n20
  n21{"justClosed || isClosedNow(group)"}:::decision
  n20 --> n21
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED El expediente ya está cerrado y es inmutable"]):::error
  n21 -->|"sí"| n22
  n23{"!isRealizedNow(group)"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED Todavía no se realizó la cita: las notas del procedimiento se cargan después"]):::error
  n23 -->|"sí"| n24
  n25[("ACTUALIZA medical_groups.groups · ACTUALIZA medical_groups.groups")]:::efecto
  n23 -->|"no"| n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /medical-groups/{id}/members/{memberId}/respond

Aceptar o rechazar la invitación a un cargo del grupo

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado; ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esta solicitud ya fue respondida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.respondToInvitation"]:::llamada
  n2 --> n3
  n4["Llama a MedicalGroupsService.requirePractitioner"]:::llamada
  n3 --> n4
  n5{"actor.practitionerProfileId === undefined"}:::decision
  n4 --> n5
  n6(["401 UNAUTHENTICATED La cuenta no tiene un perfil profesional asociado"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a MedicalGroupsRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE medical_groups.groups")]:::efecto
  n8 --> n9
  n10{"group === null"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a MedicalGroupMembersRepository.findById"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE medical_groups.group_members")]:::efecto
  n12 --> n13
  n14{"member === null || member.groupId !== groupId"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Solicitud no encontrada"]):::error
  n14 -->|"sí"| n15
  n16{"member.practitionerProfileId !== practitionerProfileId"}:::decision
  n14 -->|"no"| n16
  n17(["404 NOT_FOUND Solicitud no encontrada"]):::error
  n16 -->|"sí"| n17
  n18{"member.invitationStatus !== 'PENDING'"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED Esta solicitud ya fue respondida"]):::error
  n18 -->|"sí"| n19
  n20[("ACTUALIZA medical_groups.group_members · ACTUALIZA medical_groups.group_members")]:::efecto
  n18 -->|"no"| n20
  n21{"decision === 'ACCEPTED' && group.status === MEDICAL_GROUP_STATUS.PENDING_TEAM"}:::decision
  n20 --> n21
  n22["Llama a MedicalGroupMembersRepository.hasPendingInvites"]:::llamada
  n21 -->|"sí"| n22
  n23[("LEE medical_groups.group_members")]:::efecto
  n22 --> n23
  n24{"!stillPending"}:::decision
  n23 --> n24
  n25[("ACTUALIZA medical_groups.groups")]:::efecto
  n24 -->|"sí"| n25
  n26["Llama a MedicalGroupMembersRepository.findByGroup"]:::llamada
  n25 --> n26
  n24 -->|"no"| n26
  n21 -->|"no"| n26
  n27[("LEE medical_groups.group_members")]:::efecto
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

#### 6. POST /medical-groups/{id}/reschedule-requests

Solicitar cambio de horario

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El expediente ya está cerrado y es inmutable; PreconditionFailedException: Sólo se puede solicitar cambio de horario sobre una cita programada y aún no realizada; PreconditionFailedException: Fecha propuesta inválida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.requestReschedule"]:::llamada
  n2 --> n3
  n4["Llama a MedicalGroupsService.requirePractitioner"]:::llamada
  n3 --> n4
  n5{"actor.practitionerProfileId === undefined"}:::decision
  n4 --> n5
  n6(["401 UNAUTHENTICATED La cuenta no tiene un perfil profesional asociado"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a MedicalGroupsRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE medical_groups.groups")]:::efecto
  n8 --> n9
  n10{"group === null"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n10 -->|"sí"| n11
  n12["Llama a MedicalGroupMembersRepository.findByGroup"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE medical_groups.group_members")]:::efecto
  n12 --> n13
  n14["Llama a MedicalGroupsService.assertActorIsActiveMember"]:::llamada
  n13 --> n14
  n15{"!can"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a MedicalGroupsService.closeIfExpired"]:::llamada
  n15 -->|"no"| n17
  n18[("ACTUALIZA medical_groups.groups")]:::efecto
  n17 --> n18
  n19{"group.status !== MEDICAL_GROUP_STATUS.CLOSED"}:::decision
  n18 --> n19
  n20[("ACTUALIZA medical_groups.groups")]:::efecto
  n19 -->|"sí"| n20
  n21{"isClosedNow(group)"}:::decision
  n20 --> n21
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED El expediente ya está cerrado y es inmutable"]):::error
  n21 -->|"sí"| n22
  n23{"group.status !== MEDICAL_GROUP_STATUS.SCHEDULED"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED Sólo se puede solicitar cambio de horario sobre una cita programada y aún no realizada"]):::error
  n23 -->|"sí"| n24
  n25{"Number.isNaN(proposed.getTime())"}:::decision
  n23 -->|"no"| n25
  n26(["422 PRECONDITION_FAILED Fecha propuesta inválida"]):::error
  n25 -->|"sí"| n26
  n27{"practitionerProfileId === group.requestingPractitionerId"}:::decision
  n25 -->|"no"| n27
  n28[("ACTUALIZA medical_groups.groups · ACTUALIZA medical_groups.groups · ACTUALIZA medical_groups.groups")]:::efecto
  n27 -->|"sí"| n28
  n29[("ACTUALIZA medical_groups.groups · ACTUALIZA medical_groups.groups · ACTUALIZA medical_groups.groups")]:::efecto
  n27 -->|"no"| n29
  n30(("201 Responde con éxito")):::ok
  n28 --> n30
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /medical-groups/{id}/reschedule-requests/respond

Resolver la solicitud de cambio de horario

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado; UnauthorizedException: Sólo quien creó la solicitud puede resolver el cambio de horario propuesto |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay ningún cambio de horario pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.respondToReschedule"]:::llamada
  n2 --> n3
  n4["Llama a MedicalGroupsService.requirePractitioner"]:::llamada
  n3 --> n4
  n5{"actor.practitionerProfileId === undefined"}:::decision
  n4 --> n5
  n6(["401 UNAUTHENTICATED La cuenta no tiene un perfil profesional asociado"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a MedicalGroupsRepository.findById"]:::llamada
  n7 --> n8
  n9[("LEE medical_groups.groups")]:::efecto
  n8 --> n9
  n10{"group === null"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Grupo médico no encontrado"]):::error
  n10 -->|"sí"| n11
  n12{"group.requestingPractitionerId !== practitionerProfileId"}:::decision
  n10 -->|"no"| n12
  n13(["401 UNAUTHENTICATED Sólo quien creó la solicitud puede resolver el cambio de horario propuesto"]):::error
  n12 -->|"sí"| n13
  n14{"group.status !== MEDICAL_GROUP_STATUS.RESCHEDULE_PENDING"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED No hay ningún cambio de horario pendiente"]):::error
  n14 -->|"sí"| n15
  n16{"decision === 'ACCEPTED' && group.proposedRescheduleAt"}:::decision
  n14 -->|"no"| n16
  n17[("ACTUALIZA medical_groups.groups")]:::efecto
  n16 -->|"sí"| n17
  n18[("ACTUALIZA medical_groups.groups · ACTUALIZA medical_groups.groups · ACTUALIZA medical_groups.groups")]:::efecto
  n17 --> n18
  n16 -->|"no"| n18
  n19["Llama a MedicalGroupMembersRepository.findByGroup"]:::llamada
  n18 --> n19
  n20[("LEE medical_groups.group_members")]:::efecto
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

#### 8. GET /medical-groups/patients/{patientProfileId}/conditions

Diagnósticos del paciente para el selector del formulario

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a MedicalGroupsService.listPatientConditions"]:::llamada
  n2 --> n3
  n4["Llama a ClinicalReadService.assertCanReadHistory"]:::llamada
  n3 --> n4
  n5{"!actor.roles.some((role) =› ROLES_THAT_ATTEND.includes(role))"}:::decision
  n4 --> n5
  n6["Llama a ClinicalReadService.assertOwnRecord"]:::llamada
  n5 -->|"sí"| n6
  n7["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n6 --> n7
  n8[("LEE profiles.person_account_links")]:::efecto
  n7 --> n8
  n9["Llama a PatientProfilesRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE profiles.patient_profiles")]:::efecto
  n9 --> n10
  n11{"!link || !profile || profile.profileId !== link.personId"}:::decision
  n10 --> n11
  n12(["403 FORBIDDEN {WITHOUT_ACCESS_TO_HISTORY}"]):::error
  n11 -->|"sí"| n12
  n13["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n11 -->|"no"| n13
  n5 -->|"no"| n13
  n14[("LEE profiles.person_account_links")]:::efecto
  n13 --> n14
  n15["Llama a HealthPractitionerProfilesRepository.findById"]:::llamada
  n14 --> n15
  n16[("LEE profiles.health_practitioner_profiles")]:::efecto
  n15 --> n16
  n17["Llama a ClinicalReadService.isAttending"]:::llamada
  n16 --> n17
  n18["Llama a SchedulingBookingsRepository.hasConsultationInProgress"]:::llamada
  n17 --> n18
  n19[("LEE scheduling.appointment_bookings · LEE scheduling.schedulable_resources")]:::efecto
  n18 --> n19
  n20["Llama a ClinicalReadService.assertOwnRecord"]:::llamada
  n19 --> n20
  n21["Llama a PersonAccountLinksRepository.findActiveByUser"]:::llamada
  n20 --> n21
  n22[("LEE profiles.person_account_links")]:::efecto
  n21 --> n22
  n23["Llama a PatientProfilesRepository.findById"]:::llamada
  n22 --> n23
  n24[("LEE profiles.patient_profiles")]:::efecto
  n23 --> n24
  n25{"!link || !profile || profile.profileId !== link.personId"}:::decision
  n24 --> n25
  n26(["403 FORBIDDEN {WITHOUT_ACCESS_TO_HISTORY}"]):::error
  n25 -->|"sí"| n26
  n27["Llama a ConditionsRepository.findByPatient"]:::llamada
  n25 -->|"no"| n27
  n28[("LEE clinical.conditions")]:::efecto
  n27 --> n28
  n29[("LEE terminology.catalog_concepts")]:::efecto
  n28 --> n29
  n30(("200 Responde con éxito")):::ok
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

