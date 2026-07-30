import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `financial_kpi_snapshots`.
 */
@Entity({ schema: 'billing', tableName: 'financial_kpi_snapshots' })
export class FinancialKpiSnapshots {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @Property({ fieldName: 'fiscal_period_id', type: 'uuid', nullable: true }) // FK → accounting.fiscal_periods
  fiscalPeriodId?: string;

  /**
   * Valor de kpi code mantenido por la instancia.
   */
  @Property({ fieldName: 'kpi_code', columnType: 'varchar' })
  kpiCode!: string;

  /**
   * Valor de value numeric mantenido por la instancia.
   */
  @Property({ fieldName: 'value_numeric', columnType: 'numeric' })
  valueNumeric!: string;

  /**
   * Valor de dimension json mantenido por la instancia.
   */
  @Property({
    fieldName: 'dimension_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dimensionJson?: unknown;

  /**
   * Valor de computed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'computed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  computedAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
