import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'dataset_versions' })
export class DatasetVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  @Property({ columnType: 'varchar' })
  version!: string;

  @Property({ fieldName: 'schema_fingerprint', columnType: 'varchar' })
  schemaFingerprint!: string;

  @Property({ fieldName: 'compatibility_mode', columnType: 'varchar' })
  compatibilityMode!: string;

  @Property({ fieldName: 'schema_document_file_id', type: 'uuid' }) // FK → common.files
  schemaDocumentFileId!: string;

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

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
