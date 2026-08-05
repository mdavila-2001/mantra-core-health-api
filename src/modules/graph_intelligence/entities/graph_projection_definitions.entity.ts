import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_projection_definitions`.
 */
@Entity({
  schema: 'graph_intelligence',
  tableName: 'graph_projection_definitions',
})
export class GraphProjectionDefinitions {
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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de source dataset codes mantenido por la instancia.
   */
  @Property({ fieldName: 'source_dataset_codes', type: 'array' })
  sourceDatasetCodes!: string[];

  /**
   * Valor de node mapping rules mantenido por la instancia.
   */
  @Property({
    fieldName: 'node_mapping_rules',
    type: 'json',
    columnType: 'jsonb',
  })
  nodeMappingRules!: unknown;

  /**
   * Valor de edge mapping rules mantenido por la instancia.
   */
  @Property({
    fieldName: 'edge_mapping_rules',
    type: 'json',
    columnType: 'jsonb',
  })
  edgeMappingRules!: unknown;

  /**
   * Valor de projection version mantenido por la instancia.
   */
  @Property({ fieldName: 'projection_version', columnType: 'varchar' })
  projectionVersion!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
