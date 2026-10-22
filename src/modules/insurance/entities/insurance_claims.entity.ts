import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_claims`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_claims' })
export class InsuranceClaims {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance carrier.
   */
  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  /**
   * Identificador asociado a patient coverage.
   */
  @Property({ fieldName: 'patient_coverage_id', type: 'uuid' }) // FK → insurance.patient_coverages
  patientCoverageId!: string;

  /**
   * Identificador asociado a billing provider type concept.
   */
  @Property({ fieldName: 'billing_provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  billingProviderTypeConceptId!: string;

  /**
   * Identificador asociado a billing provider entity.
   */
  @Property({ fieldName: 'billing_provider_entity_id', type: 'uuid' })
  billingProviderEntityId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a prior authorization request.
   */
  @Property({
    fieldName: 'prior_authorization_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.prior_authorization_requests
  priorAuthorizationRequestId?: string;

  @Property({
    fieldName: 'inventory_reservation_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_reservations
  inventoryReservationId?: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  /**
   * Valor de claim identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'claim_identifier', columnType: 'varchar' })
  claimIdentifier!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
   * Valor de total amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
