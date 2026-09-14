import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  FILE_STORAGE_ADAPTER,
  type FileStorageAdapter,
  type StoredFile,
} from './file-storage.adapter';
import {
  StorageLifecycleCoordinator,
  type PublicationReservation,
} from './storage-lifecycle-coordinator.service';
import { StorageLifecycleDenied } from './storage-lifecycle.protocol';
import {
  isKnownPhysicalIdentity,
  reservationAcceptsReceipt,
} from './physical-object-identity';
import type { KnownPhysicalObjectIdentity } from './physical-object-identity';
import { AudioAssets } from '../../modules/audio_assets/entities/audio_assets.entity';
import { QueuedJobs } from '../../modules/messaging/entities/queued_jobs.entity';
import { AUDIO_GENERATION_JOB_TYPE } from '../../modules/audio_assets/domain/audio-queue.constants';
import { CONCEPTS } from '../constants/concepts';

export interface RemotePublicationProof {
  reservation: PublicationReservation;
  ioAttemptId?: string;
  physicalIdentity?: KnownPhysicalObjectIdentity;
}
export interface BeginAudioPublication {
  operationId: string;
  ownerToken: string;
  storageUri: string;
  contentHash: string;
  sizeBytes: number;
}

/** Internal worker bridge to the SAME durable coordinator; never grants read access. */
@Injectable()
export class StorageWorkerPublicationService {
  constructor(
    private readonly em: EntityManager,
    private readonly coordinator: StorageLifecycleCoordinator,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
  ) {}

  async beginAudio(
    assetId: string,
    input: BeginAudioPublication,
  ): Promise<{
    reservation: PublicationReservation;
    present?: StoredFile;
  }> {
    const em = this.em.fork();
    const asset = await em.findOne(AudioAssets, { id: assetId });
    const job = await em.findOne(QueuedJobs, { id: input.operationId });
    const payload = job?.payloadJson as { assetId?: unknown } | undefined;
    if (
      !asset?.tenantId ||
      asset.generationStatus !== 'GENERATING' ||
      !job ||
      job.tenantId !== asset.tenantId ||
      job.jobType !== AUDIO_GENERATION_JOB_TYPE ||
      job.statusConceptId !== CONCEPTS.JOB_RUNNING ||
      payload?.assetId !== assetId
    )
      throw new StorageLifecycleDenied('PRODUCER_OWNERSHIP_UNKNOWN');
    const identity = this.storage.resolveReservationIdentity?.(
      input.storageUri,
    );
    if (!identity || identity.kind === 'UNKNOWN')
      throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
    const reservation = await this.coordinator.begin({
      ...input,
      identity,
      targetId: assetId,
      tenantId: asset.tenantId,
      producer: 'audio.generate',
      queueCode: process.env.FILE_STORAGE_LIFECYCLE_QUEUE_CODE ?? '',
    });
    try {
      const presence = await this.storage.inspect?.(input.storageUri);
      if (!presence || presence.state === 'UNKNOWN')
        throw new StorageLifecycleDenied('REMOTE_STATE_UNKNOWN');
      if (presence.state === 'PRESENT') {
        const receipt = this.receipt(presence.stored);
        await this.coordinator.reuse(reservation, receipt);
        return { reservation, present: presence.stored };
      }
      return { reservation };
    } catch (error) {
      await this.coordinator.abort(reservation);
      throw error;
    }
  }

  async dispatchAudio(
    assetId: string,
    reservation: PublicationReservation,
  ): Promise<{ ioAttemptId: string }> {
    await this.assertAudioTarget(assetId, reservation);
    return { ioAttemptId: await this.coordinator.dispatch(reservation) };
  }

  async abortAudio(
    assetId: string,
    reservation: PublicationReservation,
  ): Promise<void> {
    await this.assertAudioTarget(assetId, reservation);
    await this.coordinator.abort(reservation);
  }

  async finalizeAudio<T>(
    assetId: string,
    stored: { storageUri: string; contentHash: string; sizeBytes: number },
    proof: RemotePublicationProof,
    publish: (tx: EntityManager) => Promise<T>,
  ): Promise<{ duplicate: boolean; result?: T }> {
    const intent = await this.assertAudioTarget(assetId, proof.reservation);
    if (
      intent.contentHash !== stored.contentHash ||
      intent.sizeBytes !== stored.sizeBytes
    )
      throw new StorageLifecycleDenied('STORE_RECEIPT_MISMATCH');
    const declared = this.storage.resolveReservationIdentity?.(
      stored.storageUri,
    );
    if (!declared || declared.kind === 'UNKNOWN')
      throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
    if (intent.phase !== 'COMMITTED') {
      const presence = await this.storage.inspect?.(stored.storageUri);
      if (!presence || presence.state !== 'PRESENT')
        throw new StorageLifecycleDenied('REMOTE_STATE_UNKNOWN');
      const receipt = this.receipt(presence.stored);
      if (
        receipt.contentHash !== intent.contentHash ||
        receipt.sizeBytes !== intent.sizeBytes
      )
        throw new StorageLifecycleDenied('STORE_RECEIPT_MISMATCH');
      if (
        !isKnownPhysicalIdentity(proof.physicalIdentity) ||
        !reservationAcceptsReceipt(proof.physicalIdentity, receipt.identity)
      )
        throw new StorageLifecycleDenied('NATIVE_RECEIPT_IDENTITY_MISMATCH');
      if (!reservationAcceptsReceipt(declared, receipt.identity))
        throw new StorageLifecycleDenied('STORE_RECEIPT_MISMATCH');
      if (!intent.referenceOnly) {
        if (!proof.ioAttemptId)
          throw new StorageLifecycleDenied('SETTLEMENT_UNKNOWN');
        await this.coordinator.settle(
          proof.reservation,
          proof.ioAttemptId,
          receipt,
        );
      } else if (
        !intent.storedIdentity ||
        !reservationAcceptsReceipt(intent.storedIdentity, receipt.identity)
      ) {
        throw new StorageLifecycleDenied('STORE_RECEIPT_MISMATCH');
      }
    } else if (
      !intent.storedIdentity ||
      !reservationAcceptsReceipt(declared, intent.storedIdentity)
    ) {
      throw new StorageLifecycleDenied('PUBLICATION_REPLAY_MISMATCH');
    }
    return this.coordinator.commit(proof.reservation, publish);
  }

  private async assertAudioTarget(
    assetId: string,
    reservation: PublicationReservation,
  ) {
    const intent = await this.coordinator.inspectReservation(reservation);
    const asset = await this.em.fork().findOne(AudioAssets, { id: assetId });
    if (
      intent.producer !== 'audio.generate' ||
      intent.targetId !== assetId ||
      !asset?.tenantId ||
      asset.tenantId !== intent.tenantId
    )
      throw new StorageLifecycleDenied('PRODUCER_OWNERSHIP_UNKNOWN');
    return intent;
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
