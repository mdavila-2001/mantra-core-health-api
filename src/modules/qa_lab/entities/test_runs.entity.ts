import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `test_runs`.
 */
@Entity({ schema: 'qa_lab', tableName: 'test_runs' })
export class TestRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a suite.
   */
  @Property({ fieldName: 'suite_id', type: 'uuid' }) // FK → qa_lab.test_suites
  suiteId!: string;

  /**
   * Identificador asociado a environment.
   */
  @Property({ fieldName: 'environment_id', type: 'uuid' }) // FK → qa_lab.test_environments
  environmentId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de run number mantenido por la instancia.
   */
  @Property({ fieldName: 'run_number', columnType: 'varchar' })
  runNumber!: string;

  /**
   * Identificador asociado a trigger concept.
   */
  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  /**
   * Identificador asociado a triggered by user.
   */
  @Property({ fieldName: 'triggered_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  triggeredByUserId?: string;

  /**
   * Valor de git ref mantenido por la instancia.
   */
  @Property({ fieldName: 'git_ref', columnType: 'varchar', nullable: true })
  gitRef?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
   * Valor de total cases mantenido por la instancia.
   */
  @Property({ fieldName: 'total_cases', columnType: 'int', nullable: true })
  totalCases?: number;

  /**
   * Valor de total passed mantenido por la instancia.
   */
  @Property({ fieldName: 'total_passed', columnType: 'int', nullable: true })
  totalPassed?: number;

  /**
   * Valor de total failed mantenido por la instancia.
   */
  @Property({ fieldName: 'total_failed', columnType: 'int', nullable: true })
  totalFailed?: number;

  /**
   * Valor de total skipped mantenido por la instancia.
   */
  @Property({ fieldName: 'total_skipped', columnType: 'int', nullable: true })
  totalSkipped?: number;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

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
