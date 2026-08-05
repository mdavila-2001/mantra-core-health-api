import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `collection_schema_versions`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'collection_schema_versions' })
export class CollectionSchemaVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a collection definition.
   */
  @Property({ fieldName: 'collection_definition_id', type: 'uuid' }) // FK → polyglot_storage.collection_definitions
  collectionDefinitionId!: string;

  /**
   * Identificador asociado a dataset version.
   */
  @Property({ fieldName: 'dataset_version_id', type: 'uuid' }) // FK → polyglot_storage.dataset_versions
  datasetVersionId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  /**
   * Valor de validation mode mantenido por la instancia.
   */
  @Property({ fieldName: 'validation_mode', columnType: 'varchar' })
  validationMode!: string;

  /**
   * Valor de schema document json mantenido por la instancia.
   */
  @Property({
    fieldName: 'schema_document_json',
    type: 'json',
    columnType: 'jsonb',
  })
  schemaDocumentJson!: unknown;

  /**
   * Valor de migration strategy mantenido por la instancia.
   */
  @Property({ fieldName: 'migration_strategy', columnType: 'varchar' })
  migrationStrategy!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
