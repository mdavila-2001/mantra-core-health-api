import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'reconciliation_runs' })
export class PaymentsReconciliationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'total_gateway',
    columnType: 'numeric',
    nullable: true,
  })
  totalGateway?: string;

  @Property({
    fieldName: 'total_ledger',
    columnType: 'numeric',
    nullable: true,
  })
  totalLedger?: string;

  @Property({ fieldName: 'total_bank', columnType: 'numeric', nullable: true })
  totalBank?: string;

  @Property({ fieldName: 'matched_count', columnType: 'int', nullable: true })
  matchedCount?: number;

  @Property({ fieldName: 'unmatched_count', columnType: 'int', nullable: true })
  unmatchedCount?: number;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

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
