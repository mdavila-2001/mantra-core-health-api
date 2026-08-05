import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `gateway_settlements`.
 */
@Entity({ schema: 'payments', tableName: 'gateway_settlements' })
export class GatewaySettlements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a gateway.
   */
  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  /**
   * Valor de settlement ref mantenido por la instancia.
   */
  @Property({ fieldName: 'settlement_ref', columnType: 'varchar' })
  settlementRef!: string;

  /**
   * Valor de gross amount mantenido por la instancia.
   */
  @Property({ fieldName: 'gross_amount', columnType: 'numeric' })
  grossAmount!: string;

  /**
   * Valor de fee amount mantenido por la instancia.
   */
  @Property({ fieldName: 'fee_amount', columnType: 'numeric' })
  feeAmount!: string;

  /**
   * Valor de net amount mantenido por la instancia.
   */
  @Property({ fieldName: 'net_amount', columnType: 'numeric' })
  netAmount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  /**
   * Valor de settled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'settled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  settledAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a journal transaction.
   */
  @Property({
    fieldName: 'journal_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.journal_transactions
  journalTransactionId?: string;

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
