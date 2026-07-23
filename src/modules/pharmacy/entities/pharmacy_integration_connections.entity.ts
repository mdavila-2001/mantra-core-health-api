import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy', tableName: 'pharmacy_integration_connections' })
export class PharmacyIntegrationConnections {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId?: string;

  @Property({ fieldName: 'connection_id', type: 'uuid' }) // FK (destino no resuelto)
  connectionId!: string;

  @Property({ fieldName: 'integration_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  integrationModeConceptId!: string;

  @Property({
    fieldName: 'inventory_authority_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  inventoryAuthorityConceptId?: string;

  @Property({
    fieldName: 'supports_stock_query',
    type: 'boolean',
    nullable: true,
  })
  supportsStockQuery?: boolean;

  @Property({
    fieldName: 'supports_price_query',
    type: 'boolean',
    nullable: true,
  })
  supportsPriceQuery?: boolean;

  @Property({
    fieldName: 'supports_reservation',
    type: 'boolean',
    nullable: true,
  })
  supportsReservation?: boolean;

  @Property({
    fieldName: 'supports_dispense_confirmation',
    type: 'boolean',
    nullable: true,
  })
  supportsDispenseConfirmation?: boolean;

  @Property({
    fieldName: 'manual_fallback_allowed',
    type: 'boolean',
    nullable: true,
  })
  manualFallbackAllowed?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
