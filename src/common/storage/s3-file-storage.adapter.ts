import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../errors/domain.exception';
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
import { loadStorageEnv } from './storage.env';
import {
  bindPhysicalIdentity,
  bindReservationIdentity,
  type PhysicalObjectIdentity,
} from './physical-object-identity';
import {
  assertDestructiveRuntimeAuthorized,
  StorageLifecycleDenied,
} from './storage-lifecycle.protocol';

const S3_URI_PREFIX = 's3://';
const CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Almacenamiento S3 compatible (AWS S3, Cloudflare R2 y MinIO). */
@Injectable()
export class S3FileStorageAdapter implements FileStorageAdapter {
  private readonly env = loadStorageEnv();
  private readonly client = new S3Client({
    // Mutation retries need distinct durable grants, never hidden SDK retries.
    maxAttempts: 1,
    region: this.env.s3.region,
    endpoint: this.env.s3.endpoint || undefined,
    forcePathStyle: this.env.s3.forcePathStyle,
    credentials:
      this.env.s3.accessKeyId && this.env.s3.secretAccessKey
        ? {
            accessKeyId: this.env.s3.accessKeyId,
            secretAccessKey: this.env.s3.secretAccessKey,
          }
        : undefined,
  });
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(S3FileStorageAdapter.name);
  }

  resolvePhysicalIdentity(
    storageUri: string,
    providerVersionId?: string,
  ): PhysicalObjectIdentity {
    try {
      const key = this.parseOwnedKey(storageUri);
      if (
        this.env.lifecycleBinding &&
        this.env.lifecycleBinding.physicalContainer !== this.env.s3.bucket
      )
        return { kind: 'UNKNOWN', reasonCode: 'CONTAINER_BINDING_MISMATCH' };
      return bindPhysicalIdentity(
        this.env.lifecycleBinding,
        's3',
        JSON.stringify([
          this.env.s3.endpoint,
          this.env.s3.region,
          this.env.s3.bucket,
        ]),
        key,
        providerVersionId,
      );
    } catch {
      return { kind: 'UNKNOWN', reasonCode: 'LOCATOR_UNOWNED' };
    }
  }

  plan(input: StoredFileInput): PlannedStoredFile {
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    const key = this.objectKey(contentHash);
    const identity =
      this.env.lifecycleBinding?.physicalContainer !== this.env.s3.bucket
        ? { kind: 'UNKNOWN' as const, reasonCode: 'CONTAINER_BINDING_MISMATCH' }
        : bindReservationIdentity(
            this.env.lifecycleBinding,
            's3',
            JSON.stringify([
              this.env.s3.endpoint,
              this.env.s3.region,
              this.env.s3.bucket,
            ]),
            key,
          );
    return {
      contentHash,
      sizeBytes: input.buffer.byteLength,
      storageUri: `${S3_URI_PREFIX}${this.env.s3.bucket}/${key}`,
      identity,
    };
  }

  resolveReservationIdentity(
    storageUri: string,
  ): PlannedStoredFile['identity'] {
    try {
      if (this.env.lifecycleBinding?.physicalContainer !== this.env.s3.bucket)
        return { kind: 'UNKNOWN', reasonCode: 'CONTAINER_BINDING_MISMATCH' };
      return bindReservationIdentity(
        this.env.lifecycleBinding,
        's3',
        JSON.stringify([
          this.env.s3.endpoint,
          this.env.s3.region,
          this.env.s3.bucket,
        ]),
        this.parseOwnedKey(storageUri),
      );
    } catch {
      return { kind: 'UNKNOWN', reasonCode: 'LOCATOR_UNOWNED' };
    }
  }

  async inspect(storageUri: string): Promise<StoragePresence> {
    let headConfirmed = false;
    try {
      const key = this.parseOwnedKey(storageUri);
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.env.s3.bucket, Key: key }),
      );
      headConfirmed = true;
      const identity = this.resolvePhysicalIdentity(storageUri, head.VersionId);
      if (identity.kind === 'UNKNOWN') return { state: 'UNKNOWN' };
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.env.s3.bucket,
          Key: key,
          VersionId: head.VersionId,
        }),
      );
      if (!result.Body) return { state: 'UNKNOWN' };
      const buffer = Buffer.from(await result.Body.transformToByteArray());
      const contentHash = createHash('sha256').update(buffer).digest('hex');
      if (
        key !== this.objectKey(contentHash) ||
        buffer.byteLength !== head.ContentLength ||
        result.VersionId !== head.VersionId
      )
        return { state: 'UNKNOWN' };
      return {
        state: 'PRESENT',
        stored: {
          storageUri,
          contentHash,
          sizeBytes: buffer.byteLength,
          physicalIdentity: identity,
        },
      };
    } catch (error) {
      return {
        state: !headConfirmed && isNotFound(error) ? 'ABSENT' : 'UNKNOWN',
      };
    }
  }

  async store(
    input: StoredFileInput,
    permit?: StorageWritePermit,
  ): Promise<StoredFile> {
    this.assertConfigured();
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    const key = this.objectKey(contentHash);
    if (this.env.lifecycleBinding) {
      const plan = this.plan(input);
      if (!permit || plan.identity.kind === 'UNKNOWN')
        throw new StorageLifecycleDenied('WRITE_RESERVATION_REQUIRED');
      await permit.consume(plan.identity, contentHash, input.buffer.byteLength);
    }
    const result = await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.s3.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        Metadata: { sha256: contentHash },
        ...(this.env.lifecycleBinding ? { IfNoneMatch: '*' } : {}),
      }),
    );
    this.logger.info(
      {
        operation: 'storage.s3.store',
        bucket: this.env.s3.bucket,
        contentHash,
        sizeBytes: input.buffer.byteLength,
      },
      'File stored in S3-compatible storage',
    );
    return {
      storageUri: `${S3_URI_PREFIX}${this.env.s3.bucket}/${key}`,
      sizeBytes: input.buffer.byteLength,
      contentHash,
      ...(this.env.lifecycleBinding
        ? {
            physicalIdentity: this.resolvePhysicalIdentity(
              `${S3_URI_PREFIX}${this.env.s3.bucket}/${key}`,
              result.VersionId,
            ),
          }
        : {}),
    };
  }
  async retrieve(storageUri: string): Promise<Buffer> {
    this.assertConfigured();
    const key = this.parseOwnedKey(storageUri);
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.env.s3.bucket, Key: key }),
      );
      if (!result.Body) throw new Error('S3 object body is empty');
      return Buffer.from(await result.Body.transformToByteArray());
    } catch (error) {
      if (isNotFound(error))
        throw new ResourceNotFoundException(
          'El contenido no está disponible en el almacenamiento configurado',
          { storageUri },
        );
      this.logger.error(
        { operation: 'storage.s3.retrieve', storageUri, err: error },
        'S3-compatible storage failed',
      );
      throw error;
    }
  }
  async exists(storageUri: string): Promise<boolean> {
    this.assertConfigured();
    const key = this.parseOwnedKey(storageUri);
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.env.s3.bucket, Key: key }),
      );
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }
  async delete(
    storageUri: string,
    permit?: StorageDeletePermit,
  ): Promise<StorageDeleteReceipt> {
    assertDestructiveRuntimeAuthorized(storageUri);
    this.assertConfigured();
    const key = this.parseOwnedKey(storageUri);
    const selector = permit?.identity.versionSelector;
    const versionId =
      selector?.kind === 'VERSION' ? selector.providerVersionId : undefined;
    const identity = this.resolvePhysicalIdentity(storageUri, versionId);
    if (!permit || identity.kind !== 'KNOWN')
      throw new StorageLifecycleDenied('DELETE_PERMIT_REQUIRED');
    permit.consume(identity);
    const receipt = (
      state: StorageDeleteReceipt['state'],
    ): StorageDeleteReceipt => ({
      state,
      identity,
      ioAttemptId: permit.ioAttemptId,
    });
    try {
      const result = await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.env.s3.bucket,
          Key: key,
          VersionId: versionId,
        }),
      );
      if (
        result.$metadata.httpStatusCode !== 204 ||
        (versionId !== undefined && result.VersionId !== versionId) ||
        (versionId === undefined && result.DeleteMarker === true)
      )
        return receipt('UNKNOWN');
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      // Definitive authorization rejection is retryable only through all guards;
      // 5xx, network errors, timeout and missing responses are not proof of failure.
      return receipt(status === 403 ? 'NOT_DELETED' : 'UNKNOWN');
    }
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.env.s3.bucket,
          Key: key,
          VersionId: versionId,
        }),
      );
      return receipt('UNKNOWN');
    } catch (error) {
      return receipt(isNotFound(error) ? 'DELETED' : 'UNKNOWN');
    }
  }
  private assertConfigured(): void {
    if (!this.env.s3.bucket)
      throw new Error(
        'FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3',
      );
  }
  private objectKey(contentHash: string): string {
    const prefix = this.env.s3.prefix.replace(/^\/+|\/+$/g, '');
    const relative = `${contentHash.slice(0, 2)}/${contentHash}`;
    return prefix ? `${prefix}/${relative}` : relative;
  }
  private parseOwnedKey(storageUri: string): string {
    const expected = `${S3_URI_PREFIX}${this.env.s3.bucket}/`;
    if (!storageUri.startsWith(expected))
      throw new ResourceNotFoundException(
        'La URI no pertenece al bucket configurado',
        { storageUri },
      );
    const key = storageUri.slice(expected.length);
    const hash = key.split('/').at(-1) ?? '';
    if (!CONTENT_HASH_PATTERN.test(hash) || key !== this.objectKey(hash))
      throw new ResourceNotFoundException(
        'La URI S3 está mal formada o fuera del prefijo permitido',
        { storageUri },
      );
    return key;
  }
}
function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    value.name === 'NotFound' ||
    value.name === 'NoSuchKey' ||
    value.$metadata?.httpStatusCode === 404
  );
}
