<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `document_store`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 5 (5 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [document_store](../endpoints/document_store.md)

## Proceso: Módulo 55 — Document Store (documentos flexibles sobre MongoDB)

- **Código:** `document_store` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 5
- **Actores:** PLATFORM_ADMIN · STORAGE_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/document_store/README.md`

### Para qué sirve

Almacén de documentos flexibles (JSON/semiestructurados) que **complementa** Postgres: borradores, snapshots, payloads FHIR crudos, plantillas y cualquier estructura que no encaje bien en el modelo relacional. Persiste en MongoDB real (contenedor `mantra-redesa-mongodb-1`) leyendo `MONGODB_URI` y `MONGO_DB` del entorno.

_Fuente: `src/modules/document_store/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:DocumentStoreController` | Operaciones de DocumentStoreController que el README no asigna a un caso de uso | GET /document-store/collections/{collection}/documents | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |
|  |  | POST /document-store/collections/{collection}/documents | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |
|  |  | DELETE /document-store/collections/{collection}/documents/{id} | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |
|  |  | GET /document-store/collections/{collection}/documents/{id} | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |
|  |  | PATCH /document-store/collections/{collection}/documents/{id} | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |

### Diagrama — etapas `ctrl:DocumentStoreController`

```mermaid
flowchart LR
  a2(["STORAGE_ADMIN · PLATFORM_ADMIN"]):::actor
  subgraph s0["ctrl:DocumentStoreController · Operaciones de DocumentStoreController que el RE…"]
    o1["GET /document-store/collections/{collection}/documents"]:::op
    o3["POST /document-store/collections/{collection}/documents"]:::op
    o4["DELETE /document-store/collections/{collection}/documents/{id}"]:::op
    o5["GET /document-store/collections/{collection}/documents/{id}"]:::op
    o6["PATCH /document-store/collections/{collection}/documents/{id}"]:::op
  end
  a2 --> o1
  a2 --> o3
  a2 --> o4
  a2 --> o5
  a2 --> o6
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /document-store/collections/{collection}/documents

Listar documentos del tenant (paginado)

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
  n3["Llama a DocumentStoreService.list"]:::llamada
  n2 --> n3
  n4["Llama a DocumentStoreService.scopedTenant"]:::llamada
  n3 --> n4
  n5{"declaredTenantId !== undefined && declaredTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7(("200 Responde con éxito")):::ok
  n5 -->|"no"| n7
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /document-store/collections/{collection}/documents

Crear un documento flexible en la colección

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
  n3["Llama a DocumentStoreService.create"]:::llamada
  n2 --> n3
  n4["Llama a DocumentStoreService.scopedTenant"]:::llamada
  n3 --> n4
  n5{"declaredTenantId !== undefined && declaredTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7(("201 Responde con éxito")):::ok
  n5 -->|"no"| n7
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. DELETE /document-store/collections/{collection}/documents/{id}

Borrado lógico de un documento (soft-delete)

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
  n3["Llama a DocumentStoreService.softDelete"]:::llamada
  n2 --> n3
  n4["Llama a DocumentStoreService.scopedTenant"]:::llamada
  n3 --> n4
  n5{"declaredTenantId !== undefined && declaredTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Llama a DocumentStoreService.toObjectId"]:::llamada
  n5 -->|"no"| n7
  n8{"!ObjectId.isValid(id)"}:::decision
  n7 --> n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"sí"| n9
  n10{"!deleted"}:::decision
  n8 -->|"no"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. GET /document-store/collections/{collection}/documents/{id}

Leer un documento por id (acotado por tenant)

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
  n3["Llama a DocumentStoreService.findOne"]:::llamada
  n2 --> n3
  n4["Llama a DocumentStoreService.scopedTenant"]:::llamada
  n3 --> n4
  n5{"declaredTenantId !== undefined && declaredTenantId !== tenantId"}:::decision
  n4 --> n5
  n6(["↩ (relanza el error capturado)"]):::error
  n5 -->|"sí"| n6
  n7["Llama a DocumentStoreService.toObjectId"]:::llamada
  n5 -->|"no"| n7
  n8{"!ObjectId.isValid(id)"}:::decision
  n7 --> n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"sí"| n9
  n10{"!doc"}:::decision
  n8 -->|"no"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(("200 Responde con éxito")):::ok
  n10 -->|"no"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. PATCH /document-store/collections/{collection}/documents/{id}

Actualizar un documento con concurrencia optimista

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: La versión del documento ha cambiado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Nada que actualizar: indica payload y/o documentType |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DocumentStoreService.update"]:::llamada
  n2 --> n3
  n4{"dto.payload === undefined && dto.documentType === undefined"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Nada que actualizar: indica payload y/o documentType"]):::error
  n4 -->|"sí"| n5
  n6["Llama a DocumentStoreService.scopedTenant"]:::llamada
  n4 -->|"no"| n6
  n7{"declaredTenantId !== undefined && declaredTenantId !== tenantId"}:::decision
  n6 --> n7
  n8(["↩ (relanza el error capturado)"]):::error
  n7 -->|"sí"| n8
  n9["Llama a DocumentStoreService.toObjectId"]:::llamada
  n7 -->|"no"| n9
  n10{"!ObjectId.isValid(id)"}:::decision
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12{"!current"}:::decision
  n10 -->|"no"| n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14{"current.version !== dto.expectedVersion"}:::decision
  n12 -->|"no"| n14
  n15(["409 CONCURRENCY_CONFLICT La versión del documento ha cambiado"]):::error
  n14 -->|"sí"| n15
  n16{"!updated"}:::decision
  n14 -->|"no"| n16
  n17(["409 CONCURRENCY_CONFLICT La versión del documento ha cambiado"]):::error
  n16 -->|"sí"| n17
  n18(("200 Responde con éxito")):::ok
  n16 -->|"no"| n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

