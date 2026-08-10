import { Injectable } from '@nestjs/common';
import axios from 'axios';
import type { TtsSynthesisInput } from '../../../../modules/audio_assets/domain/tts-provider.port';
import { TtsProviderNotConfiguredError } from '../../../../modules/audio_assets/domain/tts-provider.errors';
import { loadElevenLabsConfig } from './elevenlabs.config';
import { mapElevenLabsError } from './elevenlabs.mapper';

@Injectable()
export class ElevenLabsHttpClient {
  private readonly config = loadElevenLabsConfig();

  async synthesize(input: TtsSynthesisInput): Promise<{ audio: Buffer; requestId?: string }> {
    if (!this.config.apiKey || !input.providerVoiceRef) {
      throw new TtsProviderNotConfiguredError('ElevenLabs API key/voice id not configured');
    }
    try {
      const response = await axios.post<ArrayBuffer>(
        `${this.config.baseUrl}/v1/text-to-speech/${encodeURIComponent(input.providerVoiceRef)}`,
        {
          text: input.text,
          model_id: input.model,
          language_code: languageCode(input.language),
        },
        {
          params: { output_format: input.outputFormat },
          headers: {
            'xi-api-key': this.config.apiKey,
            Accept: audioMime(input.outputFormat),
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: this.config.timeoutMs,
        },
      );
      const requestId = stringHeader(response.headers['request-id'] ?? response.headers['x-request-id']);
      return { audio: Buffer.from(response.data), requestId };
    } catch (error) {
      throw mapElevenLabsError(error);
    }
  }
}

function languageCode(locale: string): string {
  return locale.split('-')[0]?.toLocaleLowerCase('en') || locale;
}
function audioMime(format: string): string {
  if (format.startsWith('mp3')) return 'audio/mpeg';
  if (format.startsWith('wav')) return 'audio/wav';
  if (format.startsWith('pcm')) return 'audio/L16';
  return 'application/octet-stream';
}
function stringHeader(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
