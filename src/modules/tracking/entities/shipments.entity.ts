import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `shipments`.
 */
@Entity({ schema: 'tracking', tableName: 'shipments' })
export class Shipments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a trackable subject.
   */
  @Property({ fieldName: 'trackable_subject_id', type: 'uuid' }) // FK → tracking.trackable_subjects
  trackableSubjectId!: string;

  /**
   * Identificador asociado a carrier.
   */
  @Property({ fieldName: 'carrier_id', type: 'uuid', nullable: true }) // FK → tracking.tracking_carriers
  carrierId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de shipment number mantenido por la instancia.
   */
  @Property({ fieldName: 'shipment_number', columnType: 'varchar' })
  shipmentNumber!: string;

  /**
   * Identificador asociado a origin address.
   */
  @Property({ fieldName: 'origin_address_id', type: 'uuid', nullable: true }) // FK → common.addresses
  originAddressId?: string;

  /**
   * Identificador asociado a destination address.
   */
  @Property({
    fieldName: 'destination_address_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.addresses
  destinationAddressId?: string;

  /**
   * Identificador asociado a assigned courier user.
   */
  @Property({
    fieldName: 'assigned_courier_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  assignedCourierUserId?: string;

  /**
   * Identificador asociado a tracked subject.
   */
  @Property({ fieldName: 'tracked_subject_id', type: 'uuid', nullable: true }) // FK → geo.tracked_subjects
  trackedSubjectId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de dispatched at mantenido por la instancia.
   */
  @Property({
    fieldName: 'dispatched_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dispatchedAt?: Date;

  /**
   * Valor de estimated arrival at mantenido por la instancia.
   */
  @Property({
    fieldName: 'estimated_arrival_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  estimatedArrivalAt?: Date;

  /**
   * Valor de delivered at mantenido por la instancia.
   */
  @Property({
    fieldName: 'delivered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deliveredAt?: Date;

  /**
   * Valor de distance m mantenido por la instancia.
   */
  @Property({ fieldName: 'distance_m', columnType: 'numeric', nullable: true })
  distanceM?: string;

  /**
   * Valor de temperature controlled mantenido por la instancia.
   */
  @Property({
    fieldName: 'temperature_controlled',
    type: 'boolean',
    nullable: true,
  })
  temperatureControlled?: boolean;

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
