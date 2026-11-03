<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `read_models`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 15 (15 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [read_models](../endpoints/read_models.md)

## Proceso: Módulo 30 · Read Models (Frontend View Contracts & Read Models)

- **Código:** `read_models` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 15
- **Actores:** Cualquier sesión válida · Público (sin sesión) · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/read_models/README.md`

### Para qué sirve

Contratos versionados de read model, materialized views, contratos de vista de frontend (portal, ruta, vista y sus hijos), preferencias de usuario y una proyección pública de directorio. La administración de contratos y las consultas públicas usan identificadores/columnas constantes o validadas; la proyección de datos autenticada no ejecuta la materialized view ni pagina filas.

_Fuente: `src/modules/read_models/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-30-01` | Registrar y publicar un contrato versionado + dependencias upstream | POST /read-models/definitions | SECURITY_ADMIN | MEDIO | 3 |
| `UC-30-02` | Publicar contrato de vista (upsert portal/route + view + hijos) | POST /portals/{portalCode}/routes/{routeCode}/views | SECURITY_ADMIN | MEDIO | 12 |
| `UC-30-03` | Refresh manual de la MV (REFRESH CONCURRENTLY) | POST /read-models/{definitionId}/refresh | SECURITY_ADMIN | MEDIO | 2 |
| `UC-30-04` | Backfill inicial (FULL) de la MV | POST /read-models/{definitionId}/backfill | SECURITY_ADMIN | MEDIO | 2 |
| `UC-30-05` | Devuelve contrato, masking y staleness; actualmente data queda vacío | GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data | Cualquier sesión válida | BAJO | 30 |
| `UC-30-06` | Invalidar y recomputar tras cambio upstream | POST /read-models/{definitionId}/invalidate | SECURITY_ADMIN | MEDIO | 2 |
| `UC-30-07` | Reconciliar la MV divergente (result REPAIRED) | POST /read-models/{definitionId}/reconcile | SYSTEM · SECURITY_ADMIN | MEDIO | 2 |
| `UC-30-08` | Nueva versión N+1 en DRAFT (anterior sigue ACTIVE) | POST /read-models/definitions/{schema}/{object}/versions | SECURITY_ADMIN | MEDIO | 3 |
| `UC-30-09` | Preferencias de vista (validadas contra el allow-list) | PUT /views/{frontendPageViewId}/preferences | Cualquier sesión válida | ALTO | 5 |
| `UC-30-10` | Proyecciones públicas (sin PHI, sin sesión) | GET /public/{slug} | Público (sin sesión) | BAJO | 1 |
|  |  | GET /public/directory | Público (sin sesión) | BAJO | 1 |
| `UC-30-11` | Derivar available_actions_json (estado + permiso) | GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions | Cualquier sesión válida | BAJO | 25 |
| `UC-30-12` | Detectar staleness/degradación de las MV | GET /read-models/health | SYSTEM · SECURITY_ADMIN | BAJO | 2 |
| `UC-30-13` | Deprecar (ACTIVE→DEPRECATED) y retirar (guarda de FK) | DELETE /read-models/definitions/{id} | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /read-models/definitions/{id}/deprecate | SECURITY_ADMIN | MEDIO | 2 |

### Diagrama — etapas `UC-30-01`, `UC-30-02`, `UC-30-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a15(["Cualquier sesión válida"]):::actor
  a25(["SYSTEM · SECURITY_ADMIN"]):::actor
  a30(["Público (sin sesión)"]):::actor
  t3[("read_models.read_model_definitions")]:::tabla
  t4[("read_models.read_model_dependencies")]:::tabla
  t6[("read_models.frontend_page_views")]:::tabla
  t7[("read_models.frontend_routes")]:::tabla
  t8[("read_models.frontend_view_actions")]:::tabla
  t9[("read_models.frontend_view_fields")]:::tabla
  t12[("read_models.read_model_refresh_runs")]:::tabla
  t16[("authz.access_policies")]:::tabla
  t17[("authz.care_relationships")]:::tabla
  t18[("authz.clinical_access_grants")]:::tabla
  t19[("authz.field_permissions")]:::tabla
  t20[("authz.patient_legal_representations")]:::tabla
  t21[("authz.permissions")]:::tabla
  t28[("read_models.user_view_preferences")]:::tabla
  t31[("read_models.public_provider_directory")]:::tabla
  subgraph s0["UC-30-01 · Registrar y publicar un contrato versionado + dependencias upstream"]
    o1["POST /read-models/definitions"]:::op
  end
  t10[("+6 tablas más")]
  subgraph s1["UC-30-02 · Publicar contrato de vista (upsert portal/route + view + hijos)"]
    o5["POST /portals/{portalCode}/routes/{routeCode}/views"]:::op
  end
  subgraph s2["UC-30-03 · Refresh manual de la MV (REFRESH CONCURRENTLY)"]
    o11["POST /read-models/{definitionId}/refresh"]:::op
  end
  subgraph s3["UC-30-04 · Backfill inicial (FULL) de la MV"]
    o13["POST /read-models/{definitionId}/backfill"]:::op
  end
  t22[("+24 tablas más")]
  subgraph s4["UC-30-05 · Devuelve contrato, masking y staleness; actualmente data queda vacío"]
    o14["GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data"]:::op
  end
  subgraph s5["UC-30-06 · Invalidar y recomputar tras cambio upstream"]
    o23["POST /read-models/{definitionId}/invalidate"]:::op
  end
  subgraph s6["UC-30-07 · Reconciliar la MV divergente (result REPAIRED)"]
    o24["POST /read-models/{definitionId}/reconcile"]:::op
  end
  subgraph s7["UC-30-08 · Nueva versión N+1 en DRAFT (anterior sigue ACTIVE)"]
    o26["POST /read-models/definitions/{schema}/{object}/versions"]:::op
  end
  subgraph s8["UC-30-09 · Preferencias de vista (validadas contra el allow-list)"]
    o27["PUT /views/{frontendPageViewId}/preferences"]:::op
  end
  subgraph s9["UC-30-10 · Proyecciones públicas (sin PHI, sin sesión)"]
    o29["GET /public/{slug}"]:::op
    o32["GET /public/directory"]:::op
  end
  t34[("+19 tablas más")]
  subgraph s10["UC-30-11 · Derivar available_actions_json (estado + permiso)"]
    o33["GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions"]:::op
  end
  subgraph s11["UC-30-12 · Detectar staleness/degradación de las MV"]
    o35["GET /read-models/health"]:::op
  end
  subgraph s12["UC-30-13 · Deprecar (ACTIVE→DEPRECATED) y retirar (guarda de FK)"]
    o36["DELETE /read-models/definitions/{id}"]:::op
    o37["POST /read-models/definitions/{id}/deprecate"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"CREA"| t4
  a2 --> o5
  o5 -->|"CREA"| t6
  o5 -->|"LEE"| t6
  o5 -->|"CREA"| t7
  o5 -->|"LEE"| t7
  o5 -->|"CREA"| t8
  o5 -->|"CREA"| t9
  o5 -.-> t10
  a2 --> o11
  o11 -->|"LEE"| t3
  o11 -->|"CREA"| t12
  a2 --> o13
  o13 -->|"LEE"| t3
  o13 -->|"CREA"| t12
  a15 --> o14
  o14 -->|"LEE"| t16
  o14 -->|"LEE"| t17
  o14 -->|"LEE"| t18
  o14 -->|"LEE"| t19
  o14 -->|"LEE"| t20
  o14 -->|"LEE"| t21
  o14 -.-> t22
  a2 --> o23
  o23 -->|"LEE"| t3
  o23 -->|"CREA"| t12
  a25 --> o24
  o24 -->|"LEE"| t3
  o24 -->|"CREA"| t12
  a2 --> o26
  o26 -->|"CREA"| t3
  o26 -->|"LEE"| t3
  o26 -->|"CREA"| t4
  a15 --> o27
  o27 -->|"LEE"| t6
  o27 -->|"LEE"| t9
  o27 -->|"ACTUALIZA"| t28
  o27 -->|"CREA"| t28
  o27 -->|"LEE"| t28
  a30 --> o29
  o29 -->|"LEE"| t31
  a30 --> o32
  o32 -->|"LEE"| t31
  a15 --> o33
  o33 -->|"LEE"| t16
  o33 -->|"LEE"| t17
  o33 -->|"LEE"| t18
  o33 -->|"LEE"| t19
  o33 -->|"LEE"| t20
  o33 -->|"LEE"| t21
  o33 -.-> t34
  a25 --> o35
  o35 -->|"LEE"| t3
  o35 -->|"LEE"| t12
  a2 --> o36
  o36 -->|"LEE"| t6
  o36 -->|"ACTUALIZA"| t3
  o36 -->|"LEE"| t3
  a2 --> o37
  o37 -->|"ACTUALIZA"| t3
  o37 -->|"LEE"| t3
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /portals/{portalCode}/routes/{routeCode}/views

Publicar el contrato de una vista de página

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Definición de read model no encontrada |
| 409 | `CONFLICT` | ConflictException: La vista ya existe en esa ruta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición de read model no está ACTIVE |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a FrontendViewsService.publishViewContract"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Definición de read model no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"definition.statusConceptId !== RM.DEF_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La definición de read model no está ACTIVE"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PortalSurfacesRepository.findByCode"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE read_models.portal_surfaces")]:::efecto
  n11 --> n12
  n13{"!surface"}:::decision
  n12 --> n13
  n14["Llama a PortalSurfacesRepository.create"]:::llamada
  n13 -->|"sí"| n14
  n15[("CREA read_models.portal_surfaces")]:::efecto
  n14 --> n15
  n16["Llama a FrontendRoutesRepository.findBySurfaceAndCode"]:::llamada
  n15 --> n16
  n13 -->|"no"| n16
  n17[("LEE read_models.frontend_routes")]:::efecto
  n16 --> n17
  n18{"!route"}:::decision
  n17 --> n18
  n19["Llama a FrontendRoutesRepository.create"]:::llamada
  n18 -->|"sí"| n19
  n20[("CREA read_models.frontend_routes")]:::efecto
  n19 --> n20
  n21["Llama a FrontendPageViewsRepository.findByRouteAndCode"]:::llamada
  n20 --> n21
  n18 -->|"no"| n21
  n22[("LEE read_models.frontend_page_views")]:::efecto
  n21 --> n22
  n23{"clash"}:::decision
  n22 --> n23
  n24(["409 CONFLICT La vista ya existe en esa ruta"]):::error
  n23 -->|"sí"| n24
  n25["Llama a FrontendPageViewsRepository.create"]:::llamada
  n23 -->|"no"| n25
  n26[("CREA read_models.frontend_page_views")]:::efecto
  n25 --> n26
  n27["Repite: forEach(…)"]:::bucle
  n26 --> n27
  n28["Llama a FrontendViewChildrenRepository.createField"]:::llamada
  n27 -->|"cada elemento"| n28
  n29[("CREA read_models.frontend_view_fields")]:::efecto
  n28 --> n29
  n30["Repite: forEach(…)"]:::bucle
  n29 --> n30
  n27 -->|"al terminar"| n30
  n31["Llama a FrontendViewChildrenRepository.createSortOption"]:::llamada
  n30 -->|"cada elemento"| n31
  n32[("CREA read_models.frontend_view_sort_options")]:::efecto
  n31 --> n32
  n33["Repite: forEach(…)"]:::bucle
  n32 --> n33
  n30 -->|"al terminar"| n33
  n34["Llama a FrontendViewChildrenRepository.createAction"]:::llamada
  n33 -->|"cada elemento"| n34
  n35[("CREA read_models.frontend_view_actions")]:::efecto
  n34 --> n35
  n36["Repite: forEach(…)"]:::bucle
  n35 --> n36
  n33 -->|"al terminar"| n36
  n37["Llama a FrontendViewChildrenRepository.createKpi"]:::llamada
  n36 -->|"cada elemento"| n37
  n38[("CREA read_models.frontend_view_kpis")]:::efecto
  n37 --> n38
  n39["Repite: forEach(…)"]:::bucle
  n38 --> n39
  n36 -->|"al terminar"| n39
  n40["Llama a FrontendViewChildrenRepository.createState"]:::llamada
  n39 -->|"cada elemento"| n40
  n41[("CREA read_models.frontend_view_states")]:::efecto
  n40 --> n41
  n42(("201 Responde con éxito")):::ok
  n41 --> n42
  n39 -->|"al terminar"| n42
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions

Derivar available_actions_json (estado + permiso + purpose)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · parámetros de consulta (400)…"}}:::acceso
  n1 --> n2
  n3["Llama a FrontendViewsService.deriveAvailableActions"]:::llamada
  n2 --> n3
  n4["Llama a FrontendViewsService.resolveContract"]:::llamada
  n3 --> n4
  n5["Llama a PortalSurfacesRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE read_models.portal_surfaces")]:::efecto
  n5 --> n6
  n7{"!portal"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a FrontendRoutesRepository.findBySurfaceAndCode"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE read_models.frontend_routes")]:::efecto
  n9 --> n10
  n11{"!route"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a FrontendPageViewsRepository.findByRouteAndCode"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE read_models.frontend_page_views")]:::efecto
  n13 --> n14
  n15{"!view"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ViewContractAuthorizer.authorizeView"]:::llamada
  n15 -->|"no"| n17
  n18{"portal.statusConceptId !== CONCEPTS.STATE_ACTIVE || route.statusConceptId !== CONCEPTS.STATE_ACTIVE || view.s…"}:::decision
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"sí"| n19
  n20{"needsTenant && !request.tenantId"}:::decision
  n18 -->|"no"| n20
  n21(["↩ (relanza el error capturado)"]):::error
  n20 -->|"sí"| n21
  n22{"needsPatient"}:::decision
  n20 -->|"no"| n22
  n23{"!patientProfileId"}:::decision
  n22 -->|"sí"| n23
  n24(["↩ (relanza el error capturado)"]):::error
  n23 -->|"sí"| n24
  n25["Llama a ClinicalViewPatientAccess.canAccess"]:::llamada
  n23 -->|"no"| n25
  n26["Intenta"]:::intento
  n25 --> n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"si falla"| n27
  n28{"patientProfileId !== user.patientProfileId && !(await this.patients.canAccess(user, patientProfileId))"}:::decision
  n26 --> n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"sí"| n29
  n30{"route.featureFlagCode && !(await this.flags.isEnabled(route.featureFlagCode, request.tenantId))"}:::decision
  n28 -->|"no"| n30
  n22 -->|"no"| n30
  n31(["↩ (relanza el error capturado)"]):::error
  n30 -->|"sí"| n31
  n32{"!privileged"}:::decision
  n30 -->|"no"| n32
  n33["Llama a TerminologyViewAudienceGate.isInAudience"]:::llamada
  n32 -->|"sí"| n33
  n34[("LEE terminology.value_set_versions · LEE terminology.value_set_members · LEE terminology.catalog_concepts")]:::efecto
  n33 --> n34
  n35{"portal.audienceRoleValueSetId && !(await this.audience.isInAudience(user, portal.audienceRoleValueSetId))"}:::decision
  n34 --> n35
  n36(["↩ (relanza el error capturado)"]):::error
  n35 -->|"sí"| n36
  n37["Llama a AuthzViewPermissionGate.holds"]:::llamada
  n35 -->|"no"| n37
  n38["Llama a AuthzEffectiveRolesService.scopedAssignmentsForUser"]:::llamada
  n37 --> n38
  n39[("LEE authz.roles")]:::efecto
  n38 --> n39
  n40{"codes.length › 0"}:::decision
  n39 --> n40
  n41[("LEE authz.roles")]:::efecto
  n40 -->|"sí"| n41
  n42["Repite: mientras frontier.length › 0"]:::bucle
  n41 --> n42
  n43[("LEE authz.roles")]:::efecto
  n42 -->|"cada elemento"| n43
  n44[("LEE authz.role_permissions")]:::efecto
  n43 --> n44
  n42 -->|"al terminar"| n44
  n45[("LEE authz.user_permission_grants")]:::efecto
  n44 --> n45
  n40 -->|"no"| n45
  n46{"route.requiredPermissionId && !(await this.permissions.holds( user, request.tenantId, route.requiredPermissio…"}:::decision
  n45 --> n46
  n47(["↩ (relanza el error capturado)"]):::error
  n46 -->|"sí"| n47
  n48{"route.purposeOfUseConceptId && request.purposeOfUseConceptId !== route.purposeOfUseConceptId"}:::decision
  n46 -->|"no"| n48
  n32 -->|"no"| n48
  n49(["↩ (relanza el error capturado)"]):::error
  n48 -->|"sí"| n49
  n50["Llama a FrontendViewChildrenRepository.listActions"]:::llamada
  n48 -->|"no"| n50
  n51[("LEE read_models.frontend_view_actions")]:::efecto
  n50 --> n51
  n52["Llama a FrontendViewsService.deriveActionsFor"]:::llamada
  n51 --> n52
  n53["Repite: map(…)"]:::bucle
  n52 --> n53
  n54["Llama a ViewContractAuthorizer.actionPermitted"]:::llamada
  n53 -->|"cada elemento"| n54
  n55["Llama a AuthzViewPermissionGate.holds"]:::llamada
  n54 --> n55
  n56{"codes.length › 0"}:::decision
  n55 --> n56
  n57[("LEE authz.roles")]:::efecto
  n56 -->|"sí"| n57
  n58["Repite: mientras frontier.length › 0"]:::bucle
  n57 --> n58
  n59[("LEE authz.roles")]:::efecto
  n58 -->|"cada elemento"| n59
  n60[("LEE authz.role_permissions")]:::efecto
  n59 --> n60
  n58 -->|"al terminar"| n60
  n61[("LEE authz.user_permission_grants")]:::efecto
  n60 --> n61
  n56 -->|"no"| n61
  n62(("200 Responde con éxito")):::ok
  n61 --> n62
  n53 -->|"al terminar"| n62
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data

Servir el read model al frontend (consent-aware, masking heredado)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La proyección no está disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a FrontendViewsService.serveData"]:::llamada
  n2 --> n3
  n4["Llama a FrontendViewsService.resolveContract"]:::llamada
  n3 --> n4
  n5["Llama a PortalSurfacesRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE read_models.portal_surfaces")]:::efecto
  n5 --> n6
  n7{"!portal"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a FrontendRoutesRepository.findBySurfaceAndCode"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE read_models.frontend_routes")]:::efecto
  n9 --> n10
  n11{"!route"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a FrontendPageViewsRepository.findByRouteAndCode"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE read_models.frontend_page_views")]:::efecto
  n13 --> n14
  n15{"!view"}:::decision
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ViewContractAuthorizer.authorizeView"]:::llamada
  n15 -->|"no"| n17
  n18{"portal.statusConceptId !== CONCEPTS.STATE_ACTIVE || route.statusConceptId !== CONCEPTS.STATE_ACTIVE || view.s…"}:::decision
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"sí"| n19
  n20{"needsTenant && !request.tenantId"}:::decision
  n18 -->|"no"| n20
  n21(["↩ (relanza el error capturado)"]):::error
  n20 -->|"sí"| n21
  n22{"needsPatient"}:::decision
  n20 -->|"no"| n22
  n23{"!patientProfileId"}:::decision
  n22 -->|"sí"| n23
  n24(["↩ (relanza el error capturado)"]):::error
  n23 -->|"sí"| n24
  n25["Llama a ClinicalViewPatientAccess.canAccess"]:::llamada
  n23 -->|"no"| n25
  n26["Intenta"]:::intento
  n25 --> n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"si falla"| n27
  n28{"patientProfileId !== user.patientProfileId && !(await this.patients.canAccess(user, patientProfileId))"}:::decision
  n26 --> n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"sí"| n29
  n30{"route.featureFlagCode && !(await this.flags.isEnabled(route.featureFlagCode, request.tenantId))"}:::decision
  n28 -->|"no"| n30
  n22 -->|"no"| n30
  n31(["↩ (relanza el error capturado)"]):::error
  n30 -->|"sí"| n31
  n32{"!privileged"}:::decision
  n30 -->|"no"| n32
  n33["Llama a TerminologyViewAudienceGate.isInAudience"]:::llamada
  n32 -->|"sí"| n33
  n34[("LEE terminology.value_set_versions · LEE terminology.value_set_members · LEE terminology.catalog_concepts")]:::efecto
  n33 --> n34
  n35{"portal.audienceRoleValueSetId && !(await this.audience.isInAudience(user, portal.audienceRoleValueSetId))"}:::decision
  n34 --> n35
  n36(["↩ (relanza el error capturado)"]):::error
  n35 -->|"sí"| n36
  n37["Llama a AuthzViewPermissionGate.holds"]:::llamada
  n35 -->|"no"| n37
  n38["Llama a AuthzEffectiveRolesService.scopedAssignmentsForUser"]:::llamada
  n37 --> n38
  n39[("LEE authz.roles")]:::efecto
  n38 --> n39
  n40{"codes.length › 0"}:::decision
  n39 --> n40
  n41[("LEE authz.roles")]:::efecto
  n40 -->|"sí"| n41
  n42["Repite: mientras frontier.length › 0"]:::bucle
  n41 --> n42
  n43[("LEE authz.roles")]:::efecto
  n42 -->|"cada elemento"| n43
  n44[("LEE authz.role_permissions")]:::efecto
  n43 --> n44
  n42 -->|"al terminar"| n44
  n45[("LEE authz.user_permission_grants")]:::efecto
  n44 --> n45
  n40 -->|"no"| n45
  n46{"route.requiredPermissionId && !(await this.permissions.holds( user, request.tenantId, route.requiredPermissio…"}:::decision
  n45 --> n46
  n47(["↩ (relanza el error capturado)"]):::error
  n46 -->|"sí"| n47
  n48{"route.purposeOfUseConceptId && request.purposeOfUseConceptId !== route.purposeOfUseConceptId"}:::decision
  n46 -->|"no"| n48
  n32 -->|"no"| n48
  n49(["↩ (relanza el error capturado)"]):::error
  n48 -->|"sí"| n49
  n50["Llama a ViewContractAuthorizer.authorizedFields"]:::llamada
  n48 -->|"no"| n50
  n51["Repite: por cada const field de fields"]:::bucle
  n50 --> n51
  n52{"field.permissionId && !authorized.privileged"}:::decision
  n51 -->|"cada elemento"| n52
  n53{"allowed === undefined"}:::decision
  n52 -->|"sí"| n53
  n54["Llama a AuthzViewPermissionGate.holds"]:::llamada
  n53 -->|"sí"| n54
  n55["Llama a AuthzEffectiveRolesService.scopedAssignmentsForUser"]:::llamada
  n54 --> n55
  n56[("LEE authz.roles")]:::efecto
  n55 --> n56
  n57{"codes.length › 0"}:::decision
  n56 --> n57
  n58[("LEE authz.roles")]:::efecto
  n57 -->|"sí"| n58
  n59["Repite: mientras frontier.length › 0"]:::bucle
  n58 --> n59
  n60[("LEE authz.roles")]:::efecto
  n59 -->|"cada elemento"| n60
  n61[("LEE authz.role_permissions")]:::efecto
  n60 --> n61
  n59 -->|"al terminar"| n61
  n62[("LEE authz.user_permission_grants")]:::efecto
  n61 --> n62
  n57 -->|"no"| n62
  n63["Llama a FrontendViewChildrenRepository.listFields"]:::llamada
  n62 --> n63
  n53 -->|"no"| n63
  n52 -->|"no"| n63
  n51 -->|"al terminar"| n63
  n64[("LEE read_models.frontend_view_fields")]:::efecto
  n63 --> n64
  n65["Llama a FrontendViewChildrenRepository.listActions"]:::llamada
  n64 --> n65
  n66[("LEE read_models.frontend_view_actions")]:::efecto
  n65 --> n66
  n67["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n66 --> n67
  n68[("LEE read_models.read_model_definitions")]:::efecto
  n67 --> n68
  n69{"!definition"}:::decision
  n68 --> n69
  n70(["422 PRECONDITION_FAILED La proyección no está disponible"]):::error
  n69 -->|"sí"| n70
  n71["… el resto del árbol (62 nodos) está en el JSON del inventario"]:::corte
  n69 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /public/{slug}

Servir una proyección pública por slug

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
  n3["Llama a PublicProjectionsService.getBySlug"]:::llamada
  n2 --> n3
  n4["Intenta"]:::intento
  n3 --> n4
  n5[("LEE read_models.public_provider_directory")]:::efecto
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n4 -->|"si falla"| n6
  n7(("200 Responde con éxito")):::ok
  n5 --> n7
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /public/directory

Servir el directorio público (solo campos aprobados)

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
  n3["Llama a PublicProjectionsService.searchDirectory"]:::llamada
  n2 --> n3
  n4["Intenta"]:::intento
  n3 --> n4
  n5[("LEE read_models.public_provider_directory")]:::efecto
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n4 -->|"si falla"| n6
  n7(("200 Responde con éxito")):::ok
  n5 --> n7
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /read-models/{definitionId}/backfill

Backfill inicial de una nueva materialized view

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.backfill"]:::llamada
  n2 --> n3
  n4["Llama a ReadModelDefinitionsService.runRefresh"]:::llamada
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Read model no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"opts.requireMaterialized && !isMaterialized"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La operación requiere una materialized view"]):::error
  n9 -->|"sí"| n10
  n11{"definition.statusConceptId === RM.DEF_RETIRED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La versión está retirada"]):::error
  n11 -->|"sí"| n12
  n13{"isMaterialized"}:::decision
  n11 -->|"no"| n13
  n14["Llama a ReadModelDefinitionsService.resolveViewName"]:::llamada
  n13 -->|"sí"| n14
  n15{"!VIEW_IDENTIFIER.test(schema) || !VIEW_IDENTIFIER.test(object) || !VIEW_IDENTIFIER.test(`${schema}.${object}`)"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El nombre físico de la vista no es un identificador SQL válido"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ReadModelRefreshRunsRepository.create"]:::llamada
  n15 -->|"no"| n17
  n13 -->|"no"| n17
  n18[("CREA read_models.read_model_refresh_runs")]:::efecto
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

#### 7. POST /read-models/{definitionId}/invalidate

Invalidar y recomputar el read model tras cambio upstream

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.invalidate"]:::llamada
  n2 --> n3
  n4["Llama a ReadModelDefinitionsService.runRefresh"]:::llamada
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Read model no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"opts.requireMaterialized && !isMaterialized"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La operación requiere una materialized view"]):::error
  n9 -->|"sí"| n10
  n11{"definition.statusConceptId === RM.DEF_RETIRED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La versión está retirada"]):::error
  n11 -->|"sí"| n12
  n13{"isMaterialized"}:::decision
  n11 -->|"no"| n13
  n14["Llama a ReadModelDefinitionsService.resolveViewName"]:::llamada
  n13 -->|"sí"| n14
  n15{"!VIEW_IDENTIFIER.test(schema) || !VIEW_IDENTIFIER.test(object) || !VIEW_IDENTIFIER.test(`${schema}.${object}`)"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El nombre físico de la vista no es un identificador SQL válido"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ReadModelRefreshRunsRepository.create"]:::llamada
  n15 -->|"no"| n17
  n13 -->|"no"| n17
  n18[("CREA read_models.read_model_refresh_runs")]:::efecto
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

#### 8. POST /read-models/{definitionId}/reconcile

Reconciliar read model divergente contra la fuente canónica

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.reconcile"]:::llamada
  n2 --> n3
  n4["Llama a ReadModelDefinitionsService.runRefresh"]:::llamada
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Read model no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"opts.requireMaterialized && !isMaterialized"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La operación requiere una materialized view"]):::error
  n9 -->|"sí"| n10
  n11{"definition.statusConceptId === RM.DEF_RETIRED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La versión está retirada"]):::error
  n11 -->|"sí"| n12
  n13{"isMaterialized"}:::decision
  n11 -->|"no"| n13
  n14["Llama a ReadModelDefinitionsService.resolveViewName"]:::llamada
  n13 -->|"sí"| n14
  n15{"!VIEW_IDENTIFIER.test(schema) || !VIEW_IDENTIFIER.test(object) || !VIEW_IDENTIFIER.test(`${schema}.${object}`)"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El nombre físico de la vista no es un identificador SQL válido"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ReadModelRefreshRunsRepository.create"]:::llamada
  n15 -->|"no"| n17
  n13 -->|"no"| n17
  n18[("CREA read_models.read_model_refresh_runs")]:::efecto
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

#### 9. POST /read-models/{definitionId}/refresh

Refrescar la materialized view (REFRESH CONCURRENTLY, manual)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.refresh"]:::llamada
  n2 --> n3
  n4["Llama a ReadModelDefinitionsService.runRefresh"]:::llamada
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Read model no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"opts.requireMaterialized && !isMaterialized"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La operación requiere una materialized view"]):::error
  n9 -->|"sí"| n10
  n11{"definition.statusConceptId === RM.DEF_RETIRED"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La versión está retirada"]):::error
  n11 -->|"sí"| n12
  n13{"isMaterialized"}:::decision
  n11 -->|"no"| n13
  n14["Llama a ReadModelDefinitionsService.resolveViewName"]:::llamada
  n13 -->|"sí"| n14
  n15{"!VIEW_IDENTIFIER.test(schema) || !VIEW_IDENTIFIER.test(object) || !VIEW_IDENTIFIER.test(`${schema}.${object}`)"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El nombre físico de la vista no es un identificador SQL válido"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ReadModelRefreshRunsRepository.create"]:::llamada
  n15 -->|"no"| n17
  n13 -->|"no"| n17
  n18[("CREA read_models.read_model_refresh_runs")]:::efecto
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

#### 10. POST /read-models/definitions

Registrar y publicar un contrato de read model versionado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe esa versión del read model |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.createDefinition"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findBySchemaObjectVersion"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe esa versión del read model"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ReadModelDefinitionsRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA read_models.read_model_definitions")]:::efecto
  n9 --> n10
  n11["Repite: por cada const dep de dto.dependencies"]:::bucle
  n10 --> n11
  n12["Llama a ReadModelDependenciesRepository.create"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("CREA read_models.read_model_dependencies")]:::efecto
  n12 --> n13
  n14(("201 Responde con éxito")):::ok
  n13 --> n14
  n11 -->|"al terminar"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. DELETE /read-models/definitions/{id}

Retirar una versión de read model (guarda de FK)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede retirar: hay vistas apuntando a esta versión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.retire"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Read model no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a FrontendPageViewsRepository.countByDefinition"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE read_models.frontend_page_views")]:::efecto
  n9 --> n10
  n11{"referencing › 0"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED No se puede retirar: hay vistas apuntando a esta versión"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA read_models.read_model_definitions")]:::efecto
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

#### 12. POST /read-models/definitions/{id}/deprecate

Deprecar una versión de read model

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión ya está retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.deprecate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Read model no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"definition.statusConceptId === RM.DEF_RETIRED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La versión ya está retirada"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA read_models.read_model_definitions")]:::efecto
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

#### 13. POST /read-models/definitions/{schema}/{object}/versions

Versionar el esquema de un read model

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No existe una versión previa del read model |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay una versión ACTIVE previa que respalde el corte de versión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ReadModelDefinitionsService.createVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ReadModelDefinitionsRepository.findAllBySchemaObject"]:::llamada
  n4 --> n5
  n6[("LEE read_models.read_model_definitions")]:::efecto
  n5 --> n6
  n7{"existing.length === 0"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND No existe una versión previa del read model"]):::error
  n7 -->|"sí"| n8
  n9{"!hasActive"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED No hay una versión ACTIVE previa que respalde el corte de versión"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ReadModelDefinitionsRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA read_models.read_model_definitions")]:::efecto
  n11 --> n12
  n13["Repite: por cada const dep de dto.dependencies"]:::bucle
  n12 --> n13
  n14["Llama a ReadModelDependenciesRepository.create"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("CREA read_models.read_model_dependencies")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
  n13 -->|"al terminar"| n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. GET /read-models/health

Detectar y reportar staleness/degradación de las MV

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
  n3["Llama a ReadModelDefinitionsService.health"]:::llamada
  n2 --> n3
  n4["Llama a ReadModelDefinitionsRepository.findAllNotRetired"]:::llamada
  n3 --> n4
  n5[("LEE read_models.read_model_definitions")]:::efecto
  n4 --> n5
  n6["Repite: map(…)"]:::bucle
  n5 --> n6
  n7["Llama a ReadModelRefreshRunsRepository.findLatestByDefinition"]:::llamada
  n6 -->|"cada elemento"| n7
  n8[("LEE read_models.read_model_refresh_runs")]:::efecto
  n7 --> n8
  n9(("200 Responde con éxito")):::ok
  n8 --> n9
  n6 -->|"al terminar"| n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. PUT /views/{frontendPageViewId}/preferences

Guardar preferencias de vista del usuario

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vista no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La vista no está ACTIVE; PreconditionFailedException: visibleFields contiene columnas fuera del contrato |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a FrontendViewsService.upsertPreferences"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FrontendPageViewsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE read_models.frontend_page_views")]:::efecto
  n5 --> n6
  n7{"!view"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Vista no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"view.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La vista no está ACTIVE"]):::error
  n9 -->|"sí"| n10
  n11{"dto.visibleFields?.length"}:::decision
  n9 -->|"no"| n11
  n12["Llama a FrontendViewChildrenRepository.listFields"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE read_models.frontend_view_fields")]:::efecto
  n12 --> n13
  n14{"invalid.length › 0"}:::decision
  n13 --> n14
  n15(["422 PRECONDITION_FAILED visibleFields contiene columnas fuera del contrato"]):::error
  n14 -->|"sí"| n15
  n16["Llama a UserViewPreferencesRepository.findByUserAndView"]:::llamada
  n14 -->|"no"| n16
  n11 -->|"no"| n16
  n17[("LEE read_models.user_view_preferences")]:::efecto
  n16 --> n17
  n18{"existing"}:::decision
  n17 --> n18
  n19[("ACTUALIZA read_models.user_view_preferences · ACTUALIZA read_models.user_view_preferences · ACTUALIZA read_mo…")]:::efecto
  n18 -->|"sí"| n19
  n20["Llama a UserViewPreferencesRepository.create"]:::llamada
  n19 --> n20
  n18 -->|"no"| n20
  n21[("CREA read_models.user_view_preferences")]:::efecto
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

