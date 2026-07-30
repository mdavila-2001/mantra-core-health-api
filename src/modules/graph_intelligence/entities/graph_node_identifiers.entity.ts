import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_node_identifiers`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_node_identifiers' })
export class GraphNodeIdentifiers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a node.
   */
  @Property({ fieldName: 'node_id', type: 'uuid' })
  nodeId!: string;

  /**
   * Valor de identifier system mantenido por la instancia.
   */
  @Property({ fieldName: 'identifier_system', columnType: 'varchar' })
  identifierSystem!: string;

  /**
   * Valor de identifier value hash mantenido por la instancia.
   */
  @Property({ fieldName: 'identifier_value_hash', columnType: 'varchar' })
  identifierValueHash!: string;

  /**
   * Valor de identifier type mantenido por la instancia.
   */
  @Property({ fieldName: 'identifier_type', columnType: 'varchar' })
  identifierType!: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;
}
