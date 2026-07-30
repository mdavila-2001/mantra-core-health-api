import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `medication_dispensations`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'medication_dispensations' })
export class MedicationDispensations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy.
   */
  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  /**
   * Identificador asociado a pharmacy site.
   */
  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a medication request.
   */
  @Property({
    fieldName: 'medication_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.medication_requests
  medicationRequestId?: string;

  /**
   * Identificador asociado a insurance claim.
   */
  @Property({ fieldName: 'insurance_claim_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_claims
  insuranceClaimId?: string;

  /**
   * Identificador asociado a inventory reservation.
   */
  @Property({
    fieldName: 'inventory_reservation_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_reservations
  inventoryReservationId?: string;

  /**
   * Identificador asociado a dispensation status concept.
   */
  @Property({ fieldName: 'dispensation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dispensationStatusConceptId!: string;

  /**
   * Valor de dispensed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'dispensed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dispensedAt?: Date;

  /**
   * Identificador asociado a dispenser practitioner profile.
   */
  @Property({
    fieldName: 'dispenser_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  dispenserPractitionerProfileId?: string;

  /**
   * Identificador asociado a substitution reason concept.
   */
  @Property({
    fieldName: 'substitution_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  substitutionReasonConceptId?: string;

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
