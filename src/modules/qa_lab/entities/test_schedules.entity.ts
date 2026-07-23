import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'test_schedules' })
export class TestSchedules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'suite_id', type: 'uuid' }) // FK (destino no resuelto)
  suiteId!: string;

  @Property({ fieldName: 'environment_id', type: 'uuid' }) // FK (destino no resuelto)
  environmentId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'cron_expression',
    columnType: 'varchar',
    nullable: true,
  })
  cronExpression?: string;

  @Property({ columnType: 'varchar', nullable: true })
  timezone?: string;

  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  @Property({
    fieldName: 'concurrency_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  concurrencyPolicyConceptId?: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

  @Property({ fieldName: 'last_run_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  lastRunId?: string;

  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  @Property({
    fieldName: 'next_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRunAt?: Date;

  @Property({
    fieldName: 'notify_channel_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  notifyChannelConceptId?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
