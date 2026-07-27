import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ProjectionDefinitions,
  ProjectionSubscriptions,
  ProjectionConsumers,
  ProjectionDeliveryAttempts,
  ProjectionCheckpoints,
  ProjectionDeadLetters,
  StoreConsistencySlos,
} from '../entities';

/**
 * Proyección de eventos a los stores secundarios: qué se proyecta, quién lo
 * consume, qué intentos hubo, hasta dónde se ha leído y qué acabó en la cola
 * muerta.
 */
@Injectable()
export class ProjectionRepository {
  // --- Definiciones y suscripciones (UC-62-01) ---

  createDefinition(
    em: EntityManager,
    data: {
      code: string;
      sourceDatasetId: string;
      targetDatasetId: string;
      projectionVersion: string;
      deliverySemantics: string;
      transformationRef?: string;
      state: string;
    },
  ): ProjectionDefinitions {
    return em.create(
      ProjectionDefinitions,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

  /** Clave natural de la definición: `(código, versión)`. */
  findDefinitionByVersion(
    em: EntityManager,
    code: string,
    projectionVersion: string,
  ): Promise<ProjectionDefinitions | null> {
    return em.findOne(ProjectionDefinitions, { code, projectionVersion });
  }

  findDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<ProjectionDefinitions | null> {
    return em.findOne(ProjectionDefinitions, { id });
  }

  createSubscription(
    em: EntityManager,
    data: {
      projectionDefinitionId: string;
      sourceEventType: string;
      consumerCode: string;
      targetBackendCode: string;
      concurrencyLimit: number;
      retryPolicyJson?: unknown;
      deadLetterEnabled: boolean;
      state: string;
    },
  ): ProjectionSubscriptions {
    return em.create(ProjectionSubscriptions, data as never, { partial: true });
  }

  /** Clave natural: `(definición, tipo de evento, consumidor)`. */
  findSubscription(
    em: EntityManager,
    projectionDefinitionId: string,
    sourceEventType: string,
    consumerCode: string,
  ): Promise<ProjectionSubscriptions | null> {
    return em.findOne(ProjectionSubscriptions, {
      projectionDefinitionId,
      sourceEventType,
      consumerCode,
    });
  }

  findSubscriptionById(
    em: EntityManager,
    id: string,
  ): Promise<ProjectionSubscriptions | null> {
    return em.findOne(ProjectionSubscriptions, { id });
  }

  // --- SLO de consistencia (UC-62-01, 05) ---

  findSloForUpdate(
    em: EntityManager,
    datasetId: string,
    targetBackendCode: string,
  ): Promise<StoreConsistencySlos | null> {
    return em.findOne(
      StoreConsistencySlos,
      { datasetId, targetBackendCode },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createSlo(
    em: EntityManager,
    data: {
      datasetId: string;
      targetBackendCode: string;
      maxProjectionLagSeconds: number;
      maxDriftRate?: string;
      reconciliationIntervalMinutes: number;
      alertPolicyCode?: string;
      state: string;
    },
  ): StoreConsistencySlos {
    return em.create(StoreConsistencySlos, data as never, { partial: true });
  }

  // --- Consumidores (UC-62-02) ---

  findConsumerByCodeForUpdate(
    em: EntityManager,
    code: string,
  ): Promise<ProjectionConsumers | null> {
    return em.findOne(
      ProjectionConsumers,
      { code },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createConsumer(
    em: EntityManager,
    data: {
      code: string;
      serviceName?: string;
      deploymentRegion?: string;
      consumerGroup?: string;
      state: string;
    },
  ): ProjectionConsumers {
    return em.create(
      ProjectionConsumers,
      { ...data, heartbeatAt: new Date() } as never,
      { partial: true },
    );
  }

  // --- Intentos de entrega (UC-62-02, 03, 04) ---

  /**
   * Intento previo con la misma clave de idempotencia. Es la garantía dura de que
   * un evento entregado dos veces —lo normal en *at-least-once*— sólo se aplica
   * una.
   */
  findAttemptByIdempotencyKey(
    em: EntityManager,
    projectionSubscriptionId: string,
    idempotencyKey: string,
  ): Promise<ProjectionDeliveryAttempts | null> {
    return em.findOne(ProjectionDeliveryAttempts, {
      projectionSubscriptionId,
      idempotencyKey,
    });
  }

  /** Cuántos intentos lleva el evento; el siguiente número sale de aquí. */
  countAttempts(
    em: EntityManager,
    projectionSubscriptionId: string,
    outboxEventId: string,
  ): Promise<number> {
    return em.count(ProjectionDeliveryAttempts, {
      projectionSubscriptionId,
      outboxEventId,
    });
  }

  createAttempt(
    em: EntityManager,
    data: {
      projectionSubscriptionId: string;
      outboxEventId: string;
      tenantId?: string;
      attemptNumber: number;
      idempotencyKey: string;
      payloadHash: string;
      status: string;
      startedAt: Date;
    },
  ): ProjectionDeliveryAttempts {
    return em.create(ProjectionDeliveryAttempts, data as never, {
      partial: true,
    });
  }

  findAttemptForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ProjectionDeliveryAttempts | null> {
    return em.findOne(
      ProjectionDeliveryAttempts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Checkpoints (UC-62-03) ---

  /**
   * Un checkpoint por `(suscripción, tenant, partición)`. Bloquear al leerlo es lo
   * que impide que dos consumidores de la misma partición lo avancen a la vez y
   * uno pise al otro.
   */
  findCheckpointForUpdate(
    em: EntityManager,
    projectionSubscriptionId: string,
    tenantId: string,
    partitionKey: string,
  ): Promise<ProjectionCheckpoints | null> {
    return em.findOne(
      ProjectionCheckpoints,
      { projectionSubscriptionId, tenantId, partitionKey },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createCheckpoint(
    em: EntityManager,
    data: {
      projectionSubscriptionId: string;
      tenantId: string;
      partitionKey: string;
      sourcePosition: string;
      sourceEventId?: string;
      targetVersion?: string;
    },
  ): ProjectionCheckpoints {
    return em.create(
      ProjectionCheckpoints,
      { ...data, checkpointedAt: new Date() } as never,
      { partial: true },
    );
  }

  // --- Cola muerta (UC-62-04) ---

  /** Un dead-letter por intento: el mismo fallo no se registra dos veces. */
  findDeadLetterByAttempt(
    em: EntityManager,
    projectionDeliveryAttemptId: string,
  ): Promise<ProjectionDeadLetters | null> {
    return em.findOne(ProjectionDeadLetters, { projectionDeliveryAttemptId });
  }

  createDeadLetter(
    em: EntityManager,
    data: {
      projectionDeliveryAttemptId: string;
      tenantId?: string;
      reasonCode: string;
      payloadObjectId?: string;
      state: string;
    },
  ): ProjectionDeadLetters {
    return em.create(
      ProjectionDeadLetters,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

  findDeadLetterForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ProjectionDeadLetters | null> {
    return em.findOne(
      ProjectionDeadLetters,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
