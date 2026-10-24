import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_annotation_revisions' })
export class CatalogAnnotationRevisions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'annotation_id', type: 'uuid' }) // FK (destino no resuelto)
  annotationId!: string;

  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  @Property({ fieldName: 'content_json', type: 'json', columnType: 'jsonb' })
  contentJson!: unknown;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ columnType: 'varchar' })
  origin!: string;

  @Property({ fieldName: 'submitted_status', columnType: 'varchar' })
  submittedStatus!: string;

  @Property({ fieldName: 'change_reason', columnType: 'text', nullable: true })
  changeReason?: string;

  @Property({ fieldName: 'author_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  authorUserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
