import type { AudioAssets } from '../entities';
import type { AudioAssetsRepository } from '../repositories/audio-assets.repository';

export async function recordAudioResolutionEvent(
  repository: AudioAssetsRepository,
  asset: AudioAssets,
  eventType: string,
  outcome: string,
  correlationId?: string,
  estimatedCostUnits?: number,
  actorHash?: string,
): Promise<void> {
  await repository.appendEvent({
    assetKey: asset.assetKey,
    eventType,
    provider: asset.provider,
    templateKey: asset.templateKey,
    outcome,
    correlationId,
    estimatedCostUnits,
    metadata: actorHash ? { actorHash } : {},
  });
}
