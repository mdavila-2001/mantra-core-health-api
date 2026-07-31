# 06 · Runbook operativo de trazas

> Fase 24. Procedimientos de diagnóstico para cuando la observabilidad falla. Cada sección va de lo
> más barato de comprobar a lo más caro.

## Regla previa

**La trazabilidad nunca es una emergencia de negocio.** Si algo va mal con las trazas, la primera
opción legítima siempre es apagarlas:

```bash
OTEL_ENABLED=false   # y redesplegar
```

La aplicación funciona exactamente igual. Nada de lo que sigue justifica degradar el servicio.

---

## 1. Jaeger no recibe trazas

### 1.1 ¿Está habilitada la telemetría?

```bash
docker compose exec api printenv | grep OTEL_
```

`OTEL_ENABLED` debe ser `true`. Es la causa más frecuente y la más barata de descartar.

### 1.2 ¿La aplicación cree que exporta?

```bash
docker compose logs api | grep '"name":"opentelemetry"'
```

- **Sin líneas** y `OTEL_ENABLED=true` → el SDK arrancó bien y no hay errores de exportación. El
  problema está aguas abajo (Jaeger, red) o en el muestreo.
- **`ECONNREFUSED`** → destino inalcanzable. Ir a 1.3.
- **Nada en absoluto y ningún span** → el SDK puede no haber arrancado. Ir a 1.6.

Para más detalle, subir temporalmente el diagnóstico:

```bash
OTEL_DIAG_LOG_LEVEL=DEBUG
```

Bajarlo después: en `DEBUG` el SDK escribe una línea por lote exportado.

### 1.3 ¿El endpoint es alcanzable desde el contenedor?

```bash
docker compose exec api node -e \
  "fetch('http://jaeger:4318/v1/traces',{method:'POST'}).then(r=>console.log(r.status)).catch(e=>console.log('ERROR',e.message))"
```

Un `400` es **buena señal**: el receptor responde y rechaza un cuerpo vacío. `ECONNREFUSED` o un
fallo de DNS indican problema de red.

### 1.4 ¿El endpoint es el correcto para el contexto?

Es el error de configuración más común de este proyecto:

| Dónde corre el proceso | Endpoint correcto |
| --- | --- |
| Fuera de Docker (`yarn start:dev`) | `http://localhost:4318/v1/traces` |
| Dentro de Docker | `http://jaeger:4318/v1/traces` |

Dentro de un contenedor, `localhost` es el propio contenedor. Por eso `docker-compose.yml` usa la
variable `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_DOCKER`, distinta de la del `.env` local.

### 1.5 ¿Están Jaeger y la aplicación en la misma red?

```bash
docker network inspect mantra-redesa-network --format '{{range .Containers}}{{.Name}} {{end}}'
```

Deben aparecer `...-api-1` y `...-jaeger-jaeger-1`. Si Jaeger no está, el compose de Jaeger se
levantó antes que la red del compose principal, o `REDESA_NETWORK_NAME` no coincide.

### 1.6 ¿Arrancó el SDK con la instrumentación a tiempo?

Síntoma característico: aparecen los spans **de negocio** pero no los de HTTP ni los de PostgreSQL.
Significa que el bootstrap se cargó **después** de NestJS/`pg`, y el parcheo llegó tarde.

Comprobar que la importación de telemetría sigue siendo la **primera línea** de:

- `src/main.ts`
- `src/worker/bootstrap.ts`

Un `import` nuevo colocado por encima rompe la instrumentación automática sin ningún error visible.

### 1.7 ¿Está el muestreo descartándolo todo?

```bash
docker compose exec api printenv | grep OTEL_TRACES_SAMPLER
```

Con `OTEL_TRACES_SAMPLER_ARG=0.05`, 19 de cada 20 trazas se descartan: una prueba manual puntual
puede no aparecer sin que nada esté roto. Para verificar, subir temporalmente a `1.0`.

### 1.8 ¿Se está mirando el servicio correcto?

Cada proceso exporta con su propio nombre: `redesa-api`, `redesa-worker-messaging`, etc. Buscar
trabajo de un worker bajo `redesa-api` no devuelve nada.

```bash
curl -s http://localhost:16686/api/services | jq -r '.data[]'
```

### 1.9 Verificación completa

```bash
yarn jaeger:verify
```

Recorre los siete pasos de extremo a extremo y dice exactamente cuál falla.

---

## 2. El backend se volvió lento

### 2.1 Descartar que sea la telemetría

```bash
OTEL_ENABLED=false   # redesplegar y volver a medir
```

Si la latencia no cambia, el problema es otro y este runbook no aplica.

### 2.2 Revisar el muestreo

`OTEL_TRACES_SAMPLER_ARG=1.0` en producción es el error clásico. Bajar a `0.10`.

### 2.3 Revisar el exportador

Con Jaeger caído, cada lote agota `OTEL_EXPORT_TIMEOUT_MS` antes de descartarse. La exportación es
asíncrona y no bloquea las peticiones —medido: p50 3,49 ms con Jaeger apagado, frente a 3,25 ms con
Jaeger arriba—, pero consume CPU. Bajar `OTEL_EXPORT_TIMEOUT_MS` acelera el descarte.

### 2.4 Revisar instrumentaciones ruidosas

Si alguien añadió `fs`, `dns` o `net` a `src/observability/instrumentations.ts`, quitarlas: `fs`
sola genera cientos de spans por petición.

### 2.5 Revisar la cardinalidad

Un span cuyo **nombre** lleva un identificador (`iam.authenticate.a3f9…`) hace crecer sin control
el índice de operaciones de Jaeger y degrada la UI. Buscar en la UI operaciones con nombres
parecidos que se repiten y corregir el código: los identificadores van en atributos, nunca en el
nombre.

### 2.6 Collector

Si el Collector rechaza lotes por `memory_limiter`, la aplicación reintenta. Escalar réplicas y
revisar sus métricas internas en `:8888`.

---

## 3. Los logs no llevan `trace_id`

### 3.1 ¿Hay traza activa en ese punto?

El `mixin` de pino devuelve `{}` a propósito cuando no hay span activo, en lugar de inventar un
identificador. Es el comportamiento **correcto** para:

- Logs de arranque (anteriores a la primera petición).
- Telemetría deshabilitada.
- Código que corre fuera de todo contexto: un `setTimeout`, un `.then()` desprendido, un
  `void promesa` sin `await`.

### 3.2 ¿Está la telemetría habilitada?

Sin `OTEL_ENABLED=true` no hay spans y, por tanto, no hay `trace_id`. Los logs siguen llevando
`req.id` como correlación, igual que antes de esta iniciativa.

### 3.3 En los workers

Un worker solo tiene traza activa **dentro** de un tick (`runTick` crea la raíz). Un log emitido en
el arranque del worker, o fuera de un tick, no lleva `trace_id` y es correcto.

### 3.4 ¿Sigue el `mixin` en su sitio?

Comprobar que `buildPinoOptions()` en `src/logging/pino-options.ts` conserva
`mixin: () => currentTraceContext()`. Es un único punto para la API y los 20 workers.

---

## 4. El contexto no sobrevive al outbox

Síntoma: la publicación y el consumo del evento aparecen como dos trazas distintas.

### 4.1 ¿Se inyectó el contexto?

```sql
SELECT id, event_type, metadata_json->'_trace' AS trace
FROM messaging.domain_events
ORDER BY created_at DESC LIMIT 5;
```

- `NULL` → no había traza activa al publicar, o la telemetría estaba apagada en la API.
- `{"traceparent": "00-…"}` → la inyección funcionó; ir a 4.2.

### 4.2 ¿Se extrajo el contexto?

El consumidor (`dispatchEvent`) lee `metadataJson`. Si el evento tiene `_trace` pero el span
consumidor arranca una traza nueva, revisar que `MessagingTraceService.extract` recibe
`event.metadataJson` y no el payload.

### 4.3 Eventos antiguos

Un evento anterior a esta iniciativa no tiene `_trace`. Se procesa igual —el carrier vacío hace que
el span cuelgue de la traza del tick— y **eso no es un fallo**. Es el comportamiento diseñado.

### 4.4 Recordatorio de diseño

El carrier va en `metadataJson`, **nunca** en `payloadJson`: el payload alimenta la clave de
idempotencia del outbox y un `traceparent` distinto por petición la rompería.

---

## 5. Hay datos sensibles en las trazas

Es un incidente de seguridad. Procedimiento completo en
[04-data-privacy-policy.md](04-data-privacy-policy.md) §9. Resumen operativo:

1. **Contener**: `OTEL_ENABLED=false` y redesplegar. Sin impacto en el negocio.
2. **Cortar**: añadir el atributo a `attributes/redact` en el Collector (efecto inmediato, sin
   desplegar la aplicación) y corregir el origen en el código.
3. **Alcance**: qué se expuso, cuánto tiempo, quién accedió.
4. **Purgar**: borrar los índices afectados; con 7 días de retención suele ser más seguro purgar el
   rango completo que hacer un borrado selectivo.
5. **Revocar**: rotar todo secreto expuesto (JWT, claves de webhook, claves de proveedor).
6. **Documentar** el incidente y el control añadido.
7. **Reactivar** solo tras `yarn jaeger:verify`, cuyo paso 6 comprueba exactamente esto.

---

## 6. Comprobaciones rápidas

```bash
# ¿Qué servicios reportan?
curl -s http://localhost:16686/api/services | jq -r '.data[]'

# Últimas trazas de un servicio
curl -s "http://localhost:16686/api/traces?service=redesa-api&limit=5" \
  | jq -r '.data[] | "\(.traceID) \(.spans|length) spans"'

# Una traza concreta, por el x-trace-id que dio el usuario
curl -s http://localhost:16686/api/traces/<TRACE_ID> \
  | jq -r '.data[].spans[] | "\(.operationName)"'

# Logs de esa misma traza
docker compose logs api | grep '"trace_id":"<TRACE_ID>"'

# Verificación completa extremo a extremo
yarn jaeger:verify
```

## 7. Investigar el reporte de un usuario

1. Pedir el valor de la cabecera `x-trace-id` de la respuesta (o el `correlationId` del cuerpo de
   error, que apunta al log).
2. Abrir `http://<jaeger>/trace/<trace-id>`.
3. Leer la ruta crítica: el span más largo de la traza es la causa de la latencia.
4. Buscar spans marcados en rojo: ahí falló.
5. Correlacionar con los logs: `grep '"trace_id":"<trace-id>"'` devuelve todas las líneas de esa
   operación, incluidas las de los workers que la continuaron.

## Ver también

- [Guía para desarrolladores](README.md)
- [Topología de producción](03-production-topology.md)
- [Política de privacidad de datos](04-data-privacy-policy.md)
- [Resultados de rendimiento](05-performance-results.md)
