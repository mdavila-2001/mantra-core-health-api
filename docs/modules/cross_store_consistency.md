<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/cross_store_consistency/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `cross_store_consistency`

**Fuente:** [`src/modules/cross_store_consistency/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/cross_store_consistency/README.md)
· 2 controllers · 4 services · 3 repositories · 20 entidades · 1 DTO

---

# Módulo 62 — Consistencia cross-store

Proyección del outbox a los stores secundarios con entrega idempotente y checkpoint,
reconciliación del canónico contra sus proyecciones, propagación verificada del borrado, e
invalidación de caché, movimiento entre zonas y archivado por retención.

## La idea que gobierna el módulo entero

**PostgreSQL es la única fuente de verdad.** Búsqueda, read models, series temporales, vectores,
grafo y objetos son proyecciones. De ahí sale todo lo demás:

- se proyecta **hacia** los secundarios, nunca al revés;
- una divergencia se repara reescribiendo el destino desde el canónico;
- un borrado no está hecho porque se ejecutara, sino porque se **verificó** que no quedó nada.

## Casos de uso cubiertos (14)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-62-01 | `POST /admin/projections/definitions` | Definición, suscripciones y SLO |
| UC-62-02 | `POST /workers/projections/deliveries/process` | Entrega idempotente |
| UC-62-03 | (dentro de UC-62-02) | Avance del checkpoint |
| UC-62-04 | `POST /workers/projections/dead-letters` · `POST /admin/projections/dead-letters/:id/replay` | Cola muerta y reproceso |
| UC-62-05 | `POST /admin/reconciliation/runs` | Corrida de reconciliación |
| UC-62-06 | (dentro de UC-62-05) | Apertura de derivas |
| UC-62-07 | `POST /admin/projections/drift/:id/repair-jobs` | Reparación de deriva |
| UC-62-08 | `POST /admin/deletion-requests` | Solicitud de borrado |
| UC-62-09 | `POST /workers/deletion-requests/:id/expand` | Expansión a objetivos |
| UC-62-10 | `POST /workers/deletion-targets/:id/executions` | Ejecución del borrado |
| UC-62-11 | `POST /workers/deletion-targets/:id/verifications` · `PATCH /admin/deletion-requests/:id` | Verificación y cierre |
| UC-62-12 | `POST /workers/cache/invalidations` | Invalidación de caché |
| UC-62-13 | `POST /admin/data-movement-jobs` | Movimiento entre zonas |
| UC-62-14 | `POST /admin/archive-jobs` | Archivado por retención |

14 endpoints para 14 casos de uso: UC-62-03 y UC-62-06 no tienen ruta propia —el caso de uso los
declara *internos*, parte de UC-62-02 y UC-62-05— y UC-62-04 y UC-62-11 tienen dos cada uno.

## Estados en `varchar`, en MAYÚSCULAS

Como `polyglot_storage`. El caso de uso escribe `state=ACTIVE`, `status=IN_PROGRESS -> SUCCEEDED`,
`result=MATCH|DIVERGENT|MISSING`. La caja importa: la comparación contra la columna es literal, y
mezclarla sería un fallo silencioso que sólo aparecería en producción.

Todo vive en `constants/cross-store.constants.ts`.

## Flujo general

```
PROYECCIÓN
  admin/projections/definitions ──> definición + suscripciones + SLO
  workers/projections/deliveries/process
        clave = hash(evento, payload) ──> ya aplicada ⇒ duplicate, no se toca nada
        escritura durable confirmada ──> intento SUCCEEDED
              └─ checkpoint SÓLO entonces, y sólo si la posición avanza
        escritura fallida ────────────> intento FAILED, checkpoint quieto
  workers/projections/dead-letters ──> payload al almacén de objetos, entrada OPEN
    └─ admin/.../replay ─────────────> intento nuevo CON LA MISMA CLAVE

RECONCILIACIÓN
  admin/reconciliation/runs
        MATCH ──────────────> se cuenta
        DIVERGENT / MISSING / EXTRA ──> deriva OPEN (dedup por entidad y tipo)
                                        severidad MEDIUM / HIGH / CRITICAL
  admin/projections/drift/:id/repair-jobs
        REPROJECT · REINDEX (+ job) · DELETE_ORPHAN (sólo sobre EXTRA)
        la deriva se cierra al encolar, no al terminar

BORRADO
  admin/deletion-requests ─────────> PENDING, con due_at
  workers/.../expand ──────────────> un objetivo por store; legal hold ⇒ BLOCKED
  workers/.../executions ──────────> legal hold NO se toca; acuse del proveedor
  workers/.../verifications ───────> ausente y sin residuos ⇒ VERIFIED
                                     con residuos ⇒ vuelve a PENDING
  PATCH admin/deletion-requests/:id > COMPLETED sólo si TODO verificado o bloqueado
                                     todo bloqueado ⇒ BLOCKED, no COMPLETED

MANTENIMIENTO
  workers/cache/invalidations ─────> clave incluye la VERSIÓN de la entidad
  admin/data-movement-jobs ────────> idempotente por manifest_hash + invalida caché
  admin/archive-jobs ──────────────> sin manifiesto frío no se purga lo caliente
```

## Reglas de negocio

- **Un dataset no se proyecta sobre sí mismo.** Eso no es una proyección: es un bucle, y el canónico
  dejaría de ser el único origen.
- **La clave de idempotencia se deriva de `(evento, hash del payload)`.** El mismo evento con el
  mismo contenido es la misma escritura, y el consumidor lo reconoce sin que nadie tenga que acordarse
  de mandar una clave.
- **El checkpoint sólo avanza con la escritura confirmada durable.** Al revés, un fallo tras avanzar
  dejaría el evento sin proyectar y el checkpoint diciendo que sí — y ese evento no se volvería a
  leer nunca.
- **El checkpoint es monótono.** Un evento que llega tarde se aplica —el destino es idempotente— pero
  no retrocede la posición: eso haría releer todo lo ya procesado. La comparación es con `BigInt`,
  porque `'100' < '99'` como texto.
- **Un reintento conserva la clave del intento anterior.** Es lo que distingue reintentar de volver a
  proyectar.
- **El reproceso desde la cola muerta también la conserva**: si el destino llegó a aplicar la
  escritura antes de fallar en otra parte, el reproceso no la duplica.
- **Una deriva viva del mismo tipo sobre la misma entidad no se abre dos veces.** Sin eso, una
  reconciliación horaria abriría veinticuatro incidentes idénticos al día del mismo problema.
- **`EXTRA` pesa más que `MISSING`.** Un huérfano en un secundario es dato que ya no debería existir
  en ningún sitio — puede ser un borrado que no se propagó.
- **`DELETE_ORPHAN` sólo repara una deriva `EXTRA`.** Aplicarla a otra clase borraría dato que sí
  debería estar.
- **La deriva se cierra al encolar la reparación, no al terminarla.** Si la reparación falla, la
  siguiente reconciliación volverá a detectarla; dejarla abierta bloquearía esa detección.
- **Una sola solicitud de borrado viva por sujeto.** Dos darían dos expansiones que se pisan y una
  verificación que nunca cuadra.
- **Un objetivo con retención legal se registra igualmente y nace `BLOCKED`.** Dejarlo fuera de la
  lista haría creer que no existe, y el cierre daría por borrado algo que sigue ahí por obligación.
- **Un objetivo con retención legal no se toca.** Es la única razón legítima por la que un dato
  sobrevive a un borrado.
- **Con referencias residuales, el objetivo vuelve a `PENDING`.** Una verificación que encuentra
  restos y aun así cierra convierte la prueba de borrado en un trámite.
- **La solicitud sólo se cierra si TODO objetivo está verificado o bloqueado.** Con uno pendiente,
  cerrarla sería declarar cumplido un derecho que no lo está.
- **Todo bloqueado cierra como `BLOCKED`, no `COMPLETED`.** Son dos desenlaces distintos y quien
  pidió el borrado tiene derecho a saber cuál le tocó.
- **La clave de invalidación incluye la versión de la entidad.** Sin ella, la segunda invalidación se
  descartaría por duplicada y la caché seguiría sirviendo dato viejo.
- **La copia caliente sólo se purga con el manifiesto frío confirmado.** Es la regla que impide el
  peor desenlace de UC-62-14: borrar lo caliente y descubrir después que el archivado no llegó a
  escribirse.

## Lo que este módulo no hace

**No escribe en los stores secundarios ni borra en ellos.** Registra el control: qué se intentó, con
qué clave, si se confirmó, hasta dónde se ha leído, qué no cuadró y qué evidencia hay de que un
borrado se cumplió. La escritura real la hace el worker de cada backend.

## Permisos

`DATA_GOVERNANCE_ADMIN` define proyecciones, repara derivas, mueve datos y reprocesa la cola muerta.
`PRIVACY_OFFICER` / `DPO` solicitan y cierran borrados. `PROJECTION_WORKER` entrega y manda a cola
muerta. `RECONCILIATION_WORKER` reconcilia. `DELETION_WORKER` expande, ejecuta y verifica.
`MAINTENANCE_WORKER` invalida caché. `SYSTEM` cubre lo programado. `PLATFORM_ADMIN` cubre todo.

**Quien ejecuta el borrado no lo cierra.** `DELETION_WORKER` aparece en `/expand`, `/executions` y
`/verifications`, pero el cierre (`PATCH /admin/deletion-requests/:id`) es del DPO: quien ejecuta no
certifica que se cumplió.

**Quien proyecta no repara.** `PROJECTION_WORKER` no aparece en `/repair-jobs`: reescribir un store
desde el canónico es una decisión de gobierno.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre el SLO al hacer upsert, sobre el intento de entrega, sobre el **checkpoint** —dos
consumidores de la misma partición no pueden avanzarlo a la vez—, sobre la entrada de cola muerta, la
deriva, la solicitud de borrado y el objetivo.

Este módulo **no usa `SKIP LOCKED`**: el caso de uso lo sitúa en la lectura del outbox y en el
barrido de objetivos pendientes, que hace el worker antes de llamar. Aquí sólo llega lo que el worker
ya tomó.

## Logs

`operation: 'xstore.<área>.<acción>'`. Nivel `warn` en entrega fallida, cola muerta, deriva
detectada, solicitud de borrado, ejecución, referencias residuales, cierre y archivado. Es un módulo
donde casi todo lo que pasa merece atención. No se loguean payloads ni localizadores.

## Pruebas

`yarn test --testPathPatterns=modules/cross_store_consistency` — 84 pruebas (20 entrega +
14 reconciliación + 22 borrado + 14 mantenimiento + 14 de delegación de los dos controladores).

## Divergencias con el caso de uso v3.9

- **Segmentos planos.** El caso de uso escribe `deliveries:process`, `{id}:replay`, `{id}:expand`.
  Nest 11 monta sobre `path-to-regexp` v8, que trata `:` como inicio de parámetro en cualquier
  posición del segmento.
- **UC-62-03 y UC-62-06 no tienen ruta.** Los dos se declaran *internos*, parte del commit de otro
  caso de uso, y así están implementados.

## Pendiente

- **La escritura real en los stores secundarios y el borrado real en ellos**: los hacen los workers
  de cada backend. Este módulo lleva el control.
- **Lectura del outbox con `SKIP LOCKED` y `concurrency_limit` por suscripción** (UC-62-02): el
  worker toma los eventos antes de llamar; el límite se guarda en la suscripción pero no se aplica
  aquí.
- **Agotamiento automático de `retry_policy_json`** (UC-62-04): la política se guarda; decidir cuándo
  se agotaron los reintentos y llamar a la cola muerta es del worker.
- **Disparo por `reconciliation_interval_minutes`** (UC-62-05): el SLO lo declara; el planificador lo
  ejecuta.
- **Purga real de `redis_runtime.*_cache_entries`** (UC-62-12): se encola el job y se publica el
  evento. Ese esquema es del módulo 56, **sin asignar**.
- **Movimiento físico de payloads y verificación del `manifest_hash` antes de purgar el origen**
  (UC-62-13): el job se registra; el movimiento es del módulo 60.
- **`audit.audit_events`**: el caso de uso lo declara en los catorce. El registro de auditoría es del
  módulo 06.

