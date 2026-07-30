# Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM)

Cargas multiparte, versiones inmutables direccionadas por contenido, catálogo DICOM con registro de
accesos, payloads grandes enlazados a su origen, retención WORM y legal, verificación de integridad,
archivado en frío y borrado gobernado.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-60-01 | `POST /object-storage/namespaces/:code/uploads/initiate` | Iniciar carga multiparte |
| UC-60-02 | `POST /object-storage/uploads/:id/complete` | Completar y materializar versión |
| UC-60-03 | `POST /object-storage/objects/:manifestId/versions` | Nueva versión inmutable |
| UC-60-04 | `POST /object-storage/dicom/studies/catalog` | Catalogar jerarquía DICOM |
| UC-60-05 | `GET /dicomweb/studies/:studyUid/series/:seriesUid/instances/:sopUid` | Acceso DICOMweb |
| UC-60-06 | `POST /object-storage/large-payloads` | Registrar payload grande |
| UC-60-07 | `POST /object-storage/versions/:versionId/retention-lock` | Retención WORM |
| UC-60-08 | `POST` · `DELETE /object-storage/versions/:versionId/legal-holds[/:holdId]` | Colocar y liberar retención legal |
| UC-60-09 | `POST /object-storage/versions/:versionId/signed-url` | Emitir acceso firmado |
| UC-60-10 | `POST /object-storage/versions/:versionId/integrity-checks` | Verificar integridad |
| UC-60-11 | `POST /object-storage/archive-jobs/build` | Archivar a frío |
| UC-60-12 | `POST /object-storage/objects/:manifestId/request-deletion` | Borrado gobernado |

Los casos de uso escriben las acciones con `:` (`uploads:initiate`, `{id}:complete`,
`studies:catalog`, `archive-jobs:build`, `{manifestId}:request-deletion`). Nest 11 trata `:` como
inicio de parámetro en cualquier punto del segmento, así que las rutas publicadas usan segmentos
planos, como en el resto del proyecto.

## Estados en `varchar`, no en conceptos

**Este módulo no usa `*_concept_id`.** Sus columnas de estado son `varchar`, y no es un descuido del
modelo: son estados de infraestructura de almacenamiento —`active`, `initiated`, `glacier`,
`compliance`— no vocabulario clínico gobernado, y no tienen por qué vivir en `terminology`.

Se recogen en `constants/object-storage.constants.ts` por la misma razón por la que existen los
conceptos: para que ningún literal suelto se escape a un servicio y nadie escriba `'ACTIVE'` donde el
modelo dice `'active'`. Todos los valores salen de las notas del caso de uso; no se inventa ninguno.

## Entidades

Escritas: `multipart_uploads`, `object_manifests`, `object_versions` (inmutable), `object_checksums`,
`object_encryption_envelopes`, `object_locations`, `large_payload_manifests`,
`dicom_study_manifests`, `dicom_series_manifests`, `dicom_instance_manifests`,
`dicomweb_access_logs` (append-only), `object_retention_locks`, `object_legal_holds`,
`object_integrity_checks` (append-only), `object_deletion_markers`, `archive_manifests`.

Sólo leídas: `object_namespaces`.

## Flujo general

```
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

## Reglas de negocio

- **La clave de destino es opaca**: no lleva datos del paciente. Una clave que dejara deducir de
  quién es el estudio sería una fuga por sí sola, aunque el objeto esté cifrado.
- **El tamaño recibido debe cuadrar con el declarado.** Aceptar una carga incompleta deja un objeto
  que parece bueno y no lo es, y el problema aparece meses después al intentar leerlo.
- **El mismo contenido no se versiona dos veces**: versionar lo idéntico desplaza a la versión que sí
  importa y engorda el linaje sin razón.
- **La versión nace completa**: checksum, sobre de cifrado y ubicación primaria se escriben con ella.
  Una versión sin checksum no se puede verificar y sin ubicación no se puede servir — nacer a medias
  no le sirve a nadie.
- **El catálogo DICOM es reentrante**: un router que reenvía el mismo estudio no duplica nada, porque
  los UID son únicos en su nivel. Los contadores se **recuentan** al final en lugar de irse sumando,
  para que un reenvío parcial no los deje inflados.
- **El acceso DICOMweb denegado también se registra.** Un log que sólo guarda los accesos que
  salieron bien no sirve para vigilar accesos indebidos, que es justo para lo que existe.
- **Sin propósito de uso no se sirve imagen clínica**: es el dato que después permite juzgar si el
  acceso estaba justificado.
- **La retención `compliance` es WORM de verdad**: ni se acorta ni se libera antes de tiempo, ni
  siquiera por quien la puso. Una retención vigente bloquea cualquier intento de sustituirla.
- **La retención legal manda sobre todo lo demás**: anula el borrado aunque la retención de
  cumplimiento haya vencido, e impide degradar a frío. Mover a glaciar lo que un juzgado puede pedir
  mañana convierte una entrega en horas en una entrega en días.
- **Levantar una retención legal no levanta las demás**: el objeto vuelve a su estado anterior sólo
  cuando no queda ninguna viva.
- **El resultado de la verificación de integridad se deriva** de comparar el hash guardado con el
  recomputado. No cuadrar marca el objeto **corrupto**, y a partir de ahí no se sirve: devolver datos
  clínicos alterados sin avisar es peor que devolver un error.
- **Lo frío no se sirve directo**: firmar una URL sobre `glacier` daría un enlace que falla al
  abrirlo. Hay que rehidratar antes.
- **El borrado es lógico**: se marca la intención y el worker la ejecuta después contra el proveedor.
  Dos guardas lo abortan, y las dos son deliberadas.

## Permisos

`STORAGE_ADMIN` cubre el módulo. `STORAGE_CLIENT` sube. `PACS_GATEWAY` cataloga DICOM.
`COMPLIANCE_OFFICER` retiene y solicita borrados. `LEGAL_COUNSEL` coloca y libera retenciones
legales. `DICOM_VIEWER` y `CLINICIAN` consultan imagen y piden acceso firmado. `SYSTEM` versiona,
verifica integridad y archiva.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre la carga al completarla, sobre el manifiesto en todo lo que lo versione, retenga,
archive o borre, sobre el estudio y la serie DICOM al recalcular contadores, sobre la retención
vigente, sobre la retención legal al liberarla, y sobre el checksum y la ubicación primaria al
verificarlos.

La unicidad hace el resto: carga por proveedor, versión por `sha256`, UID por nivel DICOM, payload
por origen y tipo, hash de lote de archivado y marcador de borrado por objeto.

## Logs

`operation: 'object-storage.<área>.<acción>'`. Nivel `warn` en **toda emisión de acceso firmado y
todo acceso DICOMweb** —son el momento en que el dato sale de nuestro control—, y además en
aplicación de retención, colocación y liberación de retención legal, corrupción detectada y solicitud
de borrado. No se loguean claves de objeto ni metadatos DICOM.

## Pruebas

`yarn test --testPathPatterns=modules/object_storage` — 76 pruebas (62 de servicio + 14 de
delegación de los dos controladores).

## Divergencias con el caso de uso v3.9

- **`/dicomweb/.../instances/{uid}` no devuelve el píxel.** El caso de uso lo describe como WADO-RS.
  Aquí resuelve la jerarquía, autoriza, registra el acceso y entrega la referencia del objeto; el
  binario se obtiene después con la URL firmada (UC-60-09), que es quien tiene la credencial del
  proveedor. Devolverlo desde aquí obligaría a que la API hiciera de proxy de todo el tráfico de
  imagen.
- **`/object-storage/versions/{id}/signed-url` no devuelve la URL ya firmada**, sino la URI del
  proveedor, la versión de clave y la caducidad. Firmar es del adaptador de almacenamiento; este
  módulo autoriza y deja el rastro.

## Pendiente

- **Adaptador del proveedor**: subir las partes, firmar la URL, recomputar el hash y ejecutar el
  borrado son operaciones contra S3/MinIO/Azure. El módulo registra y gobierna; el adaptador
  ejecuta.
- **Rehidratación desde frío**: se detecta y se rechaza; encolar la rehidratación corresponde al
  worker de ciclo de vida.
- **Autorización y consentimiento** (`authz.*`, `consent.*`): se guarda el propósito de uso y se
  registra el acceso, pero evaluar la política cruzaría la frontera del esquema.
- **Bloqueo distribuido** (`redis_runtime.distributed_lock_entries`) para las verificaciones de
  integridad concurrentes: aquí lo cubre el `FOR UPDATE` sobre el manifiesto; el lock externo llegará
  con el módulo 54.
- **Caché de URLs firmadas** (`redis_runtime.signed_url_cache_entries`): la respuesta ya lleva la
  caducidad; cachearla es del módulo 54.
- **Outbox** (módulo 35, ya disponible): `MultipartUploadInitiated`, `ObjectVersionCommitted`,
  `ObjectVersionSuperseded`, `DicomStudyCatalogued`, `DicomWebAccessRecorded`,
  `LargePayloadRegistered`, `ObjectRetentionApplied`, `LegalHoldPlaced/Released`, `SignedUrlIssued`,
  `ObjectIntegrityVerified`, `ObjectCorruptionDetected`, `ObjectsArchived`,
  `ObjectDeletionRequested`. Quedan por cablear a `OutboxService.publishDomainEvent()`.
