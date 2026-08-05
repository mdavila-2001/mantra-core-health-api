import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `read_model_definitions`.
 */
@Entity({ schema: 'read_models', tableName: 'read_model_definitions' })
export class ReadModelDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  /**
   * Valor de object name mantenido por la instancia.
   */
  @Property({ fieldName: 'object_name', columnType: 'varchar' })
  objectName!: string;

  /**
   * Identificador asociado a object type concept.
   */
  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  /**
   * Valor de owning module mantenido por la instancia.
   */
  @Property({
    fieldName: 'owning_module',
    columnType: 'varchar',
    nullable: true,
  })
  owningModule?: string;

  /**
   * Valor de purpose text mantenido por la instancia.
   */
  @Property({ fieldName: 'purpose_text', columnType: 'text', nullable: true })
  purposeText?: string;

  /**
   * Identificador asociado a refresh mode concept.
   */
  @Property({
    fieldName: 'refresh_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  refreshModeConceptId?: string;

  /**
   * Valor de maximum staleness seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'maximum_staleness_seconds',
    columnType: 'int',
    nullable: true,
  })
  maximumStalenessSeconds?: number;

  /**
   * Valor de default page size mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_page_size',
    columnType: 'int',
    nullable: true,
  })
  defaultPageSize?: number;

  /**
   * Valor de maximum page size mantenido por la instancia.
   */
  @Property({
    fieldName: 'maximum_page_size',
    columnType: 'int',
    nullable: true,
  })
  maximumPageSize?: number;

  /**
   * Valor de stable cursor columns json mantenido por la instancia.
   */
  @Property({
    fieldName: 'stable_cursor_columns_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  stableCursorColumnsJson?: unknown;

  /**
   * Valor de contains pii mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_pii', type: 'boolean', nullable: true })
  containsPii?: boolean;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_phi', type: 'boolean', nullable: true })
  containsPhi?: boolean;

  /**
   * Valor de security barrier required mantenido por la instancia.
   */
  @Property({
    fieldName: 'security_barrier_required',
    type: 'boolean',
    nullable: true,
  })
  securityBarrierRequired?: boolean;

  /**
   * Valor de row level security required mantenido por la instancia.
   */
  @Property({
    fieldName: 'row_level_security_required',
    type: 'boolean',
    nullable: true,
  })
  rowLevelSecurityRequired?: boolean;

  /**
   * Valor de definition hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'definition_hash',
    columnType: 'varchar',
    nullable: true,
  })
  definitionHash?: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
