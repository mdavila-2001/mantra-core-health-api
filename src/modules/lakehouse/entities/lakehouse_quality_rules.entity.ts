import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_quality_rules' })
export class LakehouseQualityRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'data_product_version_id', type: 'uuid' })
  dataProductVersionId!: string;

  @Property({ fieldName: 'rule_code', columnType: 'varchar' })
  ruleCode!: string;

  @Property({ columnType: 'varchar' })
  dimension!: string;

  @Property({ columnType: 'text' })
  expression!: string;

  @Property({ columnType: 'varchar' })
  severity!: string;

  @Property({ columnType: 'numeric' })
  threshold!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
