import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'tracking', tableName: 'shipment_handoffs' })
export class ShipmentHandoffs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'shipment_id', type: 'uuid' }) // FK → tracking.shipments
  shipmentId!: string;

  @Property({ fieldName: 'handoff_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  handoffTypeConceptId!: string;

  @Property({
    fieldName: 'from_party_type',
    columnType: 'varchar',
    nullable: true,
  })
  fromPartyType?: string;

  @Property({ fieldName: 'from_party_id', type: 'uuid', nullable: true })
  fromPartyId?: string;

  @Property({
    fieldName: 'to_party_type',
    columnType: 'varchar',
    nullable: true,
  })
  toPartyType?: string;

  @Property({ fieldName: 'to_party_id', type: 'uuid', nullable: true })
  toPartyId?: string;

  @Property({
    fieldName: 'location_text',
    columnType: 'varchar',
    nullable: true,
  })
  locationText?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
