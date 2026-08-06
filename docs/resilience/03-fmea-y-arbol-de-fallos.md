# FMEA y árbol de fallos

Dos análisis complementarios. El **FMEA** va de abajo hacia arriba: por cada
componente, qué puede fallar y qué se sigue de ello. El **árbol de fallos** va de
arriba hacia abajo: dado un evento indeseado, qué combinación de causas puede
producirlo.

---

# Parte 1 · FMEA (Failure Mode and Effects Analysis)

## Escala

- **S** (severidad): 1 despreciable · 5 catastrófico (pérdida o corrupción de
  datos clínicos).
- **O** (ocurrencia): 1 improbable · 5 casi seguro en operación normal.
- **D** (detección): 1 se detecta de inmediato · 5 puede pasar inadvertido
  indefinidamente. **Un valor alto aquí es lo más peligroso**: un fallo grave que
  se detecta al instante es un incidente; uno que no se detecta es una pérdida
  silenciosa.
- **RPN** = S × O × D. Se calcula **después** de los controles implantados.

---

## Componente: `runTick` (los 30 jobs de los 20 workers)

| Modo de fallo | Efecto | S | O | D | RPN | Control | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| El tick se solapa consigo mismo | Procesamiento duplicado, contención, crecimiento sin techo | 5 | 4 | 4 | ~~80~~ **10** | Exclusión mutua por operación con descarte y contador `skipped` | ✅ |
| El tick no vuelve nunca | El job deja de ejecutarse para siempre, en silencio | 5 | 2 | 5 | ~~50~~ **4** | Plazo con `AbortSignal` real + umbral de atasco + liveness 503 + `restart: always` | ✅ |
| El tick lanza y tumba el scheduler | Los demás jobs del proceso dejan de correr | 5 | 3 | 2 | **6** | `runTick` absorbe y registra; contrato original conservado | ✅ (previo) |
| El fallo de un elemento aborta el lote | Los elementos posteriores no se procesan | 3 | 3 | 3 | **9** | Modo anidado: span hijo propio, error absorbido | ✅ |
| Un tick arranca durante el apagado | Trabajo iniciado que no puede terminar | 4 | 3 | 3 | **8** | `startDraining()` en `beforeApplicationShutdown` | ✅ |
| El tick corre puntual y falla siempre | Trabajo que nunca progresa | 4 | 3 | **4** | **48** | `consecutiveFailures` en `/status` y log `error`. **Sin alerta automática** | 🟡 [R-17](01-matriz-de-riesgos.md#r-17) |
| Descarte sostenido no observado | El sistema procesa menos de lo que debe | 3 | 3 | **4** | **36** | Contador `skipped` expuesto. **Sin alerta automática** | 🟡 [R-20](01-matriz-de-riesgos.md#r-20) |

## Componente: `SystemApiClient`

| Modo de fallo | Efecto | S | O | D | RPN | Control | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| La API está caída y se sigue llamando | Sockets colgados, cascada, avalancha al volver | 5 | 4 | 2 | ~~60~~ **8** | Cortacircuitos con backoff de apertura 30 s → 5 min | ✅ |
| Demasiadas llamadas simultáneas | Descriptores y memoria agotados | 4 | 3 | 3 | **12** | Mamparo: 16 en vuelo, 16 en cola, rechazo con `CONCURRENCY_LIMIT` | ✅ |
| Reintento de una escritura no idempotente | **Duplicación de envíos o cobros** | 5 | 3 | 5 | ~~75~~ **5** | `post()` no reintenta salvo `{ idempotent: true }` explícito | ✅ |
| Los 20 workers reintentan a la vez | La recuperación nunca converge | 4 | 4 | 2 | **8** | Jitter completo | ✅ |
| Llamada con plazo mayor que el del tick | Socket ocupado después de que el tick abortó | 2 | 4 | 4 | **8** | Plazo recortado a `remainingTickBudgetMs()` | ✅ |
| El log del worker y el de la API no se pueden cruzar | Diagnóstico imposible en un fallo distribuido | 3 | 4 | 3 | **6** | `x-request-id` = `executionId` del tick, más `traceparent` de OTel | ✅ |

## Componente: `AllExceptionsFilter`

| Modo de fallo | Efecto | S | O | D | RPN | Control | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Un error transitorio sale como permanente | El cliente deja de reintentar; pérdida de trabajo | 5 | 4 | 5 | ~~100~~ **6** | Mapeo de excepciones tipadas de MikroORM y de SQLSTATE crudo | ✅ |
| Un error del cliente sale como 500 | Ticket de soporte por cada uno; el cliente no puede corregir | 3 | 4 | 4 | ~~48~~ **6** | Ídem | ✅ |
| Fuga de información interna en un 5xx | Divulgación de SQL, rutas y nombres de host | 4 | 2 | 4 | **8** | Sanitización por defecto; sólo 4 códigos exentos, con texto curado | ✅ |
| El filtro se cuelga procesando el error | Ningún error se puede reportar | 5 | 1 | 3 | **15** | Tope de 5 niveles al recorrer la cadena de causas | ✅ |
| Un SQLSTATE nuevo cae a 500 | Diagnóstico degradado, no incorrecto | 2 | 3 | 3 | **18** | Aceptado: los fallos reales deben quedar en 500, no disfrazarse | ✅ |

## Componente: ciclo de vida del proceso

| Modo de fallo | Efecto | S | O | D | RPN | Control | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Excepción no capturada | Muerte sin diagnóstico; reinicios en bucle | 4 | 3 | 5 | ~~60~~ **8** | `installProcessGuards`: log `fatal` estructurado + vaciado de telemetría con plazo | ✅ |
| El drenaje del apagado se atasca | `SIGKILL` mudo; el despliegue se repite igual | 4 | 3 | 5 | ~~60~~ **8** | `installShutdownWatchdog`: fuerza la salida **dejando escrito** qué faltaba | ✅ |
| `stop_grace_period` menor que el drenaje | Lotes cortados en **cada** despliegue | 5 | 5 | 4 | ~~100~~ **8** | `stop_grace_period: 45s` > `WORKER_SHUTDOWN_TIMEOUT_MS` (30 s) > drenaje (20 s) | ✅ |
| Fuga de listeners | OOM progresivo | 3 | 2 | 5 | ~~30~~ **12** | `process.on('warning')` puenteado al logger estructurado | ✅ |
| Temporizador huérfano retrasa el apagado | Apagado lento sin causa aparente | 2 | 3 | 4 | **8** | `clearTimeout` en `finally` y `unref` en todos los temporizadores del kernel | ✅ |

## Componente: infraestructura

| Modo de fallo | Efecto | S | O | D | RPN | Control | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PostgreSQL inaccesible | La API no puede servir nada | 5 | 2 | 1 | **10** | `GET /readiness` lo declara; 503 `DEPENDENCY_UNAVAILABLE` | ✅ |
| Pool de conexiones agotado | Toda petición nueva falla | 4 | 3 | 2 | **24** | Mamparo aguas arriba. **`min`/`max` del pool sin dimensionar** | 🟡 [R-07](01-matriz-de-riesgos.md#r-07) |
| Redis/Mongo/OpenSearch caídos | Los módulos 55/56/57 dejan de servir | 3 | 2 | 1 | **6** | Incluidos en `/readiness` | ✅ |
| Worker sin `healthcheck` | Zombi indistinguible de sano | 5 | 3 | 5 | ~~75~~ **8** | `healthcheck` sobre `/health` en los 20 servicios | ✅ |
| Contenedor sin límite de recursos | Un leak consume la RAM del host | 4 | 2 | 3 | **8** | `deploy.resources.limits` (API 1536M, workers 512M) | ✅ (previo) |
| Deriva de reloj entre nodos | Expiraciones prematuras o tardías | 3 | 2 | **5** | **30** | Ninguno en este repositorio: requiere NTP garantizado | 🔵 [R-18](01-matriz-de-riesgos.md#r-18) |

## Los tres RPN más altos que quedan

Todo lo demás está por debajo de 20. Estos tres son la lista de trabajo de la
siguiente iteración, y los tres tienen **D = 4 o 5**: el problema no es que sean
graves, es que pueden pasar inadvertidos.

1. **RPN 48 — fallo persistente de un tick sin alerta.** El dato existe
   (`consecutiveFailures`); falta quien lo mire. Bloqueado por la ausencia de
   métricas ([A-12](00-auditoria.md#a-12--no-hay-métricas-prometheus-)).
2. **RPN 36 — descarte sostenido sin alerta.** Mismo diagnóstico, mismo bloqueo.
3. **RPN 30 — deriva de reloj.** No medida. Requiere insumo de infraestructura.

---

# Parte 2 · Árbol de fallos (FTA)

Tres eventos cabecera. `∧` = **y** (todas las causas deben darse) · `∨` = **o**
(basta una). Las hojas marcadas ✅ tienen un control que las corta; las 🟡/🔵 son
las que hoy siguen abiertas.

## Evento cabecera 1 · Pérdida o duplicación de trabajo asíncrono

```
PÉRDIDA O DUPLICACIÓN DE TRABAJO
│
├─∨ Procesamiento duplicado
│   ├─∨ Ticks solapados sobre las mismas filas
│   │   ├─∧ El tick tarda más que su intervalo
│   │   │   ∧ No hay exclusión entre ejecuciones          ✅ MutexRegistry
│   │   └─∧ El SKIP LOCKED no alcanza (mismo proceso)     ✅ (complementario)
│   ├─∨ Reintento de una escritura no idempotente
│   │   └─∧ Timeout tras ejecutarse del otro lado
│   │       ∧ El cliente reintenta a ciegas               ✅ post() no reintenta
│   └─∨ Apagado entre el efecto y su confirmación
│       └─∧ SIGTERM en mitad del lote
│           ∧ No hay drenaje                              ✅ WorkerLifecycleService
│           ∧ stop_grace_period < drenaje                 ✅ 45 s > 30 s > 20 s
│
└─∨ Pérdida de trabajo
    ├─∨ El job deja de ejecutarse
    │   ├─∧ Tick bloqueado indefinidamente
    │   │   ∧ Sin plazo                                   ✅ withTimeout
    │   │   ∧ Sin detección externa                       ✅ liveness + healthcheck
    │   └─∧ El proceso muere y no se reinicia             ✅ restart: always
    ├─∨ Error transitorio tratado como permanente
    │   └─∧ Interbloqueo/saturación mapeados a 500
    │       ∧ El cliente deja de reintentar               ✅ CONCURRENCY_CONFLICT
    └─∨ Fallo persistente no detectado
        └─∧ El tick corre puntual y falla siempre
            ∧ Nadie mira consecutiveFailures              🟡 R-17
```

## Evento cabecera 2 · Indisponibilidad total de la API

```
API NO DISPONIBLE
│
├─∨ Cascada desde los workers
│   └─∧ La API se degrada
│       ∧ 20 procesos siguen llamando sin freno           ✅ cortacircuitos
│       ∧ Los sockets se acumulan                         ✅ mamparo
│       ∧ Al volver, recibe todo lo represado             ✅ sondeo único en media apertura
├─∨ Agotamiento de recursos del proceso
│   ├─∨ OOM por cola sin límite                           ✅ mamparo con cola acotada
│   ├─∨ OOM por fuga de listeners                         ✅ aviso puenteado
│   ├─∨ Descriptores agotados (slowloris)                 ✅ headersTimeout/requestTimeout
│   └─∨ Descriptores agotados (temporizadores huérfanos)  ✅ clearTimeout + unref
├─∨ Dependencia obligatoria caída
│   ├─∨ PostgreSQL                                        ✅ readiness → 503
│   ├─∨ Pool agotado                                      🟡 R-07 (sin dimensionar)
│   └─∨ Mongo / Redis / OpenSearch                        ✅ readiness → 503
└─∨ Fallo de despliegue
    ├─∧ La instancia nueva se declara lista antes de estarlo  ✅ estado 'starting'
    └─∧ La anterior se retira antes de drenar                 ✅ stop_grace_period
```

## Evento cabecera 3 · Incidente sin diagnóstico posible

Este árbol es el que justifica la mitad del trabajo de observabilidad: un fallo
que no se puede diagnosticar es, en la práctica, un fallo permanente.

```
INCIDENTE SIN DIAGNÓSTICO
│
├─∨ El proceso murió sin dejar rastro
│   └─∧ Excepción no capturada
│       ∧ Volcado sin estructura a stderr                 ✅ log fatal estructurado
│       ∧ Spans perdidos en el búfer                      ✅ vaciado con plazo en onFatal
├─∨ El apagado colgó sin decir por qué
│   └─∧ SIGKILL del orquestador                           ✅ watchdog con describePending
├─∨ No se puede cruzar el log del worker con el de la API
│   └─∧ Sin identificador común                           ✅ x-request-id = executionId
├─∨ El error del cliente no dice nada útil
│   └─∧ Todo es "Error interno del servidor"              ✅ códigos estables + correlationId
└─∨ No hay serie temporal sobre la que alertar
    └─∧ Sin endpoint /metrics                             🔵 A-12
```

## Lectura conjunta

Las tres ramas que siguen abiertas convergen en el mismo sitio: **no hay métricas
sobre las que definir umbrales**. Los datos existen y están expuestos en
`GET :9100/status` y en los logs estructurados; lo que falta es la serie temporal
y la alerta.

Eso hace que el sistema, hoy, detecte de forma **automática** los fallos duros
—proceso muerto, tick atascado, dependencia caída— y dependa de que alguien mire
para los fallos **blandos**: el tick que falla siempre y el que se descarta
siempre. Es una limitación conocida y acotada, no un descuido.
