import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `connected_accounts`.
 */
@Entity({ schema: 'payments', tableName: 'connected_accounts' })
export class ConnectedAccounts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a gateway.
   */
  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  /**
   * Identificador asociado a payee type concept.
   */
  @Property({ fieldName: 'payee_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  payeeTypeConceptId!: string;

  /**
   * Identificador asociado a payee ref.
   */
  @Property({ fieldName: 'payee_ref_id', type: 'uuid' })
  payeeRefId!: string;

  /**
   * Valor de external account ref mantenido por la instancia.
   */
  @Property({ fieldName: 'external_account_ref', columnType: 'varchar' })
  externalAccountRef!: string;

  /**
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  /**
   * Identificador asociado a company bank account.
   */
  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

  /**
   * Identificador asociado a onboarding status concept.
   */
  @Property({ fieldName: 'onboarding_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  onboardingStatusConceptId!: string;

  /**
   * Valor de capabilities json mantenido por la instancia.
   */
  @Property({
    fieldName: 'capabilities_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  capabilitiesJson?: unknown;

  /**
   * Identificador asociado a default wallet.
   */
  @Property({ fieldName: 'default_wallet_id', type: 'uuid', nullable: true }) // FK → payments.wallets
  defaultWalletId?: string;

  /**
   * Identificador asociado a payout schedule concept.
   */
  @Property({
    fieldName: 'payout_schedule_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  payoutScheduleConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
