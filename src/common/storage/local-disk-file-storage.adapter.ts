import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../errors/domain.exception';
import { loadStorageEnv } from './storage.env';
import type {
  FileStorageAdapter,
  StoredFile,
  StoredFileInput,
} from './file-storage.adapter';

const LOCAL_URI_PREFIX = 'file://local/';
const CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Storage local content-addressed, con validación estricta contra path traversal. */
@Injectable()
export class LocalDiskFileStorageAdapter implements FileStorageAdapter {
  private readonly rootDir = resolve(loadStorageEnv().localDir);
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LocalDiskFileStorageAdapter.name);
  }

  async store(input: StoredFileInput): Promise<StoredFile> {
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    const path = this.pathForHash(contentHash);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.buffer);
    this.logger.info(
      {
        operation: 'storage.local.store',
        contentHash,
        sizeBytes: input.buffer.byteLength,
      },
      'File stored on local disk',
    );
    return {
      storageUri: `${LOCAL_URI_PREFIX}${contentHash}`,
      sizeBytes: input.buffer.byteLength,
      contentHash,
    };
  }

  async retrieve(storageUri: string): Promise<Buffer> {
    const hash = this.hashFromUri(storageUri);
    try {
      return await readFile(this.pathForHash(hash));
    } catch (error) {
      if (isMissingFile(error))
        throw new ResourceNotFoundException(
          'El contenido no está disponible en el almacenamiento local',
          { storageUri },
        );
      throw error;
    }
  }

  async exists(storageUri: string): Promise<boolean> {
    try {
      await access(this.pathForHash(this.hashFromUri(storageUri)));
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      return false;
    }
  }

  async delete(storageUri: string): Promise<void> {
    const path = this.pathForHash(this.hashFromUri(storageUri));
    try {
      await unlink(path);
    } catch (error) {
      if (isMissingFile(error)) return;
      throw error;
    }
  }

  private hashFromUri(storageUri: string): string {
    if (!storageUri.startsWith(LOCAL_URI_PREFIX))
      throw new ResourceNotFoundException(
        'La URI no pertenece al almacenamiento local',
        { storageUri },
      );
    const hash = storageUri.slice(LOCAL_URI_PREFIX.length);
    if (!CONTENT_HASH_PATTERN.test(hash))
      throw new ResourceNotFoundException(
        'La URI de almacenamiento local está mal formada',
        { storageUri },
      );
    return hash;
  }
  private pathForHash(contentHash: string): string {
    return join(this.rootDir, contentHash.slice(0, 2), contentHash);
  }
}
function isMissingFile(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ENOENT',
  );
}
