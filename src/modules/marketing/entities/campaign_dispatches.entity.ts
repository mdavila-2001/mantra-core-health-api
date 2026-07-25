import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'campaign_dispatches' })
export class CampaignDispatches {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns
  campaignId!: string;

  @Property({ fieldName: 'schedule_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_schedules
  scheduleId?: string;

  @Property({ fieldName: 'journey_id', type: 'uuid', nullable: true }) // FK → marketing.journeys
  journeyId?: string;

  @Property({ fieldName: 'journey_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  journeyStepId?: string;

  @Property({ fieldName: 'occurrence_key', columnType: 'varchar' })
  occurrenceKey!: string;

  @Property({ fieldName: 'planned_at', columnType: 'timestamptz' })
  plannedAt!: Date;

  @Property({
    fieldName: 'audience_snapshot_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  audienceSnapshotAt?: Date;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  @Property({ fieldName: 'content_template_id', type: 'uuid' }) // FK → marketing.content_templates
  contentTemplateId!: string;

  @Property({ fieldName: 'content_template_version', columnType: 'int' })
  contentTemplateVersion!: number;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'audience_definition_hash', columnType: 'varchar' })
  audienceDefinitionHash!: string;

  @Property({ fieldName: 'total_candidates', type: 'bigint' })
  totalCandidates!: string;

  @Property({ fieldName: 'total_eligible', type: 'bigint' })
  totalEligible!: string;

  @Property({ fieldName: 'total_suppressed', type: 'bigint' })
  totalSuppressed!: string;

  @Property({ fieldName: 'total_requests', type: 'bigint' })
  totalRequests!: string;

  @Property({ fieldName: 'total_accepted', type: 'bigint' })
  totalAccepted!: string;

  @Property({ fieldName: 'total_delivered', type: 'bigint' })
  totalDelivered!: string;

  @Property({ fieldName: 'total_seen', type: 'bigint' })
  totalSeen!: string;

  @Property({ fieldName: 'total_read', type: 'bigint' })
  totalRead!: string;

  @Property({ fieldName: 'total_failed', type: 'bigint' })
  totalFailed!: string;

  @Property({ fieldName: 'total_cancelled', type: 'bigint' })
  totalCancelled!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users
  authorizedByUserId!: string;

  @Property({
    fieldName: 'authorization_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
  })
  authorizationSnapshotJson!: unknown;

  @Property({
    fieldName: 'failure_code',
    columnType: 'varchar',
    nullable: true,
  })
  failureCode?: string;

  @Property({ fieldName: 'failure_detail', columnType: 'text', nullable: true })
  failureDetail?: string;

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
