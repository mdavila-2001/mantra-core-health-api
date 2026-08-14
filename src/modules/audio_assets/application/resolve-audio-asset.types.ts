import type { AudioAssetView } from '../domain/audio.types';

export interface ResolveAudioAssetInput {
  templateKey: string;
  variables?: Record<string, string>;
  requestedVersion?: number;
  correlationId?: string;
}

export interface ResolveAudioAssetResult {
  status: 'READY' | 'QUEUED' | 'FALLBACK';
  asset?: AudioAssetView;
  fallbackAsset?: AudioAssetView;
  jobId?: string;
  reason?: string;
}
