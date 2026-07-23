import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'gateway_settlements' })
export class GatewaySettlements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK (destino no resuelto)
  gatewayId!: string;

  @Property({ fieldName: 'settlement_ref', columnType: 'varchar' })
  settlementRef!: string;

  @Property({ fieldName: 'gross_amount', columnType: 'numeric' })
  grossAmount!: string;

  @Property({ fieldName: 'fee_amount', columnType: 'numeric' })
  feeAmount!: string;

  @Property({ fieldName: 'net_amount', columnType: 'numeric' })
  netAmount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({
    fieldName: 'settled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  settledAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'journal_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.journal_transactions
  journalTransactionId?: string;

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
