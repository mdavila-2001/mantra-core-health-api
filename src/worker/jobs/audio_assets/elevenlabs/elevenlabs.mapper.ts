import { AxiosError } from 'axios';
import {
  TtsProviderInvalidRequestError,
  TtsProviderNetworkError,
  TtsProviderQuotaExceededError,
  TtsProviderRateLimitedError,
  TtsProviderTimeoutError,
  TtsProviderUnauthorizedError,
  TtsProviderUnavailableError,
  type TtsProviderError,
} from '../../../../modules/audio_assets/domain/tts-provider.errors';

export function mapElevenLabsError(error: unknown): TtsProviderError {
  if (!(error instanceof AxiosError)) {
    return new TtsProviderNetworkError('ElevenLabs network error');
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new TtsProviderTimeoutError('ElevenLabs request timed out');
  }
  const status = error.response?.status;
  if (!status) return new TtsProviderNetworkError('ElevenLabs network error');
  const body = safeErrorText(error.response?.data);
  if (/quota|credit|insufficient/iu.test(body)) {
    return new TtsProviderQuotaExceededError('ElevenLabs quota exceeded');
  }
  if (status === 429) {
    return new TtsProviderRateLimitedError('ElevenLabs rate limited', retryAfterMs(error.response?.headers?.['retry-after']));
  }
  if (status === 401 || status === 403) {
    return new TtsProviderUnauthorizedError('ElevenLabs credentials rejected');
  }
  if ([400, 404, 409, 422].includes(status)) {
    return new TtsProviderInvalidRequestError(`ElevenLabs rejected synthesis request (${status})`);
  }
  if (status >= 500) return new TtsProviderUnavailableError(`ElevenLabs unavailable (${status})`);
  return new TtsProviderInvalidRequestError(`ElevenLabs request failed (${status})`);
}

function safeErrorText(data: unknown): string {
  if (typeof data === 'string') return data.slice(0, 4096);
  if (Buffer.isBuffer(data)) return data.toString('utf8').slice(0, 4096);
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8').slice(0, 4096);
  try { return JSON.stringify(data).slice(0, 4096); } catch { return ''; }
}

function retryAfterMs(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}
