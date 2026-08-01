import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../errors/domain.exception';
import { loadStorageEnv } from './storage.env';
import type {
  FileStorageAdapter,
  StoredFile,
  StoredFileInput,
} from './file-storage.adapter';

/** Esquema de las URI que emite este adaptador. */
const LOCAL_URI_PREFIX = 'file://local/';

/** Un SHA-256 en hexadecimal y nada más. */
const CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Almacenamiento en disco local, direccionado por contenido: la ruta de un
 * archivo es su propio SHA-256, de modo que subir dos veces el mismo contenido
 * no duplica bytes y la URI nunca depende de un nombre que venga del cliente.
 *
 * Esa decisión es también la que cierra el *path traversal*: la URI sólo puede
 * contener 64 caracteres hexadecimales (se valida al recuperar), así que no hay
 * forma de construir una que apunte fuera del directorio raíz — no hace falta
 * confiar en normalizar rutas provenientes de la base de datos.
 *
 * El primer byte del hash se usa como subdirectorio para no dejar decenas de
 * miles de entradas en un único directorio.
 */
@Injectable()
export class LocalDiskFileStorageAdapter implements FileStorageAdapter {
  /** Raíz absoluta bajo la que vive todo el contenido. */
  private readonly rootDir = resolve(loadStorageEnv().localDir);

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LocalDiskFileStorageAdapter.name);
  }

  /**
   * Escribe el contenido y devuelve su URI direccionada por hash.
   *
   * @param input - Bytes y metadatos declarados por el cliente.
   * @returns Dónde quedó el contenido, su tamaño real y su hash.
   */
  async store(input: StoredFileInput): Promise<StoredFile> {
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    const path = this.pathForHash(contentHash);

    await mkdir(dirname(path), { recursive: true });
    // Reescribir un contenido idéntico es inofensivo (mismo hash, mismos bytes)
    // y evita una comprobación de existencia por subida.
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

  /**
   * Recupera el contenido de una URI emitida por este adaptador.
   *
   * @param storageUri - URI previamente devuelta por `store`.
   * @returns Contenido binario almacenado.
   * @throws ResourceNotFoundException si la URI no es de este adaptador, está
   *   mal formada o el contenido ya no está en disco.
   */
  async retrieve(storageUri: string): Promise<Buffer> {
    if (!storageUri.startsWith(LOCAL_URI_PREFIX)) {
      throw new ResourceNotFoundException(
        'La URI no pertenece al almacenamiento local',
        { storageUri },
      );
    }
    const contentHash = storageUri.slice(LOCAL_URI_PREFIX.length);
    if (!CONTENT_HASH_PATTERN.test(contentHash)) {
      throw new ResourceNotFoundException(
        'La URI de almacenamiento local está mal formada',
        { storageUri },
      );
    }

    try {
      return await readFile(this.pathForHash(contentHash));
    } catch {
      throw new ResourceNotFoundException(
        'El contenido no está disponible en el almacenamiento local',
        { storageUri },
      );
    }
  }

  /**
   * Ruta absoluta de un contenido a partir de su hash ya validado.
   *
   * @param contentHash - SHA-256 hexadecimal del contenido.
   * @returns Ruta absoluta bajo el directorio raíz.
   */
  private pathForHash(contentHash: string): string {
    return join(this.rootDir, contentHash.slice(0, 2), contentHash);
  }
}
