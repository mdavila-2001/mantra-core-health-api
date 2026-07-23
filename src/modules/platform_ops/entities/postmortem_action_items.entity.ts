import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'postmortem_action_items' })
export class PostmortemActionItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'postmortem_id', type: 'uuid' }) // FK → platform_ops.postmortems
  postmortemId!: string;

  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  @Property({ columnType: 'text' })
  description!: string;

  @Property({ fieldName: 'action_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionTypeConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({
    fieldName: 'verification_evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  verificationEvidenceJson?: unknown;

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
