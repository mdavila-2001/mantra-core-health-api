import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delivery_status_snapshots`.
 */
@Entity({ schema: 'ads', tableName: 'delivery_status_snapshots' })
export class DeliveryStatusSnapshots {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Identificador asociado a entity type concept.
   */
  @Property({ fieldName: 'entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  entityTypeConceptId!: string;

  /**
   * Identificador asociado a entity ref.
   */
  @Property({ fieldName: 'entity_ref_id', type: 'uuid' })
  entityRefId!: string;

  /**
   * Identificador asociado a effective status concept.
   */
  @Property({ fieldName: 'effective_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  effectiveStatusConceptId!: string;

  /**
   * Identificador asociado a review status concept.
   */
  @Property({
    fieldName: 'review_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reviewStatusConceptId?: string;

  /**
   * Valor de issues json mantenido por la instancia.
   */
  @Property({
    fieldName: 'issues_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  issuesJson?: unknown;

  /**
   * Valor de captured at mantenido por la instancia.
   */
  @Property({
    fieldName: 'captured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  capturedAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
