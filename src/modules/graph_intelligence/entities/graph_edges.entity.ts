import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_edges' })
export class GraphEdges {
  @PrimaryKey({ fieldName: 'edge_id', type: 'uuid' })
  edgeId: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'from_node_id', type: 'uuid' })
  fromNodeId!: string;

  @Property({ fieldName: 'to_node_id', type: 'uuid' })
  toNodeId!: string;

  @Property({ fieldName: 'relationship_type', columnType: 'varchar' })
  relationshipType!: string;

  @Property({ columnType: 'varchar' })
  directionality!: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'confidence_score', columnType: 'double precision' })
  confidenceScore!: number;

  @Property({ fieldName: 'source_entity_type', columnType: 'varchar' })
  sourceEntityType!: string;

  @Property({ fieldName: 'source_entity_id', type: 'uuid' })
  sourceEntityId!: string;

  @Property({ type: 'json', columnType: 'jsonb' })
  properties!: unknown;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
