import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Bitácora ordenada de un plan (progreso consultable). Append-only; nunca contiene secretos ni cuerpos.
 */
@Entity({ schema: 'qa_execution', tableName: 'plan_events' })
export class PlanEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** FK → qa_execution.execution_plans */
  @Property({ fieldName: 'plan_id', type: 'uuid' }) // FK → qa_execution.execution_plans
  planId!: string;

  /** Orden dentro del plan. */
  @Property({ columnType: 'int' })
  seq!: number;

  /**
   * Valor de kind mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  kind!: string;

  /** FK → qa_lab.test_cases */
  @Property({ fieldName: 'case_id', type: 'uuid', nullable: true }) // FK → qa_lab.test_cases
  caseId?: string;

  /**
   * Valor de detail json mantenido por la instancia.
   */
  @Property({
    fieldName: 'detail_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
