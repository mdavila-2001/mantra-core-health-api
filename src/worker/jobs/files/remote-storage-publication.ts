import { randomUUID } from 'node:crypto';
import type {
  FileStorageAdapter,
  StoredFile,
  StoredFileInput,
} from '../../../common/storage/file-storage.adapter';
import type { PublicationReservation } from '../../../common/storage/storage-lifecycle-coordinator.service';
import type { RemotePublicationProof } from '../../../common/storage/storage-worker-publication.service';
import { reservationKey } from '../../../common/storage/physical-object-identity';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import { loadStorageEnv } from '../../../common/storage/storage.env';
import type { SystemApiClient } from '../../system-api-client.service';

/** Transport adapter only. All safety state and grants belong to the API coordinator. */
export async function publishAudioBytes(
  api: SystemApiClient,
  storage: FileStorageAdapter,
  assetId: string,
  jobId: string,
  input: StoredFileInput,
  publish: (
    stored: StoredFile,
    proof?: RemotePublicationProof,
  ) => Promise<void>,
): Promise<StoredFile> {
  if (!loadStorageEnv().lifecycleBinding) {
    const stored = await storage.store(input);
    await publish(stored);
    return stored;
  }
  const plan = storage.plan?.(input);
  if (!plan || plan.identity.kind === 'UNKNOWN')
    throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
  const path = `/internal/storage-lifecycle/audio/${assetId}`;
  const begun = await api.post<{
    reservation: PublicationReservation;
    present?: StoredFile;
  }>(
    `${path}/begin`,
    {
      operationId: jobId,
      ownerToken: randomUUID(),
      storageUri: plan.storageUri,
      contentHash: plan.contentHash,
      sizeBytes: plan.sizeBytes,
    },
    { idempotent: true },
  );
  const proof: RemotePublicationProof = { reservation: begun.reservation };
  try {
    let consumed = false;
    const stored =
      begun.present ??
      (await storage.store(input, {
        consume: async (identity, hash, size) => {
          if (
            consumed ||
            reservationKey(identity) !==
              reservationKey(begun.reservation.identity) ||
            hash !== plan.contentHash ||
            size !== plan.sizeBytes
          )
            throw new StorageLifecycleDenied('WRITE_PERMIT_MISMATCH');
          consumed = true;
          // A lost dispatch response never causes a second grant/native attempt.
          const grant = await api.post<{ ioAttemptId: string }>(
            `${path}/dispatch`,
            { reservation: begun.reservation },
          );
          proof.ioAttemptId = grant.ioAttemptId;
        },
      }));
    if (!begun.present && !proof.ioAttemptId)
      throw new StorageLifecycleDenied('ADAPTER_DID_NOT_CONSUME_PERMIT');
    if (
      stored.contentHash !== plan.contentHash ||
      stored.sizeBytes !== plan.sizeBytes ||
      !stored.physicalIdentity ||
      stored.physicalIdentity.kind === 'UNKNOWN'
    )
      throw new StorageLifecycleDenied('STORE_RECEIPT_UNKNOWN');
    proof.physicalIdentity = stored.physicalIdentity;
    await publish(stored, proof);
    return stored;
  } catch (error) {
    // Failed HTTP abort leaves the durable grant in place; no compensating delete.
    await api.post(
      `${path}/abort`,
      { reservation: begun.reservation },
      { idempotent: true },
    );
    throw error;
  }
}
