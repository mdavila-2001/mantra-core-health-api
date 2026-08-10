import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Bulkhead, CircuitBreaker } from '../../../../common/resilience';
import { loadAudioEnv } from '../../../../modules/audio_assets/audio.env';
import type { TtsProviderPort, TtsSynthesisInput, TtsSynthesisResult } from '../../../../modules/audio_assets/domain/tts-provider.port';
import { TtsProviderError } from '../../../../modules/audio_assets/domain/tts-provider.errors';
import { ProviderRateGate } from '../provider-rate-gate';
import { loadElevenLabsConfig } from './elevenlabs.config';
import { ElevenLabsHttpClient } from './elevenlabs-http.client';

@Injectable()
export class ElevenLabsTtsAdapter implements TtsProviderPort {
  readonly providerName = 'elevenlabs';
  private readonly config = loadElevenLabsConfig();
  private readonly env = loadAudioEnv();
  private readonly bulkhead = new Bulkhead({ operation: 'tts.elevenlabs', maxConcurrent: this.env.maxConcurrency, maxQueued: 0 });
  private readonly rateGate = new ProviderRateGate(this.env.maxRequestsPerSecond);
  private readonly circuit: CircuitBreaker;

  constructor(private readonly http: ElevenLabsHttpClient, private readonly logger: PinoLogger) {
    this.logger.setContext(ElevenLabsTtsAdapter.name);
    const failures = this.env.circuitFailureThreshold;
    this.circuit = new CircuitBreaker({ operation: 'tts.elevenlabs', windowSize: failures,
      minimumThroughput: failures, failureRateThreshold: 1, openDurationMs: this.env.circuitOpenMs,
      maxOpenDurationMs: this.env.circuitOpenMs * 8,
      isFailure: (error) => error instanceof TtsProviderError && error.retryable,
      onStateChange: (change) => this.logger.warn({ operation: 'tts.elevenlabs.circuit', ...change }, 'ElevenLabs circuit state changed') });
  }

  async synthesize(input: TtsSynthesisInput): Promise<TtsSynthesisResult> {
    const startedAt = Date.now(); let attempt = 0;
    while (true) {
      try {
        const response = await this.circuit.execute(() => this.bulkhead.execute(async () => {
          await this.rateGate.waitTurn(); return this.http.synthesize(input);
        }));
        return { audio: response.audio, mimeType: mimeType(input.outputFormat), provider: this.providerName,
          model: input.model, requestId: response.requestId, usage: { characters: Array.from(input.text).length },
          durationMs: Date.now() - startedAt };
      } catch (error) {
        if (!(error instanceof TtsProviderError) || !error.retryable || attempt >= this.config.httpMaxRetries) throw error;
        const delayMs = error.retryAfterMs ?? Math.min(this.config.retryBaseMs * 2 ** attempt, 5000);
        await new Promise((resolve) => setTimeout(resolve, delayMs)); attempt += 1;
      }
    }
  }
  async health(): Promise<{ configured: boolean; provider: string }> {
    return { configured: Boolean(this.config.apiKey && this.env.providerVoiceRef), provider: this.providerName };
  }
}
function mimeType(format: string): string { if (format.startsWith('mp3')) return 'audio/mpeg'; if (format.startsWith('wav')) return 'audio/wav'; if (format.startsWith('pcm')) return 'audio/L16'; return 'application/octet-stream'; }
