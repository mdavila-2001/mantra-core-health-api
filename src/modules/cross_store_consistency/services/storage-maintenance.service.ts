import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { DeletionRepository } from '../repositories';
import {
  InvalidateCacheDto,
  CacheInvalidationResponseDto,
  MoveDataDto,
  MovementJobResponseDto,
  ArchiveDataDto,
  ArchiveJobResponseDto,
} from '../dto';

/**
 * Mantenimiento del almacenamiento (UC-62-12, 13, 14): invalidación de caché,
 * movimiento entre zonas y archivado por retención.
 *
 * Lo tres comparten una idea: **la caché y las copias son derivadas**. Cuando el
 * dato canónico cambia de versión, de sitio o de temperatura, lo derivado tiene
 * que enterarse — y si no se le avisa, sigue sirviendo lo viejo sin saberlo.
 */
@Injectable()
export class StorageMaintenanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param deletionRepo - Valor de deletion repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly deletionRepo: DeletionRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StorageMaintenanceService.name);
  }

  /**
   * UC-62-12: encolar la invalidación de caché.
   *
   * La clave incluye la **versión de la entidad**: dos proyecciones de la misma
   * versión no encolan dos purgas, pero una versión nueva sí. Sin la versión en la
   * clave, la segunda invalidación se descartaría por duplicada y la caché seguiría
   * sirviendo dato viejo.
   */
  async invalidateCache(
    dto: InvalidateCacheDto,
    actor: AuthenticatedUser,
  ): Promise<CacheInvalidationResponseDto> {
    return this.em.transactional(async (tx) => {
      const key = {
        tenantId: dto.tenantId,
        datasetId: dto.datasetId,
        entityId: dto.entityId,
        entityVersion: dto.entityVersion,
        cacheScope: dto.cacheScope,
      };

      const duplicate = await this.deletionRepo.findCacheJob(tx, key);
      if (duplicate) {
        return { id: duplicate.id, status: duplicate.status, duplicate: true };
      }

      const job = this.deletionRepo.createCacheJob(tx, {
        ...key,
        status: 'PENDING',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'CacheInvalidationRequested',
        aggregateType: 'cross_store_consistency.cache_invalidation_jobs',
        aggregateId: job.id,
        payloadJson: key,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'xstore.cache.invalidate',
          cacheJobId: job.id,
          cacheScope: dto.cacheScope,
        },
        'Invalidación de caché encolada',
      );

      return { id: job.id, status: job.status, duplicate: false };
    });
  }

  /**
   * UC-62-13: mover datos entre zonas de almacenamiento.
   *
   * El origen y el destino tienen que ser distintos, y el `manifest_hash` hace
   * idempotente el lote: reintentar el mismo movimiento no lo repite.
   *
   * Se encola la invalidación de caché **siempre**: después de reubicar un dato,
   * la caché apunta a un sitio donde ya no está.
   */
  async moveData(
    dto: MoveDataDto,
    actor: AuthenticatedUser,
  ): Promise<MovementJobResponseDto> {
    return this.em.transactional(async (tx) => {
      if (dto.sourcePlacementId === dto.targetPlacementId) {
        throw new PreconditionFailedException(
          'El emplazamiento de origen y el de destino no pueden ser el mismo.',
          { placementId: dto.sourcePlacementId },
        );
      }

      const duplicate = await this.deletionRepo.findMovementJob(
        tx,
        dto.tenantId,
        dto.datasetId,
        dto.manifestHash,
      );
      if (duplicate) {
        return { id: duplicate.id, status: duplicate.status, duplicate: true };
      }

      const job = this.deletionRepo.createMovementJob(tx, {
        tenantId: dto.tenantId,
        datasetId: dto.datasetId,
        sourcePlacementId: dto.sourcePlacementId,
        targetPlacementId: dto.targetPlacementId,
        movementMode: dto.movementMode,
        manifestHash: dto.manifestHash,
        status: 'RUNNING',
        startedAt: new Date(),
      });

      let schemaMigrationJobId: string | undefined;
      if (dto.toSchemaVersion) {
        const migration = this.deletionRepo.createSchemaMigrationJob(tx, {
          datasetId: dto.datasetId,
          collectionDefinitionId: dto.collectionDefinitionId,
          fromSchemaVersion: dto.fromSchemaVersion,
          toSchemaVersion: dto.toSchemaVersion,
          migrationStrategy: dto.migrationStrategy ?? 'BACKFILL',
          status: 'REQUESTED',
          startedAt: new Date(),
        });
        schemaMigrationJobId = migration.id;
      }

      const cacheJob = this.deletionRepo.createCacheJob(tx, {
        tenantId: dto.tenantId,
        datasetId: dto.datasetId,
        // El movimiento afecta al dataset entero, no a una entidad: la clave usa
        // el propio dataset como entidad y el ámbito lo dice.
        entityId: dto.datasetId,
        entityVersion: dto.manifestHash,
        cacheScope: 'DATASET',
        status: 'PENDING',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'DataMovementRequested',
        aggregateType: 'cross_store_consistency.data_movement_jobs',
        aggregateId: job.id,
        payloadJson: {
          datasetId: dto.datasetId,
          sourcePlacementId: dto.sourcePlacementId,
          targetPlacementId: dto.targetPlacementId,
          movementMode: dto.movementMode,
          manifestHash: dto.manifestHash,
          schemaMigrationJobId: schemaMigrationJobId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'xstore.movement.request',
          movementJobId: job.id,
          movementMode: dto.movementMode,
        },
        'Movimiento de datos entre zonas encolado',
      );

      return {
        id: job.id,
        status: job.status,
        schemaMigrationJobId,
        cacheInvalidationJobId: cacheJob.id,
        duplicate: false,
      };
    });
  }

  /**
   * UC-62-14: archivar por retención y purgar la copia caliente.
   *
   * **La copia caliente sólo se purga si el manifiesto frío está confirmado.** Es
   * la regla que impide el peor desenlace posible de este caso de uso: borrar el
   * dato caliente y descubrir después que el archivado no llegó a escribirse.
   *
   * El corte de retención es la clave: reejecutar el mismo corte no vuelve a
   * archivar.
   */
  async archiveData(
    dto: ArchiveDataDto,
    actor: AuthenticatedUser,
  ): Promise<ArchiveJobResponseDto> {
    return this.em.transactional(async (tx) => {
      const retentionCutoff = new Date(dto.retentionCutoff);
      if (retentionCutoff >= new Date()) {
        throw new PreconditionFailedException(
          'El corte de retención tiene que estar en el pasado.',
          { retentionCutoff: dto.retentionCutoff },
        );
      }

      const duplicate = await this.deletionRepo.findArchiveJob(
        tx,
        dto.tenantId,
        dto.datasetId,
        retentionCutoff,
      );
      if (duplicate) {
        return {
          id: duplicate.id,
          status: duplicate.status,
          archivedCount: duplicate.archivedCount,
          deletedHotCount: duplicate.deletedHotCount,
          duplicate: true,
        };
      }

      const manifestConfirmed = Boolean(dto.archiveManifestObjectId);
      const deletedHotCount = dto.deletedHotCount ?? '0';

      if (!manifestConfirmed && BigInt(deletedHotCount) > 0n) {
        throw new PreconditionFailedException(
          'No se purga la copia caliente sin el manifiesto del archivo frío confirmado.',
          { datasetId: dto.datasetId },
        );
      }

      const job = this.deletionRepo.createArchiveJob(tx, {
        tenantId: dto.tenantId,
        datasetId: dto.datasetId,
        retentionCutoff,
        archiveManifestObjectId: dto.archiveManifestObjectId,
        status: 'COMPLETED',
        archivedCount: dto.archivedCount,
        deletedHotCount,
        startedAt: new Date(),
      });
      job.completedAt = new Date();

      const cacheJob = this.deletionRepo.createCacheJob(tx, {
        tenantId: dto.tenantId,
        datasetId: dto.datasetId,
        entityId: dto.datasetId,
        entityVersion: retentionCutoff.toISOString(),
        cacheScope: 'DATASET',
        status: 'PENDING',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'DataArchived',
        aggregateType: 'cross_store_consistency.archive_jobs',
        aggregateId: job.id,
        payloadJson: {
          datasetId: dto.datasetId,
          retentionCutoff: retentionCutoff.toISOString(),
          archivedCount: dto.archivedCount,
          deletedHotCount,
          archiveManifestObjectId: dto.archiveManifestObjectId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'xstore.archive.run',
          archiveJobId: job.id,
          archivedCount: dto.archivedCount,
          deletedHotCount,
        },
        'Datos archivados por retención',
      );

      return {
        id: job.id,
        status: job.status,
        archivedCount: job.archivedCount,
        deletedHotCount: job.deletedHotCount,
        cacheInvalidationJobId: cacheJob.id,
        duplicate: false,
      };
    });
  }
}
