import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `test_defects`.
 */
@Entity({ schema: 'qa_lab', tableName: 'test_defects' })
export class TestDefects {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a test case.
   */
  @Property({ fieldName: 'test_case_id', type: 'uuid' }) // FK → qa_lab.test_cases
  testCaseId!: string;

  /**
   * Identificador asociado a test case result.
   */
  @Property({ fieldName: 'test_case_result_id', type: 'uuid', nullable: true }) // FK → qa_lab.test_case_results
  testCaseResultId?: string;

  /**
   * Valor de defect number mantenido por la instancia.
   */
  @Property({ fieldName: 'defect_number', columnType: 'varchar' })
  defectNumber!: string;

  /**
   * Identificador asociado a defect type concept.
   */
  @Property({ fieldName: 'defect_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  defectTypeConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de is flaky mantenido por la instancia.
   */
  @Property({ fieldName: 'is_flaky', type: 'boolean', nullable: true })
  isFlaky?: boolean;

  /**
   * Valor de failure signature hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_signature_hash',
    columnType: 'varchar',
    nullable: true,
  })
  failureSignatureHash?: string;

  /**
   * Valor de occurrences count mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurrences_count',
    columnType: 'int',
    nullable: true,
  })
  occurrencesCount?: number;

  /**
   * Valor de first seen at mantenido por la instancia.
   */
  @Property({
    fieldName: 'first_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  firstSeenAt?: Date;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  /**
   * Valor de external issue ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_issue_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalIssueRef?: string;

  /**
   * Identificador asociado a assigned to user.
   */
  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedToUserId?: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

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
