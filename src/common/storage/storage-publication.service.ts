import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import {
  FILE_STORAGE_ADAPTER,
  type FileStorageAdapter,
  type StoredFile,
  type StoredFileInput,
} from './file-storage.adapter';
import {
  StorageLifecycleCoordinator,
  type PublicationReservation,
} from './storage-lifecycle-coordinator.service';
import {
  bindReservationIdentity,
  isKnownPhysicalIdentity,
  reservationKey,
  type KnownPhysicalObjectIdentity,
} from './physical-object-identity';
import { StorageLifecycleDenied } from './storage-lifecycle.protocol';
import { loadStorageEnv } from './storage.env';
import { Files } from '../../modules/common/entities/files.entity';
import { FileVersions } from '../../modules/common/entities/file_versions.entity';
import { CONCEPTS } from '../constants/concepts';

export interface PublicationTarget {
  tenantId: string;
  producer: string;
  targetId: string;
}
export interface PublicationContext {
  tx: EntityManager;
  targetId: string;
  reservation?: PublicationReservation;
  stored: StoredFile;
}

/** Optional DI exists for legacy isolated tests only; configured production fails closed. */
export async function guardStorageMutation(
  tx: EntityManager,
  publication?: StoragePublicationService,
): Promise<void> {
  if (loadStorageEnv().lifecycleBinding && !publication)
    throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
  await publication?.lockNamespace(tx);
}

/** One write protocol for API producers, metadata registrars and worker callbacks. */
@Injectable()
export class StoragePublicationService {
  private readonly binding = loadStorageEnv().lifecycleBinding;
  constructor(
    private readonly em: EntityManager,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
    private readonly coordinator: StorageLifecycleCoordinator,
  ) {}

  get protectedNamespace(): boolean {
    return this.binding !== undefined;
  }

  async publish<T>(
    input: StoredFileInput,
    target: PublicationTarget,
    publish: (context: PublicationContext) => Promise<T>,
  ): Promise<T> {
    if (!this.protectedNamespace) {
      // Existing uploads remain available; unbound storage can NEVER be purged.
      const stored = await this.storage.store(input);
      return this.em.transactional((tx) =>
        publish({ tx, targetId: target.targetId, stored }),
      );
    }
    const plan = this.storage.plan?.(input);
    if (!plan || plan.identity.kind === 'UNKNOWN' || !this.storage.inspect)
      throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
    const reservation = await this.coordinator.begin({
      ...target,
      identity: plan.identity,
      operationId: randomUUID(),
      ownerToken: randomUUID(),
      contentHash: plan.contentHash,
      sizeBytes: plan.sizeBytes,
      queueCode: process.env.FILE_STORAGE_LIFECYCLE_QUEUE_CODE ?? '',
    });
    try {
      const presence = await this.storage.inspect(plan.storageUri);
      let stored: StoredFile;
      if (presence.state === 'UNKNOWN')
        throw new StorageLifecycleDenied('REMOTE_STATE_UNKNOWN');
      if (presence.state === 'PRESENT') {
        stored = presence.stored;
        await this.coordinator.reuse(reservation, this.receipt(stored));
      } else {
        let attemptId: string | undefined;
        let consumed = false;
        stored = await this.storage.store(input, {
          consume: async (identity, hash, size) => {
            if (
              consumed ||
              reservationKey(identity) !==
                reservationKey(reservation.identity) ||
              hash !== plan.contentHash ||
              size !== plan.sizeBytes
            )
              throw new StorageLifecycleDenied('WRITE_PERMIT_MISMATCH');
            consumed = true;
            attemptId = await this.coordinator.dispatch(reservation);
          },
        });
        if (!attemptId)
          throw new StorageLifecycleDenied('ADAPTER_DID_NOT_CONSUME_PERMIT');
        await this.coordinator.settle(
          reservation,
          attemptId,
          this.receipt(stored),
        );
      }
      const result = await this.coordinator.commit(reservation, (tx) =>
        publish({ tx, reservation, targetId: target.targetId, stored }),
      );
      if (result.duplicate || result.result === undefined)
        throw new StorageLifecycleDenied('PUBLICATION_RESULT_REQUIRES_RELOAD');
      return result.result;
    } catch (error) {
      // If abort cannot persist, the previous durable phase still excludes purge.
      await this.coordinator.abort(reservation);
      throw error;
    }
  }

  /** Namespace lock comes BEFORE domain row locks, consistently for every writer. */
  async lockNamespace(tx: EntityManager): Promise<void> {
    if (!this.binding) return;
    const identity = bindReservationIdentity(
      this.binding,
      this.binding.adapter,
      this.binding.configuredLocation,
      '__namespace_lock_only__',
    );
    if (identity.kind === 'UNKNOWN')
      throw new StorageLifecycleDenied(identity.reasonCode);
    await this.coordinator.excludeNamespaces(tx, [identity]);
    await this.coordinator.assertNoPendingPurge(tx);
  }

  async guardLocator(
    tx: EntityManager,
    storageUri: string,
    expected?: { contentHash: string; sizeBytes: number },
    reservation?: PublicationReservation,
  ): Promise<KnownPhysicalObjectIdentity | undefined> {
    if (!this.binding) return undefined;
    await this.lockNamespace(tx);
    const presence = await this.storage.inspect?.(storageUri);
    if (!presence || presence.state !== 'PRESENT')
      throw new StorageLifecycleDenied('REFERENCE_OBJECT_UNPROVEN');
    const receipt = this.receipt(presence.stored);
    if (reservation)
      await this.coordinator.assertSettledReference(
        tx,
        reservation,
        receipt.identity,
      );
    if (
      expected &&
      (receipt.contentHash !== expected.contentHash ||
        receipt.sizeBytes !== expected.sizeBytes)
    )
      throw new StorageLifecycleDenied('REFERENCE_METADATA_MISMATCH');
    await this.coordinator.assertNoContender(
      tx,
      receipt.identity,
      reservation?.operationId,
    );
    return receipt.identity;
  }

  async guardFile(tx: EntityManager, fileId: string): Promise<void> {
    if (!this.binding) return;
    await this.lockNamespace(tx);
    const file = await tx.findOne(Files, { id: fileId }, { refresh: true });
    if (
      !file ||
      file.deletedAt ||
      file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED ||
      !file.currentVersionId
    )
      throw new StorageLifecycleDenied('FILE_NOT_LIVE');
    const versions = await tx.find(FileVersions, { fileId }, { refresh: true });
    if (!versions.some((version) => version.id === file.currentVersionId))
      throw new StorageLifecycleDenied('VERSION_UNKNOWN');
    for (const version of versions) {
      const identity = this.storage.resolvePhysicalIdentity?.(
        version.storageUri,
        version.objectVersion,
      );
      if (!identity || identity.kind === 'UNKNOWN')
        throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
      await this.coordinator.assertNoContender(tx, identity);
    }
  }

  private receipt(stored: StoredFile) {
    if (!isKnownPhysicalIdentity(stored.physicalIdentity))
      throw new StorageLifecycleDenied('STORE_RECEIPT_UNKNOWN');
    return {
      identity: stored.physicalIdentity,
      contentHash: stored.contentHash,
      sizeBytes: stored.sizeBytes,
    };
  }
}
