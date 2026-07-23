import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payouts' })
export class Payouts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({ fieldName: 'payee_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  payeeTypeConceptId!: string;

  @Property({ fieldName: 'payee_ref_id', type: 'uuid' })
  payeeRefId!: string;

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK (destino no resuelto)
  gatewayId!: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

  @Property({
    fieldName: 'executed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  executedAt?: Date;

  @Property({
    fieldName: 'destination_ref',
    columnType: 'varchar',
    nullable: true,
  })
  destinationRef?: string;

  @Property({
    fieldName: 'gateway_payout_ref',
    columnType: 'varchar',
    nullable: true,
  })
  gatewayPayoutRef?: string;

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
