import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `shipment_handoffs`.
 */
@Entity({ schema: 'tracking', tableName: 'shipment_handoffs' })
export class ShipmentHandoffs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a shipment.
   */
  @Property({ fieldName: 'shipment_id', type: 'uuid' }) // FK → tracking.shipments
  shipmentId!: string;

  /**
   * Identificador asociado a handoff type concept.
   */
  @Property({ fieldName: 'handoff_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  handoffTypeConceptId!: string;

  /**
   * Valor de from party type mantenido por la instancia.
   */
  @Property({
    fieldName: 'from_party_type',
    columnType: 'varchar',
    nullable: true,
  })
  fromPartyType?: string;

  /**
   * Identificador asociado a from party.
   */
  @Property({ fieldName: 'from_party_id', type: 'uuid', nullable: true })
  fromPartyId?: string;

  /**
   * Valor de to party type mantenido por la instancia.
   */
  @Property({
    fieldName: 'to_party_type',
    columnType: 'varchar',
    nullable: true,
  })
  toPartyType?: string;

  /**
   * Identificador asociado a to party.
   */
  @Property({ fieldName: 'to_party_id', type: 'uuid', nullable: true })
  toPartyId?: string;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @Property({
    fieldName: 'location_text',
    columnType: 'varchar',
    nullable: true,
  })
  locationText?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
