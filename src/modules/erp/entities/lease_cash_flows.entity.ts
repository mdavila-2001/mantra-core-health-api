import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'lease_cash_flows' })
export class LeaseCashFlows {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lease_contract_id', type: 'uuid' }) // FK → erp.lease_contracts
  leaseContractId!: string;

  @Property({ fieldName: 'lease_object_id', type: 'uuid', nullable: true }) // FK → erp.lease_objects
  leaseObjectId?: string;

  @Property({ fieldName: 'flow_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  flowTypeConceptId!: string;

  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'index_reference_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  indexReferenceConceptId?: string;

  @Property({ fieldName: 'is_fixed', type: 'boolean', nullable: true })
  isFixed?: boolean;

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
