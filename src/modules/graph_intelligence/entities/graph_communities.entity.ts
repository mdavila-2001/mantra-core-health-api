import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_communities' })
export class GraphCommunities {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'community_type', columnType: 'varchar' })
  communityType!: string;

  @Property({ fieldName: 'algorithm_version', columnType: 'varchar' })
  algorithmVersion!: string;

  @Property({ fieldName: 'member_node_ids', type: 'array' })
  memberNodeIds!: string[];

  @Property({ columnType: 'double precision' })
  score!: number;

  @Property({ fieldName: 'calculated_at', columnType: 'timestamptz' })
  calculatedAt!: Date;
}
