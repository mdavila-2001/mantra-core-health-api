/** Métricas de baja cardinalidad del pipeline TTS; nunca etiquetan usuario, texto ni assetId. */
export interface AudioMetricsPort {
  generated(provider: string, durationMs: number): void;
  cacheHit(kind: 'asset' | 'binary-reuse'): void;
  fallback(reason: string): void;
  providerFailure(provider: string, code: string): void;
  budgetDenied(reason: string): void;
  observeProvider(provider: string, durationMs: number): void;
  observeStorage(provider: string, durationMs: number): void;
}

export const AUDIO_METRICS_PORT = Symbol('AUDIO_METRICS_PORT');
