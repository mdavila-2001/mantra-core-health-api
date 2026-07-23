import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'guardrail_policies' })
export class GuardrailPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'policy_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  policyTypeConceptId!: string;

  @Property({
    fieldName: 'rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ruleJson?: unknown;

  @Property({
    fieldName: 'pii_phi_handling_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  piiPhiHandlingConceptId?: string;

  @Property({
    fieldName: 'max_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  maxCostAmount?: string;

  @Property({ fieldName: 'enforcement_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  enforcementConceptId!: string;

  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
