import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_projection_runs`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_projection_runs' })
export class GraphProjectionRuns {
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
   * Identificador asociado a graph projection definition.
   */
  @Property({ fieldName: 'graph_projection_definition_id', type: 'uuid' })
  graphProjectionDefinitionId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de source checkpoint mantenido por la instancia.
   */
  @Property({ fieldName: 'source_checkpoint', columnType: 'varchar' })
  sourceCheckpoint!: string;

  /**
   * Valor de nodes written mantenido por la instancia.
   */
  @Property({ fieldName: 'nodes_written', type: 'bigint' })
  nodesWritten!: string;

  /**
   * Valor de edges written mantenido por la instancia.
   */
  @Property({ fieldName: 'edges_written', type: 'bigint' })
  edgesWritten!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
