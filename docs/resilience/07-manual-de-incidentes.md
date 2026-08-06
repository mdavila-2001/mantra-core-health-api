# Manual de incidentes y monitoreo

Documento de guardia. Está escrito para leerse a las tres de la mañana: primero
qué mirar, después qué significa, después qué hacer.

---

## 1 · Los cuatro comandos

```bash
# ¿Está viva la API y responden sus 4 dependencias?
curl -s localhost:3000/readiness | jq

# ¿Está haciendo su trabajo este worker?
curl -s localhost:9100/status | jq

# ¿Qué contenedores están mal?
docker compose ps --format 'table {{.Service}}\t{{.Status}}'

# ¿Qué dijo el proceso antes de morir?
docker compose logs --tail=100 <servicio> | grep -E '"level":(50|60)'
```

`50` es `error`, `60` es `fatal` en pino. Una línea de nivel 60 es siempre un
incidente.

---

## 2 · Diagnóstico por síntoma

### «La API devuelve 503»

```bash
curl -s localhost:3000/readiness | jq '.details.checks // .checks'
```

La respuesta nombra la dependencia caída y su latencia.

| Dependencia | Impacto | Acción |
| --- | --- | --- |
| `postgresql` | **Caída total** | Escenario DR-03. Es SEV-1 |
| `mongodb` | Documentos degradados | SEV-2. La atención clínica sigue |
| `redis` | Runtime degradado | SEV-3. Se repuebla solo al volver |
| `opensearch` | Búsqueda degradada | SEV-3. Caer a filtros en PostgreSQL |

**Decisión importante con las secundarias**: `/readiness` da 503 y el balanceador
retirará la instancia. Para un incidente de OpenSearch, retirarla es **peor** que
servir sin búsqueda. Es una decisión consciente del comandante, no automática.

### «Un contenedor worker está `unhealthy`»

```bash
curl -s localhost:9100/health | jq   # desde el contenedor o el puerto publicado
```

La respuesta dice exactamente qué tick está atascado y desde hace cuánto:

```json
{
  "status": "error",
  "reasons": ["el tick \"worker.messaging.outbox-relay\" lleva 743 s en vuelo (umbral 600 s)"]
}
```

Significa que un tick no volvió y que ni el plazo ni el aborto surtieron efecto:
el proceso **no puede recuperarse solo**. Docker lo reiniciará. Si vuelve a
ocurrir tras el reinicio, la causa está aguas abajo (la API o la base), no en el
worker.

Buscar la traza por `executionId` en Jaeger para ver dónde se quedó.

### «Los workers no procesan nada»

```bash
curl -s localhost:9100/status | jq '{status, circuits, ticks: [.ticks[] | {operation, lastOutcome, consecutiveFailures, skipped}]}'
```

| Lo que se ve | Qué significa | Acción |
| --- | --- | --- |
| `circuits[].state == "open"` | La API está caída o degradada; el worker dejó de intentarlo a propósito | Arreglar la API. El circuito cierra solo |
| `status == "draining"` | El worker se está apagando | Normal durante un despliegue |
| `status == "starting"` | Aún no terminó de arrancar | Esperar |
| `consecutiveFailures` alto y creciente | El tick corre puntual y falla siempre | Ver el `lastError` del tick y el log |
| `skipped` alto y creciente | El intervalo del job está por debajo de lo que tarda | Ver más abajo |
| Todo normal pero `runs` no crece | El tick no se está disparando | Revisar el scheduler; reiniciar el worker |

### «`skipped` crece sin parar»

No es un error: es el sistema **descartando** ticks solapados a propósito, para
no procesar dos veces lo mismo. Pero significa que se está procesando menos de lo
que se debería.

1. Ver `lastDurationMs` del tick: cuánto tarda de verdad.
2. Compararlo con el intervalo declarado en el job.
3. Si `lastDurationMs` > intervalo de forma sostenida:
   - **Causa aguas abajo** (la API va lenta): arreglar eso, no el intervalo.
   - **Causa legítima** (el volumen creció): subir el intervalo del job, o
     escalar horizontalmente el worker. La exclusión entre réplicas la da
     `SKIP LOCKED` en los endpoints `/internal/*`, así que escalar es seguro.

### «Hay un `fatal` en el log»

```bash
docker compose logs <servicio> | grep '"level":60' | jq
```

| `reason` | Qué pasó |
| --- | --- |
| `uncaughtException` | Excepción no capturada. El `err` trae el stack completo |
| `unhandledRejection` | Promesa rechazada sin manejador. Mismo tratamiento |
| *(sin `reason`, con `pending`)* | El apagado excedió su plazo. `pending.inFlightTicks` dice qué seguía en vuelo |

Los dos primeros son defectos de código: el proceso murió con estado
desconocido. Los spans previos están en Jaeger (el vaciado corre antes de salir).

El tercero **no** es un defecto de código sino una señal de que hay trabajo que
pudo quedar a medias: los ticks que nombra `pending` son los primeros sitios
donde buscar duplicados o registros reclamados por nadie.

### «Los clientes reportan 500 esporádicos»

```bash
docker compose logs api | grep '"code":"INTERNAL"' | jq '.correlationId' | head
```

Con el `correlationId` que el cliente reporta:

```bash
docker compose logs api | grep '<correlationId>' | jq
```

Ahí está el error completo con stack. La cabecera `x-trace-id` de la misma
respuesta lleva a la traza en Jaeger.

Una tasa **sostenida** de `INTERNAL` no es un estado operativo: es un defecto sin
diagnosticar. Los estados operativos tienen código propio
(`DEPENDENCY_UNAVAILABLE`, `TIMEOUT`, `CIRCUIT_OPEN`, `CONCURRENCY_LIMIT`).

### «502 esporádicos sin nada raro en los logs de la aplicación»

Síntoma clásico de desajuste de `keepAlive` con el balanceador. Verificar que
`HTTP_KEEPALIVE_TIMEOUT_MS` (65 s por defecto) esté **por encima** del idle
timeout del balanceador de producción, y `HTTP_HEADERS_TIMEOUT_MS` por encima de
aquél. Ver [R-14](01-matriz-de-riesgos.md#r-14).

### «`CONCURRENCY_CONFLICT` con frecuencia»

El cliente debe reintentar — es la respuesta correcta y el código lo dice. Pero
una tasa alta indica contención real de escritura, que se ataca en el diseño de
la transacción (ordenar los accesos de forma consistente, acortar las
transacciones), no en el cliente.

---

## 3 · Qué monitorear

### Alertas que existen hoy

| Señal | Fuente | Umbral |
| --- | --- | --- |
| Contenedor `unhealthy` | Docker `healthcheck` | 3 fallos consecutivos (45 s) |
| Contenedor reiniciándose | `docker compose ps` | Cualquier reinicio no planificado |
| Línea de nivel `fatal` | Agregador de logs | **Cualquiera** |
| `/readiness` en 503 | Sonda externa | Más de 1 minuto |

### Alertas que faltan 🔵

Todas dependen de [A-12](00-auditoria.md#a-12--no-hay-métricas-prometheus-): no
hay endpoint `/metrics` y por tanto no hay series temporales sobre las que definir
umbrales. Los datos existen y están expuestos en `GET :9100/status`; lo que falta
es quien los recoja periódicamente.

| Señal | Umbral propuesto | Por qué importa |
| --- | --- | --- |
| `consecutiveFailures` de un tick | > 5 | Fallo persistente: el trabajo nunca progresa ([R-17](01-matriz-de-riesgos.md#r-17)) |
| `skipped` de un tick | > 3 en 5 min | Degradación sostenida ([R-20](01-matriz-de-riesgos.md#r-20)) |
| Circuito abierto | > 5 min | Dependencia caída de forma prolongada |
| Tasa de `INTERNAL` | > 0,1 % de las peticiones | Defecto sin diagnosticar |
| Tasa de `CONCURRENCY_CONFLICT` | Al alza sostenida | Contención de escritura |
| Rechazos del mamparo | > 0 sostenido | Saturación real |
| Latencia p99 de la API | Según SLO | — |
| RSS de un proceso | Crecimiento monótono en 24 h | Fuga de memoria |

**Mientras tanto**: un cron que consulte `GET :9100/status` de los 20 workers cada
minuto y alerte sobre los tres primeros umbrales cubre lo esencial con ~30 líneas
de script. No es una solución de observabilidad, pero cierra el hueco más
peligroso —el fallo blando invisible— hasta que existan las métricas.

---

## 4 · Procedimientos

### Reiniciar un worker con seguridad

```bash
docker compose stop worker-<dominio>     # espera al drenaje, hasta 45 s
docker compose logs --tail=20 worker-<dominio> | grep -i apagado
docker compose start worker-<dominio>
```

Buscar en el log `Apagado: todos los ticks terminaron limpiamente`. Si aparece en
su lugar `se agotó el plazo de drenaje`, anotar los ticks que nombra: su trabajo
puede haber quedado a medias.

**Nunca** `docker compose kill`: salta el drenaje y corta el lote en seco.

### Escalar un worker

Es seguro: la exclusión entre réplicas la da `SKIP LOCKED` / `lockedBy` en la
base, no el proceso.

```bash
docker compose up -d --scale worker-<dominio>=3
```

Nota: `WORKER_HEALTH_PORT` es el mismo en todas las réplicas y sólo colisiona si
comparten espacio de red, lo que no ocurre en el compose.

### Forzar el cierre de un cortacircuitos

No se puede desde fuera, y es deliberado: reiniciar el worker perdería el estado
del circuito y volvería a castigar a la dependencia que se está recuperando. Si
la dependencia ya está sana, el circuito cierra solo al primer sondeo exitoso —
`retryAfterMs` en `/status` dice cuándo será.

Si hace falta acelerarlo (dependencia confirmada sana y el backoff acumulado es
largo), reiniciar el worker es aceptable: el arranque en frío cuesta menos que
esperar 5 minutos.

### Después del incidente

1. Cronología con horas exactas (el escriba la fue tomando).
2. Causa raíz, no causa inmediata.
3. Si la detección tardó más de lo aceptable, la acción correctiva es una
   **alerta**, no una advertencia a alguien.
4. Si el control existía y no actuó, abrir un hallazgo en
   [01-matriz-de-riesgos.md](01-matriz-de-riesgos.md).
5. Si el control **no existía**, evaluarlo con el FMEA de
   [03-fmea-y-arbol-de-fallos.md](03-fmea-y-arbol-de-fallos.md) antes de
   implementarlo: no todo hallazgo justifica un control nuevo.

---

## 5 · Referencia de configuración

Los plazos están encadenados. **Cambiar uno sin revisar los demás rompe la
cadena**, y el fallo resultante es silencioso.

```
WORKER_HTTP_TIMEOUT_MS   (30 s)  ─┐
                                  ├─ recortado al presupuesto del tick
WORKER_TICK_TIMEOUT_MS   (5 min) ─┘
        │
        └─< WORKER_STUCK_TICK_MS (10 min)    ← si se supera, ni el aborto sirvió

WORKER_DRAIN_TIMEOUT_MS     (20 s)
        <  WORKER_SHUTDOWN_TIMEOUT_MS (30 s)
        <  stop_grace_period          (45 s)  ← si se invierte, SIGKILL mudo

HTTP_KEEPALIVE_TIMEOUT_MS (65 s)
        <  HTTP_HEADERS_TIMEOUT_MS   (70 s)
        y  > idle timeout del balanceador     ← si se invierte, 502 esporádicos
```

Todas están documentadas con su porqué en
[`.env.example`](../../.env.example) y en
[`docker-compose.yml`](../../docker-compose.yml).
