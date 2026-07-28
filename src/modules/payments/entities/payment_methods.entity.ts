import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_methods`.
 */
@Entity({ schema: 'payments', tableName: 'payment_methods' })
export class PaymentMethods {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a owner type concept.
   */
  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  /**
   * Identificador asociado a owner ref.
   */
  @Property({ fieldName: 'owner_ref_id', type: 'uuid' })
  ownerRefId!: string;

  /**
   * Identificador asociado a gateway.
   */
  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  /**
   * Identificador asociado a method type concept.
   */
  @Property({ fieldName: 'method_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodTypeConceptId!: string;

  /**
   * Valor de gateway token mantenido por la instancia.
   */
  @Property({ fieldName: 'gateway_token', columnType: 'varchar' })
  gatewayToken!: string;

  /**
   * Valor de brand mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  brand?: string;

  /**
   * Valor de last four mantenido por la instancia.
   */
  @Property({ fieldName: 'last_four', columnType: 'varchar', nullable: true })
  lastFour?: string;

  /**
   * Valor de expiry month mantenido por la instancia.
   */
  @Property({ fieldName: 'expiry_month', columnType: 'int', nullable: true })
  expiryMonth?: number;

  /**
   * Valor de expiry year mantenido por la instancia.
   */
  @Property({ fieldName: 'expiry_year', columnType: 'int', nullable: true })
  expiryYear?: number;

  /**
   * Valor de holder name mantenido por la instancia.
   */
  @Property({ fieldName: 'holder_name', columnType: 'varchar', nullable: true })
  holderName?: string;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @Property({ fieldName: 'is_default', type: 'boolean', nullable: true })
  isDefault?: boolean;

  /**
   * Identificador asociado a billing address.
   */
  @Property({ fieldName: 'billing_address_id', type: 'uuid', nullable: true }) // FK → common.addresses
  billingAddressId?: string;

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
