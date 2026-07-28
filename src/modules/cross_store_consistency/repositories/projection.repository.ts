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

  /**
   * Crea create definition.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create definition conforme al contrato `ProjectionDefinitions`.
   */
  createDefinition(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Identificador asociado a source dataset.
       */
      sourceDatasetId: string;
      /**
       * Identificador asociado a target dataset.
       */
      targetDatasetId: string;
      /**
       * Valor de projection version mantenido por la instancia.
       */
      projectionVersion: string;
      /**
       * Valor de delivery semantics mantenido por la instancia.
       */
      deliverySemantics: string;
      /**
       * Valor de transformation ref mantenido por la instancia.
       */
      transformationRef?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
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

  /**
   * Obtiene find definition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find definition by id conforme al contrato `Promise<ProjectionDefinitions | null>`.
   */
  findDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<ProjectionDefinitions | null> {
    return em.findOne(ProjectionDefinitions, { id });
  }

  /**
   * Crea create subscription.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create subscription conforme al contrato `ProjectionSubscriptions`.
   */
  createSubscription(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a projection definition.
       */
      projectionDefinitionId: string;
      /**
       * Valor de source event type mantenido por la instancia.
       */
      sourceEventType: string;
      /**
       * Valor de consumer code mantenido por la instancia.
       */
      consumerCode: string;
      /**
       * Valor de target backend code mantenido por la instancia.
       */
      targetBackendCode: string;
      /**
       * Valor de concurrency limit mantenido por la instancia.
       */
      concurrencyLimit: number;
      /**
       * Valor de retry policy json mantenido por la instancia.
       */
      retryPolicyJson?: unknown;
      /**
       * Valor de dead letter enabled mantenido por la instancia.
       */
      deadLetterEnabled: boolean;
      /**
       * Valor de state mantenido por la instancia.
       */
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

  /**
   * Obtiene find subscription by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find subscription by id conforme al contrato `Promise<ProjectionSubscriptions | null>`.
   */
  findSubscriptionById(
    em: EntityManager,
    id: string,
  ): Promise<ProjectionSubscriptions | null> {
    return em.findOne(ProjectionSubscriptions, { id });
  }

  // --- SLO de consistencia (UC-62-01, 05) ---

  /**
   * Obtiene find slo for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param datasetId - Identificador de dataset.
   * @param targetBackendCode - Valor de target backend code requerido por la operación.
   * @returns Resultado de find slo for update conforme al contrato `Promise<StoreConsistencySlos | null>`.
   */
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

  /**
   * Crea create slo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create slo conforme al contrato `StoreConsistencySlos`.
   */
  createSlo(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Valor de target backend code mantenido por la instancia.
       */
      targetBackendCode: string;
      /**
       * Valor de max projection lag seconds mantenido por la instancia.
       */
      maxProjectionLagSeconds: number;
      /**
       * Valor de max drift rate mantenido por la instancia.
       */
      maxDriftRate?: string;
      /**
       * Valor de reconciliation interval minutes mantenido por la instancia.
       */
      reconciliationIntervalMinutes: number;
      /**
       * Valor de alert policy code mantenido por la instancia.
       */
      alertPolicyCode?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): StoreConsistencySlos {
    return em.create(StoreConsistencySlos, data as never, { partial: true });
  }

  // --- Consumidores (UC-62-02) ---

  /**
   * Obtiene find consumer by code for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find consumer by code for update conforme al contrato `Promise<ProjectionConsumers | null>`.
   */
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

  /**
   * Crea create consumer.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create consumer conforme al contrato `ProjectionConsumers`.
   */
  createConsumer(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de service name mantenido por la instancia.
       */
      serviceName?: string;
      /**
       * Valor de deployment region mantenido por la instancia.
       */
      deploymentRegion?: string;
      /**
       * Valor de consumer group mantenido por la instancia.
       */
      consumerGroup?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
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

  /**
   * Crea create attempt.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create attempt conforme al contrato `ProjectionDeliveryAttempts`.
   */
  createAttempt(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a projection subscription.
       */
      projectionSubscriptionId: string;
      /**
       * Identificador asociado a outbox event.
       */
      outboxEventId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de attempt number mantenido por la instancia.
       */
      attemptNumber: number;
      /**
       * Valor de idempotency key mantenido por la instancia.
       */
      idempotencyKey: string;
      /**
       * Valor de payload hash mantenido por la instancia.
       */
      payloadHash: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
    },
  ): ProjectionDeliveryAttempts {
    return em.create(ProjectionDeliveryAttempts, data as never, {
      partial: true,
    });
  }

  /**
   * Obtiene find attempt for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find attempt for update conforme al contrato `Promise<ProjectionDeliveryAttempts | null>`.
   */
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

  /**
   * Crea create checkpoint.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create checkpoint conforme al contrato `ProjectionCheckpoints`.
   */
  createCheckpoint(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a projection subscription.
       */
      projectionSubscriptionId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de partition key mantenido por la instancia.
       */
      partitionKey: string;
      /**
       * Valor de source position mantenido por la instancia.
       */
      sourcePosition: string;
      /**
       * Identificador asociado a source event.
       */
      sourceEventId?: string;
      /**
       * Valor de target version mantenido por la instancia.
       */
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

  /**
   * Crea create dead letter.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dead letter conforme al contrato `ProjectionDeadLetters`.
   */
  createDeadLetter(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a projection delivery attempt.
       */
      projectionDeliveryAttemptId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de reason code mantenido por la instancia.
       */
      reasonCode: string;
      /**
       * Identificador asociado a payload object.
       */
      payloadObjectId?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): ProjectionDeadLetters {
    return em.create(
      ProjectionDeadLetters,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find dead letter for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dead letter for update conforme al contrato `Promise<ProjectionDeadLetters | null>`.
   */
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
