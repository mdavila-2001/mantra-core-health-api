import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `operational_readiness_reviews`.
 */
@Entity({ schema: 'platform_ops', tableName: 'operational_readiness_reviews' })
export class OperationalReadinessReviews {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  /**
   * Identificador asociado a deployment.
   */
  @Property({ fieldName: 'deployment_id', type: 'uuid', nullable: true }) // FK → platform_ops.deployments
  deploymentId?: string;

  /**
   * Identificador asociado a review type concept.
   */
  @Property({ fieldName: 'review_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewTypeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a facilitator user.
   */
  @Property({ fieldName: 'facilitator_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  facilitatorUserId?: string;

  /**
   * Valor de planned at mantenido por la instancia.
   */
  @Property({
    fieldName: 'planned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedAt?: Date;

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
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  decisionConceptId?: string;

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceJson?: unknown;

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
