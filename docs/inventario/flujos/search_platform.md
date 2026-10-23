<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `search_platform`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 4 (4 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [search_platform](../endpoints/search_platform.md)

## Proceso: Módulo 57 — Plataforma de búsqueda (`search_platform`)

- **Código:** `search_platform` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 4
- **Actores:** Cualquier sesión válida · PLATFORM_ADMIN · SEARCH_ADMIN · SEARCH_READER · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/search_platform/README.md`

### Para qué sirve

Búsqueda de texto completo y facetada sobre **OpenSearch real** (contenedor `mantra-redesa-opensearch-1`, `OPENSEARCH_NODE`), para las entidades de negocio consultables: directorio de profesionales/organizaciones, catálogo de servicios y publicaciones. El aislamiento por tenant se aplica **a nivel de consulta**: no hay forma de que un tenant vea documentos de otro aunque el índice físico sea común.

_Fuente: `src/modules/search_platform/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:SearchPlatformController` | Operaciones de SearchPlatformController que el README no asigna a un caso de uso | DESCONOCIDO /search | Cualquier sesión válida | BAJO | 0 |
|  |  | POST /search/{index}/_search | PLATFORM_ADMIN · SEARCH_ADMIN · SEARCH_READER · SYSTEM | BAJO | 0 |
|  |  | POST /search/{index}/documents | PLATFORM_ADMIN · SEARCH_ADMIN · SYSTEM | BAJO | 0 |
|  |  | DELETE /search/{index}/documents/{id} | PLATFORM_ADMIN · SEARCH_ADMIN · SYSTEM | BAJO | 0 |

### Diagrama — etapas `ctrl:SearchPlatformController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a4(["PLATFORM_ADMIN · SEARCH_ADMIN · SEARCH_READER · SYSTEM"]):::actor
  a6(["PLATFORM_ADMIN · SEARCH_ADMIN · SYSTEM"]):::actor
  subgraph s0["ctrl:SearchPlatformController · Operaciones de SearchPlatformController que el…"]
    o1["DESCONOCIDO /search"]:::op
    o3["POST /search/{index}/_search"]:::op
    o5["POST /search/{index}/documents"]:::op
    o7["DELETE /search/{index}/documents/{id}"]:::op
  end
  a2 --> o1
  a4 --> o3
  a6 --> o5
  a6 --> o7
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. DESCONOCIDO /search

Exige tenant de contexto (fail-closed).

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La operación de búsqueda exige un tenant de contexto (X-Tenant-Id) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"!tenantId"}:::decision
  n2 --> n3
  n4(["403 FORBIDDEN La operación de búsqueda exige un tenant de contexto (X-Tenant-Id)"]):::error
  n3 -->|"sí"| n4
  n5(("200 Responde con éxito")):::ok
  n3 -->|"no"| n5
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /search/{index}/_search

Buscar documentos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La operación de búsqueda exige un tenant de contexto (X-Tenant-Id) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SearchPlatformController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenantId"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN La operación de búsqueda exige un tenant de contexto (X-Tenant-Id)"]):::error
  n4 -->|"sí"| n5
  n6["Llama a SearchIndexService.search"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a SearchIndexService.assertTenant"]:::llamada
  n6 --> n7
  n8{"!tenantId"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SearchIndexService.resolveIndex"]:::llamada
  n8 -->|"no"| n10
  n11{"!def"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n11 -->|"sí"| n12
  n13["Repite: por cada const clause de params.filters ?? []"]:::bucle
  n11 -->|"no"| n13
  n14["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n13 -->|"cada elemento"| n14
  n15{"!allowed.includes(field)"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n15 -->|"sí"| n16
  n17["Repite: por cada const field de params.facets ?? []"]:::bucle
  n15 -->|"no"| n17
  n13 -->|"al terminar"| n17
  n18["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n17 -->|"cada elemento"| n18
  n19{"!allowed.includes(field)"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n19 -->|"sí"| n20
  n21{"params.geo"}:::decision
  n19 -->|"no"| n21
  n17 -->|"al terminar"| n21
  n22["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n21 -->|"sí"| n22
  n23{"!allowed.includes(field)"}:::decision
  n22 --> n23
  n24(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n23 -->|"sí"| n24
  n25["Repite: por cada const clause de params.sort ?? []"]:::bucle
  n23 -->|"no"| n25
  n21 -->|"no"| n25
  n26["Llama a SearchIndexService.assertAllowedField"]:::llamada
  n25 -->|"cada elemento"| n26
  n27{"!allowed.includes(field)"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED Campo de {kind} no permitido para el índice"]):::error
  n27 -->|"sí"| n28
  n29(("200 Responde con éxito")):::ok
  n27 -->|"no"| n29
  n25 -->|"al terminar"| n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /search/{index}/documents

Indexar un documento

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La operación de búsqueda exige un tenant de contexto (X-Tenant-Id) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: El documento trae campos no declarados para este índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SearchPlatformController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenantId"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN La operación de búsqueda exige un tenant de contexto (X-Tenant-Id)"]):::error
  n4 -->|"sí"| n5
  n6["Llama a SearchIndexService.indexDocument"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a SearchIndexService.assertTenant"]:::llamada
  n6 --> n7
  n8{"!tenantId"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SearchIndexService.resolveIndex"]:::llamada
  n8 -->|"no"| n10
  n11{"!def"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n11 -->|"sí"| n12
  n13["Llama a SearchIndexService.ensureIndex"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a SearchIndexService.resolveIndex"]:::llamada
  n13 --> n14
  n15{"!def"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n15 -->|"sí"| n16
  n17["Llama a SearchIndexService.assertIndexableDocument"]:::llamada
  n15 -->|"no"| n17
  n18{"extra.length › 0"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED El documento trae campos no declarados para este índice"]):::error
  n18 -->|"sí"| n19
  n20(("200 Responde con éxito")):::ok
  n18 -->|"no"| n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. DELETE /search/{index}/documents/{id}

Eliminar un documento

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La operación de búsqueda exige un tenant de contexto (X-Tenant-Id) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a SearchPlatformController.requireTenant"]:::llamada
  n2 --> n3
  n4{"!tenantId"}:::decision
  n3 --> n4
  n5(["403 FORBIDDEN La operación de búsqueda exige un tenant de contexto (X-Tenant-Id)"]):::error
  n4 -->|"sí"| n5
  n6["Llama a SearchIndexService.deleteDocument"]:::llamada
  n4 -->|"no"| n6
  n7["Llama a SearchIndexService.assertTenant"]:::llamada
  n6 --> n7
  n8{"!tenantId"}:::decision
  n7 --> n8
  n9(["422 PRECONDITION_FAILED Falta el tenant de contexto para la operación de búsqueda"]):::error
  n8 -->|"sí"| n9
  n10["Llama a SearchIndexService.resolveIndex"]:::llamada
  n8 -->|"no"| n10
  n11{"!def"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Índice de búsqueda no reconocido"]):::error
  n11 -->|"sí"| n12
  n13["Intenta"]:::intento
  n11 -->|"no"| n13
  n14(["↩ (relanza el error capturado)"]):::error
  n13 -->|"si falla"| n14
  n15(("200 Responde con éxito")):::ok
  n13 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

