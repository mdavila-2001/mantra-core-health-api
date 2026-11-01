import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `access_anomalies`.
 */
@Entity({ schema: 'delegated_access', tableName: 'access_anomalies' })
export class AccessAnomalies {
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
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users (inferida)
  userId!: string;

  /**
   * Identificador asociado a organization user assignment.
   */
  @Property({
    fieldName: 'organization_user_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.organization_user_assignments (inferida)
  organizationUserAssignmentId?: string;

  /**
   * Identificador asociado a kind concept.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  kindConceptId!: string;

  /**
   * Valor de window start mantenido por la instancia.
   */
  @Property({ fieldName: 'window_start', columnType: 'timestamptz' })
  windowStart!: Date;

  /**
   * Valor de window end mantenido por la instancia.
   */
  @Property({ fieldName: 'window_end', columnType: 'timestamptz' })
  windowEnd!: Date;

  /**
   * Valor de observed value mantenido por la instancia.
   */
  @Property({ fieldName: 'observed_value', columnType: 'numeric(12,2)' })
  observedValue!: string;

  /**
   * Valor de baseline value mantenido por la instancia.
   */
  @Property({
    fieldName: 'baseline_value',
    columnType: 'numeric(12,2)',
    nullable: true,
  })
  baselineValue?: string;

  /**
   * Valor de threshold value mantenido por la instancia.
   */
  @Property({ fieldName: 'threshold_value', columnType: 'numeric(12,2)' })
  thresholdValue!: string;

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_json', type: 'json', columnType: 'jsonb' })
  evidenceJson!: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Identificador asociado a acknowledged by user.
   */
  @Property({
    fieldName: 'acknowledged_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users (inferida)
  acknowledgedByUserId?: string;

  /**
   * Valor de acknowledged at mantenido por la instancia.
   */
  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  /**
   * Valor de resolution comment text mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolution_comment_text',
    columnType: 'text',
    nullable: true,
  })
  resolutionCommentText?: string;

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
