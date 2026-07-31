import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';
import { WORKER_ENV, type WorkerEnv } from '../../worker.tokens';

const CLAIM_INTERVAL_MS = 5_000;
const DEFAULT_BATCH_SIZE = 10;

/** Refleja `ClaimedJobDto`. */
interface ClaimedJob {
  id: string;
  jobType: string;
  payloadJson: unknown;
  attempts: number;
}

/** Refleja `ClaimJobsResponseDto`. */
interface ClaimJobsResponse {
  queueId: string;
  jobs: ClaimedJob[];
  claimed: number;
}

/** Lo que ejecuta un job concreto. Lanza para marcar el fallo. */
export type QueueJobHandler = (job: ClaimedJob) => Promise<unknown>;

/**
 * Registro de handlers por `jobType` exacto. Vacío por diseño: ningún
 * consumidor concreto vive todavía en este backend (el fan-out de
 * `dispatchEvent` encola trabajo para *suscriptores*, que son sistemas
 * externos — ver `messaging/README.md`, "El fan-out es idempotente por
 * suscripción"). Cuando un futuro consumidor interno necesite drenar su
 * propia cola, se registra aquí con `registerQueueJobHandler(...)`.
 *
 * Un job cuyo `jobType` no tiene handler no se completa en silencio: se
 * falla con un motivo explícito, así que agota reintentos y cae a
 * `dead_letter_jobs` de forma visible (Fase 6, alerta de cola muerta) en vez
 * de quedar reclamado para siempre o darse por resuelto sin haber hecho nada.
 */
export const JOB_HANDLERS = new Map<string, QueueJobHandler>();

/** Punto de extensión para registrar consumidores reales de una cola. */
export function registerQueueJobHandler(
  jobType: string,
  handler: QueueJobHandler,
): void {
  JOB_HANDLERS.set(jobType, handler);
}

/**
 * Fase 1 (P0) · UC-35-06/07/08: reclama lotes de las colas configuradas en
 * `MESSAGING_QUEUE_CODES` (`message_queues` es catálogo de solo lectura para
 * los 13 casos de uso del módulo; no hay endpoint para listarlas activas, así
 * que el worker recibe qué colas drenar por configuración) y cierra cada job
 * con `complete`/`fail` según haya o no handler registrado.
 */
@Injectable()
export class QueueJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {
    this.logger.setContext(QueueJob.name);
  }

  @Interval(CLAIM_INTERVAL_MS)
  async tick(): Promise<void> {
    if (this.env.messagingQueueCodes.length === 0) return;

    for (const code of this.env.messagingQueueCodes) {
      await runTick(this.logger, 'worker.messaging.queue-claim', async () => {
        await this.drainQueue(code);
      });
    }
  }

  private async drainQueue(code: string): Promise<void> {
    const workerId = this.api.workerId(`queue-${code}`);
    const claimed = await this.api.post<ClaimJobsResponse>(
      `/internal/queues/${code}/claim`,
      { workerId, batchSize: DEFAULT_BATCH_SIZE },
    );
    if (claimed.claimed === 0) return;

    this.logger.info(
      {
        operation: 'worker.messaging.queue-claim',
        queueCode: code,
        claimed: claimed.claimed,
      },
      'Queue jobs claimed',
    );

    for (const job of claimed.jobs) {
      await this.settleJob(workerId, job);
    }
  }

  private async settleJob(workerId: string, job: ClaimedJob): Promise<void> {
    const handler = JOB_HANDLERS.get(job.jobType);
    if (!handler) {
      await this.api.post(`/internal/jobs/${job.id}/fail`, {
        workerId,
        errorText: `Sin handler registrado para el jobType "${job.jobType}"`,
      });
      return;
    }

    try {
      const resultJson = await handler(job);
      await this.api.post(`/internal/jobs/${job.id}/complete`, {
        workerId,
        resultJson,
      });
    } catch (error) {
      await this.api.post(`/internal/jobs/${job.id}/fail`, {
        workerId,
        errorText: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
