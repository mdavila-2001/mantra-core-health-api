import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_deletion_jobs`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_deletion_jobs' })
export class GraphDeletionJobs {
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
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de nodes deleted mantenido por la instancia.
   */
  @Property({ fieldName: 'nodes_deleted', columnType: 'int' })
  nodesDeleted!: number;

  /**
   * Valor de edges deleted mantenido por la instancia.
   */
  @Property({ fieldName: 'edges_deleted', columnType: 'int' })
  edgesDeleted!: number;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;
}
