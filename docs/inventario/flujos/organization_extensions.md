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
| `UC-22-01` | Especializar practice/tenant como hospital (estado borrador) | POST /orgext/hospitals | SECURITY_ADMIN | MEDIO | 2 |
| `UC-22-02` | Activar hospital (guard: licencia verificada) | POST /orgext/hospitals/{id}/activate | SECURITY_ADMIN | MEDIO | 3 |
| `UC-22-03` | Definir línea de servicio (hospital activo) | POST /orgext/hospitals/{id}/service-lines | SECURITY_ADMIN | MEDIO | 2 |
| `UC-22-04` | Retirar (soft-delete) línea de servicio | DELETE /orgext/hospitals/{id}/service-lines/{lineId} | SECURITY_ADMIN | MEDIO | 2 |
| `UC-22-05` | Registrar licencia de instalación (pendiente) | POST /orgext/facility-licenses | SECURITY_ADMIN | MEDIO | 2 |
| `UC-22-06` | Verificar / rechazar licencia | POST /orgext/facility-licenses/{id}/verify | SECURITY_ADMIN | MEDIO | 2 |
| `UC-22-07` | Declarar afiliación (incluye guard de frontera de datos) | POST /orgext/affiliations | SECURITY_ADMIN | MEDIO | 3 |
| `UC-22-08` | Definir frontera de datos (residencia/RLS) | POST /orgext/data-boundaries | SECURITY_ADMIN | MEDIO | 2 |
| `UC-22-09` | Terminar afiliación y revocar acceso | POST /orgext/affiliations/{id}/terminate | SECURITY_ADMIN | MEDIO | 2 |

### Diagrama — etapas `UC-22-01`, `UC-22-02`, `UC-22-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("organization_extensions.hospitals")]:::tabla
  t5[("organization_extensions.facility_licenses")]:::tabla
  t7[("organization_extensions.hospital_service_lines")]:::tabla
  t12[("organization_extensions.organization_affiliations")]:::tabla
  t13[("organization_extensions.organization_data_boundar…")]:::tabla
  subgraph s0["UC-22-01 · Especializar practice/tenant como hospital (estado borrador)"]
    o1["POST /orgext/hospitals"]:::op
  end
  subgraph s1["UC-22-02 · Activar hospital (guard: licencia verificada)"]
    o4["POST /orgext/hospitals/{id}/activate"]:::op
  end
  subgraph s2["UC-22-03 · Definir línea de servicio (hospital activo)"]
    o6["POST /orgext/hospitals/{id}/service-lines"]:::op
  end
  subgraph s3["UC-22-04 · Retirar (soft-delete) línea de servicio"]
    o8["DELETE /orgext/hospitals/{id}/service-lines/{lineId}"]:::op
  end
  subgraph s4["UC-22-05 · Registrar licencia de instalación (pendiente)"]
    o9["POST /orgext/facility-licenses"]:::op
  end
  subgraph s5["UC-22-06 · Verificar / rechazar licencia"]
    o10["POST /orgext/facility-licenses/{id}/verify"]:::op
  end
  subgraph s6["UC-22-07 · Declarar afiliación (incluye guard de frontera de datos)"]
    o11["POST /orgext/affiliations"]:::op
  end
  subgraph s7["UC-22-08 · Definir frontera de datos (residencia/RLS)"]
    o14["POST /orgext/data-boundaries"]:::op
  end
  subgraph s8["UC-22-09 · Terminar afiliación y revocar acceso"]
    o15["POST /orgext/affiliations/{id}/terminate"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"LEE"| t5
  o4 -->|"ACTUALIZA"| t3
  o4 -->|"LEE"| t3
  a2 --> o6
  o6 -->|"CREA"| t7
  o6 -->|"LEE"| t3
  a2 --> o8
  o8 -->|"ACTUALIZA"| t7
  o8 -->|"LEE"| t7
  a2 --> o9
  o9 -->|"CREA"| t5
  o9 -->|"LEE"| t5
  a2 --> o10
  o10 -->|"ACTUALIZA"| t5
  o10 -->|"LEE"| t5
  a2 --> o11
  o11 -->|"CREA"| t12
  o11 -->|"LEE"| t12
  o11 -->|"LEE"| t13
  a2 --> o14
  o14 -->|"CREA"| t13
  o14 -->|"LEE"| t13
  a2 --> o15
  o15 -->|"ACTUALIZA"| t12
  o15 -->|"LEE"| t12
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
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"dto.primaryTenantId === dto.participatingTenantId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED El tenant primario y el participante deben ser distintos"]):::error
  n5 -->|"sí"| n6
  n7["Llama a OrganizationDataBoundariesRepository.countActiveForTenant"]:::llamada
  n5 -->|"no"| n7
  n8[("LEE organization_extensions.organization_data_boundaries")]:::efecto
  n7 --> n8
  n9{"boundaries === 0"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED El tenant participante no tiene una frontera de datos activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a OrganizationAffiliationsRepository.findActiveDuplicate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE organization_extensions.organization_affiliations")]:::efecto
  n11 --> n12
  n13{"duplicate"}:::decision
  n12 --> n13
  n14(["409 CONFLICT Ya existe una afiliación activa de ese tipo"]):::error
  n13 -->|"sí"| n14
  n15["Llama a OrganizationAffiliationsRepository.create"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA organization_extensions.organization_affiliations")]:::efecto
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

#### 2. POST /orgext/affiliations/{id}/terminate

Terminar afiliación y revocar acceso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Afiliación no encontrada |
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
  n5["Llama a OrganizationAffiliationsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.organization_affiliations")]:::efecto
  n5 --> n6
  n7{"!affiliation"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Afiliación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"affiliation.statusConceptId !== ORGEXT.AFFILIATION_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La afiliación no está activa"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA organization_extensions.organization_affiliations · ACTUALIZA organization_extensions.organization_…")]:::efecto
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
  n5["Llama a FacilityLicensesRepository.findByNumber"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.facility_licenses")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una licencia con ese número para el tipo indicado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a FacilityLicensesRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA organization_extensions.facility_licenses")]:::efecto
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

#### 5. POST /orgext/facility-licenses/{id}/verify

Verificar / rechazar licencia

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Licencia no encontrada |
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
  n5["Llama a FacilityLicensesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.facility_licenses")]:::efecto
  n5 --> n6
  n7{"!license"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Licencia no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"license.verificationStatusConceptId !== ORGEXT.LICENSE_PENDING"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La licencia no está en estado pendiente"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA organization_extensions.facility_licenses")]:::efecto
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
  n5["Llama a HospitalsRepository.findByTenantOrPractice"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.hospitals")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT El tenant o el practice ya está especializado como hospital"]):::error
  n7 -->|"sí"| n8
  n9["Llama a HospitalsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA organization_extensions.hospitals")]:::efecto
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

#### 7. POST /orgext/hospitals/{id}/activate

Activar hospital y publicar perfil

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Hospital no encontrado |
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
  n5["Llama a HospitalsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.hospitals")]:::efecto
  n5 --> n6
  n7{"!hospital"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Hospital no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"hospital.statusConceptId !== ORGEXT.HOSPITAL_DRAFT"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El hospital no está en estado borrador/inactivo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a FacilityLicensesRepository.countVerifiedForTenant"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE organization_extensions.facility_licenses")]:::efecto
  n11 --> n12
  n13{"verifiedCount === 0"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED El hospital no tiene ninguna licencia de instalación verificada"]):::error
  n13 -->|"sí"| n14
  n15[("ACTUALIZA organization_extensions.hospitals")]:::efecto
  n13 -->|"no"| n15
  n16{"dto.primaryPracticeSiteId"}:::decision
  n15 --> n16
  n17[("ACTUALIZA organization_extensions.hospitals")]:::efecto
  n16 -->|"sí"| n17
  n18[("ACTUALIZA organization_extensions.hospitals")]:::efecto
  n17 --> n18
  n16 -->|"no"| n18
  n19{"dto.publicProfileId"}:::decision
  n18 --> n19
  n20[("ACTUALIZA organization_extensions.hospitals")]:::efecto
  n19 -->|"sí"| n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  n19 -->|"no"| n21
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Hospital no encontrado |
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
  n5["Llama a HospitalsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.hospitals")]:::efecto
  n5 --> n6
  n7{"!hospital"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Hospital no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"hospital.statusConceptId !== ORGEXT.HOSPITAL_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El hospital no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a HospitalServiceLinesRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA organization_extensions.hospital_service_lines")]:::efecto
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
  n5["Llama a HospitalServiceLinesRepository.findByIdForHospital"]:::llamada
  n4 --> n5
  n6[("LEE organization_extensions.hospital_service_lines")]:::efecto
  n5 --> n6
  n7{"!line"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Línea de servicio no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"line.statusConceptId !== ORGEXT.SERVICE_LINE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La línea de servicio no está activa"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA organization_extensions.hospital_service_lines")]:::efecto
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

