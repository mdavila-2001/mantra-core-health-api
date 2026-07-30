import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dataset_versions`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'dataset_versions' })
export class DatasetVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dataset definition.
   */
  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;

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
   * Identificador asociado a schema document file.
   */
  @Property({ fieldName: 'schema_document_file_id', type: 'uuid' }) // FK → common.files
  schemaDocumentFileId!: string;

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

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
