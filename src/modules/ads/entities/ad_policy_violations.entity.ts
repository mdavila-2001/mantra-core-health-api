import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_policy_violations`.
 */
@Entity({ schema: 'ads', tableName: 'ad_policy_violations' })
export class AdPolicyViolations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad.
   */
  @Property({ fieldName: 'ad_id', type: 'uuid' }) // FK → ads.ads
  adId!: string;

  /**
   * Identificador asociado a ad review event.
   */
  @Property({ fieldName: 'ad_review_event_id', type: 'uuid', nullable: true }) // FK → ads.ad_review_events
  adReviewEventId?: string;

  /**
   * Valor de policy code mantenido por la instancia.
   */
  @Property({ fieldName: 'policy_code', columnType: 'varchar' })
  policyCode!: string;

  /**
   * Identificador asociado a policy category concept.
   */
  @Property({ fieldName: 'policy_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  policyCategoryConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Valor de explanation mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  explanation?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({
    fieldName: 'detected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  detectedAt?: Date;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

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
