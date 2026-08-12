import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIO_TTS_CONFIG,
  TtsProviderError,
  type TtsSynthesisInput,
} from '../../../modules/audio_tts/domain';
import type { AudioTtsConfig } from '../../../modules/audio_tts/config/audio-tts.env';
import {
  acceptFor,
  looksLikeAudio,
  mimeTypeFor,
} from '../../../modules/audio_tts/storage';
import { readCappedBody } from './response-reader';

export interface ElevenLabsResponse {
  audio: Buffer;
  mimeType: string;
  requestId?: string;
  /** Unidades que el proveedor declara haber facturado, si publica la cabecera. */
  reportedUnits?: number;
}

/**
 * Cliente HTTP de la API de texto-a-voz de ElevenLabs.
 *
 * Usa `fetch` y no el `HttpService` de axios del worker, y es deliberado: la
 * respuesta es **binaria y potencialmente grande**, y aquí hace falta leerla por
 * trozos para poder abortar al superar el techo (`readCappedBody`). Axios
 * materializa el cuerpo completo antes de devolverlo.
 *
 * Todo lo que sale de aquí es un `TtsProviderError` con su código estable y su
 * decisión de reintento ya tomada: quien lo llama no tiene que interpretar
 * códigos HTTP ni nombres de error de Node.
 */
@Injectable()
export class ElevenLabsHttpClient {
  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
  ) {}

  async synthesize(input: TtsSynthesisInput): Promise<ElevenLabsResponse> {
    const response = await this.send(input);
    if (!response.ok) throw await this.toError(response);
    const audio = await readCappedBody(response, this.config.maxResponseBytes);
    return this.validate(audio, response, input);
  }

  private async send(input: TtsSynthesisInput): Promise<Response> {
    const baseUrl = this.config.elevenLabsBaseUrl.replace(/\/+$/u, '');
    const url =
      `${baseUrl}/v1/text-to-speech/${encodeURIComponent(input.providerVoiceRef)}` +
      `?output_format=${encodeURIComponent(input.outputFormat)}`;

    try {
      return await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
        headers: {
          'xi-api-key': this.config.elevenLabsApiKey,
          'content-type': 'application/json',
          accept: acceptFor(input.outputFormat),
        },
        body: JSON.stringify({
          text: input.text,
          model_id: input.model,
          // El idioma forma parte de la identidad del asset, así que tiene que
          // llegar al proveedor: si no, la caché prometería `es-419` y el audio
          // podría venir con la pronunciación por defecto del modelo.
          language_code: toLanguageCode(input.language),
        }),
      });
    } catch (error) {
      throw toTransportError(error);
    }
  }

  /**
   * Traduce un código HTTP a una decisión de reintento.
   *
   * Solo 408, 429 y 5xx se consideran transitorios. Un 401 o un 422 reintentados
   * no arreglan una credencial inválida ni un modelo que no existe, y cada intento
   * consume uno de los del asset: a los cuatro, el audio queda muerto por un
   * problema de configuración que nadie habrá visto.
   */
  private async toError(response: Response): Promise<TtsProviderError> {
    const retryable =
      response.status === 408 ||
      response.status === 429 ||
      response.status >= 500;
    const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
    // El cuerpo del error se descarta sin leerlo: puede contener texto del
    // proveedor, y este mensaje acaba en los logs.
    await response.body?.cancel().catch(() => undefined);
    return new TtsProviderError(
      `ElevenLabs respondió ${response.status}`,
      `ELEVENLABS_HTTP_${response.status}`,
      retryable,
      retryAfter,
    );
  }

  /**
   * Comprueba que lo recibido es audio antes de dejar que se cachee.
   *
   * Es la comprobación más importante del cliente. Un `200` con una página de
   * error o un JSON quedaría almacenado y marcado `READY`, y un asset `READY`
   * **no se regenera nunca**: el fallo sería permanente, silencioso y solo visible
   * como un audio que no suena.
   */
  private validate(
    audio: Buffer,
    response: Response,
    input: TtsSynthesisInput,
  ): ElevenLabsResponse {
    if (audio.length < this.config.minResponseBytes) {
      // Truncamiento: transitorio, merece otro intento.
      throw new TtsProviderError(
        `Respuesta de audio demasiado pequeña (${audio.length} bytes)`,
        'ELEVENLABS_RESPONSE_TOO_SMALL',
        true,
      );
    }
    if (!looksLikeAudio(audio, input.outputFormat)) {
      // Contenido de otro tipo: reintentar daría lo mismo.
      throw new TtsProviderError(
        'La respuesta del proveedor no es audio del formato solicitado',
        'ELEVENLABS_RESPONSE_NOT_AUDIO',
        false,
      );
    }

    const contentType = response.headers
      .get('content-type')
      ?.split(';')[0]
      ?.trim();
    return {
      audio,
      // Se prefiere el tipo real declarado por el proveedor sobre el derivado del
      // formato, salvo que sea `application/json` —que ya se sabe que no lo es.
      mimeType:
        contentType && contentType !== 'application/json'
          ? contentType
          : mimeTypeFor(input.outputFormat),
      requestId: response.headers.get('request-id') ?? undefined,
      reportedUnits: parseReportedUnits(response.headers),
    };
  }
}

/** `es-419` → `es`: el proveedor espera un código ISO-639-1. */
export function toLanguageCode(language: string): string {
  return (language.split('-')[0] ?? language).toLowerCase();
}

/** Unidades facturadas según el proveedor. Ausente = habrá que estimar. */
export function parseReportedUnits(headers: Headers): number | undefined {
  const raw = headers.get('character-cost') ?? headers.get('x-character-cost');
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** `Retry-After` admite segundos o fecha HTTP; se aceptan las dos formas. */
export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
}

/**
 * Clasifica un fallo de transporte.
 *
 * Se inspecciona la cadena de causas y no solo `error.name`: `AbortSignal.timeout`
 * produce un `TimeoutError`, un abort externo un `AbortError`, y `undici` envuelve
 * ambos dentro de un `TypeError: fetch failed` cuya causa es el error real.
 * Comprobar solo el nivel superior clasificaría todo timeout como fallo de red.
 */
export function toTransportError(error: unknown): TtsProviderError {
  if (error instanceof TtsProviderError) return error;

  const names = new Set<string>();
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current instanceof Error; depth += 1) {
    names.add(current.name);
    current = (current as { cause?: unknown }).cause;
  }

  if (names.has('TimeoutError') || names.has('AbortError')) {
    return new TtsProviderError(
      'Timeout en la llamada a ElevenLabs',
      'ELEVENLABS_TIMEOUT',
      true,
    );
  }
  return new TtsProviderError(
    'Fallo de red con ElevenLabs',
    'ELEVENLABS_NETWORK_ERROR',
    true,
  );
}
