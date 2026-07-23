import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_recurrence_rules' })
export class CrmRecurrenceRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'recurrence_frequency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recurrenceFrequencyConceptId!: string;

  @Property({ fieldName: 'interval_count', columnType: 'int', nullable: true })
  intervalCount?: number;

  @Property({
    fieldName: 'by_day_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  byDayJson?: unknown;

  @Property({ fieldName: 'count_limit', columnType: 'int', nullable: true })
  countLimit?: number;

  @Property({
    fieldName: 'until_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  untilAt?: Date;

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
