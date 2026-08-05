import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_validation_rules`.
 */
@Entity({ schema: 'forms', tableName: 'field_validation_rules' })
export class FieldValidationRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a field.
   */
  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK → forms.dynamic_field_definitions
  fieldId!: string;

  /**
   * Identificador asociado a rule type concept.
   */
  @Property({ fieldName: 'rule_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ruleTypeConceptId!: string;

  /**
   * Identificador asociado a operator concept.
   */
  @Property({ fieldName: 'operator_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  operatorConceptId?: string;

  /**
   * Valor de parameters json mantenido por la instancia.
   */
  @Property({ fieldName: 'parameters_json', type: 'json', columnType: 'jsonb' })
  parametersJson!: unknown;

  /**
   * Valor de error message mantenido por la instancia.
   */
  @Property({
    fieldName: 'error_message',
    columnType: 'varchar',
    nullable: true,
  })
  errorMessage?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  severityConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  /**
   * Valor de active mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  active?: boolean;

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
