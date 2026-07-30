import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `postmortems`.
 */
@Entity({ schema: 'platform_ops', tableName: 'postmortems' })
export class Postmortems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health incident.
   */
  @Property({ fieldName: 'health_incident_id', type: 'uuid' }) // FK → platform_ops.health_incidents
  healthIncidentId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de impact summary mantenido por la instancia.
   */
  @Property({ fieldName: 'impact_summary', columnType: 'text', nullable: true })
  impactSummary?: string;

  /**
   * Valor de detection summary mantenido por la instancia.
   */
  @Property({
    fieldName: 'detection_summary',
    columnType: 'text',
    nullable: true,
  })
  detectionSummary?: string;

  /**
   * Valor de response summary mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_summary',
    columnType: 'text',
    nullable: true,
  })
  responseSummary?: string;

  /**
   * Valor de root cause summary mantenido por la instancia.
   */
  @Property({
    fieldName: 'root_cause_summary',
    columnType: 'text',
    nullable: true,
  })
  rootCauseSummary?: string;

  /**
   * Valor de contributing factors json mantenido por la instancia.
   */
  @Property({
    fieldName: 'contributing_factors_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contributingFactorsJson?: unknown;

  /**
   * Valor de lessons learned mantenido por la instancia.
   */
  @Property({
    fieldName: 'lessons_learned',
    columnType: 'text',
    nullable: true,
  })
  lessonsLearned?: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Identificador asociado a reviewed by user.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  /**
   * Valor de reviewed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

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
