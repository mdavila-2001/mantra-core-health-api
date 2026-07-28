import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_accounts`.
 */
@Entity({ schema: 'ads', tableName: 'ad_accounts' })
export class AdAccounts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a business manager.
   */
  @Property({ fieldName: 'business_manager_id', type: 'uuid' }) // FK → ads.business_managers
  businessManagerId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de external account ref mantenido por la instancia.
   */
  @Property({ fieldName: 'external_account_ref', columnType: 'varchar' })
  externalAccountRef!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  /**
   * Identificador asociado a account status concept.
   */
  @Property({ fieldName: 'account_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountStatusConceptId!: string;

  /**
   * Valor de spend cap amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'spend_cap_amount',
    columnType: 'numeric',
    nullable: true,
  })
  spendCapAmount?: string;

  /**
   * Valor de amount spent mantenido por la instancia.
   */
  @Property({
    fieldName: 'amount_spent',
    columnType: 'numeric',
    nullable: true,
  })
  amountSpent?: string;

  /**
   * Identificador asociado a funding payment method.
   */
  @Property({
    fieldName: 'funding_payment_method_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_methods
  fundingPaymentMethodId?: string;

  /**
   * Identificador asociado a disable reason concept.
   */
  @Property({
    fieldName: 'disable_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  disableReasonConceptId?: string;

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
