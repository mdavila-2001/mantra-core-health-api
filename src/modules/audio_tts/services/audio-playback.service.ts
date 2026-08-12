import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AUDIO_STORAGE, AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import type { AudioStoragePort } from '../domain/audio-storage.port';

/**
 * Convierte la referencia canónica de un audio en algo que un cliente puede
 * reproducir.
 *
 * Está separado del resolutor a propósito: `storageUri` es el dato que se
 * **persiste** y la URL firmada es un artefacto **efímero** que caduca. Mezclarlos
 * en una sola operación llevaría a guardar URLs con expiración en la base o a
 * devolverlas donde no se van a usar, y a firmar en cada respuesta —lo que rompe
 * el cacheado del cliente, porque la URL cambia cada vez.
 */
@Injectable()
export class AudioPlaybackService {
  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    @Inject(AUDIO_STORAGE) private readonly storage: AudioStoragePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioPlaybackService.name);
  }

  /**
   * Firma una URL de reproducción.
   *
   * @returns la URL, o `undefined` si no hay audio o la firma falla. Nunca lanza:
   *          esto se llama en el camino de una respuesta que ya tiene su resultado,
   *          y un fallo al firmar no puede convertir un `READY` en un error del
   *          usuario. El cliente conserva el `storageUri` y puede volver a pedirla.
   */
  async playbackUrl(storageUri?: string): Promise<string | undefined> {
    if (!storageUri) return undefined;
    try {
      return await this.storage.publicUrl(
        storageUri,
        this.config.signedUrlTtlSeconds,
      );
    } catch (error) {
      this.logger.error(
        { event: 'audio.playback.sign_failed', storageUri, err: error },
        'No fue posible firmar la URL de reproducción del audio',
      );
      return undefined;
    }
  }
}
