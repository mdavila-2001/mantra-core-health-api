import { Module, type Provider } from '@nestjs/common';
import { AUDIO_STORAGE, AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioStoragePort } from '../domain/audio-storage.port';
import {
  loadAudioTtsConfig,
  type AudioTtsConfig,
} from '../config/audio-tts.env';
import { LocalAudioStorageAdapter } from './local-audio-storage.adapter';
import { S3AudioStorageAdapter } from './s3-audio-storage.adapter';

/**
 * Configuración del dominio de audio, resuelta una sola vez por proceso.
 *
 * Se declara aquí y no en el módulo de negocio porque los **dos** procesos la
 * necesitan: la API para calcular identidades y contabilizar, y el worker para
 * pedirle al proveedor exactamente el audio que la identidad promete.
 */
export const audioTtsConfigProvider: Provider = {
  provide: AUDIO_TTS_CONFIG,
  useFactory: (): AudioTtsConfig => loadAudioTtsConfig(),
};

/**
 * Adaptador de almacenamiento seleccionado por configuración.
 *
 * Se construye **solo** el elegido: en modo `local` no se instancia un cliente de
 * S3 —que abriría un pool de conexiones y resolvería credenciales para nada— y en
 * modo `s3` no se toca el sistema de ficheros.
 */
export const audioStorageProvider: Provider = {
  provide: AUDIO_STORAGE,
  inject: [AUDIO_TTS_CONFIG],
  useFactory: (config: AudioTtsConfig): AudioStoragePort =>
    config.storageDriver === 's3'
      ? new S3AudioStorageAdapter(config)
      : new LocalAudioStorageAdapter(config),
};

/**
 * Almacenamiento del audio, compartido por la API y el worker.
 *
 * Es el único trozo del dominio de audio que el proceso worker importa desde
 * `src/modules`, y la razón es que los dos extremos del mismo objeto viven en
 * procesos distintos: el worker **escribe** los bytes tras sintetizarlos y la API
 * **firma** la URL con la que el cliente los reproduce. Duplicar el adaptador
 * dejaría dos definiciones de la ruta y del formato de URI, y bastaría con que
 * divergieran en la extensión del fichero para que la API firmara URLs de objetos
 * que no existen.
 *
 * No depende de la base de datos, así que importarlo no acerca al worker ni un
 * paso a hablar con PostgreSQL: esa frontera —el worker es un cliente HTTP
 * autenticado más— se mantiene intacta.
 */
@Module({
  providers: [audioTtsConfigProvider, audioStorageProvider],
  exports: [AUDIO_TTS_CONFIG, AUDIO_STORAGE],
})
export class AudioStorageModule {}
