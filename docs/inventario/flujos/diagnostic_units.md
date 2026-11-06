<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `diagnostic_units`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 24 (20 con decisiones propias, 4 sin ellas)
- Inventario de endpoints del módulo: [diagnostic_units](../endpoints/diagnostic_units.md)

## Proceso: Módulo 23 — Diagnostic Units, Studies, Specialists and Prices

- **Código:** `diagnostic_units` · **Agrupación:** MIXTO · **Operaciones:** 24
- **Actores:** Cualquier sesión válida · SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/diagnostic_units/README.md`

### Para qué sirve

Gestión del ciclo de vida de **unidades diagnósticas** (laboratorios, imagenología): sus sitios operativos, especialidades, ofertas de estudio (paneles), cronogramas y versiones de precio (append-only), equipamiento/calibración, acreditaciones y asignación de especialistas; más la reproyección del perfil público.

_Fuente: `src/modules/diagnostic_units/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `Directorio P3` | Listar unidades activas y verificadas del tenant activo | GET /diagnostic-units | Cualquier sesión válida | BAJO | 5 |
|  |  | GET /diagnostic-units/{id} | Cualquier sesión válida | BAJO | 10 |
| `UC-23-01` | Alta de unidad con sitios (1..N) y acreditaciones (0..N) | POST /diagnostic-units | SECURITY_ADMIN | MEDIO | 4 |
| `UC-23-02` | Actualizar sitio | PATCH /diagnostic-unit-sites/{siteId} | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /diagnostic-units/{id}/sites | SECURITY_ADMIN | MEDIO | 2 |
| `UC-23-03` | Verificar y publicar perfil público | POST /diagnostic-units/{id}/verify-and-publish | SECURITY_ADMIN | MEDIO | 9 |
| `UC-23-04` | Declarar especialidades (upsert + soft-close) | PUT /diagnostic-units/{id}/specialties | SECURITY_ADMIN | MEDIO | 4 |
| `UC-23-05` | Publicar oferta con componentes (panel) | POST /diagnostic-units/{id}/study-offerings | SECURITY_ADMIN | MEDIO | 5 |
| `UC-23-06` | Crear cronograma de precios | POST /diagnostic-units/{id}/price-schedules | SECURITY_ADMIN | MEDIO | 4 |
| `UC-23-07` | Fijar/versionar precio (append-only) | POST /price-schedules/{scheduleId}/study-prices | SECURITY_ADMIN | MEDIO | 6 |
| `UC-23-08` | Retirar (soft-delete) oferta | DELETE /diagnostic-study-offerings/{id} | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /study-prices/{priceId}/close | SECURITY_ADMIN | MEDIO | 4 |
| `UC-23-09` | Actualizar estado/calibración de equipo | PATCH /diagnostic-equipment/{id} | Cualquier sesión válida | ALTO | 14 |
|  |  | POST /diagnostic-unit-sites/{siteId}/equipment | SECURITY_ADMIN | MEDIO | 5 |
| `UC-23-10` | Asignar especialista | POST /diagnostic-units/{id}/practitioner-assignments | SECURITY_ADMIN | MEDIO | 6 |
| `UC-23-11` | Renovar acreditación | POST /diagnostic-unit-accreditations/{id}/renew | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /diagnostic-units/{id}/accreditations | SECURITY_ADMIN | MEDIO | 3 |
| `UC-23-12` | Reconstruir proyección del perfil público | POST /diagnostic-units/{id}/reproject | SECURITY_ADMIN | BAJO | 1 |
| `ctrl:DiagnosticEquipmentController` | Operaciones de DiagnosticEquipmentController que el README no asigna a un caso de uso | GET /diagnostic-equipment/{id} | Cualquier sesión válida | BAJO | 12 |
|  |  | GET /diagnostic-equipment/{id}/mwl-station | Cualquier sesión válida | BAJO | 11 |
|  |  | POST /diagnostic-equipment/{id}/resource | Cualquier sesión válida | ALTO | 16 |
| `ctrl:DiagnosticUnitsController` | Operaciones de DiagnosticUnitsController que el README no asigna a un caso de uso | GET /diagnostic-units/{id}/administration | SECURITY_ADMIN | BAJO | 11 |
|  |  | GET /diagnostic-units/administration | SECURITY_ADMIN | BAJO | 5 |
|  |  | GET /diagnostic-units/search | Cualquier sesión válida | BAJO | 10 |

### Diagrama 1 de 2 — etapas `Directorio P3`, `UC-23-01`, `UC-23-02`…

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a15(["SECURITY_ADMIN"]):::actor
  t3[("diagnostic_units.diagnostic_equipment")]:::tabla
  t4[("diagnostic_units.diagnostic_study_offerings")]:::tabla
  t5[("diagnostic_units.diagnostic_unit_sites")]:::tabla
  t6[("diagnostic_units.diagnostic_units")]:::tabla
  t7[("terminology.catalog_concepts")]:::tabla
  t9[("common.addresses")]:::tabla
  t10[("diagnostic_units.diagnostic_price_schedules")]:::tabla
  t11[("diagnostic_units.diagnostic_study_prices")]:::tabla
  t12[("diagnostic_units.diagnostic_unit_accreditations")]:::tabla
  t19[("community.public_profiles")]:::tabla
  t20[("diagnostic_units.diagnostic_unit_specialties")]:::tabla
  t24[("diagnostic_units.diagnostic_study_components")]:::tabla
  t30[("delegated_access.organization_user_assignments")]:::tabla
  t31[("directory.branch_memberships")]:::tabla
  t32[("directory.tenant_memberships")]:::tabla
  e34>"diagnostic_units.equipment.located"]:::evento
  e35>"diagnostic_units.equipment.status_changed"]:::evento
  t38[("diagnostic_units.diagnostic_unit_practitioner_ass…")]:::tabla
  t13[("+4 tablas más")]
  subgraph s0["Directorio P3 · Listar unidades activas y verificadas del tenant activo"]
    o1["GET /diagnostic-units"]:::op
    o8["GET /diagnostic-units/{id}"]:::op
  end
  subgraph s1["UC-23-01 · Alta de unidad con sitios (1..N) y acreditaciones (0..N)"]
    o14["POST /diagnostic-units"]:::op
  end
  subgraph s2["UC-23-02 · Actualizar sitio"]
    o16["PATCH /diagnostic-unit-sites/{siteId}"]:::op
    o17["POST /diagnostic-units/{id}/sites"]:::op
  end
  t21[("+3 tablas más")]
  subgraph s3["UC-23-03 · Verificar y publicar perfil público"]
    o18["POST /diagnostic-units/{id}/verify-and-publish"]:::op
  end
  subgraph s4["UC-23-04 · Declarar especialidades (upsert + soft-close)"]
    o22["PUT /diagnostic-units/{id}/specialties"]:::op
  end
  subgraph s5["UC-23-05 · Publicar oferta con componentes (panel)"]
    o23["POST /diagnostic-units/{id}/study-offerings"]:::op
  end
  subgraph s6["UC-23-06 · Crear cronograma de precios"]
    o25["POST /diagnostic-units/{id}/price-schedules"]:::op
  end
  subgraph s7["UC-23-07 · Fijar/versionar precio (append-only)"]
    o26["POST /price-schedules/{scheduleId}/study-prices"]:::op
  end
  subgraph s8["UC-23-08 · Retirar (soft-delete) oferta"]
    o27["DELETE /diagnostic-study-offerings/{id}"]:::op
    o28["POST /study-prices/{priceId}/close"]:::op
  end
  t33[("+8 tablas más")]
  subgraph s9["UC-23-09 · Actualizar estado/calibración de equipo"]
    o29["PATCH /diagnostic-equipment/{id}"]:::op
    o36["POST /diagnostic-unit-sites/{siteId}/equipment"]:::op
  end
  subgraph s10["UC-23-10 · Asignar especialista"]
    o37["POST /diagnostic-units/{id}/practitioner-assignments"]:::op
  end
  subgraph s11["UC-23-11 · Renovar acreditación"]
    o39["POST /diagnostic-unit-accreditations/{id}/renew"]:::op
    o40["POST /diagnostic-units/{id}/accreditations"]:::op
  end
  subgraph s12["UC-23-12 · Reconstruir proyección del perfil público"]
    o41["POST /diagnostic-units/{id}/reproject"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  a2 --> o8
  o8 -->|"LEE"| t9
  o8 -->|"LEE"| t3
  o8 -->|"LEE"| t10
  o8 -->|"LEE"| t4
  o8 -->|"LEE"| t11
  o8 -->|"LEE"| t12
  o8 -.-> t13
  a15 --> o14
  o14 -->|"CREA"| t12
  o14 -->|"CREA"| t5
  o14 -->|"CREA"| t6
  o14 -->|"LEE"| t6
  a15 --> o16
  o16 -->|"ACTUALIZA"| t5
  o16 -->|"LEE"| t5
  o16 -->|"LEE"| t6
  a15 --> o17
  o17 -->|"CREA"| t5
  o17 -->|"LEE"| t6
  a15 --> o18
  o18 -->|"ACTUALIZA"| t19
  o18 -->|"CREA"| t19
  o18 -->|"LEE"| t19
  o18 -->|"ACTUALIZA"| t12
  o18 -->|"LEE"| t5
  o18 -->|"ACTUALIZA"| t20
  o18 -.-> t21
  a15 --> o22
  o22 -->|"ACTUALIZA"| t20
  o22 -->|"CREA"| t20
  o22 -->|"LEE"| t20
  o22 -->|"LEE"| t6
  a15 --> o23
  o23 -->|"CREA"| t24
  o23 -->|"CREA"| t4
  o23 -->|"LEE"| t4
  o23 -->|"LEE"| t5
  o23 -->|"LEE"| t6
  a15 --> o25
  o25 -->|"CREA"| t10
  o25 -->|"LEE"| t10
  o25 -->|"LEE"| t5
  o25 -->|"LEE"| t6
  a15 --> o26
  o26 -->|"LEE"| t10
  o26 -->|"LEE"| t4
  o26 -->|"ACTUALIZA"| t11
  o26 -->|"CREA"| t11
  o26 -->|"LEE"| t11
  o26 -->|"LEE"| t6
  a15 --> o27
  o27 -->|"ACTUALIZA"| t4
  o27 -->|"LEE"| t4
  o27 -->|"LEE"| t6
  a15 --> o28
  o28 -->|"LEE"| t10
  o28 -->|"ACTUALIZA"| t11
  o28 -->|"LEE"| t11
  o28 -->|"LEE"| t6
  a2 --> o29
  o29 -->|"LEE"| t30
  o29 -->|"LEE"| t3
  o29 -->|"LEE"| t5
  o29 -->|"LEE"| t6
  o29 -->|"LEE"| t31
  o29 -->|"LEE"| t32
  o29 -.-> t33
  o29 -->|"evento"| e34
  o29 -->|"evento"| e35
  a15 --> o36
  o36 -->|"CREA"| t3
  o36 -->|"LEE"| t3
  o36 -->|"ACTUALIZA"| t5
  o36 -->|"LEE"| t5
  o36 -->|"LEE"| t6
  a15 --> o37
  o37 -->|"CREA"| t38
  o37 -->|"LEE"| t38
  o37 -->|"LEE"| t5
  o37 -->|"CREA"| t20
  o37 -->|"LEE"| t20
  o37 -->|"LEE"| t6
  a15 --> o39
  o39 -->|"ACTUALIZA"| t12
  o39 -->|"CREA"| t12
  o39 -->|"LEE"| t12
  o39 -->|"LEE"| t6
  a15 --> o40
  o40 -->|"CREA"| t12
  o40 -->|"LEE"| t5
  o40 -->|"LEE"| t6
  a15 --> o41
  o41 -->|"LEE"| t6
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:DiagnosticEquipmentController`, `ctrl:DiagnosticUnitsController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a16(["SECURITY_ADMIN"]):::actor
  t3[("delegated_access.organization_user_assignments")]:::tabla
  t4[("diagnostic_units.diagnostic_equipment")]:::tabla
  t5[("diagnostic_units.diagnostic_unit_sites")]:::tabla
  t6[("diagnostic_units.diagnostic_units")]:::tabla
  t7[("directory.branch_memberships")]:::tabla
  t8[("directory.tenant_memberships")]:::tabla
  e14>"diagnostic_units.equipment.resource_linked"]:::evento
  t17[("diagnostic_units.diagnostic_price_schedules")]:::tabla
  t18[("diagnostic_units.diagnostic_study_offerings")]:::tabla
  t19[("diagnostic_units.diagnostic_study_prices")]:::tabla
  t20[("diagnostic_units.diagnostic_unit_accreditations")]:::tabla
  t21[("diagnostic_units.diagnostic_unit_practitioner_ass…")]:::tabla
  t24[("terminology.catalog_concepts")]:::tabla
  t26[("common.addresses")]:::tabla
  t27[("community.service_reviews")]:::tabla
  t9[("+6 tablas más")]
  t11[("+5 tablas más")]
  t13[("+10 tablas más")]
  subgraph s0["ctrl:DiagnosticEquipmentController · Operaciones de DiagnosticEquipmentControll…"]
    o1["GET /diagnostic-equipment/{id}"]:::op
    o10["GET /diagnostic-equipment/{id}/mwl-station"]:::op
    o12["POST /diagnostic-equipment/{id}/resource"]:::op
  end
  t22[("+5 tablas más")]
  t28[("+4 tablas más")]
  subgraph s1["ctrl:DiagnosticUnitsController · Operaciones de DiagnosticUnitsController que e…"]
    o15["GET /diagnostic-units/{id}/administration"]:::op
    o23["GET /diagnostic-units/administration"]:::op
    o25["GET /diagnostic-units/search"]:::op
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
  o10 -->|"LEE"| t3
  o10 -->|"LEE"| t4
  o10 -->|"LEE"| t5
  o10 -->|"LEE"| t6
  o10 -->|"LEE"| t7
  o10 -->|"LEE"| t8
  o10 -.-> t11
  a2 --> o12
  o12 -->|"LEE"| t3
  o12 -->|"LEE"| t4
  o12 -->|"LEE"| t5
  o12 -->|"LEE"| t6
  o12 -->|"LEE"| t7
  o12 -->|"LEE"| t8
  o12 -.-> t13
  o12 -->|"evento"| e14
  a16 --> o15
  o15 -->|"LEE"| t4
  o15 -->|"LEE"| t17
  o15 -->|"LEE"| t18
  o15 -->|"LEE"| t19
  o15 -->|"LEE"| t20
  o15 -->|"LEE"| t21
  o15 -.-> t22
  a16 --> o23
  o23 -->|"LEE"| t4
  o23 -->|"LEE"| t18
  o23 -->|"LEE"| t5
  o23 -->|"LEE"| t6
  o23 -->|"LEE"| t24
  a2 --> o25
  o25 -->|"LEE"| t26
  o25 -->|"LEE"| t27
  o25 -->|"LEE"| t4
  o25 -->|"LEE"| t17
  o25 -->|"LEE"| t18
  o25 -->|"LEE"| t19
  o25 -.-> t28
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /diagnostic-equipment/{id}

Detalle de un equipo con su sala (F5a)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a EquipmentF5aService.detail"]:::llamada
  n2 --> n3
  n4["Llama a EquipmentF5aService.authorize"]:::llamada
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.equipment"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticEquipmentRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_unit_sites · LEE diagnostic_units.diagnostic_units · LEE practice.practice_si…")]:::efecto
  n7 --> n8
  n9{"equipment.careSpaceId"}:::decision
  n8 --> n9
  n10["Llama a InfrastructureAccessService.assertCan"]:::llamada
  n9 -->|"sí"| n10
  n11["Llama a InfrastructureAccessService.resolve"]:::llamada
  n10 --> n11
  n12{"'careSpaceId' in target"}:::decision
  n11 --> n12
  n13{"!found || found.tenantId !== tenantId"}:::decision
  n12 -->|"sí"| n13
  n14(["404 NOT_FOUND Espacio no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"'unitId' in target"}:::decision
  n12 -->|"no"| n15
  n16{"!found || found.tenantId !== tenantId"}:::decision
  n15 -->|"sí"| n16
  n17(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n16 -->|"sí"| n17
  n18{"!site || site.tenantId !== tenantId"}:::decision
  n13 -->|"no"| n18
  n16 -->|"no"| n18
  n15 -->|"no"| n18
  n19(["404 NOT_FOUND Sitio no encontrado"]):::error
  n18 -->|"sí"| n19
  n20["Llama a InfrastructureAccessService.decide"]:::llamada
  n18 -->|"no"| n20
  n21(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n20 --> n21
  n22["Llama a InfrastructureAccessService.assertSiteLevel"]:::llamada
  n9 -->|"no"| n22
  n23["Llama a InfrastructureAccessService.resolve"]:::llamada
  n22 --> n23
  n24{"'careSpaceId' in target"}:::decision
  n23 --> n24
  n25{"!found || found.tenantId !== tenantId"}:::decision
  n24 -->|"sí"| n25
  n26(["404 NOT_FOUND Espacio no encontrado"]):::error
  n25 -->|"sí"| n26
  n27{"'unitId' in target"}:::decision
  n24 -->|"no"| n27
  n28{"!found || found.tenantId !== tenantId"}:::decision
  n27 -->|"sí"| n28
  n29(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n28 -->|"sí"| n29
  n30{"!site || site.tenantId !== tenantId"}:::decision
  n25 -->|"no"| n30
  n28 -->|"no"| n30
  n27 -->|"no"| n30
  n31(["404 NOT_FOUND Sitio no encontrado"]):::error
  n30 -->|"sí"| n31
  n32["Llama a InfrastructureAccessService.decide"]:::llamada
  n30 -->|"no"| n32
  n33(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n32 --> n33
  n34["Llama a EquipmentF5aService.view"]:::llamada
  n35[("LEE terminology.catalog_concepts · LEE practice.care_spaces")]:::efecto
  n34 --> n35
  n36(("200 Responde con éxito")):::ok
  n35 --> n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. PATCH /diagnostic-equipment/{id}

Actualizar estado/calibración de un equipo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El AE Title ya está en uso en la sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sala es de otra sede; PreconditionFailedException: El espacio no aloja equipos; PreconditionFailedException: AE Title inválido (≤ 16 caracteres ASCII, sin barra invertida) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticEquipmentService.updateEquipment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EquipmentF5aService.authorize"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitScopeService.equipment"]:::llamada
  n5 --> n6
  n7["Llama a DiagnosticEquipmentRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n7 --> n8
  n9[("LEE diagnostic_units.diagnostic_unit_sites · LEE diagnostic_units.diagnostic_units · LEE practice.practice_si…")]:::efecto
  n8 --> n9
  n10{"equipment.careSpaceId"}:::decision
  n9 --> n10
  n11["Llama a InfrastructureAccessService.assertCan"]:::llamada
  n10 -->|"sí"| n11
  n12["Llama a InfrastructureAccessService.resolve"]:::llamada
  n11 --> n12
  n13{"'careSpaceId' in target"}:::decision
  n12 --> n13
  n14{"!found || found.tenantId !== tenantId"}:::decision
  n13 -->|"sí"| n14
  n15(["404 NOT_FOUND Espacio no encontrado"]):::error
  n14 -->|"sí"| n15
  n16{"'unitId' in target"}:::decision
  n13 -->|"no"| n16
  n17{"!found || found.tenantId !== tenantId"}:::decision
  n16 -->|"sí"| n17
  n18(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n17 -->|"sí"| n18
  n19{"!site || site.tenantId !== tenantId"}:::decision
  n14 -->|"no"| n19
  n17 -->|"no"| n19
  n16 -->|"no"| n19
  n20(["404 NOT_FOUND Sitio no encontrado"]):::error
  n19 -->|"sí"| n20
  n21["Llama a InfrastructureAccessService.decide"]:::llamada
  n19 -->|"no"| n21
  n22(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n21 --> n22
  n23["Llama a InfrastructureAccessService.assertSiteLevel"]:::llamada
  n10 -->|"no"| n23
  n24["Llama a InfrastructureAccessService.resolve"]:::llamada
  n23 --> n24
  n25{"'careSpaceId' in target"}:::decision
  n24 --> n25
  n26{"!found || found.tenantId !== tenantId"}:::decision
  n25 -->|"sí"| n26
  n27(["404 NOT_FOUND Espacio no encontrado"]):::error
  n26 -->|"sí"| n27
  n28{"'unitId' in target"}:::decision
  n25 -->|"no"| n28
  n29{"!found || found.tenantId !== tenantId"}:::decision
  n28 -->|"sí"| n29
  n30(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n29 -->|"sí"| n30
  n31{"!site || site.tenantId !== tenantId"}:::decision
  n26 -->|"no"| n31
  n29 -->|"no"| n31
  n28 -->|"no"| n31
  n32(["404 NOT_FOUND Sitio no encontrado"]):::error
  n31 -->|"sí"| n32
  n33["Llama a InfrastructureAccessService.decide"]:::llamada
  n31 -->|"no"| n33
  n34(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n33 --> n34
  n35{"dto.careSpaceId !== undefined"}:::decision
  n36{"dto.careSpaceId"}:::decision
  n35 -->|"sí"| n36
  n37["Llama a DiagnosticEquipmentService.assertRoom"]:::llamada
  n36 -->|"sí"| n37
  n38[("LEE diagnostic_units.diagnostic_unit_sites · LEE practice.care_spaces")]:::efecto
  n37 --> n38
  n39{"!row || row.tenant_id !== tenantId"}:::decision
  n38 --> n39
  n40(["404 NOT_FOUND Espacio no encontrado"]):::error
  n39 -->|"sí"| n40
  n41{"row.practice_site_id !== row.unit_practice_site_id"}:::decision
  n39 -->|"no"| n41
  n42(["422 PRECONDITION_FAILED La sala es de otra sede"]):::error
  n41 -->|"sí"| n42
  n43{"!code || !FUNCTION_PROFILE_BY_CODE.get(code)?.hostsEquipment"}:::decision
  n41 -->|"no"| n43
  n44(["422 PRECONDITION_FAILED El espacio no aloja equipos"]):::error
  n43 -->|"sí"| n44
  n45["Llama a EquipmentF5aService.authorizeDestination"]:::llamada
  n43 -->|"no"| n45
  n36 -->|"no"| n45
  n46{"!careSpaceId"}:::decision
  n45 --> n46
  n47["Llama a InfrastructureAccessService.assertSiteLevel"]:::llamada
  n46 -->|"sí"| n47
  n48["Llama a InfrastructureAccessService.resolve"]:::llamada
  n47 --> n48
  n49{"'careSpaceId' in target"}:::decision
  n48 --> n49
  n50{"!found || found.tenantId !== tenantId"}:::decision
  n49 -->|"sí"| n50
  n51(["404 NOT_FOUND Espacio no encontrado"]):::error
  n50 -->|"sí"| n51
  n52{"'unitId' in target"}:::decision
  n49 -->|"no"| n52
  n53{"!found || found.tenantId !== tenantId"}:::decision
  n52 -->|"sí"| n53
  n54(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n53 -->|"sí"| n54
  n55{"!site || site.tenantId !== tenantId"}:::decision
  n50 -->|"no"| n55
  n53 -->|"no"| n55
  n52 -->|"no"| n55
  n56(["404 NOT_FOUND Sitio no encontrado"]):::error
  n55 -->|"sí"| n56
  n57["Llama a InfrastructureAccessService.decide"]:::llamada
  n55 -->|"no"| n57
  n58(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n57 --> n58
  n59["Llama a InfrastructureAccessService.assertCan"]:::llamada
  n46 -->|"no"| n59
  n60["Llama a InfrastructureAccessService.resolve"]:::llamada
  n59 --> n60
  n61{"'careSpaceId' in target"}:::decision
  n60 --> n61
  n62{"!found || found.tenantId !== tenantId"}:::decision
  n61 -->|"sí"| n62
  n63(["404 NOT_FOUND Espacio no encontrado"]):::error
  n62 -->|"sí"| n63
  n64{"'unitId' in target"}:::decision
  n61 -->|"no"| n64
  n65{"!found || found.tenantId !== tenantId"}:::decision
  n64 -->|"sí"| n65
  n66(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n65 -->|"sí"| n66
  n67{"!site || site.tenantId !== tenantId"}:::decision
  n62 -->|"no"| n67
  n65 -->|"no"| n67
  n64 -->|"no"| n67
  n68(["404 NOT_FOUND Sitio no encontrado"]):::error
  n67 -->|"sí"| n68
  n69["Llama a InfrastructureAccessService.decide"]:::llamada
  n67 -->|"no"| n69
  n70(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n69 --> n70
  n71["… el resto del árbol (24 nodos) está en el JSON del inventario"]:::corte
  n35 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /diagnostic-equipment/{id}/mwl-station

Estación MWL del equipo (F5a)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a EquipmentF5aService.mwlStation"]:::llamada
  n2 --> n3
  n4["Llama a EquipmentF5aService.authorize"]:::llamada
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.equipment"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticEquipmentRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_unit_sites · LEE diagnostic_units.diagnostic_units · LEE practice.practice_si…")]:::efecto
  n7 --> n8
  n9{"equipment.careSpaceId"}:::decision
  n8 --> n9
  n10["Llama a InfrastructureAccessService.assertCan"]:::llamada
  n9 -->|"sí"| n10
  n11["Llama a InfrastructureAccessService.resolve"]:::llamada
  n10 --> n11
  n12{"'careSpaceId' in target"}:::decision
  n11 --> n12
  n13{"!found || found.tenantId !== tenantId"}:::decision
  n12 -->|"sí"| n13
  n14(["404 NOT_FOUND Espacio no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"'unitId' in target"}:::decision
  n12 -->|"no"| n15
  n16{"!found || found.tenantId !== tenantId"}:::decision
  n15 -->|"sí"| n16
  n17(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n16 -->|"sí"| n17
  n18{"!site || site.tenantId !== tenantId"}:::decision
  n13 -->|"no"| n18
  n16 -->|"no"| n18
  n15 -->|"no"| n18
  n19(["404 NOT_FOUND Sitio no encontrado"]):::error
  n18 -->|"sí"| n19
  n20["Llama a InfrastructureAccessService.decide"]:::llamada
  n18 -->|"no"| n20
  n21(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n20 --> n21
  n22["Llama a InfrastructureAccessService.assertSiteLevel"]:::llamada
  n9 -->|"no"| n22
  n23["Llama a InfrastructureAccessService.resolve"]:::llamada
  n22 --> n23
  n24{"'careSpaceId' in target"}:::decision
  n23 --> n24
  n25{"!found || found.tenantId !== tenantId"}:::decision
  n24 -->|"sí"| n25
  n26(["404 NOT_FOUND Espacio no encontrado"]):::error
  n25 -->|"sí"| n26
  n27{"'unitId' in target"}:::decision
  n24 -->|"no"| n27
  n28{"!found || found.tenantId !== tenantId"}:::decision
  n27 -->|"sí"| n28
  n29(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n28 -->|"sí"| n29
  n30{"!site || site.tenantId !== tenantId"}:::decision
  n25 -->|"no"| n30
  n28 -->|"no"| n30
  n27 -->|"no"| n30
  n31(["404 NOT_FOUND Sitio no encontrado"]):::error
  n30 -->|"sí"| n31
  n32["Llama a InfrastructureAccessService.decide"]:::llamada
  n30 -->|"no"| n32
  n33(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n32 --> n33
  n34[("LEE practice.care_spaces")]:::efecto
  n35(("200 Responde con éxito")):::ok
  n34 --> n35
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /diagnostic-equipment/{id}/resource

Crear el recurso agendable del equipo (F5a)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El equipo ya tiene un recurso agendable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a EquipmentF5aService.createResource"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a EquipmentF5aService.authorize"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitScopeService.equipment"]:::llamada
  n5 --> n6
  n7["Llama a DiagnosticEquipmentRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n7 --> n8
  n9[("LEE diagnostic_units.diagnostic_unit_sites · LEE diagnostic_units.diagnostic_units · LEE practice.practice_si…")]:::efecto
  n8 --> n9
  n10{"equipment.careSpaceId"}:::decision
  n9 --> n10
  n11["Llama a InfrastructureAccessService.assertCan"]:::llamada
  n10 -->|"sí"| n11
  n12["Llama a InfrastructureAccessService.resolve"]:::llamada
  n11 --> n12
  n13{"'careSpaceId' in target"}:::decision
  n12 --> n13
  n14{"!found || found.tenantId !== tenantId"}:::decision
  n13 -->|"sí"| n14
  n15(["404 NOT_FOUND Espacio no encontrado"]):::error
  n14 -->|"sí"| n15
  n16{"'unitId' in target"}:::decision
  n13 -->|"no"| n16
  n17{"!found || found.tenantId !== tenantId"}:::decision
  n16 -->|"sí"| n17
  n18(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n17 -->|"sí"| n18
  n19{"!site || site.tenantId !== tenantId"}:::decision
  n14 -->|"no"| n19
  n17 -->|"no"| n19
  n16 -->|"no"| n19
  n20(["404 NOT_FOUND Sitio no encontrado"]):::error
  n19 -->|"sí"| n20
  n21["Llama a InfrastructureAccessService.decide"]:::llamada
  n19 -->|"no"| n21
  n22(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n21 --> n22
  n23["Llama a InfrastructureAccessService.assertSiteLevel"]:::llamada
  n10 -->|"no"| n23
  n24["Llama a InfrastructureAccessService.resolve"]:::llamada
  n23 --> n24
  n25{"'careSpaceId' in target"}:::decision
  n24 --> n25
  n26{"!found || found.tenantId !== tenantId"}:::decision
  n25 -->|"sí"| n26
  n27(["404 NOT_FOUND Espacio no encontrado"]):::error
  n26 -->|"sí"| n27
  n28{"'unitId' in target"}:::decision
  n25 -->|"no"| n28
  n29{"!found || found.tenantId !== tenantId"}:::decision
  n28 -->|"sí"| n29
  n30(["404 NOT_FOUND Unidad clínica no encontrada"]):::error
  n29 -->|"sí"| n30
  n31{"!site || site.tenantId !== tenantId"}:::decision
  n26 -->|"no"| n31
  n29 -->|"no"| n31
  n28 -->|"no"| n31
  n32(["404 NOT_FOUND Sitio no encontrado"]):::error
  n31 -->|"sí"| n32
  n33["Llama a InfrastructureAccessService.decide"]:::llamada
  n31 -->|"no"| n33
  n34(["403 FORBIDDEN Su rol no permite esta acción sobre este espacio"]):::error
  n33 --> n34
  n35[("LEE scheduling.schedulable_resources")]:::efecto
  n36{"equipment.schedulableResourceId || existing"}:::decision
  n35 --> n36
  n37(["409 CONFLICT El equipo ya tiene un recurso agendable"]):::error
  n36 -->|"sí"| n37
  n38[("CREA scheduling.schedulable_resources")]:::efecto
  n36 -->|"no"| n38
  n39["Llama a OutboxService.publishDomainEvent"]:::llamada
  n38 --> n39
  n40["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n39 --> n40
  n41["Transacción: startActiveSpan(…)"]:::transaccion
  n40 --> n41
  n42["Intenta"]:::intento
  n41 --> n42
  n43(["↩ (relanza el error capturado)"]):::error
  n42 -->|"si falla"| n43
  n44["Llama a OutboxService.persistDomainEvent"]:::llamada
  n42 --> n44
  n45["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n44 --> n45
  n46[("LEE messaging.outbox_messages")]:::efecto
  n45 --> n46
  n47["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n46 --> n47
  n48[("CREA messaging.domain_events")]:::efecto
  n47 --> n48
  n49["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n48 --> n49
  n50[("CREA messaging.outbox_messages")]:::efecto
  n49 --> n50
  n51>"Evento diagnostic_units.equipment.resource_linked"]:::evento
  n50 --> n51
  n52(("201 Responde con éxito")):::ok
  n51 --> n52
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. DELETE /diagnostic-study-offerings/{id}

Retirar (soft-delete) una oferta de estudio

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La oferta ya está retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticStudiesService.retireOffering"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.offering"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticStudyOfferingsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n6 --> n7
  n8["Llama a DiagnosticUnitScopeService.viaUnit"]:::llamada
  n7 --> n8
  n9["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n9 --> n10
  n11{"offering.statusConceptId === DUNIT.OFFERING_RETIRED"}:::decision
  n10 --> n11
  n12(["409 CONFLICT La oferta ya está retirada"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA diagnostic_units.diagnostic_study_offerings")]:::efecto
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

#### 6. PATCH /diagnostic-unit-sites/{siteId}

Actualizar un sitio operativo de la unidad

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
  n3["Llama a DiagnosticUnitsService.updateSite"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.site"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitSitesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n6 --> n7
  n8["Llama a DiagnosticUnitScopeService.viaUnit"]:::llamada
  n7 --> n8
  n9["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n9 --> n10
  n11{"dto.siteRoleConceptId !== undefined"}:::decision
  n10 --> n11
  n12[("ACTUALIZA diagnostic_units.diagnostic_unit_sites")]:::efecto
  n11 -->|"sí"| n12
  n13{"dto.accessionPrefix !== undefined"}:::decision
  n12 --> n13
  n11 -->|"no"| n13
  n14[("ACTUALIZA diagnostic_units.diagnostic_unit_sites")]:::efecto
  n13 -->|"sí"| n14
  n15{"dto.sampleCollectionAvailable !== undefined"}:::decision
  n14 --> n15
  n13 -->|"no"| n15
  n16[("ACTUALIZA diagnostic_units.diagnostic_unit_sites")]:::efecto
  n15 -->|"sí"| n16
  n17{"dto.imagingAvailable !== undefined"}:::decision
  n16 --> n17
  n15 -->|"no"| n17
  n18[("ACTUALIZA diagnostic_units.diagnostic_unit_sites")]:::efecto
  n17 -->|"sí"| n18
  n19(("200 Responde con éxito")):::ok
  n18 --> n19
  n17 -->|"no"| n19
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /diagnostic-unit-sites/{siteId}/equipment

Registrar equipamiento y calibración del sitio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un equipo con ese número de serie en el sitio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sitio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticEquipmentService.addEquipment"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.site"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitSitesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n6 --> n7
  n8["Llama a DiagnosticUnitScopeService.viaUnit"]:::llamada
  n7 --> n8
  n9["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n9 --> n10
  n11{"site.statusConceptId !== DUNIT.SITE_ACTIVE"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED El sitio no está activo"]):::error
  n11 -->|"sí"| n12
  n13{"dto.serialNumber"}:::decision
  n11 -->|"no"| n13
  n14["Llama a DiagnosticEquipmentRepository.findBySerial"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n14 --> n15
  n16{"clash"}:::decision
  n15 --> n16
  n17(["409 CONFLICT Ya existe un equipo con ese número de serie en el sitio"]):::error
  n16 -->|"sí"| n17
  n18["Llama a DiagnosticEquipmentRepository.create"]:::llamada
  n16 -->|"no"| n18
  n13 -->|"no"| n18
  n19[("CREA diagnostic_units.diagnostic_equipment")]:::efecto
  n18 --> n19
  n20{"dto.modalityConceptId && !site.imagingAvailable"}:::decision
  n19 --> n20
  n21[("ACTUALIZA diagnostic_units.diagnostic_unit_sites")]:::efecto
  n20 -->|"sí"| n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
  n20 -->|"no"| n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /diagnostic-units

Alta de unidad diagnóstica con sitios y acreditaciones

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad no encontrada |
| 409 | `CONFLICT` | ConflictException: El código ya existe en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsService.create"]:::llamada
  n2 --> n3
  n4["Llama a DiagnosticUnitScopeService.activeTenantFor"]:::llamada
  n3 --> n4
  n5{"bodyTenantId !== undefined && bodyTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["404 NOT_FOUND Unidad no encontrada"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a DiagnosticUnitsRepository.findByCode"]:::llamada
  n7 --> n8
  n9[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n8 --> n9
  n10{"clash"}:::decision
  n9 --> n10
  n11(["409 CONFLICT El código ya existe en el tenant"]):::error
  n10 -->|"sí"| n11
  n12["Llama a DiagnosticUnitsRepository.create"]:::llamada
  n10 -->|"no"| n12
  n13[("CREA diagnostic_units.diagnostic_units")]:::efecto
  n12 --> n13
  n14["Repite: por cada const s de sites"]:::bucle
  n13 --> n14
  n15["Llama a DiagnosticUnitSitesRepository.create"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("CREA diagnostic_units.diagnostic_unit_sites")]:::efecto
  n15 --> n16
  n17["Repite: por cada const a de accreditations"]:::bucle
  n16 --> n17
  n14 -->|"al terminar"| n17
  n18["Llama a DiagnosticUnitAccreditationsRepository.create"]:::llamada
  n17 -->|"cada elemento"| n18
  n19[("CREA diagnostic_units.diagnostic_unit_accreditations")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  n17 -->|"al terminar"| n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. GET /diagnostic-units/{id}

Consultar el perfil de una unidad diagnóstica

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad diagnóstica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsReadService.getById"]:::llamada
  n2 --> n3
  n4["Llama a DiagnosticUnitsReadRepository.findVisibleById"]:::llamada
  n3 --> n4
  n5[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n4 --> n5
  n6{"!unit"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Unidad diagnóstica no encontrada"]):::error
  n6 -->|"sí"| n7
  n8["Llama a DiagnosticUnitsReadRepository.findActiveSites"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n8 --> n9
  n10["Llama a DiagnosticUnitsReadRepository.findActiveOfferings"]:::llamada
  n9 --> n10
  n11[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n10 --> n11
  n12["Llama a DiagnosticUnitsReadRepository.findCurrentPublicSchedules"]:::llamada
  n11 --> n12
  n13[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n12 --> n13
  n14["Llama a DiagnosticUnitsReadRepository.findCurrentAccreditations"]:::llamada
  n13 --> n14
  n15[("LEE diagnostic_units.diagnostic_unit_accreditations")]:::efecto
  n14 --> n15
  n16["Llama a DiagnosticUnitsReadRepository.findEquipment"]:::llamada
  n15 --> n16
  n17[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n16 --> n17
  n18["Llama a DiagnosticUnitsReadRepository.findCurrentPrices"]:::llamada
  n17 --> n18
  n19[("LEE diagnostic_units.diagnostic_study_prices")]:::efecto
  n18 --> n19
  n20["Llama a DiagnosticUnitsReadRepository.findPracticeSites"]:::llamada
  n19 --> n20
  n21[("LEE practice.practice_sites")]:::efecto
  n20 --> n21
  n22["Llama a DiagnosticUnitsReadRepository.findAddresses"]:::llamada
  n21 --> n22
  n23[("LEE common.addresses")]:::efecto
  n22 --> n23
  n24["Llama a DiagnosticUnitsReadRepository.findConcepts"]:::llamada
  n23 --> n24
  n25[("LEE terminology.catalog_concepts")]:::efecto
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

#### 10. POST /diagnostic-units/{id}/accreditations

Registrar una acreditación con evidencia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsService.addAccreditation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitsService.loadActiveUnit"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitScopeService.unit"]:::llamada
  n5 --> n6
  n7["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n7 --> n8
  n9{"unit.statusConceptId !== DUNIT.UNIT_ACTIVE"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED La unidad no está activa"]):::error
  n9 -->|"sí"| n10
  n11{"dto.diagnosticUnitSiteId"}:::decision
  n9 -->|"no"| n11
  n12["Llama a DiagnosticUnitScopeService.siteOfUnit"]:::llamada
  n11 -->|"sí"| n12
  n13["Llama a DiagnosticUnitScopeService.site"]:::llamada
  n12 --> n13
  n14["Llama a DiagnosticUnitSitesRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n14 --> n15
  n16{"site.diagnosticUnitId !== unitId"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Sitio no encontrado"]):::error
  n16 -->|"sí"| n17
  n18["Llama a DiagnosticUnitAccreditationsRepository.create"]:::llamada
  n16 -->|"no"| n18
  n11 -->|"no"| n18
  n19[("CREA diagnostic_units.diagnostic_unit_accreditations")]:::efecto
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

#### 11. GET /diagnostic-units/{id}/administration

Consola de administración de una unidad diagnóstica

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Unidad diagnóstica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsAdminReadService.getById"]:::llamada
  n2 --> n3
  n4["Llama a DiagnosticUnitsAdminReadRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n4 --> n5
  n6{"!unit"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Unidad diagnóstica no encontrada"]):::error
  n6 -->|"sí"| n7
  n8["Llama a DiagnosticUnitsAdminReadRepository.findSites"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n8 --> n9
  n10["Llama a DiagnosticUnitsAdminReadRepository.findOfferings"]:::llamada
  n9 --> n10
  n11[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n10 --> n11
  n12["Llama a DiagnosticUnitsAdminReadRepository.findPriceSchedules"]:::llamada
  n11 --> n12
  n13[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n12 --> n13
  n14["Llama a DiagnosticUnitsAdminReadRepository.findAccreditations"]:::llamada
  n13 --> n14
  n15[("LEE diagnostic_units.diagnostic_unit_accreditations")]:::efecto
  n14 --> n15
  n16["Llama a DiagnosticUnitsAdminReadRepository.findPractitionerAssignments"]:::llamada
  n15 --> n16
  n17[("LEE diagnostic_units.diagnostic_unit_practitioner_assignments")]:::efecto
  n16 --> n17
  n18["Llama a DiagnosticUnitsAdminReadRepository.findEquipment"]:::llamada
  n17 --> n18
  n19[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n18 --> n19
  n20["Llama a DiagnosticUnitsAdminReadRepository.findPrices"]:::llamada
  n19 --> n20
  n21[("LEE diagnostic_units.diagnostic_study_prices")]:::efecto
  n20 --> n21
  n22["Llama a DiagnosticUnitsAdminReadRepository.findPracticeSites"]:::llamada
  n21 --> n22
  n23[("LEE practice.practice_sites")]:::efecto
  n22 --> n23
  n24["Llama a DiagnosticUnitsAdminReadRepository.findRoleAssignments"]:::llamada
  n23 --> n24
  n25[("LEE practice.practitioner_role_assignments")]:::efecto
  n24 --> n25
  n26["Llama a DiagnosticUnitsAdminReadRepository.findConcepts"]:::llamada
  n25 --> n26
  n27[("LEE terminology.catalog_concepts")]:::efecto
  n26 --> n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /diagnostic-units/{id}/practitioner-assignments

Asignar un especialista a la unidad/sitio

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El profesional ya tiene una asignación activa en ese rol/sitio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsService.assignPractitioner"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitsService.loadActiveUnit"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitScopeService.unit"]:::llamada
  n5 --> n6
  n7["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n7 --> n8
  n9{"unit.statusConceptId !== DUNIT.UNIT_ACTIVE"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED La unidad no está activa"]):::error
  n9 -->|"sí"| n10
  n11{"dto.diagnosticUnitSiteId"}:::decision
  n9 -->|"no"| n11
  n12["Llama a DiagnosticUnitScopeService.siteOfUnit"]:::llamada
  n11 -->|"sí"| n12
  n13["Llama a DiagnosticUnitScopeService.site"]:::llamada
  n12 --> n13
  n14["Llama a DiagnosticUnitSitesRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n14 --> n15
  n16{"site.diagnosticUnitId !== unitId"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Sitio no encontrado"]):::error
  n16 -->|"sí"| n17
  n18["Llama a DiagnosticUnitPractitionerAssignmentsRepository.findActiveOverlap"]:::llamada
  n16 -->|"no"| n18
  n11 -->|"no"| n18
  n19[("LEE diagnostic_units.diagnostic_unit_practitioner_assignments")]:::efecto
  n18 --> n19
  n20{"overlap"}:::decision
  n19 --> n20
  n21(["409 CONFLICT El profesional ya tiene una asignación activa en ese rol/sitio"]):::error
  n20 -->|"sí"| n21
  n22["Llama a DiagnosticUnitPractitionerAssignmentsRepository.create"]:::llamada
  n20 -->|"no"| n22
  n23[("CREA diagnostic_units.diagnostic_unit_practitioner_assignments")]:::efecto
  n22 --> n23
  n24{"dto.specialtyConceptId"}:::decision
  n23 --> n24
  n25["Llama a DiagnosticUnitSpecialtiesRepository.findOpenByConcept"]:::llamada
  n24 -->|"sí"| n25
  n26[("LEE diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n25 --> n26
  n27{"!existing"}:::decision
  n26 --> n27
  n28["Llama a DiagnosticUnitSpecialtiesRepository.create"]:::llamada
  n27 -->|"sí"| n28
  n29[("CREA diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n28 --> n29
  n30(("201 Responde con éxito")):::ok
  n29 --> n30
  n27 -->|"no"| n30
  n24 -->|"no"| n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /diagnostic-units/{id}/price-schedules

Crear un cronograma de precios

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El código de cronograma ya existe en la unidad |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticPricingService.createSchedule"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.unit"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n6 --> n7
  n8{"dto.diagnosticUnitSiteId"}:::decision
  n7 --> n8
  n9["Llama a DiagnosticUnitScopeService.siteOfUnit"]:::llamada
  n8 -->|"sí"| n9
  n10["Llama a DiagnosticUnitScopeService.site"]:::llamada
  n9 --> n10
  n11["Llama a DiagnosticUnitSitesRepository.findById"]:::llamada
  n10 --> n11
  n12[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n11 --> n12
  n13{"site.diagnosticUnitId !== unitId"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Sitio no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"unit.statusConceptId !== DUNIT.UNIT_ACTIVE"}:::decision
  n13 -->|"no"| n15
  n8 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED La unidad no está activa"]):::error
  n15 -->|"sí"| n16
  n17["Llama a DiagnosticPriceSchedulesRepository.findByCode"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n17 --> n18
  n19{"clash"}:::decision
  n18 --> n19
  n20(["409 CONFLICT El código de cronograma ya existe en la unidad"]):::error
  n19 -->|"sí"| n20
  n21["Llama a DiagnosticPriceSchedulesRepository.create"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA diagnostic_units.diagnostic_price_schedules")]:::efecto
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

#### 14. POST /diagnostic-units/{id}/sites

Registrar un sitio operativo de la unidad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsService.addSite"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitsService.loadActiveUnit"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitScopeService.unit"]:::llamada
  n5 --> n6
  n7["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n7 --> n8
  n9{"unit.statusConceptId !== DUNIT.UNIT_ACTIVE"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED La unidad no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a DiagnosticUnitSitesRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA diagnostic_units.diagnostic_unit_sites")]:::efecto
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

#### 15. PUT /diagnostic-units/{id}/specialties

Declarar las especialidades de la unidad

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: A lo sumo una especialidad puede ser primaria; PreconditionFailedException: La unidad no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsService.setSpecialties"]:::llamada
  n2 --> n3
  n4{"primaries › 1"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED A lo sumo una especialidad puede ser primaria"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a DiagnosticUnitsService.loadActiveUnit"]:::llamada
  n6 --> n7
  n8["Llama a DiagnosticUnitScopeService.unit"]:::llamada
  n7 --> n8
  n9["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n9 --> n10
  n11{"unit.statusConceptId !== DUNIT.UNIT_ACTIVE"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La unidad no está activa"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DiagnosticUnitSpecialtiesRepository.findOpenForUnit"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n13 --> n14
  n15["Repite: por cada const existing de open"]:::bucle
  n14 --> n15
  n16{"!desired.has(existing.specialtyConceptId)"}:::decision
  n15 -->|"cada elemento"| n16
  n17[("ACTUALIZA diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n16 -->|"sí"| n17
  n18["Repite: por cada const item de dto.specialties"]:::bucle
  n17 --> n18
  n16 -->|"no"| n18
  n15 -->|"al terminar"| n18
  n19["Llama a DiagnosticUnitSpecialtiesRepository.findOpenByConcept"]:::llamada
  n18 -->|"cada elemento"| n19
  n20[("LEE diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n19 --> n20
  n21{"current"}:::decision
  n20 --> n21
  n22[("ACTUALIZA diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n21 -->|"sí"| n22
  n23["Llama a DiagnosticUnitSpecialtiesRepository.create"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n23 --> n24
  n25(("200 Responde con éxito")):::ok
  n22 --> n25
  n24 --> n25
  n18 -->|"al terminar"| n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /diagnostic-units/{id}/study-offerings

Publicar oferta de estudio con componentes (panel)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El código de estudio ya existe en la unidad |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa; PreconditionFailedException: Un panel no puede referenciarse a sí mismo como componente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticStudiesService.createOffering"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.unit"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n6 --> n7
  n8{"dto.diagnosticUnitSiteId"}:::decision
  n7 --> n8
  n9["Llama a DiagnosticUnitScopeService.siteOfUnit"]:::llamada
  n8 -->|"sí"| n9
  n10["Llama a DiagnosticUnitScopeService.site"]:::llamada
  n9 --> n10
  n11["Llama a DiagnosticUnitSitesRepository.findById"]:::llamada
  n10 --> n11
  n12[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n11 --> n12
  n13{"site.diagnosticUnitId !== unitId"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Sitio no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"unit.statusConceptId !== DUNIT.UNIT_ACTIVE"}:::decision
  n13 -->|"no"| n15
  n8 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED La unidad no está activa"]):::error
  n15 -->|"sí"| n16
  n17["Llama a DiagnosticStudyOfferingsRepository.findByStudyCode"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n17 --> n18
  n19{"clash"}:::decision
  n18 --> n19
  n20(["409 CONFLICT El código de estudio ya existe en la unidad"]):::error
  n19 -->|"sí"| n20
  n21["Repite: por cada const c de dto.components ?? []"]:::bucle
  n19 -->|"no"| n21
  n22["Llama a DiagnosticUnitScopeService.offering"]:::llamada
  n21 -->|"cada elemento"| n22
  n23["Llama a DiagnosticStudyOfferingsRepository.findById"]:::llamada
  n22 --> n23
  n24[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n23 --> n24
  n25["Llama a DiagnosticUnitScopeService.viaUnit"]:::llamada
  n24 --> n25
  n26["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n25 --> n26
  n27[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n26 --> n27
  n28["Llama a DiagnosticStudyOfferingsRepository.create"]:::llamada
  n27 --> n28
  n21 -->|"al terminar"| n28
  n29[("CREA diagnostic_units.diagnostic_study_offerings")]:::efecto
  n28 --> n29
  n30["Repite: por cada const c de components"]:::bucle
  n29 --> n30
  n31{"c.componentOfferingId === offering.id"}:::decision
  n30 -->|"cada elemento"| n31
  n32(["422 PRECONDITION_FAILED Un panel no puede referenciarse a sí mismo como componente"]):::error
  n31 -->|"sí"| n32
  n33["Llama a DiagnosticStudyComponentsRepository.create"]:::llamada
  n31 -->|"no"| n33
  n34[("CREA diagnostic_units.diagnostic_study_components")]:::efecto
  n33 --> n34
  n35(("201 Responde con éxito")):::ok
  n34 --> n35
  n30 -->|"al terminar"| n35
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /diagnostic-units/{id}/verify-and-publish

Verificar la unidad y publicar su perfil público

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La unidad no está activa; PreconditionFailedException: La unidad no tiene ningún sitio activo para publicar; PreconditionFailedException: El laboratorio no se publica hasta que la plataforma verifique a su organización con la matrícula del SEPREC, la licencia de funcionamiento y el certificado del SEDES |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticUnitsService.verifyAndPublish"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitsService.loadActiveUnit"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticUnitScopeService.unit"]:::llamada
  n5 --> n6
  n7["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n7 --> n8
  n9{"unit.statusConceptId !== DUNIT.UNIT_ACTIVE"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED La unidad no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a DiagnosticUnitSitesRepository.countActiveForUnit"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n11 --> n12
  n13{"activeSites ‹ 1"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La unidad no tiene ningún sitio activo para publicar"]):::error
  n13 -->|"sí"| n14
  n15["Llama a DiagnosticUnitsService.assertLaboratoryMayOperate"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE directory.tenants")]:::efecto
  n15 --> n16
  n17(["422 PRECONDITION_FAILED El laboratorio no se publica hasta que la plataforma verifique a su organización con…"]):::error
  n16 --> n17
  n18[("ACTUALIZA diagnostic_units.diagnostic_units")]:::efecto
  n19{"!unit.publicProfileId"}:::decision
  n18 --> n19
  n20["Llama a PublicProfileProjectionService.projectOrganization"]:::llamada
  n19 -->|"sí"| n20
  n21["Llama a PublicProfilesRepository.findByTarget"]:::llamada
  n20 --> n21
  n22[("LEE community.public_profiles")]:::efecto
  n21 --> n22
  n23{"existing"}:::decision
  n22 --> n23
  n24{"existing.visibilityConceptId == null && existing.statusConceptId === CONCEPTS.STATE_PENDING"}:::decision
  n23 -->|"sí"| n24
  n25[("ACTUALIZA community.public_profiles · ACTUALIZA community.public_profiles · ACTUALIZA community.public_profil…")]:::efecto
  n24 -->|"sí"| n25
  n26["Llama a PublicProfilesRepository.create"]:::llamada
  n25 --> n26
  n24 -->|"no"| n26
  n23 -->|"no"| n26
  n27[("CREA community.public_profiles")]:::efecto
  n26 --> n27
  n28[("ACTUALIZA diagnostic_units.diagnostic_units")]:::efecto
  n27 --> n28
  n29["Llama a DiagnosticUnitSpecialtiesRepository.verifyOpenForUnit"]:::llamada
  n28 --> n29
  n19 -->|"no"| n29
  n30[("ACTUALIZA diagnostic_units.diagnostic_unit_specialties")]:::efecto
  n29 --> n30
  n31["Llama a DiagnosticUnitAccreditationsRepository.verifyOpenForUnit"]:::llamada
  n30 --> n31
  n32[("ACTUALIZA diagnostic_units.diagnostic_unit_accreditations")]:::efecto
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

#### 18. GET /diagnostic-units/search

Buscar centros de diagnóstico, laboratorio e imagen

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
  n3{"query.studyConceptIds !== undefined"}:::decision
  n2 --> n3
  n4["Llama a DiagnosticUnitsSearchService.searchCoverage"]:::llamada
  n3 -->|"sí"| n4
  n5["Llama a DiagnosticUnitsReadRepository.findOfferedConcepts"]:::llamada
  n4 --> n5
  n6[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n5 --> n6
  n7["Llama a DiagnosticUnitsSearchService.restrictions"]:::llamada
  n6 --> n7
  n8{"query.studyCode !== undefined && query.studyCode !== ''"}:::decision
  n7 --> n8
  n9["Llama a DiagnosticUnitsReadRepository.findUnitIdsOfferingStudy"]:::llamada
  n8 -->|"sí"| n9
  n10[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n9 --> n10
  n11{"query.insurerTenantId !== undefined"}:::decision
  n10 --> n11
  n8 -->|"no"| n11
  n12["Llama a DiagnosticUnitsReadRepository.findUnitIdsWithInsurerAgreement"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n12 --> n13
  n14["Llama a DiagnosticUnitsReadRepository.countVisible"]:::llamada
  n13 --> n14
  n11 -->|"no"| n14
  n15[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n14 --> n15
  n16["Llama a DiagnosticUnitsReadRepository.searchVisible"]:::llamada
  n15 --> n16
  n17[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n16 --> n17
  n18["Llama a DiagnosticUnitsSearchService.project"]:::llamada
  n17 --> n18
  n19["Llama a DiagnosticUnitsReadRepository.findActiveSites"]:::llamada
  n18 --> n19
  n20[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n19 --> n20
  n21["Llama a DiagnosticUnitsReadRepository.findActiveOfferings"]:::llamada
  n20 --> n21
  n22[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n21 --> n22
  n23["Llama a DiagnosticUnitsReadRepository.findConcepts"]:::llamada
  n22 --> n23
  n24[("LEE terminology.catalog_concepts")]:::efecto
  n23 --> n24
  n25["Llama a DiagnosticUnitsReadRepository.findCurrentPublicSchedulesFor"]:::llamada
  n24 --> n25
  n26[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n25 --> n26
  n27["Llama a CommunityRatingsService.ratingsByProfiles"]:::llamada
  n26 --> n27
  n28["Llama a ReviewsRepository.averageByTargets"]:::llamada
  n27 --> n28
  n29[("LEE community.service_reviews")]:::efecto
  n28 --> n29
  n30["Llama a DiagnosticUnitsReadRepository.findEquipment"]:::llamada
  n29 --> n30
  n31[("LEE diagnostic_units.diagnostic_equipment")]:::efecto
  n30 --> n31
  n32["Llama a DiagnosticUnitsReadRepository.findCurrentPricesForSchedules"]:::llamada
  n31 --> n32
  n33[("LEE diagnostic_units.diagnostic_study_prices")]:::efecto
  n32 --> n33
  n34["Llama a DiagnosticUnitsReadRepository.findPracticeSites"]:::llamada
  n33 --> n34
  n35[("LEE practice.practice_sites")]:::efecto
  n34 --> n35
  n36["Llama a DiagnosticUnitsReadRepository.findAddresses"]:::llamada
  n35 --> n36
  n37[("LEE common.addresses")]:::efecto
  n36 --> n37
  n38["Llama a DiagnosticUnitsReadRepository.findConcepts"]:::llamada
  n37 --> n38
  n39[("LEE terminology.catalog_concepts")]:::efecto
  n38 --> n39
  n40["Llama a DiagnosticUnitsSearchService.mainSitePlaces"]:::llamada
  n39 --> n40
  n41["Llama a DiagnosticUnitsReadRepository.findActiveSites"]:::llamada
  n40 --> n41
  n42[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n41 --> n42
  n43["Llama a DiagnosticUnitsReadRepository.findPracticeSites"]:::llamada
  n42 --> n43
  n44[("LEE practice.practice_sites")]:::efecto
  n43 --> n44
  n45["Llama a DiagnosticUnitsReadRepository.findAddresses"]:::llamada
  n44 --> n45
  n46[("LEE common.addresses")]:::efecto
  n45 --> n46
  n47["Llama a DiagnosticUnitsSearchService.search"]:::llamada
  n46 --> n47
  n3 -->|"no"| n47
  n48["Llama a DiagnosticUnitsSearchService.restrictions"]:::llamada
  n47 --> n48
  n49{"query.studyCode !== undefined && query.studyCode !== ''"}:::decision
  n48 --> n49
  n50["Llama a DiagnosticUnitsReadRepository.findUnitIdsOfferingStudy"]:::llamada
  n49 -->|"sí"| n50
  n51[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n50 --> n51
  n52{"query.insurerTenantId !== undefined"}:::decision
  n51 --> n52
  n49 -->|"no"| n52
  n53["Llama a DiagnosticUnitsReadRepository.findUnitIdsWithInsurerAgreement"]:::llamada
  n52 -->|"sí"| n53
  n54[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n53 --> n54
  n55["Llama a DiagnosticUnitsReadRepository.searchVisible"]:::llamada
  n54 --> n55
  n52 -->|"no"| n55
  n56[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n55 --> n56
  n57["Llama a DiagnosticUnitsReadRepository.countVisible"]:::llamada
  n56 --> n57
  n58[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n57 --> n58
  n59["Llama a DiagnosticUnitsSearchService.project"]:::llamada
  n58 --> n59
  n60["Llama a DiagnosticUnitsReadRepository.findActiveSites"]:::llamada
  n59 --> n60
  n61[("LEE diagnostic_units.diagnostic_unit_sites")]:::efecto
  n60 --> n61
  n62["Llama a DiagnosticUnitsReadRepository.findActiveOfferings"]:::llamada
  n61 --> n62
  n63[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n62 --> n63
  n64["Llama a DiagnosticUnitsReadRepository.findConcepts"]:::llamada
  n63 --> n64
  n65[("LEE terminology.catalog_concepts")]:::efecto
  n64 --> n65
  n66["Llama a DiagnosticUnitsReadRepository.findCurrentPublicSchedulesFor"]:::llamada
  n65 --> n66
  n67[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n66 --> n67
  n68["Llama a CommunityRatingsService.ratingsByProfiles"]:::llamada
  n67 --> n68
  n69["Llama a ReviewsRepository.averageByTargets"]:::llamada
  n68 --> n69
  n70[("LEE community.service_reviews")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (10 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. POST /price-schedules/{scheduleId}/study-prices

Fijar/versionar el precio de un estudio (append-only)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El cronograma no está activo; PreconditionFailedException: La oferta no pertenece a la misma unidad que el cronograma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticPricingService.addStudyPrice"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.schedule"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticPriceSchedulesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n6 --> n7
  n8["Llama a DiagnosticUnitScopeService.viaUnit"]:::llamada
  n7 --> n8
  n9["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n8 --> n9
  n10[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n9 --> n10
  n11{"schedule.statusConceptId !== DUNIT.SCHEDULE_ACTIVE"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED El cronograma no está activo"]):::error
  n11 -->|"sí"| n12
  n13["Llama a DiagnosticUnitScopeService.offering"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a DiagnosticStudyOfferingsRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE diagnostic_units.diagnostic_study_offerings")]:::efecto
  n14 --> n15
  n16["Llama a DiagnosticUnitScopeService.viaUnit"]:::llamada
  n15 --> n16
  n17["Llama a DiagnosticUnitsRepository.findById"]:::llamada
  n16 --> n17
  n18[("LEE diagnostic_units.diagnostic_units")]:::efecto
  n17 --> n18
  n19{"offering.diagnosticUnitId !== schedule.diagnosticUnitId"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED La oferta no pertenece a la misma unidad que el cronograma"]):::error
  n19 -->|"sí"| n20
  n21["Llama a DiagnosticStudyPricesRepository.findActive"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE diagnostic_units.diagnostic_study_prices")]:::efecto
  n21 --> n22
  n23{"current"}:::decision
  n22 --> n23
  n24[("ACTUALIZA diagnostic_units.diagnostic_study_prices · ACTUALIZA diagnostic_units.diagnostic_study_prices")]:::efecto
  n23 -->|"sí"| n24
  n25["Llama a DiagnosticStudyPricesRepository.maxVersion"]:::llamada
  n24 --> n25
  n23 -->|"no"| n25
  n26[("LEE diagnostic_units.diagnostic_study_prices")]:::efecto
  n25 --> n26
  n27["Llama a DiagnosticStudyPricesRepository.create"]:::llamada
  n26 --> n27
  n28[("CREA diagnostic_units.diagnostic_study_prices")]:::efecto
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

#### 20. POST /study-prices/{priceId}/close

Cerrar una versión de precio vigente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede cerrar una versión de precio activa y aún abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DiagnosticPricingService.closePrice"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DiagnosticUnitScopeService.price"]:::llamada
  n4 --> n5
  n6["Llama a DiagnosticStudyPricesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE diagnostic_units.diagnostic_study_prices")]:::efecto
  n6 --> n7
  n8["Llama a DiagnosticUnitScopeService.notFound"]:::llamada
  n7 --> n8
  n9(["404 NOT_FOUND {message}"]):::error
  n8 --> n9
  n10{"!price"}:::decision
  n11["Llama a DiagnosticUnitScopeService.notFound"]:::llamada
  n10 -->|"sí"| n11
  n12(["404 NOT_FOUND {message}"]):::error
  n11 --> n12
  n13["Llama a DiagnosticUnitScopeService.schedule"]:::llamada
  n10 -->|"no"| n13
  n14["Llama a DiagnosticPriceSchedulesRepository.findById"]:::llamada
  n13 --> n14
  n15[("LEE diagnostic_units.diagnostic_price_schedules")]:::efecto
  n14 --> n15
  n16["Llama a DiagnosticUnitScopeService.notFound"]:::llamada
  n15 --> n16
  n17(["404 NOT_FOUND {message}"]):::error
  n16 --> n17
  n18{"price.statusConceptId !== DUNIT.PRICE_ACTIVE || price.effectiveTo"}:::decision
  n19(["422 PRECONDITION_FAILED Solo se puede cerrar una versión de precio activa y aún abierta"]):::error
  n18 -->|"sí"| n19
  n20[("ACTUALIZA diagnostic_units.diagnostic_study_prices · ACTUALIZA diagnostic_units.diagnostic_study_prices · ACT…")]:::efecto
  n18 -->|"no"| n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
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
| POST /diagnostic-unit-accreditations/{id}/renew | 201, 400, 401, 403, 429 | 4 |
| GET /diagnostic-units | 200, 401, 403, 429 | 5 |
| POST /diagnostic-units/{id}/reproject | 200, 400, 401, 403, 429 | 1 |
| GET /diagnostic-units/administration | 200, 401, 403, 429 | 5 |
