import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'campaign_schedules' })
export class CampaignSchedules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  @Property({ fieldName: 'journey_id', type: 'uuid', nullable: true }) // FK → marketing.journeys
  journeyId?: string;

  @Property({ fieldName: 'schedule_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scheduleTypeConceptId!: string;

  @Property({ fieldName: 'timezone_name', columnType: 'varchar' })
  timezoneName!: string;

  @Property({
    fieldName: 'scheduled_once_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledOnceAt?: Date;

  @Property({
    fieldName: 'cron_expression',
    columnType: 'varchar',
    nullable: true,
  })
  cronExpression?: string;

  @Property({
    fieldName: 'recurrence_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  recurrenceRuleJson?: unknown;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({
    fieldName: 'valid_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  validUntil?: Date;

  @Property({
    fieldName: 'allowed_weekdays_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedWeekdaysJson?: unknown;

  @Property({
    fieldName: 'allowed_time_window_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedTimeWindowJson?: unknown;

  @Property({ fieldName: 'missed_run_policy_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  missedRunPolicyConceptId!: string;

  @Property({ fieldName: 'overlap_policy_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  overlapPolicyConceptId!: string;

  @Property({
    fieldName: 'next_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRunAt?: Date;

  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  @Property({ fieldName: 'max_occurrences', columnType: 'int', nullable: true })
  maxOccurrences?: number;

  @Property({ fieldName: 'completed_occurrences', columnType: 'int' })
  completedOccurrences!: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'schedule_version', columnType: 'int' })
  scheduleVersion!: number;

  @Property({ fieldName: 'published_content_hash', columnType: 'varchar' })
  publishedContentHash!: string;

  @Property({ fieldName: 'published_audience_hash', columnType: 'varchar' })
  publishedAudienceHash!: string;

  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users
  authorizedByUserId!: string;

  @Property({ fieldName: 'authorized_at', columnType: 'timestamptz' })
  authorizedAt!: Date;

  @Property({
    fieldName: 'authorization_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
  })
  authorizationSnapshotJson!: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
