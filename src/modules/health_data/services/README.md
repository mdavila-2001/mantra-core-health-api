# Servicios de la plataforma de datos de salud

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

Cinco, uno por etapa del recorrido del dato:

- **`HealthIngestionService`** (UC-52-01 … 03) — lotes, registros crudos y proyección canónica. Lo
  que ejecuta el worker de ingesta.
- **`CanonicalResourcesService`** (UC-52-04 … 06, 14) — identificadores, relaciones, bindings y
  retiro. Lo que gobierna el informático clínico.
- **`HealthValidationService`** (UC-52-07, 08) — validación FHIR y reglas de calidad. Lo que juzga un
  dato ya proyectado.
- **`PatientIdentityService`** (UC-52-09, 10) — MPI y línea de tiempo. Lo que decide una persona.
- **`DataReleaseService`** (UC-52-11 … 13) — de-identificación, exportación y `$everything`. Lo que
  sale del sistema.

## Dependencias cruzadas

En una sola dirección, y siempre a repositorios —ningún servicio llama a otro servicio, para que una
transacción no quede repartida entre dos dueños:

- `HealthIngestionService` → `CanonicalResourcesRepository` (upsert del recurso) y
  `HealthProvenanceRepository`.
- `CanonicalResourcesService` → `HealthProvenanceRepository` (linaje del binding, procedencia del
  retiro).
- `HealthValidationService` → `CanonicalResourcesRepository` (la cuarentena vive en el recurso).
- `DataReleaseService` → `CanonicalResourcesRepository`, `PatientIdentityRepository` y
  `HealthProvenanceRepository`.

## Reglas de negocio

### Ingesta

- **Lote (01)**: conexión activa; el mismo identificador en la misma conexión devuelve el lote
  existente; abrirlo sella `last_success_at` en la conexión.
- **Registro (02)**: lote recibiendo; dedupe por lote, identificador de origen y versión de origen;
  nace `queued` con validación `pending`.
- **Cierre (02)**: una sola vez; los contadores se recuentan contra la tabla y los rechazados en el
  origen se suman a los recibidos.
- **Proyección (03)**: registro en cola; recurso creado o localizado por su identificador lógico;
  payload idéntico al vigente no versiona; en otro caso se escribe procedencia `INGEST`, la versión
  inmutable (`CREATE` la primera, `UPDATE` las siguientes, con `supersedes_version_id`) y una arista
  de linaje `NORMALIZE`. Un recurso retirado no admite proyección.

### Recurso canónico

- **Identificador (04)**: no se repite en el recurso; el principal cierra al principal anterior del
  mismo sistema.
- **Relación (05)**: no consigo mismo, mismo custodio, ninguno retirado; la nueva cierra la vigente
  del mismo par y tipo.
- **Binding (06)**: recurso activo **con versión vigente**; no se repite; deja arista `BIND`.
- **Retiro (14)**: una sola vez; cierra enlaces y relaciones vigentes y escribe procedencia `RETIRE`.

### Validación

- **FHIR (07)**: versión y perfil existentes, perfil activo; una corrida por
  (versión, perfil, validador); resultado derivado —`FATAL`/`ERROR` bloquean, `WARNING` avisa—; el
  error cuarentena el recurso salvo que ya esté retirado.
- **Calidad (08)**: conjunto activo, ámbito declarado, hallazgos sobre reglas activas del conjunto;
  resultado derivado de la severidad de las reglas; incidencia idéntica ya abierta no se duplica.

### Identidad y liberación

- **MPI (09)**: candidato pendiente y sin decisión previa. `NO_MATCH` sólo registra; `MATCH` reutiliza
  el clúster vivo de cualquiera de los dos perfiles o crea uno, y añade los que falten.
- **Línea de tiempo (10)**: idempotente por entidad de origen y tipo de evento.
- **De-identificación (11)**: perfil activo; completada exige manifiesto de salida; deja procedencia
  `DEIDENTIFY` y una arista `DEIDENTIFY` por versión de origen.
- **Exportación (12)**: paciente o cohorte; de-identificación —si se declara— completada; trabajo +
  manifiesto sellado + procedencia `EXPORT`.
- **`$everything` (13)**: expande por el clúster del MPI y omite los recursos sin versión vigente.

## Por qué el resultado se deriva y no se declara

Tanto la validación FHIR como la corrida de calidad **calculan** su desenlace a partir de lo que se
reporta: severidades de los hallazgos en un caso, severidad de las reglas incumplidas en el otro.
Aceptarlo del llamante permitiría publicar como válido algo que el propio validador marcó con
errores. Lo mismo vale para el ejercicio de resiliencia del módulo 46: quien ejecuta la prueba no se
pone la nota.

## Hash de contenido

`contentHash()` canoniza antes de hashear: ordena las claves de cada objeto y descarta las
`undefined`. Así identifica el contenido y no el orden con que se serializó — que es lo que permite
que "payload idéntico" signifique de verdad idéntico.

El hash del Bundle de `$everything` se calcula sobre los pares `versionId:versionNumber`
**ordenados**, para que no dependa del orden en que la consulta devolvió los recursos.

## Orden de bloqueo en las relaciones

`createRelationship` bloquea **ambos** extremos, y siempre por id ordenado. Dos peticiones cruzadas
—A→B y B→A a la vez— tomarían los mismos dos candados en orden opuesto y se abrazarían; ordenarlos
elimina el interbloqueo sin serializar todo el módulo.

## Precisión numérica

Los contadores de lote, de corrida de calidad, de de-identificación y el recuento del manifiesto son
`bigint`: viajan y se guardan como cadena. Pasarlos por `number` los redondearía justo en las cargas
grandes, que son las únicas donde importa.

## Dependencias

`EntityManager`, los repositorios que cada servicio necesita y `PinoLogger`.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluidas las compuestas: recurso + versión + procedencia
+ linaje + registro proyectado; identificador nuevo + cierre del anterior; binding + arista; retiro +
cierre de enlaces y relaciones + procedencia; decisión + clúster + miembros; trabajo + manifiesto +
procedencia. Bloqueos: ver el README de `repositories/`.

## Excepciones

`ResourceNotFoundException` (conexión, lote, registro, recurso, versión, perfil, conjunto de reglas,
candidato, perfil de de-id o corrida desconocidos), `PreconditionFailedException` (conexión, perfil o
conjunto inactivos, lote cerrado, registro fuera de cola, recurso retirado o sin versión vigente,
relación consigo mismo o entre custodios distintos, perfil FHIR inactivo, corrida sin ámbito, regla
ajena al conjunto, candidato ya resuelto, corrida completada sin manifiesto, exportación sin sujeto o
sobre una de-id fallida) y `ConflictException` (lote ya cerrado, identificador o binding repetidos,
recurso ya retirado, candidato con decisión previa).

## Logs

`operation: 'health-data.<área>.<acción>'`. `warn` en cuarentena, corrida de calidad fallida, fusión
de perfiles, de-identificación fallida y —siempre— exportación y `$everything`: son acceso a datos
clínicos y deben quedar registrados aunque salgan bien. No se loguean payloads, valores observados ni
resúmenes clínicos.

## Pruebas

- `health-ingestion.service.spec.ts` (20): lote no reabierto, dedupe del registro, conciliación al
  cerrar, creación frente a actualización de versión, payload idéntico sin versionar, hash estable
  ante el orden de claves y escritura de procedencia y linaje.
- `canonical-resources.service.spec.ts` (20): cierre del identificador principal anterior, relación
  que supersede, autorreferencia y custodios distintos, binding sin versión vigente y retiro que
  cierra enlaces y relaciones.
- `health-validation.service.spec.ts` (16): las tres franjas de resultado, `FATAL` como bloqueante,
  cuarentena y su excepción sobre un recurso retirado, corrida repetida, severidad de la regla como
  desenlace y dedupe de incidencia.
- `patient-identity.service.spec.ts` (9): clúster nuevo frente a clúster existente, miembro ya
  presente, `NO_MATCH` sin efectos e idempotencia de la línea de tiempo.
- `data-release.service.spec.ts` (17): manifiesto obligatorio, una arista por versión de origen,
  exportación sin sujeto, de-id fallida como bloqueo, expansión por clúster, recurso sin versión
  vigente omitido y hash estable ante el orden.
