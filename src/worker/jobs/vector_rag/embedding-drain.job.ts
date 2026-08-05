import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const DRAIN_INTERVAL_MS = 30_000;
const JOB_LIMIT = 20;

/** Refleja `QueuedEmbeddingJobSummaryDto`. */
export interface QueuedEmbeddingJobSummary {
  id: string;
  vectorCollectionId: string;
  jobType: string;
}

/** Refleja `PendingEmbeddingJobsResponseDto`. */
interface PendingEmbeddingJobsResponse {
  jobs: QueuedEmbeddingJobSummary[];
}

/** Lo que decide el adapter tras intentar calcular embeddings para el job. */
export interface EmbeddingProviderOutcome {
  succeeded: boolean;
  /** Documentos ya troceados/embebidos, forma de `EmbeddedDocumentDto[]`. */
  documents?: unknown[];
  finalBatch?: boolean;
  errorCode?: string;
}

/**
 * Punto de extensión: quien de verdad calcula los embeddings (OpenAI, un
 * modelo propio, lo que sea). `EmbeddingPipelineService` lo deja explícito:
 * "este servicio no calcula embeddings, los recibe ya calculados del worker".
 * Ningún proveedor concreto vive todavía en este repo, así que el adapter por
 * defecto **falla en vez de fingir un vector** — el job queda `failed`,
 * visible y accionable, no un embedding inventado (mismo criterio que
 * `NotificationProviderAdapter` en `jobs/messaging/notification-delivery.job.ts`).
 */
export type EmbeddingProviderAdapter = (
  job: QueuedEmbeddingJobSummary,
) => Promise<EmbeddingProviderOutcome>;

export const defaultEmbeddingProviderAdapter: EmbeddingProviderAdapter =
  async () => ({
    succeeded: false,
    errorCode: 'PROVIDER_NOT_CONFIGURED',
  });

/** Refleja `RunEmbeddingJobResponseDto`. */
interface RunEmbeddingJobResponse {
  jobId: string;
  status: string;
}

/**
 * UC-59-05 (descubrimiento del worker): drena la cola de jobs de embedding.
 * El README del módulo lo deja explícito como pendiente de worker; ningún
 * proveedor de embeddings vive en este repo, así que hasta que se conecte
 * uno real, cada job descubierto se declara `failed` de forma limpia y
 * visible, en vez de reintentarlo en bucle contra un proveedor inexistente.
 */
@Injectable()
export class EmbeddingDrainJob {
  /** Mutable a propósito: permite inyectar un adapter real sin tocar el DI. */
  providerAdapter: EmbeddingProviderAdapter = defaultEmbeddingProviderAdapter;

  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmbeddingDrainJob.name);
  }

  @Interval(DRAIN_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.vector_rag.embedding-drain',
      async () => {
        const pending = await this.api.get<PendingEmbeddingJobsResponse>(
          '/vector-rag/embedding-jobs/pending',
          { limit: JOB_LIMIT },
        );

        for (const job of pending.jobs) {
          await runTick(this.logger, 'worker.vector_rag.embedding-drain', () =>
            this.runOne(job),
          );
        }
      },
    );
  }

  private async runOne(job: QueuedEmbeddingJobSummary): Promise<void> {
    const outcome = await this.providerAdapter(job);

    const response = await this.api.post<RunEmbeddingJobResponse>(
      `/vector-rag/embedding-jobs/${job.id}/run`,
      outcome.succeeded
        ? { documents: outcome.documents, finalBatch: outcome.finalBatch }
        : { failed: true, errorCode: outcome.errorCode },
    );

    if (!outcome.succeeded) {
      this.logger.warn(
        {
          operation: 'worker.vector_rag.embedding-drain',
          jobId: job.id,
          errorCode: outcome.errorCode,
        },
        'Embedding job could not run (no provider configured)',
      );
    } else {
      this.logger.info(
        {
          operation: 'worker.vector_rag.embedding-drain',
          jobId: job.id,
          status: response.status,
        },
        'Embedding job batch processed',
      );
    }
  }
}
