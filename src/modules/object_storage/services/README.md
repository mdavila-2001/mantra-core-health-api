# Servicios de almacenamiento de objetos

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

- **`ObjectStorageService`** (UC-60-01 … 03, 06, 09) — cargas, versiones, payloads grandes y emisión
  de acceso firmado.
- **`DicomCatalogService`** (UC-60-04, 05) — jerarquía DICOM y registro de accesos.
- **`ObjectGovernanceService`** (UC-60-07, 08, 10, 11, 12) — retención, integridad, archivado y
  borrado.

`ObjectStorageService` inyecta `DicomRepository` sólo para una cosa: registrar el acceso cuando la
URL firmada es de un objeto DICOM. Llamar a `DicomCatalogService` repartiría la transacción entre dos
dueños.

## Reglas de negocio

### Objetos

- **Carga (01)**: espacio activo; idempotente por carga del proveedor.
- **Completar (02)**: carga en curso, no caducada, y **tamaño recibido igual al declarado**; upsert
  del manifiesto por identificador lógico; el mismo `sha256` devuelve la versión existente.
- **Versión (03)**: objeto activo, espacio con versionado habilitado, contenido distinto al vigente;
  se encadena con `supersedes_version_id`.
- **Payload grande (06)**: un payload por origen y tipo.
- **Acceso firmado (09)**: objeto no borrado ni corrupto, con ubicación primaria que no sea fría.

### DICOM

- **Catálogo (04)**: reentrante por UID en los tres niveles; la instancia exige un objeto ya
  materializado; contadores recontados al cierre; modalidades del estudio deducidas de sus series,
  sin repetir y en orden estable.
- **Acceso (05)**: exige propósito de uso y resuelve la jerarquía completa; **cualquier fallo se
  registra como denegado** en lugar de lanzar.

### Gobierno

- **Retención (07)**: espacio con bloqueo habilitado, fecha futura, ninguna retención vigente; no
  degrada un objeto que ya está bajo retención legal.
- **Retención legal (08)**: colocar marca el objeto; liberar sólo lo devuelve si no queda ninguna
  viva, y respeta la retención de cumplimiento que sobreviva.
- **Integridad (10)**: resultado derivado del hash; fallar marca el objeto corrupto y el checksum
  como discordante; pasar marca la réplica verificada.
- **Archivado (11)**: idempotente por hash de lote; **una retención legal viva lo impide**.
- **Borrado (12)**: idempotente por objeto; retención legal viva y retención `compliance` sin vencer
  lo abortan.

## Por qué el acceso DICOMweb devuelve en vez de lanzar

`resolveInstance()` no lanza `ResourceNotFoundException` cuando el estudio no existe o falta el
propósito de uso: devuelve `outcome: 'denied'` con su motivo, **después de escribir el log**.

Lanzar abortaría la transacción y con ella el registro del intento. Un log de accesos que sólo guarda
los que salieron bien no sirve para lo único para lo que existe: detectar a quien anda mirando lo que
no debe.

## Por qué la versión nace completa

`materialiseVersion()` escribe versión, checksum, sobre de cifrado y ubicación primaria en el mismo
paso. Están juntos porque una versión sin checksum no se puede verificar y sin ubicación no se puede
servir: nacer a medias no le sirve a nadie, y dejarlo para "luego" garantiza que algún camino se
olvide de hacerlo.

## Precisión numérica

`size_bytes` y `record_count` son `bigint` y viajan como cadena. La comparación entre tamaño
declarado y recibido se hace con `BigInt`: un fichero de imagen médica grande pasado por `number`
podría cuadrar por redondeo cuando no cuadra.

## Dependencias

`EntityManager`, sus repositorios y `PinoLogger`.

## Excepciones

`ResourceNotFoundException` (espacio, carga, objeto, versión, ubicación primaria o retención legal
desconocidos), `PreconditionFailedException` (espacio inactivo o sin versionado o sin bloqueo de
objetos, carga fuera de curso o caducada, tamaño discordante, objeto no activo, objeto corrupto o
borrado, almacenamiento frío, retención en el pasado, retención legal de otra versión, objeto sin
versiones, retención legal viva, retención de cumplimiento vigente) y `ConflictException` (retención
ya vigente, retención legal ya liberada).

Lo repetido **no es error**: carga, versión, payload, archivado y borrado ya solicitados devuelven
`duplicate: true` con lo que ya había.

## Logs

`operation: 'object-storage.<área>.<acción>'`. `warn` en toda emisión de acceso firmado y todo acceso
DICOMweb —incluidos los denegados—, y además en retención aplicada, retención legal colocada o
liberada, corrupción detectada y borrado solicitado. No se loguean claves de objeto ni metadatos
DICOM.

## Pruebas

- `object-storage.service.spec.ts` (30): idempotencia de la carga, tamaño discordante, carga
  caducada, versión duplicada por contenido, encadenado de versiones, frío rechazado, objeto corrupto
  o borrado no servido y registro del acceso DICOM.
- `object-governance.service.spec.ts` (28): retención en el pasado, segunda retención, objeto bajo
  hold que no se degrada, liberación con y sin retenciones supervivientes, integridad que pasa y que
  falla —con comparación insensible a mayúsculas—, archivado bloqueado por hold e idempotente, y las
  dos guardas del borrado con sus dos excepciones.
- `dicom-catalog.service.spec.ts` (14): catálogo reentrante, instancias ya presentes, modalidades
  deducidas, objeto inexistente, y los cinco caminos de denegación del acceso DICOMweb.
