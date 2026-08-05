import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_splits`.
 */
@Entity({ schema: 'payments', tableName: 'payment_splits' })
export class PaymentSplits {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a payment intent.
   */
  @Property({ fieldName: 'payment_intent_id', type: 'uuid' }) // FK → payments.payment_intents
  paymentIntentId!: string;

  /**
   * Identificador asociado a payee connected account.
   */
  @Property({ fieldName: 'payee_connected_account_id', type: 'uuid' }) // FK → payments.connected_accounts
  payeeConnectedAccountId!: string;

  /**
   * Identificador asociado a split type concept.
   */
  @Property({ fieldName: 'split_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  splitTypeConceptId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  /**
   * Valor de percentage mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  percentage?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de is platform fee mantenido por la instancia.
   */
  @Property({ fieldName: 'is_platform_fee', type: 'boolean' })
  isPlatformFee!: boolean;

  /**
   * Identificador asociado a destination wallet.
   */
  @Property({
    fieldName: 'destination_wallet_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.wallets
  destinationWalletId?: string;

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
