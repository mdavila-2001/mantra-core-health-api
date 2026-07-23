import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'financial_kpi_snapshots' })
export class FinancialKpiSnapshots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'fiscal_period_id', type: 'uuid', nullable: true }) // FK → accounting.fiscal_periods
  fiscalPeriodId?: string;

  @Property({ fieldName: 'kpi_code', columnType: 'varchar' })
  kpiCode!: string;

  @Property({ fieldName: 'value_numeric', columnType: 'numeric' })
  valueNumeric!: string;

  @Property({
    fieldName: 'dimension_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dimensionJson?: unknown;

  @Property({
    fieldName: 'computed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  computedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
