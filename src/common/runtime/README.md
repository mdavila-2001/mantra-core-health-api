# src / common / runtime

Garantías de ciclo de vida del proceso, compartidas por la API y los 20 workers.

## Por qué existe

Antes de esto, ninguno de los 21 procesos registraba `uncaughtException` ni
`unhandledRejection`, y ninguno acotaba cuánto podía tardar su apagado.

Las dos piezas cubren los dos extremos del mismo problema —**que un proceso
termine de forma observable**—: `installProcessGuards` para la muerte imprevista
y `installShutdownWatchdog` para la prevista que se atasca.

## Contenido

| Archivo | Responsabilidad |
| --- | --- |
| `process-guards.ts` | Manejadores de fallo terminal: log estructurado, vaciado de búferes con plazo, salida con código 1 |
| `shutdown-watchdog.ts` | Plazo sobre el apagado; al agotarse, registra qué seguía pendiente y fuerza la salida |
| `index.ts` | Superficie pública |

## Decisiones

**No se evita la muerte del proceso: se documenta.** Continuar tras un
`uncaughtException` significa operar con invariantes rotas —una transacción a
medio confirmar, un lock retenido, un búfer parcialmente escrito— y en un backend
clínico eso es peor que reiniciar. El orquestador sabe reiniciar; nadie sabe
reparar un estado desconocido en caliente.

**El vaciado tiene su propio plazo.** Un vaciado que se cuelga convertiría una
caída limpia en un proceso zombi. Se le dan 3 s y ni uno más.

**El vigilante de apagado no compite con NestJS.** `enableShutdownHooks` sigue
haciendo su trabajo; el vigilante sólo arma un plazo. Su temporizador va `unref`,
así que un apagado que termina a tiempo es exactamente igual de rápido que sin
vigilante.

**`describePending` es lo que hace útil al log de la salida forzada.** Un
`SIGKILL` del orquestador es mudo, y la diferencia entre reincidir en el mismo
despliegue colgado y arreglarlo es esa línea que nombra el recurso atascado.

## Cableado

```ts
// src/main.ts y src/worker/bootstrap.ts
installProcessGuards({ logger, processName: 'api', onFatal: () => app.close() });
installShutdownWatchdog({ logger, processName: 'api', timeoutMs, describePending });
```

En los workers se complementa con
[`WorkerLifecycleService`](../../worker/worker-lifecycle.service.ts), que drena
los ticks en vuelo antes de que NestJS cierre las conexiones.

## Criterios de mantenimiento

- El plazo de apagado debe quedar **por debajo** del plazo de gracia del
  orquestador (`stop_grace_period` en `docker-compose.yml`,
  `terminationGracePeriodSeconds` en Kubernetes). Si se invierte, quien fuerza la
  salida es un `SIGKILL` mudo y se pierde justo el diagnóstico.
- Ambas funciones son idempotentes y devuelven un desinstalador, que sólo usan
  las pruebas.
- El contrato de logger (`FatalLogger`) es mínimo a propósito: no acopla esta
  carpeta a `nestjs-pino`.
