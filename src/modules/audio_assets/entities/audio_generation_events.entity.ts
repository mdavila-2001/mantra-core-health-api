import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audio_assets', tableName: 'audio_generation_events' })
export class AudioGenerationEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'asset_key', columnType: 'char(64)', nullable: true })
  assetKey?: string;

  @Property({ fieldName: 'event_type', columnType: 'varchar' })
  eventType!: string;

  @Property({ columnType: 'varchar', nullable: true })
  provider?: string;

  @Property({
    fieldName: 'template_key',
    columnType: 'varchar',
    nullable: true,
  })
  templateKey?: string;

  @Property({ columnType: 'varchar' })
  outcome!: string;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

  @Property({
    fieldName: 'estimated_cost_units',
    columnType: 'int',
    nullable: true,
  })
  estimatedCostUnits?: number;

  @Property({
    fieldName: 'correlation_id',
    columnType: 'varchar',
    nullable: true,
  })
  correlationId?: string;

  @Property({ fieldName: 'trace_id', columnType: 'varchar', nullable: true })
  traceId?: string;

  @Property({ type: 'json', columnType: 'jsonb' })
  metadata!: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
