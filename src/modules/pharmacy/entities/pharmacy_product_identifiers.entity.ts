import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy', tableName: 'pharmacy_product_identifiers' })
export class PharmacyProductIdentifiers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'identifier_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identifierTypeConceptId!: string;

  @Property({ fieldName: 'identifier_value', columnType: 'varchar' })
  identifierValue!: string;

  @Property({
    fieldName: 'assigning_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  assigningAuthorityTenantId?: string;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
