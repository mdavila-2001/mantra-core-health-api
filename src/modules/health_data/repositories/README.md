# Repositorios de la plataforma de datos de salud

Acceso a datos de `health_data.*`. Sin lógica de negocio: sólo lecturas, escrituras y el modo de
bloqueo que cada operación necesita.

## Reparto

| Repositorio | Tablas | Por qué va junto |
| --- | --- | --- |
| `HealthIngestionRepository` | conexiones, lotes, registros crudos | El camino de entrada, del origen a la cola |
| `CanonicalResourcesRepository` | recursos, versiones, identificadores, relaciones, bindings | El agregado canónico y todo lo que le cuelga |
| `HealthValidationRepository` | perfiles FHIR, corridas y hallazgos, reglas y corridas de calidad | Todo lo que juzga un dato ya proyectado |
| `PatientIdentityRepository` | candidatos, decisiones, clústeres, miembros, línea de tiempo | La identidad del paciente y su historia |
| `DataReleaseRepository` | perfiles y corridas de de-id, trabajos y manifiestos de exportación | Lo que sale del sistema |
| `HealthProvenanceRepository` | procedencia, objetivos y linaje | Ver abajo |

`HealthProvenanceRepository` tiene tres tablas y sólo métodos de inserción a propósito: sus filas las
escriben cinco casos de uso repartidos en cuatro servicios —ingesta, binding, de-identificación,
exportación y retiro—. Colgarlas de cualquiera de ellos obligaría a los otros a depender de un
repositorio que no es suyo.

## Lecturas con bloqueo

| Método | Modo | Por qué |
| --- | --- | --- |
| `findConnectionForUpdate` | `FOR UPDATE` | Abrir el lote sella `last_success_at` |
| `findBatchForUpdate` | `FOR UPDATE` | Añadir registros y cerrar tocan sus contadores |
| `findRecordForUpdate` | `FOR UPDATE` | Proyectar lo saca de la cola |
| `findResourceForUpdate` | `FOR UPDATE` | Versionar, cuarentenar, enlazar y retirar |
| `findResourceByLogicalIdForUpdate` | `FOR UPDATE` | Es el destino del upsert de la proyección |
| `findPrimaryIdentifierForUpdate` | `FOR UPDATE` | Ceder y tomar el principal en la misma transacción |
| `findLiveRelationshipForUpdate` | `FOR UPDATE` | La relación saliente se cierra al crear la nueva |
| `findLiveRelationshipsForUpdate` / `findLiveBindingsForUpdate` | `FOR UPDATE` | El retiro los cierra en bloque |
| `findCandidateForUpdate` | `FOR UPDATE` | Una sola decisión por candidato |
| `findClusterForUpdate` / `findClusterByMemberForUpdate` | `FOR UPDATE` | Sumar miembros al mismo clúster |
| `findMemberForUpdate` | `FOR UPDATE` | No duplicar la pertenencia |
| `findExportJobForUpdate` | `FOR UPDATE` | Añadir manifiestos al trabajo |

Las lecturas de `$everything` no bloquean nada: es un camino de sólo lectura y no debe frenar a quien
publica.

## Consultas que llevan semántica

- **`findBatchByIdentifier`** es la comprobación de "un lote no se reabre".
- **`findRecordBySource`** deduplica el reintento del worker por
  `(lote, identificador de origen, versión de origen)`.
- **`findResourcesByPatient`** acepta una **lista** de perfiles: es lo que permite expandir la
  identidad por el clúster del MPI en un solo viaje.
- **`findVersionsByIds`** trae las versiones vigentes de todos los recursos de una vez; recorrerlas
  recurso a recurso multiplicaría las consultas por el tamaño del Bundle.
- **`findLiveRelationshipsBySources`** hace lo propio con las relaciones.
- **`findValidationRun(version, perfil, validador)`** evita repetir la misma validación.
- **`findOpenIssue`** identifica la incidencia idéntica ya abierta: misma regla, mismo recurso, mismo
  campo y mismo valor observado.
- **`findClusterByMemberForUpdate`** resuelve el clúster **a través de** la pertenencia viva del
  perfil, que es como se pregunta de verdad: "¿este paciente ya está unido a alguien?".
- **`findTimelineEntryBySource`** es la idempotencia de la proyección.
- Las consultas de vigencia (`effective_to: null`, `ended_at: null`) expresan la invariante de "sólo
  uno vigente" en la consulta, no en memoria.

## Inmutables

`createResourceVersion`, `createProvenanceRecord`, `createProvenanceTarget`, `createLineageEdge`,
`createDecision`, `createTimelineEntry` y `createExportManifest` sólo insertan: no hay método para
modificarlos ni eliminarlos. Son, respectivamente, lo que se afirmó y cuándo, de dónde salió, quién
decidió unir dos historias, qué vio el paciente y qué se entregó exactamente. Todos dejarían de
servir para lo que existen si se pudieran reescribir.

## Auditoría

`createdBy(actorUserId)` sólo donde la tabla tiene columnas de auditoría —los clústeres de
identidad—. El resto lleva sus propias marcas (`recorded_at`, `created_at`, `requested_at`), y las
tablas con `updated_at` se sellan desde el servicio.

## Pruebas

Los repositorios no tienen suite propia; se ejercitan como dobles desde los cinco servicios.
