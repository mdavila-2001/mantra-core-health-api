import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'operational_readiness_reviews' })
export class OperationalReadinessReviews {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ fieldName: 'deployment_id', type: 'uuid', nullable: true }) // FK → platform_ops.deployments
  deploymentId?: string;

  @Property({ fieldName: 'review_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewTypeConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'facilitator_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  facilitatorUserId?: string;

  @Property({
    fieldName: 'planned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  decisionConceptId?: string;

  @Property({
    fieldName: 'evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceJson?: unknown;

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
