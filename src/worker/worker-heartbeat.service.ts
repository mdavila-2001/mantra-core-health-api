import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from './system-api-client.service';
import { WORKER_ENV } from './worker.tokens';
import type { WorkerEnv } from './worker.env';
import {
  workerHealth,
  type WorkerHealthSnapshot,
} from './worker-health.registry';

/** Ruta de ingesta de latidos en la API (`ops_console`). */
export const HEARTBEAT_PATH = '/internal/ops/heartbeats';

/** Tope de frases por sonda y de largo por frase en el cuerpo del latido. */
export const HEARTBEAT_MAX_REASONS = 10;
export const HEARTBEAT_MAX_REASON_LENGTH = 200;

/** Cuerpo de `POST /internal/ops/heartbeats`. Sale íntegro del registro de salud. */
export interface HeartbeatBody {
  instanceId: string;
  pid: number;
  startedAt: string;
  sentAt: string;
  status: WorkerHealthSnapshot['status'];
  liveness: { healthy: boolean; reasons: string[] };
  readiness: { healthy: boolean; reasons: string[] };
  stuckTicks: number;
  openCircuits: string[];
}

const truncateReasons = (reasons: readonly string[]): string[] =>
  reasons
    .slice(0, HEARTBEAT_MAX_REASONS)
    .map((reason) => reason.slice(0, HEARTBEAT_MAX_REASON_LENGTH));

/**
 * Arma el cuerpo del latido a partir de la fotografía del registro de salud.
 *
 * Nunca viaja un mensaje de error ni un dato de negocio: las `reasons` son las
 * frases que genera el propio registro con claves de tick y de circuito, y aun
 * así se acotan en cantidad y largo para que la API pueda validarlas con una
 * lista blanca estricta.
 */
export function buildHeartbeatBody(
  snapshot: WorkerHealthSnapshot,
  sentAt: Date = new Date(),
): HeartbeatBody {
  return {
    instanceId: `worker-${snapshot.worker}`,
    pid: snapshot.pid,
    startedAt: snapshot.startedAt,
    sentAt: sentAt.toISOString(),
    status: snapshot.status,
    liveness: {
      healthy: snapshot.liveness.healthy,
      reasons: truncateReasons(snapshot.liveness.reasons),
    },
    readiness: {
      healthy: snapshot.readiness.healthy,
      reasons: truncateReasons(snapshot.readiness.reasons),
    },
    // La liveness sólo falla por ticks atascados o por proceso detenido; en el
    // segundo caso su única razón no es un tick.
    stuckTicks:
      snapshot.liveness.healthy || snapshot.status === 'stopped'
        ? 0
        : snapshot.liveness.reasons.length,
    openCircuits: snapshot.circuits
      .filter((circuit) => circuit.state === 'open')
      .map((circuit) => circuit.operation),
  };
}

/**
 * Latido periódico del proceso worker hacia la API.
 *
 * La sonda HTTP del worker (`worker-health.server.ts`) escucha en loopback y
 * sólo la ve el healthcheck de su propio contenedor: la API no tiene forma de
 * saber si un worker vive. Este servicio invierte la dirección: cada
 * `WORKER_HEARTBEAT_INTERVAL_MS` empuja la fotografía del registro de salud a
 * `POST /internal/ops/heartbeats` con el mismo cliente autenticado que ya usan
 * los jobs, sin abrir puertos nuevos. La API lo guarda con su propio reloj y
 * decide con él (`GET /admin/ops/instances/liveness`).
 *
 * El primer latido sale cuando terminó el arranque (`onApplicationBootstrap`):
 * un worker que no terminó de construir sus módulos no emite «vida». Mientras
 * el estado siga en `starting` no se emite; en `draining` sí, para que el
 * tablero vea el apagado en curso en vez de un silencio.
 *
 * Un latido que falla **no puede tumbar el worker**: el temporizador está
 * `unref` y toda la emisión va dentro de un `try/catch`. Si el cortacircuitos
 * `system-api` está abierto, el latido tampoco sale: desde la API se ve «sin
 * latido», no «proceso muerto», y la causa lo dice así.
 */
@Injectable()
export class WorkerHeartbeatService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer?: NodeJS.Timeout;
  private first?: NodeJS.Immediate;

  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {
    this.logger.setContext(WorkerHeartbeatService.name);
  }

  onApplicationBootstrap(): void {
    // En el siguiente turno del bucle: todos los `onApplicationBootstrap` del
    // módulo raíz ya corrieron (incluido el que marca `running`), así que el
    // primer latido no sale con estado `starting`.
    this.first = setImmediate(() => void this.beat());
    this.first.unref();

    this.timer = setInterval(
      () => void this.beat(),
      this.env.heartbeatIntervalMs,
    );
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.first) clearImmediate(this.first);
    if (this.timer) clearInterval(this.timer);
    this.first = undefined;
    this.timer = undefined;
  }

  /** Emite un latido. Devuelve `true` si la API lo aceptó. Nunca lanza. */
  async beat(): Promise<boolean> {
    try {
      const snapshot = workerHealth.snapshot();
      if (snapshot.status === 'starting') return false;
      await this.api.post(HEARTBEAT_PATH, buildHeartbeatBody(snapshot), {
        idempotent: true,
      });
      return true;
    } catch (error) {
      // Sólo la clase y el estado HTTP: el cuerpo de una respuesta de error de
      // la API no aporta nada acá y no hace falta volcarlo al log del worker.
      this.logger.warn(
        {
          errorType: error instanceof Error ? error.name : 'desconocido',
          status: error instanceof HttpException ? error.getStatus() : null,
        },
        'No se pudo emitir el latido hacia la API',
      );
      return false;
    }
  }
}
