import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_obligations' })
export class ContractObligations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  @Property({ fieldName: 'contract_version_id', type: 'uuid', nullable: true }) // FK → erp.contract_versions
  contractVersionId?: string;

  @Property({
    fieldName: 'contract_clause_instance_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_clause_instances
  contractClauseInstanceId?: string;

  @Property({ fieldName: 'obligation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  obligationTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({
    fieldName: 'responsible_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  responsibleBusinessPartnerId?: string;

  @Property({ fieldName: 'responsible_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  responsibleUserId?: string;

  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  @Property({
    fieldName: 'recurrence_rule',
    columnType: 'varchar',
    nullable: true,
  })
  recurrenceRule?: string;

  @Property({
    fieldName: 'financial_amount',
    columnType: 'numeric',
    nullable: true,
  })
  financialAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'evidence_required', type: 'boolean', nullable: true })
  evidenceRequired?: boolean;

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
