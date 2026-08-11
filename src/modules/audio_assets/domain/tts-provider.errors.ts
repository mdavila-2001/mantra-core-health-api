export abstract class TtsProviderError extends Error {
  abstract readonly code: string;
  abstract readonly retryable: boolean;
  constructor(
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

export class TtsProviderRateLimitedError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_RATE_LIMITED';
  readonly retryable = true;
}
export class TtsProviderUnauthorizedError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_UNAUTHORIZED';
  readonly retryable = false;
}
export class TtsProviderQuotaExceededError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_QUOTA_EXCEEDED';
  readonly retryable = false;
}
export class TtsProviderTimeoutError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_TIMEOUT';
  readonly retryable = true;
}
export class TtsProviderNetworkError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_NETWORK';
  readonly retryable = true;
}
export class TtsProviderInvalidRequestError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_INVALID_REQUEST';
  readonly retryable = false;
}
export class TtsProviderUnavailableError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_UNAVAILABLE';
  readonly retryable = true;
}
export class TtsProviderNotConfiguredError extends TtsProviderError {
  readonly code = 'TTS_PROVIDER_NOT_CONFIGURED';
  readonly retryable = false;
}
