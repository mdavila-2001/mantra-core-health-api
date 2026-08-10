export type AudioStrategy =
  'STATIC' | 'ENUMERATED' | 'CACHED_DYNAMIC' | 'FALLBACK';
export type AudioAssetStatus =
  | 'PENDING'
  | 'GENERATING'
  | 'READY'
  | 'FAILED_RETRYABLE'
  | 'FAILED_PERMANENT'
  | 'FALLBACK_ONLY'
  | 'DEPRECATED';
export type AudioDynamicValueKind = 'PERSON_NAME' | 'ENUM' | 'SAFE_TEXT';
export type AudioGenerationMode = 'RUNTIME' | 'PREGENERATE';

export interface AudioDynamicField {
  name: string;
  type: AudioDynamicValueKind;
  required: boolean;
  maxLength?: number;
  allowedValues?: string[];
  allowExternalTts?: boolean;
}

export interface NormalizedDynamicValue {
  displayValue: string;
  cacheValue: string;
}

export interface AudioSynthesisProfile {
  provider: string;
  providerModel: string;
  language: string;
  voiceProfile: string;
  providerVoiceRef: string;
  voiceVersion: number;
  audioFormat: string;
  sampleRate: number;
  normalizerVersion: number;
}

export interface AudioAssetView {
  id: string;
  templateKey: string;
  templateVersion: number;
  status: AudioAssetStatus;
  contentUrl?: string;
  checksumSha256?: string;
  bytes?: number;
  durationMs?: number;
}
