import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../errors/domain.exception';
import type { FileStorageAdapter, StoredFile, StoredFileInput } from './file-storage.adapter';
import { loadStorageEnv } from './storage.env';

const S3_URI_PREFIX = 's3://';
const CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Almacenamiento S3 compatible (AWS S3, Cloudflare R2 y MinIO). */
@Injectable()
export class S3FileStorageAdapter implements FileStorageAdapter {
  private readonly env = loadStorageEnv();
  private readonly client = new S3Client({
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

  async store(input: StoredFileInput): Promise<StoredFile> {
    this.assertConfigured();
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    const key = this.objectKey(contentHash);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.s3.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        Metadata: { sha256: contentHash },
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
      this.logger.warn(
        { operation: 'storage.s3.retrieve', storageUri, err: error },
        'S3-compatible object could not be retrieved',
      );
      throw new ResourceNotFoundException(
        'El contenido no está disponible en el almacenamiento configurado',
        { storageUri },
      );
    }
  }

  private assertConfigured(): void {
    if (!this.env.s3.bucket) {
      throw new Error('FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3');
    }
  }

  private objectKey(contentHash: string): string {
    const prefix = this.env.s3.prefix.replace(/^\/+|\/+$/g, '');
    const relative = `${contentHash.slice(0, 2)}/${contentHash}`;
    return prefix ? `${prefix}/${relative}` : relative;
  }

  private parseOwnedKey(storageUri: string): string {
    const expectedPrefix = `${S3_URI_PREFIX}${this.env.s3.bucket}/`;
    if (!storageUri.startsWith(expectedPrefix)) {
      throw new ResourceNotFoundException('La URI no pertenece al bucket configurado', {
        storageUri,
      });
    }
    const key = storageUri.slice(expectedPrefix.length);
    const contentHash = key.split('/').at(-1) ?? '';
    if (!CONTENT_HASH_PATTERN.test(contentHash) || key !== this.objectKey(contentHash)) {
      throw new ResourceNotFoundException('La URI S3 está mal formada o fuera del prefijo permitido', {
        storageUri,
      });
    }
    return key;
  }
}
