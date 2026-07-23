import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_reservations' })
export class InventoryReservations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({
    fieldName: 'medication_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.medication_requests
  medicationRequestId?: string;

  @Property({ fieldName: 'quotation_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  quotationId?: string;

  @Property({ fieldName: 'reservation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reservationStatusConceptId!: string;

  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

  @Property({
    fieldName: 'released_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  releasedAt?: Date;

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
