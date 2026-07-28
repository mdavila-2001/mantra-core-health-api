import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `coverage_eligibility_requests`.
 */
@Entity({ schema: 'insurance', tableName: 'coverage_eligibility_requests' })
export class CoverageEligibilityRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient coverage.
   */
  @Property({ fieldName: 'patient_coverage_id', type: 'uuid' }) // FK → insurance.patient_coverages
  patientCoverageId!: string;

  /**
   * Identificador asociado a requesting provider type concept.
   */
  @Property({ fieldName: 'requesting_provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  requestingProviderTypeConceptId!: string;

  /**
   * Identificador asociado a requesting provider entity.
   */
  @Property({
    fieldName: 'requesting_provider_entity_id',
    type: 'uuid',
    nullable: true,
  })
  requestingProviderEntityId?: string;

  /**
   * Valor de service date mantenido por la instancia.
   */
  @Property({ fieldName: 'service_date', columnType: 'date', nullable: true })
  serviceDate?: Date;

  /**
   * Identificador asociado a purpose value set.
   */
  @Property({ fieldName: 'purpose_value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  purposeValueSetId?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
