import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'data_catalog', tableName: 'catalog_evidence_items' })
export class CatalogEvidenceItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK (destino no resuelto)
  objectId!: string;

  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  columnId?: string;

  @Property({ columnType: 'varchar' })
  kind!: string;

  @Property({ columnType: 'text' })
  reference!: string;

  @Property({ columnType: 'text', nullable: true })
  excerpt?: string;

  @Property({
    fieldName: 'source_revision',
    columnType: 'varchar',
    nullable: true,
  })
  sourceRevision?: string;

  @Property({ fieldName: 'added_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  addedByUserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
