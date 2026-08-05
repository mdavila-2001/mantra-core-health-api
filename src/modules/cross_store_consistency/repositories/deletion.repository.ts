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

  /**
   * Crea create request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create request conforme al contrato `DeletionRequests`.
   */
  createRequest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de subject type mantenido por la instancia.
       */
      subjectType: string;
      /**
       * Identificador asociado a subject.
       */
      subjectId: string;
      /**
       * Valor de reason code mantenido por la instancia.
       */
      reasonCode: string;
      /**
       * Valor de legal basis code mantenido por la instancia.
       */
      legalBasisCode: string;
      /**
       * Identificador asociado a requested by user.
       */
      requestedByUserId: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
      /**
       * Valor de due at mantenido por la instancia.
       */
      dueAt: Date;
    },
  ): DeletionRequests {
    return em.create(
      DeletionRequests,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find request for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find request for update conforme al contrato `Promise<DeletionRequests | null>`.
   */
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

  /**
   * Crea create target.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create target conforme al contrato `DeletionTargets`.
   */
  createTarget(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a deletion request.
       */
      deletionRequestId: string;
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Valor de backend code mantenido por la instancia.
       */
      backendCode: string;
      /**
       * Valor de target locator mantenido por la instancia.
       */
      targetLocator: string;
      /**
       * Valor de deletion mode mantenido por la instancia.
       */
      deletionMode: string;
      /**
       * Valor de blocked by legal hold mantenido por la instancia.
       */
      blockedByLegalHold: boolean;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): DeletionTargets {
    return em.create(DeletionTargets, data as never, { partial: true });
  }

  /**
   * Obtiene find target for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find target for update conforme al contrato `Promise<DeletionTargets | null>`.
   */
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

  /**
   * Objetivos `PENDING` sin bloqueo de retención legal, listos para que el
   * worker intente `executeDeletion`. El README lo sitúa así ("Concurrencia"):
   * "el barrido de objetivos pendientes... lo hace el worker antes de
   * llamar" — este módulo no bloquea aquí porque la exclusión real ocurre al
   * tomar el objetivo con `findTargetForUpdate` dentro de la propia ejecución
   * (dos workers descubriendo el mismo lote sólo compiten por el lock de fila,
   * no corrompen nada).
   */
  findPendingTargets(
    em: EntityManager,
    limit: number,
  ): Promise<DeletionTargets[]> {
    return em.find(
      DeletionTargets,
      { state: 'PENDING', blockedByLegalHold: false },
      { orderBy: { id: 'ASC' }, limit },
    );
  }

  /**
   * Objetivos `EXECUTED` listos para que el worker intente `verifyDeletion`.
   * Misma lógica de descubrimiento sin bloqueo que `findPendingTargets`.
   */
  findExecutedTargets(
    em: EntityManager,
    limit: number,
  ): Promise<DeletionTargets[]> {
    return em.find(
      DeletionTargets,
      { state: 'EXECUTED' },
      { orderBy: { id: 'ASC' }, limit },
    );
  }

  // --- Ejecuciones (UC-62-10) ---

  /** Una ejecución efectiva por clave: reintentar no borra dos veces. */
  findExecutionByKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<DeletionExecutions | null> {
    return em.findOne(DeletionExecutions, { idempotencyKey });
  }

  /**
   * Ejecuta la operación count executions.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param deletionTargetId - Identificador de deletion target.
   * @returns Resultado de count executions conforme al contrato `Promise<number>`.
   */
  countExecutions(
    em: EntityManager,
    deletionTargetId: string,
  ): Promise<number> {
    return em.count(DeletionExecutions, { deletionTargetId });
  }

  /**
   * Crea create execution.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create execution conforme al contrato `DeletionExecutions`.
   */
  createExecution(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a deletion target.
       */
      deletionTargetId: string;
      /**
       * Valor de attempt number mantenido por la instancia.
       */
      attemptNumber: number;
      /**
       * Valor de idempotency key mantenido por la instancia.
       */
      idempotencyKey: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de provider receipt mantenido por la instancia.
       */
      providerReceipt?: string;
      /**
       * Valor de error code mantenido por la instancia.
       */
      errorCode?: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
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
      /**
       * Identificador asociado a deletion target.
       */
      deletionTargetId: string;
      /**
       * Valor de verification method mantenido por la instancia.
       */
      verificationMethod: string;
      /**
       * Valor de verified absent mantenido por la instancia.
       */
      verifiedAbsent: boolean;
      /**
       * Valor de residual reference count mantenido por la instancia.
       */
      residualReferenceCount: number;
      /**
       * Identificador asociado a evidence object.
       */
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
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Identificador asociado a entity.
       */
      entityId: string;
      /**
       * Valor de entity version mantenido por la instancia.
       */
      entityVersion: string;
      /**
       * Valor de cache scope mantenido por la instancia.
       */
      cacheScope: string;
    },
  ): Promise<CacheInvalidationJobs | null> {
    return em.findOne(CacheInvalidationJobs, key);
  }

  /**
   * Crea create cache job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cache job conforme al contrato `CacheInvalidationJobs`.
   */
  createCacheJob(
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
       * Identificador asociado a entity.
       */
      entityId: string;
      /**
       * Valor de entity version mantenido por la instancia.
       */
      entityVersion: string;
      /**
       * Valor de cache scope mantenido por la instancia.
       */
      cacheScope: string;
      /**
       * Valor de status mantenido por la instancia.
       */
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

  /**
   * Crea create movement job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create movement job conforme al contrato `DataMovementJobs`.
   */
  createMovementJob(
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
       * Identificador asociado a source placement.
       */
      sourcePlacementId: string;
      /**
       * Identificador asociado a target placement.
       */
      targetPlacementId: string;
      /**
       * Valor de movement mode mantenido por la instancia.
       */
      movementMode: string;
      /**
       * Valor de manifest hash mantenido por la instancia.
       */
      manifestHash: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
    },
  ): DataMovementJobs {
    return em.create(DataMovementJobs, data as never, { partial: true });
  }

  /**
   * Crea create schema migration job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schema migration job conforme al contrato `SchemaMigrationJobs`.
   */
  createSchemaMigrationJob(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dataset.
       */
      datasetId: string;
      /**
       * Identificador asociado a collection definition.
       */
      collectionDefinitionId?: string;
      /**
       * Valor de from schema version mantenido por la instancia.
       */
      fromSchemaVersion?: string;
      /**
       * Valor de to schema version mantenido por la instancia.
       */
      toSchemaVersion?: string;
      /**
       * Valor de migration strategy mantenido por la instancia.
       */
      migrationStrategy: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
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

  /**
   * Crea create archive job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create archive job conforme al contrato `ArchiveJobs`.
   */
  createArchiveJob(
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
       * Valor de retention cutoff mantenido por la instancia.
       */
      retentionCutoff: Date;
      /**
       * Identificador asociado a archive manifest object.
       */
      archiveManifestObjectId?: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de archived count mantenido por la instancia.
       */
      archivedCount: string;
      /**
       * Valor de deleted hot count mantenido por la instancia.
       */
      deletedHotCount: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
    },
  ): ArchiveJobs {
    return em.create(ArchiveJobs, data as never, { partial: true });
  }
}
