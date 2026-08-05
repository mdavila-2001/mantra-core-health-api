import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_values`.
 */
@Entity({ schema: 'forms', tableName: 'field_values' })
export class FieldValues {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a form instance.
   */
  @Property({ fieldName: 'form_instance_id', type: 'uuid' }) // FK → forms.form_instances
  formInstanceId!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  /**
   * Identificador asociado a resource.
   */
  @Property({ fieldName: 'resource_id', type: 'uuid' })
  resourceId!: string;

  /**
   * Identificador asociado a field.
   */
  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK → forms.dynamic_field_definitions
  fieldId!: string;

  /**
   * Identificador asociado a assignment.
   */
  @Property({ fieldName: 'assignment_id', type: 'uuid', nullable: true }) // FK → forms.field_assignments
  assignmentId?: string;

  /**
   * Identificador asociado a instance group.
   */
  @Property({ fieldName: 'instance_group_id', type: 'uuid', nullable: true })
  instanceGroupId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

  /**
   * Valor de value string mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_string',
    columnType: 'varchar',
    nullable: true,
  })
  valueString?: string;

  /**
   * Valor de value text mantenido por la instancia.
   */
  @Property({ fieldName: 'value_text', columnType: 'text', nullable: true })
  valueText?: string;

  /**
   * Valor de value integer mantenido por la instancia.
   */
  @Property({ fieldName: 'value_integer', type: 'bigint', nullable: true })
  valueInteger?: string;

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
   * Valor de value boolean mantenido por la instancia.
   */
  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  /**
   * Valor de value date mantenido por la instancia.
   */
  @Property({ fieldName: 'value_date', columnType: 'date', nullable: true })
  valueDate?: Date;

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
   * Valor de value time mantenido por la instancia.
   */
  @Property({ fieldName: 'value_time', columnType: 'time', nullable: true })
  valueTime?: string;

  /**
   * Valor de value url mantenido por la instancia.
   */
  @Property({ fieldName: 'value_url', columnType: 'text', nullable: true })
  valueUrl?: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  valueJson?: unknown;

  /**
   * Identificador asociado a value concept.
   */
  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  /**
   * Valor de value reference type mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_reference_type',
    columnType: 'varchar',
    nullable: true,
  })
  valueReferenceType?: string;

  /**
   * Identificador asociado a value reference.
   */
  @Property({ fieldName: 'value_reference_id', type: 'uuid', nullable: true })
  valueReferenceId?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Identificador asociado a data source concept.
   */
  @Property({
    fieldName: 'data_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataSourceConceptId?: string;

  /**
   * Identificador asociado a value status concept.
   */
  @Property({
    fieldName: 'value_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  valueStatusConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

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
   * Valor de value version mantenido por la instancia.
   */
  @Property({ fieldName: 'value_version', columnType: 'int', nullable: true })
  valueVersion?: number;

  /**
   * Identificador asociado a supersedes value.
   */
  @Property({ fieldName: 'supersedes_value_id', type: 'uuid', nullable: true }) // FK → forms.field_values
  supersedesValueId?: string;

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
