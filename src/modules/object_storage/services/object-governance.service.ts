import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  ObjectGovernanceRepository,
  ObjectStorageRepository,
} from '../repositories';
import {
  CHECKSUM_ALGORITHM_SHA256,
  CHECKSUM_VERIFICATION,
  DELETION_VERIFICATION,
  INTEGRITY_CHECK,
  LEGAL_HOLD_STATE,
  OBJECT_LIFECYCLE,
  PLACEMENT_ROLE,
  REPLICATION_STATE,
  RETENTION_LOCK_MODE,
  STORAGE_CLASS,
} from '../constants';
import {
  ApplyRetentionLockDto,
  RetentionLockResponseDto,
  PlaceLegalHoldDto,
  LegalHoldResponseDto,
  RecordIntegrityCheckDto,
  IntegrityCheckResponseDto,
  BuildArchiveJobDto,
  ArchiveJobResponseDto,
  RequestDeletionDto,
  DeletionMarkerResponseDto,
} from '../dto';

/**
 * Gobierno del objeto: retención WORM, retención legal, verificación de
 * integridad, archivado en frío y borrado gobernado
 * (UC-60-07, 08, 10, 11, 12).
 *
 * Casi todo lo que hay aquí sirve para **negarse a borrar algo**. Un sistema que
 * guarda historia clínica tiene que poder demostrar tanto que conservó lo que
 * debía como que destruyó lo que le tocaba destruir.
 */
@Injectable()
export class ObjectGovernanceService {
  constructor(
    private readonly em: EntityManager,
    private readonly governanceRepo: ObjectGovernanceRepository,
    private readonly storageRepo: ObjectStorageRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ObjectGovernanceService.name);
  }

  /**
   * UC-60-07: aplicar retención sobre una versión.
   *
   * El modo `compliance` es WORM de verdad: ni se acorta ni se libera antes de
   * tiempo, ni siquiera por quien lo puso. Por eso una retención vigente en ese
   * modo bloquea cualquier intento de sustituirla.
   */
  async applyRetentionLock(
    versionId: string,
    dto: ApplyRetentionLockDto,
  ): Promise<RetentionLockResponseDto> {
    const retainUntil = new Date(dto.retainUntil);
    if (retainUntil.getTime() <= Date.now()) {
      throw new PreconditionFailedException(
        'La retención debe terminar en el futuro',
        {
          versionId,
          retainUntil: dto.retainUntil,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const version = await this.storageRepo.findVersionById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }

      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        version.objectManifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          manifestId: version.objectManifestId,
        });
      }

      const namespace = await this.storageRepo.findNamespaceById(
        tx,
        manifest.namespaceId,
      );
      if (!namespace?.objectLockEnabled) {
        throw new PreconditionFailedException(
          'El espacio de nombres no tiene bloqueo de objetos habilitado',
          { versionId, namespaceId: manifest.namespaceId },
        );
      }

      const active = await this.governanceRepo.findActiveRetentionLockForUpdate(
        tx,
        versionId,
      );
      if (active) {
        // Una retención de cumplimiento no se toca. Una de gobernanza tampoco se
        // duplica: hay que liberarla primero, y eso es otra operación.
        throw new ConflictException(
          'La versión ya tiene una retención vigente',
          {
            versionId,
            lockMode: active.lockMode,
          },
        );
      }

      const lock = this.governanceRepo.createRetentionLock(tx, {
        objectVersionId: versionId,
        lockMode: dto.lockMode,
        retainUntil,
        policyCode: dto.policyCode,
      });

      // La retención legal manda sobre la de cumplimiento: si el objeto ya está
      // bajo hold, se queda como está.
      if (manifest.lifecycleState !== OBJECT_LIFECYCLE.LEGAL_HOLD) {
        manifest.lifecycleState = OBJECT_LIFECYCLE.RETAINED;
      }
      if (dto.policyCode) manifest.retentionPolicyCode = dto.policyCode;
      manifest.updatedAt = new Date();

      this.logger.warn(
        {
          operation: 'object-storage.retention.apply',
          versionId,
          lockMode: dto.lockMode,
          retainUntil: dto.retainUntil,
        },
        'Retention lock applied to an object version',
      );

      return {
        id: lock.id,
        objectVersionId: versionId,
        lockMode: dto.lockMode,
        retainUntil: retainUntil.toISOString(),
        lifecycleState: manifest.lifecycleState,
      };
    });
  }

  /** UC-60-08: colocar una retención legal sobre la versión. */
  async placeLegalHold(
    versionId: string,
    dto: PlaceLegalHoldDto,
    actor: AuthenticatedUser,
  ): Promise<LegalHoldResponseDto> {
    return this.em.transactional(async (tx) => {
      const version = await this.storageRepo.findVersionById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }

      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        version.objectManifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          manifestId: version.objectManifestId,
        });
      }

      const hold = this.governanceRepo.createLegalHold(tx, {
        objectVersionId: versionId,
        legalCaseReference: dto.legalCaseReference,
        holdState: LEGAL_HOLD_STATE.ACTIVE,
        placedByUserId: actor.id,
      });

      manifest.lifecycleState = OBJECT_LIFECYCLE.LEGAL_HOLD;
      manifest.updatedAt = new Date();

      const active = await this.governanceRepo.findActiveLegalHolds(
        tx,
        versionId,
        LEGAL_HOLD_STATE.ACTIVE,
      );

      this.logger.warn(
        {
          operation: 'object-storage.legal-hold.place',
          versionId,
          legalCaseReference: dto.legalCaseReference,
          actorUserId: actor.id,
        },
        'Legal hold placed on an object version',
      );

      return {
        id: hold.id,
        objectVersionId: versionId,
        holdState: LEGAL_HOLD_STATE.ACTIVE,
        lifecycleState: OBJECT_LIFECYCLE.LEGAL_HOLD,
        activeHolds: active.length,
      };
    });
  }

  /**
   * UC-60-08: liberar una retención legal.
   *
   * Sólo se devuelve el objeto a su estado anterior cuando **no queda ninguna**
   * retención legal viva: varios casos legales pueden pesar sobre el mismo
   * objeto, y levantar uno no levanta los demás.
   */
  async releaseLegalHold(
    versionId: string,
    holdId: string,
    actor: AuthenticatedUser,
  ): Promise<LegalHoldResponseDto> {
    return this.em.transactional(async (tx) => {
      const hold = await this.governanceRepo.findLegalHoldForUpdate(tx, holdId);
      if (!hold) {
        throw new ResourceNotFoundException('Retención legal no encontrada', {
          holdId,
        });
      }
      if (hold.objectVersionId !== versionId) {
        throw new PreconditionFailedException(
          'La retención es de otra versión',
          {
            holdId,
            versionId,
          },
        );
      }
      if (hold.holdState !== LEGAL_HOLD_STATE.ACTIVE) {
        throw new ConflictException('La retención legal ya está liberada', {
          holdId,
        });
      }

      const version = await this.storageRepo.findVersionById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }
      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        version.objectManifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          manifestId: version.objectManifestId,
        });
      }

      hold.holdState = LEGAL_HOLD_STATE.RELEASED;
      hold.releasedAt = new Date();

      const remaining = (
        await this.governanceRepo.findActiveLegalHolds(
          tx,
          versionId,
          LEGAL_HOLD_STATE.ACTIVE,
        )
      ).filter((candidate) => candidate.id !== holdId);

      if (remaining.length === 0) {
        const retention =
          await this.governanceRepo.findActiveRetentionLockForUpdate(
            tx,
            versionId,
          );
        manifest.lifecycleState = retention
          ? OBJECT_LIFECYCLE.RETAINED
          : OBJECT_LIFECYCLE.ACTIVE;
        manifest.updatedAt = new Date();
      }

      this.logger.warn(
        {
          operation: 'object-storage.legal-hold.release',
          versionId,
          holdId,
          actorUserId: actor.id,
        },
        'Legal hold released',
      );

      return {
        id: holdId,
        objectVersionId: versionId,
        holdState: LEGAL_HOLD_STATE.RELEASED,
        lifecycleState: manifest.lifecycleState,
        activeHolds: remaining.length,
      };
    });
  }

  /**
   * UC-60-10: registrar la verificación de integridad.
   *
   * El resultado se **deriva** de comparar el hash esperado con el recomputado.
   * Que no cuadre marca el objeto como corrupto: seguir sirviéndolo como bueno
   * sería devolver datos clínicos alterados sin avisar.
   */
  async recordIntegrityCheck(
    versionId: string,
    dto: RecordIntegrityCheckDto,
  ): Promise<IntegrityCheckResponseDto> {
    return this.em.transactional(async (tx) => {
      const version = await this.storageRepo.findVersionById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }

      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        version.objectManifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          manifestId: version.objectManifestId,
        });
      }

      const passed =
        dto.actualHash.toLowerCase() === version.sha256.toLowerCase();
      const status = passed ? INTEGRITY_CHECK.PASSED : INTEGRITY_CHECK.FAILED;

      const check = this.governanceRepo.createIntegrityCheck(tx, {
        objectVersionId: versionId,
        checkType: INTEGRITY_CHECK.TYPE_SHA256_SCAN,
        expectedHash: version.sha256,
        actualHash: dto.actualHash,
        status,
        repairJobId: dto.repairJobId,
      });

      const checksum = await this.storageRepo.findChecksumForUpdate(
        tx,
        versionId,
        CHECKSUM_ALGORITHM_SHA256,
      );
      if (checksum) {
        checksum.verifiedAt = new Date();
        checksum.verificationStatus = passed
          ? CHECKSUM_VERIFICATION.VERIFIED
          : CHECKSUM_VERIFICATION.MISMATCH;
      }

      const location = await this.storageRepo.findPrimaryLocationForUpdate(
        tx,
        versionId,
        PLACEMENT_ROLE.PRIMARY,
      );
      if (location && passed) {
        location.replicationState = REPLICATION_STATE.VERIFIED;
        location.verifiedAt = new Date();
      }

      if (!passed) {
        manifest.lifecycleState = OBJECT_LIFECYCLE.CORRUPT;
        manifest.updatedAt = new Date();

        this.logger.warn(
          {
            operation: 'object-storage.integrity.check',
            versionId,
            manifestId: manifest.id,
          },
          'Object corruption detected: stored content does not match its recorded hash',
        );
      }

      return {
        id: check.id,
        status,
        expectedHash: version.sha256,
        actualHash: dto.actualHash,
        lifecycleState: manifest.lifecycleState,
      };
    });
  }

  /**
   * UC-60-11: archivar el objeto a almacenamiento frío.
   *
   * Una retención legal viva **impide degradar la clase**: mover a frío lo que
   * un juzgado puede pedir mañana convertiría una entrega en horas en una
   * entrega en días.
   */
  async buildArchiveJob(
    dto: BuildArchiveJobDto,
  ): Promise<ArchiveJobResponseDto> {
    return this.em.transactional(async (tx) => {
      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        dto.objectManifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          objectManifestId: dto.objectManifestId,
        });
      }

      const existing = await this.governanceRepo.findArchiveManifestByHash(
        tx,
        manifest.tenantId,
        dto.manifestHash,
      );
      if (existing) {
        return {
          id: existing.id,
          objectManifestId: dto.objectManifestId,
          recordCount: existing.recordCount,
          lifecycleState: manifest.lifecycleState,
          duplicate: true,
        };
      }

      const version = await this.storageRepo.findLatestVersion(
        tx,
        dto.objectManifestId,
      );
      if (!version) {
        throw new PreconditionFailedException(
          'El objeto no tiene ninguna versión',
          {
            objectManifestId: dto.objectManifestId,
          },
        );
      }

      const holds = await this.governanceRepo.findActiveLegalHolds(
        tx,
        version.id,
        LEGAL_HOLD_STATE.ACTIVE,
      );
      if (holds.length > 0) {
        throw new PreconditionFailedException(
          'La versión está bajo retención legal: no se puede mover a frío',
          { objectManifestId: dto.objectManifestId, activeHolds: holds.length },
        );
      }

      const archive = this.governanceRepo.createArchiveManifest(tx, {
        tenantId: manifest.tenantId,
        archiveType: dto.archiveType,
        sourceScopeJson: dto.sourceScopeJson,
        objectManifestId: dto.objectManifestId,
        recordCount: '1',
        manifestHash: dto.manifestHash,
      });

      this.storageRepo.createLocation(tx, {
        objectVersionId: version.id,
        namespaceId: dto.archiveNamespaceId,
        placementRole: PLACEMENT_ROLE.ARCHIVE,
        providerUri: dto.providerUri,
        storageClass: dto.storageClass ?? STORAGE_CLASS.GLACIER,
        replicationState: REPLICATION_STATE.PENDING,
      });

      manifest.lifecycleState = OBJECT_LIFECYCLE.ARCHIVED;
      manifest.updatedAt = new Date();

      return {
        id: archive.id,
        objectManifestId: dto.objectManifestId,
        recordCount: '1',
        lifecycleState: OBJECT_LIFECYCLE.ARCHIVED,
        duplicate: false,
      };
    });
  }

  /**
   * UC-60-12: solicitar el borrado gobernado.
   *
   * Dos guardas, y las dos abortan: una retención legal viva y una retención de
   * cumplimiento sin vencer. Es un borrado **lógico** — se marca la intención y
   * el worker la ejecuta después contra el proveedor.
   */
  async requestDeletion(
    manifestId: string,
    dto: RequestDeletionDto,
    actor: AuthenticatedUser,
  ): Promise<DeletionMarkerResponseDto> {
    return this.em.transactional(async (tx) => {
      const manifest = await this.storageRepo.findManifestForUpdate(
        tx,
        manifestId,
      );
      if (!manifest) {
        throw new ResourceNotFoundException('Objeto no encontrado', {
          manifestId,
        });
      }

      const existing = await this.governanceRepo.findDeletionMarker(
        tx,
        manifestId,
      );
      if (existing) {
        return {
          id: existing.id,
          objectManifestId: manifestId,
          lifecycleState: manifest.lifecycleState,
          verificationStatus: existing.verificationStatus,
          duplicate: true,
        };
      }

      const version = await this.storageRepo.findLatestVersion(tx, manifestId);
      if (version) {
        const holds = await this.governanceRepo.findActiveLegalHolds(
          tx,
          version.id,
          LEGAL_HOLD_STATE.ACTIVE,
        );
        if (holds.length > 0) {
          throw new PreconditionFailedException(
            'El objeto está bajo retención legal: no se puede borrar',
            { manifestId, activeHolds: holds.length },
          );
        }

        const retention =
          await this.governanceRepo.findActiveRetentionLockForUpdate(
            tx,
            version.id,
          );
        // La retención de cumplimiento es WORM: bloquea hasta su fecha aunque
        // quien pida el borrado tenga todos los permisos.
        if (
          retention &&
          retention.lockMode === RETENTION_LOCK_MODE.COMPLIANCE &&
          retention.retainUntil.getTime() > Date.now()
        ) {
          throw new PreconditionFailedException(
            'El objeto está bajo retención de cumplimiento vigente',
            { manifestId, retainUntil: retention.retainUntil.toISOString() },
          );
        }
      }

      const marker = this.governanceRepo.createDeletionMarker(tx, {
        objectManifestId: manifestId,
        requestedByJobId: dto.requestedByJobId,
        effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : undefined,
        verificationStatus: DELETION_VERIFICATION.PENDING,
      });

      manifest.lifecycleState = OBJECT_LIFECYCLE.PENDING_DELETION;
      manifest.updatedAt = new Date();

      this.logger.warn(
        {
          operation: 'object-storage.deletion.request',
          manifestId,
          actorUserId: actor.id,
          reason: dto.reason,
        },
        'Governed deletion requested for a stored object',
      );

      return {
        id: marker.id,
        objectManifestId: manifestId,
        lifecycleState: OBJECT_LIFECYCLE.PENDING_DELETION,
        verificationStatus: DELETION_VERIFICATION.PENDING,
        duplicate: false,
      };
    });
  }
}
