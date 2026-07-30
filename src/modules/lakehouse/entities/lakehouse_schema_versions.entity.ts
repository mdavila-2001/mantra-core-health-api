import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_schema_versions`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_schema_versions' })
export class LakehouseSchemaVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lakehouse dataset.
   */
  @Property({ fieldName: 'lakehouse_dataset_id', type: 'uuid' })
  lakehouseDatasetId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_version', columnType: 'int' })
  schemaVersion!: number;

  /**
   * Valor de schema json mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_json', type: 'json', columnType: 'jsonb' })
  schemaJson!: unknown;

  /**
   * Valor de schema fingerprint mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_fingerprint', columnType: 'varchar' })
  schemaFingerprint!: string;

  /**
   * Valor de compatibility mode mantenido por la instancia.
   */
  @Property({ fieldName: 'compatibility_mode', columnType: 'varchar' })
  compatibilityMode!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;
}
