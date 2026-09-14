import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  access,
  lstat,
  realpath,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../errors/domain.exception';
import { loadStorageEnv } from './storage.env';
import {
  bindPhysicalIdentity,
  bindReservationIdentity,
  type PhysicalObjectIdentity,
} from './physical-object-identity';
import type {
  FileStorageAdapter,
  StoredFile,
  StoredFileInput,
  PlannedStoredFile,
  StoragePresence,
  StorageWritePermit,
  StorageDeletePermit,
  StorageDeleteReceipt,
} from './file-storage.adapter';
import {
  assertDestructiveRuntimeAuthorized,
  StorageLifecycleDenied,
} from './storage-lifecycle.protocol';

const LOCAL_URI_PREFIX = 'file://local/';
const CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Storage local content-addressed, con validación estricta contra path traversal. */
@Injectable()
export class LocalDiskFileStorageAdapter implements FileStorageAdapter {
  /** Native port is replaceable only by controlled unit-test doubles. */
  private readonly fs = {
    access,
    lstat,
    realpath,
    mkdir,
    readFile,
    unlink,
    writeFile,
  };
  private readonly lifecycleBinding = loadStorageEnv().lifecycleBinding;
  private readonly rootDir = resolve(loadStorageEnv().localDir);
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LocalDiskFileStorageAdapter.name);
  }

  resolvePhysicalIdentity(
    storageUri: string,
    providerVersionId?: string,
  ): PhysicalObjectIdentity {
    try {
      const hash = this.hashFromUri(storageUri);
      return bindPhysicalIdentity(
        this.lifecycleBinding,
        'local',
        this.rootDir,
        `${hash.slice(0, 2)}/${hash}`,
        providerVersionId,
      );
    } catch {
      return { kind: 'UNKNOWN', reasonCode: 'LOCATOR_UNOWNED' };
    }
  }

  plan(input: StoredFileInput): PlannedStoredFile {
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    return {
      contentHash,
      sizeBytes: input.buffer.byteLength,
      storageUri: `${LOCAL_URI_PREFIX}${contentHash}`,
      identity: bindReservationIdentity(
        this.lifecycleBinding,
        'local',
        this.rootDir,
        `${contentHash.slice(0, 2)}/${contentHash}`,
      ),
    };
  }

  resolveReservationIdentity(
    storageUri: string,
  ): PlannedStoredFile['identity'] {
    return this.resolvePhysicalIdentity(storageUri);
  }

  async inspect(storageUri: string): Promise<StoragePresence> {
    const identity = this.resolvePhysicalIdentity(storageUri);
    if (identity.kind === 'UNKNOWN') return { state: 'UNKNOWN' };
    try {
      if ((await this.fs.realpath(this.rootDir)) !== this.rootDir)
        return { state: 'UNKNOWN' };
    } catch {
      return { state: 'UNKNOWN' };
    }
    try {
      const path = this.pathForHash(this.hashFromUri(storageUri));
      // A missing child is not proof that a missing/unmounted root is safe.
      try {
        if ((await this.fs.realpath(dirname(path))) !== dirname(path))
          return { state: 'UNKNOWN' };
      } catch (error) {
        return { state: isMissingFile(error) ? 'ABSENT' : 'UNKNOWN' };
      }
      const stat = await this.fs.lstat(path);
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        stat.nlink !== 1 ||
        (await this.fs.realpath(dirname(path))) !== dirname(path)
      )
        return { state: 'UNKNOWN' };
      const bytes = await this.fs.readFile(path);
      const contentHash = createHash('sha256').update(bytes).digest('hex');
      if (contentHash !== this.hashFromUri(storageUri))
        return { state: 'UNKNOWN' };
      return {
        state: 'PRESENT',
        stored: {
          storageUri,
          contentHash,
          sizeBytes: bytes.byteLength,
          physicalIdentity: identity,
        },
      };
    } catch (error) {
      return { state: isMissingFile(error) ? 'ABSENT' : 'UNKNOWN' };
    }
  }

  async store(
    input: StoredFileInput,
    permit?: StorageWritePermit,
  ): Promise<StoredFile> {
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    if (this.lifecycleBinding) {
      const plan = this.plan(input);
      if (!permit || plan.identity.kind === 'UNKNOWN')
        throw new StorageLifecycleDenied('WRITE_RESERVATION_REQUIRED');
      await permit.consume(plan.identity, contentHash, input.buffer.byteLength);
    }
    const path = this.pathForHash(contentHash);
    await this.fs.mkdir(dirname(path), { recursive: true });
    await this.fs.writeFile(
      path,
      input.buffer,
      this.lifecycleBinding ? { flag: 'wx' } : undefined,
    );
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
      ...(this.lifecycleBinding
        ? {
            physicalIdentity: this.resolvePhysicalIdentity(
              `${LOCAL_URI_PREFIX}${contentHash}`,
            ),
          }
        : {}),
    };
  }

  async retrieve(storageUri: string): Promise<Buffer> {
    const hash = this.hashFromUri(storageUri);
    try {
      return await this.fs.readFile(this.pathForHash(hash));
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
      await this.fs.access(this.pathForHash(this.hashFromUri(storageUri)));
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      return false;
    }
  }

  async delete(
    storageUri: string,
    permit?: StorageDeletePermit,
  ): Promise<StorageDeleteReceipt> {
    assertDestructiveRuntimeAuthorized(storageUri);
    const identity = this.resolvePhysicalIdentity(storageUri);
    if (!permit || identity.kind !== 'KNOWN')
      throw new StorageLifecycleDenied('DELETE_PERMIT_REQUIRED');
    const before = await this.inspect(storageUri);
    if (before.state === 'UNKNOWN')
      throw new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN');
    permit.consume(identity);
    const receipt = (
      state: StorageDeleteReceipt['state'],
    ): StorageDeleteReceipt => ({
      state,
      identity,
      ioAttemptId: permit.ioAttemptId,
    });
    const path = this.pathForHash(this.hashFromUri(storageUri));
    try {
      await this.fs.unlink(path);
    } catch (error) {
      if (!isMissingFile(error)) {
        // Only a definitive native rejection proves that this unlink did not happen.
        const code = (error as { code?: unknown })?.code;
        return receipt(
          ['EACCES', 'EPERM', 'EROFS'].includes(String(code))
            ? 'NOT_DELETED'
            : 'UNKNOWN',
        );
      }
    }
    return receipt(
      (await this.inspect(storageUri)).state === 'ABSENT'
        ? 'DELETED'
        : 'UNKNOWN',
    );
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
