import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'moderation_queue' })
export class ModerationQueue {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true })  // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'content_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  contentTypeConceptId!: string;

  @Property({ fieldName: 'content_ref_id', type: 'uuid' })
  contentRefId!: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  @Property({ fieldName: 'content_report_id', type: 'uuid', nullable: true })  // FK → community.content_reports
  contentReportId?: string;

  @Property({ fieldName: 'priority_concept_id', type: 'uuid', nullable: true })  // FK → terminology.catalog_concepts
  priorityConceptId?: string;

  @Property({ fieldName: 'ml_score', columnType: 'numeric', nullable: true })
  mlScore?: string;

  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  assignedToUserId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'queued_at', columnType: 'timestamptz', nullable: true })
  queuedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

}
