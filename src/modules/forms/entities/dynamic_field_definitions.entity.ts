import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dynamic_field_definitions`.
 */
@Entity({ schema: 'forms', tableName: 'dynamic_field_definitions' })
export class DynamicFieldDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @Property({
    fieldName: 'data_type',
    columnType: 'terminology.technical_data_type',
  })
  dataType!: string;

  /**
   * Identificador asociado a data use concept.
   */
  @Property({ fieldName: 'data_use_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  dataUseConceptId?: string;

  /**
   * Identificador asociado a sensitivity concept.
   */
  @Property({
    fieldName: 'sensitivity_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sensitivityConceptId?: string;

  /**
   * Identificador asociado a semantic concept.
   */
  @Property({ fieldName: 'semantic_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  semanticConceptId?: string;

  /**
   * Identificador asociado a value set.
   */
  @Property({ fieldName: 'value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  valueSetId?: string;

  /**
   * Identificador asociado a unit value set.
   */
  @Property({ fieldName: 'unit_value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  unitValueSetId?: string;

  /**
   * Valor de cardinality min mantenido por la instancia.
   */
  @Property({ fieldName: 'cardinality_min', columnType: 'int', nullable: true })
  cardinalityMin?: number;

  /**
   * Valor de cardinality max mantenido por la instancia.
   */
  @Property({ fieldName: 'cardinality_max', columnType: 'int', nullable: true })
  cardinalityMax?: number;

  /**
   * Valor de length min mantenido por la instancia.
   */
  @Property({ fieldName: 'length_min', columnType: 'int', nullable: true })
  lengthMin?: number;

  /**
   * Valor de length max mantenido por la instancia.
   */
  @Property({ fieldName: 'length_max', columnType: 'int', nullable: true })
  lengthMax?: number;

  /**
   * Valor de num precision mantenido por la instancia.
   */
  @Property({ fieldName: 'num_precision', columnType: 'int', nullable: true })
  numPrecision?: number;

  /**
   * Valor de num scale mantenido por la instancia.
   */
  @Property({ fieldName: 'num_scale', columnType: 'int', nullable: true })
  numScale?: number;

  /**
   * Valor de min value decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'min_value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  minValueDecimal?: string;

  /**
   * Valor de max value decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  maxValueDecimal?: string;

  /**
   * Valor de regex mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  regex?: string;

  /**
   * Valor de default value json mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  defaultValueJson?: unknown;

  /**
   * Valor de keeps history mantenido por la instancia.
   */
  @Property({ fieldName: 'keeps_history', type: 'boolean', nullable: true })
  keepsHistory?: boolean;

  /**
   * Valor de computed mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  computed?: boolean;

  /**
   * Valor de computation expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'computation_expression',
    columnType: 'text',
    nullable: true,
  })
  computationExpression?: string;

  /**
   * Valor de fhir path mantenido por la instancia.
   */
  @Property({ fieldName: 'fhir_path', columnType: 'varchar', nullable: true })
  fhirPath?: string;

  /**
   * Valor de fhir extension url mantenido por la instancia.
   */
  @Property({
    fieldName: 'fhir_extension_url',
    columnType: 'text',
    nullable: true,
  })
  fhirExtensionUrl?: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_version', columnType: 'int', nullable: true })
  schemaVersion?: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

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
