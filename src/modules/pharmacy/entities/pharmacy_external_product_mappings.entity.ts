import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy', tableName: 'pharmacy_external_product_mappings' })
export class PharmacyExternalProductMappings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_integration_connection_id', type: 'uuid' }) // FK → pharmacy.pharmacy_integration_connections
  pharmacyIntegrationConnectionId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'external_product_code', columnType: 'varchar' })
  externalProductCode!: string;

  @Property({
    fieldName: 'external_unit_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalUnitCode?: string;

  @Property({
    fieldName: 'mapping_version',
    columnType: 'varchar',
    nullable: true,
  })
  mappingVersion?: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
