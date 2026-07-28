import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  // El generador prefijó esta clase para no chocar con la homónima de otro
  // esquema; se importa con alias para que el repositorio se lea como el resto.
  CrossStoreConsistencyReconciliationRuns as ReconciliationRuns,
  ReconciliationItems,
  ProjectionDriftEvents,
  ProjectionRepairJobs,
  ReindexJobs,
} from '../entities';

/**
 * Reconciliación del canónico contra sus proyecciones, y la reparación de lo que
 * no cuadra.
 *
 * **PostgreSQL es la única fuente de verdad.** Todo lo de aquí compara contra él y
 * repara hacia los stores secundarios, nunca al revés.
 */
@Injectable()
export class ReconciliationRepository {
  // --- Corridas e ítems (UC-62-05) ---

  /**
   * Crea create run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create run conforme al contrato `ReconciliationRuns`.
   */
  createRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Valor de source backend code mantenido por la instancia.
       */
      sourceBackendCode: string;
      /**
       * Valor de target backend code mantenido por la instancia.
       */
      targetBackendCode: string;
      /**
       * Valor de reconciliation scope json mantenido por la instancia.
       */
      reconciliationScopeJson?: unknown;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
    },
  ): ReconciliationRuns {
    return em.create(ReconciliationRuns, data as never, { partial: true });
  }

  /**
   * Una entidad canónica aparece una sola vez por corrida. Comparar dos veces la
   * misma daría dos resultados y no habría forma de decir cuál vale.
   */
  findItem(
    em: EntityManager,
    reconciliationRunId: string,
    canonicalEntityId: string,
  ): Promise<ReconciliationItems | null> {
    return em.findOne(ReconciliationItems, {
      reconciliationRunId,
      canonicalEntityId,
    });
  }

  /**
   * Crea create item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create item conforme al contrato `ReconciliationItems`.
   */
  createItem(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a reconciliation run.
       */
      reconciliationRunId: string;
      /**
       * Identificador asociado a canonical entity.
       */
      canonicalEntityId: string;
      /**
       * Valor de canonical version mantenido por la instancia.
       */
      canonicalVersion?: string;
      /**
       * Identificador asociado a target document.
       */
      targetDocumentId?: string;
      /**
       * Valor de target version mantenido por la instancia.
       */
      targetVersion?: string;
      /**
       * Valor de canonical hash mantenido por la instancia.
       */
      canonicalHash?: string;
      /**
       * Valor de target hash mantenido por la instancia.
       */
      targetHash?: string;
      /**
       * Valor de result mantenido por la instancia.
       */
      result: string;
    },
  ): ReconciliationItems {
    return em.create(
      ReconciliationItems,
      { ...data, detectedAt: new Date() } as never,
      { partial: true },
    );
  }

  // --- Derivas (UC-62-06, 07) ---

  /**
   * Deriva viva del mismo tipo sobre la misma entidad. Es la deduplicación que
   * impide que una reconciliación horaria abra veinticuatro incidentes idénticos
   * al día del mismo problema.
   */
  findOpenDrift(
    em: EntityManager,
    key: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Identificador asociado a canonical entity.
       */
      canonicalEntityId: string;
      /**
       * Valor de drift type mantenido por la instancia.
       */
      driftType: string;
    },
    openStatus: string,
  ): Promise<ProjectionDriftEvents | null> {
    return em.findOne(ProjectionDriftEvents, { ...key, status: openStatus });
  }

  /**
   * Crea create drift.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create drift conforme al contrato `ProjectionDriftEvents`.
   */
  createDrift(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Identificador asociado a canonical entity.
       */
      canonicalEntityId: string;
      /**
       * Valor de drift type mantenido por la instancia.
       */
      driftType: string;
      /**
       * Valor de severity mantenido por la instancia.
       */
      severity: string;
      /**
       * Valor de canonical version mantenido por la instancia.
       */
      canonicalVersion?: string;
      /**
       * Valor de target version mantenido por la instancia.
       */
      targetVersion?: string;
      /**
       * Identificador asociado a reconciliation item.
       */
      reconciliationItemId: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
    },
  ): ProjectionDriftEvents {
    return em.create(
      ProjectionDriftEvents,
      { ...data, detectedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find drift for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find drift for update conforme al contrato `Promise<ProjectionDriftEvents | null>`.
   */
  findDriftForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ProjectionDriftEvents | null> {
    return em.findOne(
      ProjectionDriftEvents,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Reparación (UC-62-07) ---

  /** Una reparación por clave de idempotencia: reintentar no repara dos veces. */
  findRepairJobByKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<ProjectionRepairJobs | null> {
    return em.findOne(ProjectionRepairJobs, { idempotencyKey });
  }

  /**
   * Crea create repair job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create repair job conforme al contrato `ProjectionRepairJobs`.
   */
  createRepairJob(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a projection drift event.
       */
      projectionDriftEventId: string;
      /**
       * Valor de repair action mantenido por la instancia.
       */
      repairAction: string;
      /**
       * Valor de idempotency key mantenido por la instancia.
       */
      idempotencyKey: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
    },
  ): ProjectionRepairJobs {
    return em.create(
      ProjectionRepairJobs,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Crea create reindex job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reindex job conforme al contrato `ReindexJobs`.
   */
  createReindexJob(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Valor de source alias mantenido por la instancia.
       */
      sourceAlias?: string;
      /**
       * Valor de target index mantenido por la instancia.
       */
      targetIndex?: string;
      /**
       * Valor de target schema version mantenido por la instancia.
       */
      targetSchemaVersion?: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
    },
  ): ReindexJobs {
    return em.create(
      ReindexJobs,
      { ...data, processedCount: '0', failedCount: '0' } as never,
      { partial: true },
    );
  }
}
