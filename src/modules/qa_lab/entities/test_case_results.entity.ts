import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `test_case_results`.
 */
@Entity({ schema: 'qa_lab', tableName: 'test_case_results' })
export class TestCaseResults {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a test run.
   */
  @Property({ fieldName: 'test_run_id', type: 'uuid' }) // FK → qa_lab.test_runs
  testRunId!: string;

  /**
   * Identificador asociado a test case.
   */
  @Property({ fieldName: 'test_case_id', type: 'uuid' }) // FK → qa_lab.test_cases
  testCaseId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

  /**
   * Valor de assertions total mantenido por la instancia.
   */
  @Property({
    fieldName: 'assertions_total',
    columnType: 'int',
    nullable: true,
  })
  assertionsTotal?: number;

  /**
   * Valor de assertions passed mantenido por la instancia.
   */
  @Property({
    fieldName: 'assertions_passed',
    columnType: 'int',
    nullable: true,
  })
  assertionsPassed?: number;

  /**
   * Valor de assertions failed mantenido por la instancia.
   */
  @Property({
    fieldName: 'assertions_failed',
    columnType: 'int',
    nullable: true,
  })
  assertionsFailed?: number;

  /**
   * Identificador asociado a error type concept.
   */
  @Property({
    fieldName: 'error_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  errorTypeConceptId?: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Valor de stack trace mantenido por la instancia.
   */
  @Property({ fieldName: 'stack_trace', columnType: 'text', nullable: true })
  stackTrace?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

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
