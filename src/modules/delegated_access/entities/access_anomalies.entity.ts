import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Anomalía de actividad detectada por el barrido (picos de búsquedas, fuera de horario, cuenta inactiva, acumulación de privilegios…).
 */
@Entity({ schema: 'delegated_access', tableName: 'access_anomalies' })
export class AccessAnomalies {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `user_id`. */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /** Columna `organization_user_assignment_id`. */
  @Property({
    fieldName: 'organization_user_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.organization_user_assignments
  organizationUserAssignmentId?: string;

  /** Columna `kind_concept_id`. */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /** Columna `window_start`. */
  @Property({ fieldName: 'window_start', columnType: 'timestamptz' })
  windowStart!: Date;

  /** Columna `window_end`. */
  @Property({ fieldName: 'window_end', columnType: 'timestamptz' })
  windowEnd!: Date;

  /** Columna `observed_value`. */
  @Property({ fieldName: 'observed_value', columnType: 'numeric(12,2)' })
  observedValue!: string;

  /** Columna `baseline_value`. */
  @Property({
    fieldName: 'baseline_value',
    columnType: 'numeric(12,2)',
    nullable: true,
  })
  baselineValue?: string;

  /** Columna `threshold_value`. */
  @Property({ fieldName: 'threshold_value', columnType: 'numeric(12,2)' })
  thresholdValue!: string;

  /** Columna `evidence_json`. */
  @Property({ fieldName: 'evidence_json', type: 'json', columnType: 'jsonb' })
  evidenceJson!: unknown;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `acknowledged_by_user_id`. */
  @Property({
    fieldName: 'acknowledged_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  acknowledgedByUserId?: string;

  /** Columna `acknowledged_at`. */
  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  /** Columna `resolution_comment_text`. */
  @Property({
    fieldName: 'resolution_comment_text',
    columnType: 'text',
    nullable: true,
  })
  resolutionCommentText?: string;

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
