import { Injectable } from '@nestjs/common';
import {
  TtsProviderError,
  type TtsProviderHealth,
  type TtsProviderPort,
} from '../../../modules/audio_tts/domain';

/**
 * Proveedor por defecto: no sintetiza nada y lo dice.
 *
 * Es el adaptador que queda cuando `AUDIO_TTS_PROVIDER=disabled`, que es el
 * **valor por defecto**. Un módulo que gasta dinero por llamada no debe quedar
 * activo porque alguien olvidó apagarlo; hay que encenderlo a propósito.
 *
 * Falla de forma **no reintentable**: reintentar no va a configurar el proveedor,
 * y con el asset cerrado su reserva de presupuesto vuelve enseguida en vez de
 * quedar apartada. En la práctica el worker apenas lo ve: con el proveedor
 * desactivado, `AudioBudgetPolicy.checkGates` deniega antes de crear el asset y el
 * resolutor devuelve `FALLBACK`/`UNAVAILABLE` sin encolar nada.
 */
@Injectable()
export class DisabledTtsAdapter implements TtsProviderPort {
  readonly providerName = 'disabled';

  async synthesize(): Promise<never> {
    throw new TtsProviderError(
      'La síntesis de voz está desactivada (AUDIO_TTS_PROVIDER=disabled)',
      'AUDIO_PROVIDER_DISABLED',
      false,
    );
  }

  async health(): Promise<TtsProviderHealth> {
    return { provider: this.providerName, configured: false };
  }
}
