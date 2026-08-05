# Módulo 44 — Contexto de Salud por País

Recolección gobernada de contexto sanitario público: agentes recolectores, fuentes con su licencia y
su nivel de confianza, programaciones, corridas idempotentes, observaciones inmutables, y contextos
de país versionados con hechos trazables a la evidencia que los respalda, revisión de calidad,
publicación y resolución para consumo.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-44-01 | `POST /health-context/agents` | Registrar agente recolector |
| UC-44-02 | `POST /health-context/sources` | Registrar fuente de contexto |
| UC-44-03 | `POST /health-context/schedules` | Programar recolección de país |
| UC-44-04 | `POST /health-context/contexts` | Crear contexto de país (raíz) |
| UC-44-05 | `POST /health-context/collection-runs` | Disparar corrida idempotente |
| UC-44-06 | `POST /health-context/collection-runs/:id/observations` | Observación inmutable de fuente |
| UC-44-07 | `POST /health-context/contexts/:id/versions` | Versión borrador + hechos + evidencia |
| UC-44-08 | `POST /health-context/versions/:id/quality-reviews` | Revisar calidad de la versión |
| UC-44-09 | `POST /health-context/versions/:id/publish` | Publicar y avanzar la versión vigente |
| UC-44-10 | `POST /health-context/collection-runs/:id/finish` | Cerrar corrida conciliando contadores |
| UC-44-11 | `POST /health-context/versions/:id/supersede` | Sustituir o expirar la versión vigente |
| UC-44-12 | `GET /health-context/contexts/resolve` | Resolver contexto vigente para consumo |

## Entidades

`context_agents`, `health_context_sources`, `country_context_schedules`, `country_health_contexts`,
`country_health_context_versions`, `context_collection_runs`, `context_source_observations`
(inmutable), `health_context_facts` (inmutable), `context_fact_evidence` (inmutable),
`context_quality_reviews` (append-only).

## Flujo general

```
agente + fuente + programación
   │
collection-runs (idempotente por clave) ──> corrida running
   ├─ observations ──> observación inmutable, deduplicada por hash en la corrida
   │                   contadores del run al vuelo
   └─ finish ────────> contadores reconciliados contra la tabla; succeeded | partial | failed

contexto (draft)
   └─ versions (de una corrida del mismo país)
        └─ versión draft + hechos + evidencia (cada hecho, a observaciones aceptadas del run)
             └─ quality-reviews ──> approved | rejected
                  └─ publish ─────> versión published, contexto active
                                    la publicada anterior queda superseded
                       └─ supersede ──> con reemplazo: sigue active
                                        sin reemplazo (expired): contexto stale

contexts/resolve?country&domain&key ──> versión vigente + hechos + trazabilidad
                                        caducada ⇒ se devuelve marcada `stale`
```

## Reglas de negocio

- **Sólo agregado de país**. El módulo no recibe ni guarda datos de paciente: lo que entra son
  boletines, indicadores y publicaciones oficiales.
- **La confianza de la fuente gobierna qué se acepta**, y su licencia queda registrada con ella. Sin
  esas dos cosas no se podría defender de dónde salió un dato ni con qué derecho se usa.
- **La corrida es idempotente por clave**: el scheduler reintenta, y dos corridas de la misma marca
  duplicarían las observaciones.
- **Una corrida manual debe decir agente y país**, o venir de una programación de la que salgan;
  deducirlos sería inventarlos.
- **La observación es inmutable** y se deduplica por hash dentro de la corrida: el mismo documento
  leído dos veces no cuenta dos veces.
- **La corrida es un log: se cierra una vez y no se reabre.** Al cerrarla los contadores se
  **reconcilian** contra la tabla de observaciones; los llevados al vuelo dan progreso visible, pero
  pueden haberse quedado cortos si algo falló a medias.
- **Una corrida fallida debe declarar qué salió mal.**
- **Un hecho sin evidencia retenida se rechaza.** El valor del módulo es poder decir de dónde salió
  cada dato, y un hecho huérfano lo destruye. La evidencia además debe apuntar a observaciones
  **aceptadas de la misma corrida**, o el respaldo sería de otra recolección.
- **La versión nace en borrador y no toca `current_version_id`**: publicar es una decisión aparte, y
  antes tiene que pasar por revisión de calidad.
- **Sólo se publica lo aprobado**, y un rechazo bloquea la publicación.
- **Una sola versión publicada por contexto**: la anterior queda superseded en la misma transacción.
- **Retirar sin reemplazo deja el contexto obsoleto**, no activo. Marcarlo activo cuando ya no
  entrega nada engañaría al consumidor.
- **Una versión caducada se resuelve marcada como obsoleta, no se oculta**: el consumidor suele
  preferir un dato viejo declarado como tal a no tener ninguno, y esconderlo le quitaría la decisión.
- **El payload histórico permanece inmutable y trazable**: nada se borra al sustituir.

## Vocabularios: qué se define aquí y qué no

Sólo se derivan conceptos para los **ciclos de vida** que el caso de uso enumera: estado del
contexto (borrador, activo, obsoleto), de la versión (borrador, aprobada, rechazada, publicada,
sustituida, caducada), de la corrida (en curso, correcta, parcial, fallida), disparador, estado de
la observación y desenlace de la revisión.

Dominio del contexto, tipo de agente, tipo de fuente, nivel de confianza, tipo de revisión, país,
zona horaria, métrica y unidad son catálogos **abiertos**: el cliente entrega su `*ConceptId` y el
módulo lo persiste tal cual.

## Permisos

`PLATFORM_ADMIN` cubre el módulo. `SOURCE_ADMIN` registra agentes y fuentes. `CONTEXT_CURATOR`
programa, crea contextos, publica y retira versiones. `QUALITY_REVIEWER` revisa la calidad.
`SYSTEM` —el worker recolector— dispara corridas, registra observaciones, materializa versiones y
cierra corridas. `CONTEXT_CONSUMER` resuelve el contexto vigente.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre la programación al arrancar una corrida —adelantar `next_run_at` en el mismo
arranque evita que el scheduler reencolé la misma marca—, sobre la corrida al registrar
observaciones y al cerrarla, sobre el contexto en todo lo que mueva `current_version_id` y al
redactar (el número de versión sale de un máximo), y sobre la versión al revisarla, publicarla o
retirarla. `row_version` aporta bloqueo optimista.

## Logs

`operation: 'health-context.<área>.<acción>'`. Nivel `warn` ante observación rechazada, corrida
fallida, versión rechazada en revisión, retiro de versión y resolución de un contexto caducado. No se
loguea el payload de las observaciones ni el del contexto.

## Pruebas

`yarn test --testPathPatterns=health_context` — 76 pruebas (64 de servicio + 12 de delegación del
controlador).

## Pendiente

- **Ejecución real de la recolección**: el módulo registra lo que el agente trae; salir a la red,
  descargar el boletín y extraer el dato es del propio agente.
- **Cálculo de `next_run_at`**: la expresión cron se valida en forma —cinco campos— pero no se
  interpreta. Quien calcula la próxima marca es el scheduler, que la envía al arrancar la corrida.
- **Payload crudo en almacenamiento de objetos**: `raw_payload_file_id` referencia `common.files`;
  subir el blob y su manifiesto es del módulo de almacenamiento.
- **Caché por frescura** (`redis_runtime.context_cache_entries`): el TTL vive en la programación
  (`freshness_ttl_seconds`) y la respuesta ya marca `stale`; cachearla es del módulo de
  almacenamiento políglota.
- **Bloqueo distribuido por programación**: el caso de uso propone `distributed_lock_entries` para
  evitar corridas solapadas. Aquí lo cubre la idempotencia por clave más el `FOR UPDATE` sobre la
  programación; el lock externo llegará con el módulo que lo provea.
- **Outbox** (módulo 35): `ContextAgentRegistered`, `HealthContextSourceRegistered`,
  `CountryContextScheduleCreated`, `CountryHealthContextCreated`, `ContextCollectionRunStarted`,
  `ContextSourceObserved`, `ContextVersionDrafted`, `ContextVersionReviewed`,
  `CountryHealthContextPublished`, `ContextCollectionRunFinished`,
  `CountryHealthContextVersionSuperseded`.
- **Proyecciones**: `read_models.*`, índices de `search_platform`, reindexado de `vector_rag` y
  `time_series.context_collection_runs_series` los alimenta el outbox.
