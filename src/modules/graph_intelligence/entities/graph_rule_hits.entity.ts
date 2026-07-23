import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_rule_hits' })
export class GraphRuleHits {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'graph_rule_definition_id', type: 'uuid' })
  graphRuleDefinitionId!: string;

  @Property({ fieldName: 'primary_node_id', type: 'uuid' })
  primaryNodeId!: string;

  @Property({ fieldName: 'related_node_ids', type: 'array' })
  relatedNodeIds!: string[];

  @Property({ fieldName: 'evidence_edge_ids', type: 'array' })
  evidenceEdgeIds!: string[];

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;

  @Property({ fieldName: 'resolved_at', columnType: 'timestamptz' })
  resolvedAt!: Date;
}
