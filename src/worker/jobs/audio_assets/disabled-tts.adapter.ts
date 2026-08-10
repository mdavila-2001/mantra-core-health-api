import { Injectable } from '@nestjs/common';
import type { TtsProviderPort, TtsSynthesisInput, TtsSynthesisResult } from '../../../modules/audio_assets/domain/tts-provider.port';
import { TtsProviderNotConfiguredError } from '../../../modules/audio_assets/domain/tts-provider.errors';

@Injectable()
export class DisabledTtsAdapter implements TtsProviderPort {
  readonly providerName = 'disabled';
  async synthesize(_input: TtsSynthesisInput): Promise<TtsSynthesisResult> {
    throw new TtsProviderNotConfiguredError('TTS provider disabled');
  }
  async health(): Promise<{ configured: boolean; provider: string }> {
    return { configured: false, provider: this.providerName };
  }
}
