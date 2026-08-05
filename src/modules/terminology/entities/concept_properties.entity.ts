import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `concept_properties`.
 */
@Entity({ schema: 'terminology', tableName: 'concept_properties' })
export class ConceptProperties {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a concept.
   */
  @Property({ fieldName: 'concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  conceptId!: string;

  /**
   * Valor de property code mantenido por la instancia.
   */
  @Property({ fieldName: 'property_code', columnType: 'varchar' })
  propertyCode!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @Property({
    fieldName: 'data_type',
    columnType: 'terminology.technical_data_type',
  })
  dataType!: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @Property({ fieldName: 'value_json', type: 'json', columnType: 'jsonb' })
  valueJson!: unknown;

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
