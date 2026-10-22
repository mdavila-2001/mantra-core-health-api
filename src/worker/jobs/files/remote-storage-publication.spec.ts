/* eslint-disable @typescript-eslint/unbound-method -- Only inspect Jest spies; no detached method invocation. */
import { jest } from '@jest/globals';
import { publishAudioBytes } from './remote-storage-publication';
import type { FileStorageAdapter } from '../../../common/storage/file-storage.adapter';
import type { RemotePublicationProof } from '../../../common/storage/storage-worker-publication.service';

function build() {
  process.env.FILE_STORAGE_LIFECYCLE_BINDING = '{}';
  const identity = {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'synthetic',
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic',
    exactObjectKey: 'synthetic',
    versionSelector: { kind: 'UNVERSIONED' },
  } as const;
  const input = {
    buffer: Buffer.from('synthetic'),
    originalName: 'synthetic.mp3',
    mimeType: 'audio/mpeg',
  };
  const stored = {
    storageUri: 'synthetic://object',
    physicalIdentity: identity,
    contentHash: 'a'.repeat(64),
    sizeBytes: 9,
  };
  const reservation = {
    identity,
    operationId: 'synthetic-job',
    ownerToken: 'synthetic-owner-token',
  };
  const calls: string[] = [];
  const post = jest
    .fn<(path: string, body: unknown, options?: unknown) => Promise<unknown>>()
    .mockImplementation(async (path) => {
      calls.push(path.split('/').at(-1)!);
      return path.endsWith('/begin')
        ? { reservation }
        : { ioAttemptId: 'synthetic-attempt' };
    });
  const storage: FileStorageAdapter = {
    plan: () => ({ ...stored, identity }),
    store: jest
      .fn<FileStorageAdapter['store']>()
      .mockImplementation(async (_input, permit) => {
        await permit!.consume(identity, stored.contentHash, stored.sizeBytes);
        calls.push('NATIVE_FAKE');
        return stored;
      }),
    retrieve: jest.fn<FileStorageAdapter['retrieve']>(),
    exists: jest.fn<FileStorageAdapter['exists']>(),
    delete: jest.fn<FileStorageAdapter['delete']>(),
  };
  const publish = jest
    .fn<(result: unknown, proof?: RemotePublicationProof) => Promise<void>>()
    .mockImplementation(async () => {
      calls.push('GENERATED_CALLBACK');
    });
  const run = () =>
    publishAudioBytes(
      { post } as never,
      storage,
      'synthetic-asset',
      'synthetic-job',
      input,
      publish,
    );
  return { run, calls, post, storage, publish, stored, reservation };
}
afterEach(() => {
  delete process.env.FILE_STORAGE_LIFECYCLE_BINDING;
});
describe('remote audio publication, no network or native storage', () => {
  it('reserves and dispatches before the one native attempt and returns a receipt', async () => {
    const test = build();
    await test.run();
    expect(test.calls).toEqual([
      'begin',
      'dispatch',
      'NATIVE_FAKE',
      'GENERATED_CALLBACK',
    ]);
    expect(test.post.mock.calls[1][2]).toBeUndefined(); // Dispatch never gets HTTP retry permission.
    expect(test.publish).toHaveBeenCalledWith(
      test.stored,
      expect.objectContaining({
        ioAttemptId: 'synthetic-attempt',
        physicalIdentity: test.stored.physicalIdentity,
      }),
    );
    expect(test.storage.delete).not.toHaveBeenCalled();
  });
  it('reuses PRESENT without a native attempt', async () => {
    const test = build();
    test.post.mockResolvedValueOnce({
      reservation: test.reservation,
      present: test.stored,
    });
    await test.run();
    expect(test.storage.store).not.toHaveBeenCalled();
    expect(test.post).toHaveBeenCalledTimes(1);
  });
  it('lost dispatch response quarantines through API without writing bytes or retrying', async () => {
    const test = build();
    test.post
      .mockResolvedValueOnce({ reservation: test.reservation })
      .mockRejectedValueOnce(new Error('synthetic timeout'))
      .mockResolvedValueOnce({});
    await expect(test.run()).rejects.toThrow('synthetic timeout');
    expect(test.calls).not.toContain('NATIVE_FAKE');
    expect(test.publish).not.toHaveBeenCalled();
    expect(
      test.post.mock.calls.map((call) => call[0].split('/').at(-1)),
    ).toEqual(['begin', 'dispatch', 'abort']);
    expect(test.storage.delete).not.toHaveBeenCalled();
  });
  it('ambiguous generated callback requests quarantine, never compensating delete', async () => {
    const test = build();
    test.publish.mockRejectedValue(new Error('synthetic callback timeout'));
    await expect(test.run()).rejects.toThrow('synthetic callback timeout');
    expect(test.calls).toEqual(['begin', 'dispatch', 'NATIVE_FAKE', 'abort']);
    expect(test.storage.delete).not.toHaveBeenCalled();
  });
  it('rejects an adapter that skips permit consumption before publishing any reference', async () => {
    const test = build();
    jest.mocked(test.storage.store).mockResolvedValue(test.stored);
    await expect(test.run()).rejects.toThrow('ADAPTER_DID_NOT_CONSUME_PERMIT');
    expect(test.publish).not.toHaveBeenCalled();
  });
});
