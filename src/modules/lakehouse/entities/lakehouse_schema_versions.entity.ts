import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_schema_versions' })
export class LakehouseSchemaVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lakehouse_dataset_id', type: 'uuid' })
  lakehouseDatasetId!: string;

  @Property({ fieldName: 'schema_version', columnType: 'int' })
  schemaVersion!: number;

  @Property({ fieldName: 'schema_json', type: 'json', columnType: 'jsonb' })
  schemaJson!: unknown;

  @Property({ fieldName: 'schema_fingerprint', columnType: 'varchar' })
  schemaFingerprint!: string;

  @Property({ fieldName: 'compatibility_mode', columnType: 'varchar' })
  compatibilityMode!: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;
}
