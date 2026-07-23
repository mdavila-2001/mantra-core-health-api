import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'connected_accounts' })
export class ConnectedAccounts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK (destino no resuelto)
  gatewayId!: string;

  @Property({ fieldName: 'payee_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  payeeTypeConceptId!: string;

  @Property({ fieldName: 'payee_ref_id', type: 'uuid' })
  payeeRefId!: string;

  @Property({ fieldName: 'external_account_ref', columnType: 'varchar' })
  externalAccountRef!: string;

  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

  @Property({ fieldName: 'onboarding_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  onboardingStatusConceptId!: string;

  @Property({
    fieldName: 'capabilities_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  capabilitiesJson?: unknown;

  @Property({ fieldName: 'default_wallet_id', type: 'uuid', nullable: true }) // FK → payments.wallets
  defaultWalletId?: string;

  @Property({
    fieldName: 'payout_schedule_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  payoutScheduleConceptId?: string;

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
