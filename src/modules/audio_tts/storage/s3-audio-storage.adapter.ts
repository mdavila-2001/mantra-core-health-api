import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import { AUDIO_ERROR, AudioDomainError } from '../domain/audio.errors';
import type {
  AudioStoragePort,
  StoreAudioInput,
  StoredAudio,
} from '../domain/audio-storage.port';
import { extensionFor } from './audio-format';

/**
 * Almacenamiento del audio en S3 (o compatible: MinIO, R2, Spaces).
 *
 * Es el adaptador de producción, y no solo por durabilidad: es el que permite
 * entregar el audio a un navegador sin exponer el bucket, mediante una URL firmada
 * con expiración.
 */
@Injectable()
export class S3AudioStorageAdapter implements AudioStoragePort {
  private readonly client: S3Client;

  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
  ) {
    this.client = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint || undefined,
      forcePathStyle: config.s3ForcePathStyle,
      maxAttempts: 3,
      requestHandler: { requestTimeout: config.requestTimeoutMs },
      // Sin credenciales explícitas el SDK usa la cadena por defecto (rol de la
      // instancia, variables del entorno). Es lo correcto en un despliegue con
      // IAM: forzar claves estáticas obligaría a rotarlas a mano.
      credentials: config.s3AccessKeyId
        ? {
            accessKeyId: config.s3AccessKeyId,
            secretAccessKey: config.s3SecretAccessKey,
          }
        : undefined,
    });
  }

  /**
   * Sube el objeto con checksum nativo y cifrado en reposo.
   *
   * `ChecksumSHA256` no es redundante con el hash que se persiste: hace que **S3**
   * rechace el objeto si los bytes no llegaron íntegros, en vez de aceptar un
   * audio corrupto que después quedaría cacheado como válido para siempre.
   */
  async store(input: StoreAudioInput): Promise<StoredAudio> {
    const key = `audio-assets/${input.assetId.slice(0, 2)}/${input.assetId}.${extensionFor(
      input.outputFormat,
    )}`;
    const digest = createHash('sha256').update(input.buffer).digest();

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        ContentLength: input.buffer.length,
        ChecksumSHA256: digest.toString('base64'),
        ...this.encryption(),
      }),
    );

    return {
      storageUri: `s3://${this.config.s3Bucket}/${key}`,
      checksumSha256: digest.toString('hex'),
      sizeBytes: input.buffer.length,
    };
  }

  async exists(storageUri: string): Promise<boolean> {
    const { bucket, key } = parseS3Uri(storageUri);
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async read(storageUri: string): Promise<Buffer> {
    const { bucket, key } = parseS3Uri(storageUri);
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (!response.Body) {
      throw new AudioDomainError(
        'El objeto S3 no tiene contenido',
        AUDIO_ERROR.storageEmptyBody,
      );
    }
    return Buffer.from(await response.Body.transformToByteArray());
  }

  /**
   * URL firmada: un `s3://` no lo sabe consumir ningún cliente HTTP.
   *
   * Se firma bajo demanda y no en cada respuesta de la API a propósito: una URL con
   * expiración cambia en cada llamada, y devolverla siempre rompería el cacheado
   * del cliente por una ventaja que nadie usa hasta el momento de reproducir.
   */
  async publicUrl(storageUri: string, ttlSeconds: number): Promise<string> {
    const { bucket, key } = parseS3Uri(storageUri);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: ttlSeconds },
    );
  }

  async remove(storageUri: string): Promise<void> {
    const { bucket, key } = parseS3Uri(storageUri);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }

  private encryption(): Record<string, string> {
    if (this.config.s3ServerSideEncryption === '') return {};
    if (this.config.s3ServerSideEncryption === 'aws:kms') {
      return {
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: this.config.s3KmsKeyId,
      };
    }
    return { ServerSideEncryption: 'AES256' };
  }
}

/** Parte un `s3://bucket/clave` en sus dos mitades. */
export function parseS3Uri(uri: string): { bucket: string; key: string } {
  const match = /^s3:\/\/([^/]+)\/(.+)$/u.exec(uri);
  if (!match?.[1] || !match[2]) {
    throw new AudioDomainError(
      'URI de S3 inválido',
      AUDIO_ERROR.storageUriInvalid,
    );
  }
  return { bucket: match[1], key: match[2] };
}
