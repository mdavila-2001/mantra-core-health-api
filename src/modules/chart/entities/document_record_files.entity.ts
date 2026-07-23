import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'chart', tableName: 'document_record_files' })
export class DocumentRecordFiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'document_record_id', type: 'uuid' }) // FK → chart.document_records
  documentRecordId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  @Property({ fieldName: 'content_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentRoleConceptId!: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
