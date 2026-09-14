import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { StorageWorkerPublicationService } from './storage-worker-publication.service';
import { AudioAssets } from '../../modules/audio_assets/entities/audio_assets.entity';
import { AUDIO_GENERATION_JOB_TYPE } from '../../modules/audio_assets/domain/audio-queue.constants';
import { CONCEPTS } from '../constants/concepts';
import type { StorageIntent } from './storage-lifecycle.protocol';

function build() {
  const identity = {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'synthetic',
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic',
    exactObjectKey: 'synthetic',
    versionSelector: { kind: 'UNVERSIONED' },
  } as const;
  const asset = {
    id: 'synthetic-asset',
    tenantId: 'synthetic-tenant',
    generationStatus: 'GENERATING',
  };
  const job = {
    id: 'synthetic-job',
    tenantId: asset.tenantId,
    jobType: AUDIO_GENERATION_JOB_TYPE,
    statusConceptId: CONCEPTS.JOB_RUNNING,
    payloadJson: { assetId: asset.id },
  };
  const input = {
    operationId: job.id,
    ownerToken: 'synthetic-owner-token',
    storageUri: 'synthetic://object',
    contentHash: 'a'.repeat(64),
    sizeBytes: 9,
  };
  const reservation = {
    operationId: input.operationId,
    ownerToken: input.ownerToken,
    identity,
  };
  const intent = {
    ...input,
    schemaVersion: 1,
    identity,
    phase: 'STORE_DISPATCHED',
    producer: 'audio.generate',
    targetId: asset.id,
    tenantId: asset.tenantId,
    storedIdentity: identity,
  } as StorageIntent;
  const tx = {} as EntityManager;
  const em = {
    fork: () => ({
      findOne: async (entity: unknown) =>
        entity === AudioAssets ? asset : job,
    }),
  };
  const coordinator = {
    begin: jest
      .fn<() => Promise<typeof reservation>>()
      .mockResolvedValue(reservation),
    inspectReservation: jest
      .fn<() => Promise<StorageIntent>>()
      .mockResolvedValue(intent),
    reuse: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    abort: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    dispatch: jest
      .fn<() => Promise<string>>()
      .mockResolvedValue('synthetic-attempt'),
    settle: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    commit: jest
      .fn<
        (
          reservation: unknown,
          publish: (tx: EntityManager) => Promise<unknown>,
        ) => Promise<unknown>
      >()
      .mockImplementation(async (_reservation, publish) =>
        intent.phase === 'COMMITTED'
          ? { duplicate: true }
          : { duplicate: false, result: await publish(tx) },
      ),
  };
  const stored = { ...input, physicalIdentity: identity };
  const storage = {
    resolveReservationIdentity: jest.fn(() => identity),
    inspect: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ state: 'PRESENT', stored }),
    delete: jest.fn(),
  };
  const service = new StorageWorkerPublicationService(
    em as never,
    coordinator as never,
    storage as never,
  );
  const publish = jest
    .fn<(tx: EntityManager) => Promise<string>>()
    .mockResolvedValue('synthetic-ready');
  const proof = {
    reservation,
    physicalIdentity: identity,
    ioAttemptId: 'synthetic-attempt',
  };
  return {
    service,
    input,
    asset,
    job,
    intent,
    coordinator,
    storage,
    publish,
    proof,
    tx,
    stored,
  };
}
describe('API audio publication bridge', () => {
  it('requires a RUNNING job bound to the same asset and tenant', async () => {
    const test = build();
    await test.service.beginAudio(test.asset.id, test.input);
    expect(test.coordinator.begin).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: test.asset.tenantId,
        producer: 'audio.generate',
      }),
    );
    expect(test.coordinator.reuse).toHaveBeenCalled();
  });
  it.each(['cross-tenant', 'unknown-tenant', 'wrong-target'])(
    'denies %s before reservation',
    async (state) => {
      const test = build();
      if (state === 'cross-tenant')
        test.job.tenantId = 'synthetic-other-tenant';
      if (state === 'unknown-tenant') test.asset.tenantId = '';
      if (state === 'wrong-target')
        test.job.payloadJson.assetId = 'synthetic-other-asset';
      await expect(
        test.service.beginAudio(test.asset.id, test.input),
      ).rejects.toThrow('PRODUCER_OWNERSHIP_UNKNOWN');
      expect(test.coordinator.begin).not.toHaveBeenCalled();
    },
  );
  it('publishes ready metadata in the coordinator transaction after a proven receipt', async () => {
    const test = build();
    await test.service.finalizeAudio(
      test.asset.id,
      test.stored,
      test.proof,
      test.publish,
    );
    expect(test.coordinator.settle).toHaveBeenCalled();
    expect(test.publish).toHaveBeenCalledWith(test.tx);
    expect(test.storage.delete).not.toHaveBeenCalled();
  });
  it('suppresses a duplicate generated callback', async () => {
    const test = build();
    test.intent.phase = 'COMMITTED';
    await expect(
      test.service.finalizeAudio(
        test.asset.id,
        test.stored,
        test.proof,
        test.publish,
      ),
    ).resolves.toEqual({ duplicate: true });
    expect(test.storage.inspect).not.toHaveBeenCalled();
    expect(test.publish).not.toHaveBeenCalled();
  });
  it('denies remote UNKNOWN without settling or publishing', async () => {
    const test = build();
    test.storage.inspect.mockResolvedValue({ state: 'UNKNOWN' });
    await expect(
      test.service.finalizeAudio(
        test.asset.id,
        test.stored,
        test.proof,
        test.publish,
      ),
    ).rejects.toThrow('REMOTE_STATE_UNKNOWN');
    expect(test.coordinator.settle).not.toHaveBeenCalled();
    expect(test.publish).not.toHaveBeenCalled();
  });
  it('cannot substitute bytes, version or owner on a retry', async () => {
    const test = build();
    test.stored.contentHash = 'b'.repeat(64);
    await expect(
      test.service.finalizeAudio(
        test.asset.id,
        test.stored,
        test.proof,
        test.publish,
      ),
    ).rejects.toThrow('STORE_RECEIPT_MISMATCH');
    expect(test.publish).not.toHaveBeenCalled();
  });
});
