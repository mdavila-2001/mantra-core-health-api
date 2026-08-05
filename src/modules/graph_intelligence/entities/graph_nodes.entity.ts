import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_nodes`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_nodes' })
export class GraphNodes {
  /**
   * Identificador asociado a node.
   */
  @PrimaryKey({ fieldName: 'node_id', type: 'uuid' })
  nodeId: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de node type mantenido por la instancia.
   */
  @Property({ fieldName: 'node_type', columnType: 'varchar' })
  nodeType!: string;

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
   * Valor de source version mantenido por la instancia.
   */
  @Property({ fieldName: 'source_version', type: 'bigint' })
  sourceVersion!: string;

  /**
   * Valor de display label redacted mantenido por la instancia.
   */
  @Property({ fieldName: 'display_label_redacted', columnType: 'varchar' })
  displayLabelRedacted!: string;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  properties!: unknown;

  /**
   * Valor de security labels mantenido por la instancia.
   */
  @Property({ fieldName: 'security_labels', type: 'array' })
  securityLabels!: string[];

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
