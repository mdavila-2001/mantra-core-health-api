import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_gateways`.
 */
@Entity({ schema: 'payments', tableName: 'payment_gateways' })
export class PaymentGateways {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a gateway type concept.
   */
  @Property({ fieldName: 'gateway_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  gatewayTypeConceptId!: string;

  /**
   * Valor de capabilities json mantenido por la instancia.
   */
  @Property({
    fieldName: 'capabilities_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  capabilitiesJson?: unknown;

  /**
   * Valor de supported currencies json mantenido por la instancia.
   */
  @Property({
    fieldName: 'supported_currencies_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  supportedCurrenciesJson?: unknown;

  /**
   * Identificador asociado a external provider.
   */
  @Property({ fieldName: 'external_provider_id', type: 'uuid', nullable: true }) // FK → integrations.external_providers
  externalProviderId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
