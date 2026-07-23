import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'lease_contracts' })
export class LeaseContracts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  @Property({ fieldName: 'lease_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leaseRoleConceptId!: string;

  @Property({ fieldName: 'commencement_date', columnType: 'date' })
  commencementDate!: Date;

  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  @Property({
    fieldName: 'discount_rate',
    columnType: 'numeric',
    nullable: true,
  })
  discountRate?: string;

  @Property({
    fieldName: 'accounting_principle_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  accountingPrincipleConceptId?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'short_term_exemption',
    type: 'boolean',
    nullable: true,
  })
  shortTermExemption?: boolean;

  @Property({
    fieldName: 'low_value_exemption',
    type: 'boolean',
    nullable: true,
  })
  lowValueExemption?: boolean;

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
