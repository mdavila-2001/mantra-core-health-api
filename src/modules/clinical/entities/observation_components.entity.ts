import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `observation_components`.
 */
@Entity({ schema: 'clinical', tableName: 'observation_components' })
export class ObservationComponents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a observation.
   */
  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  /**
   * Identificador asociado a code concept.
   */
  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  /**
   * Identificador asociado a value type concept.
   */
  @Property({ fieldName: 'value_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  valueTypeConceptId!: string;

  /**
   * Valor de value decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  valueDecimal?: string;

  /**
   * Valor de value integer mantenido por la instancia.
   */
  @Property({ fieldName: 'value_integer', type: 'bigint', nullable: true })
  valueInteger?: string;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  /**
   * Valor de value text mantenido por la instancia.
   */
  @Property({ fieldName: 'value_text', columnType: 'text', nullable: true })
  valueText?: string;

  /**
   * Identificador asociado a value concept.
   */
  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  /**
   * Valor de value datetime mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_datetime',
    columnType: 'timestamptz',
    nullable: true,
  })
  valueDatetime?: Date;

  /**
   * Valor de quantity value mantenido por la instancia.
   */
  @Property({
    fieldName: 'quantity_value',
    columnType: 'numeric',
    nullable: true,
  })
  quantityValue?: string;

  /**
   * Identificador asociado a quantity unit concept.
   */
  @Property({
    fieldName: 'quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quantityUnitConceptId?: string;

  /**
   * Valor de range low value mantenido por la instancia.
   */
  @Property({
    fieldName: 'range_low_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeLowValue?: string;

  /**
   * Valor de range high value mantenido por la instancia.
   */
  @Property({
    fieldName: 'range_high_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeHighValue?: string;

  /**
   * Identificador asociado a range unit concept.
   */
  @Property({
    fieldName: 'range_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  rangeUnitConceptId?: string;

  /**
   * Identificador asociado a data absent reason concept.
   */
  @Property({
    fieldName: 'data_absent_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataAbsentReasonConceptId?: string;

  /**
   * Identificador asociado a interpretation concept.
   */
  @Property({
    fieldName: 'interpretation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  interpretationConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

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
