import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `workflow_instances`.
 */
@Entity({ schema: 'workflow', tableName: 'workflow_instances' })
export class WorkflowInstances {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de workflow code mantenido por la instancia.
   */
  @Property({ fieldName: 'workflow_code', columnType: 'varchar' })
  workflowCode!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject.
   */
  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a current state concept.
   */
  @Property({ fieldName: 'current_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currentStateConceptId!: string;

  /**
   * Valor de current step code mantenido por la instancia.
   */
  @Property({
    fieldName: 'current_step_code',
    columnType: 'varchar',
    nullable: true,
  })
  currentStepCode?: string;

  /**
   * Valor de context json mantenido por la instancia.
   */
  @Property({
    fieldName: 'context_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contextJson?: unknown;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
