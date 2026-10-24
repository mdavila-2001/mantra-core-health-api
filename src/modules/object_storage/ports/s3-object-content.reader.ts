import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { loadStorageEnv } from '../../../common/storage/storage.env';
import {
  ObjectContentUnavailableError,
  type ObjectContentDigest,
  type ObjectContentLocator,
  type ObjectContentReader,
  type ObjectContentStat,
  type ObjectContentStream,
} from './object-content.port';

/** Backends que hablan S3: MinIO en el stack local, S3/R2 en despliegue. */
const S3_BACKENDS: ReadonlySet<string> = new Set(['s3', 'minio']);

/**
 * Lector S3 compatible para los objetos del catálogo.
 *
 * Reusa la conexión de `FILE_STORAGE_S3_*` (endpoint, región y credenciales)
 * pero no su bucket: el bucket es el del espacio de nombres registrado. El
 * cliente se arma al primer uso, igual que el secreto de firma de archivos,
 * para que la configuración que falte se note en la operación que la necesita
 * y no al importar el módulo.
 */
@Injectable()
export class S3ObjectContentReader implements ObjectContentReader {
  private client?: S3Client;

  async stat(locator: ObjectContentLocator): Promise<ObjectContentStat | null> {
    const client = this.clientFor(locator);
    try {
      const head = await client.send(
        new HeadObjectCommand({
          Bucket: locator.bucket,
          Key: locator.key,
          VersionId: locator.providerVersionId,
        }),
      );
      if (head.ContentLength === undefined) {
        throw new ObjectContentUnavailableError('SIZE_UNKNOWN');
      }
      return {
        sizeBytes: BigInt(head.ContentLength),
        providerVersionId: providerVersion(head.VersionId),
        etag: head.ETag,
      };
    } catch (error) {
      if (error instanceof ObjectContentUnavailableError) throw error;
      if (isNotFound(error)) return null;
      throw new ObjectContentUnavailableError('PROVIDER_ERROR');
    }
  }

  async digest(
    locator: ObjectContentLocator,
    expectedEtag?: string,
  ): Promise<ObjectContentDigest> {
    const { body } = await this.get(locator, expectedEtag);
    const hash = createHash('sha256');
    let size = 0n;
    try {
      for await (const chunk of body) {
        const bytes = chunk as Buffer;
        hash.update(bytes);
        size += BigInt(bytes.byteLength);
      }
    } catch {
      throw new ObjectContentUnavailableError('READ_INTERRUPTED');
    }
    return { sha256: hash.digest('hex'), sizeBytes: size };
  }

  open(locator: ObjectContentLocator): Promise<ObjectContentStream> {
    return this.get(locator);
  }

  private async get(
    locator: ObjectContentLocator,
    expectedEtag?: string,
  ): Promise<ObjectContentStream> {
    const client = this.clientFor(locator);
    try {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: locator.bucket,
          Key: locator.key,
          VersionId: locator.providerVersionId,
          IfMatch: expectedEtag,
        }),
      );
      if (!(result.Body instanceof Readable)) {
        throw new ObjectContentUnavailableError('BODY_UNREADABLE');
      }
      return { body: result.Body, contentLength: result.ContentLength };
    } catch (error) {
      if (error instanceof ObjectContentUnavailableError) throw error;
      throw new ObjectContentUnavailableError(
        isNotFound(error) ? 'NOT_FOUND' : 'PROVIDER_ERROR',
      );
    }
  }

  private clientFor(locator: ObjectContentLocator): S3Client {
    if (!S3_BACKENDS.has(locator.backendCode)) {
      // Sin lector para ese backend no hay verificación posible: se corta.
      throw new ObjectContentUnavailableError('BACKEND_UNSUPPORTED');
    }
    if (!this.client) {
      const { s3 } = loadStorageEnv();
      this.client = new S3Client({
        region: s3.region,
        endpoint: s3.endpoint || undefined,
        forcePathStyle: s3.forcePathStyle,
        credentials:
          s3.accessKeyId && s3.secretAccessKey
            ? {
                accessKeyId: s3.accessKeyId,
                secretAccessKey: s3.secretAccessKey,
              }
            : undefined,
      });
    }
    return this.client;
  }
}

/** MinIO sin versionado responde `"null"`: eso no es una versión. */
function providerVersion(value: string | undefined): string | undefined {
  return value && value !== 'null' ? value : undefined;
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
