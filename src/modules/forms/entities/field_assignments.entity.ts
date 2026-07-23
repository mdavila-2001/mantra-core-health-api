import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_assignments' })
export class FieldAssignments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK (destino no resuelto)
  fieldId!: string;

  @Property({ fieldName: 'target_resource_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetResourceConceptId!: string;

  @Property({
    fieldName: 'profile_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  profileTypeConceptId?: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  @Property({ fieldName: 'section_id', type: 'uuid' }) // FK (destino no resuelto)
  sectionId!: string;

  @Property({ type: 'boolean' })
  required!: boolean;

  @Property({ type: 'boolean' })
  visible!: boolean;

  @Property({ type: 'boolean' })
  editable!: boolean;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

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
