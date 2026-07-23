import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_context', tableName: 'country_context_schedules' })
export class CountryContextSchedules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  @Property({ fieldName: 'schedule_expression', columnType: 'varchar' })
  scheduleExpression!: string;

  @Property({ fieldName: 'timezone_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  timezoneConceptId?: string;

  @Property({ fieldName: 'lookback_days', columnType: 'int', nullable: true })
  lookbackDays?: number;

  @Property({
    fieldName: 'freshness_ttl_seconds',
    columnType: 'int',
    nullable: true,
  })
  freshnessTtlSeconds?: number;

  @Property({
    fieldName: 'next_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRunAt?: Date;

  @Property({
    fieldName: 'last_success_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
