import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { ResourceNotFoundException } from '../errors/domain.exception';
import { LocalDiskFileStorageAdapter } from './local-disk-file-storage.adapter';

const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

describe('LocalDiskFileStorageAdapter', () => {
  let root: string;
  let adapter: LocalDiskFileStorageAdapter;
  let fs: {
    readFile: ReturnType<typeof fn>;
    writeFile: ReturnType<typeof fn>;
    mkdir: ReturnType<typeof fn>;
    access: ReturnType<typeof fn>;
    unlink: ReturnType<typeof fn>;
    realpath: ReturnType<typeof fn>;
    lstat: ReturnType<typeof fn>;
  };
  let files: Map<string, Buffer>;

  beforeEach(() => {
    root = resolve('synthetic-in-memory-storage');
    files = new Map();
    const missing = () =>
      Object.assign(new Error('synthetic missing'), { code: 'ENOENT' });
    fs = {
      readFile: fn(async (path: string) => {
        if (!files.has(path)) throw missing();
        return files.get(path);
      }),
      writeFile: fn(async (path: string, bytes: Buffer) => {
        files.set(path, bytes);
      }),
      mkdir: fn(async () => undefined),
      access: fn(async (path: string) => {
        if (!files.has(path)) throw missing();
      }),
      unlink: fn(async () => {
        throw new Error('NO DESTRUCTIVE I/O IN TESTS');
      }),
      realpath: fn(async (path: string) => path),
      lstat: fn(async (path: string) => {
        if (!files.has(path)) throw missing();
        return { isFile: () => true, isSymbolicLink: () => false, nlink: 1 };
      }),
    };
    // El adaptador fija su raíz al construirse, así que la variable de entorno
    // debe estar puesta antes de instanciarlo (no al importar el módulo).
    process.env.FILE_STORAGE_LOCAL_DIR = root;
    adapter = new LocalDiskFileStorageAdapter(logger as never);
    Object.defineProperty(adapter, 'fs', { value: fs });
  });

  afterEach(() => {
    delete process.env.FILE_STORAGE_LOCAL_DIR;
    delete process.env.FILE_STORAGE_LIFECYCLE_BINDING;
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('stores content addressed by its sha256 and reads it back', async () => {
    const buffer = Buffer.from('contenido del carnet');
    const expectedHash = createHash('sha256').update(buffer).digest('hex');

    const stored = await adapter.store({
      buffer,
      originalName: 'carnet.jpg',
      mimeType: 'image/jpeg',
    });

    expect(stored).toEqual({
      storageUri: `file://local/${expectedHash}`,
      sizeBytes: buffer.byteLength,
      contentHash: expectedHash,
    });
    await expect(adapter.retrieve(stored.storageUri)).resolves.toEqual(buffer);
  });

  it('gives identical content the same URI (content addressing dedupes)', async () => {
    const input = {
      buffer: Buffer.from('mismo contenido'),
      originalName: 'a.jpg',
      mimeType: 'image/jpeg',
    };

    const first = await adapter.store(input);
    const second = await adapter.store({ ...input, originalName: 'b.jpg' });

    expect(second.storageUri).toBe(first.storageUri);
  });

  it('rejects a URI that is not a plain sha256, so no path can escape the root', async () => {
    await expect(
      adapter.retrieve('file://local/../../etc/passwd'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects a URI from another storage backend', async () => {
    await expect(adapter.retrieve('s3://bucket/object')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('fails when the content is no longer on disk', async () => {
    const missing = `file://local/${'0'.repeat(64)}`;

    await expect(adapter.retrieve(missing)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('blocks physical delete even without configuration', async () => {
    await expect(
      adapter.delete(`file://local/${'0'.repeat(64)}`),
    ).rejects.toThrow('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  function protect() {
    process.env.FILE_STORAGE_LIFECYCLE_BINDING = JSON.stringify({
      schemaVersion: 1,
      revision: 'synthetic-v1',
      adapter: 'local',
      configuredLocation: root,
      backendIdentity: 'synthetic-volume',
      physicalContainer: 'synthetic-root',
      versioning: 'UNVERSIONED',
      authorityVerified: true,
      aliasesVerified: true,
      producerCoverageVerified: true,
      legacyOperationsSettled: true,
      localFilesystemVerified: true,
    });
    adapter = new LocalDiskFileStorageAdapter(logger as never);
    Object.defineProperty(adapter, 'fs', { value: fs });
  }

  it('requires and consumes a reservation before any protected physical write', async () => {
    protect();
    const input = {
      buffer: Buffer.from('synthetic-evidence'),
      originalName: 'test.txt',
      mimeType: 'text/plain',
    };
    await expect(adapter.store(input)).rejects.toThrow(
      'WRITE_RESERVATION_REQUIRED',
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
    const consume = fn(async () => {
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
    await adapter.store(input, { consume });
    expect(consume).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      input.buffer,
      { flag: 'wx' },
    );
  });

  it('does not confuse an unmounted root or access denied with an absent object', async () => {
    protect();
    fs.realpath.mockRejectedValue(
      Object.assign(new Error('synthetic missing root'), { code: 'ENOENT' }),
    );
    await expect(
      adapter.inspect(`file://local/${'a'.repeat(64)}`),
    ).resolves.toEqual({ state: 'UNKNOWN' });
    fs.realpath.mockImplementation(async (path: string) => path);
    fs.lstat.mockRejectedValue(
      Object.assign(new Error('synthetic denied'), { code: 'EACCES' }),
    );
    await expect(
      adapter.inspect(`file://local/${'a'.repeat(64)}`),
    ).resolves.toEqual({ state: 'UNKNOWN' });
  });
});
