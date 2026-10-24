import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import {
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { S3FileStorageAdapter } from './s3-file-storage.adapter';
import { loadStorageEnv } from './storage.env';

const input = {
  buffer: Buffer.from('synthetic'),
  originalName: 'synthetic.txt',
  mimeType: 'text/plain',
};
function build(versioning: 'VERSIONED' | 'UNVERSIONED' = 'VERSIONED') {
  process.env.FILE_STORAGE_S3_BUCKET = 'synthetic-lifecycle';
  process.env.FILE_STORAGE_S3_PREFIX = '';
  const env = loadStorageEnv();
  process.env.FILE_STORAGE_LIFECYCLE_BINDING = JSON.stringify({
    schemaVersion: 1,
    revision: 'synthetic',
    adapter: 's3',
    backendIdentity: 'synthetic',
    physicalContainer: env.s3.bucket,
    configuredLocation: JSON.stringify([
      env.s3.endpoint,
      env.s3.region,
      env.s3.bucket,
    ]),
    versioning,
    authorityVerified: true,
    aliasesVerified: true,
    producerCoverageVerified: true,
    legacyOperationsSettled: true,
  });
  const adapter = new S3FileStorageAdapter({
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as never);
  const send = jest.fn<(command: unknown) => Promise<unknown>>();
  Object.defineProperty(adapter, 'client', { value: { send } });
  const uri = adapter.plan(input).storageUri;
  return { adapter, send, uri };
}
afterEach(() => {
  delete process.env.FILE_STORAGE_LIFECYCLE_BINDING;
  delete process.env.FILE_STORAGE_S3_BUCKET;
  delete process.env.FILE_STORAGE_S3_PREFIX;
});
describe('native S3 lifecycle boundaries using a fake SDK transport', () => {
  it('requires a permit before PUT and binds the real returned provider version', async () => {
    const test = build();
    test.send.mockResolvedValue({ VersionId: 'synthetic-version' });
    await expect(test.adapter.store(input)).rejects.toThrow(
      'WRITE_RESERVATION_REQUIRED',
    );
    expect(test.send).not.toHaveBeenCalled();
    const consume = jest
      .fn<() => Promise<void>>()
      .mockImplementation(async () => {
        expect(test.send).not.toHaveBeenCalled();
      });
    const stored = await test.adapter.store(input, { consume });
    expect(consume).toHaveBeenCalledWith(
      expect.objectContaining({ versionSelector: { kind: 'PENDING_VERSION' } }),
      createHash('sha256').update(input.buffer).digest('hex'),
      9,
    );
    expect(test.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(
      (test.send.mock.calls[0][0] as PutObjectCommand).input.IfNoneMatch,
    ).toBe('*');
    expect(stored.physicalIdentity).toMatchObject({
      versionSelector: {
        kind: 'VERSION',
        providerVersionId: 'synthetic-version',
      },
    });
  });
  it('never translates a successful HEAD followed by missing GET into ABSENT', async () => {
    const test = build();
    test.send
      .mockResolvedValueOnce({ VersionId: 'synthetic-v', ContentLength: 9 })
      .mockRejectedValueOnce({ name: 'NoSuchKey' });
    await expect(test.adapter.inspect(test.uri)).resolves.toEqual({
      state: 'UNKNOWN',
    });
    expect(test.send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    expect(test.send.mock.calls[1][0]).toBeInstanceOf(GetObjectCommand);
    expect(
      (test.send.mock.calls[1][0] as GetObjectCommand).input.VersionId,
    ).toBe('synthetic-v');
  });
  it('rejects version ambiguity and mismatching bytes on inspection', async () => {
    const test = build();
    test.send.mockResolvedValueOnce({ ContentLength: 9 });
    await expect(test.adapter.inspect(test.uri)).resolves.toEqual({
      state: 'UNKNOWN',
    });
    test.send
      .mockResolvedValueOnce({ VersionId: 'synthetic-v', ContentLength: 9 })
      .mockResolvedValueOnce({
        VersionId: 'synthetic-other-v',
        Body: { transformToByteArray: async () => input.buffer },
      });
    await expect(test.adapter.inspect(test.uri)).resolves.toEqual({
      state: 'UNKNOWN',
    });
  });
  it('blocks raw delete even with a valid bound identity', async () => {
    const test = build();
    await expect(test.adapter.delete(test.uri)).rejects.toThrow(
      'DESTRUCTIVE_RUNTIME_GATE_BLOCKED',
    );
    expect(test.send).not.toHaveBeenCalled();
  });
});
