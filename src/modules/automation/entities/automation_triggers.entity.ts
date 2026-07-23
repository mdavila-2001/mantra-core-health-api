import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'automation_triggers' })
export class AutomationTriggers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'trigger_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerTypeConceptId!: string;

  @Property({ fieldName: 'event_type', columnType: 'varchar', nullable: true })
  eventType?: string;

  @Property({
    fieldName: 'target_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  targetResourceType?: string;

  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  @Property({
    fieldName: 'schedule_cron',
    columnType: 'varchar',
    nullable: true,
  })
  scheduleCron?: string;

  @Property({ fieldName: 'workflow_id', type: 'uuid' }) // FK → automation.workflows
  workflowId!: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

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

  @Property({ fieldName: 'campaign_schedule_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_schedules
  campaignScheduleId?: string;

  @Property({ fieldName: 'schedule_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scheduleSourceConceptId!: string;
}
