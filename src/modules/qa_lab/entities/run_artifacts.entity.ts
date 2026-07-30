import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `run_artifacts`.
 */
@Entity({ schema: 'qa_lab', tableName: 'run_artifacts' })
export class RunArtifacts {
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
   * Identificador asociado a test case result.
   */
  @Property({ fieldName: 'test_case_result_id', type: 'uuid', nullable: true }) // FK → qa_lab.test_case_results
  testCaseResultId?: string;

  /**
   * Identificador asociado a artifact type concept.
   */
  @Property({ fieldName: 'artifact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  artifactTypeConceptId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  label?: string;

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
