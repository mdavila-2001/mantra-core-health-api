import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_communities`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_communities' })
export class GraphCommunities {
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
   * Valor de community type mantenido por la instancia.
   */
  @Property({ fieldName: 'community_type', columnType: 'varchar' })
  communityType!: string;

  /**
   * Valor de algorithm version mantenido por la instancia.
   */
  @Property({ fieldName: 'algorithm_version', columnType: 'varchar' })
  algorithmVersion!: string;

  /**
   * Valor de member node ids mantenido por la instancia.
   */
  @Property({ fieldName: 'member_node_ids', type: 'array' })
  memberNodeIds!: string[];

  /**
   * Valor de score mantenido por la instancia.
   */
  @Property({ columnType: 'double precision' })
  score!: number;

  /**
   * Valor de calculated at mantenido por la instancia.
   */
  @Property({ fieldName: 'calculated_at', columnType: 'timestamptz' })
  calculatedAt!: Date;
}
