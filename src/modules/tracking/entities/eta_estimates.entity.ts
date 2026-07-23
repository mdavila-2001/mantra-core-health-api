import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'tracking', tableName: 'eta_estimates' })
export class EtaEstimates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'trackable_subject_id', type: 'uuid' }) // FK → tracking.trackable_subjects
  trackableSubjectId!: string;

  @Property({ fieldName: 'shipment_id', type: 'uuid', nullable: true }) // FK → tracking.shipments
  shipmentId?: string;

  @Property({ fieldName: 'estimated_arrival_at', columnType: 'timestamptz' })
  estimatedArrivalAt!: Date;

  @Property({ fieldName: 'confidence_pct', columnType: 'int', nullable: true })
  confidencePct?: number;

  @Property({ fieldName: 'method_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  methodConceptId?: string;

  @Property({
    fieldName: 'computed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  computedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
