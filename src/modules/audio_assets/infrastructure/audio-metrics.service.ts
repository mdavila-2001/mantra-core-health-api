import { Injectable } from '@nestjs/common';
import { metrics } from '@opentelemetry/api';

/** Métricas low-cardinality del pipeline TTS; nunca etiqueta usuario, texto ni assetId. */
@Injectable()
export class AudioMetricsService {
  private readonly meter = metrics.getMeter('mantra.audio-assets');
  private readonly generatedCounter = this.meter.createCounter('audio_assets_generated_total');
  private readonly cacheHitCounter = this.meter.createCounter('audio_assets_cache_hit_total');
  private readonly fallbackCounter = this.meter.createCounter('audio_assets_fallback_total');
  private readonly providerFailureCounter = this.meter.createCounter('audio_assets_provider_failure_total');
  private readonly budgetDeniedCounter = this.meter.createCounter('audio_assets_budget_denied_total');
  private readonly generationDuration = this.meter.createHistogram('audio_assets_generation_duration_ms', { unit: 'ms' });
  private readonly providerLatency = this.meter.createHistogram('audio_assets_provider_latency_ms', { unit: 'ms' });
  private readonly storageWrite = this.meter.createHistogram('audio_assets_storage_write_ms', { unit: 'ms' });

  generated(provider: string, durationMs: number): void { this.generatedCounter.add(1, { provider }); this.generationDuration.record(durationMs, { provider }); }
  cacheHit(kind: 'asset' | 'binary-reuse'): void { this.cacheHitCounter.add(1, { kind }); }
  fallback(reason: string): void { this.fallbackCounter.add(1, { reason }); }
  providerFailure(provider: string, code: string): void { this.providerFailureCounter.add(1, { provider, code }); }
  budgetDenied(reason: string): void { this.budgetDeniedCounter.add(1, { reason }); }
  observeProvider(provider: string, durationMs: number): void { this.providerLatency.record(durationMs, { provider }); }
  observeStorage(provider: string, durationMs: number): void { this.storageWrite.record(durationMs, { provider }); }
}
