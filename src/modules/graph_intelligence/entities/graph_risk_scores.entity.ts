import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_risk_scores' })
export class GraphRiskScores {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'node_id', type: 'uuid' })
  nodeId!: string;

  @Property({ fieldName: 'risk_type', columnType: 'varchar' })
  riskType!: string;

  @Property({ columnType: 'double precision' })
  score!: number;

  @Property({ fieldName: 'model_version', columnType: 'varchar' })
  modelVersion!: string;

  @Property({ fieldName: 'explanation_redacted', columnType: 'text' })
  explanationRedacted!: string;

  @Property({ fieldName: 'calculated_at', columnType: 'timestamptz' })
  calculatedAt!: Date;

  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;
}
