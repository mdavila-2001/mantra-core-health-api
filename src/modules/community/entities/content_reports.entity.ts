import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'content_reports' })
export class ContentReports {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'reporter_user_id', type: 'uuid' }) // FK → iam.users
  reporterUserId!: string;

  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  @Property({ fieldName: 'detail_text', columnType: 'text', nullable: true })
  detailText?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'assigned_moderator_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  assignedModeratorUserId?: string;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
