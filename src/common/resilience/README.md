# src / common / resilience

Kernel de resiliencia: las primitivas con las que la API y los 20 workers se
protegen del comportamiento de sus dependencias bajo estrés.

## Por qué existe

El sistema tenía trazas distribuidas, RLS validado, outbox transaccional y 4 000
pruebas. Lo que no tenía era defensa frente a lo que pasa cuando una dependencia
se degrada en vez de caer del todo: sockets que se acumulan, ticks que se apilan,
reintentos que se sincronizan y un proceso que muere por memoria antes de haber
rechazado una sola operación.

Ver [`docs/resilience/00-auditoria.md`](../../../docs/resilience/00-auditoria.md).

## Contenido

| Archivo | Responsabilidad |
| --- | --- |
| `with-timeout.ts` | Plazo con **cancelación real** (`AbortSignal`), y espera cancelable |
| `retry.ts` | Reintento con backoff exponencial y jitter completo, con tres límites independientes |
| `circuit-breaker.ts` | Cortacircuitos con ventana por conteo, media apertura de sondeo único y backoff de apertura |
| `bulkhead.ts` | Techo de operaciones en vuelo, con cola acotada |
| `mutex-registry.ts` | Exclusión mutua **sin espera** por clave: descarta el solapamiento en vez de encolarlo |
| `transient-error.ts` | Clasificación transitorio/permanente y lectura de `Retry-After` |
| `resilience.errors.ts` | Los tres errores del kernel, con código estable del contrato |
| `index.ts` | Superficie pública |

## Cómo se combinan

De fuera hacia dentro. **El orden no es intercambiable:**

```
MutexRegistry        ¿ya hay uno igual corriendo?  → descartar
  └─ Bulkhead        ¿cuántos caben a la vez?      → rechazar si no cabe
      └─ CircuitBreaker  ¿está caído?              → rechazar sin llamar
          └─ retry       ¿el fallo se cura solo?   → reintentar con jitter
              └─ withTimeout  ¿tarda demasiado?    → abortar de verdad
                  └─ la llamada real
```

El cortacircuitos va **por fuera** del reintento para que un circuito abierto
corte la escalera entera de intentos en vez de consumirla rechazo a rechazo. El
plazo va **por dentro** para que se aplique a cada intento y no al conjunto.

El montaje completo está en
[`worker/system-api-client.service.ts`](../../worker/system-api-client.service.ts).

## Decisiones que conviene no revertir sin leer primero

**El plazo cancela, no sólo deja de esperar.** `Promise.race([trabajo, temporizador])`
es la versión ingenua y es una trampa: la promesa perdedora sigue viva, el socket
sigue abierto y la transacción sigue abierta. Por eso `fn` recibe un
`AbortSignal` y el contrato es propagarlo a lo que de verdad bloquea.

**El jitter es completo, no fijo.** Sin él, N clientes que fallan por la misma
causa reintentan en el mismo milisegundo, tumban la dependencia que se recuperaba
y amplifican el patrón en cada ronda.

**La clasificación de transitoriedad es una allowlist cerrada.** Un código
desconocido se considera permanente. Equivocarse en el sentido permisivo
—reintentar un `409`— multiplica por N la carga sobre algo que ya dijo que no.

**La ventana del cortacircuitos es por conteo, no por tiempo.** Los ticks de los
workers son esporádicos (uno cada 5–300 s) y una ventana temporal de 60 s se
vaciaría entre tick y tick sin llegar a acumular evidencia.

**La media apertura deja pasar UNA llamada.** Sin esa guarda, al vencer el plazo
entrarían de golpe todas las llamadas represadas y volverían a tumbar la
dependencia que acababa de levantarse.

**La cola del mamparo está acotada.** Una cola sin límite convierte la saturación
en un problema de memoria: las operaciones se aceptan, se apilan y el proceso
muere por OOM sin haber rechazado ninguna.

**El registro de exclusión descarta, no encola.** Un tick periódico solapado no
aporta trabajo nuevo —el siguiente recogerá lo que quedó—, así que encolarlo sólo
garantiza que la cola crezca al ritmo al que el sistema va lento.

## Criterios de mantenimiento

- **Sin dependencias de NestJS ni de terceros.** Estas piezas las usan por igual
  un interceptor HTTP, un cliente axios y un tick de worker, y varias se
  construyen antes de que exista el contenedor de inyección.
- **Todo reloj y toda fuente de aleatoriedad, inyectables.** Una primitiva de
  resiliencia que no se puede probar de forma determinista no es una garantía,
  es una esperanza.
- **Todo temporizador, `unref` y limpiado en `finally`** — también en el camino
  feliz.
- Los errores del kernel son `HttpException` con código estable: cuando protegen
  una llamada dentro de una petición HTTP, `AllExceptionsFilter` los serializa
  sin ningún caso especial.
