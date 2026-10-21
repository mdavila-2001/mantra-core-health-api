<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `common`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 15 (11 con decisiones propias, 4 sin ellas)
- Inventario de endpoints del módulo: [common](../endpoints/common.md)

## Proceso: Common module

- **Código:** `common` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 15
- **Actores:** Cualquier sesión válida · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/common/README.md`

### Para qué sirve

Cross-cutting reference data shared by every clinical/business domain: official **identifiers**, **contact points**, **addresses**, and the **file** subsystem (versioning, derivatives, links, antimalware scanning, soft-delete and signed download URLs). Owners are polymorphic (`owner_type_concept_id` + `owner_id`) and, except for `files.tenant_id`, are **not** FK-enforced.

_Fuente: `src/modules/common/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:CommonAddressesController` | Operaciones de CommonAddressesController que el README no asigna a un caso de uso | POST /common/addresses | Cualquier sesión válida | ALTO | 1 |
| `ctrl:CommonContactPointsController` | Operaciones de CommonContactPointsController que el README no asigna a un caso de uso | POST /common/contact-points | Cualquier sesión válida | ALTO | 1 |
|  |  | POST /common/contact-points/{id}/verify | Cualquier sesión válida | ALTO | 2 |
| `ctrl:CommonFilesController` | Operaciones de CommonFilesController que el README no asigna a un caso de uso | POST /common/files | Cualquier sesión válida | ALTO | 2 |
|  |  | DELETE /common/files/{id} | Cualquier sesión válida | ALTO | 2 |
|  |  | GET /common/files/{id}/content | Cualquier sesión válida | BAJO | 2 |
|  |  | POST /common/files/{id}/download-url | Cualquier sesión válida | BAJO | 2 |
|  |  | POST /common/files/{id}/links | Cualquier sesión válida | ALTO | 2 |
|  |  | POST /common/files/{id}/versions | Cualquier sesión válida | ALTO | 4 |
|  |  | POST /common/files/{id}/versions/{vid}/derivatives | Cualquier sesión válida | ALTO | 3 |
|  |  | GET /common/files/links | Cualquier sesión válida | BAJO | 2 |
|  |  | POST /common/files/upload | Cualquier sesión válida | ALTO | 2 |
| `ctrl:CommonIdentifiersController` | Operaciones de CommonIdentifiersController que el README no asigna a un caso de uso | POST /common/identifiers | Cualquier sesión válida | ALTO | 2 |
| `ctrl:InternalFilesController` | Operaciones de InternalFilesController que el README no asigna a un caso de uso | POST /internal/files/versions/{vid}/scan-result | SYSTEM · SECURITY_ADMIN | MEDIO | 2 |
|  |  | GET /internal/files/versions/pending-scan | SYSTEM · SECURITY_ADMIN | BAJO | 1 |

### Diagrama — etapas `ctrl:CommonAddressesController`, `ctrl:CommonContactPointsController`, `ctrl:CommonFilesController`…

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a23(["SYSTEM · SECURITY_ADMIN"]):::actor
  t3[("common.addresses")]:::tabla
  t5[("common.contact_points")]:::tabla
  t8[("common.file_versions")]:::tabla
  t9[("common.files")]:::tabla
  t14[("common.file_links")]:::tabla
  t17[("common.file_derivatives")]:::tabla
  t21[("common.identifiers")]:::tabla
  subgraph s0["ctrl:CommonAddressesController · Operaciones de CommonAddressesController que e…"]
    o1["POST /common/addresses"]:::op
  end
  subgraph s1["ctrl:CommonContactPointsController · Operaciones de CommonContactPointsControll…"]
    o4["POST /common/contact-points"]:::op
    o6["POST /common/contact-points/{id}/verify"]:::op
  end
  subgraph s2["ctrl:CommonFilesController · Operaciones de CommonFilesController que el README…"]
    o7["POST /common/files"]:::op
    o10["DELETE /common/files/{id}"]:::op
    o11["GET /common/files/{id}/content"]:::op
    o12["POST /common/files/{id}/download-url"]:::op
    o13["POST /common/files/{id}/links"]:::op
    o15["POST /common/files/{id}/versions"]:::op
    o16["POST /common/files/{id}/versions/{vid}/derivatives"]:::op
    o18["GET /common/files/links"]:::op
    o19["POST /common/files/upload"]:::op
  end
  subgraph s3["ctrl:CommonIdentifiersController · Operaciones de CommonIdentifiersController q…"]
    o20["POST /common/identifiers"]:::op
  end
  subgraph s4["ctrl:InternalFilesController · Operaciones de InternalFilesController que el RE…"]
    o22["POST /internal/files/versions/{vid}/scan-result"]:::op
    o24["GET /internal/files/versions/pending-scan"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  a2 --> o4
  o4 -->|"CREA"| t5
  a2 --> o6
  o6 -->|"ACTUALIZA"| t5
  o6 -->|"LEE"| t5
  a2 --> o7
  o7 -->|"CREA"| t8
  o7 -->|"CREA"| t9
  a2 --> o10
  o10 -->|"ACTUALIZA"| t9
  o10 -->|"LEE"| t9
  a2 --> o11
  o11 -->|"LEE"| t8
  o11 -->|"LEE"| t9
  a2 --> o12
  o12 -->|"LEE"| t8
  o12 -->|"LEE"| t9
  a2 --> o13
  o13 -->|"CREA"| t14
  o13 -->|"LEE"| t9
  a2 --> o15
  o15 -->|"CREA"| t8
  o15 -->|"LEE"| t8
  o15 -->|"ACTUALIZA"| t9
  o15 -->|"LEE"| t9
  a2 --> o16
  o16 -->|"CREA"| t17
  o16 -->|"CREA"| t8
  o16 -->|"LEE"| t8
  a2 --> o18
  o18 -->|"LEE"| t14
  o18 -->|"LEE"| t9
  a2 --> o19
  o19 -->|"CREA"| t8
  o19 -->|"CREA"| t9
  a2 --> o20
  o20 -->|"CREA"| t21
  o20 -->|"LEE"| t21
  a23 --> o22
  o22 -->|"ACTUALIZA"| t8
  o22 -->|"LEE"| t8
  a23 --> o24
  o24 -->|"LEE"| t8
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /common/contact-points/{id}/verify

Verificar un punto de contacto (UC-02-03)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Punto de contacto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ContactPointsService.verify"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ContactPointsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE common.contact_points")]:::efecto
  n5 --> n6
  n7{"!contactPoint"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Punto de contacto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9[("ACTUALIZA common.contact_points · ACTUALIZA common.contact_points · ACTUALIZA common.contact_points")]:::efecto
  n7 -->|"no"| n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. DELETE /common/files/{id}

Borrar lógicamente un archivo (UC-02-10)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está bajo retención legal y no puede borrarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a FilesService.softDelete"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE common.files")]:::efecto
  n5 --> n6
  n7{"!file"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Archivo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"file.legalHoldUntil && file.legalHoldUntil.getTime() › Date.now()"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El archivo está bajo retención legal y no puede borrarse"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA common.files · ACTUALIZA common.files · ACTUALIZA common.files · ACTUALIZA common.files")]:::efecto
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

#### 3. GET /common/files/{id}/content

Descargar el contenido vigente de un archivo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene acceso a este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Versión vigente no encontrada; ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente resultó infectada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3; Error: S3 object body is empty |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a FileUploadService.download"]:::llamada
  n2 --> n3
  n4["Llama a FilesRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE common.files")]:::efecto
  n4 --> n5
  n6{"!file"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Archivo no encontrado"]):::error
  n6 -->|"sí"| n7
  n8{"file.createdByUserId !== actor.id && !actor.roles.some((role) =› FILE_REVIEWER_ROLES.includes(role))"}:::decision
  n6 -->|"no"| n8
  n9(["403 FORBIDDEN No tiene acceso a este archivo"]):::error
  n8 -->|"sí"| n9
  n10{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED El archivo está borrado"]):::error
  n10 -->|"sí"| n11
  n12{"!file.currentVersionId"}:::decision
  n10 -->|"no"| n12
  n13(["422 PRECONDITION_FAILED El archivo no tiene una versión vigente"]):::error
  n12 -->|"sí"| n13
  n14["Llama a FileVersionsRepository.findById"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE common.file_versions")]:::efecto
  n14 --> n15
  n16{"!version"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Versión vigente no encontrada"]):::error
  n16 -->|"sí"| n17
  n18{"version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La versión vigente resultó infectada"]):::error
  n18 -->|"sí"| n19
  n20["Llama a LocalDiskFileStorageAdapter.retrieve"]:::llamada
  n18 -->|"no"| n20
  n21["Llama a LocalDiskFileStorageAdapter.hashFromUri"]:::llamada
  n20 --> n21
  n22{"!storageUri.startsWith(LOCAL_URI_PREFIX)"}:::decision
  n21 --> n22
  n23(["404 NOT_FOUND La URI no pertenece al almacenamiento local"]):::error
  n22 -->|"sí"| n23
  n24{"!CONTENT_HASH_PATTERN.test(hash)"}:::decision
  n22 -->|"no"| n24
  n25(["404 NOT_FOUND La URI de almacenamiento local está mal formada"]):::error
  n24 -->|"sí"| n25
  n26["Intenta"]:::intento
  n24 -->|"no"| n26
  n27{"isMissingFile(error)"}:::decision
  n26 -->|"si falla"| n27
  n28(["404 NOT_FOUND El contenido no está disponible en el almacenamiento local"]):::error
  n27 -->|"sí"| n28
  n29(["↩ (relanza el error capturado)"]):::error
  n27 -->|"no"| n29
  n30["Llama a S3FileStorageAdapter.retrieve"]:::llamada
  n26 --> n30
  n31["Llama a S3FileStorageAdapter.assertConfigured"]:::llamada
  n30 --> n31
  n32{"!this.env.s3.bucket"}:::decision
  n31 --> n32
  n33(["500 INTERNAL FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3"]):::error
  n32 -->|"sí"| n33
  n34["Llama a S3FileStorageAdapter.parseOwnedKey"]:::llamada
  n32 -->|"no"| n34
  n35{"!storageUri.startsWith(expected)"}:::decision
  n34 --> n35
  n36(["404 NOT_FOUND La URI no pertenece al bucket configurado"]):::error
  n35 -->|"sí"| n36
  n37{"!CONTENT_HASH_PATTERN.test(hash) || key !== this.objectKey(hash)"}:::decision
  n35 -->|"no"| n37
  n38(["404 NOT_FOUND La URI S3 está mal formada o fuera del prefijo permitido"]):::error
  n37 -->|"sí"| n38
  n39["Intenta"]:::intento
  n37 -->|"no"| n39
  n40{"!result.Body"}:::decision
  n39 --> n40
  n41(["500 INTERNAL S3 object body is empty"]):::error
  n40 -->|"sí"| n41
  n42{"isNotFound(error)"}:::decision
  n39 -->|"si falla"| n42
  n43(["404 NOT_FOUND El contenido no está disponible en el almacenamiento configurado"]):::error
  n42 -->|"sí"| n43
  n44(["↩ (relanza el error capturado)"]):::error
  n42 -->|"no"| n44
  n45(("200 Responde con éxito")):::ok
  n40 -->|"no"| n45
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /common/files/{id}/download-url

Emitir una URL de descarga firmada (UC-02-11)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Versión vigente no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente no ha superado el escaneo antimalware |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a FilesService.generateDownloadUrl"]:::llamada
  n2 --> n3
  n4["Llama a FilesRepository.findById"]:::llamada
  n3 --> n4
  n5[("LEE common.files")]:::efecto
  n4 --> n5
  n6{"!file"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Archivo no encontrado"]):::error
  n6 -->|"sí"| n7
  n8{"file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED El archivo está borrado"]):::error
  n8 -->|"sí"| n9
  n10{"!file.currentVersionId"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED El archivo no tiene una versión vigente"]):::error
  n10 -->|"sí"| n11
  n12["Llama a FileVersionsRepository.findById"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE common.file_versions")]:::efecto
  n12 --> n13
  n14{"!version"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Versión vigente no encontrada"]):::error
  n14 -->|"sí"| n15
  n16{"version.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED La versión vigente no ha superado el escaneo antimalware"]):::error
  n16 -->|"sí"| n17
  n18(("201 Responde con éxito")):::ok
  n16 -->|"no"| n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /common/files/{id}/links

Vincular un archivo a un propietario (UC-02-08)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a FilesService.createLink"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE common.files")]:::efecto
  n5 --> n6
  n7{"!file"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Archivo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a FileLinksRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA common.file_links")]:::efecto
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

#### 6. POST /common/files/{id}/versions

Añadir una versión a un archivo (UC-02-06)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a FilesService.createVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FilesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE common.files")]:::efecto
  n5 --> n6
  n7{"!file"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Archivo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a FileVersionsRepository.maxVersionNumber"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE common.file_versions")]:::efecto
  n9 --> n10
  n11["Llama a FileVersionsRepository.create"]:::llamada
  n10 --> n11
  n12[("CREA common.file_versions")]:::efecto
  n11 --> n12
  n13[("ACTUALIZA common.files · ACTUALIZA common.files · ACTUALIZA common.files")]:::efecto
  n12 --> n13
  n14(("201 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /common/files/{id}/versions/{vid}/derivatives

Generar un derivado de una versión (UC-02-07)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de archivo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se pueden generar derivados de versiones con escaneo limpio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a FilesService.createDerivative"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FileVersionsRepository.findByFileAndId"]:::llamada
  n4 --> n5
  n6[("LEE common.file_versions")]:::efecto
  n5 --> n6
  n7{"!source"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión de archivo no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"source.malwareScanStatusConceptId !== CONCEPTS.SCAN_CLEAN"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Solo se pueden generar derivados de versiones con escaneo limpio"]):::error
  n9 -->|"sí"| n10
  n11["Llama a FileVersionsRepository.maxVersionNumber"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE common.file_versions")]:::efecto
  n11 --> n12
  n13["Llama a FileVersionsRepository.create"]:::llamada
  n12 --> n13
  n14[("CREA common.file_versions")]:::efecto
  n13 --> n14
  n15["Llama a FileDerivativesRepository.create"]:::llamada
  n14 --> n15
  n16[("CREA common.file_derivatives")]:::efecto
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

#### 8. GET /common/files/links

Listar los archivos adjuntos a un recurso (UC-02-08)

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
  n3["Llama a FilesService.listLinkedFiles"]:::llamada
  n2 --> n3
  n4["Llama a FileLinksRepository.findByOwner"]:::llamada
  n3 --> n4
  n5[("LEE common.file_links")]:::efecto
  n4 --> n5
  n6["Repite: por cada const link de links"]:::bucle
  n5 --> n6
  n7["Llama a FilesRepository.findById"]:::llamada
  n6 -->|"cada elemento"| n7
  n8[("LEE common.files")]:::efecto
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

#### 9. POST /common/files/upload

Subir el contenido de un archivo (multipart)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: El contenido no corresponde a ningún formato de archivo permitido; PreconditionFailedException: El formato del archivo no está permitido para esta categoría |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a FileUploadService.upload"]:::llamada
  n2 --> n3
  n4{"!file?.buffer?.byteLength"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED No se recibió contenido en el campo 'file'"]):::error
  n4 -->|"sí"| n5
  n6{"file.buffer.byteLength › this.maxSizeBytes"}:::decision
  n4 -->|"no"| n6
  n7(["422 PRECONDITION_FAILED El archivo excede el tamaño máximo permitido"]):::error
  n6 -->|"sí"| n7
  n8{"!detectedMimeType"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED El contenido no corresponde a ningún formato de archivo permitido"]):::error
  n8 -->|"sí"| n9
  n10{"!isMimeTypeAllowedForCategory(dto.category, detectedMimeType)"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED El formato del archivo no está permitido para esta categoría"]):::error
  n10 -->|"sí"| n11
  n12["Llama a S3FileStorageAdapter.store"]:::llamada
  n10 -->|"no"| n12
  n13["Llama a S3FileStorageAdapter.assertConfigured"]:::llamada
  n12 --> n13
  n14{"!this.env.s3.bucket"}:::decision
  n13 --> n14
  n15(["500 INTERNAL FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3"]):::error
  n14 -->|"sí"| n15
  n16["Llama a FilesService.createFile"]:::llamada
  n14 -->|"no"| n16
  n17["Transacción: transactional(…)"]:::transaccion
  n16 --> n17
  n18["Llama a FilesRepository.create"]:::llamada
  n17 --> n18
  n19[("CREA common.files")]:::efecto
  n18 --> n19
  n20["Llama a FileVersionsRepository.create"]:::llamada
  n19 --> n20
  n21[("CREA common.file_versions")]:::efecto
  n20 --> n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /common/identifiers

Registrar un identificador oficial (UC-02-01)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un identificador activo con ese tipo, sistema y valor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IdentifiersService.create"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a IdentifiersRepository.findActiveDuplicate"]:::llamada
  n4 --> n5
  n6[("LEE common.identifiers")]:::efecto
  n5 --> n6
  n7{"duplicate"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un identificador activo con ese tipo, sistema y valor"]):::error
  n7 -->|"sí"| n8
  n9["Llama a IdentifiersRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA common.identifiers")]:::efecto
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

#### 11. POST /internal/files/versions/{vid}/scan-result

Registrar resultado de escaneo antimalware (UC-02-09)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de archivo no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a FilesService.recordScanResult"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a FileVersionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE common.file_versions")]:::efecto
  n5 --> n6
  n7{"!version"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión de archivo no encontrada"]):::error
  n7 -->|"sí"| n8
  n9[("ACTUALIZA common.file_versions · ACTUALIZA common.file_versions")]:::efecto
  n7 -->|"no"| n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
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
| POST /common/addresses | 201, 400, 401, 403, 429 | 1 |
| POST /common/contact-points | 201, 400, 401, 403, 429 | 1 |
| POST /common/files | 201, 400, 401, 403, 429 | 2 |
| GET /internal/files/versions/pending-scan | 200, 401, 403, 429 | 1 |
