import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'observation_components' })
export class ObservationComponents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  @Property({ fieldName: 'value_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  valueTypeConceptId!: string;

  @Property({
    fieldName: 'value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  valueDecimal?: string;

  @Property({ fieldName: 'value_integer', type: 'bigint', nullable: true })
  valueInteger?: string;

  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  @Property({ fieldName: 'value_text', columnType: 'text', nullable: true })
  valueText?: string;

  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  @Property({
    fieldName: 'value_datetime',
    columnType: 'timestamptz',
    nullable: true,
  })
  valueDatetime?: Date;

  @Property({
    fieldName: 'quantity_value',
    columnType: 'numeric',
    nullable: true,
  })
  quantityValue?: string;

  @Property({
    fieldName: 'quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quantityUnitConceptId?: string;

  @Property({
    fieldName: 'range_low_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeLowValue?: string;

  @Property({
    fieldName: 'range_high_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeHighValue?: string;

  @Property({
    fieldName: 'range_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  rangeUnitConceptId?: string;

  @Property({
    fieldName: 'data_absent_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataAbsentReasonConceptId?: string;

  @Property({
    fieldName: 'interpretation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  interpretationConceptId?: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
