import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
 * Almacenamiento del audio en disco local.
 *
 * Es el adaptador de desarrollo y de despliegues con volumen persistente. En
 * producción sin volumen está bloqueado por configuración: el audio viviría en el
 * sistema de ficheros del contenedor y cada despliegue borraría la caché entera,
 * de modo que el primer usuario de cada versión pagaría la regeneración de todo el
 * catálogo.
 */
@Injectable()
export class LocalAudioStorageAdapter implements AudioStoragePort {
  private readonly baseDir: string;

  constructor(@Inject(AUDIO_TTS_CONFIG) config: AudioTtsConfig) {
    this.baseDir = resolve(config.localStoragePath);
  }

  /**
   * Escritura atómica: fichero temporal y `rename`.
   *
   * Un `writeFile` directo deja el fichero visible a medio escribir, y un lector
   * concurrente —o el propio proceso tras un reinicio— lo tomaría por un audio
   * completo. El checksum se calcula releyendo lo que quedó **en disco** y no
   * sobre el buffer entrante: es lo único que detecta una escritura truncada.
   */
  async store(input: StoreAudioInput): Promise<StoredAudio> {
    const path = this.pathFor(input.assetId, input.outputFormat);
    await mkdir(dirname(path), { recursive: true });

    // Si ya existe, se describe lo existente en vez de reescribirlo: el asset es
    // inmutable por identidad, y reescribirlo solo podría empeorarlo.
    const existing = await this.readIfPresent(path);
    if (existing) return this.describe(path, existing);

    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, input.buffer);
    await rename(temporary, path);
    const written = await readFile(path);
    return this.describe(path, written);
  }

  async exists(storageUri: string): Promise<boolean> {
    try {
      await stat(this.pathOf(storageUri));
      return true;
    } catch {
      return false;
    }
  }

  /** `async` para que un URI inválido rechace la promesa en vez de lanzar de forma síncrona. */
  async read(storageUri: string): Promise<Buffer> {
    return readFile(this.pathOf(storageUri));
  }

  /**
   * El disco local no firma URLs: devuelve el propio `file://`.
   *
   * Se valida igualmente el URI para que un valor manipulado en la base no se
   * propague hacia el cliente como si fuera una referencia legítima.
   */
  async publicUrl(storageUri: string): Promise<string> {
    this.pathOf(storageUri);
    return storageUri;
  }

  async remove(storageUri: string): Promise<void> {
    await rm(this.pathOf(storageUri), { force: true });
  }

  private describe(path: string, content: Buffer): StoredAudio {
    return {
      storageUri: pathToFileURL(path).href,
      checksumSha256: createHash('sha256').update(content).digest('hex'),
      sizeBytes: content.length,
    };
  }

  private async readIfPresent(path: string): Promise<Buffer | null> {
    try {
      return await readFile(path);
    } catch {
      return null;
    }
  }

  /** Dos niveles: 256 subdirectorios evitan un directorio con cientos de miles de ficheros. */
  private pathFor(assetId: string, outputFormat: string): string {
    const shard = assetId.slice(0, 2);
    return join(
      this.baseDir,
      shard,
      `${assetId}.${extensionFor(outputFormat)}`,
    );
  }

  /**
   * Confina toda lectura y todo borrado al directorio base.
   *
   * El URI viene de la base de datos, no de un cliente, pero eso no lo hace de
   * confianza: es el único punto donde un valor manipulado se convertiría en una
   * ruta del sistema de ficheros, y `..` en un `file://` bastaría para leer o
   * borrar cualquier cosa que el proceso alcance.
   */
  private pathOf(uri: string): string {
    let path: string;
    try {
      path = resolve(fileURLToPath(uri));
    } catch {
      throw new AudioDomainError(
        'URI de audio local inválido',
        AUDIO_ERROR.storageUriInvalid,
      );
    }
    const inside = relative(this.baseDir, path);
    if (inside.startsWith('..') || inside.startsWith(sep) || inside === '') {
      throw new AudioDomainError(
        'URI de audio local fuera del directorio permitido',
        AUDIO_ERROR.storagePathEscape,
      );
    }
    return path;
  }
}
