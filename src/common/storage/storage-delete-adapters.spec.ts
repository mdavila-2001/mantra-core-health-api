import { jest } from '@jest/globals';
import { resolve } from 'node:path';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { StorageDeletePermit } from './file-storage.adapter';
import type { KnownPhysicalObjectIdentity } from './physical-object-identity';

// This file installs controlled native ports BEFORE any adapter method can run.
// No production gate override is exported or enabled by environment variables.
jest.unstable_mockModule('./storage-lifecycle.protocol', () => ({
  assertDestructiveRuntimeAuthorized: () => undefined,
  StorageLifecycleDenied: class extends Error {
    constructor(readonly reasonCode: string) {
      super(reasonCode);
    }
  },
}));
let LocalDiskFileStorageAdapter: typeof import('./local-disk-file-storage.adapter').LocalDiskFileStorageAdapter;
let S3FileStorageAdapter: typeof import('./s3-file-storage.adapter').S3FileStorageAdapter;
beforeAll(async () => {
  const localModule: string = './local-disk-file-storage.adapter';
  const s3Module: string = './s3-file-storage.adapter';
  ({ LocalDiskFileStorageAdapter } = (await import(
    localModule
  )) as typeof import('./local-disk-file-storage.adapter'));
  ({ S3FileStorageAdapter } = (await import(
    s3Module
  )) as typeof import('./s3-file-storage.adapter'));
});
const logger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };
const hash = 'a'.repeat(64);
function configure(adapter: 'local' | 's3', versioned = false) {
  process.env.FILE_STORAGE_LOCAL_DIR = resolve('synthetic-no-disk');
  process.env.FILE_STORAGE_S3_BUCKET = 'synthetic';
  process.env.FILE_STORAGE_S3_PREFIX = '';
  process.env.FILE_STORAGE_S3_ENDPOINT = 'http://127.0.0.1:19999';
  process.env.FILE_STORAGE_S3_REGION = 'us-east-1';
  process.env.FILE_STORAGE_LIFECYCLE_BINDING = JSON.stringify({
    schemaVersion: 1,
    revision: 'synthetic',
    adapter,
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic',
    configuredLocation:
      adapter === 'local'
        ? process.env.FILE_STORAGE_LOCAL_DIR
        : JSON.stringify(['http://127.0.0.1:19999', 'us-east-1', 'synthetic']),
    versioning: versioned ? 'VERSIONED' : 'UNVERSIONED',
    authorityVerified: true,
    aliasesVerified: true,
    producerCoverageVerified: true,
    legacyOperationsSettled: true,
    localFilesystemVerified: true,
  });
}
function permit(identity: KnownPhysicalObjectIdentity): StorageDeletePermit {
  return { identity, ioAttemptId: 'synthetic-attempt', consume: jest.fn() };
}
function local() {
  configure('local');
  const adapter = new LocalDiskFileStorageAdapter(logger as never);
  const unlink = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  Object.defineProperty(adapter, 'fs', { value: { unlink } });
  const inspect = jest
    .spyOn(adapter, 'inspect')
    .mockResolvedValue({ state: 'ABSENT' });
  const uri = `file://local/${hash}`;
  const grant = permit(
    adapter.resolvePhysicalIdentity(uri) as KnownPhysicalObjectIdentity,
  );
  return { adapter, unlink, inspect, uri, grant };
}
function s3(versioned = true) {
  configure('s3', versioned);
  const adapter = new S3FileStorageAdapter(logger as never);
  const send = jest.fn<(command: unknown) => Promise<unknown>>();
  Object.defineProperty(adapter, 'client', { value: { send } });
  const uri = `s3://synthetic/aa/${hash}`;
  const grant = permit(
    adapter.resolvePhysicalIdentity(
      uri,
      versioned ? 'exact-version' : undefined,
    ) as KnownPhysicalObjectIdentity,
  );
  return { adapter, send, uri, grant };
}
afterEach(() => {
  for (const key of [
    'FILE_STORAGE_LOCAL_DIR',
    'FILE_STORAGE_S3_BUCKET',
    'FILE_STORAGE_S3_PREFIX',
    'FILE_STORAGE_S3_ENDPOINT',
    'FILE_STORAGE_S3_REGION',
    'FILE_STORAGE_LIFECYCLE_BINDING',
  ])
    delete process.env[key];
});
describe('delete receipt verification — filesystem and SDK fully controlled', () => {
  it('local confirms unlink plus exact-path absence, with permit consumed once', async () => {
    const f = local();
    await expect(f.adapter.delete(f.uri, f.grant)).resolves.toMatchObject({
      state: 'DELETED',
      ioAttemptId: 'synthetic-attempt',
    });
    expect(f.unlink).toHaveBeenCalledTimes(1);
    expect(f.grant.consume).toHaveBeenCalledTimes(1);
    expect(f.inspect).toHaveBeenCalledTimes(2);
  });
  it('local never trusts access()/exists() false as deletion proof', async () => {
    const f = local();
    f.inspect
      .mockResolvedValueOnce({ state: 'ABSENT' })
      .mockResolvedValue({ state: 'UNKNOWN' });
    await expect(f.adapter.delete(f.uri, f.grant)).resolves.toMatchObject({
      state: 'UNKNOWN',
    });
  });
  it.each(['EACCES', 'EPERM', 'EROFS', 'EIO'])(
    'local classifies native %s conservatively',
    async (code) => {
      const f = local();
      f.unlink.mockRejectedValue({ code });
      await expect(f.adapter.delete(f.uri, f.grant)).resolves.toMatchObject({
        state: code === 'EIO' ? 'UNKNOWN' : 'NOT_DELETED',
      });
    },
  );
  it('local unknown mount/link or missing permit denies before unlink', async () => {
    const f = local();
    await expect(f.adapter.delete(f.uri)).rejects.toThrow(
      'DELETE_PERMIT_REQUIRED',
    );
    f.inspect.mockResolvedValue({ state: 'UNKNOWN' });
    await expect(f.adapter.delete(f.uri, f.grant)).rejects.toThrow(
      'PHYSICAL_IDENTITY_UNKNOWN',
    );
    expect(f.unlink).not.toHaveBeenCalled();
  });
  it('S3 pins DELETE and verification HEAD to the SAME provider version, exactly once', async () => {
    const f = s3();
    f.send
      .mockResolvedValueOnce({
        $metadata: { httpStatusCode: 204 },
        VersionId: 'exact-version',
      })
      .mockRejectedValueOnce({
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      });
    await expect(f.adapter.delete(f.uri, f.grant)).resolves.toMatchObject({
      state: 'DELETED',
    });
    expect(f.send).toHaveBeenCalledTimes(2);
    expect(f.send.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(f.send.mock.calls[1][0]).toBeInstanceOf(HeadObjectCommand);
    for (const [command] of f.send.mock.calls)
      expect((command as DeleteObjectCommand).input.VersionId).toBe(
        'exact-version',
      );
  });
  it.each([
    'missing-version',
    'marker',
    'unconfirmed-status',
    'still-present',
    'head-error',
  ])('S3 %s is not PURGED', async (mode) => {
    const f = s3(mode !== 'marker');
    f.send.mockResolvedValueOnce({
      $metadata: { httpStatusCode: mode === 'unconfirmed-status' ? 200 : 204 },
      VersionId:
        mode === 'missing-version' || mode === 'marker'
          ? undefined
          : 'exact-version',
      DeleteMarker: mode === 'marker',
    });
    if (mode === 'head-error')
      f.send.mockRejectedValueOnce({ name: 'TimeoutError' });
    else f.send.mockResolvedValueOnce({});
    await expect(f.adapter.delete(f.uri, f.grant)).resolves.toMatchObject({
      state: 'UNKNOWN',
    });
  });
  it.each([403, 500, undefined])(
    'S3 HTTP %s has no silent SDK retry',
    async (httpStatusCode) => {
      const f = s3();
      f.send.mockRejectedValue({ $metadata: { httpStatusCode } });
      await expect(f.adapter.delete(f.uri, f.grant)).resolves.toMatchObject({
        state: httpStatusCode === 403 ? 'NOT_DELETED' : 'UNKNOWN',
      });
      expect(f.send).toHaveBeenCalledTimes(1);
    },
  );
  it('S3 raw/unknown version cannot dispatch even when the test replaces the runtime gate', async () => {
    const f = s3();
    await expect(f.adapter.delete(f.uri)).rejects.toThrow(
      'DELETE_PERMIT_REQUIRED',
    );
    expect(f.send).not.toHaveBeenCalled();
  });
});
