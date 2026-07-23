import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'collection_schema_versions' })
export class CollectionSchemaVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'collection_definition_id', type: 'uuid' }) // FK → polyglot_storage.collection_definitions
  collectionDefinitionId!: string;

  @Property({ fieldName: 'dataset_version_id', type: 'uuid' }) // FK → polyglot_storage.dataset_versions
  datasetVersionId!: string;

  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  @Property({ fieldName: 'validation_mode', columnType: 'varchar' })
  validationMode!: string;

  @Property({
    fieldName: 'schema_document_json',
    type: 'json',
    columnType: 'jsonb',
  })
  schemaDocumentJson!: unknown;

  @Property({ fieldName: 'migration_strategy', columnType: 'varchar' })
  migrationStrategy!: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ columnType: 'varchar' })
  state!: string;
}
