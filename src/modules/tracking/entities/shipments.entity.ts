import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'tracking', tableName: 'shipments' })
export class Shipments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'trackable_subject_id', type: 'uuid' }) // FK → tracking.trackable_subjects
  trackableSubjectId!: string;

  @Property({ fieldName: 'carrier_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  carrierId?: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'shipment_number', columnType: 'varchar' })
  shipmentNumber!: string;

  @Property({ fieldName: 'origin_address_id', type: 'uuid', nullable: true }) // FK → common.addresses
  originAddressId?: string;

  @Property({
    fieldName: 'destination_address_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.addresses
  destinationAddressId?: string;

  @Property({
    fieldName: 'assigned_courier_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  assignedCourierUserId?: string;

  @Property({ fieldName: 'tracked_subject_id', type: 'uuid', nullable: true }) // FK → geo.tracked_subjects
  trackedSubjectId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'dispatched_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dispatchedAt?: Date;

  @Property({
    fieldName: 'estimated_arrival_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  estimatedArrivalAt?: Date;

  @Property({
    fieldName: 'delivered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deliveredAt?: Date;

  @Property({ fieldName: 'distance_m', columnType: 'numeric', nullable: true })
  distanceM?: string;

  @Property({
    fieldName: 'temperature_controlled',
    type: 'boolean',
    nullable: true,
  })
  temperatureControlled?: boolean;

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
