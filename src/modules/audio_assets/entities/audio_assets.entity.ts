import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audio_assets', tableName: 'audio_assets' })
export class AudioAssets {
  @PrimaryKey({ type: 'uuid' }) id: string = randomUUID();
  @Property({ fieldName: 'asset_key', columnType: 'char(64)' }) assetKey!: string;
  @Property({ fieldName: 'template_key', columnType: 'varchar' }) templateKey!: string;
  @Property({ fieldName: 'template_version', columnType: 'int' }) templateVersion!: number;
  @Property({ columnType: 'varchar' }) strategy!: string;
  @Property({ columnType: 'varchar' }) language!: string;
  @Property({ fieldName: 'normalized_value_hash', columnType: 'char(64)', nullable: true }) normalizedValueHash?: string;
  @Property({ fieldName: 'display_value_encrypted', columnType: 'text' }) displayValueEncrypted!: string;
  @Property({ fieldName: 'rendered_text_hash', columnType: 'char(64)' }) renderedTextHash!: string;
  @Property({ columnType: 'varchar' }) provider!: string;
  @Property({ fieldName: 'provider_model', columnType: 'varchar' }) providerModel!: string;
  @Property({ fieldName: 'voice_profile', columnType: 'varchar' }) voiceProfile!: string;
  @Property({ fieldName: 'voice_provider_ref', columnType: 'varchar', nullable: true }) voiceProviderRef?: string;
  @Property({ fieldName: 'voice_version', columnType: 'int' }) voiceVersion!: number;
  @Property({ fieldName: 'normalizer_version', columnType: 'int' }) normalizerVersion!: number;
  @Property({ fieldName: 'audio_format', columnType: 'varchar' }) audioFormat!: string;
  @Property({ fieldName: 'sample_rate', columnType: 'int', nullable: true }) sampleRate?: number;
  @Property({ fieldName: 'storage_provider', columnType: 'varchar', nullable: true }) storageProvider?: string;
  @Property({ fieldName: 'storage_key', columnType: 'varchar', nullable: true }) storageKey?: string;
  @Property({ columnType: 'int', nullable: true }) bytes?: number;
  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true }) durationMs?: number;
  @Property({ fieldName: 'checksum_sha256', columnType: 'char(64)', nullable: true }) checksumSha256?: string;
  @Property({ fieldName: 'generation_status', columnType: 'varchar' }) generationStatus!: string;
  @Property({ fieldName: 'failure_code', columnType: 'varchar', nullable: true }) failureCode?: string;
  @Property({ fieldName: 'budget_reserved_units', columnType: 'int', nullable: true }) budgetReservedUnits?: number;
  @Property({ fieldName: 'generated_at', columnType: 'timestamptz', nullable: true }) generatedAt?: Date;
  @Property({ fieldName: 'last_used_at', columnType: 'timestamptz', nullable: true }) lastUsedAt?: Date;
  @Property({ fieldName: 'use_count', columnType: 'int' }) useCount!: number;
  @Property({ type: 'json', columnType: 'jsonb' }) metadata!: unknown;
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' }) createdAt!: Date;
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' }) updatedAt!: Date;
}
