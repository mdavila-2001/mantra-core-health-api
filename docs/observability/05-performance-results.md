# 05 · Resultados de rendimiento

> Fase 22. Mediciones **reales**, ejecutadas contra el backend compilado y una base de datos
> PostgreSQL real. Ningún número de este documento es una estimación.

## 1. Metodología

| Elemento | Valor |
| --- | --- |
| Script | [`scripts/bench-telemetry.mjs`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/scripts/bench-telemetry.mjs) |
| Endpoint | `POST /iam/auth/login` con credenciales inválidas |
| Por qué ese endpoint | Recorre el camino completo —controller, guard, `ValidationPipe`, span de negocio `iam.authenticate`, 4 consultas a PostgreSQL, filtro global de excepciones— sin crear datos ni depender de un usuario sembrado |
| Spans por petición | 12 (verificado en Jaeger) |
| Artefacto | `dist/` compilado con `yarn build`, ejecutado con `node dist/src/main.js` |
| Base de datos | PostgreSQL (TimescaleDB) real en Docker |
| Máquina | MacBook Air, macOS 15.5, Node v24.18.0, con el stack de datos completo en Docker |

### Corrección metodológica aplicada

La primera tanda se hizo con concurrencia 10 y dio resultados **contradictorios**: la
configuración sin telemetría llegó a medir *peor* que la instrumentada (p50 17,3 ms frente a
6,2 ms). La causa quedó identificada: con `load average` en 6,5 y MongoDB consumiendo un 46 % de
CPU en el mismo equipo, la variable dominante era la contención de la máquina, no la
instrumentación. Esas cifras se descartaron por inválidas.

La medición definitiva usa **concurrencia 1** (secuencial), 50 peticiones de calentamiento
descartadas y 4 corridas de 200 peticiones por configuración. Aísla el coste por petición en lugar
de medir la saturación del portátil.

Reproducir:

```bash
yarn build
yarn jaeger:up
OTEL_ENABLED=true RATE_LIMIT_DISABLED=true node dist/src/main.js
node scripts/bench-telemetry.mjs --requests 200 --concurrency 1 --warmup 50
```

## 2. Resultados

Cuatro corridas por configuración, en milisegundos.

### A · Telemetría deshabilitada (`OTEL_ENABLED=false`) — línea base

| Corrida | p50 | p95 | p99 | media | req/s |
| --- | --- | --- | --- | --- | --- |
| 1 | 2,91 | 4,22 | 4,92 | 3,11 | 321,8 |
| 2 | 3,05 | 4,67 | 6,69 | 3,27 | 305,8 |
| 3 | 3,21 | 4,98 | 6,27 | 3,40 | 293,9 |
| 4 | 3,53 | 5,02 | 5,70 | 3,65 | 274,0 |
| **Mediana** | **3,13** | **4,83** | **5,99** | **3,34** | **299,9** |

### B · Telemetría habilitada, muestreo 1.0, Jaeger disponible

| Corrida | p50 | p95 | p99 | media | req/s |
| --- | --- | --- | --- | --- | --- |
| 1 | 3,42 | 5,81 | 10,56 | 3,83 | 261,0 |
| 2 | 3,23 | 5,46 | 6,68 | 3,59 | 278,6 |
| 3 | 3,11 | 4,57 | 6,73 | 3,38 | 295,7 |
| 4 | 3,26 | 4,50 | 5,25 | 3,38 | 295,5 |
| **Mediana** | **3,25** | **5,02** | **6,71** | **3,49** | **287,1** |

### C · Telemetría habilitada, muestreo 1.0, **Jaeger caído**

| Corrida | p50 | p95 | p99 | media | req/s |
| --- | --- | --- | --- | --- | --- |
| 1 | 3,42 | 4,74 | 5,92 | 3,54 | 282,5 |
| 2 | 3,49 | 6,43 | 7,22 | 3,89 | 257,3 |
| 3 | 4,15 | 7,68 | 11,76 | 4,72 | 211,7 |
| **Mediana** | **3,49** | **6,43** | **7,22** | **3,89** | **257,3** |

### D · Telemetría habilitada, muestreo 0.1

Medida con concurrencia 10 antes de la corrección metodológica; se conserva únicamente como
referencia cualitativa (p50 6,0–6,2 ms, en el mismo orden que las demás configuraciones bajo esa
misma carga). **No es comparable** con A, B y C y no se usa para ninguna conclusión.

## 3. Resumen

| Configuración | p50 | Sobrecarga sobre la base | Conclusión |
| --- | --- | --- | --- |
| A · sin telemetría | 3,13 ms | — | Referencia |
| B · telemetría al 100 % | 3,25 ms | **+0,12 ms (+3,8 %)** | Dentro de la variación entre corridas |
| C · telemetría, Jaeger caído | 3,49 ms | +0,36 ms (+11,5 %) | Sin degradación funcional |

**La sobrecarga medida (~0,1 ms por petición con 12 spans) es del mismo orden que la variación
entre corridas de la propia línea base** (2,91 – 3,53 ms). Con este endpoint, en esta máquina y a
concurrencia 1, la instrumentación no es distinguible del ruido de medición.

## 4. Comportamiento con Jaeger caído

Verificado apagando Jaeger con la aplicación en marcha y telemetría activa:

| Comprobación | Resultado |
| --- | --- |
| `GET /health` | `200` |
| `POST /iam/auth/login` | `401` — el error de negocio normal, no un 5xx |
| Latencia | Dentro de la variación normal (p50 3,49 ms) |
| Error del exportador | **Una** línea NDJSON en `stderr`: `AggregateError [ECONNREFUSED] … 127.0.0.1:4318` |
| Ruido | Sin cascada de errores; el `BatchSpanProcessor` descarta el lote y sigue |

Se confirma el invariante de diseño: **una petición de negocio nunca espera a la exportación ni
falla por ella**, y el fallo no se oculta.

## 5. Arranque y cierre

| Medición | Valor |
| --- | --- |
| Arranque con telemetría apagada | Sin diferencia observable respecto a antes de esta iniciativa |
| Arranque con telemetría encendida | La instalación de 7 instrumentaciones no retrasó de forma perceptible un arranque que ya dedica la mayor parte del tiempo a conectar con PostgreSQL, MongoDB y OpenSearch |
| Cierre | `SIGTERM` cierra el SDK vaciando el búfer, sin errores en el log y sin bloquear el apagado de NestJS |

No se instrumentó una medición precisa del arranque: en un proceso cuyo arranque está dominado por
la conexión a cinco almacenes de datos, aislar el coste del SDK habría exigido una instrumentación
específica que no se hizo. **Se declara como no medido con precisión** en lugar de estimarlo.

## 6. Lo que NO se midió

Honestidad sobre los límites de este ejercicio:

| Aspecto | Estado | Por qué |
| --- | --- | --- |
| Uso de CPU y memoria del proceso | **No medido** | Requiere perfilado sostenido; la máquina de medición estaba compartida con el stack de datos |
| Comportamiento bajo carga alta y sostenida | **No medido** | El portátil satura antes que la aplicación; haría falta un entorno dedicado |
| Collector saturado | **No medido** | No hay Collector desplegado todavía |
| Pérdida de spans bajo presión | **No medido** | Se mide con las métricas internas del Collector (§ topología) |
| Uso de red | **No medido** | Despreciable en local; relevante solo con volumen de producción |
| Muestreo 0,1 en condiciones comparables | **No medido correctamente** | Ver §2.D |

**Antes de fijar el muestreo de producción hay que repetir estas mediciones en un entorno
dedicado y con tráfico representativo.** Los valores de `docs/observability/03-production-topology.md`
§7 son puntos de partida, no conclusiones de esta medición.

## Ver también

- [Topología de producción](03-production-topology.md)
- [Runbook operativo](06-operational-runbook.md)
