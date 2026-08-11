import type {
  AudioGenerationMode,
  AudioSynthesisProfile,
} from '../domain/audio.types';

export interface CreateAudioAssetInput extends AudioSynthesisProfile {
  assetKey: string;
  templateKey: string;
  templateVersion: number;
  strategy: string;
  normalizedValueHash?: string;
  encryptedRenderedText: string;
  renderedTextHash: string;
  generationMode: AudioGenerationMode;
}

export interface GenerationEventInput {
  assetKey?: string;
  eventType: string;
  provider?: string;
  templateKey?: string;
  outcome: string;
  errorCode?: string;
  durationMs?: number;
  estimatedCostUnits?: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface MarkAudioAssetReadyInput {
  assetId: string;
  storageUri: string;
  checksum: string;
  bytes: number;
  durationMs?: number;
  consumedCredits?: number;
}
