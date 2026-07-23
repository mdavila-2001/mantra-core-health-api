import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'pipeline_stages' })
export class PipelineStages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pipeline_id', type: 'uuid' }) // FK → crm.pipelines
  pipelineId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({
    fieldName: 'probability_percent',
    columnType: 'numeric',
    nullable: true,
  })
  probabilityPercent?: string;

  @Property({ fieldName: 'is_won', type: 'boolean', nullable: true })
  isWon?: boolean;

  @Property({ fieldName: 'is_lost', type: 'boolean', nullable: true })
  isLost?: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
