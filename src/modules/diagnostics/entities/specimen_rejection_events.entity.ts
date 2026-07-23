import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'specimen_rejection_events' })
export class SpecimenRejectionEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  @Property({ fieldName: 'rejected_at', columnType: 'timestamptz' })
  rejectedAt!: Date;

  @Property({ fieldName: 'rejection_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  rejectionReasonConceptId!: string;

  @Property({
    fieldName: 'rejected_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  rejectedByProfileId?: string;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  @Property({
    fieldName: 'recollection_required',
    type: 'boolean',
    nullable: true,
  })
  recollectionRequired?: boolean;

  @Property({
    fieldName: 'recollection_service_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.service_requests
  recollectionServiceRequestId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
