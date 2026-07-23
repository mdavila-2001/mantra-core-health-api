import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'data_product_versions' })
export class DataProductVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'data_product_id', type: 'uuid' })
  dataProductId!: string;

  @Property({ columnType: 'varchar' })
  version!: string;

  @Property({
    fieldName: 'contract_schema_json',
    type: 'json',
    columnType: 'jsonb',
  })
  contractSchemaJson!: unknown;

  @Property({
    fieldName: 'quality_slo_json',
    type: 'json',
    columnType: 'jsonb',
  })
  qualitySloJson!: unknown;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ columnType: 'varchar' })
  state!: string;
}
