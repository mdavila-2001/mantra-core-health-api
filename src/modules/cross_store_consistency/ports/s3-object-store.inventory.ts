import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { loadStorageEnv } from '../../../common/storage/storage.env';
import type {
  AlcanceDeInventario,
  InventarioDeObjetos,
  ObjectStoreInventory,
  ObjetoInventariado,
} from './object-store-inventory.port';

/** Backends que hablan S3: MinIO en el stack local, S3/R2 en despliegue. */
const S3_BACKENDS: ReadonlySet<string> = new Set(['s3', 'minio']);

/** Objetos por página; el tope real lo pone `alcance.limit`. */
const PAGINA = 1000;

/**
 * Inventario S3 compatible, para reconciliar el almacén contra Postgres.
 *
 * Reusa la conexión de `FILE_STORAGE_S3_*` igual que el lector del módulo 60, y
 * como él arma el cliente al primer uso para que una configuración incompleta se
 * note en la operación que la necesita y no al importar el módulo.
 *
 * Un fallo del proveedor devuelve `NO_DISPONIBLE`, nunca una lista vacía: son
 * dos cosas distintas y confundirlas informaría «sin huérfanos» cuando lo cierto
 * es «no se pudo mirar».
 */
@Injectable()
export class S3ObjectStoreInventory implements ObjectStoreInventory {
  private client?: S3Client;

  async listar(alcance: AlcanceDeInventario): Promise<InventarioDeObjetos> {
    if (!S3_BACKENDS.has(alcance.backendCode)) {
      return {
        estado: 'NO_DISPONIBLE',
        motivo: `BACKEND_UNSUPPORTED:${alcance.backendCode}`,
      };
    }

    const objetos: ObjetoInventariado[] = [];
    let continuationToken: string | undefined;

    try {
      const client = this.cliente();
      do {
        const restante = alcance.limit - objetos.length;
        if (restante <= 0) return { estado: 'TRUNCADO', objetos };

        const pagina = await client.send(
          new ListObjectsV2Command({
            Bucket: alcance.bucket,
            Prefix: alcance.prefix || undefined,
            MaxKeys: Math.min(PAGINA, restante),
            ContinuationToken: continuationToken,
          }),
        );

        for (const objeto of pagina.Contents ?? []) {
          if (objeto.Key === undefined) continue;
          objetos.push({
            key: objeto.Key,
            sizeBytes: BigInt(objeto.Size ?? 0),
          });
        }

        // Si el proveedor dice que hay más y ya llegamos al tope, el inventario
        // está truncado: lo que no se vio no se puede declarar ausente.
        continuationToken = pagina.IsTruncated
          ? pagina.NextContinuationToken
          : undefined;
        if (continuationToken && objetos.length >= alcance.limit) {
          return { estado: 'TRUNCADO', objetos };
        }
      } while (continuationToken);
    } catch (error) {
      return {
        estado: 'NO_DISPONIBLE',
        motivo:
          error instanceof Error
            ? `PROVIDER_ERROR:${error.name}`
            : 'PROVIDER_ERROR',
      };
    }

    return { estado: 'COMPLETO', objetos };
  }

  /**
   * Arma el cliente S3 la primera vez que hace falta.
   *
   * @returns Cliente conectado a la configuración de `FILE_STORAGE_S3_*`.
   */
  private cliente(): S3Client {
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
