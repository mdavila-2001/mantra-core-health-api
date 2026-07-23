import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_methods' })
export class PaymentMethods {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  @Property({ fieldName: 'owner_ref_id', type: 'uuid' })
  ownerRefId!: string;

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK (destino no resuelto)
  gatewayId!: string;

  @Property({ fieldName: 'method_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodTypeConceptId!: string;

  @Property({ fieldName: 'gateway_token', columnType: 'varchar' })
  gatewayToken!: string;

  @Property({ columnType: 'varchar', nullable: true })
  brand?: string;

  @Property({ fieldName: 'last_four', columnType: 'varchar', nullable: true })
  lastFour?: string;

  @Property({ fieldName: 'expiry_month', columnType: 'int', nullable: true })
  expiryMonth?: number;

  @Property({ fieldName: 'expiry_year', columnType: 'int', nullable: true })
  expiryYear?: number;

  @Property({ fieldName: 'holder_name', columnType: 'varchar', nullable: true })
  holderName?: string;

  @Property({ fieldName: 'is_default', type: 'boolean', nullable: true })
  isDefault?: boolean;

  @Property({ fieldName: 'billing_address_id', type: 'uuid', nullable: true }) // FK → common.addresses
  billingAddressId?: string;

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
