import {
  Inject,
  Injectable,
  type BeforeApplicationShutdown,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from './system-api-client.service';
import { workerHealth } from './worker-health.registry';
import { WORKER_ENV } from './worker.tokens';
import type { WorkerEnv } from './worker.env';

/** Nombre del dominio del worker (`messaging`, `billing`…), lo aporta `bootstrapWorker`. */
export const WORKER_NAME = Symbol('WORKER_NAME');

/** Ruta de ingesta de la API (`ops_console`, rol `SYSTEM`). */
export const HEARTBEAT_PATH = '/internal/ops/heartbeats';

/**
 * Latido del worker hacia la API (sonda de vida de instancias).
 *
 * Cada `WORKER_HEARTBEAT_INTERVAL_MS` (15 s por defecto) hace `POST
 * /internal/ops/heartbeats` con `{ instanceId: 'worker-<dominio>', type:
 * 'worker' }`. **No envía ninguna hora**: la API fija `receivedAt` con su reloj,
 * así que un worker con el reloj desfasado no puede aparecer vivo sin estarlo.
 *
 * - Sólo emite mientras el proceso está `running`: un worker que no terminó de
 *   arrancar, o que ya está drenando, no declara vida.
 * - Un latido que falla **jamás** tumba el worker: se registra (una vez por
 *   racha de fallos y al recuperarse) y se reintenta en el siguiente intervalo.
 * - Va fuera de `runTick`: no cuenta como tick ni compite con la exclusión mutua.
 * - Si el cortacircuitos `system-api` está abierto el latido tampoco sale; la API
 *   lo verá como «sin latido recibido», nunca como «proceso muerto».
 */
@Injectable()
export class WorkerHeartbeatService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private timer: NodeJS.Timeout | undefined;
  private immediate: NodeJS.Immediate | undefined;
  private sending = false;
  private failing = false;
  private readonly instanceId: string;

  constructor(
    @Inject(WORKER_NAME) name: string,
    @Inject(WORKER_ENV)
    private readonly env: Pick<WorkerEnv, 'heartbeatIntervalMs'>,
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.instanceId = `worker-${name}`;
    this.logger.setContext(WorkerHeartbeatService.name);
  }

  onApplicationBootstrap(): void {
    // El primer latido sale al terminar el arranque, no antes.
    this.immediate = setImmediate(() => void this.beat());
    this.timer = setInterval(
      () => void this.beat(),
      this.env.heartbeatIntervalMs,
    );
    this.timer.unref();
  }

  beforeApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.immediate) clearImmediate(this.immediate);
    this.timer = undefined;
    this.immediate = undefined;
  }

  /** Un latido. Devuelve `true` si la API lo aceptó. Nunca lanza. */
  async beat(): Promise<boolean> {
    if (workerHealth.getStatus() !== 'running' || this.sending) return false;
    this.sending = true;
    try {
      await this.api.post(
        HEARTBEAT_PATH,
        { instanceId: this.instanceId, type: 'worker' },
        { idempotent: true },
      );
      if (this.failing) {
        this.failing = false;
        this.logger.info(
          { instanceId: this.instanceId },
          'Latido restablecido',
        );
      }
      return true;
    } catch (error) {
      if (!this.failing) {
        this.failing = true;
        // Sólo la clase del error: el mensaje puede traer URLs o cabeceras.
        this.logger.warn(
          {
            instanceId: this.instanceId,
            errorType: error instanceof Error ? error.name : 'desconocido',
          },
          'No se pudo enviar el latido a la API; se reintenta en el siguiente intervalo',
        );
      }
      return false;
    } finally {
      this.sending = false;
    }
  }
}
