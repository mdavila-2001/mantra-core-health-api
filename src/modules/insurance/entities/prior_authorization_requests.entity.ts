import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `prior_authorization_requests`.
 */
@Entity({ schema: 'insurance', tableName: 'prior_authorization_requests' })
export class PriorAuthorizationRequests {
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
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  /**
   * Identificador asociado a medication request.
   */
  @Property({
    fieldName: 'medication_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.medication_requests
  medicationRequestId?: string;

  @Property({
    fieldName: 'inventory_reservation_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_reservations
  inventoryReservationId?: string;

  /**
   * Identificador asociado a requesting provider type concept.
   */
  @Property({ fieldName: 'requesting_provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  requestingProviderTypeConceptId!: string;

  /**
   * Identificador asociado a requesting provider entity.
   */
  @Property({ fieldName: 'requesting_provider_entity_id', type: 'uuid' })
  requestingProviderEntityId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  priorityConceptId?: string;

  /**
   * Valor de submitted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'submitted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  submittedAt?: Date;

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
