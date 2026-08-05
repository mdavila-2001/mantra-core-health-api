import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_rule_definitions`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_rule_definitions' })
export class GraphRuleDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de rule type mantenido por la instancia.
   */
  @Property({ fieldName: 'rule_type', columnType: 'varchar' })
  ruleType!: string;

  /**
   * Valor de traversal expression mantenido por la instancia.
   */
  @Property({ fieldName: 'traversal_expression', columnType: 'text' })
  traversalExpression!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  severity!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  version!: string;
}
