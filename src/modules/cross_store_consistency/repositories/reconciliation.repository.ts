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

  createRun(
    em: EntityManager,
    data: {
      tenantId: string;
      datasetId: string;
      sourceBackendCode: string;
      targetBackendCode: string;
      reconciliationScopeJson?: unknown;
      status: string;
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

  createItem(
    em: EntityManager,
    data: {
      reconciliationRunId: string;
      canonicalEntityId: string;
      canonicalVersion?: string;
      targetDocumentId?: string;
      targetVersion?: string;
      canonicalHash?: string;
      targetHash?: string;
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
      tenantId: string;
      datasetId: string;
      canonicalEntityId: string;
      driftType: string;
    },
    openStatus: string,
  ): Promise<ProjectionDriftEvents | null> {
    return em.findOne(ProjectionDriftEvents, { ...key, status: openStatus });
  }

  createDrift(
    em: EntityManager,
    data: {
      tenantId: string;
      datasetId: string;
      canonicalEntityId: string;
      driftType: string;
      severity: string;
      canonicalVersion?: string;
      targetVersion?: string;
      reconciliationItemId: string;
      status: string;
    },
  ): ProjectionDriftEvents {
    return em.create(
      ProjectionDriftEvents,
      { ...data, detectedAt: new Date() } as never,
      { partial: true },
    );
  }

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

  createRepairJob(
    em: EntityManager,
    data: {
      tenantId: string;
      projectionDriftEventId: string;
      repairAction: string;
      idempotencyKey: string;
      status: string;
    },
  ): ProjectionRepairJobs {
    return em.create(
      ProjectionRepairJobs,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

  createReindexJob(
    em: EntityManager,
    data: {
      tenantId: string;
      datasetId: string;
      sourceAlias?: string;
      targetIndex?: string;
      targetSchemaVersion?: string;
      status: string;
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
