import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'bookmarks' })
export class Bookmarks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'profile_id', type: 'uuid' }) // FK (destino no resuelto)
  profileId!: string;

  @Property({ fieldName: 'bookmarkable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bookmarkableTypeConceptId!: string;

  @Property({ fieldName: 'bookmarkable_ref_id', type: 'uuid' })
  bookmarkableRefId!: string;

  @Property({
    fieldName: 'collection_name',
    columnType: 'varchar',
    nullable: true,
  })
  collectionName?: string;

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
