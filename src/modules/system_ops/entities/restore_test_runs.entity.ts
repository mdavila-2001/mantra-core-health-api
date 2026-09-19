import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import { RestoreObjectiveStatus } from '../policies';

/**
 * Mapea la entidad persistente asociada a `restore_test_runs`.
 */
@Entity({ schema: 'system_ops', tableName: 'restore_test_runs' })
export class RestoreTestRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a backup policy.
   */
  @Property({ fieldName: 'backup_policy_id', type: 'uuid' }) // FK → system_ops.backup_policies
  backupPolicyId!: string;

  /**
   * Valor de backup reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'backup_reference',
    columnType: 'varchar',
    nullable: true,
  })
  backupReference?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Valor de measured rpo seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'measured_rpo_seconds',
    columnType: 'int',
    nullable: true,
  })
  measuredRpoSeconds?: number;

  /**
   * Valor de measured rto seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'measured_rto_seconds',
    columnType: 'int',
    nullable: true,
  })
  measuredRtoSeconds?: number;

  /**
   * Valor de integrity check passed mantenido por la instancia.
   */
  @Property({
    fieldName: 'integrity_check_passed',
    type: 'boolean',
    nullable: true,
  })
  integrityCheckPassed?: boolean;

  /**
   * Evaluación trivalente de la corrida contra los objetivos de su política
   * (MCH-023). `NOT_MEASURED` es el valor de las corridas sin evidencia
   * suficiente — y el de las filas anteriores al patch v4.2.20, que se
   * registraron cuando el sistema no sabía distinguir «no se midió» de «no
   * incumple».
   */
  @Property({
    fieldName: 'objective_status',
    columnType: 'varchar',
    default: RestoreObjectiveStatus.NOT_MEASURED,
  })
  objectiveStatus: RestoreObjectiveStatus = RestoreObjectiveStatus.NOT_MEASURED;

  /**
   * Identificador asociado a evidence file.
   */
  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

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
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
