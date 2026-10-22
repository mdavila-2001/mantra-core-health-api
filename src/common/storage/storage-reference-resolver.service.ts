import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FILE_STORAGE_ADAPTER,
  type FileStorageAdapter,
} from './file-storage.adapter';
import {
  physicalContentionKey,
  physicalNamespace,
  samePhysicalObject,
  type PhysicalObjectIdentity,
} from './physical-object-identity';
import {
  StorageReferenceRepository,
  type StorageReferenceSnapshot,
} from './storage-reference.repository';

export type StorageReferenceDecision =
  | { state: 'ZERO'; validReferenceCount: 0 }
  | { state: 'REFERENCED'; validReferenceCount: number }
  | { state: 'UNKNOWN'; reasonCode: string };

/** UNKNOWN is a decision, never the number zero. Caller must hold namespace exclusion. */
@Injectable()
export class StorageReferenceResolver {
  constructor(
    private readonly repository: StorageReferenceRepository,
    @Inject(FILE_STORAGE_ADAPTER) private readonly adapter: FileStorageAdapter,
  ) {}

  async resolve(
    tx: EntityManager,
    target: PhysicalObjectIdentity,
    retiredFileIds: string[],
    retiredVersionIds: string[],
  ): Promise<StorageReferenceDecision> {
    if (target.kind === 'UNKNOWN')
      return { state: 'UNKNOWN', reasonCode: 'PHYSICAL_IDENTITY_UNKNOWN' };
    try {
      return this.evaluate(
        target,
        await this.repository.snapshot(tx, retiredFileIds, retiredVersionIds),
      );
    } catch {
      return { state: 'UNKNOWN', reasonCode: 'REFERENCE_STATE_UNKNOWN' };
    }
  }

  evaluate(
    target: PhysicalObjectIdentity,
    snapshot: StorageReferenceSnapshot,
  ): StorageReferenceDecision {
    if (target.kind === 'UNKNOWN' || snapshot.opaqueReferencesPresent)
      return {
        state: 'UNKNOWN',
        reasonCode: 'PHYSICAL_OR_EXTERNAL_IDENTITY_UNKNOWN',
      };
    let count = snapshot.incomingReferences;
    if (!Number.isSafeInteger(count) || count < 0)
      return { state: 'UNKNOWN', reasonCode: 'REFERENCE_STATE_UNKNOWN' };
    for (const row of snapshot.rows) {
      const locators = [
        row.storage_uri,
        ...(row.external_source_uri ? [row.external_source_uri] : []),
      ];
      for (const locator of locators) {
        const identity = this.adapter.resolvePhysicalIdentity?.(
          locator,
          row.object_version,
        );
        if (!identity || identity.kind === 'UNKNOWN') {
          if (
            identity?.kind === 'UNKNOWN' &&
            identity.affectedNamespace &&
            identity.affectedNamespace !== physicalNamespace(target)
          )
            continue;
          return { state: 'UNKNOWN', reasonCode: 'LOCATOR_UNRESOLVED' };
        }
        if (
          (row.object_key && row.object_key !== identity.exactObjectKey) ||
          (row.bucket_or_container &&
            row.bucket_or_container !== identity.physicalContainer)
        )
          return { state: 'UNKNOWN', reasonCode: 'METADATA_CONFLICT' };
        if (samePhysicalObject(identity, target)) count++;
        else if (
          physicalContentionKey(identity) === physicalContentionKey(target) &&
          (identity.versionSelector.kind === 'UNVERSIONED' ||
            target.versionSelector.kind === 'UNVERSIONED')
        )
          return { state: 'UNKNOWN', reasonCode: 'VERSION_UNRESOLVED' };
      }
    }
    return count > 0
      ? { state: 'REFERENCED', validReferenceCount: count }
      : { state: 'ZERO', validReferenceCount: 0 };
  }
}
