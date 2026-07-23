import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'broker_carrier_agreements' })
export class BrokerCarrierAgreements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_broker_id', type: 'uuid' }) // FK → insurance.insurance_brokers
  insuranceBrokerId!: string;

  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  @Property({ fieldName: 'agreement_code', columnType: 'varchar' })
  agreementCode!: string;

  @Property({
    fieldName: 'commission_model_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  commissionModelConceptId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  @Property({ fieldName: 'contract_file_id', type: 'uuid', nullable: true }) // FK → common.files
  contractFileId?: string;

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
