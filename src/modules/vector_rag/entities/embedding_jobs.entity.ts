import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `embedding_jobs`.
 */
@Entity({ schema: 'vector_rag', tableName: 'embedding_jobs' })
export class EmbeddingJobs {
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
   * Identificador asociado a vector collection.
   */
  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  /**
   * Valor de job type mantenido por la instancia.
   */
  @Property({ fieldName: 'job_type', columnType: 'varchar' })
  jobType!: string;

  /**
   * Valor de source scope mantenido por la instancia.
   */
  @Property({ fieldName: 'source_scope', type: 'json', columnType: 'jsonb' })
  sourceScope!: unknown;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de total chunks mantenido por la instancia.
   */
  @Property({ fieldName: 'total_chunks', columnType: 'int' })
  totalChunks!: number;

  /**
   * Valor de completed chunks mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_chunks', columnType: 'int' })
  completedChunks!: number;

  /**
   * Valor de failed chunks mantenido por la instancia.
   */
  @Property({ fieldName: 'failed_chunks', columnType: 'int' })
  failedChunks!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
