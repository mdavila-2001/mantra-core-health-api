import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'postmortems' })
export class Postmortems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_incident_id', type: 'uuid' }) // FK → platform_ops.health_incidents
  healthIncidentId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'impact_summary', columnType: 'text', nullable: true })
  impactSummary?: string;

  @Property({
    fieldName: 'detection_summary',
    columnType: 'text',
    nullable: true,
  })
  detectionSummary?: string;

  @Property({
    fieldName: 'response_summary',
    columnType: 'text',
    nullable: true,
  })
  responseSummary?: string;

  @Property({
    fieldName: 'root_cause_summary',
    columnType: 'text',
    nullable: true,
  })
  rootCauseSummary?: string;

  @Property({
    fieldName: 'contributing_factors_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contributingFactorsJson?: unknown;

  @Property({
    fieldName: 'lessons_learned',
    columnType: 'text',
    nullable: true,
  })
  lessonsLearned?: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

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
