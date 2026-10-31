import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'space_unit_assignments' })
export class SpaceUnitAssignments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  @Property({ fieldName: 'clinical_unit_id', type: 'uuid' }) // FK → practice.clinical_units (inferida)
  clinicalUnitId!: string;

  @Property({ fieldName: 'role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  roleConceptId!: string;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
