import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_annotations`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_annotations' })
export class CatalogAnnotations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de target kind mantenido por la instancia.
   */
  @Property({ fieldName: 'target_kind', columnType: 'varchar' })
  targetKind!: string;

  /**
   * Identificador asociado a object.
   */
  @Property({ fieldName: 'object_id', type: 'uuid' }) // FK → data_catalog.catalog_objects
  objectId!: string;

  /**
   * Identificador asociado a column.
   */
  @Property({ fieldName: 'column_id', type: 'uuid', nullable: true }) // FK → data_catalog.catalog_columns
  columnId?: string;

  /**
   * Valor de business name mantenido por la instancia.
   */
  @Property({
    fieldName: 'business_name',
    columnType: 'varchar',
    nullable: true,
  })
  businessName?: string;

  /**
   * Valor de definition mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  definition?: string;

  /**
   * Valor de purpose mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  purpose?: string;

  /**
   * Valor de existence rationale mantenido por la instancia.
   */
  @Property({
    fieldName: 'existence_rationale',
    columnType: 'text',
    nullable: true,
  })
  existenceRationale?: string;

  /**
   * Valor de row grain mantenido por la instancia.
   */
  @Property({ fieldName: 'row_grain', columnType: 'text', nullable: true })
  rowGrain?: string;

  /**
   * Valor de alternatives rationale mantenido por la instancia.
   */
  @Property({
    fieldName: 'alternatives_rationale',
    columnType: 'text',
    nullable: true,
  })
  alternativesRationale?: string;

  /**
   * Valor de process supported mantenido por la instancia.
   */
  @Property({
    fieldName: 'process_supported',
    columnType: 'text',
    nullable: true,
  })
  processSupported?: string;

  /**
   * Valor de source of truth mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_of_truth',
    columnType: 'text',
    nullable: true,
  })
  sourceOfTruth?: string;

  /**
   * Valor de producers mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  producers?: unknown;

  /**
   * Valor de consumers mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  consumers?: unknown;

  /**
   * Valor de deletion impact mantenido por la instancia.
   */
  @Property({
    fieldName: 'deletion_impact',
    columnType: 'text',
    nullable: true,
  })
  deletionImpact?: string;

  /**
   * Valor de business owner mantenido por la instancia.
   */
  @Property({
    fieldName: 'business_owner',
    columnType: 'varchar',
    nullable: true,
  })
  businessOwner?: string;

  /**
   * Valor de data steward mantenido por la instancia.
   */
  @Property({
    fieldName: 'data_steward',
    columnType: 'varchar',
    nullable: true,
  })
  dataSteward?: string;

  /**
   * Valor de technical owner mantenido por la instancia.
   */
  @Property({
    fieldName: 'technical_owner',
    columnType: 'varchar',
    nullable: true,
  })
  technicalOwner?: string;

  /**
   * Valor de unit mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  unit?: string;

  /**
   * Valor de value domain mantenido por la instancia.
   */
  @Property({ fieldName: 'value_domain', columnType: 'text', nullable: true })
  valueDomain?: string;

  /**
   * Valor de null semantics mantenido por la instancia.
   */
  @Property({ fieldName: 'null_semantics', columnType: 'text', nullable: true })
  nullSemantics?: string;

  /**
   * Valor de sensitivity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  sensitivity!: string;

  /**
   * Valor de open questions mantenido por la instancia.
   */
  @Property({
    fieldName: 'open_questions',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  openQuestions?: unknown;

  /**
   * Valor de review status mantenido por la instancia.
   */
  @Property({ fieldName: 'review_status', columnType: 'varchar' })
  reviewStatus!: string;

  /**
   * Valor de origin mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  origin!: string;

  /**
   * Valor de current revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'current_revision_no', columnType: 'int' })
  currentRevisionNo!: number;

  /**
   * Valor de approved revision no mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_revision_no',
    columnType: 'int',
    nullable: true,
  })
  approvedRevisionNo?: number;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  approvedByUserId?: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
