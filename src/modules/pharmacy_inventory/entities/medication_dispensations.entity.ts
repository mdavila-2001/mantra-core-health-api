import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'medication_dispensations' })
export class MedicationDispensations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({
    fieldName: 'medication_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.medication_requests
  medicationRequestId?: string;

  @Property({ fieldName: 'insurance_claim_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_claims
  insuranceClaimId?: string;

  @Property({
    fieldName: 'inventory_reservation_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_reservations
  inventoryReservationId?: string;

  @Property({ fieldName: 'dispensation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dispensationStatusConceptId!: string;

  @Property({
    fieldName: 'dispensed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dispensedAt?: Date;

  @Property({
    fieldName: 'dispenser_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  dispenserPractitionerProfileId?: string;

  @Property({
    fieldName: 'substitution_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  substitutionReasonConceptId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
