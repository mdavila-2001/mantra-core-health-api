import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'directory', tableName: 'tenant_memberships' })
export class TenantMemberships {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'primary_branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  primaryBranchId?: string;

  @Property({ fieldName: 'tenant_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  tenantRoleConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'access_scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accessScopeConceptId!: string;

  @Property({ fieldName: 'start_date', columnType: 'timestamptz' })
  startDate!: Date;

  @Property({
    fieldName: 'end_date',
    columnType: 'timestamptz',
    nullable: true,
  })
  endDate?: Date;

  @Property({ fieldName: 'invited_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  invitedByUserId?: string;

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
