import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { QueuesRepository } from '../repositories';
import { OutboxService } from './outbox.service';
import {
  EnqueueJobDto,
  JobResponseDto,
  ClaimJobsDto,
  ClaimJobsResponseDto,
  ClaimedJobDto,
  CompleteJobDto,
  FailJobDto,
  FailJobResponseDto,
  RedriveDeadLetterDto,
  RedriveResponseDto,
} from '../dto';

const DEFAULT_PRIORITY = 5;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_VISIBILITY_SECONDS = 60;
const DEFAULT_CLAIM_BATCH = 10;

/**
 * Colas de trabajo: encolado con deduplicación, reclamo con `SKIP LOCKED`,
 * cierre, reintento con backoff y cola de mensajes muertos
 * (UC-35-05 … 09).
 *
 * La entrega es **al menos una vez**: el handler tiene que ser idempotente por
 * su clave de deduplicación. Garantizar "exactamente una vez" exigiría una
 * transacción distribuida con el destino, que es justo lo que este diseño evita.
 */
@Injectable()
export class QueuesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param queuesRepo - Valor de queues repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly queuesRepo: QueuesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QueuesService.name);
  }

  /**
   * UC-35-05: encolar un trabajo. La clave de deduplicación colapsa los
   * encolados repetidos: un productor que reintenta no multiplica el trabajo.
   */
  async enqueueJob(
    queueCode: string,
    dto: EnqueueJobDto,
    actor: AuthenticatedUser,
  ): Promise<JobResponseDto> {
    return this.em.transactional(async (tx) => {
      const queue = await this.queuesRepo.findQueueByCode(tx, queueCode);
      if (!queue) {
        throw new ResourceNotFoundException('Cola no encontrada', {
          queueCode,
        });
      }
      if (queue.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La cola no está activa', {
          queueCode,
        });
      }

      const existing = await this.queuesRepo.findJobByDedupeKey(
        tx,
        dto.dedupeKey,
      );
      if (existing) {
        return {
          id: existing.id,
          statusConceptId: existing.statusConceptId,
          duplicate: true,
        };
      }

      const job = this.queuesRepo.createJob(tx, {
        queueId: queue.id,
        tenantId: dto.tenantId,
        jobType: dto.jobType,
        dedupeKey: dto.dedupeKey,
        priority: dto.priority ?? queue.defaultPriority ?? DEFAULT_PRIORITY,
        payloadJson: dto.payloadJson,
        statusConceptId: CONCEPTS.JOB_READY,
        availableAt: dto.availableAt ? new Date(dto.availableAt) : new Date(),
        maxAttempts:
          dto.maxAttempts ?? queue.defaultMaxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        actorUserId: actor.id,
      });

      return {
        id: job.id,
        statusConceptId: CONCEPTS.JOB_READY,
        duplicate: false,
      };
    });
  }

  /**
   * UC-35-06: reclamar un lote de trabajos listos.
   *
   * `SKIP LOCKED` reparte la carga entre workers sin que ninguno espere al otro,
   * y el `visibility_timeout` de la cola es lo que devuelve a la rueda los
   * trabajos de un worker que se cayó a media faena.
   */
  async claimJobs(
    queueCode: string,
    dto: ClaimJobsDto,
  ): Promise<ClaimJobsResponseDto> {
    return this.em.transactional(async (tx) => {
      const queue = await this.queuesRepo.findQueueByCode(tx, queueCode);
      if (!queue) {
        throw new ResourceNotFoundException('Cola no encontrada', {
          queueCode,
        });
      }
      if (queue.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La cola no está activa', {
          queueCode,
        });
      }

      const now = new Date();
      const visibility = queue.visibilityTimeoutS ?? DEFAULT_VISIBILITY_SECONDS;
      const claimed = await this.queuesRepo.claimReadyJobs(
        tx,
        queue.id,
        CONCEPTS.JOB_READY,
        now,
        dto.batchSize ?? DEFAULT_CLAIM_BATCH,
      );

      const lockExpiresAt = new Date(now.getTime() + visibility * 1000);
      const jobs: ClaimedJobDto[] = claimed.map((job) => {
        const attempts = (job.attempts ?? 0) + 1;
        job.statusConceptId = CONCEPTS.JOB_RUNNING;
        job.lockedBy = dto.workerId;
        job.lockExpiresAt = lockExpiresAt;
        job.startedAt = now;
        job.attempts = attempts;

        return {
          id: job.id,
          jobType: job.jobType,
          payloadJson: job.payloadJson,
          attempts,
          lockExpiresAt: lockExpiresAt.toISOString(),
        };
      });

      this.logger.info(
        {
          operation: 'messaging.queue.claim',
          queueCode,
          workerId: dto.workerId,
          claimed: jobs.length,
        },
        'Queue jobs claimed',
      );

      return { queueId: queue.id, jobs, claimed: jobs.length };
    });
  }

  /**
   * UC-35-07: cerrar el trabajo con éxito.
   *
   * Sólo puede cerrarlo el worker que lo tiene reservado: si el lock expiró y
   * otro lo tomó, el primero llega tarde y no debe pisar el trabajo ajeno.
   */
  async completeJob(
    jobId: string,
    dto: CompleteJobDto,
  ): Promise<JobResponseDto> {
    return this.em.transactional(async (tx) => {
      const job = await this.queuesRepo.findJobForUpdate(tx, jobId);
      if (!job) {
        throw new ResourceNotFoundException('Trabajo no encontrado', { jobId });
      }
      if (job.statusConceptId !== CONCEPTS.JOB_RUNNING) {
        throw new PreconditionFailedException(
          'El trabajo no está en ejecución',
          { jobId },
        );
      }
      if (job.lockedBy !== dto.workerId) {
        throw new PreconditionFailedException(
          'El trabajo está reservado por otro worker',
          {
            jobId,
            lockedBy: job.lockedBy,
          },
        );
      }

      job.statusConceptId = CONCEPTS.JOB_SUCCEEDED;
      job.completedAt = new Date();
      job.resultJson = dto.resultJson;
      job.lockedBy = undefined;
      job.lockExpiresAt = undefined;

      return {
        id: jobId,
        statusConceptId: CONCEPTS.JOB_SUCCEEDED,
        duplicate: false,
      };
    });
  }

  /**
   * UC-35-08: registrar el fallo. Si le quedan intentos vuelve a la cola con
   * backoff exponencial; si los agotó pasa a cola muerta, que conserva la
   * evidencia para poder reencolarlo cuando se arregle la causa.
   */
  async failJob(jobId: string, dto: FailJobDto): Promise<FailJobResponseDto> {
    return this.em.transactional(async (tx) => {
      const job = await this.queuesRepo.findJobForUpdate(tx, jobId);
      if (!job) {
        throw new ResourceNotFoundException('Trabajo no encontrado', { jobId });
      }
      if (job.statusConceptId !== CONCEPTS.JOB_RUNNING) {
        throw new PreconditionFailedException(
          'El trabajo no está en ejecución',
          { jobId },
        );
      }
      if (job.lockedBy !== dto.workerId) {
        throw new PreconditionFailedException(
          'El trabajo está reservado por otro worker',
          {
            jobId,
            lockedBy: job.lockedBy,
          },
        );
      }

      const attempts = job.attempts ?? 1;
      const maxAttempts = job.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
      job.lastErrorText = dto.errorText;
      job.lockedBy = undefined;
      job.lockExpiresAt = undefined;

      if (attempts < maxAttempts) {
        const availableAt = new Date(
          Date.now() + OutboxService.backoffSeconds(attempts) * 1000,
        );
        job.statusConceptId = CONCEPTS.JOB_READY;
        job.availableAt = availableAt;

        return {
          id: jobId,
          statusConceptId: CONCEPTS.JOB_READY,
          attempts,
          availableAt: availableAt.toISOString(),
        };
      }

      job.statusConceptId = CONCEPTS.JOB_DEAD_LETTER;
      const dead = this.queuesRepo.createDeadLetterJob(tx, {
        // El destino lo define la cola: si declara una cola muerta propia, ahí
        // va; si no, la evidencia se guarda contra la cola de origen.
        queueId: await this.deadLetterQueueId(tx, job.queueId),
        originalJobId: jobId,
        failureReasonText: dto.errorText,
        payloadJson: job.payloadJson,
        attempts,
      });

      this.logger.warn(
        {
          operation: 'messaging.job.fail',
          jobId,
          attempts,
          deadLetterJobId: dead.id,
        },
        'Job exhausted its attempts and moved to the dead letter queue',
      );

      return {
        id: jobId,
        statusConceptId: CONCEPTS.JOB_DEAD_LETTER,
        attempts,
        deadLetterJobId: dead.id,
      };
    });
  }

  /**
   * UC-35-09: reencolar un trabajo desde la cola muerta.
   *
   * La entrada de cola muerta **no se borra**: es la evidencia de que aquello
   * falló, y sigue siendo cierto aunque ahora el reintento funcione.
   */
  async redriveDeadLetter(
    deadLetterJobId: string,
    dto: RedriveDeadLetterDto,
    actor: AuthenticatedUser,
  ): Promise<RedriveResponseDto> {
    return this.em.transactional(async (tx) => {
      const dead = await this.queuesRepo.findDeadLetterJobById(
        tx,
        deadLetterJobId,
      );
      if (!dead) {
        throw new ResourceNotFoundException(
          'Entrada de cola muerta no encontrada',
          {
            deadLetterJobId,
          },
        );
      }

      const original = await this.queuesRepo.findJobById(
        tx,
        dead.originalJobId,
      );
      const queue = await this.queuesRepo.findQueueById(
        tx,
        original?.queueId ?? dead.queueId,
      );
      if (!queue) {
        throw new ResourceNotFoundException('Cola de destino no encontrada', {
          deadLetterJobId,
        });
      }
      if (queue.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La cola de destino no está activa',
          {
            queueCode: queue.code,
          },
        );
      }

      // Idempotente por entrada de cola muerta: reencolar dos veces la misma
      // devolvería a la cola el mismo trabajo repetido.
      const dedupeKey = dto.dedupeKey ?? `redrive:${deadLetterJobId}`;
      const already = await this.queuesRepo.findJobByDedupeKey(tx, dedupeKey);
      if (already) {
        return {
          jobId: already.id,
          deadLetterJobId,
          statusConceptId: already.statusConceptId,
          duplicate: true,
        };
      }

      const job = this.queuesRepo.createJob(tx, {
        queueId: queue.id,
        tenantId: original?.tenantId,
        jobType: original?.jobType ?? 'redrive',
        dedupeKey,
        priority:
          original?.priority ?? queue.defaultPriority ?? DEFAULT_PRIORITY,
        payloadJson: dead.payloadJson,
        statusConceptId: CONCEPTS.JOB_READY,
        availableAt: new Date(),
        maxAttempts: queue.defaultMaxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'messaging.dlq.redrive',
          deadLetterJobId,
          jobId: job.id,
          reason: dto.reason,
          actorUserId: actor.id,
        },
        'Dead letter job redriven',
      );

      return {
        jobId: job.id,
        deadLetterJobId,
        statusConceptId: CONCEPTS.JOB_READY,
        duplicate: false,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Ejecuta la operación dead letter queue id.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param queueId - Identificador de queue.
   * @returns Resultado de dead letter queue id conforme al contrato `Promise<string>`.
   */
  private async deadLetterQueueId(
    tx: EntityManager,
    queueId: string,
  ): Promise<string> {
    const queue = await this.queuesRepo.findQueueById(tx, queueId);
    return queue?.deadLetterQueueId ?? queueId;
  }
}
