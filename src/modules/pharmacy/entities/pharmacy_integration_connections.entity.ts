import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_integration_connections`.
 */
@Entity({ schema: 'pharmacy', tableName: 'pharmacy_integration_connections' })
export class PharmacyIntegrationConnections {
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
  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId?: string;

  /**
   * Identificador asociado a connection.
   */
  @Property({ fieldName: 'connection_id', type: 'uuid' }) // FK → pharmacy.pharmacy_integration_connections
  connectionId!: string;

  /**
   * Identificador asociado a integration mode concept.
   */
  @Property({ fieldName: 'integration_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  integrationModeConceptId!: string;

  /**
   * Identificador asociado a inventory authority concept.
   */
  @Property({
    fieldName: 'inventory_authority_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  inventoryAuthorityConceptId?: string;

  /**
   * Valor de supports stock query mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_stock_query',
    type: 'boolean',
    nullable: true,
  })
  supportsStockQuery?: boolean;

  /**
   * Valor de supports price query mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_price_query',
    type: 'boolean',
    nullable: true,
  })
  supportsPriceQuery?: boolean;

  /**
   * Valor de supports reservation mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_reservation',
    type: 'boolean',
    nullable: true,
  })
  supportsReservation?: boolean;

  /**
   * Valor de supports dispense confirmation mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_dispense_confirmation',
    type: 'boolean',
    nullable: true,
  })
  supportsDispenseConfirmation?: boolean;

  /**
   * Valor de manual fallback allowed mantenido por la instancia.
   */
  @Property({
    fieldName: 'manual_fallback_allowed',
    type: 'boolean',
    nullable: true,
  })
  manualFallbackAllowed?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
