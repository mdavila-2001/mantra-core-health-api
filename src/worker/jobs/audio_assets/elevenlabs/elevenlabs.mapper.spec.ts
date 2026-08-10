import { AxiosError, type AxiosResponse } from 'axios';
import { TtsProviderQuotaExceededError, TtsProviderRateLimitedError, TtsProviderUnauthorizedError, TtsProviderUnavailableError } from '../../../../modules/audio_assets/domain/tts-provider.errors';
import { mapElevenLabsError } from './elevenlabs.mapper';

function axiosError(status: number, data: unknown = {}): AxiosError {
  return new AxiosError('provider failure', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status, statusText: 'error', headers: {}, config: {} as AxiosResponse['config'], data,
  });
}

describe('mapElevenLabsError', () => {
  it('mapea 429 como reintentable', () => expect(mapElevenLabsError(axiosError(429))).toBeInstanceOf(TtsProviderRateLimitedError));
  it('mapea 401/403 como credenciales permanentes', () => expect(mapElevenLabsError(axiosError(401))).toBeInstanceOf(TtsProviderUnauthorizedError));
  it('mapea cuota antes que status genérico', () => expect(mapElevenLabsError(axiosError(429, { detail: 'quota exceeded' }))).toBeInstanceOf(TtsProviderQuotaExceededError));
  it('mapea 5xx como indisponibilidad reintentable', () => expect(mapElevenLabsError(axiosError(503))).toBeInstanceOf(TtsProviderUnavailableError));
});
