import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_lineage_edges`.
 */
@Entity({ schema: 'health_data', tableName: 'health_lineage_edges' })
export class HealthLineageEdges {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a source type concept.
   */
  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  /**
   * Identificador asociado a source.
   */
  @Property({ fieldName: 'source_id', type: 'uuid' })
  sourceId!: string;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  /**
   * Identificador asociado a target.
   */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /**
   * Identificador asociado a transformation type concept.
   */
  @Property({ fieldName: 'transformation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transformationTypeConceptId!: string;

  /**
   * Valor de transformation version mantenido por la instancia.
   */
  @Property({
    fieldName: 'transformation_version',
    columnType: 'varchar',
    nullable: true,
  })
  transformationVersion?: string;

  /**
   * Identificador asociado a job run.
   */
  @Property({ fieldName: 'job_run_id', type: 'uuid', nullable: true })
  jobRunId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
