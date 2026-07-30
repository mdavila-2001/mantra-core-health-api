import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `graph_edge_evidence`.
 */
@Entity({ schema: 'graph_intelligence', tableName: 'graph_edge_evidence' })
export class GraphEdgeEvidence {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a edge.
   */
  @Property({ fieldName: 'edge_id', type: 'uuid' })
  edgeId!: string;

  /**
   * Valor de evidence type mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_type', columnType: 'varchar' })
  evidenceType!: string;

  /**
   * Valor de source reference mantenido por la instancia.
   */
  @Property({ fieldName: 'source_reference', columnType: 'varchar' })
  sourceReference!: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_hash', columnType: 'varchar' })
  evidenceHash!: string;

  /**
   * Valor de observed at mantenido por la instancia.
   */
  @Property({ fieldName: 'observed_at', columnType: 'timestamptz' })
  observedAt!: Date;

  /**
   * Valor de confidence delta mantenido por la instancia.
   */
  @Property({ fieldName: 'confidence_delta', columnType: 'double precision' })
  confidenceDelta!: number;
}
