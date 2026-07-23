import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_deletion_jobs' })
export class GraphDeletionJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'source_entity_type', columnType: 'varchar' })
  sourceEntityType!: string;

  @Property({ fieldName: 'source_entity_id', type: 'uuid' })
  sourceEntityId!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'nodes_deleted', columnType: 'int' })
  nodesDeleted!: number;

  @Property({ fieldName: 'edges_deleted', columnType: 'int' })
  edgesDeleted!: number;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;
}
