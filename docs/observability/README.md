# Trazabilidad distribuida — guía para desarrolladores

> Cómo usar y mantener las trazas de este backend. Todos los ejemplos salen del código real del
> repositorio, no de documentación genérica.

## 1. Conceptos, en treinta segundos

| Concepto | Qué es | En este backend |
| --- | --- | --- |
| **Traza** | Todo lo que ocurrió a raíz de un disparador | Una petición HTTP, o una ejecución de un job programado |
| **Span** | Una operación con inicio, fin, atributos y eventos | `POST /iam/auth/login`, `iam.authenticate`, `pg.query:SELECT` |
| **Contexto** | El span activo "ahora mismo", propagado por `AsyncLocalStorage` | Lo que hace que una consulta SQL sepa a qué petición pertenece |
| **`trace_id`** | 32 caracteres hex; identifica la traza completa | Va en la cabecera `x-trace-id` y en cada línea de log |
| **`span_id`** | 16 caracteres hex; identifica un span | Distinto en cada span de la misma traza |

Una traza real de este backend (login fallido, 12 spans):

```text
POST /iam/auth/login                    ← instrumentación HTTP
├── request handler - /iam/auth/login   ← Express
├── IamAuthController.login             ← NestJS
│   └── login                           ← handler de NestJS
│       └── iam.authenticate            ← SPAN DE NEGOCIO (nuestro)
│           ├── pg.query:SELECT …       ← PostgreSQL
│           ├── pg.query:BEGIN …
│           ├── pg.query:INSERT …
│           └── pg.query:COMMIT …
```

## 2. Arrancarlo en local

```bash
# 1. Jaeger (una sola vez; se une a la red del compose principal)
yarn jaeger:up

# 2. En el .env
OTEL_ENABLED=true

# 3. El backend, como siempre
yarn start:dev

# 4. La UI
open http://localhost:16686

# 5. Verificación extremo a extremo
yarn jaeger:verify
```

Para apagarlo: `yarn jaeger:down`. Para los logs de Jaeger: `yarn jaeger:logs`.

Con `OTEL_ENABLED=false` (el valor por defecto) el backend arranca exactamente igual, sin abrir
ninguna conexión y sin crear el SDK.

## 3. Buscar una traza

| Punto de partida | Cómo |
| --- | --- |
| Un usuario reportó un fallo | Pedirle la cabecera `x-trace-id` → `http://localhost:16686/trace/<id>` |
| Una línea de log | El campo `trace_id` del JSON → misma URL |
| Un endpoint lento | UI → servicio `alovida-api` → operación `POST /iam/auth/login` → ordenar por duración |
| Un job de worker | UI → servicio `alovida-worker-messaging` → operación `worker.messaging.outbox-relay` |
| Todos los logs de una operación | `grep '"trace_id":"<id>"'` sobre los logs de la API **y** de los workers |

## 4. Crear un span manual

Inyectar `TracingService`. **Nunca** importar `@opentelemetry/*` desde `src/modules/`.

```ts
import { APP_ATTR, TracingService } from '../../../observability';

@Injectable()
export class BillingService {
  constructor(private readonly tracing: TracingService) {}

  async issueInvoice(invoiceId: string, tenantId: string) {
    return this.tracing.runInSpan(
      'billing.invoice.issue',
      {
        [APP_ATTR.MODULE]: 'billing',
        [APP_ATTR.OPERATION]: 'invoice.issue',
        [APP_ATTR.ENTITY_TYPE]: 'billing.invoices',
        [APP_ATTR.ENTITY_ID]: invoiceId,
        [APP_ATTR.TENANT_ID]: tenantId,
      },
      async (span) => {
        span.addEvent('lines.calculated');
        const result = await this.calculate(invoiceId);
        span.setAttribute('billing.invoice.line_count', result.lines.length);
        return result;
      },
    );
  }
}
```

Qué hace `runInSpan` por ti:

- Cierra el span en `finally`, también si la operación lanza.
- Marca el span como error, adjunta la excepción **una sola vez** y **relanza el error original
  sin modificarlo**.
- Anida automáticamente bajo el span activo.
- Con la telemetría apagada, no cuesta nada: el tracer no-op no graba.

Para código síncrono, `runInSpanSync` evita convertir en asíncrono un camino que no lo era.

### Cuándo NO crear un span

- El método es trivial (un getter, una validación en memoria).
- La instrumentación automática ya lo cuenta (una consulta SQL, una llamada HTTP saliente).
- El nombre tendría que llevar un identificador. Los identificadores van en **atributos**.

Ver el criterio completo en el [catálogo de spans](02-business-spans-catalog.md).

## 5. Eventos y atributos

| Uso | Ejemplo |
| --- | --- |
| **Evento**: un hito instantáneo dentro de la operación | `span.addEvent('provider.attempt.started')` |
| **Atributo**: una propiedad de toda la operación | `span.setAttribute('messaging.delivery.outcome', 'SENT')` |

Usar siempre las constantes de `APP_ATTR` para el namespace `app.*`. Atributos de **baja
cardinalidad** salvo los identificadores explícitamente permitidos.

## 6. Qué NO registrar jamás

Contraseñas, tokens, cabeceras `Authorization`, cookies, documentos de identidad, correos,
teléfonos, diagnósticos, resultados clínicos, datos bancarios, cuerpos de petición o respuesta,
parámetros SQL, valores de Redis, query strings, variables de entorno.

La lista completa, los controles que lo impiden y el procedimiento ante una filtración están en la
[política de privacidad](04-data-privacy-policy.md). **Léela antes de añadir cualquier atributo con
un valor de negocio.**

Regla práctica: si el valor pudiera aparecer en una demanda por protección de datos, no va en un
span.

## 7. Instrumentar un worker

**No hay que hacer nada.** Los 20 workers ya están cubiertos:

- El SDK arranca en `src/worker/bootstrap.ts`, que los 20 entrypoints importan primero.
- El nombre del servicio (`alovida-worker-<dominio>`) se deriva del entrypoint en ejecución.
- Los 30 jobs programados pasan por `runTick`, que crea la traza raíz de cada ejecución.
- `ObservabilityModule` es global también en el worker: cualquier job inyecta `TracingService`.

Para un span de negocio dentro de un job, el patrón es idéntico al de §4. Ejemplo real:
`notification.dispatch` en
[notification-delivery.job.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/worker/jobs/messaging/notification-delivery.job.ts).

## 8. Instrumentar un proceso programado nuevo

Basta con usar `runTick`, como ya hacen los 30 jobs:

```ts
@Interval(RELAY_INTERVAL_MS)
async tick(): Promise<void> {
  await runTick(this.logger, 'worker.<dominio>.<job>', async () => {
    // …
  });
}
```

`runTick` crea la traza raíz, le pone `app.job.name` y `app.job.execution.id`, marca el span si el
tick falla y —como siempre ha hecho— **no propaga el error**, para no tumbar el scheduler.

## 9. Propagar contexto por el outbox

También automático. `OutboxService.publishDomainEvent` inyecta el contexto en `metadataJson` bajo
`_trace`, y `dispatchEvent` lo extrae. Publicación y consumo comparten `trace_id`.

Si un día se añade otro mecanismo asíncrono, `MessagingTraceService` da las cuatro piezas:
`inject()`, `attach(payload)`, `extract(payload)`, `runInProducerSpan` / `runInConsumerSpan`.

Un mensaje sin `_trace` (anterior a esta iniciativa, o de un productor sin instrumentar) se procesa
igual: el carrier vacío hace que el span cuelgue de la traza actual.

## 10. Validar la correlación de logs

Una petición debe producir logs así:

```json
{"level":40,"trace_id":"acde4e5f…","span_id":"9d04853b…","trace_flags":1,"msg":"Credenciales inválidas"}
```

- `trace_id` coincide con la cabecera `x-trace-id` de esa respuesta.
- Todos los spans de la traza comparten `trace_id`; cada uno tiene su `span_id`.
- El `trace_id` sale **siempre** del contexto activo de OpenTelemetry, nunca de una cabecera del
  cliente (sería falsificable).

Si falta, ver el [runbook](06-operational-runbook.md) §3. La ausencia suele ser correcta: fuera de
una traza no se inventa un identificador.

## 11. Muestreo

```env
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=1.0
```

`parentbased_*` respeta la decisión del servicio aguas arriba: una traza worker → API no queda
partida. Valores por entorno en [03-production-topology.md](03-production-topology.md) §7.

## 12. Problemas frecuentes

| Síntoma | Causa más probable |
| --- | --- |
| No aparece ninguna traza | `OTEL_ENABLED` no es `true` |
| Aparecen spans de negocio pero no de HTTP ni SQL | Alguien puso un `import` **antes** del bootstrap de telemetría en `main.ts` o en `worker/bootstrap.ts` |
| `ECONNREFUSED :4318` | Jaeger apagado, o endpoint `localhost` desde dentro de Docker |
| La traza no aparece pero no hay errores | Muestreo por debajo de 1.0; subirlo para verificar |
| El worker no aparece | Se está buscando bajo `alovida-api` en vez de `alovida-worker-<dominio>` |
| Los logs no llevan `trace_id` | Código fuera de todo contexto de traza (arranque, `void promesa`) |

Diagnóstico completo en el [runbook operativo](06-operational-runbook.md).

## 13. Una limitación conocida

La instrumentación **automática** no puede ejercitarse dentro de Jest: OpenTelemetry la instala
enganchando el cargador de módulos de Node, y Jest sustituye ese cargador por su propio registro.
Por eso las pruebas de integración verifican los spans **manuales** y la privacidad, y la cadena
completa (HTTP → controller → SQL → Jaeger) se verifica con `yarn jaeger:verify` contra procesos
reales.

## Documentos de esta carpeta

| Documento | Para qué |
| --- | --- |
| [00-current-state-audit.md](00-current-state-audit.md) | Qué había antes y cómo se decidió instrumentar |
| [01-architecture-design.md](01-architecture-design.md) | Decisiones de arquitectura y sus alternativas |
| [02-business-spans-catalog.md](02-business-spans-catalog.md) | Cada span manual, sus atributos y su motivo |
| [03-production-topology.md](03-production-topology.md) | Cómo desplegarlo de verdad |
| [04-data-privacy-policy.md](04-data-privacy-policy.md) | Qué no puede salir del proceso |
| [05-performance-results.md](05-performance-results.md) | Cuánto cuesta, medido |
| [06-operational-runbook.md](06-operational-runbook.md) | Qué hacer cuando falla |
| [tracing.md](tracing.md) | Resumen de la capacidad dentro del portal de documentación |
