import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'graph_intelligence', tableName: 'graph_edge_evidence' })
export class GraphEdgeEvidence {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'edge_id', type: 'uuid' })
  edgeId!: string;

  @Property({ fieldName: 'evidence_type', columnType: 'varchar' })
  evidenceType!: string;

  @Property({ fieldName: 'source_reference', columnType: 'varchar' })
  sourceReference!: string;

  @Property({ fieldName: 'evidence_hash', columnType: 'varchar' })
  evidenceHash!: string;

  @Property({ fieldName: 'observed_at', columnType: 'timestamptz' })
  observedAt!: Date;

  @Property({ fieldName: 'confidence_delta', columnType: 'double precision' })
  confidenceDelta!: number;
}
