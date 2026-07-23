import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_renewals' })
export class ContractRenewals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  @Property({ fieldName: 'renewal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  renewalTypeConceptId!: string;

  @Property({
    fieldName: 'notice_due_date',
    columnType: 'date',
    nullable: true,
  })
  noticeDueDate?: Date;

  @Property({
    fieldName: 'renewal_effective_date',
    columnType: 'date',
    nullable: true,
  })
  renewalEffectiveDate?: Date;

  @Property({ fieldName: 'new_end_date', columnType: 'date', nullable: true })
  newEndDate?: Date;

  @Property({
    fieldName: 'proposed_value',
    columnType: 'numeric',
    nullable: true,
  })
  proposedValue?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'initiated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  initiatedByUserId?: string;

  @Property({ fieldName: 'decision_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decisionByUserId?: string;

  @Property({
    fieldName: 'decision_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decisionAt?: Date;

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
