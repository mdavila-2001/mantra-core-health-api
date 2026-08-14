import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { AudioAssets } from '../entities';

@Injectable()
export class AudioMaintenanceRepository {
  constructor(private readonly em: EntityManager) {}
  listReady(limit: number): Promise<AudioAssets[]> {
    return this.em.find(
      AudioAssets,
      { generationStatus: 'READY' },
      { orderBy: { generatedAt: 'ASC' }, limit },
    );
  }
  async listGarbageCandidates(
    cutoff: Date,
    limit: number,
  ): Promise<AudioAssets[]> {
    const rows = await this.em.getConnection().execute<Array<{ id: string }>>(
      `select id from audio_assets.audio_assets where generation_status in ('DEPRECATED','FAILED_PERMANENT')
       and strategy<>'FALLBACK' and updated_at<? and storage_key is not null order by updated_at asc limit ?`,
      [cutoff, limit],
      'all',
    );
    if (rows.length === 0) return [];
    return this.em.find(AudioAssets, {
      id: { $in: rows.map((row) => row.id) },
    });
  }
  async deprecate(assetId: string): Promise<boolean> {
    const asset = await this.em.findOne(AudioAssets, { id: assetId });
    if (!asset || asset.strategy === 'FALLBACK') return false;
    asset.generationStatus = 'DEPRECATED';
    asset.updatedAt = new Date();
    await this.em.flush();
    return true;
  }
  async storageReferenceCount(
    storageKey: string,
    excludingId: string,
  ): Promise<number> {
    const rows = await this.em
      .getConnection()
      .execute<Array<{ count: number }>>(
        `select count(*)::int as count from audio_assets.audio_assets where storage_key=? and id<>?`,
        [storageKey, excludingId],
        'all',
      );
    return rows[0]?.count ?? 0;
  }
  async clearStorageReference(assetId: string): Promise<void> {
    await this.em
      .getConnection()
      .execute(
        `update audio_assets.audio_assets set storage_key=null, storage_provider=null, updated_at=now() where id=?`,
        [assetId],
        'run',
      );
  }
  async statusCounts(): Promise<Record<string, number>> {
    const rows = await this.em
      .getConnection()
      .execute<Array<{ generation_status: string; count: number }>>(
        `select generation_status, count(*)::int as count from audio_assets.audio_assets group by generation_status`,
        [],
        'all',
      );
    return Object.fromEntries(
      rows.map((row) => [row.generation_status, row.count]),
    );
  }
}
