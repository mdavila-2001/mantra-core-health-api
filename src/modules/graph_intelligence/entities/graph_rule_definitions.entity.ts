import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_rule_definitions' })
export class GraphRuleDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'rule_type', columnType: 'varchar' })
  ruleType!: string;

  @Property({ fieldName: 'traversal_expression', columnType: 'text' })
  traversalExpression!: string;

  @Property({ columnType: 'varchar' })
  severity!: string;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ columnType: 'varchar' })
  version!: string;
}
