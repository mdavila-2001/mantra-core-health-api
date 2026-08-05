import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../errors/domain.exception';
import { loadStorageEnv } from './storage.env';
import type {
  FileStorageAdapter,
  StoredFile,
  StoredFileInput,
} from './file-storage.adapter';

/** Esquema de las URI que emite este adaptador. */
const S3_URI_PREFIX = 's3://';

/** Un SHA-256 en hexadecimal y nada más. */
const CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Almacenamiento en un bucket compatible con S3 (MinIO en local, S3 en la nube).
 *
 * Existía el hueco pero no la pieza: `FILE_STORAGE_ADAPTER` aceptaba un solo valor, `@aws-sdk/
 * client-s3` estaba instalado sin que nadie lo importara, y MinIO se levantaba en
 * `docker-compose` y en CI sin que ningún archivo llegara nunca a él. Todo el subsistema estaba
 * provisionado para esto y sólo faltaba el adaptador.
 *
 * Sigue el mismo criterio que el adaptador local, y no por simetría estética:
 *
 * - **Direccionado por contenido.** La clave del objeto es el SHA-256 de los bytes, así que
 *   subir dos veces lo mismo no duplica almacenamiento y la URI nunca depende de un nombre que
 *   venga del cliente.
 * - **La URI se valida al recuperar.** Sólo se acepta `s3://<bucket>/<aa>/<hash>` con 64
 *   hexadecimales: una URI guardada en la base no puede hacer que el backend lea un objeto
 *   arbitrario del bucket.
 * - **El primer byte del hash es el prefijo**, para no dejar decenas de miles de claves planas.
 *
 * Los bytes del cuerpo se leen con `transformToByteArray()`, que es lo que expone el SDK v3 sin
 * atarse a un stream de Node — el mismo código sirve en Lambda o en un runtime web.
 */
@Injectable()
export class S3FileStorageAdapter implements FileStorageAdapter {
  /** Configuración fijada al arrancar; Joi ya la validó. */
  private readonly config = loadStorageEnv().s3;

  /** Cliente reutilizado: crear uno por subida tiraría el pool de conexiones. */
  private readonly client = new S3Client({
    region: this.config.region,
    endpoint: this.config.endpoint,
    // MinIO no resuelve buckets por subdominio: sin esto, cada petición iría a
    // `http://<bucket>.minio:9000` y fallaría la resolución DNS dentro de la red de compose.
    forcePathStyle: this.config.forcePathStyle,
    credentials: {
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    },
  });

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(S3FileStorageAdapter.name);
  }

  /**
   * Sube el contenido y devuelve su URI direccionada por hash.
   *
   * @param input - Bytes y metadatos declarados por el cliente.
   * @returns Dónde quedó el contenido, su tamaño real y su hash.
   */
  async store(input: StoredFileInput): Promise<StoredFile> {
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    const key = this.keyForHash(contentHash);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        // El nombre original viaja como metadato y no como clave: es dato del cliente y no
        // debe poder decidir dónde se escribe.
        Metadata: { 'original-name': encodeURIComponent(input.originalName) },
      }),
    );

    this.logger.info(
      {
        operation: 'storage.s3.store',
        contentHash,
        sizeBytes: input.buffer.byteLength,
        bucket: this.config.bucket,
      },
      'File stored on S3-compatible storage',
    );

    return {
      storageUri: `${S3_URI_PREFIX}${this.config.bucket}/${key}`,
      sizeBytes: input.buffer.byteLength,
      contentHash,
    };
  }

  /**
   * Recupera el contenido de una URI emitida por este adaptador.
   *
   * @param storageUri - URI previamente devuelta por `store`.
   * @returns Contenido binario almacenado.
   * @throws ResourceNotFoundException si la URI no es de este adaptador, está mal formada, o el
   *   objeto ya no está en el bucket.
   */
  async retrieve(storageUri: string): Promise<Buffer> {
    const key = this.keyFromUri(storageUri);

    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) {
        throw new Error('respuesta sin cuerpo');
      }
      return Buffer.from(bytes);
    } catch {
      throw new ResourceNotFoundException(
        'El contenido no está disponible en el almacenamiento S3',
        { storageUri },
      );
    }
  }

  /**
   * Valida la URI y devuelve la clave del objeto.
   *
   * @param storageUri - URI a interpretar.
   * @returns Clave dentro del bucket configurado.
   * @throws ResourceNotFoundException si no pertenece a este adaptador o está mal formada.
   */
  private keyFromUri(storageUri: string): string {
    const expected = `${S3_URI_PREFIX}${this.config.bucket}/`;
    if (!storageUri.startsWith(expected)) {
      throw new ResourceNotFoundException(
        'La URI no pertenece al bucket configurado',
        { storageUri },
      );
    }
    const key = storageUri.slice(expected.length);
    const [prefix, contentHash] = key.split('/');
    if (
      !contentHash ||
      !CONTENT_HASH_PATTERN.test(contentHash) ||
      prefix !== contentHash.slice(0, 2)
    ) {
      throw new ResourceNotFoundException(
        'La URI de almacenamiento S3 está mal formada',
        { storageUri },
      );
    }
    return key;
  }

  /**
   * Clave del objeto a partir de un hash ya validado.
   *
   * @param contentHash - SHA-256 hexadecimal del contenido.
   * @returns Clave con el prefijo de dos caracteres.
   */
  private keyForHash(contentHash: string): string {
    return `${contentHash.slice(0, 2)}/${contentHash}`;
  }
}
