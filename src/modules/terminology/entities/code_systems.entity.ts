import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'terminology', tableName: 'code_systems' })
export class CodeSystems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_id', type: 'uuid' }) // FK (destino no resuelto)
  sourceId!: string;

  @Property({ fieldName: 'internal_code', columnType: 'varchar' })
  internalCode!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'canonical_url', columnType: 'text' })
  canonicalUrl!: string;

  @Property({ columnType: 'varchar', nullable: true })
  oid?: string;

  @Property({
    fieldName: 'content_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  contentTypeConceptId?: string;

  @Property({ fieldName: 'case_sensitive', type: 'boolean', nullable: true })
  caseSensitive?: boolean;

  @Property({
    fieldName: 'supports_composition',
    type: 'boolean',
    nullable: true,
  })
  supportsComposition?: boolean;

  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

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
