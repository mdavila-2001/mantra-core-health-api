import { Injectable } from '@nestjs/common';
import type { TtsProviderPort, TtsSynthesisInput, TtsSynthesisResult } from '../../../../modules/audio_assets/domain/tts-provider.port';
import { TtsProviderError } from '../../../../modules/audio_assets/domain/tts-provider.errors';
import { ElevenLabsHttpClient } from './elevenlabs-http.client';
import { loadElevenLabsConfig } from './elevenlabs.config';

@Injectable()
export class ElevenLabsTtsAdapter implements TtsProviderPort {
  readonly providerName = 'elevenlabs';
  private readonly config = loadElevenLabsConfig();
  constructor(private readonly http: ElevenLabsHttpClient) {}

  async synthesize(input: TtsSynthesisInput): Promise<TtsSynthesisResult> {
    const startedAt = Date.now();
    let attempt = 0;
    while (true) {
      try {
        const response = await this.http.synthesize(input);
        return {
          audio: response.audio,
          mimeType: mimeType(input.outputFormat),
          provider: this.providerName,
          model: input.model,
          requestId: response.requestId,
          usage: { characters: Array.from(input.text).length },
          durationMs: Date.now() - startedAt,
        };
      } catch (error) {
        if (!(error instanceof TtsProviderError) || !error.retryable || attempt >= this.config.maxRetries) throw error;
        const delayMs = error.retryAfterMs ?? Math.min(this.config.retryBaseMs * 2 ** attempt, 5000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt += 1;
      }
    }
  }

  async health(): Promise<{ configured: boolean; provider: string }> {
    return { configured: Boolean(this.config.apiKey), provider: this.providerName };
  }
}

function mimeType(format: string): string {
  if (format.startsWith('mp3')) return 'audio/mpeg';
  if (format.startsWith('wav')) return 'audio/wav';
  if (format.startsWith('pcm')) return 'audio/L16';
  return 'application/octet-stream';
}
