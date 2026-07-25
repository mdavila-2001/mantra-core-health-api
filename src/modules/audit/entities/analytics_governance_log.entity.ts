import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audit', tableName: 'analytics_governance_log' })
export class AnalyticsGovernanceLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({
    fieldName: 'purpose_definition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → telemetry.tracking_purpose_definitions
  purposeDefinitionId?: string;

  @Property({
    fieldName: 'export_reference',
    columnType: 'varchar',
    nullable: true,
  })
  exportReference?: string;

  @Property({
    fieldName: 'affected_subject_count',
    type: 'bigint',
    nullable: true,
  })
  affectedSubjectCount?: string;

  @Property({ fieldName: 'query_hash', columnType: 'varchar', nullable: true })
  queryHash?: string;

  @Property({ fieldName: 'approval_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalStatusConceptId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
