export interface TtsSynthesisInput {
  text: string;
  language: string;
  voiceProfile: string;
  providerVoiceRef: string;
  model: string;
  outputFormat: string;
  sampleRate?: number;
  requestId: string;
}

export interface TtsSynthesisResult {
  audio: Buffer;
  mimeType: string;
  provider: string;
  model: string;
  requestId?: string;
  usage?: { characters?: number; credits?: number };
  durationMs?: number;
}

export interface TtsProviderHealth {
  configured: boolean;
  provider: string;
}

export interface TtsProviderPort {
  readonly providerName: string;
  synthesize(input: TtsSynthesisInput): Promise<TtsSynthesisResult>;
  health(): Promise<TtsProviderHealth>;
}

export const TTS_PROVIDER = Symbol('TTS_PROVIDER');
