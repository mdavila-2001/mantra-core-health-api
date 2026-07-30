import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_rule_hits`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_rule_hits' })
export class GraphRuleHits {
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
   * Identificador asociado a graph rule definition.
   */
  @Property({ fieldName: 'graph_rule_definition_id', type: 'uuid' })
  graphRuleDefinitionId!: string;

  /**
   * Identificador asociado a primary node.
   */
  @Property({ fieldName: 'primary_node_id', type: 'uuid' })
  primaryNodeId!: string;

  /**
   * Valor de related node ids mantenido por la instancia.
   */
  @Property({ fieldName: 'related_node_ids', type: 'array' })
  relatedNodeIds!: string[];

  /**
   * Valor de evidence edge ids mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_edge_ids', type: 'array' })
  evidenceEdgeIds!: string[];

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({ fieldName: 'resolved_at', columnType: 'timestamptz' })
  resolvedAt!: Date;
}
