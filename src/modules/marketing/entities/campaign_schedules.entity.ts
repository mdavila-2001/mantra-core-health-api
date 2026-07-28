import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `campaign_schedules`.
 */
@Entity({ schema: 'marketing', tableName: 'campaign_schedules' })
export class CampaignSchedules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  /**
   * Identificador asociado a journey.
   */
  @Property({ fieldName: 'journey_id', type: 'uuid', nullable: true }) // FK → marketing.journeys
  journeyId?: string;

  /**
   * Identificador asociado a schedule type concept.
   */
  @Property({ fieldName: 'schedule_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scheduleTypeConceptId!: string;

  /**
   * Valor de timezone name mantenido por la instancia.
   */
  @Property({ fieldName: 'timezone_name', columnType: 'varchar' })
  timezoneName!: string;

  /**
   * Valor de scheduled once at mantenido por la instancia.
   */
  @Property({
    fieldName: 'scheduled_once_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledOnceAt?: Date;

  /**
   * Valor de cron expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'cron_expression',
    columnType: 'varchar',
    nullable: true,
  })
  cronExpression?: string;

  /**
   * Valor de recurrence rule json mantenido por la instancia.
   */
  @Property({
    fieldName: 'recurrence_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  recurrenceRuleJson?: unknown;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /**
   * Valor de valid until mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  validUntil?: Date;

  /**
   * Valor de allowed weekdays json mantenido por la instancia.
   */
  @Property({
    fieldName: 'allowed_weekdays_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedWeekdaysJson?: unknown;

  /**
   * Valor de allowed time window json mantenido por la instancia.
   */
  @Property({
    fieldName: 'allowed_time_window_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedTimeWindowJson?: unknown;

  /**
   * Identificador asociado a missed run policy concept.
   */
  @Property({ fieldName: 'missed_run_policy_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  missedRunPolicyConceptId!: string;

  /**
   * Identificador asociado a overlap policy concept.
   */
  @Property({ fieldName: 'overlap_policy_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  overlapPolicyConceptId!: string;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRunAt?: Date;

  /**
   * Valor de last run at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  /**
   * Valor de max occurrences mantenido por la instancia.
   */
  @Property({ fieldName: 'max_occurrences', columnType: 'int', nullable: true })
  maxOccurrences?: number;

  /**
   * Valor de completed occurrences mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_occurrences', columnType: 'int' })
  completedOccurrences!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de schedule version mantenido por la instancia.
   */
  @Property({ fieldName: 'schedule_version', columnType: 'int' })
  scheduleVersion!: number;

  /**
   * Valor de published content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'published_content_hash', columnType: 'varchar' })
  publishedContentHash!: string;

  /**
   * Valor de published audience hash mantenido por la instancia.
   */
  @Property({ fieldName: 'published_audience_hash', columnType: 'varchar' })
  publishedAudienceHash!: string;

  /**
   * Identificador asociado a authorized by user.
   */
  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users
  authorizedByUserId!: string;

  /**
   * Valor de authorized at mantenido por la instancia.
   */
  @Property({ fieldName: 'authorized_at', columnType: 'timestamptz' })
  authorizedAt!: Date;

  /**
   * Valor de authorization snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'authorization_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
  })
  authorizationSnapshotJson!: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
