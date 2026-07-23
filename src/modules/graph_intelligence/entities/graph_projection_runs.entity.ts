import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_projection_runs' })
export class GraphProjectionRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'graph_projection_definition_id', type: 'uuid' })
  graphProjectionDefinitionId!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'source_checkpoint', columnType: 'varchar' })
  sourceCheckpoint!: string;

  @Property({ fieldName: 'nodes_written', type: 'bigint' })
  nodesWritten!: string;

  @Property({ fieldName: 'edges_written', type: 'bigint' })
  edgesWritten!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
