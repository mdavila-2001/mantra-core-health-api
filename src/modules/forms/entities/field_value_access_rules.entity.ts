import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_value_access_rules' })
export class FieldValueAccessRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK (destino no resuelto)
  fieldId!: string;

  @Property({ fieldName: 'assignment_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  assignmentId?: string;

  @Property({ fieldName: 'purpose_of_use_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  purposeOfUseValueSetId!: string;

  @Property({
    fieldName: 'read_role_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  readRoleValueSetId?: string;

  @Property({
    fieldName: 'write_role_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  writeRoleValueSetId?: string;

  @Property({
    fieldName: 'consent_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  consentCategoryConceptId?: string;

  @Property({
    fieldName: 'mask_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maskStrategyConceptId?: string;

  @Property({
    fieldName: 'break_glass_allowed',
    type: 'boolean',
    nullable: true,
  })
  breakGlassAllowed?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
