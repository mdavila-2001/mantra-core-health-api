import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'tool_registry' })
export class ToolRegistry {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'tool_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toolTypeConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  vendor?: string;

  @Property({
    fieldName: 'current_version',
    columnType: 'varchar',
    nullable: true,
  })
  currentVersion?: string;

  @Property({ columnType: 'text', nullable: true })
  purpose?: string;

  @Property({
    fieldName: 'homepage_url',
    columnType: 'varchar',
    nullable: true,
  })
  homepageUrl?: string;

  @Property({ fieldName: 'is_approved', type: 'boolean', nullable: true })
  isApproved?: boolean;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
