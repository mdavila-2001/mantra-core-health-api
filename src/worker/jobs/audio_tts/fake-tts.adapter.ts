import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  TtsProviderError,
  type TtsProviderHealth,
  type TtsProviderPort,
  type TtsSynthesisInput,
  type TtsSynthesisResult,
} from '../../../modules/audio_tts/domain';
import { mimeTypeFor } from '../../../modules/audio_tts/storage';

/** Cabecera mínima de una trama MP3 válida: `0xFF 0xFB` + bitrate/sample rate. */
const MP3_FRAME_HEADER = Buffer.from([0xff, 0xfb, 0x90, 0x64]);

/**
 * Proveedor de pruebas: produce bytes con forma de audio sin llamar a nadie.
 *
 * Sirve para ejercitar el flujo completo —reclamo, almacenamiento, checksum,
 * contabilidad, degradación— sin credencial y sin gasto. Lo que produce **no es
 * voz**: es un fichero con la cabecera correcta y relleno determinista derivado
 * del texto, suficiente para que `looksLikeAudio` lo acepte y para que dos
 * generaciones del mismo texto den el mismo checksum.
 *
 * Está **prohibido en producción** por `assertAudioTtsEnvCoherent`, y la razón es
 * concreta: un asset `READY` no se regenera nunca, así que un despliegue con este
 * adaptador dejaría el catálogo entero cacheado con audio que no suena, y
 * arreglarlo obligaría a borrar filas a mano.
 */
@Injectable()
export class FakeTtsAdapter implements TtsProviderPort {
  readonly providerName = 'fake';

  async synthesize(input: TtsSynthesisInput): Promise<TtsSynthesisResult> {
    if (!input.outputFormat.startsWith('mp3')) {
      // Fingir otros formatos exigiría fabricar sus cabeceras; fallar de forma
      // visible es preferible a devolver bytes que el validador rechazará luego.
      throw new TtsProviderError(
        `El proveedor de pruebas solo sabe fabricar mp3, no ${input.outputFormat}`,
        'FAKE_FORMAT_UNSUPPORTED',
        false,
      );
    }

    const units = [...input.text].length;
    // Relleno determinista: el mismo texto produce el mismo fichero, así que el
    // checksum almacenado es estable entre ejecuciones.
    const filler = createHash('sha256').update(input.text).digest();
    const body = Buffer.concat(Array.from({ length: 16 }, () => filler));

    return {
      audio: Buffer.concat([MP3_FRAME_HEADER, body]),
      mimeType: mimeTypeFor(input.outputFormat),
      provider: this.providerName,
      model: input.model,
      requestId: input.requestId,
      usageUnits: units,
      usageIsReported: false,
      durationMs: 0,
    };
  }

  async health(): Promise<TtsProviderHealth> {
    return { provider: this.providerName, configured: true };
  }
}
