import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `campaign_dispatches`.
 */
@Entity({ schema: 'marketing', tableName: 'campaign_dispatches' })
export class CampaignDispatches {
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
  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns
  campaignId!: string;

  /**
   * Identificador asociado a schedule.
   */
  @Property({ fieldName: 'schedule_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_schedules
  scheduleId?: string;

  /**
   * Identificador asociado a journey.
   */
  @Property({ fieldName: 'journey_id', type: 'uuid', nullable: true }) // FK → marketing.journeys
  journeyId?: string;

  /**
   * Identificador asociado a journey step.
   */
  @Property({ fieldName: 'journey_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  journeyStepId?: string;

  /**
   * Valor de occurrence key mantenido por la instancia.
   */
  @Property({ fieldName: 'occurrence_key', columnType: 'varchar' })
  occurrenceKey!: string;

  /**
   * Valor de planned at mantenido por la instancia.
   */
  @Property({ fieldName: 'planned_at', columnType: 'timestamptz' })
  plannedAt!: Date;

  /**
   * Valor de audience snapshot at mantenido por la instancia.
   */
  @Property({
    fieldName: 'audience_snapshot_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  audienceSnapshotAt?: Date;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  /**
   * Identificador asociado a content template.
   */
  @Property({ fieldName: 'content_template_id', type: 'uuid' }) // FK → marketing.content_templates
  contentTemplateId!: string;

  /**
   * Valor de content template version mantenido por la instancia.
   */
  @Property({ fieldName: 'content_template_version', columnType: 'int' })
  contentTemplateVersion!: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de audience definition hash mantenido por la instancia.
   */
  @Property({ fieldName: 'audience_definition_hash', columnType: 'varchar' })
  audienceDefinitionHash!: string;

  /**
   * Valor de total candidates mantenido por la instancia.
   */
  @Property({ fieldName: 'total_candidates', type: 'bigint' })
  totalCandidates!: string;

  /**
   * Valor de total eligible mantenido por la instancia.
   */
  @Property({ fieldName: 'total_eligible', type: 'bigint' })
  totalEligible!: string;

  /**
   * Valor de total suppressed mantenido por la instancia.
   */
  @Property({ fieldName: 'total_suppressed', type: 'bigint' })
  totalSuppressed!: string;

  /**
   * Valor de total requests mantenido por la instancia.
   */
  @Property({ fieldName: 'total_requests', type: 'bigint' })
  totalRequests!: string;

  /**
   * Valor de total accepted mantenido por la instancia.
   */
  @Property({ fieldName: 'total_accepted', type: 'bigint' })
  totalAccepted!: string;

  /**
   * Valor de total delivered mantenido por la instancia.
   */
  @Property({ fieldName: 'total_delivered', type: 'bigint' })
  totalDelivered!: string;

  /**
   * Valor de total seen mantenido por la instancia.
   */
  @Property({ fieldName: 'total_seen', type: 'bigint' })
  totalSeen!: string;

  /**
   * Valor de total read mantenido por la instancia.
   */
  @Property({ fieldName: 'total_read', type: 'bigint' })
  totalRead!: string;

  /**
   * Valor de total failed mantenido por la instancia.
   */
  @Property({ fieldName: 'total_failed', type: 'bigint' })
  totalFailed!: string;

  /**
   * Valor de total cancelled mantenido por la instancia.
   */
  @Property({ fieldName: 'total_cancelled', type: 'bigint' })
  totalCancelled!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Identificador asociado a authorized by user.
   */
  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users
  authorizedByUserId!: string;

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
   * Valor de failure code mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_code',
    columnType: 'varchar',
    nullable: true,
  })
  failureCode?: string;

  /**
   * Valor de failure detail mantenido por la instancia.
   */
  @Property({ fieldName: 'failure_detail', columnType: 'text', nullable: true })
  failureDetail?: string;

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
