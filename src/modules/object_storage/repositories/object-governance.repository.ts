import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ObjectRetentionLocks,
  ObjectLegalHolds,
  ObjectIntegrityChecks,
  ObjectDeletionMarkers,
  ArchiveManifests,
} from '../entities';

/**
 * Acceso al gobierno de `object_storage.*`: bloqueos de retención, retenciones
 * legales, comprobaciones de integridad, marcadores de borrado y manifiestos de
 * archivado.
 *
 * Todo lo que hay aquí existe para poder **negarse a borrar algo**, o para
 * demostrar que no se borró. Por eso las tablas son de sólo inserción salvo el
 * cierre explícito de un bloqueo.
 */
@Injectable()
export class ObjectGovernanceRepository {
  // --- Retención (UC-60-07, 11, 12) ---

  createRetentionLock(
    em: EntityManager,
    data: {
      objectVersionId: string;
      lockMode: string;
      retainUntil: Date;
      policyCode?: string;
    },
  ): ObjectRetentionLocks {
    return em.create(
      ObjectRetentionLocks,
      {
        objectVersionId: data.objectVersionId,
        lockMode: data.lockMode,
        retainUntil: data.retainUntil,
        policyCode: data.policyCode,
        appliedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Bloqueo de retención vigente de la versión. Sólo puede haber uno sin
   * liberar: dos retenciones activas dejarían sin decidir cuál manda.
   */
  findActiveRetentionLockForUpdate(
    em: EntityManager,
    objectVersionId: string,
  ): Promise<ObjectRetentionLocks | null> {
    return em.findOne(
      ObjectRetentionLocks,
      { objectVersionId, releasedAt: null },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Retenciones vivas de varias versiones: la guarda del borrado y del archivado. */
  findActiveRetentionLocks(
    em: EntityManager,
    objectVersionIds: string[],
  ): Promise<ObjectRetentionLocks[]> {
    return em.find(ObjectRetentionLocks, {
      objectVersionId: { $in: objectVersionIds },
      releasedAt: null,
    });
  }

  // --- Retención legal (UC-60-08, 11, 12) ---

  createLegalHold(
    em: EntityManager,
    data: {
      objectVersionId: string;
      legalCaseReference: string;
      holdState: string;
      placedByUserId: string;
    },
  ): ObjectLegalHolds {
    return em.create(
      ObjectLegalHolds,
      {
        objectVersionId: data.objectVersionId,
        legalCaseReference: data.legalCaseReference,
        holdState: data.holdState,
        placedByUserId: data.placedByUserId,
        placedAt: new Date(),
      },
      { partial: true },
    );
  }

  findLegalHoldForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ObjectLegalHolds | null> {
    return em.findOne(
      ObjectLegalHolds,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Retenciones legales vivas de la versión: cualquiera de ellas veta el borrado. */
  findActiveLegalHolds(
    em: EntityManager,
    objectVersionId: string,
    activeState: string,
  ): Promise<ObjectLegalHolds[]> {
    return em.find(ObjectLegalHolds, {
      objectVersionId,
      holdState: activeState,
    });
  }

  findActiveLegalHoldsForVersions(
    em: EntityManager,
    objectVersionIds: string[],
    activeState: string,
  ): Promise<ObjectLegalHolds[]> {
    return em.find(ObjectLegalHolds, {
      objectVersionId: { $in: objectVersionIds },
      holdState: activeState,
    });
  }

  // --- Integridad (UC-60-10) ---

  /** Log append-only: una comprobación es la foto de un momento. */
  createIntegrityCheck(
    em: EntityManager,
    data: {
      objectVersionId: string;
      checkType: string;
      expectedHash: string;
      actualHash: string;
      status: string;
      repairJobId?: string;
    },
  ): ObjectIntegrityChecks {
    return em.create(
      ObjectIntegrityChecks,
      {
        objectVersionId: data.objectVersionId,
        checkType: data.checkType,
        expectedHash: data.expectedHash,
        actualHash: data.actualHash,
        status: data.status,
        checkedAt: new Date(),
        repairJobId: data.repairJobId,
      },
      { partial: true },
    );
  }

  // --- Borrado (UC-60-12) ---

  createDeletionMarker(
    em: EntityManager,
    data: {
      objectManifestId: string;
      requestedByJobId?: string;
      providerDeleteMarker?: string;
      effectiveAt?: Date;
      verificationStatus: string;
    },
  ): ObjectDeletionMarkers {
    return em.create(
      ObjectDeletionMarkers,
      {
        objectManifestId: data.objectManifestId,
        requestedByJobId: data.requestedByJobId,
        providerDeleteMarker: data.providerDeleteMarker,
        requestedAt: new Date(),
        effectiveAt: data.effectiveAt,
        verificationStatus: data.verificationStatus,
      },
      { partial: true },
    );
  }

  /** Borrado ya solicitado: pedirlo dos veces no abre un segundo expediente. */
  findDeletionMarker(
    em: EntityManager,
    objectManifestId: string,
  ): Promise<ObjectDeletionMarkers | null> {
    return em.findOne(ObjectDeletionMarkers, { objectManifestId });
  }

  // --- Archivado (UC-60-11) ---

  createArchiveManifest(
    em: EntityManager,
    data: {
      tenantId?: string;
      archiveType: string;
      sourceScopeJson?: unknown;
      objectManifestId: string;
      /** `bigint` en el modelo: viaja como cadena. */
      recordCount: string;
      manifestHash: string;
    },
  ): ArchiveManifests {
    return em.create(
      ArchiveManifests,
      {
        tenantId: data.tenantId,
        archiveType: data.archiveType,
        sourceScopeJson: data.sourceScopeJson,
        objectManifestId: data.objectManifestId,
        recordCount: data.recordCount,
        manifestHash: data.manifestHash,
      },
      { partial: true },
    );
  }

  /** El hash del lote lo hace idempotente: el mismo archivado no se repite. */
  findArchiveManifestByHash(
    em: EntityManager,
    tenantId: string | undefined,
    manifestHash: string,
  ): Promise<ArchiveManifests | null> {
    return em.findOne(ArchiveManifests, { tenantId, manifestHash });
  }
}
