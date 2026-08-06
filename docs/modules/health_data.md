<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/health_data/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `health_data`

**Fuente:** [`src/modules/health_data/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/health_data/README.md)
· 2 controllers · 5 services · 7 repositories · 34 entidades · 1 DTO

---

# Módulo 52 — Plataforma de Datos de Salud

Ingesta desde sistemas externos, proyección a un recurso canónico versionado e inmutable con su
procedencia y su linaje, identificadores y relaciones, enlace al dominio clínico, validación contra
perfiles FHIR R5, reglas de calidad, identidad longitudinal del paciente (MPI), línea de tiempo,
de-identificación, exportación de Bundles y retiro gobernado.

## Casos de uso cubiertos (14)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-52-01 | `POST /health-data/ingestion-batches` | Abrir lote desde una conexión de origen |
| UC-52-02 | `POST /health-data/ingestion-batches/:id/records` · `.../close` | Registro crudo y cierre con conteos |
| UC-52-03 | `POST /health-data/canonical-resources/project` | Proyectar recurso canónico y versionarlo |
| UC-52-04 | `POST /health-data/canonical-resources/:id/identifiers` | Identificadores de negocio |
| UC-52-05 | `POST /health-data/canonical-resources/:id/relationships` | Relacionar recursos (grafo clínico) |
| UC-52-06 | `POST /health-data/canonical-resources/:id/bindings` | Enlazar a entidad de dominio |
| UC-52-07 | `POST /health-data/versions/:id/validate` | Validar contra perfil FHIR R5 |
| UC-52-08 | `POST /health-data/quality-runs` | Reglas de calidad e incidencias |
| UC-52-09 | `POST /health-data/identity/candidates/:id/decision` | Resolver identidad longitudinal (MPI) |
| UC-52-10 | `POST /health-data/timeline-entries` | Proyectar entrada de línea de tiempo |
| UC-52-11 | `POST /health-data/deidentification-runs` | Corrida de de-identificación |
| UC-52-12 | `POST /fhir/r5/$export` | Exportar Bundle FHIR con manifiesto |
| UC-52-13 | `GET /fhir/r5/Patient/:id/$everything` | Servir historia longitudinal |
| UC-52-14 | `POST /health-data/canonical-resources/:id/retire` | Retiro gobernado del recurso |

UC-52-10 no tiene endpoint en el caso de uso —lo describe como "(worker) consume
`CanonicalResourceVersioned` / `IdentityResolved`"—. Sin el módulo de outbox (35) el worker no tiene
por dónde entrar, así que se publica `POST /health-data/timeline-entries` como su punto de entrada,
con la misma idempotencia que tendría consumiendo el evento.

Los casos de uso escriben `canonical-resources:project`, `{id}:validate` y `{id}:retire`; Nest 11
(path-to-regexp v8) trata `:` como inicio de parámetro en cualquier punto del segmento, así que las
rutas publicadas usan segmentos planos, como en el resto del proyecto. Las dos rutas FHIR sí
conservan su `$` literal, que es la forma que un cliente FHIR espera.

## Entidades

Escritas: `health_ingestion_batches`, `health_ingestion_records`, `canonical_health_resources`,
`canonical_health_resource_versions` (inmutable), `canonical_resource_identifiers`,
`canonical_resource_relationships`, `canonical_resource_bindings`, `health_provenance_records` e
`health_provenance_targets` (inmutables), `health_lineage_edges` (inmutable), `fhir_validation_runs`
e `fhir_validation_issues`, `health_data_quality_runs` e `health_data_quality_issues`,
`patient_match_decisions` (inmutable), `patient_identity_clusters`, `patient_identity_members`,
`patient_timeline_entries` (append-only), `health_deidentification_runs`, `health_export_jobs`,
`health_export_manifests` (inmutable). `health_source_connections` y `patient_match_candidates` se
actualizan puntualmente.

Sólo leídas: `health_source_systems`, `fhir_profile_definitions`, `fhir_profile_versions`,
`health_data_quality_rule_sets`, `health_data_quality_rules`, `health_deidentification_profiles`.

Del esquema pero fuera de los 14 casos de uso: `health_terminology_mapping_sets` y `..._rules`,
`omop_mapping_sets`, `omop_mapping_rules` y `omop_transformation_runs`.

## Flujo general

```
conexión activa
  └─ ingestion-batches ──> lote receiving
       ├─ records ────────> registro queued (dedupe por lote+id de origen+versión)
       └─ close ──────────> lote completed, contadores reconciliados

canonical-resources/project (registro queued)
  ├─ payload idéntico al vigente ──> no se versiona
  └─ payload nuevo ────────────────> versión inmutable + procedencia INGEST + linaje NORMALIZE
                                     recurso apunta a la versión nueva

recurso activo
  ├─ identifiers ────> uno principal vigente por sistema; el anterior se cierra
  ├─ relationships ──> una vigente por par y tipo; la anterior se cierra
  ├─ bindings ───────> referencia al dominio + linaje BIND (sin dual-write)
  ├─ versions/:id/validate ──> pass | warning | error  ⇒ error manda el recurso a cuarentena
  └─ retire ─────────> recurso retired; enlaces y relaciones cerrados; procedencia RETIRE

quality-runs ──> pass | warning | fail; incidencias abiertas sin duplicar la idéntica

identity/candidates/:id/decision
  ├─ NO_MATCH ──> sólo queda la decisión
  └─ MATCH ─────> clúster (nuevo o el que ya tuviera uno de los perfiles) + miembros

deidentification-runs ──> procedencia DEIDENTIFY + linaje versión → manifiesto
/fhir/r5/$export ───────> trabajo + manifiesto sellado por hash + procedencia EXPORT
/fhir/r5/Patient/:id/$everything ──> versiones vigentes, expandidas por el clúster del MPI
```

## Reglas de negocio

- **Un lote no se reabre**: el mismo identificador en la misma conexión es el mismo lote, y
  reabrirlo duplicaría todo lo que trae dentro.
- **El registro se deduplica** por lote, identificador de origen y versión de origen: el worker
  reintenta y no debe encolar dos veces lo mismo.
- **El cierre reconcilia los contadores** contra la tabla de registros: lo que declara el origen es
  referencia, lo que se guarda es lo que realmente entró. El lote se cierra una vez.
- **La versión canónica es inmutable y el `content_hash` decide si hay algo nuevo.** Un payload
  idéntico al vigente no se versiona: una versión que no cambia nada ensucia el historial y desplaza
  a la que sí importa. El hash se calcula con las claves ordenadas, así que no depende de cómo se
  serializó.
- **Cada versión nace con su procedencia y su linaje.** La procedencia se escribe antes que la
  versión, porque ésta la referencia: la trazabilidad no es un añadido posterior.
- **Un identificador principal vigente por sistema emisor.** Con dos, resolver el recurso por su
  identificador quedaría ambiguo.
- **Una relación vigente por par y tipo**: la nueva cierra la anterior. Dos relaciones vigentes
  contradictorias no se resuelven solas. Un recurso no se relaciona consigo mismo, y ambos extremos
  deben ser del mismo custodio.
- **El binding es una referencia, no una copia**: la tabla clínica sigue siendo la fuente operativa y
  aquí no se escribe nada suyo. Exige versión vigente, porque el enlace apunta a un contenido
  concreto.
- **El resultado de la validación se deriva de las severidades halladas**, no lo declara quien llama:
  dejar que el validador se ponga la nota permitiría publicar como válido algo que él mismo marcó con
  errores. Un error manda el recurso a **cuarentena**, que es lo que impide seguir sirviéndolo.
- **Una corrida de validación por versión, perfil y versión del validador**: repetirla no aporta.
- **El desenlace de la corrida de calidad sale de la severidad de las reglas incumplidas**, no del
  número de hallazgos: cien avisos siguen siendo avisos, y un solo incumplimiento crítico ya es un
  fallo. Una incidencia idéntica ya abierta no se duplica.
- **Nunca hay fusión automática de pacientes.** Un candidato lo resuelve una persona y su decisión
  queda registrada de forma inmutable: unir dos historias clínicas por error es de las cosas más
  caras de deshacer que hay. Si uno de los perfiles ya está en un clúster vivo, el otro se le suma en
  lugar de abrir uno nuevo.
- **La línea de tiempo es idempotente** por entidad de origen y tipo de evento: el worker puede
  recibir el mismo evento dos veces y la historia no debe mostrar el hecho duplicado.
- **La clave de re-identificación vive en el vault**: el módulo guarda su referencia, nunca su valor.
- **Una corrida de de-identificación completada debe declarar su manifiesto de salida**: es lo único
  que prueba qué se liberó.
- **Exportar exige propósito de uso y un paciente o una cohorte**, y no se apoya en una
  de-identificación que falló. El `content_hash` sella el Bundle: sin él no se podría demostrar
  después qué contenía exactamente lo que salió.
- **`$everything` expande la identidad por el clúster del MPI**: si dos perfiles se resolvieron como
  la misma persona, su historia es una sola, y devolver sólo el perfil consultado daría una vista
  incompleta al clínico.
- **Retirar es un borrado lógico**: las versiones nunca se borran —son la trazabilidad legal de lo
  que se afirmó y cuándo—, y lo que se cierra son enlaces y relaciones vigentes.

## Vocabularios: qué se define aquí y qué no

Se derivan conceptos para los ciclos de vida que el caso de uso enumera (estado de lote, registro,
recurso, validación, calidad, emparejamiento, de-identificación y exportación), para las actividades
de procedencia y transformaciones de linaje que nombra, para las severidades de `OperationOutcome`
—que FHIR fija— y para el **tipo de entidad** de las referencias polimórficas de procedencia y
linaje: sin ese vocabulario, un `target_id` no diría a qué tabla apunta.

Tipo de recurso, modo de ingesta, formato de payload, tipo y rol de relación, entidad de dominio,
rol de binding, propósito de uso, tipo de exportación, tipo de evento y visibilidad son catálogos
abiertos y llegan como `*ConceptId`.

## Permisos

`HEALTH_DATA_ADMIN` cubre el módulo. `INGESTION_WORKER` abre lotes, registra, cierra, proyecta y
valida. `CLINICAL_INFORMATICIAN` enlaza al dominio y retira. `DATA_STEWARD` relaciona recursos y
ejecuta reglas de calidad. `MPI_STEWARD` resuelve identidades. `PRIVACY_OFFICER` de-identifica y
exporta. `INTEROP_CONSUMER` consume `$everything`. `SYSTEM` proyecta la línea de tiempo.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre la conexión al abrir el lote, sobre el lote al añadir registros y al cerrarlo,
sobre el registro al proyectarlo, sobre el recurso en todo lo que lo versione, cuarentene, enlace o
retire —y sobre **ambos** extremos de una relación, siempre en el mismo orden, para que dos
relaciones cruzadas simultáneas no se abracen en un interbloqueo—, sobre el identificador principal
saliente, sobre el candidato y el clúster del MPI, y sobre el trabajo de exportación.
`row_version` aporta bloqueo optimista donde la tabla lo declara.

## Logs

`operation: 'health-data.<área>.<acción>'`. Nivel `warn` en cuarentena por validación, corrida de
calidad fallida, fusión de perfiles, de-identificación fallida, **toda exportación** y **todo
servicio de `$everything`**: los dos últimos son acceso a datos clínicos y quedan siempre
registrados. No se loguean payloads, valores observados ni resúmenes clínicos.

## Pruebas

`yarn test --testPathPatterns=health_data` — 98 pruebas (82 de servicio + 16 de delegación de los dos
controladores).

## Pendiente

- **Normalización del payload**: el módulo versiona lo que le entregan normalizado; el mapeo
  terminológico y la normalización viven en el worker de ingesta.
- **Ejecución del validador FHIR**: aquí se registra el resultado y sus hallazgos; correr el
  validador contra la `StructureDefinition` es del worker.
- **Evaluación de las reglas de calidad**: igual — se registran los hallazgos, no se computan.
- **Generación de candidatos del MPI** (`patient_match_candidates`): los produce el algoritmo de
  emparejamiento; este módulo sólo los resuelve.
- **Consentimiento y autorización** (`consent.consent_directives`, `authz.*`): el módulo guarda la
  referencia a la directiva y el propósito de uso, pero evaluarlos cruzaría la frontera del esquema.
  La redacción del resumen de la línea de tiempo llega ya aplicada.
- **De-identificación y construcción del Bundle**: el módulo registra la corrida, el trabajo y el
  manifiesto; transformar los datos y escribir el fichero es del worker y del almacenamiento de
  objetos.
- **OMOP** (`omop_*`): las tablas existen en el esquema pero ningún caso de uso del módulo las opera.
- **Outbox** (módulo 35): `IngestionBatchOpened/Closed`, `CanonicalResourceVersioned`,
  `ResourceIdentifiersRegistered`, `CanonicalResourceLinked`, `ResourceBoundToDomain`,
  `FhirValidationCompleted`, `QualityRunCompleted`, `IdentityResolved`, `TimelineEntryProjected`,
  `DeidentificationCompleted`, `HealthDataExported`, `EverythingBundleServed`,
  `CanonicalResourceRetired`.
- **Proyecciones**: `read_models.*`, índices de `search_platform`, embeddings de `vector_rag`,
  aristas de `graph_intelligence` y las series de `time_series` los alimenta el outbox.

