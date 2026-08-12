import { Module, type Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  AUDIO_TTS_CONFIG,
  AUDIO_TTS_PROVIDER,
  type TtsProviderPort,
} from '../../../modules/audio_tts/domain';
import type { AudioTtsConfig } from '../../../modules/audio_tts/config/audio-tts.env';
import { AudioStorageModule } from '../../../modules/audio_tts/storage';
import { ElevenLabsHttpClient } from './elevenlabs-http.client';
import { ElevenLabsTtsAdapter } from './elevenlabs-tts.adapter';
import { FakeTtsAdapter } from './fake-tts.adapter';
import { DisabledTtsAdapter } from './disabled-tts.adapter';
import { AudioGenerationJob } from './audio-generation.job';
import { AudioReconcileJob } from './audio-reconcile.job';

/**
 * Proveedor de síntesis seleccionado por configuración.
 *
 * Se construye **solo** el elegido: con `disabled` o `fake` no se instancia el
 * cliente de ElevenLabs, así que el proceso no necesita la credencial ni la
 * resuelve. El defecto es `disabled` —un módulo que gasta dinero por llamada se
 * enciende a propósito, no por olvido.
 */
const ttsProvider: Provider = {
  provide: AUDIO_TTS_PROVIDER,
  inject: [AUDIO_TTS_CONFIG, PinoLogger],
  useFactory: (config: AudioTtsConfig, logger: PinoLogger): TtsProviderPort => {
    if (config.provider === 'elevenlabs') {
      return new ElevenLabsTtsAdapter(
        config,
        new ElevenLabsHttpClient(config),
        logger,
      );
    }
    if (config.provider === 'fake') return new FakeTtsAdapter();
    return new DisabledTtsAdapter();
  },
};

/**
 * Proceso worker del dominio de audio.
 *
 * Es el único de los 21 workers que importa un módulo de `src/modules`
 * (`AudioStorageModule`), y la razón es concreta: los dos extremos del mismo
 * objeto viven en procesos distintos —el worker escribe los bytes, la API firma la
 * URL con la que se reproducen—, así que duplicar el adaptador dejaría dos
 * definiciones de la ruta y del formato de URI que basta con que divergan en la
 * extensión para que la API firme URLs de objetos inexistentes. Ese módulo no
 * depende de la base de datos, de modo que la frontera del backend —el worker es
 * un cliente HTTP autenticado más, nunca un cliente de PostgreSQL— queda intacta.
 *
 * Contiene el único secreto que la API no tiene: `ELEVENLABS_API_KEY`. Y le falta
 * el único que la API sí tiene: `AUDIO_TTS_DATA_KEY`. Ninguno de los dos procesos
 * puede hacer el trabajo del otro, que es lo que se quiere de una credencial de
 * pago por uso y de una clave de cifrado de datos personales.
 *
 * `ElevenLabsTtsAdapter` **no** se registra como provider de clase: lo instancia la
 * fábrica de arriba. Registrarlo además haría que NestJS lo construyera siempre,
 * incluso con el proveedor desactivado, y con él su cliente HTTP.
 */
@Module({
  imports: [AudioStorageModule],
  providers: [ttsProvider, AudioGenerationJob, AudioReconcileJob],
})
export class AudioTtsWorkerModule {}
