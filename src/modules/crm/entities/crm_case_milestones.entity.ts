import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_case_milestones' })
export class CrmCaseMilestones {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_case_id', type: 'uuid' }) // FK → crm.crm_cases
  crmCaseId!: string;

  @Property({ fieldName: 'crm_entitlement_id', type: 'uuid', nullable: true }) // FK → crm.crm_entitlements
  crmEntitlementId?: string;

  @Property({ fieldName: 'milestone_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  milestoneTypeConceptId!: string;

  @Property({
    fieldName: 'target_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  targetAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({
    fieldName: 'breached_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  breachedAt?: Date;

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
