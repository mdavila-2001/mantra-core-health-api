import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audio_assets', tableName: 'audio_generation_usage' })
export class AudioGenerationUsage {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'period_key', columnType: 'varchar' })
  periodKey!: string;

  @Property({ columnType: 'varchar' })
  provider!: string;

  @Property({ fieldName: 'estimated_credits', columnType: 'int' })
  estimatedCredits!: number;

  @Property({
    fieldName: 'consumed_credits',
    columnType: 'int',
    nullable: true,
  })
  consumedCredits?: number;

  @Property({ fieldName: 'request_count', columnType: 'int' })
  requestCount!: number;

  @Property({ fieldName: 'success_count', columnType: 'int' })
  successCount!: number;

  @Property({ fieldName: 'failure_count', columnType: 'int' })
  failureCount!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
