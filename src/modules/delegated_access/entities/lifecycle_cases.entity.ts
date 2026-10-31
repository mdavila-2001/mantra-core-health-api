import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Caso de ciclo de vida de una persona de apoyo: ingreso, cambio, baja, suspensión o reactivación, con su lista de verificación.
 */
@Entity({ schema: 'delegated_access', tableName: 'lifecycle_cases' })
export class LifecycleCases {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `organization_user_assignment_id`. */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments
  organizationUserAssignmentId!: string;

  /** Columna `subject_user_id`. */
  @Property({ fieldName: 'subject_user_id', type: 'uuid' }) // FK → iam.users
  subjectUserId!: string;

  /** Columna `kind_concept_id`. */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `opened_by_user_id`. */
  @Property({ fieldName: 'opened_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  openedByUserId?: string;

  /** Columna `opened_at`. */
  @Property({ fieldName: 'opened_at', columnType: 'timestamptz' })
  openedAt!: Date;

  /** Columna `due_at`. */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /** Columna `completed_at`. */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /** Columna `reason_text`. */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /** Columna `checklist_json`. */
  @Property({ fieldName: 'checklist_json', type: 'json', columnType: 'jsonb' })
  checklistJson!: unknown;

  /** Columna `details_json`. */
  @Property({
    fieldName: 'details_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailsJson?: unknown;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
