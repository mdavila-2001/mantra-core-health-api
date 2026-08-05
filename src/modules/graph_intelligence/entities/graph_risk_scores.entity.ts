import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_risk_scores`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_risk_scores' })
export class GraphRiskScores {
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
   * Identificador asociado a node.
   */
  @Property({ fieldName: 'node_id', type: 'uuid' })
  nodeId!: string;

  /**
   * Valor de risk type mantenido por la instancia.
   */
  @Property({ fieldName: 'risk_type', columnType: 'varchar' })
  riskType!: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @Property({ columnType: 'double precision' })
  score!: number;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @Property({ fieldName: 'model_version', columnType: 'varchar' })
  modelVersion!: string;

  /**
   * Valor de explanation redacted mantenido por la instancia.
   */
  @Property({ fieldName: 'explanation_redacted', columnType: 'text' })
  explanationRedacted!: string;

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
