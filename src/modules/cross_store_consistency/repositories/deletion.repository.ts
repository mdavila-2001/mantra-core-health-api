import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DeletionRequests,
  DeletionTargets,
  DeletionExecutions,
  DeletionVerifications,
  CacheInvalidationJobs,
  DataMovementJobs,
  SchemaMigrationJobs,
  ArchiveJobs,
} from '../entities';

/**
 * Borrado cross-store (derecho al olvido y retención) y el mantenimiento que lo
 * acompaña: invalidación de caché, movimiento entre zonas y archivado.
 */
@Injectable()
export class DeletionRepository {
  // --- Solicitudes (UC-62-08, 09, 11) ---

  createRequest(
    em: EntityManager,
    data: {
      tenantId: string;
      subjectType: string;
      subjectId: string;
      reasonCode: string;
      legalBasisCode: string;
      requestedByUserId: string;
      state: string;
      dueAt: Date;
    },
  ): DeletionRequests {
    return em.create(
      DeletionRequests,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

  findRequestForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<DeletionRequests | null> {
    return em.findOne(
      DeletionRequests,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Solicitud viva para el mismo sujeto. Dos borrados en marcha del mismo paciente
   * darían dos expansiones que se pisan y una verificación que nunca cuadra.
   */
  findLiveRequestBySubject(
    em: EntityManager,
    tenantId: string,
    subjectType: string,
    subjectId: string,
    liveStates: string[],
  ): Promise<DeletionRequests | null> {
    return em.findOne(DeletionRequests, {
      tenantId,
      subjectType,
      subjectId,
      state: { $in: liveStates },
    });
  }

  // --- Objetivos (UC-62-09, 10, 11) ---

  /** Clave natural del objetivo: `(solicitud, dataset, backend, localizador)`. */
  findTarget(
    em: EntityManager,
    deletionRequestId: string,
    datasetId: string,
    backendCode: string,
    targetLocator: string,
  ): Promise<DeletionTargets | null> {
    return em.findOne(DeletionTargets, {
      deletionRequestId,
      datasetId,
      backendCode,
      targetLocator,
    });
  }

  createTarget(
    em: EntityManager,
    data: {
      deletionRequestId: string;
      datasetId: string;
      backendCode: string;
      targetLocator: string;
      deletionMode: string;
      blockedByLegalHold: boolean;
      state: string;
    },
  ): DeletionTargets {
    return em.create(DeletionTargets, data as never, { partial: true });
  }

  findTargetForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<DeletionTargets | null> {
    return em.findOne(
      DeletionTargets,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Todos los objetivos de la solicitud; el cierre los agrega. */
  findTargetsByRequest(
    em: EntityManager,
    deletionRequestId: string,
  ): Promise<DeletionTargets[]> {
    return em.find(DeletionTargets, { deletionRequestId });
  }

  // --- Ejecuciones (UC-62-10) ---

  /** Una ejecución efectiva por clave: reintentar no borra dos veces. */
  findExecutionByKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<DeletionExecutions | null> {
    return em.findOne(DeletionExecutions, { idempotencyKey });
  }

  countExecutions(
    em: EntityManager,
    deletionTargetId: string,
  ): Promise<number> {
    return em.count(DeletionExecutions, { deletionTargetId });
  }

  createExecution(
    em: EntityManager,
    data: {
      deletionTargetId: string;
      attemptNumber: number;
      idempotencyKey: string;
      status: string;
      providerReceipt?: string;
      errorCode?: string;
      startedAt: Date;
    },
  ): DeletionExecutions {
    return em.create(DeletionExecutions, data as never, { partial: true });
  }

  // --- Verificaciones (UC-62-11) ---

  /**
   * Append-only: la verificación es la prueba de ausencia, y poder editarla la
   * convertiría en una afirmación sin respaldo.
   */
  createVerification(
    em: EntityManager,
    data: {
      deletionTargetId: string;
      verificationMethod: string;
      verifiedAbsent: boolean;
      residualReferenceCount: number;
      evidenceObjectId?: string;
    },
  ): DeletionVerifications {
    return em.create(
      DeletionVerifications,
      { ...data, verifiedAt: new Date() } as never,
      { partial: true },
    );
  }

  // --- Invalidación de caché (UC-62-12, 13, 14) ---

  /**
   * Invalidación ya registrada para esa versión y ámbito. Sin esta comprobación,
   * cada reproyección del mismo evento encolaría otra purga idéntica.
   */
  findCacheJob(
    em: EntityManager,
    key: {
      tenantId: string;
      datasetId: string;
      entityId: string;
      entityVersion: string;
      cacheScope: string;
    },
  ): Promise<CacheInvalidationJobs | null> {
    return em.findOne(CacheInvalidationJobs, key);
  }

  createCacheJob(
    em: EntityManager,
    data: {
      tenantId: string;
      datasetId: string;
      entityId: string;
      entityVersion: string;
      cacheScope: string;
      status: string;
    },
  ): CacheInvalidationJobs {
    return em.create(
      CacheInvalidationJobs,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

  // --- Movimiento de datos (UC-62-13) ---

  /** Clave natural del lote: `(tenant, dataset, huella del manifiesto)`. */
  findMovementJob(
    em: EntityManager,
    tenantId: string,
    datasetId: string,
    manifestHash: string,
  ): Promise<DataMovementJobs | null> {
    return em.findOne(DataMovementJobs, { tenantId, datasetId, manifestHash });
  }

  createMovementJob(
    em: EntityManager,
    data: {
      tenantId: string;
      datasetId: string;
      sourcePlacementId: string;
      targetPlacementId: string;
      movementMode: string;
      manifestHash: string;
      status: string;
      startedAt: Date;
    },
  ): DataMovementJobs {
    return em.create(DataMovementJobs, data as never, { partial: true });
  }

  createSchemaMigrationJob(
    em: EntityManager,
    data: {
      datasetId: string;
      collectionDefinitionId?: string;
      fromSchemaVersion?: string;
      toSchemaVersion?: string;
      migrationStrategy: string;
      status: string;
      startedAt: Date;
    },
  ): SchemaMigrationJobs {
    return em.create(
      SchemaMigrationJobs,
      { ...data, migratedCount: '0', failedCount: '0' } as never,
      { partial: true },
    );
  }

  // --- Archivado (UC-62-14) ---

  /** Un archivo por corte de retención: reejecutar no vuelve a archivar. */
  findArchiveJob(
    em: EntityManager,
    tenantId: string,
    datasetId: string,
    retentionCutoff: Date,
  ): Promise<ArchiveJobs | null> {
    return em.findOne(ArchiveJobs, { tenantId, datasetId, retentionCutoff });
  }

  createArchiveJob(
    em: EntityManager,
    data: {
      tenantId: string;
      datasetId: string;
      retentionCutoff: Date;
      archiveManifestObjectId?: string;
      status: string;
      archivedCount: string;
      deletedHotCount: string;
      startedAt: Date;
    },
  ): ArchiveJobs {
    return em.create(ArchiveJobs, data as never, { partial: true });
  }
}
