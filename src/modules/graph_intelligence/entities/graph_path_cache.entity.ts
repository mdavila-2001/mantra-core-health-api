import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_path_cache`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_path_cache' })
export class GraphPathCache {
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
   * Identificador asociado a start node.
   */
  @Property({ fieldName: 'start_node_id', type: 'uuid' })
  startNodeId!: string;

  /**
   * Identificador asociado a end node.
   */
  @Property({ fieldName: 'end_node_id', type: 'uuid' })
  endNodeId!: string;

  /**
   * Valor de relationship filter hash mantenido por la instancia.
   */
  @Property({ fieldName: 'relationship_filter_hash', columnType: 'varchar' })
  relationshipFilterHash!: string;

  /**
   * Valor de max hops mantenido por la instancia.
   */
  @Property({ fieldName: 'max_hops', columnType: 'smallint' })
  maxHops!: number;

  /**
   * Valor de path nodes mantenido por la instancia.
   */
  @Property({ fieldName: 'path_nodes', type: 'array' })
  pathNodes!: string[];

  /**
   * Valor de path edges mantenido por la instancia.
   */
  @Property({ fieldName: 'path_edges', type: 'array' })
  pathEdges!: string[];

  /**
   * Valor de calculated at mantenido por la instancia.
   */
  @Property({ fieldName: 'calculated_at', columnType: 'timestamptz' })
  calculatedAt!: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;
}
