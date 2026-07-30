import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `test_schedules`.
 */
@Entity({ schema: 'qa_lab', tableName: 'test_schedules' })
export class TestSchedules {
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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de cron expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'cron_expression',
    columnType: 'varchar',
    nullable: true,
  })
  cronExpression?: string;

  /**
   * Valor de timezone mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  timezone?: string;

  /**
   * Identificador asociado a trigger concept.
   */
  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  /**
   * Identificador asociado a concurrency policy concept.
   */
  @Property({
    fieldName: 'concurrency_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  concurrencyPolicyConceptId?: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

  /**
   * Identificador asociado a last run.
   */
  @Property({ fieldName: 'last_run_id', type: 'uuid', nullable: true }) // FK → qa_lab.test_runs
  lastRunId?: string;

  /**
   * Valor de last run at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRunAt?: Date;

  /**
   * Identificador asociado a notify channel concept.
   */
  @Property({
    fieldName: 'notify_channel_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  notifyChannelConceptId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
