/* eslint-disable @typescript-eslint/unbound-method -- Only inspect Jest spies; no detached method invocation. */
import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { StoragePublicationService } from './storage-publication.service';
import type {
  FileStorageAdapter,
  StorageWritePermit,
  StoredFileInput,
} from './file-storage.adapter';
import { StorageLifecycleCoordinator } from './storage-lifecycle-coordinator.service';
import type { KnownPhysicalObjectIdentity } from './physical-object-identity';

const identity: KnownPhysicalObjectIdentity = {
  kind: 'KNOWN',
  protocolVersion: 1,
  bindingRevision: 'synthetic-v1',
  backendIdentity: 'synthetic',
  physicalContainer: 'synthetic-bucket',
  exactObjectKey: 'aa/synthetic',
  versionSelector: { kind: 'UNVERSIONED' },
};
const stored = {
  storageUri: 's3://synthetic-bucket/aa/synthetic',
  contentHash: 'a'.repeat(64),
  sizeBytes: 4,
  physicalIdentity: identity,
};
const input = {
  buffer: Buffer.from('test'),
  originalName: 'synthetic',
  mimeType: 'text/plain',
};
function build() {
  process.env.FILE_STORAGE_LIFECYCLE_BINDING = JSON.stringify({
    schemaVersion: 1,
    revision: 'synthetic-v1',
    adapter: 's3',
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic-bucket',
    configuredLocation: 'synthetic-location',
    versioning: 'UNVERSIONED',
    authorityVerified: true,
    aliasesVerified: true,
    producerCoverageVerified: true,
    legacyOperationsSettled: true,
  });
  const order: string[] = [];
  const tx = {} as EntityManager;
  const coordinator = new StorageLifecycleCoordinator(
    {} as EntityManager,
    {} as never,
  );
  jest.spyOn(coordinator, 'begin').mockImplementation(async (data) => {
    order.push('BEGIN_COMMITTED');
    return data;
  });
  jest.spyOn(coordinator, 'dispatch').mockImplementation(async () => {
    order.push('DISPATCH_COMMITTED');
    return 'synthetic-attempt';
  });
  jest.spyOn(coordinator, 'settle').mockImplementation(async () => {
    order.push('SETTLED');
  });
  jest.spyOn(coordinator, 'reuse').mockImplementation(async () => {
    order.push('REUSE_SETTLED');
  });
  jest.spyOn(coordinator, 'abort').mockImplementation(async () => {
    order.push('ABORT_OR_QUARANTINE');
  });
  jest
    .spyOn(coordinator, 'commit')
    .mockImplementation(async (_reservation, callback) => {
      order.push('PUBLICATION_TX');
      const result = await callback(tx);
      order.push('METADATA_AND_RESERVATION_COMMITTED');
      return { targetId: 'synthetic-target', duplicate: false, result };
    });
  const adapter: FileStorageAdapter = {
    plan: () => ({ ...stored, identity }),
    inspect: jest
      .fn<FileStorageAdapter['inspect'] & object>()
      .mockResolvedValue({ state: 'ABSENT' }),
    store: jest
      .fn<FileStorageAdapter['store']>()
      .mockImplementation(
        async (_input: StoredFileInput, permit?: StorageWritePermit) => {
          if (!permit) throw new Error('missing test permit');
          await permit.consume(identity, stored.contentHash, stored.sizeBytes);
          order.push('NATIVE_PUT_FAKE');
          return stored;
        },
      ),
    retrieve: jest.fn<FileStorageAdapter['retrieve']>(),
    exists: jest.fn<FileStorageAdapter['exists']>(),
    delete: jest.fn<FileStorageAdapter['delete']>(),
  };
  const service = new StoragePublicationService(
    {} as EntityManager,
    adapter,
    coordinator,
  );
  const publish = jest
    .fn<() => Promise<string>>()
    .mockImplementation(async () => {
      order.push('METADATA');
      return 'synthetic-result';
    });
  const run = () =>
    service.publish(
      input,
      {
        tenantId: 'synthetic-tenant',
        producer: 'synthetic-producer',
        targetId: 'synthetic-target',
      },
      publish,
    );
  return { service, adapter, coordinator, order, publish, run, tx };
}
afterEach(() => {
  delete process.env.FILE_STORAGE_LIFECYCLE_BINDING;
});
describe('producer coordination using controlled adapters only', () => {
  it('reserves before write and publishes metadata + close in the same transaction', async () => {
    const test = build();
    await expect(test.run()).resolves.toBe('synthetic-result');
    expect(test.order).toEqual([
      'BEGIN_COMMITTED',
      'DISPATCH_COMMITTED',
      'NATIVE_PUT_FAKE',
      'SETTLED',
      'PUBLICATION_TX',
      'METADATA',
      'METADATA_AND_RESERVATION_COMMITTED',
    ]);
    expect(test.publish).toHaveBeenCalledWith(
      expect.objectContaining({ tx: test.tx, targetId: 'synthetic-target' }),
    );
    expect(test.adapter.delete).not.toHaveBeenCalled();
  });
  it('reuses a settled PRESENT shared object without a second physical write', async () => {
    const test = build();
    jest
      .mocked(test.adapter.inspect!)
      .mockResolvedValue({ state: 'PRESENT', stored });
    await test.run();
    expect(test.adapter.store).not.toHaveBeenCalled();
    expect(test.coordinator.dispatch).not.toHaveBeenCalled();
    expect(test.coordinator.reuse).toHaveBeenCalled();
  });
  it('denies UNKNOWN remote state without issuing a native attempt', async () => {
    const test = build();
    jest.mocked(test.adapter.inspect!).mockResolvedValue({ state: 'UNKNOWN' });
    await expect(test.run()).rejects.toThrow('REMOTE_STATE_UNKNOWN');
    expect(test.adapter.store).not.toHaveBeenCalled();
    expect(test.publish).not.toHaveBeenCalled();
  });
  it('does not compensate a timeout by deleting bytes or publishing metadata', async () => {
    const test = build();
    jest
      .mocked(test.adapter.store)
      .mockImplementation(async (_input, permit) => {
        await permit!.consume(identity, stored.contentHash, stored.sizeBytes);
        throw new Error('synthetic remote timeout');
      });
    await expect(test.run()).rejects.toThrow('synthetic remote timeout');
    expect(test.coordinator.abort).toHaveBeenCalled();
    expect(test.coordinator.settle).not.toHaveBeenCalled();
    expect(test.publish).not.toHaveBeenCalled();
    expect(test.adapter.delete).not.toHaveBeenCalled();
  });
  it('rejects a reused permit and metadata publication after ambiguous completion', async () => {
    const test = build();
    jest
      .mocked(test.adapter.store)
      .mockImplementation(async (_input, permit) => {
        await permit!.consume(identity, stored.contentHash, stored.sizeBytes);
        await permit!.consume(identity, stored.contentHash, stored.sizeBytes);
        return stored;
      });
    await expect(test.run()).rejects.toThrow('WRITE_PERMIT_MISMATCH');
    expect(test.coordinator.dispatch).toHaveBeenCalledTimes(1);
    expect(test.publish).not.toHaveBeenCalled();
  });
  it('denies physical UNKNOWN before creating any reservation', async () => {
    const test = build();
    test.adapter.plan = () => ({
      ...stored,
      identity: { kind: 'UNKNOWN', reasonCode: 'VERSION_UNKNOWN' },
    });
    await expect(test.run()).rejects.toThrow('PHYSICAL_IDENTITY_UNKNOWN');
    expect(test.coordinator.begin).not.toHaveBeenCalled();
  });
});
