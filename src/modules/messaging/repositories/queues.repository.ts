import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MessageQueues, QueuedJobs, DeadLetterJobs } from '../entities';

/**
 * Describe el contrato estructural de create job data.
 */
export interface CreateJobData {
  /**
   * Identificador asociado a queue.
   */
  queueId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de job type mantenido por la instancia.
   */
  jobType: string;
  /**
   * Valor de dedupe key mantenido por la instancia.
   */
  dedupeKey: string;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority: number;
  /**
   * Valor de payload json mantenido por la instancia.
   */
  payloadJson: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de available at mantenido por la instancia.
   */
  availableAt: Date;
  /**
   * Valor de max attempts mantenido por la instancia.
   */
  maxAttempts: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a las colas de `messaging.*`: definición de colas, trabajos encolados
 * y cola de mensajes muertos.
 */
@Injectable()
export class QueuesRepository {
  // --- Colas (UC-35-05, 06) ---

  /**
   * Obtiene find queue by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find queue by code conforme al contrato `Promise<MessageQueues | null>`.
   */
  findQueueByCode(
    em: EntityManager,
    code: string,
  ): Promise<MessageQueues | null> {
    return em.findOne(MessageQueues, { code });
  }

  /**
   * Obtiene find queue by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find queue by id conforme al contrato `Promise<MessageQueues | null>`.
   */
  findQueueById(em: EntityManager, id: string): Promise<MessageQueues | null> {
    return em.findOne(MessageQueues, { id });
  }

  // --- Trabajos (UC-35-05 … 09) ---

  /**
   * Crea create job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create job conforme al contrato `QueuedJobs`.
   */
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

  /**
   * Obtiene find job by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find job by id conforme al contrato `Promise<QueuedJobs | null>`.
   */
  findJobById(em: EntityManager, id: string): Promise<QueuedJobs | null> {
    return em.findOne(QueuedJobs, { id });
  }

  /**
   * Obtiene find job for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find job for update conforme al contrato `Promise<QueuedJobs | null>`.
   */
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
      /**
       * Identificador asociado a queue.
       */
      queueId: string;
      /**
       * Identificador asociado a original job.
       */
      originalJobId: string;
      /**
       * Valor de failure reason text mantenido por la instancia.
       */
      failureReasonText?: string;
      /**
       * Valor de payload json mantenido por la instancia.
       */
      payloadJson: unknown;
      /**
       * Valor de attempts mantenido por la instancia.
       */
      attempts: number;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Obtiene find dead letter job by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dead letter job by id conforme al contrato `Promise<DeadLetterJobs | null>`.
   */
  findDeadLetterJobById(
    em: EntityManager,
    id: string,
  ): Promise<DeadLetterJobs | null> {
    return em.findOne(DeadLetterJobs, { id });
  }
}
