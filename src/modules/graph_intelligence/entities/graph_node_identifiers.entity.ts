import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_node_identifiers' })
export class GraphNodeIdentifiers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'node_id', type: 'uuid' })
  nodeId!: string;

  @Property({ fieldName: 'identifier_system', columnType: 'varchar' })
  identifierSystem!: string;

  @Property({ fieldName: 'identifier_value_hash', columnType: 'varchar' })
  identifierValueHash!: string;

  @Property({ fieldName: 'identifier_type', columnType: 'varchar' })
  identifierType!: string;

  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;
}
