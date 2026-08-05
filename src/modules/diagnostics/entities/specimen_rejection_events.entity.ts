import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `specimen_rejection_events`.
 */
@Entity({ schema: 'diagnostics', tableName: 'specimen_rejection_events' })
export class SpecimenRejectionEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  /**
   * Valor de rejected at mantenido por la instancia.
   */
  @Property({ fieldName: 'rejected_at', columnType: 'timestamptz' })
  rejectedAt!: Date;

  /**
   * Identificador asociado a rejection reason concept.
   */
  @Property({ fieldName: 'rejection_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  rejectionReasonConceptId!: string;

  /**
   * Identificador asociado a rejected by profile.
   */
  @Property({
    fieldName: 'rejected_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  rejectedByProfileId?: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  /**
   * Valor de recollection required mantenido por la instancia.
   */
  @Property({
    fieldName: 'recollection_required',
    type: 'boolean',
    nullable: true,
  })
  recollectionRequired?: boolean;

  /**
   * Identificador asociado a recollection service request.
   */
  @Property({
    fieldName: 'recollection_service_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.service_requests
  recollectionServiceRequestId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
