<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `document_store`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 5 (3 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [document_store](../endpoints/document_store.md)

## Proceso: Módulo 55 — Document Store (documentos flexibles sobre MongoDB)

- **Código:** `document_store` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 5
- **Actores:** Cualquier sesión válida · PLATFORM_ADMIN · STORAGE_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/document_store/README.md`

### Para qué sirve

Almacén de documentos flexibles (JSON/semiestructurados) que **complementa** Postgres: borradores, snapshots, payloads FHIR crudos, plantillas y cualquier estructura que no encaje bien en el modelo relacional. Persiste en MongoDB real (contenedor `mantra-redesa-mongodb-1`) leyendo `MONGODB_URI` y `MONGO_DB` del entorno.

_Fuente: `src/modules/document_store/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:DocumentStoreController` | Operaciones de DocumentStoreController que el README no asigna a un caso de uso | GET /document-store/collections/{collection}/documents | Cualquier sesión válida | BAJO | 0 |
|  |  | POST /document-store/collections/{collection}/documents | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |
|  |  | DELETE /document-store/collections/{collection}/documents/{id} | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |
|  |  | GET /document-store/collections/{collection}/documents/{id} | Cualquier sesión válida | BAJO | 0 |
|  |  | PATCH /document-store/collections/{collection}/documents/{id} | STORAGE_ADMIN · PLATFORM_ADMIN | BAJO | 0 |

### Diagrama — etapas `ctrl:DocumentStoreController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a4(["STORAGE_ADMIN · PLATFORM_ADMIN"]):::actor
  subgraph s0["ctrl:DocumentStoreController · Operaciones de DocumentStoreController que el RE…"]
    o1["GET /document-store/collections/{collection}/documents"]:::op
    o3["POST /document-store/collections/{collection}/documents"]:::op
    o5["DELETE /document-store/collections/{collection}/documents/{id}"]:::op
    o6["GET /document-store/collections/{collection}/documents/{id}"]:::op
    o7["PATCH /document-store/collections/{collection}/documents/{id}"]:::op
  end
  a2 --> o1
  a4 --> o3
  a4 --> o5
  a2 --> o6
  a4 --> o7
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. DELETE /document-store/collections/{collection}/documents/{id}

Borrado lógico de un documento (soft-delete)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Documento no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DocumentStoreService.softDelete"]:::llamada
  n2 --> n3
  n4["Llama a DocumentStoreService.toObjectId"]:::llamada
  n3 --> n4
  n5{"!ObjectId.isValid(id)"}:::decision
  n4 --> n5
  n6(["404 NOT_FOUND Documento no encontrado"]):::error
  n5 -->|"sí"| n6
  n7{"!deleted"}:::decision
  n5 -->|"no"| n7
  n8(["404 NOT_FOUND Documento no encontrado"]):::error
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

#### 2. GET /document-store/collections/{collection}/documents/{id}

Leer un documento por id (acotado por tenant)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Documento no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DocumentStoreService.findOne"]:::llamada
  n2 --> n3
  n4["Llama a DocumentStoreService.toObjectId"]:::llamada
  n3 --> n4
  n5{"!ObjectId.isValid(id)"}:::decision
  n4 --> n5
  n6(["404 NOT_FOUND Documento no encontrado"]):::error
  n5 -->|"sí"| n6
  n7{"!doc"}:::decision
  n5 -->|"no"| n7
  n8(["404 NOT_FOUND Documento no encontrado"]):::error
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

#### 3. PATCH /document-store/collections/{collection}/documents/{id}

Actualizar un documento con concurrencia optimista

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Documento no encontrado |
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
  n6["Llama a DocumentStoreService.toObjectId"]:::llamada
  n4 -->|"no"| n6
  n7{"!ObjectId.isValid(id)"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Documento no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"!current"}:::decision
  n7 -->|"no"| n9
  n10(["404 NOT_FOUND Documento no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"current.version !== dto.expectedVersion"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONCURRENCY_CONFLICT La versión del documento ha cambiado"]):::error
  n11 -->|"sí"| n12
  n13{"!updated"}:::decision
  n11 -->|"no"| n13
  n14(["409 CONCURRENCY_CONFLICT La versión del documento ha cambiado"]):::error
  n13 -->|"sí"| n14
  n15(("200 Responde con éxito")):::ok
  n13 -->|"no"| n15
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
| GET /document-store/collections/{collection}/documents | 200, 400, 401, 403, 429 | 0 |
| POST /document-store/collections/{collection}/documents | 201, 400, 401, 403, 429 | 0 |
