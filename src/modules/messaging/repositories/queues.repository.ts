import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MessageQueues, QueuedJobs, DeadLetterJobs } from '../entities';

export interface CreateJobData {
  queueId: string;
  tenantId?: string;
  jobType: string;
  dedupeKey: string;
  priority: number;
  payloadJson: unknown;
  statusConceptId: string;
  availableAt: Date;
  maxAttempts: number;
  actorUserId?: string;
}

/**
 * Acceso a las colas de `messaging.*`: definición de colas, trabajos encolados
 * y cola de mensajes muertos.
 */
@Injectable()
export class QueuesRepository {
  // --- Colas (UC-35-05, 06) ---

  findQueueByCode(
    em: EntityManager,
    code: string,
  ): Promise<MessageQueues | null> {
    return em.findOne(MessageQueues, { code });
  }

  findQueueById(em: EntityManager, id: string): Promise<MessageQueues | null> {
    return em.findOne(MessageQueues, { id });
  }

  // --- Trabajos (UC-35-05 … 09) ---

  createJob(em: EntityManager, data: CreateJobData): QueuedJobs {
    return em.create(
      QueuedJobs,
      {
        queueId: data.queueId,
        tenantId: data.tenantId,
        jobType: data.jobType,
        dedupeKey: data.dedupeKey,
        priority: data.priority,
        payloadJson: data.payloadJson,
        statusConceptId: data.statusConceptId,
        availableAt: data.availableAt,
        attempts: 0,
        maxAttempts: data.maxAttempts,
      },
      { partial: true },
    );
  }

  /** La clave de deduplicación colapsa los encolados repetidos del productor. */
  findJobByDedupeKey(
    em: EntityManager,
    dedupeKey: string,
  ): Promise<QueuedJobs | null> {
    return em.findOne(QueuedJobs, { dedupeKey });
  }

  findJobById(em: EntityManager, id: string): Promise<QueuedJobs | null> {
    return em.findOne(QueuedJobs, { id });
  }

  findJobForUpdate(em: EntityManager, id: string): Promise<QueuedJobs | null> {
    return em.findOne(
      QueuedJobs,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Lote reclamable de la cola: listos, disponibles y sin lock vivo, por
   * prioridad y antigüedad.
   *
   * `SKIP LOCKED` reparte la carga entre varios workers sin que ninguno espere
   * al otro, y `lock_expires_at` es lo que recupera los trabajos de un worker
   * que se cayó a media faena.
   */
  claimReadyJobs(
    em: EntityManager,
    queueId: string,
    readyStatusConceptId: string,
    now: Date,
    limit: number,
  ): Promise<QueuedJobs[]> {
    return em.find(
      QueuedJobs,
      {
        queueId,
        statusConceptId: readyStatusConceptId,
        availableAt: { $lte: now },
        $or: [{ lockExpiresAt: null }, { lockExpiresAt: { $lte: now } }],
      },
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        orderBy: { priority: 'ASC', availableAt: 'ASC' },
        limit,
      },
    );
  }

  // --- Cola de mensajes muertos (UC-35-08, 09) ---

  /** Log append-only: la evidencia del fallo se conserva aunque se reencole. */
  createDeadLetterJob(
    em: EntityManager,
    data: {
      queueId: string;
      originalJobId: string;
      failureReasonText?: string;
      payloadJson: unknown;
      attempts: number;
      recordedByUserId?: string;
    },
  ): DeadLetterJobs {
    return em.create(
      DeadLetterJobs,
      {
        queueId: data.queueId,
        originalJobId: data.originalJobId,
        failureReasonText: data.failureReasonText,
        payloadJson: data.payloadJson,
        attempts: data.attempts,
        failedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  findDeadLetterJobById(
    em: EntityManager,
    id: string,
  ): Promise<DeadLetterJobs | null> {
    return em.findOne(DeadLetterJobs, { id });
  }
}
