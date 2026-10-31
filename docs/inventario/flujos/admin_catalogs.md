<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `admin_catalogs`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 7 (5 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [admin_catalogs](../endpoints/admin_catalogs.md)

## Proceso: Módulo `admin_catalogs` — Editor de catálogos globales

- **Código:** `admin_catalogs` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 7
- **Actores:** SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/admin_catalogs/README.md`

### Para qué sirve

Rutas de administración para editar catálogos por tipo de usuario, con versión optimista y auditoría. Parte del plan «Perfil admin: medición y gobierno» (H3); contrato completo en `mantra-core-health/docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H3-catalogos.md`.

_Fuente: `src/modules/admin_catalogs/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:AdminServiceCatalogController` | Operaciones de AdminServiceCatalogController que el README no asigna a un caso de uso | GET /admin/catalogs/services | SECURITY_ADMIN | BAJO | 2 |
|  |  | POST /admin/catalogs/services | SECURITY_ADMIN | MEDIO | 3 |
|  |  | GET /admin/catalogs/services/{id} | SECURITY_ADMIN | BAJO | 2 |
|  |  | PATCH /admin/catalogs/services/{id} | SECURITY_ADMIN | BAJO | 2 |
|  |  | POST /admin/catalogs/services/{id}/deactivate | SECURITY_ADMIN | BAJO | 2 |
|  |  | POST /admin/catalogs/services/{id}/reactivate | SECURITY_ADMIN | BAJO | 2 |
|  |  | GET /admin/catalogs/services/scopes | SECURITY_ADMIN | BAJO | 2 |

### Diagrama — etapas `ctrl:AdminServiceCatalogController`

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  t3[("billing.service_catalog")]:::tabla
  t4[("practice.practices")]:::tabla
  t11[("terminology.catalog_concepts")]:::tabla
  subgraph s0["ctrl:AdminServiceCatalogController · Operaciones de AdminServiceCatalogControll…"]
    o1["GET /admin/catalogs/services"]:::op
    o5["POST /admin/catalogs/services"]:::op
    o6["GET /admin/catalogs/services/{id}"]:::op
    o7["PATCH /admin/catalogs/services/{id}"]:::op
    o8["POST /admin/catalogs/services/{id}/deactivate"]:::op
    o9["POST /admin/catalogs/services/{id}/reactivate"]:::op
    o10["GET /admin/catalogs/services/scopes"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"CREA"| t3
  o5 -->|"LEE"| t3
  o5 -->|"LEE"| t4
  a2 --> o6
  o6 -->|"LEE"| t3
  o6 -->|"LEE"| t4
  a2 --> o7
  o7 -->|"LEE"| t3
  o7 -->|"LEE"| t4
  a2 --> o8
  o8 -->|"LEE"| t3
  o8 -->|"LEE"| t4
  a2 --> o9
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t4
  a2 --> o10
  o10 -->|"LEE"| t4
  o10 -->|"LEE"| t11
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/catalogs/services



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {PRACTICE_NOT_FOUND.message}; ResourceNotFoundException: Cursor no válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AdminServiceCatalogService.list"]:::llamada
  n2 --> n3
  n4["Llama a AdminServiceCatalogService.activePractices"]:::llamada
  n3 --> n4
  n5[("LEE practice.practices")]:::efecto
  n4 --> n5
  n6{"query.practiceId !== undefined"}:::decision
  n5 --> n6
  n7{"!practices.some((p) =› p.id === query.practiceId)"}:::decision
  n6 -->|"sí"| n7
  n8(["404 NOT_FOUND {PRACTICE_NOT_FOUND.message}"]):::error
  n7 -->|"sí"| n8
  n9{"query.cursor"}:::decision
  n7 -->|"no"| n9
  n6 -->|"no"| n9
  n10{"typeof after.code !== 'string' || typeof after.id !== 'string'"}:::decision
  n9 -->|"sí"| n10
  n11(["404 NOT_FOUND Cursor no válido"]):::error
  n10 -->|"sí"| n11
  n12[("LEE billing.service_catalog")]:::efecto
  n10 -->|"no"| n12
  n9 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /admin/catalogs/services



| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un servicio con ese código en la práctica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La moneda no está admitida para el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AdminServiceCatalogService.create"]:::llamada
  n2 --> n3
  n4{"!CURRENCY_CODE_BY_CONCEPT.has(currencyConceptId)"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La moneda no está admitida para el catálogo"]):::error
  n4 -->|"sí"| n5
  n6["Llama a AdminServiceCatalogService.createInPractice"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE practice.practices · LEE billing.service_catalog")]:::efecto
  n6 --> n7
  n8{"clash"}:::decision
  n7 --> n8
  n9(["409 CONFLICT Ya existe un servicio con ese código en la práctica"]):::error
  n8 -->|"sí"| n9
  n10[("CREA billing.service_catalog")]:::efecto
  n8 -->|"no"| n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. PATCH /admin/catalogs/services/{id}



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La edición no trae ningún campo para cambiar; PreconditionFailedException: La moneda no está admitida para el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AdminServiceCatalogService.update"]:::llamada
  n2 --> n3
  n4{"editable.every((v) =› v === undefined)"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La edición no trae ningún campo para cambiar"]):::error
  n4 -->|"sí"| n5
  n6{"dto.currencyConceptId !== undefined && !CURRENCY_CODE_BY_CONCEPT.has(dto.currencyConceptId)"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED La moneda no está admitida para el catálogo"]):::error
  n6 -->|"sí"| n7
  n8(("200 Responde con éxito")):::ok
  n6 -->|"no"| n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /admin/catalogs/services/{id}/deactivate



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AdminServiceCatalogService.setActive"]:::llamada
  n2 --> n3
  n4["Llama a AdminServiceCatalogService.mutate"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a AdminServiceCatalogService.loadInTenant"]:::llamada
  n6 --> n7
  n8[("LEE billing.service_catalog · LEE practice.practices")]:::efecto
  n7 --> n8
  n9{"item.rowVersion !== expectedRowVersion"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"error instanceof OptimisticLockError"}:::decision
  n5 -->|"si falla"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13(["↩ (relanza el error capturado)"]):::error
  n11 -->|"no"| n13
  n14(("200 Responde con éxito")):::ok
  n9 -->|"no"| n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /admin/catalogs/services/{id}/reactivate



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AdminServiceCatalogService.setActive"]:::llamada
  n2 --> n3
  n4["Llama a AdminServiceCatalogService.mutate"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a AdminServiceCatalogService.loadInTenant"]:::llamada
  n6 --> n7
  n8[("LEE billing.service_catalog · LEE practice.practices")]:::efecto
  n7 --> n8
  n9{"item.rowVersion !== expectedRowVersion"}:::decision
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 -->|"sí"| n10
  n11{"error instanceof OptimisticLockError"}:::decision
  n5 -->|"si falla"| n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13(["↩ (relanza el error capturado)"]):::error
  n11 -->|"no"| n13
  n14(("200 Responde con éxito")):::ok
  n9 -->|"no"| n14
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
| GET /admin/catalogs/services/{id} | 200, 400, 401, 403, 429 | 2 |
| GET /admin/catalogs/services/scopes | 200, 401, 403, 429 | 2 |
