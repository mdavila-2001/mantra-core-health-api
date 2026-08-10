import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { TtsProviderPort, TtsSynthesisInput, TtsSynthesisResult } from '../../../modules/audio_assets/domain/tts-provider.port';

/** Fake determinista para unit/integration tests; está prohibido en producción. */
@Injectable()
export class FakeTtsAdapter implements TtsProviderPort {
  readonly providerName = 'fake';
  async synthesize(input: TtsSynthesisInput): Promise<TtsSynthesisResult> {
    const hash = createHash('sha256').update(`${input.text}\0${input.providerVoiceRef}\0${input.model}`).digest('hex');
    return { audio: Buffer.from(`FAKE_AUDIO:${hash}`, 'utf8'), mimeType: 'application/octet-stream',
      provider: this.providerName, model: input.model, requestId: input.requestId,
      usage: { characters: Array.from(input.text).length }, durationMs: 0 };
  }
  async health(): Promise<{ configured: boolean; provider: string }> { return { configured: true, provider: this.providerName }; }
}
