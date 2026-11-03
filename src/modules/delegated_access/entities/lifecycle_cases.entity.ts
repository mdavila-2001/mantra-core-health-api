import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lifecycle_cases`.
 */
@Entity({ schema: 'delegated_access', tableName: 'lifecycle_cases' })
export class LifecycleCases {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a organization user assignment.
   */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments (inferida)
  organizationUserAssignmentId!: string;

  /**
   * Identificador asociado a subject user.
   */
  @Property({ fieldName: 'subject_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  subjectUserId!: string;

  /**
   * Identificador asociado a kind concept.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  kindConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Identificador asociado a opened by user.
   */
  @Property({ fieldName: 'opened_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  openedByUserId?: string;

  /**
   * Valor de opened at mantenido por la instancia.
   */
  @Property({ fieldName: 'opened_at', columnType: 'timestamptz' })
  openedAt!: Date;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Valor de checklist json mantenido por la instancia.
   */
  @Property({ fieldName: 'checklist_json', type: 'json', columnType: 'jsonb' })
  checklistJson!: unknown;

  /**
   * Valor de details json mantenido por la instancia.
   */
  @Property({
    fieldName: 'details_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailsJson?: unknown;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
