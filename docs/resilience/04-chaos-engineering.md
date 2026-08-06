# Estrategia de Chaos Engineering

Un control de resiliencia que nunca se ha ejercido es una hipótesis, no una
garantía. Este documento define los experimentos que convierten cada control del
hardening en evidencia.

## Principios

1. **Cada experimento tiene una hipótesis falsable.** No «ver qué pasa si mato la
   base», sino «si mato la base, la API responde 503 `DEPENDENCY_UNAVAILABLE` en
   menos de 5 s y se recupera sola en menos de 30 s tras devolverla».
2. **Se ejecuta primero en local**, con `docker compose`. Los experimentos de
   esta lista no requieren una plataforma de caos: son `docker pause`,
   `docker stop` y `tc`.
3. **Nunca en producción sin haber pasado en staging**, y nunca fuera de una
   ventana anunciada.
4. **Un experimento que falla es un hallazgo, no un error del experimento.**

## Estado de la campaña

| Marca | Significado |
| --- | --- |
| ✅ | Cubierto por prueba automatizada: el control está verificado a nivel unitario |
| 🟡 | Diseñado, **no ejecutado todavía** contra el sistema levantado |

Dos experimentos (CHAOS-01 parcial y CHAOS-04) se ejecutaron contra procesos
worker reales el 2026-08-06 y están en el [registro](#registro-de-ejecuciones).
El resto **está pendiente**: el hardening trae 163 pruebas que verifican cada
primitiva de forma aislada, pero la campaña completa sobre el compose levantado
no se ha corrido. Decirlo así es parte del entregable:
[06-checklists.md](06-checklists.md) la registra como bloqueante de la casilla
«Production Ready».

---

## CHAOS-01 · Caída de la API con los workers en marcha

**Hipótesis.** Tras ~4 fallos consecutivos, cada worker abre su cortacircuitos y
deja de intentarlo. Ningún worker muere. Al volver la API, los 20 se recuperan sin
tumbarla otra vez.

**Procedimiento.**

```bash
docker compose up -d
sleep 60                                   # dejar que los ticks corran normalmente
docker compose stop api
sleep 120
curl -s localhost:9100/status | jq '.circuits'   # desde un contenedor worker
docker compose start api
sleep 60
```

**Criterio de éxito.**

- `circuits[0].state === "open"` durante la caída.
- `GET :9100/health` sigue en **200** (liveness no cae por una dependencia caída).
- `GET :9100/readiness` en **503** con el motivo nombrando el circuito.
- Ningún contenedor worker reiniciado (`docker compose ps` sin `Restarting`).
- Tras devolver la API, el circuito vuelve a `closed` en menos de 5 min y los
  ticks reanudan.

**Qué invalidaría la hipótesis.** Que algún worker se reinicie (confusión
liveness/readiness), o que la API se caiga otra vez al volver (avalancha: el
sondeo de media apertura no está limitando a una sola llamada).

**Cubierto por**: `circuit-breaker.spec.ts`, `worker-health.registry.spec.ts` ✅ ·
Ejecutado parcialmente el 2026-08-06 (un worker, sin carga) — ver el [registro](#registro-de-ejecuciones) 🟡

---

## CHAOS-02 · Latencia extrema hacia la API

**Hipótesis.** Con la API respondiendo por encima del intervalo de un job, los
ticks se **descartan** en vez de acumularse. La memoria del worker se mantiene
estable.

**Procedimiento.**

```bash
# Dentro del contenedor de la API, añadir 20 s de latencia de salida.
docker compose exec --user root api \
  tc qdisc add dev eth0 root netem delay 20000ms
sleep 180
curl -s localhost:9100/status | jq '.ticks[] | {operation, skipped, runs}'
docker stats --no-stream $(docker compose ps -q worker-messaging)
docker compose exec --user root api tc qdisc del dev eth0 root
```

**Criterio de éxito.**

- `skipped` crece; `runs` crece mucho más despacio.
- RSS del worker estable (sin acumulación de ticks apilados).
- Ningún tick simultáneo del mismo nombre en las trazas de Jaeger.

**Qué invalidaría la hipótesis.** RSS creciente o spans solapados del mismo
`job.name` — la exclusión mutua no está actuando.

**Cubierto por**: `run-tick.util.spec.ts`, `mutex-registry.spec.ts` ✅ ·
Ejecución 🟡

---

## CHAOS-03 · Worker colgado (proceso suspendido)

**Hipótesis.** Un tick que no vuelve se detecta como atascado pasado
`WORKER_STUCK_TICK_MS` y Docker reinicia el contenedor.

**Procedimiento.**

```bash
# Bajar el umbral para no esperar 10 minutos.
WORKER_STUCK_TICK_MS=30000 docker compose up -d worker-messaging
docker compose pause api          # el tick queda esperando respuesta
sleep 90
docker compose ps worker-messaging   # esperado: unhealthy, luego reiniciado
docker compose unpause api
```

**Criterio de éxito.** El contenedor pasa a `unhealthy` y se reinicia. Tras el
reinicio y con la API de vuelta, los ticks reanudan sin intervención.

**Qué invalidaría la hipótesis.** Que el contenedor siga `healthy` — la sonda no
está viendo el tick en vuelo, o el plazo del tick lo abortó antes y el atasco no
llegó a producirse (que también es un resultado válido, pero de otro control).

**Cubierto por**: `worker-health.registry.spec.ts` ✅ · Ejecución 🟡

---

## CHAOS-04 · Apagado en mitad de un lote

**Hipótesis.** Un `SIGTERM` durante un lote deja terminar el lote (hasta 20 s) y
sólo entonces cierra. Ninguna fila queda reclamada por un worker inexistente.

**Procedimiento.**

```bash
# Sembrar trabajo suficiente para un lote largo, luego:
docker compose stop worker-messaging
docker compose logs worker-messaging | tail -30
```

**Criterio de éxito.**

- Log `Apagado: esperando a que terminen los ticks en vuelo` con la lista.
- Log `Apagado: todos los ticks terminaron limpiamente`.
- **Ausencia** de `se agotó el plazo de drenaje`.
- El proceso sale antes de los 45 s de `stop_grace_period`.

**Qué invalidaría la hipótesis.** La aparición del mensaje de plazo agotado, o
que `docker stop` tarde exactamente 45 s (señal de que el proceso no salió solo y
lo mató el `SIGKILL`).

**Cubierto por**: `run-tick.util.spec.ts` (drenaje) ✅ ·
Ejecutado parcialmente el 2026-08-06 (sin lote en vuelo, que es el caso interesante) 🟡

---

## CHAOS-05 · Caída de PostgreSQL

**Hipótesis.** La API responde `503 DEPENDENCY_UNAVAILABLE` con cuerpo legible
(no `500 INTERNAL`) y se recupera sola al volver la base.

**Procedimiento.**

```bash
docker compose stop postgres
curl -si localhost:3000/readiness | head -20
curl -si localhost:3000/scheduling/appointments -H "Authorization: Bearer $TOKEN"
docker compose start postgres
sleep 30
curl -si localhost:3000/readiness | head -5
```

**Criterio de éxito.**

- `/readiness` → 503, `checks.postgresql.status === "down"`.
- Un endpoint de negocio → 503 `DEPENDENCY_UNAVAILABLE`, **no** 500 `INTERNAL`.
- `/health` (liveness) sigue en 200: el proceso está vivo, la dependencia no.
- Recuperación automática sin reiniciar la API.

**Qué invalidaría la hipótesis.** Un 500 `INTERNAL`: `ConnectionException` no se
está mapeando, o el cuerpo se está sanitizando cuando no debe.

**Cubierto por**: `all-exceptions.database.spec.ts` ✅ · Ejecución 🟡

---

## CHAOS-06 · Interbloqueo bajo escritura concurrente

**Hipótesis.** Un interbloqueo devuelve `409 CONCURRENCY_CONFLICT`, no 500.

**Procedimiento.** Dos sesiones psql que actualizan las mismas dos filas en orden
inverso, o carga concurrente sobre un endpoint que escribe en dos tablas.

**Criterio de éxito.** `code === "CONCURRENCY_CONFLICT"` y estado 409. El cliente
que reintenta, tiene éxito.

**Cubierto por**: `all-exceptions.database.spec.ts` ✅ · Ejecución 🟡

---

## CHAOS-07 · Saturación de concurrencia (mamparo)

**Hipótesis.** Con más trabajo concurrente que huecos, el mamparo rechaza con
`CONCURRENCY_LIMIT` en vez de dejar crecer la memoria.

**Procedimiento.** Bajar `WORKER_HTTP_MAX_CONCURRENT` a 2 y generar carga.

**Criterio de éxito.** `rejected` crece en el mamparo; RSS estable; ningún OOM.

**Cubierto por**: `bulkhead.spec.ts` ✅ · Ejecución 🟡

---

## CHAOS-08 · Excepción no capturada

**Hipótesis.** El proceso muere dejando una línea `fatal` estructurada y con los
spans vaciados.

**Procedimiento.** Inyectar temporalmente un `setTimeout(() => { throw new Error('caos'); }, 5000)`
en un entrypoint, o enviar una señal que provoque el fallo.

**Criterio de éxito.** Log `fatal` con `reason: "uncaughtException"`, `err` con
stack, `processName` y `pid`. Salida con código 1 y reinicio por `restart: always`.
En Jaeger, los spans de la operación previa presentes.

**Cubierto por**: `process-guards.spec.ts` ✅ · Ejecución 🟡

---

## CHAOS-09 · Payload corrupto y eventos duplicados

**Hipótesis.** Un mensaje cuyo procesamiento falla siempre acaba en la cola de
mensajes muertos sin bloquear al resto del lote.

**Estado.** 🟡 **Sin diseñar en detalle.** Depende de auditar antes cómo agotan
sus reintentos los 30 jobs y qué procedimiento de reproceso tienen las DLQ
existentes (`messaging.dead_letter_jobs`,
`cross_store_consistency.projection_dead_letters`). Ver
[R-10](01-matriz-de-riesgos.md#r-10): es el primer candidato de la siguiente
iteración.

---

## CHAOS-10 · Partición de red y pérdida de paquetes

**Hipótesis.** Una partición entre worker y API se comporta como una caída
(CHAOS-01) y no produce estados intermedios inconsistentes.

**Procedimiento.**

```bash
docker network disconnect mantra-redesa-network $(docker compose ps -q worker-messaging)
sleep 120
docker network connect mantra-redesa-network $(docker compose ps -q worker-messaging)
```

**Criterio de éxito.** Igual que CHAOS-01. Adicionalmente: ninguna fila
reclamada queda sin liberar tras la reconexión.

**Estado** 🟡

---

## Cómo se opera la campaña

1. Ejecutar los experimentos **en orden**: los primeros validan los controles de
   los que dependen los siguientes.
2. Registrar cada ejecución con fecha, versión desplegada, resultado y hallazgos
   en este mismo documento.
3. Un experimento que falla abre un hallazgo en
   [01-matriz-de-riesgos.md](01-matriz-de-riesgos.md), no una excepción al plan.
4. Re-ejecutar la campaña completa antes de cada despliegue mayor y tras cualquier
   cambio en `common/resilience`, `worker/run-tick.util.ts` o
   `worker/system-api-client.service.ts`.

## Registro de ejecuciones

| Fecha | Experimento | Alcance | Resultado | Evidencia |
| --- | --- | --- | --- | --- |
| 2026-08-06 | CHAOS-01 (parcial) | Worker `scheduling` apuntado a una API inexistente durante 75 s | **Pasa.** El circuito abrió tras 5 fallos (`state: "open"`, `failureRate: 1`, `retryAfterMs: 16025`). `/health` siguió en **200** y `/readiness` dio **503** nombrando el circuito. El proceso no murió | Log `Cortacircuitos de la API: closed → open` con `openForMs: 30000` |
| 2026-08-06 | CHAOS-04 (parcial) | `SIGTERM` a un worker `consent` sin ticks en vuelo | **Pasa.** Log `Apagado: no hay ticks en vuelo` seguido de `todos los ticks terminaron limpiamente`; el proceso salió solo, sin agotar el plazo | Log de `WorkerLifecycleService` |
| — | CHAOS-01 completo, 02, 03, 05–10 | — | *Sin ejecutar* | — |

**Lo que estas dos ejecuciones sí demuestran**: el cortacircuitos abre contra una
dependencia real caída, la separación liveness/readiness se comporta como se
diseñó (no se reinicia un worker por una dependencia caída) y el drenaje del
apagado corre y deja constancia.

**Lo que no demuestran**: nada sobre el sistema completo bajo carga. CHAOS-01 se
ejecutó con un único worker y sin tráfico, y CHAOS-04 sin un lote en vuelo, que
es justo el caso interesante.
