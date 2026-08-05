import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_assignments`.
 */
@Entity({ schema: 'forms', tableName: 'field_assignments' })
export class FieldAssignments {
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
   * Identificador asociado a target resource concept.
   */
  @Property({ fieldName: 'target_resource_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetResourceConceptId!: string;

  /**
   * Identificador asociado a profile type concept.
   */
  @Property({
    fieldName: 'profile_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  profileTypeConceptId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a branch.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  /**
   * Identificador asociado a section.
   */
  @Property({ fieldName: 'section_id', type: 'uuid' }) // FK → forms.dynamic_field_sections
  sectionId!: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  required!: boolean;

  /**
   * Valor de visible mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  visible!: boolean;

  /**
   * Valor de editable mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  editable!: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
