import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'escalation_policy_steps' })
export class EscalationPolicySteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'escalation_policy_id', type: 'uuid' }) // FK → platform_ops.escalation_policies
  escalationPolicyId!: string;

  @Property({ fieldName: 'step_number', columnType: 'int' })
  stepNumber!: number;

  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  @Property({ fieldName: 'operational_team_id', type: 'uuid', nullable: true }) // FK → platform_ops.operational_teams
  operationalTeamId?: string;

  @Property({ fieldName: 'on_call_schedule_id', type: 'uuid', nullable: true }) // FK → platform_ops.on_call_schedules
  onCallScheduleId?: string;

  @Property({ fieldName: 'target_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  targetUserId?: string;

  @Property({ fieldName: 'delay_seconds', columnType: 'int' })
  delaySeconds!: number;

  @Property({
    fieldName: 'notification_channels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  notificationChannelsJson?: unknown;

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
