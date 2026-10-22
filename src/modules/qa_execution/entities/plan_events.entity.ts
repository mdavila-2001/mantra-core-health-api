import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Bitácora ordenada de un plan (progreso consultable). Append-only; nunca contiene secretos ni cuerpos.
 */
@Entity({ schema: 'qa_execution', tableName: 'plan_events' })
export class PlanEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** FK → qa_execution.execution_plans */
  @Property({ fieldName: 'plan_id', type: 'uuid' })
  planId!: string;

  /** Orden dentro del plan. */
  @Property({ fieldName: 'seq', columnType: 'int' })
  seq!: number;

  @Property({ fieldName: 'kind', columnType: 'varchar' })
  kind!: string;

  /** FK → qa_lab.test_cases */
  @Property({ fieldName: 'case_id', type: 'uuid', nullable: true })
  caseId?: string;

  @Property({
    fieldName: 'detail_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
