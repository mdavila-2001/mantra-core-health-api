import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'graph_intelligence',
  tableName: 'graph_projection_definitions',
})
export class GraphProjectionDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'source_dataset_codes', type: 'array' })
  sourceDatasetCodes!: string[];

  @Property({
    fieldName: 'node_mapping_rules',
    type: 'json',
    columnType: 'jsonb',
  })
  nodeMappingRules!: unknown;

  @Property({
    fieldName: 'edge_mapping_rules',
    type: 'json',
    columnType: 'jsonb',
  })
  edgeMappingRules!: unknown;

  @Property({ fieldName: 'projection_version', columnType: 'varchar' })
  projectionVersion!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
