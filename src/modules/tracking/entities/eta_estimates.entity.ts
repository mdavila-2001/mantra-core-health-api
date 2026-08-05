import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `eta_estimates`.
 */
@Entity({ schema: 'tracking', tableName: 'eta_estimates' })
export class EtaEstimates {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a trackable subject.
   */
  @Property({ fieldName: 'trackable_subject_id', type: 'uuid' }) // FK → tracking.trackable_subjects
  trackableSubjectId!: string;

  /**
   * Identificador asociado a shipment.
   */
  @Property({ fieldName: 'shipment_id', type: 'uuid', nullable: true }) // FK → tracking.shipments
  shipmentId?: string;

  /**
   * Valor de estimated arrival at mantenido por la instancia.
   */
  @Property({ fieldName: 'estimated_arrival_at', columnType: 'timestamptz' })
  estimatedArrivalAt!: Date;

  /**
   * Valor de confidence pct mantenido por la instancia.
   */
  @Property({ fieldName: 'confidence_pct', columnType: 'int', nullable: true })
  confidencePct?: number;

  /**
   * Identificador asociado a method concept.
   */
  @Property({ fieldName: 'method_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  methodConceptId?: string;

  /**
   * Valor de computed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'computed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  computedAt?: Date;

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
