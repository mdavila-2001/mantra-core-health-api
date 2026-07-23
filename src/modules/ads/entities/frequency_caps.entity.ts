import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'frequency_caps' })
export class FrequencyCaps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  @Property({ fieldName: 'scope_ref_id', type: 'uuid' })
  scopeRefId!: string;

  @Property({ fieldName: 'max_impressions', columnType: 'int' })
  maxImpressions!: number;

  @Property({ fieldName: 'time_window_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  timeWindowConceptId!: string;

  @Property({ fieldName: 'window_count', columnType: 'int', nullable: true })
  windowCount?: number;

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
