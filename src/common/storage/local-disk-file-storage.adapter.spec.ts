import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ResourceNotFoundException } from '../errors/domain.exception';
import { LocalDiskFileStorageAdapter } from './local-disk-file-storage.adapter';

const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

describe('LocalDiskFileStorageAdapter', () => {
  let root: string;
  let adapter: LocalDiskFileStorageAdapter;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'redesa-storage-'));
    // El adaptador fija su raíz al construirse, así que la variable de entorno
    // debe estar puesta antes de instanciarlo (no al importar el módulo).
    process.env.FILE_STORAGE_LOCAL_DIR = root;
    adapter = new LocalDiskFileStorageAdapter(logger as never);
  });

  afterEach(async () => {
    delete process.env.FILE_STORAGE_LOCAL_DIR;
    await rm(root, { recursive: true, force: true });
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
});
