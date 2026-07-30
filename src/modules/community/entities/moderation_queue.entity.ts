import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `moderation_queue`.
 */
@Entity({ schema: 'community', tableName: 'moderation_queue' })
export class ModerationQueue {
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
   * Identificador asociado a content type concept.
   */
  @Property({ fieldName: 'content_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentTypeConceptId!: string;

  /**
   * Identificador asociado a content ref.
   */
  @Property({ fieldName: 'content_ref_id', type: 'uuid' })
  contentRefId!: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  /**
   * Identificador asociado a content report.
   */
  @Property({ fieldName: 'content_report_id', type: 'uuid', nullable: true }) // FK → community.content_reports
  contentReportId?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  priorityConceptId?: string;

  /**
   * Valor de ml score mantenido por la instancia.
   */
  @Property({ fieldName: 'ml_score', columnType: 'numeric', nullable: true })
  mlScore?: string;

  /**
   * Identificador asociado a assigned to user.
   */
  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedToUserId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de queued at mantenido por la instancia.
   */
  @Property({
    fieldName: 'queued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  queuedAt?: Date;

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
