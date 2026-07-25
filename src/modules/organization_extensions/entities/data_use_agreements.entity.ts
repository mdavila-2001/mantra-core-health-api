import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'organization_extensions', tableName: 'data_use_agreements' })
export class DataUseAgreements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'counterparty_org_id', type: 'uuid', nullable: true })
  counterpartyOrgId?: string;

  @Property({
    fieldName: 'agreement_number',
    columnType: 'varchar',
    nullable: true,
  })
  agreementNumber?: string;

  @Property({ fieldName: 'purpose_concept_id', type: 'uuid', nullable: true })
  purposeConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  @Property({ fieldName: 'effective_date', columnType: 'date', nullable: true })
  effectiveDate?: string;

  @Property({ fieldName: 'expiry_date', columnType: 'date', nullable: true })
  expiryDate?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
