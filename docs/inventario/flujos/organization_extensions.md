<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `organization_extensions`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 9 (9 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [organization_extensions](../endpoints/organization_extensions.md)

## Proceso: Módulo 22 — Organization Extensions (Healthcare Organization Specializations)

- **Código:** `organization_extensions` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 9
- **Actores:** SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/organization_extensions/README.md`

### Para qué sirve

Especializa organizaciones del directorio como hospitales y gestiona sus líneas de servicio, licencias de instalación, afiliaciones entre organizaciones y fronteras de datos (residencia/RLS).

_Fuente: `src/modules/organization_extensions/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-22-01` | Especializar practice/tenant como hospital (estado borrador) | POST /orgext/hospitals | SECURITY_ADMIN | MEDIO | 3 |
| `UC-22-02` | Activar hospital (guard: licencia verificada) | POST /orgext/hospitals/{id}/activate | SECURITY_ADMIN | BAJO | 5 |
| `UC-22-03` | Definir línea de servicio (hospital activo) | POST /orgext/hospitals/{id}/service-lines | SECURITY_ADMIN | MEDIO | 6 |
| `UC-22-04` | Retirar (soft-delete) línea de servicio | DELETE /orgext/hospitals/{id}/service-lines/{lineId} | SECURITY_ADMIN | MEDIO | 3 |
| `UC-22-05` | Registrar licencia de instalación (pendiente) | POST /orgext/facility-licenses | SECURITY_ADMIN | MEDIO | 5 |
| `UC-22-06` | Verificar / rechazar licencia | POST /orgext/facility-licenses/{id}/verify | SECURITY_ADMIN | BAJO | 1 |
| `UC-22-07` | Declarar afiliación (incluye guard de frontera de datos) | POST /orgext/affiliations | SECURITY_ADMIN | MEDIO | 7 |
| `UC-22-08` | Definir frontera de datos (residencia/RLS) | POST /orgext/data-boundaries | SECURITY_ADMIN | MEDIO | 2 |
| `UC-22-09` | Terminar afiliación y revocar acceso | POST /orgext/affiliations/{id}/terminate | SECURITY_ADMIN | BAJO | 1 |

### Diagrama — etapas `UC-22-01`, `UC-22-02`, `UC-22-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("organization_extensions.hospitals")]:::tabla
  t4[("practice.practices")]:::tabla
  t6[("community.public_profiles")]:::tabla
  t7[("organization_extensions.facility_licenses")]:::tabla
  t8[("practice.practice_sites")]:::tabla
  t10[("organization_extensions.hospital_service_lines")]:::tabla
  t11[("practice.clinical_units")]:::tabla
  t12[("practice.healthcare_services")]:::tabla
  t15[("common.files")]:::tabla
  t18[("organization_extensions.data_use_agreements")]:::tabla
  t19[("organization_extensions.organization_affiliations")]:::tabla
  t20[("organization_extensions.organization_data_boundar…")]:::tabla
  subgraph s0["UC-22-01 · Especializar practice/tenant como hospital (estado borrador)"]
    o1["POST /orgext/hospitals"]:::op
  end
  subgraph s1["UC-22-02 · Activar hospital (guard: licencia verificada)"]
    o5["POST /orgext/hospitals/{id}/activate"]:::op
  end
  subgraph s2["UC-22-03 · Definir línea de servicio (hospital activo)"]
    o9["POST /orgext/hospitals/{id}/service-lines"]:::op
  end
  subgraph s3["UC-22-04 · Retirar (soft-delete) línea de servicio"]
    o13["DELETE /orgext/hospitals/{id}/service-lines/{lineId}"]:::op
  end
  subgraph s4["UC-22-05 · Registrar licencia de instalación (pendiente)"]
    o14["POST /orgext/facility-licenses"]:::op
  end
  subgraph s5["UC-22-06 · Verificar / rechazar licencia"]
    o16["POST /orgext/facility-licenses/{id}/verify"]:::op
  end
  t21[("+1 tablas más")]
  subgraph s6["UC-22-07 · Declarar afiliación (incluye guard de frontera de datos)"]
    o17["POST /orgext/affiliations"]:::op
  end
  subgraph s7["UC-22-08 · Definir frontera de datos (residencia/RLS)"]
    o22["POST /orgext/data-boundaries"]:::op
  end
  subgraph s8["UC-22-09 · Terminar afiliación y revocar acceso"]
    o23["POST /orgext/affiliations/{id}/terminate"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"LEE"| t6
  o5 -->|"LEE"| t7
  o5 -->|"LEE"| t3
  o5 -->|"LEE"| t8
  o5 -->|"LEE"| t4
  a2 --> o9
  o9 -->|"CREA"| t10
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t11
  o9 -->|"LEE"| t12
  o9 -->|"LEE"| t8
  o9 -->|"LEE"| t4
  a2 --> o13
  o13 -->|"ACTUALIZA"| t10
  o13 -->|"LEE"| t10
  o13 -->|"LEE"| t3
  a2 --> o14
  o14 -->|"LEE"| t15
  o14 -->|"CREA"| t7
  o14 -->|"LEE"| t7
  o14 -->|"LEE"| t8
  o14 -->|"LEE"| t4
  a2 --> o16
  o16 -->|"LEE"| t7
  a2 --> o17
  o17 -->|"LEE"| t18
  o17 -->|"CREA"| t19
  o17 -->|"LEE"| t19
  o17 -->|"LEE"| t20
  o17 -->|"LEE"| t12
  o17 -->|"LEE"| t8
  o17 -.-> t21
  a2 --> o22
  o22 -->|"CREA"| t20
  o22 -->|"LEE"| t20
  a2 --> o23
  o23 -->|"LEE"| t19
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /orgext/affiliations

Declarar afiliación entre organizaciones

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {ORGEXT_NOT_AVAILABLE.message} |
| 409 | `CONFLICT` | ConflictException: Ya existe una afiliación activa de ese tipo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tenant primario y el participante deben ser distintos; PreconditionFailedException: El tenant participante no tiene una frontera de datos activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextAffiliationsService.declare"]:::llamada
  n2 --> n3
  n4["Llama a OrgextAffiliationsService.assertActorScopesParticipant"]:::llamada
  n3 --> n4
  n5(["404 NOT_FOUND {ORGEXT_NOT_AVAILABLE.message}"]):::error
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n7{"primaryTenantId === dto.participatingTenantId"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El tenant primario y el participante deben ser distintos"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OrgextReferencesRepository.practiceSiteInTenants"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE practice.practice_sites")]:::efecto
  n9 --> n10
  n11["Llama a OrgextReferencesRepository.practiceInTenants"]:::llamada
  n10 --> n11
  n12[("LEE practice.practices")]:::efecto
  n11 --> n12
  n13{"dto.hostPracticeSiteId && !(await this.references.practiceSiteInTenants( tx, dto.hostPracticeSiteId, parties,…"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15["Llama a OrgextReferencesRepository.healthcareServiceInTenants"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE practice.healthcare_services")]:::efecto
  n15 --> n16
  n17["Llama a OrgextReferencesRepository.practiceInTenants"]:::llamada
  n16 --> n17
  n18[("LEE practice.practices")]:::efecto
  n17 --> n18
  n19{"dto.healthcareServiceId && !(await this.references.healthcareServiceInTenants( tx, dto.healthcareServiceId, p…"}:::decision
  n18 --> n19
  n20(["↩ (relanza el error capturado)"]):::error
  n19 -->|"sí"| n20
  n21["Llama a OrgextReferencesRepository.dataUseAgreementInTenants"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE organization_extensions.data_use_agreements")]:::efecto
  n21 --> n22
  n23{"dto.dataUseAgreementId && !(await this.references.dataUseAgreementInTenants( tx, dto.dataUseAgreementId, part…"}:::decision
  n22 --> n23
  n24(["↩ (relanza el error capturado)"]):::error
  n23 -->|"sí"| n24
  n25["Llama a OrganizationDataBoundariesRepository.countActiveForTenant"]:::llamada
  n23 -->|"no"| n25
  n26[("LEE organization_extensions.organization_data_boundaries")]:::efecto
  n25 --> n26
  n27{"boundaries === 0"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED El tenant participante no tiene una frontera de datos activa"]):::error
  n27 -->|"sí"| n28
  n29["Llama a OrganizationAffiliationsRepository.findActiveDuplicate"]:::llamada
  n27 -->|"no"| n29
  n30[("LEE organization_extensions.organization_affiliations")]:::efecto
  n29 --> n30
  n31{"duplicate"}:::decision
  n30 --> n31
  n32(["409 CONFLICT Ya existe una afiliación activa de ese tipo"]):::error
  n31 -->|"sí"| n32
  n33["Llama a OrganizationAffiliationsRepository.create"]:::llamada
  n31 -->|"no"| n33
  n34[("CREA organization_extensions.organization_affiliations")]:::efecto
  n33 --> n34
  n35(("201 Responde con éxito")):::ok
  n34 --> n35
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /orgext/affiliations/{id}/terminate

Terminar afiliación y revocar acceso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La afiliación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextAffiliationsService.terminate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OrganizationAffiliationsRepository.findByIdForParty"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.organization_affiliations")]:::efecto
  n5 --> n6
  n7{"affiliation.statusConceptId !== ORGEXT.AFFILIATION_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La afiliación no está activa"]):::error
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

#### 3. POST /orgext/data-boundaries

Definir frontera de datos (residencia/RLS)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una frontera de datos activa de ese tipo para el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextDataBoundariesService.define"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OrganizationDataBoundariesRepository.findActiveByTenantAndType"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.organization_data_boundaries")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una frontera de datos activa de ese tipo para el tenant"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OrganizationDataBoundariesRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA organization_extensions.organization_data_boundaries")]:::efecto
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

#### 4. POST /orgext/facility-licenses

Registrar licencia de instalación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una licencia con ese número para el tipo indicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextFacilityLicensesService.register"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OrgextReferencesRepository.practiceSiteInTenants"]:::llamada
  n4 --> n5
  n6[("LEE practice.practice_sites")]:::efecto
  n5 --> n6
  n7["Llama a OrgextReferencesRepository.practiceInTenants"]:::llamada
  n6 --> n7
  n8[("LEE practice.practices")]:::efecto
  n7 --> n8
  n9{"dto.practiceSiteId && !(await this.references.practiceSiteInTenants(tx, dto.practiceSiteId, [ tenantId, ]))"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11["Llama a OrgextReferencesRepository.fileInTenants"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE common.files")]:::efecto
  n11 --> n12
  n13{"dto.evidenceFileId && !(await this.references.fileInTenants(tx, dto.evidenceFileId, [ tenantId, ]))"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15["Llama a FacilityLicensesRepository.findByNumber"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE organization_extensions.facility_licenses")]:::efecto
  n15 --> n16
  n17{"clash"}:::decision
  n16 --> n17
  n18(["409 CONFLICT Ya existe una licencia con ese número para el tipo indicado"]):::error
  n17 -->|"sí"| n18
  n19["Llama a FacilityLicensesRepository.create"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA organization_extensions.facility_licenses")]:::efecto
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

#### 5. POST /orgext/facility-licenses/{id}/verify

Verificar / rechazar licencia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La licencia no está en estado pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextFacilityLicensesService.verify"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FacilityLicensesRepository.findByIdInTenant"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.facility_licenses")]:::efecto
  n5 --> n6
  n7{"license.verificationStatusConceptId !== ORGEXT.LICENSE_PENDING"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La licencia no está en estado pendiente"]):::error
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

#### 6. POST /orgext/hospitals

Especializar practice/tenant como hospital

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El tenant o el practice ya está especializado como hospital |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextHospitalsService.specialize"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OrgextReferencesRepository.practiceInTenants"]:::llamada
  n4 --> n5
  n6[("LEE practice.practices")]:::efecto
  n5 --> n6
  n7{"!(await this.references.practiceInTenants(tx, dto.practiceId, [ tenantId, ]))"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a HospitalsRepository.findByTenantOrPractice"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE organization_extensions.hospitals")]:::efecto
  n9 --> n10
  n11{"clash"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El tenant o el practice ya está especializado como hospital"]):::error
  n11 -->|"sí"| n12
  n13["Llama a HospitalsRepository.create"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA organization_extensions.hospitals")]:::efecto
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

#### 7. POST /orgext/hospitals/{id}/activate

Activar hospital y publicar perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hospital no está en estado borrador/inactivo; PreconditionFailedException: El hospital no tiene ninguna licencia de instalación verificada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextHospitalsService.activate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a HospitalsRepository.findByIdInTenant"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.hospitals")]:::efecto
  n5 --> n6
  n7{"hospital.statusConceptId !== ORGEXT.HOSPITAL_DRAFT"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El hospital no está en estado borrador/inactivo"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OrgextReferencesRepository.practiceSiteInTenants"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE practice.practice_sites")]:::efecto
  n9 --> n10
  n11["Llama a OrgextReferencesRepository.practiceInTenants"]:::llamada
  n10 --> n11
  n12[("LEE practice.practices")]:::efecto
  n11 --> n12
  n13{"dto.primaryPracticeSiteId && !(await this.references.practiceSiteInTenants( tx, dto.primaryPracticeSiteId, ow…"}:::decision
  n12 --> n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"sí"| n14
  n15["Llama a OrgextReferencesRepository.publicProfileInTenants"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE community.public_profiles")]:::efecto
  n15 --> n16
  n17{"dto.publicProfileId && !(await this.references.publicProfileInTenants( tx, dto.publicProfileId, ownTenant, ))"}:::decision
  n16 --> n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"sí"| n18
  n19["Llama a FacilityLicensesRepository.countVerifiedForTenant"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE organization_extensions.facility_licenses")]:::efecto
  n19 --> n20
  n21{"verifiedCount === 0"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED El hospital no tiene ninguna licencia de instalación verificada"]):::error
  n21 -->|"sí"| n22
  n23(("200 Responde con éxito")):::ok
  n21 -->|"no"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /orgext/hospitals/{id}/service-lines

Definir línea de servicio hospitalaria

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hospital no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextHospitalsService.addServiceLine"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a HospitalsRepository.findByIdInTenant"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.hospitals")]:::efecto
  n5 --> n6
  n7{"hospital.statusConceptId !== ORGEXT.HOSPITAL_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El hospital no está activo"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OrgextReferencesRepository.clinicalUnitInTenants"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE practice.clinical_units")]:::efecto
  n9 --> n10
  n11["Llama a OrgextReferencesRepository.practiceSiteInTenants"]:::llamada
  n10 --> n11
  n12[("LEE practice.practice_sites")]:::efecto
  n11 --> n12
  n13["Llama a OrgextReferencesRepository.practiceInTenants"]:::llamada
  n12 --> n13
  n14[("LEE practice.practices")]:::efecto
  n13 --> n14
  n15{"dto.clinicalUnitId && !(await this.references.clinicalUnitInTenants( tx, dto.clinicalUnitId, ownTenant, ))"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a OrgextReferencesRepository.healthcareServiceInTenants"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE practice.healthcare_services")]:::efecto
  n17 --> n18
  n19["Llama a OrgextReferencesRepository.practiceInTenants"]:::llamada
  n18 --> n19
  n20[("LEE practice.practices")]:::efecto
  n19 --> n20
  n21{"dto.healthcareServiceId && !(await this.references.healthcareServiceInTenants( tx, dto.healthcareServiceId, o…"}:::decision
  n20 --> n21
  n22(["↩ (relanza el error capturado)"]):::error
  n21 -->|"sí"| n22
  n23["Llama a HospitalServiceLinesRepository.create"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA organization_extensions.hospital_service_lines")]:::efecto
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

#### 9. DELETE /orgext/hospitals/{id}/service-lines/{lineId}

Retirar (soft-delete) línea de servicio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Línea de servicio no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La línea de servicio no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OrgextHospitalsService.retireServiceLine"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a HospitalsRepository.findByIdInTenant"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.hospitals")]:::efecto
  n5 --> n6
  n7["Llama a HospitalServiceLinesRepository.findByIdForHospital"]:::llamada
  n6 --> n7
  n8[("LEE organization_extensions.hospital_service_lines")]:::efecto
  n7 --> n8
  n9{"!line"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Línea de servicio no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"line.statusConceptId !== ORGEXT.SERVICE_LINE_ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La línea de servicio no está activa"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA organization_extensions.hospital_service_lines")]:::efecto
  n11 -->|"no"| n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

