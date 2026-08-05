import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `report_columns`.
 */
@Entity({ schema: 'reporting', tableName: 'report_columns' })
export class ReportColumns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a report definition.
   */
  @Property({ fieldName: 'report_definition_id', type: 'uuid' }) // FK → reporting.report_definitions
  reportDefinitionId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Valor de expression mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  expression?: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @Property({
    fieldName: 'data_type',
    columnType: 'terminology.technical_data_type',
    nullable: true,
  })
  dataType?: string;

  /**
   * Identificador asociado a aggregation concept.
   */
  @Property({
    fieldName: 'aggregation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  aggregationConceptId?: string;

  /**
   * Valor de format mask mantenido por la instancia.
   */
  @Property({ fieldName: 'format_mask', columnType: 'varchar', nullable: true })
  formatMask?: string;

  /**
   * Valor de is visible mantenido por la instancia.
   */
  @Property({ fieldName: 'is_visible', type: 'boolean', nullable: true })
  isVisible?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
