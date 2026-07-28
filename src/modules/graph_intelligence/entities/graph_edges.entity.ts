import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_edges`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_edges' })
export class GraphEdges {
  /**
   * Identificador asociado a edge.
   */
  @PrimaryKey({ fieldName: 'edge_id', type: 'uuid' })
  edgeId: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a from node.
   */
  @Property({ fieldName: 'from_node_id', type: 'uuid' })
  fromNodeId!: string;

  /**
   * Identificador asociado a to node.
   */
  @Property({ fieldName: 'to_node_id', type: 'uuid' })
  toNodeId!: string;

  /**
   * Valor de relationship type mantenido por la instancia.
   */
  @Property({ fieldName: 'relationship_type', columnType: 'varchar' })
  relationshipType!: string;

  /**
   * Valor de directionality mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  directionality!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({ fieldName: 'confidence_score', columnType: 'double precision' })
  confidenceScore!: number;

  /**
   * Valor de source entity type mantenido por la instancia.
   */
  @Property({ fieldName: 'source_entity_type', columnType: 'varchar' })
  sourceEntityType!: string;

  /**
   * Identificador asociado a source entity.
   */
  @Property({ fieldName: 'source_entity_id', type: 'uuid' })
  sourceEntityId!: string;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  properties!: unknown;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
