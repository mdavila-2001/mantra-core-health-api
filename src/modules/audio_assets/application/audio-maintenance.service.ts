import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { FILE_STORAGE_ADAPTER, type FileStorageAdapter } from '../../../common';
import { loadAudioEnv } from '../audio.env';
import { AudioAssetsRepository } from '../repositories/audio-assets.repository';
import { AudioMaintenanceRepository } from '../repositories/audio-maintenance.repository';

export interface VerifyAudioAssetsResult {
  checked: number;
  healthy: number;
  issues: Array<{ assetId: string; code: string; fallback: boolean }>;
  blockingFallbackIssues: number;
}

@Injectable()
export class AudioMaintenanceService {
  private readonly env = loadAudioEnv();
  constructor(
    private readonly maintenance: AudioMaintenanceRepository,
    private readonly assets: AudioAssetsRepository,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
  ) {}

  async verify(limit: number): Promise<VerifyAudioAssetsResult> {
    const candidates = await this.maintenance.listReady(limit);
    const issues: VerifyAudioAssetsResult['issues'] = [];
    let healthy = 0;
    for (const asset of candidates) {
      const code = await this.verifyOne(asset.storageKey, asset.checksumSha256);
      if (!code) healthy += 1;
      else
        issues.push({
          assetId: asset.id,
          code,
          fallback:
            asset.strategy === 'FALLBACK' ||
            asset.templateKey === this.env.globalFallbackTemplate,
        });
      await this.assets.appendEvent({
        assetKey: asset.assetKey,
        eventType: 'ASSET_VERIFY',
        provider: asset.provider,
        templateKey: asset.templateKey,
        outcome: code ? 'FAILED' : 'OK',
        errorCode: code,
      });
    }
    return {
      checked: candidates.length,
      healthy,
      issues,
      blockingFallbackIssues: issues.filter((issue) => issue.fallback).length,
    };
  }

  async deprecate(assetId: string): Promise<{ deprecated: boolean }> {
    const asset = await this.assets.findAssetById(assetId);
    if (
      !asset ||
      asset.strategy === 'FALLBACK' ||
      asset.templateKey === this.env.globalFallbackTemplate
    )
      return { deprecated: false };
    const deprecated = await this.maintenance.deprecate(assetId);
    if (deprecated)
      await this.assets.appendEvent({
        eventType: 'ASSET_DEPRECATED',
        outcome: 'OK',
        metadata: { assetId },
      });
    return { deprecated };
  }

  async garbageCollect(limit: number): Promise<{
    candidates: number;
    rowsCleared: number;
    objectsDeleted: number;
  }> {
    const cutoff = new Date(Date.now() - this.env.gcRetentionDays * 86_400_000);
    const candidates = await this.maintenance.listGarbageCandidates(
      cutoff,
      limit,
    );
    let rowsCleared = 0;
    let objectsDeleted = 0;
    for (const asset of candidates) {
      if (
        !asset.storageKey ||
        asset.templateKey === this.env.globalFallbackTemplate
      )
        continue;
      const refs = await this.maintenance.storageReferenceCount(
        asset.storageKey,
        asset.id,
      );
      if (refs === 0) {
        await this.storage.delete(asset.storageKey);
        objectsDeleted += 1;
      }
      await this.maintenance.clearStorageReference(asset.id);
      rowsCleared += 1;
      await this.assets.appendEvent({
        assetKey: asset.assetKey,
        eventType: 'ASSET_GARBAGE_COLLECTED',
        provider: asset.provider,
        templateKey: asset.templateKey,
        outcome: refs === 0 ? 'OBJECT_DELETED' : 'SHARED_OBJECT_RETAINED',
      });
    }
    return { candidates: candidates.length, rowsCleared, objectsDeleted };
  }

  async status(): Promise<Record<string, unknown>> {
    return {
      enabled: this.env.enabled,
      provider: this.env.provider,
      runtimeGeneration: this.env.allowRuntimeGeneration,
      productionLicenseConfirmed: this.env.prodLicenseConfirmed,
      crossTemplateDedup: this.env.crossTemplateDedup,
      globalFallbackTemplate: this.env.globalFallbackTemplate,
      gcRetentionDays: this.env.gcRetentionDays,
      generationStatus: await this.maintenance.statusCounts(),
      providerIsReadinessDependency: false,
    };
  }

  private async verifyOne(
    storageKey?: string,
    checksum?: string,
  ): Promise<string | undefined> {
    if (!storageKey) return 'MISSING_STORAGE_KEY';
    if (!(await this.storage.exists(storageKey)))
      return 'STORAGE_OBJECT_MISSING';
    const buffer = await this.storage.retrieve(storageKey);
    const actual = createHash('sha256').update(buffer).digest('hex');
    return !checksum
      ? 'MISSING_CHECKSUM'
      : actual !== checksum
        ? 'CHECKSUM_MISMATCH'
        : undefined;
  }
}
