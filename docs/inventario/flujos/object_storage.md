<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `object_storage`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 14 (13 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [object_storage](../endpoints/object_storage.md)

## Proceso: Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM)

- **Código:** `object_storage` · **Agrupación:** MIXTO · **Operaciones:** 14
- **Actores:** CLINICIAN · COMPLIANCE_OFFICER · DICOM_VIEWER · LEGAL_COUNSEL · PACS_GATEWAY · STORAGE_ADMIN · STORAGE_CLIENT · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/object_storage/README.md`

### Para qué sirve

Cargas multiparte, versiones inmutables direccionadas por contenido, catálogo DICOM con registro de accesos, payloads grandes enlazados a su origen, retención WORM y legal, verificación de integridad, archivado en frío y borrado gobernado.

_Fuente: `src/modules/object_storage/README.md:3`_

### Flujo general declarado en el README

```text
namespaces/:code/uploads/initiate ──> carga initiated  [idempotente por carga del proveedor]
  └─ uploads/:id/complete  [el tamaño recibido debe cuadrar con el declarado]
       └─ manifiesto (active) + versión inmutable + checksum + sobre de cifrado + ubicación primaria

objects/:id/versions ──> versión nueva encadenada por supersedes_version_id
                         mismo sha256 ⇒ no se versiona

dicom/studies/catalog ──> estudio → serie → instancia  [reentrante por UID]
  └─ /dicomweb/.../instances/:sopUid ──> allowed | denied — ambos se registran

versions/:id/retention-lock ──> objeto retained   [compliance = WORM]
versions/:id/legal-holds ─────> objeto legal_hold [anula el borrado]
versions/:id/integrity-checks ─> passed | failed  ⇒ failed marca el objeto corrupt
archive-jobs/build ───────────> objeto archived   [legal hold lo impide]
objects/:id/request-deletion ─> objeto pending_deletion
                                 [legal hold y retención compliance vigente lo abortan]
versions/:id/signed-url ──────> URI + versión de clave + caducidad
                                 [frío exige rehidratación; corrupto y borrado no se sirven]
```

_Fuente: `src/modules/object_storage/README.md:83`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-60-01` | Iniciar carga multiparte | POST /object-storage/namespaces/{code}/uploads/initiate | STORAGE_CLIENT · SYSTEM · STORAGE_ADMIN | MEDIO | 3 |
| `UC-60-02` | Completar y materializar versión | POST /object-storage/uploads/{id}/complete | STORAGE_CLIENT · SYSTEM · STORAGE_ADMIN | MEDIO | 11 |
| `UC-60-03` | Nueva versión inmutable | POST /object-storage/objects/{manifestId}/versions | SYSTEM · STORAGE_ADMIN | MEDIO | 8 |
| `UC-60-04` | Catalogar jerarquía DICOM | POST /object-storage/dicom/studies/catalog | PACS_GATEWAY · SYSTEM · STORAGE_ADMIN | MEDIO | 9 |
| `UC-60-05` | Acceso DICOMweb | GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid} | DICOM_VIEWER · CLINICIAN · STORAGE_ADMIN | MEDIO | 5 |
| `UC-60-06` | Registrar payload grande | POST /object-storage/large-payloads | SYSTEM · STORAGE_ADMIN | MEDIO | 4 |
| `UC-60-07` | Retención WORM | POST /object-storage/versions/{versionId}/retention-lock | COMPLIANCE_OFFICER · STORAGE_ADMIN | MEDIO | 6 |
| `UC-60-09` | Emitir acceso firmado | POST /object-storage/versions/{versionId}/signed-url | DICOM_VIEWER · CLINICIAN · SYSTEM · STORAGE_ADMIN | MEDIO | 30 |
| `UC-60-10` | Verificar integridad | POST /object-storage/versions/{versionId}/integrity-checks | SYSTEM · STORAGE_ADMIN | MEDIO | 8 |
| `UC-60-11` | Archivar a frío | POST /object-storage/archive-jobs/build | SYSTEM · STORAGE_ADMIN | MEDIO | 7 |
| `UC-60-12` | Borrado gobernado | POST /object-storage/objects/{manifestId}/request-deletion | COMPLIANCE_OFFICER · STORAGE_ADMIN | MEDIO | 7 |
| `ctrl:ObjectStorageController` | Operaciones de ObjectStorageController que el README no asigna a un caso de uso | GET /object-storage/versions/{versionId}/content/{token} | DICOM_VIEWER · CLINICIAN · SYSTEM · STORAGE_ADMIN | MEDIO | 30 |
|  |  | POST /object-storage/versions/{versionId}/legal-holds | LEGAL_COUNSEL · STORAGE_ADMIN | MEDIO | 5 |
|  |  | DELETE /object-storage/versions/{versionId}/legal-holds/{holdId} | LEGAL_COUNSEL · STORAGE_ADMIN | MEDIO | 6 |

### Diagrama — etapas `UC-60-01`, `UC-60-02`, `UC-60-03`…

```mermaid
flowchart LR
  a2(["STORAGE_CLIENT · SYSTEM · STORAGE_ADMIN"]):::actor
  a12(["SYSTEM · STORAGE_ADMIN"]):::actor
  a15(["PACS_GATEWAY · SYSTEM · STORAGE_ADMIN"]):::actor
  a21(["DICOM_VIEWER · CLINICIAN · STORAGE_ADMIN"]):::actor
  a26(["COMPLIANCE_OFFICER · STORAGE_ADMIN"]):::actor
  a30(["DICOM_VIEWER · CLINICIAN · SYSTEM · STORAGE_ADMIN"]):::actor
  a50(["LEGAL_COUNSEL · STORAGE_ADMIN"]):::actor
  t3[("object_storage.multipart_uploads")]:::tabla
  t4[("object_storage.object_namespaces")]:::tabla
  t6[("object_storage.object_checksums")]:::tabla
  t7[("object_storage.object_encryption_envelopes")]:::tabla
  t8[("object_storage.object_locations")]:::tabla
  t9[("object_storage.object_manifests")]:::tabla
  t16[("object_storage.dicom_instance_manifests")]:::tabla
  t17[("object_storage.dicom_series_manifests")]:::tabla
  t18[("object_storage.dicom_study_manifests")]:::tabla
  t22[("object_storage.dicomweb_access_logs")]:::tabla
  t24[("object_storage.large_payload_manifests")]:::tabla
  t27[("object_storage.object_retention_locks")]:::tabla
  t28[("object_storage.object_versions")]:::tabla
  t31[("audit.audit_log")]:::tabla
  t32[("authz.access_policies")]:::tabla
  t33[("authz.care_relationships")]:::tabla
  t34[("authz.clinical_access_grants")]:::tabla
  t35[("authz.field_permissions")]:::tabla
  t38[("object_storage.object_integrity_checks")]:::tabla
  t41[("object_storage.archive_manifests")]:::tabla
  t42[("object_storage.object_legal_holds")]:::tabla
  t45[("object_storage.object_deletion_markers")]:::tabla
  subgraph s0["UC-60-01 · Iniciar carga multiparte"]
    o1["POST /object-storage/namespaces/{code}/uploads/initiate"]:::op
  end
  t10[("+5 tablas más")]
  subgraph s1["UC-60-02 · Completar y materializar versión"]
    o5["POST /object-storage/uploads/{id}/complete"]:::op
  end
  t13[("+2 tablas más")]
  subgraph s2["UC-60-03 · Nueva versión inmutable"]
    o11["POST /object-storage/objects/{manifestId}/versions"]:::op
  end
  t19[("+3 tablas más")]
  subgraph s3["UC-60-04 · Catalogar jerarquía DICOM"]
    o14["POST /object-storage/dicom/studies/catalog"]:::op
  end
  subgraph s4["UC-60-05 · Acceso DICOMweb"]
    o20["GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}"]:::op
  end
  subgraph s5["UC-60-06 · Registrar payload grande"]
    o23["POST /object-storage/large-payloads"]:::op
  end
  subgraph s6["UC-60-07 · Retención WORM"]
    o25["POST /object-storage/versions/{versionId}/retention-lock"]:::op
  end
  t36[("+24 tablas más")]
  subgraph s7["UC-60-09 · Emitir acceso firmado"]
    o29["POST /object-storage/versions/{versionId}/signed-url"]:::op
  end
  t39[("+2 tablas más")]
  subgraph s8["UC-60-10 · Verificar integridad"]
    o37["POST /object-storage/versions/{versionId}/integrity-checks"]:::op
  end
  t43[("+1 tablas más")]
  subgraph s9["UC-60-11 · Archivar a frío"]
    o40["POST /object-storage/archive-jobs/build"]:::op
  end
  t46[("+1 tablas más")]
  subgraph s10["UC-60-12 · Borrado gobernado"]
    o44["POST /object-storage/objects/{manifestId}/request-deletion"]:::op
  end
  t48[("+24 tablas más")]
  subgraph s11["ctrl:ObjectStorageController · Operaciones de ObjectStorageController que el RE…"]
    o47["GET /object-storage/versions/{versionId}/content/{token}"]:::op
    o49["POST /object-storage/versions/{versionId}/legal-holds"]:::op
    o51["DELETE /object-storage/versions/{versionId}/legal-holds/{holdId}"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"ACTUALIZA"| t3
  o5 -->|"LEE"| t3
  o5 -->|"CREA"| t6
  o5 -->|"CREA"| t7
  o5 -->|"CREA"| t8
  o5 -->|"ACTUALIZA"| t9
  o5 -.-> t10
  a12 --> o11
  o11 -->|"CREA"| t6
  o11 -->|"CREA"| t7
  o11 -->|"CREA"| t8
  o11 -->|"ACTUALIZA"| t9
  o11 -->|"LEE"| t9
  o11 -->|"LEE"| t4
  o11 -.-> t13
  a15 --> o14
  o14 -->|"CREA"| t16
  o14 -->|"LEE"| t16
  o14 -->|"ACTUALIZA"| t17
  o14 -->|"CREA"| t17
  o14 -->|"LEE"| t17
  o14 -->|"ACTUALIZA"| t18
  o14 -.-> t19
  a21 --> o20
  o20 -->|"LEE"| t16
  o20 -->|"LEE"| t17
  o20 -->|"LEE"| t18
  o20 -->|"CREA"| t22
  o20 -->|"LEE"| t9
  a12 --> o23
  o23 -->|"CREA"| t24
  o23 -->|"LEE"| t24
  o23 -->|"ACTUALIZA"| t9
  o23 -->|"LEE"| t9
  a26 --> o25
  o25 -->|"ACTUALIZA"| t9
  o25 -->|"LEE"| t9
  o25 -->|"LEE"| t4
  o25 -->|"CREA"| t27
  o25 -->|"LEE"| t27
  o25 -->|"LEE"| t28
  a30 --> o29
  o29 -->|"CREA"| t31
  o29 -->|"LEE"| t31
  o29 -->|"LEE"| t32
  o29 -->|"LEE"| t33
  o29 -->|"LEE"| t34
  o29 -->|"LEE"| t35
  o29 -.-> t36
  a12 --> o37
  o37 -->|"ACTUALIZA"| t6
  o37 -->|"LEE"| t6
  o37 -->|"CREA"| t38
  o37 -->|"ACTUALIZA"| t8
  o37 -->|"LEE"| t8
  o37 -->|"ACTUALIZA"| t9
  o37 -.-> t39
  a12 --> o40
  o40 -->|"CREA"| t41
  o40 -->|"LEE"| t41
  o40 -->|"LEE"| t42
  o40 -->|"CREA"| t8
  o40 -->|"ACTUALIZA"| t9
  o40 -->|"LEE"| t9
  o40 -.-> t43
  a26 --> o44
  o44 -->|"CREA"| t45
  o44 -->|"LEE"| t45
  o44 -->|"LEE"| t42
  o44 -->|"ACTUALIZA"| t9
  o44 -->|"LEE"| t9
  o44 -->|"LEE"| t27
  o44 -.-> t46
  a30 --> o47
  o47 -->|"CREA"| t31
  o47 -->|"LEE"| t31
  o47 -->|"LEE"| t32
  o47 -->|"LEE"| t33
  o47 -->|"LEE"| t34
  o47 -->|"LEE"| t35
  o47 -.-> t48
  a50 --> o49
  o49 -->|"CREA"| t42
  o49 -->|"LEE"| t42
  o49 -->|"ACTUALIZA"| t9
  o49 -->|"LEE"| t9
  o49 -->|"LEE"| t28
  a50 --> o51
  o51 -->|"ACTUALIZA"| t42
  o51 -->|"LEE"| t42
  o51 -->|"ACTUALIZA"| t9
  o51 -->|"LEE"| t9
  o51 -->|"LEE"| t27
  o51 -->|"LEE"| t28
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /object-storage/archive-jobs/build

Archivar el objeto a almacenamiento frío

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto no tiene ninguna versión; PreconditionFailedException: La versión está bajo retención legal: no se puede mover a frío |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectGovernanceService.buildArchiveJob"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_manifests")]:::efecto
  n5 --> n6
  n7{"!manifest"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ObjectGovernanceRepository.findArchiveManifestByHash"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE object_storage.archive_manifests")]:::efecto
  n9 --> n10
  n11["Llama a ObjectStorageRepository.findLatestVersion"]:::llamada
  n10 --> n11
  n12[("LEE object_storage.object_versions")]:::efecto
  n11 --> n12
  n13{"!version"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED El objeto no tiene ninguna versión"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ObjectGovernanceRepository.findActiveLegalHolds"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE object_storage.object_legal_holds")]:::efecto
  n15 --> n16
  n17{"holds.length › 0"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED La versión está bajo retención legal: no se puede mover a frío"]):::error
  n17 -->|"sí"| n18
  n19["Llama a ObjectGovernanceRepository.createArchiveManifest"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA object_storage.archive_manifests")]:::efecto
  n19 --> n20
  n21["Llama a ObjectStorageRepository.createLocation"]:::llamada
  n20 --> n21
  n22[("CREA object_storage.object_locations")]:::efecto
  n21 --> n22
  n23[("ACTUALIZA object_storage.object_manifests · ACTUALIZA object_storage.object_manifests")]:::efecto
  n22 --> n23
  n24(("201 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /object-storage/dicom/studies/catalog

Catalogar la jerarquía DICOM estudio/serie/instancia

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El objeto de la instancia no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a DicomCatalogService.catalogStudy"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a DicomRepository.findStudyByUidForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.dicom_study_manifests")]:::efecto
  n5 --> n6
  n7["Llama a DicomRepository.createStudy"]:::llamada
  n6 --> n7
  n8[("CREA object_storage.dicom_study_manifests")]:::efecto
  n7 --> n8
  n9["Repite: por cada const seriesDto de dto.series"]:::bucle
  n8 --> n9
  n10["Llama a DicomRepository.findSeriesByUidForUpdate"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE object_storage.dicom_series_manifests")]:::efecto
  n10 --> n11
  n12["Llama a DicomRepository.createSeries"]:::llamada
  n11 --> n12
  n13[("CREA object_storage.dicom_series_manifests")]:::efecto
  n12 --> n13
  n14["Repite: por cada const instanceDto de seriesDto.instances"]:::bucle
  n13 --> n14
  n15["Llama a DicomRepository.findInstanceByUid"]:::llamada
  n14 -->|"cada elemento"| n15
  n16[("LEE object_storage.dicom_instance_manifests")]:::efecto
  n15 --> n16
  n17["Llama a ObjectStorageRepository.findManifestById"]:::llamada
  n16 --> n17
  n18[("LEE object_storage.object_manifests")]:::efecto
  n17 --> n18
  n19{"!manifest"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND El objeto de la instancia no existe"]):::error
  n19 -->|"sí"| n20
  n21["Llama a DicomRepository.createInstance"]:::llamada
  n19 -->|"no"| n21
  n22[("CREA object_storage.dicom_instance_manifests")]:::efecto
  n21 --> n22
  n23["Llama a DicomRepository.countInstancesBySeries"]:::llamada
  n22 --> n23
  n14 -->|"al terminar"| n23
  n24[("LEE object_storage.dicom_instance_manifests")]:::efecto
  n23 --> n24
  n25[("ACTUALIZA object_storage.dicom_series_manifests")]:::efecto
  n24 --> n25
  n26["Llama a DicomRepository.findSeriesByStudy"]:::llamada
  n25 --> n26
  n9 -->|"al terminar"| n26
  n27[("LEE object_storage.dicom_series_manifests")]:::efecto
  n26 --> n27
  n28[("ACTUALIZA object_storage.dicom_study_manifests · ACTUALIZA object_storage.dicom_study_manifests")]:::efecto
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

#### 3. POST /object-storage/large-payloads

Registrar un payload grande y vincularlo a su entidad de origen

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectStorageService.registerLargePayload"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_manifests")]:::efecto
  n5 --> n6
  n7{"!manifest"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ObjectStorageRepository.findLargePayloadBySource"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE object_storage.large_payload_manifests")]:::efecto
  n9 --> n10
  n11["Llama a ObjectStorageRepository.createLargePayload"]:::llamada
  n10 --> n11
  n12[("CREA object_storage.large_payload_manifests")]:::efecto
  n11 --> n12
  n13[("ACTUALIZA object_storage.object_manifests")]:::efecto
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

#### 4. POST /object-storage/namespaces/{code}/uploads/initiate

Iniciar una carga multiparte

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio de nombres no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espacio de nombres no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectStorageService.initiateUpload"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findNamespaceByCode"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_namespaces")]:::efecto
  n5 --> n6
  n7{"!namespace"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Espacio de nombres no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"namespace.state !== NAMESPACE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El espacio de nombres no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ObjectStorageRepository.findUploadByProviderId"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE object_storage.multipart_uploads")]:::efecto
  n11 --> n12
  n13["Llama a ObjectStorageRepository.createUpload"]:::llamada
  n12 --> n13
  n14[("CREA object_storage.multipart_uploads")]:::efecto
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

#### 5. POST /object-storage/objects/{manifestId}/request-deletion

Solicitar el borrado gobernado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto está bajo retención legal: no se puede borrar; PreconditionFailedException: El objeto está bajo retención de cumplimiento vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectGovernanceService.requestDeletion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_manifests")]:::efecto
  n5 --> n6
  n7{"!manifest"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ObjectGovernanceRepository.findDeletionMarker"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE object_storage.object_deletion_markers")]:::efecto
  n9 --> n10
  n11["Llama a ObjectStorageRepository.findLatestVersion"]:::llamada
  n10 --> n11
  n12[("LEE object_storage.object_versions")]:::efecto
  n11 --> n12
  n13{"version"}:::decision
  n12 --> n13
  n14["Llama a ObjectGovernanceRepository.findActiveLegalHolds"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE object_storage.object_legal_holds")]:::efecto
  n14 --> n15
  n16{"holds.length › 0"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED El objeto está bajo retención legal: no se puede borrar"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ObjectGovernanceRepository.findActiveRetentionLockForUpdate"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE object_storage.object_retention_locks")]:::efecto
  n18 --> n19
  n20{"retention && retention.lockMode === RETENTION_LOCK_MODE.COMPLIANCE && retention.retainUntil.getTime() › Date.…"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED El objeto está bajo retención de cumplimiento vigente"]):::error
  n20 -->|"sí"| n21
  n22["Llama a ObjectGovernanceRepository.createDeletionMarker"]:::llamada
  n20 -->|"no"| n22
  n13 -->|"no"| n22
  n23[("CREA object_storage.object_deletion_markers")]:::efecto
  n22 --> n23
  n24[("ACTUALIZA object_storage.object_manifests · ACTUALIZA object_storage.object_manifests")]:::efecto
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

#### 6. POST /object-storage/objects/{manifestId}/versions

Crear una versión nueva del objeto

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado; ResourceNotFoundException: Espacio de nombres no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto no está activo; PreconditionFailedException: El espacio de nombres no tiene versionado habilitado; PreconditionFailedException: La URI declarada no es la ubicación del objeto; PreconditionFailedException: El objeto no está en el almacenamiento; PreconditionFailedException: La versión del proveedor no coincide con la declarada; PreconditionFailedException: El tamaño almacenado no coincide con el declarado; PreconditionFailedException: El contenido almacenado no coincide con el SHA-256 declarado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ObjectContentUnavailableError: BACKEND_UNSUPPORTED; ObjectContentUnavailableError: SIZE_UNKNOWN; ObjectContentUnavailableError: PROVIDER_ERROR; ObjectContentUnavailableError: BODY_UNREADABLE; ObjectContentUnavailableError: NOT_FOUND / PROVIDER_ERROR; ObjectContentUnavailableError: READ_INTERRUPTED |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: No se pudo verificar el objeto en el almacenamiento |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectStorageService.createVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_manifests")]:::efecto
  n5 --> n6
  n7{"!manifest"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"manifest.lifecycleState !== OBJECT_LIFECYCLE.ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El objeto no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ObjectStorageRepository.findNamespaceById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE object_storage.object_namespaces")]:::efecto
  n11 --> n12
  n13{"!namespace"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Espacio de nombres no encontrado"]):::error
  n13 -->|"sí"| n14
  n15{"!namespace.versioningEnabled"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El espacio de nombres no tiene versionado habilitado"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ObjectStorageService.verifyStoredContent"]:::llamada
  n15 -->|"no"| n17
  n18{"declared.providerUri !== providerUri"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED La URI declarada no es la ubicación del objeto"]):::error
  n18 -->|"sí"| n19
  n20["Intenta"]:::intento
  n18 -->|"no"| n20
  n21["Llama a S3ObjectContentReader.stat"]:::llamada
  n20 --> n21
  n22["Llama a S3ObjectContentReader.clientFor"]:::llamada
  n21 --> n22
  n23{"!S3_BACKENDS.has(locator.backendCode)"}:::decision
  n22 --> n23
  n24(["500 INTERNAL BACKEND_UNSUPPORTED"]):::error
  n23 -->|"sí"| n24
  n25["Intenta"]:::intento
  n23 -->|"no"| n25
  n26{"head.ContentLength === undefined"}:::decision
  n25 --> n26
  n27(["500 INTERNAL SIZE_UNKNOWN"]):::error
  n26 -->|"sí"| n27
  n28{"error instanceof ObjectContentUnavailableError"}:::decision
  n25 -->|"si falla"| n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"sí"| n29
  n30(["500 INTERNAL PROVIDER_ERROR"]):::error
  n28 -->|"no"| n30
  n31{"!stat"}:::decision
  n26 -->|"no"| n31
  n32(["422 PRECONDITION_FAILED El objeto no está en el almacenamiento"]):::error
  n31 -->|"sí"| n32
  n33{"namespace.versioningEnabled && stat.providerVersionId !== declared.providerVersionId"}:::decision
  n31 -->|"no"| n33
  n34(["422 PRECONDITION_FAILED La versión del proveedor no coincide con la declarada"]):::error
  n33 -->|"sí"| n34
  n35{"stat.sizeBytes !== expectedSize"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED El tamaño almacenado no coincide con el declarado"]):::error
  n35 -->|"sí"| n36
  n37["Llama a S3ObjectContentReader.digest"]:::llamada
  n35 -->|"no"| n37
  n38["Llama a S3ObjectContentReader.get"]:::llamada
  n37 --> n38
  n39["Intenta"]:::intento
  n38 --> n39
  n40{"!(result.Body instanceof Readable)"}:::decision
  n39 --> n40
  n41(["500 INTERNAL BODY_UNREADABLE"]):::error
  n40 -->|"sí"| n41
  n42{"error instanceof ObjectContentUnavailableError"}:::decision
  n39 -->|"si falla"| n42
  n43(["↩ (relanza el error capturado)"]):::error
  n42 -->|"sí"| n43
  n44(["500 INTERNAL NOT_FOUND / PROVIDER_ERROR"]):::error
  n42 -->|"no"| n44
  n45["Intenta"]:::intento
  n40 -->|"no"| n45
  n46(["500 INTERNAL READ_INTERRUPTED"]):::error
  n45 -->|"si falla"| n46
  n47{"digest.sizeBytes !== expectedSize || digest.sha256 !== expectedSha"}:::decision
  n45 --> n47
  n48(["422 PRECONDITION_FAILED El contenido almacenado no coincide con el SHA-256 declarado"]):::error
  n47 -->|"sí"| n48
  n49{"error instanceof ObjectContentUnavailableError"}:::decision
  n20 -->|"si falla"| n49
  n50(["503 DEPENDENCY_UNAVAILABLE No se pudo verificar el objeto en el almacenamiento"]):::error
  n49 -->|"sí"| n50
  n51(["↩ (relanza el error capturado)"]):::error
  n49 -->|"no"| n51
  n52["Llama a ObjectStorageRepository.findVersionBySha"]:::llamada
  n47 -->|"no"| n52
  n53[("LEE object_storage.object_versions")]:::efecto
  n52 --> n53
  n54["Llama a ObjectStorageRepository.findLatestVersion"]:::llamada
  n53 --> n54
  n55[("LEE object_storage.object_versions")]:::efecto
  n54 --> n55
  n56["Llama a ObjectStorageService.materialiseVersion"]:::llamada
  n55 --> n56
  n57["Llama a ObjectStorageRepository.createVersion"]:::llamada
  n56 --> n57
  n58[("CREA object_storage.object_versions")]:::efecto
  n57 --> n58
  n59["Llama a ObjectStorageRepository.createChecksum"]:::llamada
  n58 --> n59
  n60[("CREA object_storage.object_checksums")]:::efecto
  n59 --> n60
  n61{"data.encryption"}:::decision
  n60 --> n61
  n62["Llama a ObjectStorageRepository.createEncryptionEnvelope"]:::llamada
  n61 -->|"sí"| n62
  n63[("CREA object_storage.object_encryption_envelopes")]:::efecto
  n62 --> n63
  n64["Llama a ObjectStorageRepository.createLocation"]:::llamada
  n63 --> n64
  n61 -->|"no"| n64
  n65[("CREA object_storage.object_locations")]:::efecto
  n64 --> n65
  n66[("ACTUALIZA object_storage.object_manifests · ACTUALIZA object_storage.object_manifests")]:::efecto
  n65 --> n66
  n67(("201 Responde con éxito")):::ok
  n66 --> n67
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /object-storage/uploads/{id}/complete

Completar la carga y materializar la versión del objeto

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Carga no encontrada; ResourceNotFoundException: Espacio de nombres no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La carga ya no está en curso; PreconditionFailedException: La carga caducó; PreconditionFailedException: El tamaño recibido no coincide con el declarado; PreconditionFailedException: La URI declarada no es la ubicación del objeto; PreconditionFailedException: El objeto no está en el almacenamiento; PreconditionFailedException: La versión del proveedor no coincide con la declarada; PreconditionFailedException: El tamaño almacenado no coincide con el declarado; PreconditionFailedException: El contenido almacenado no coincide con el SHA-256 declarado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ObjectContentUnavailableError: BACKEND_UNSUPPORTED; ObjectContentUnavailableError: SIZE_UNKNOWN; ObjectContentUnavailableError: PROVIDER_ERROR; ObjectContentUnavailableError: BODY_UNREADABLE; ObjectContentUnavailableError: NOT_FOUND / PROVIDER_ERROR; ObjectContentUnavailableError: READ_INTERRUPTED |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: No se pudo verificar el objeto en el almacenamiento |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectStorageService.completeUpload"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findUploadForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.multipart_uploads")]:::efecto
  n5 --> n6
  n7{"!upload"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Carga no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"upload.status !== UPLOAD_STATUS.INITIATED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La carga ya no está en curso"]):::error
  n9 -->|"sí"| n10
  n11{"upload.expiresAt && upload.expiresAt.getTime() ‹= Date.now()"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La carga caducó"]):::error
  n11 -->|"sí"| n12
  n13{"BigInt(dto.receivedSizeBytes) !== BigInt(upload.expectedSizeBytes)"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El tamaño recibido no coincide con el declarado"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ObjectStorageRepository.findNamespaceById"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE object_storage.object_namespaces")]:::efecto
  n15 --> n16
  n17{"!namespace"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Espacio de nombres no encontrado"]):::error
  n17 -->|"sí"| n18
  n19["Llama a ObjectStorageService.verifyStoredContent"]:::llamada
  n17 -->|"no"| n19
  n20{"declared.providerUri !== providerUri"}:::decision
  n19 --> n20
  n21(["422 PRECONDITION_FAILED La URI declarada no es la ubicación del objeto"]):::error
  n20 -->|"sí"| n21
  n22["Intenta"]:::intento
  n20 -->|"no"| n22
  n23["Llama a S3ObjectContentReader.stat"]:::llamada
  n22 --> n23
  n24["Llama a S3ObjectContentReader.clientFor"]:::llamada
  n23 --> n24
  n25{"!S3_BACKENDS.has(locator.backendCode)"}:::decision
  n24 --> n25
  n26(["500 INTERNAL BACKEND_UNSUPPORTED"]):::error
  n25 -->|"sí"| n26
  n27["Intenta"]:::intento
  n25 -->|"no"| n27
  n28{"head.ContentLength === undefined"}:::decision
  n27 --> n28
  n29(["500 INTERNAL SIZE_UNKNOWN"]):::error
  n28 -->|"sí"| n29
  n30{"error instanceof ObjectContentUnavailableError"}:::decision
  n27 -->|"si falla"| n30
  n31(["↩ (relanza el error capturado)"]):::error
  n30 -->|"sí"| n31
  n32(["500 INTERNAL PROVIDER_ERROR"]):::error
  n30 -->|"no"| n32
  n33{"!stat"}:::decision
  n28 -->|"no"| n33
  n34(["422 PRECONDITION_FAILED El objeto no está en el almacenamiento"]):::error
  n33 -->|"sí"| n34
  n35{"namespace.versioningEnabled && stat.providerVersionId !== declared.providerVersionId"}:::decision
  n33 -->|"no"| n35
  n36(["422 PRECONDITION_FAILED La versión del proveedor no coincide con la declarada"]):::error
  n35 -->|"sí"| n36
  n37{"stat.sizeBytes !== expectedSize"}:::decision
  n35 -->|"no"| n37
  n38(["422 PRECONDITION_FAILED El tamaño almacenado no coincide con el declarado"]):::error
  n37 -->|"sí"| n38
  n39["Llama a S3ObjectContentReader.digest"]:::llamada
  n37 -->|"no"| n39
  n40["Llama a S3ObjectContentReader.get"]:::llamada
  n39 --> n40
  n41["Intenta"]:::intento
  n40 --> n41
  n42{"!(result.Body instanceof Readable)"}:::decision
  n41 --> n42
  n43(["500 INTERNAL BODY_UNREADABLE"]):::error
  n42 -->|"sí"| n43
  n44{"error instanceof ObjectContentUnavailableError"}:::decision
  n41 -->|"si falla"| n44
  n45(["↩ (relanza el error capturado)"]):::error
  n44 -->|"sí"| n45
  n46(["500 INTERNAL NOT_FOUND / PROVIDER_ERROR"]):::error
  n44 -->|"no"| n46
  n47["Intenta"]:::intento
  n42 -->|"no"| n47
  n48(["500 INTERNAL READ_INTERRUPTED"]):::error
  n47 -->|"si falla"| n48
  n49{"digest.sizeBytes !== expectedSize || digest.sha256 !== expectedSha"}:::decision
  n47 --> n49
  n50(["422 PRECONDITION_FAILED El contenido almacenado no coincide con el SHA-256 declarado"]):::error
  n49 -->|"sí"| n50
  n51{"error instanceof ObjectContentUnavailableError"}:::decision
  n22 -->|"si falla"| n51
  n52(["503 DEPENDENCY_UNAVAILABLE No se pudo verificar el objeto en el almacenamiento"]):::error
  n51 -->|"sí"| n52
  n53(["↩ (relanza el error capturado)"]):::error
  n51 -->|"no"| n53
  n54["Llama a ObjectStorageRepository.findManifestByLogicalIdForUpdate"]:::llamada
  n49 -->|"no"| n54
  n55[("LEE object_storage.object_manifests")]:::efecto
  n54 --> n55
  n56["Llama a ObjectStorageRepository.createManifest"]:::llamada
  n55 --> n56
  n57[("CREA object_storage.object_manifests")]:::efecto
  n56 --> n57
  n58[("ACTUALIZA object_storage.multipart_uploads · ACTUALIZA object_storage.multipart_uploads")]:::efecto
  n57 --> n58
  n59["Llama a ObjectStorageRepository.findVersionBySha"]:::llamada
  n58 --> n59
  n60[("LEE object_storage.object_versions")]:::efecto
  n59 --> n60
  n61["Llama a ObjectStorageRepository.findLatestVersion"]:::llamada
  n60 --> n61
  n62[("LEE object_storage.object_versions")]:::efecto
  n61 --> n62
  n63["Llama a ObjectStorageService.materialiseVersion"]:::llamada
  n62 --> n63
  n64["Llama a ObjectStorageRepository.createVersion"]:::llamada
  n63 --> n64
  n65[("CREA object_storage.object_versions")]:::efecto
  n64 --> n65
  n66["Llama a ObjectStorageRepository.createChecksum"]:::llamada
  n65 --> n66
  n67[("CREA object_storage.object_checksums")]:::efecto
  n66 --> n67
  n68{"data.encryption"}:::decision
  n67 --> n68
  n69["Llama a ObjectStorageRepository.createEncryptionEnvelope"]:::llamada
  n68 -->|"sí"| n69
  n70[("CREA object_storage.object_encryption_envelopes")]:::efecto
  n69 --> n70
  n71["… el resto del árbol (2 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  n68 -->|"no"| n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. GET /object-storage/versions/{versionId}/content/{token}

Descargar el contenido de una versión con el enlace emitido

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enlace de acceso no válido; ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado; ResourceNotFoundException: La versión no tiene ubicación primaria; ResourceNotFoundException: El espacio de nombres de la versión no existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto no está disponible; PreconditionFailedException: La versión no tiene la integridad verificada; PreconditionFailedException: La versión está en almacenamiento frío: requiere rehidratación previa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | ObjectContentUnavailableError: BODY_UNREADABLE; ObjectContentUnavailableError: NOT_FOUND / PROVIDER_ERROR |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: No se pudo leer el objeto en el almacenamiento |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectStorageService.redeemSignedAccess"]:::llamada
  n2 --> n3
  n4["Llama a ObjectStorageService.auditedAccess"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6["Intenta"]:::intento
  n5 -->|"si falla"| n6
  n7["Llama a AuditTrailService.record"]:::llamada
  n6 --> n7
  n8["Llama a AuditLogRepository.append"]:::llamada
  n7 --> n8
  n9[("CREA audit.audit_log")]:::efecto
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 --> n10
  n11["Llama a ObjectStorageService.redeemSignedAccessAudited"]:::llamada
  n5 --> n11
  n12{"!claims || claims.v !== versionId || claims.s !== actor.id || claims.m !== SIGNED_ACCESS.METHOD || claims.exp…"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND Enlace de acceso no válido"]):::error
  n12 -->|"sí"| n13
  n14["Transacción: transactional(…)"]:::transaccion
  n12 -->|"no"| n14
  n15["Llama a ObjectStorageService.resolveServableVersion"]:::llamada
  n14 --> n15
  n16["Llama a ObjectStorageRepository.findVersionById"]:::llamada
  n15 --> n16
  n17[("LEE object_storage.object_versions")]:::efecto
  n16 --> n17
  n18{"!version"}:::decision
  n17 --> n18
  n19(["404 NOT_FOUND Versión no encontrada"]):::error
  n18 -->|"sí"| n19
  n20["Llama a ObjectStorageRepository.findManifestById"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE object_storage.object_manifests")]:::efecto
  n20 --> n21
  n22{"!manifest"}:::decision
  n21 --> n22
  n23(["404 NOT_FOUND Objeto no encontrado"]):::error
  n22 -->|"sí"| n23
  n24{"manifest.lifecycleState === OBJECT_LIFECYCLE.PENDING_DELETION || manifest.lifecycleState === OBJECT_LIFECYCLE…"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED El objeto no está disponible"]):::error
  n24 -->|"sí"| n25
  n26["Llama a ObjectStorageRepository.findPrimaryLocation"]:::llamada
  n24 -->|"no"| n26
  n27[("LEE object_storage.object_locations")]:::efecto
  n26 --> n27
  n28{"!location"}:::decision
  n27 --> n28
  n29(["404 NOT_FOUND La versión no tiene ubicación primaria"]):::error
  n28 -->|"sí"| n29
  n30["Llama a ObjectStorageRepository.findChecksum"]:::llamada
  n28 -->|"no"| n30
  n31[("LEE object_storage.object_checksums")]:::efecto
  n30 --> n31
  n32{"!checksum || checksum.verificationStatus !== CHECKSUM_VERIFICATION.VERIFIED || !CHECKSUM_SOURCES_TRUSTED.incl…"}:::decision
  n31 --> n32
  n33(["422 PRECONDITION_FAILED La versión no tiene la integridad verificada"]):::error
  n32 -->|"sí"| n33
  n34{"COLD_STORAGE_CLASSES.includes(location.storageClass)"}:::decision
  n32 -->|"no"| n34
  n35(["422 PRECONDITION_FAILED La versión está en almacenamiento frío: requiere rehidratación previa"]):::error
  n34 -->|"sí"| n35
  n36["Llama a ObjectStorageService.recordDicomAccess"]:::llamada
  n34 -->|"no"| n36
  n37["Llama a DicomRepository.findDicomCoordinates"]:::llamada
  n36 --> n37
  n38[("LEE object_storage.dicom_instance_manifests · LEE object_storage.dicom_series_manifests · LEE object_storage.…")]:::efecto
  n37 --> n38
  n39["Llama a DicomRepository.createAccessLog"]:::llamada
  n38 --> n39
  n40[("CREA object_storage.dicomweb_access_logs")]:::efecto
  n39 --> n40
  n41["Llama a AuditTrailService.record"]:::llamada
  n40 --> n41
  n42["Llama a AuditLogRepository.append"]:::llamada
  n41 --> n42
  n43[("CREA audit.audit_log")]:::efecto
  n42 --> n43
  n44["Llama a ObjectStorageRepository.findNamespaceById"]:::llamada
  n43 --> n44
  n45[("LEE object_storage.object_namespaces")]:::efecto
  n44 --> n45
  n46{"!namespace"}:::decision
  n45 --> n46
  n47(["404 NOT_FOUND El espacio de nombres de la versión no existe"]):::error
  n46 -->|"sí"| n47
  n48["Intenta"]:::intento
  n46 -->|"no"| n48
  n49["Llama a S3ObjectContentReader.open"]:::llamada
  n48 --> n49
  n50["Llama a S3ObjectContentReader.get"]:::llamada
  n49 --> n50
  n51["Intenta"]:::intento
  n50 --> n51
  n52{"!(result.Body instanceof Readable)"}:::decision
  n51 --> n52
  n53(["500 INTERNAL BODY_UNREADABLE"]):::error
  n52 -->|"sí"| n53
  n54{"error instanceof ObjectContentUnavailableError"}:::decision
  n51 -->|"si falla"| n54
  n55(["↩ (relanza el error capturado)"]):::error
  n54 -->|"sí"| n55
  n56(["500 INTERNAL NOT_FOUND / PROVIDER_ERROR"]):::error
  n54 -->|"no"| n56
  n57{"error instanceof ObjectContentUnavailableError"}:::decision
  n48 -->|"si falla"| n57
  n58(["503 DEPENDENCY_UNAVAILABLE No se pudo leer el objeto en el almacenamiento"]):::error
  n57 -->|"sí"| n58
  n59(["↩ (relanza el error capturado)"]):::error
  n57 -->|"no"| n59
  n60(("200 Responde con éxito")):::ok
  n52 -->|"no"| n60
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /object-storage/versions/{versionId}/integrity-checks

Registrar la verificación de integridad

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectGovernanceService.recordIntegrityCheck"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findVersionById"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_versions")]:::efecto
  n5 --> n6
  n7{"!version"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE object_storage.object_manifests")]:::efecto
  n9 --> n10
  n11{"!manifest"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Objeto no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ObjectGovernanceRepository.createIntegrityCheck"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA object_storage.object_integrity_checks")]:::efecto
  n13 --> n14
  n15["Llama a ObjectStorageRepository.findChecksumForUpdate"]:::llamada
  n14 --> n15
  n16[("LEE object_storage.object_checksums")]:::efecto
  n15 --> n16
  n17{"checksum"}:::decision
  n16 --> n17
  n18[("ACTUALIZA object_storage.object_checksums · ACTUALIZA object_storage.object_checksums · ACTUALIZA object_stor…")]:::efecto
  n17 -->|"sí"| n18
  n19{"passed"}:::decision
  n18 --> n19
  n20[("ACTUALIZA object_storage.object_checksums")]:::efecto
  n19 -->|"sí"| n20
  n21["Llama a ObjectStorageRepository.findPrimaryLocationForUpdate"]:::llamada
  n20 --> n21
  n19 -->|"no"| n21
  n17 -->|"no"| n21
  n22[("LEE object_storage.object_locations")]:::efecto
  n21 --> n22
  n23{"location && passed"}:::decision
  n22 --> n23
  n24[("ACTUALIZA object_storage.object_locations · ACTUALIZA object_storage.object_locations")]:::efecto
  n23 -->|"sí"| n24
  n25{"!passed"}:::decision
  n24 --> n25
  n23 -->|"no"| n25
  n26[("ACTUALIZA object_storage.object_manifests · ACTUALIZA object_storage.object_manifests")]:::efecto
  n25 -->|"sí"| n26
  n27(("201 Responde con éxito")):::ok
  n26 --> n27
  n25 -->|"no"| n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /object-storage/versions/{versionId}/legal-holds

Colocar una retención legal

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectGovernanceService.placeLegalHold"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectStorageRepository.findVersionById"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_versions")]:::efecto
  n5 --> n6
  n7{"!version"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE object_storage.object_manifests")]:::efecto
  n9 --> n10
  n11{"!manifest"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Objeto no encontrado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ObjectGovernanceRepository.createLegalHold"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA object_storage.object_legal_holds")]:::efecto
  n13 --> n14
  n15[("ACTUALIZA object_storage.object_manifests · ACTUALIZA object_storage.object_manifests")]:::efecto
  n14 --> n15
  n16["Llama a ObjectGovernanceRepository.findActiveLegalHolds"]:::llamada
  n15 --> n16
  n17[("LEE object_storage.object_legal_holds")]:::efecto
  n16 --> n17
  n18(("201 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. DELETE /object-storage/versions/{versionId}/legal-holds/{holdId}

Liberar una retención legal

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Retención legal no encontrada; ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 409 | `CONFLICT` | ConflictException: La retención legal ya está liberada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La retención es de otra versión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectGovernanceService.releaseLegalHold"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ObjectGovernanceRepository.findLegalHoldForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE object_storage.object_legal_holds")]:::efecto
  n5 --> n6
  n7{"!hold"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Retención legal no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"hold.objectVersionId !== versionId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La retención es de otra versión"]):::error
  n9 -->|"sí"| n10
  n11{"hold.holdState !== LEGAL_HOLD_STATE.ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT La retención legal ya está liberada"]):::error
  n11 -->|"sí"| n12
  n13["Llama a ObjectStorageRepository.findVersionById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE object_storage.object_versions")]:::efecto
  n13 --> n14
  n15{"!version"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Versión no encontrada"]):::error
  n15 -->|"sí"| n16
  n17["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE object_storage.object_manifests")]:::efecto
  n17 --> n18
  n19{"!manifest"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND Objeto no encontrado"]):::error
  n19 -->|"sí"| n20
  n21[("ACTUALIZA object_storage.object_legal_holds · ACTUALIZA object_storage.object_legal_holds")]:::efecto
  n19 -->|"no"| n21
  n22["Llama a ObjectGovernanceRepository.findActiveLegalHolds"]:::llamada
  n21 --> n22
  n23[("LEE object_storage.object_legal_holds")]:::efecto
  n22 --> n23
  n24{"remaining.length === 0"}:::decision
  n23 --> n24
  n25["Llama a ObjectGovernanceRepository.findActiveRetentionLockForUpdate"]:::llamada
  n24 -->|"sí"| n25
  n26[("LEE object_storage.object_retention_locks")]:::efecto
  n25 --> n26
  n27[("ACTUALIZA object_storage.object_manifests · ACTUALIZA object_storage.object_manifests")]:::efecto
  n26 --> n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  n24 -->|"no"| n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /object-storage/versions/{versionId}/retention-lock

Aplicar retención WORM sobre la versión

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 409 | `CONFLICT` | ConflictException: La versión ya tiene una retención vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La retención debe terminar en el futuro; PreconditionFailedException: El espacio de nombres no tiene bloqueo de objetos habilitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectGovernanceService.applyRetentionLock"]:::llamada
  n2 --> n3
  n4{"retainUntil.getTime() ‹= Date.now()"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La retención debe terminar en el futuro"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a ObjectStorageRepository.findVersionById"]:::llamada
  n6 --> n7
  n8[("LEE object_storage.object_versions")]:::efecto
  n7 --> n8
  n9{"!version"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Versión no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ObjectStorageRepository.findManifestForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE object_storage.object_manifests")]:::efecto
  n11 --> n12
  n13{"!manifest"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Objeto no encontrado"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ObjectStorageRepository.findNamespaceById"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE object_storage.object_namespaces")]:::efecto
  n15 --> n16
  n17{"!namespace?.objectLockEnabled"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED El espacio de nombres no tiene bloqueo de objetos habilitado"]):::error
  n17 -->|"sí"| n18
  n19["Llama a ObjectGovernanceRepository.findActiveRetentionLockForUpdate"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE object_storage.object_retention_locks")]:::efecto
  n19 --> n20
  n21{"active"}:::decision
  n20 --> n21
  n22(["409 CONFLICT La versión ya tiene una retención vigente"]):::error
  n21 -->|"sí"| n22
  n23["Llama a ObjectGovernanceRepository.createRetentionLock"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA object_storage.object_retention_locks")]:::efecto
  n23 --> n24
  n25{"manifest.lifecycleState !== OBJECT_LIFECYCLE.LEGAL_HOLD"}:::decision
  n24 --> n25
  n26[("ACTUALIZA object_storage.object_manifests")]:::efecto
  n25 -->|"sí"| n26
  n27[("ACTUALIZA object_storage.object_manifests")]:::efecto
  n26 --> n27
  n25 -->|"no"| n27
  n28{"dto.policyCode"}:::decision
  n27 --> n28
  n29[("ACTUALIZA object_storage.object_manifests")]:::efecto
  n28 -->|"sí"| n29
  n30[("ACTUALIZA object_storage.object_manifests")]:::efecto
  n29 --> n30
  n28 -->|"no"| n30
  n31(("201 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /object-storage/versions/{versionId}/signed-url

Emitir acceso firmado a una versión

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado; ResourceNotFoundException: La versión no tiene ubicación primaria |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto no está disponible; PreconditionFailedException: La versión no tiene la integridad verificada; PreconditionFailedException: La versión está en almacenamiento frío: requiere rehidratación previa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ObjectStorageService.issueSignedUrl"]:::llamada
  n2 --> n3
  n4["Llama a ObjectStorageService.auditedAccess"]:::llamada
  n3 --> n4
  n5["Intenta"]:::intento
  n4 --> n5
  n6["Intenta"]:::intento
  n5 -->|"si falla"| n6
  n7["Llama a AuditTrailService.record"]:::llamada
  n6 --> n7
  n8["Llama a AuditLogRepository.append"]:::llamada
  n7 --> n8
  n9[("CREA audit.audit_log")]:::efecto
  n8 --> n9
  n10(["↩ (relanza el error capturado)"]):::error
  n9 --> n10
  n11["Llama a ObjectStorageService.issueSignedUrlAuthorised"]:::llamada
  n5 --> n11
  n12["Transacción: transactional(…)"]:::transaccion
  n11 --> n12
  n13["Llama a ObjectStorageService.resolveServableVersion"]:::llamada
  n12 --> n13
  n14["Llama a ObjectStorageRepository.findVersionById"]:::llamada
  n13 --> n14
  n15[("LEE object_storage.object_versions")]:::efecto
  n14 --> n15
  n16{"!version"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Versión no encontrada"]):::error
  n16 -->|"sí"| n17
  n18["Llama a ObjectStorageRepository.findManifestById"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE object_storage.object_manifests")]:::efecto
  n18 --> n19
  n20{"!manifest"}:::decision
  n19 --> n20
  n21(["404 NOT_FOUND Objeto no encontrado"]):::error
  n20 -->|"sí"| n21
  n22{"manifest.lifecycleState === OBJECT_LIFECYCLE.PENDING_DELETION || manifest.lifecycleState === OBJECT_LIFECYCLE…"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED El objeto no está disponible"]):::error
  n22 -->|"sí"| n23
  n24["Llama a ObjectStorageRepository.findPrimaryLocation"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE object_storage.object_locations")]:::efecto
  n24 --> n25
  n26{"!location"}:::decision
  n25 --> n26
  n27(["404 NOT_FOUND La versión no tiene ubicación primaria"]):::error
  n26 -->|"sí"| n27
  n28["Llama a ObjectStorageRepository.findChecksum"]:::llamada
  n26 -->|"no"| n28
  n29[("LEE object_storage.object_checksums")]:::efecto
  n28 --> n29
  n30{"!checksum || checksum.verificationStatus !== CHECKSUM_VERIFICATION.VERIFIED || !CHECKSUM_SOURCES_TRUSTED.incl…"}:::decision
  n29 --> n30
  n31(["422 PRECONDITION_FAILED La versión no tiene la integridad verificada"]):::error
  n30 -->|"sí"| n31
  n32{"COLD_STORAGE_CLASSES.includes(location.storageClass)"}:::decision
  n30 -->|"no"| n32
  n33(["422 PRECONDITION_FAILED La versión está en almacenamiento frío: requiere rehidratación previa"]):::error
  n32 -->|"sí"| n33
  n34["Llama a ObjectStorageRepository.findEncryptionEnvelope"]:::llamada
  n32 -->|"no"| n34
  n35[("LEE object_storage.object_encryption_envelopes")]:::efecto
  n34 --> n35
  n36["Llama a ObjectStorageService.recordDicomAccess"]:::llamada
  n35 --> n36
  n37["Llama a DicomRepository.findDicomCoordinates"]:::llamada
  n36 --> n37
  n38[("LEE object_storage.dicom_instance_manifests · LEE object_storage.dicom_series_manifests · LEE object_storage.…")]:::efecto
  n37 --> n38
  n39["Llama a DicomRepository.createAccessLog"]:::llamada
  n38 --> n39
  n40[("CREA object_storage.dicomweb_access_logs")]:::efecto
  n39 --> n40
  n41["Llama a AuditTrailService.record"]:::llamada
  n40 --> n41
  n42["Llama a AuditLogRepository.append"]:::llamada
  n41 --> n42
  n43[("CREA audit.audit_log")]:::efecto
  n42 --> n43
  n44(("201 Responde con éxito")):::ok
  n43 --> n44
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
| GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid} | 200, 401, 403, 429 | 5 |
