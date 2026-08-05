import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_value_access_rules`.
 */
@Entity({ schema: 'forms', tableName: 'field_value_access_rules' })
export class FieldValueAccessRules {
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
   * Identificador asociado a assignment.
   */
  @Property({ fieldName: 'assignment_id', type: 'uuid', nullable: true }) // FK → forms.field_assignments
  assignmentId?: string;

  /**
   * Identificador asociado a purpose of use value set.
   */
  @Property({ fieldName: 'purpose_of_use_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  purposeOfUseValueSetId!: string;

  /**
   * Identificador asociado a read role value set.
   */
  @Property({
    fieldName: 'read_role_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  readRoleValueSetId?: string;

  /**
   * Identificador asociado a write role value set.
   */
  @Property({
    fieldName: 'write_role_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  writeRoleValueSetId?: string;

  /**
   * Identificador asociado a consent category concept.
   */
  @Property({
    fieldName: 'consent_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  consentCategoryConceptId?: string;

  /**
   * Identificador asociado a mask strategy concept.
   */
  @Property({
    fieldName: 'mask_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maskStrategyConceptId?: string;

  /**
   * Valor de break glass allowed mantenido por la instancia.
   */
  @Property({
    fieldName: 'break_glass_allowed',
    type: 'boolean',
    nullable: true,
  })
  breakGlassAllowed?: boolean;

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
