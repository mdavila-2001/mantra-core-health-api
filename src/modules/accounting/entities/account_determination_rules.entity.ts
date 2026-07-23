import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'account_determination_rules' })
export class AccountDeterminationRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'posting_scenario_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  postingScenarioConceptId!: string;

  @Property({ fieldName: 'account_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountRoleConceptId!: string;

  @Property({
    fieldName: 'source_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sourceTypeConceptId?: string;

  @Property({ fieldName: 'asset_class_id', type: 'uuid', nullable: true }) // FK → accounting.asset_classes
  assetClassId?: string;

  @Property({
    fieldName: 'liability_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  liabilityTypeConceptId?: string;

  @Property({
    fieldName: 'contract_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  contractTypeConceptId?: string;

  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  @Property({ fieldName: 'target_account_id', type: 'uuid' }) // FK → accounting.accounts
  targetAccountId!: string;

  @Property({ columnType: 'int', nullable: true })
  priority?: number;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
