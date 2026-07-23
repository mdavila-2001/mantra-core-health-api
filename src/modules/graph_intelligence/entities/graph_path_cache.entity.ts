import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_path_cache' })
export class GraphPathCache {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'start_node_id', type: 'uuid' })
  startNodeId!: string;

  @Property({ fieldName: 'end_node_id', type: 'uuid' })
  endNodeId!: string;

  @Property({ fieldName: 'relationship_filter_hash', columnType: 'varchar' })
  relationshipFilterHash!: string;

  @Property({ fieldName: 'max_hops', columnType: 'smallint' })
  maxHops!: number;

  @Property({ fieldName: 'path_nodes', type: 'array' })
  pathNodes!: string[];

  @Property({ fieldName: 'path_edges', type: 'array' })
  pathEdges!: string[];

  @Property({ fieldName: 'calculated_at', columnType: 'timestamptz' })
  calculatedAt!: Date;

  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;
}
