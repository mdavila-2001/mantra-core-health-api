import {
  Injectable,
  type BeforeApplicationShutdown,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { delay } from '../common/resilience';
import { startDraining } from './run-tick.util';
import { workerHealth } from './worker-health.registry';

/**
 * Arranque y apagado ordenados de un proceso worker.
 *
 * **Arranque.** Hasta que este servicio marca `running`, la readiness responde
 * 503. La diferencia importa en un despliegue continuo: sin ese estado inicial,
 * un worker recién creado se declara listo antes de haber terminado de
 * construir sus módulos, el orquestador retira la instancia anterior y hay una
 * ventana —corta, pero real— en la que ningún proceso está drenando el outbox.
 *
 * **Apagado.** Es el problema de verdad. Un `SIGTERM` en mitad de un tick que ya
 * reclamó 50 filas con `SKIP LOCKED` y va por la 20 deja esas 30 restantes
 * marcadas como "en proceso por un worker que ya no existe", y sólo vuelven a
 * la cola cuando expira su lock. Peor: si el tick estaba entre la llamada al
 * proveedor y la confirmación en base de datos, el mensaje se envió y el sistema
 * no lo sabe. Eso es duplicación garantizada en el siguiente intento.
 *
 * El drenaje resuelve las dos cosas con una secuencia estricta:
 *   1. dejar de admitir ticks nuevos (`startDraining`),
 *   2. esperar a que los que ya estaban en vuelo terminen su lote,
 *   3. sólo entonces dejar que NestJS cierre conexiones y el proceso salga.
 *
 * La espera está acotada. Si un tick no vuelve dentro del plazo, se registra
 * **cuál** y se continúa con el apagado: es exactamente el mismo bloqueo que la
 * sonda de liveness declara irrecuperable, y esperarlo eternamente convertiría
 * un despliegue en un incidente.
 */
@Injectable()
export class WorkerLifecycleService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  /** Plazo del drenaje. Debe dejar margen dentro del plazo del orquestador. */
  private readonly drainTimeoutMs: number;
  /** Frecuencia con la que se comprueba si quedan ticks en vuelo. */
  private static readonly POLL_INTERVAL_MS = 200;

  // El plazo se lee del entorno en el cuerpo y no como parámetro con valor por
  // defecto: NestJS resuelve los parámetros del constructor por su tipo, y un
  // `number` no es inyectable — el proceso no arrancaría.
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(WorkerLifecycleService.name);
    const configured = Number(process.env.WORKER_DRAIN_TIMEOUT_MS ?? 20_000);
    this.drainTimeoutMs =
      Number.isFinite(configured) && configured > 0 ? configured : 20_000;
  }

  onApplicationBootstrap(): void {
    workerHealth.setStatus('running');
  }

  async beforeApplicationShutdown(signal?: string): Promise<void> {
    startDraining();
    workerHealth.setStatus('draining');

    const pending = workerHealth.inFlightOperations();
    this.logger.info(
      { signal, inFlight: pending, drainTimeoutMs: this.drainTimeoutMs },
      pending.length === 0
        ? 'Apagado: no hay ticks en vuelo'
        : 'Apagado: esperando a que terminen los ticks en vuelo',
    );

    const deadline = Date.now() + this.drainTimeoutMs;
    while (workerHealth.hasInFlightTicks() && Date.now() < deadline) {
      await delay(WorkerLifecycleService.POLL_INTERVAL_MS);
    }

    const stillRunning = workerHealth.inFlightOperations();
    if (stillRunning.length > 0) {
      // No es un detalle menor que esto quede escrito: son exactamente los
      // ticks cuyo trabajo puede haber quedado a medias, y por tanto los
      // primeros sitios donde mirar si aparecen duplicados o registros
      // "reclamados por nadie" después del despliegue.
      this.logger.error(
        { inFlight: stillRunning, drainTimeoutMs: this.drainTimeoutMs },
        'Apagado: se agotó el plazo de drenaje con ticks aún en vuelo',
      );
    } else {
      this.logger.info('Apagado: todos los ticks terminaron limpiamente');
    }

    workerHealth.setStatus('stopped');
  }
}
