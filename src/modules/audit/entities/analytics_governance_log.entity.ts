import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `analytics_governance_log`.
 */
@Entity({ schema: 'audit', tableName: 'analytics_governance_log' })
export class AnalyticsGovernanceLog {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a purpose definition.
   */
  @Property({
    fieldName: 'purpose_definition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → telemetry.tracking_purpose_definitions
  purposeDefinitionId?: string;

  /**
   * Valor de export reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'export_reference',
    columnType: 'varchar',
    nullable: true,
  })
  exportReference?: string;

  /**
   * Valor de affected subject count mantenido por la instancia.
   */
  @Property({
    fieldName: 'affected_subject_count',
    type: 'bigint',
    nullable: true,
  })
  affectedSubjectCount?: string;

  /**
   * Valor de query hash mantenido por la instancia.
   */
  @Property({ fieldName: 'query_hash', columnType: 'varchar', nullable: true })
  queryHash?: string;

  /**
   * Identificador asociado a approval status concept.
   */
  @Property({ fieldName: 'approval_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalStatusConceptId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
