import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'embedding_jobs' })
export class EmbeddingJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  @Property({ fieldName: 'job_type', columnType: 'varchar' })
  jobType!: string;

  @Property({ fieldName: 'source_scope', type: 'json', columnType: 'jsonb' })
  sourceScope!: unknown;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'total_chunks', columnType: 'int' })
  totalChunks!: number;

  @Property({ fieldName: 'completed_chunks', columnType: 'int' })
  completedChunks!: number;

  @Property({ fieldName: 'failed_chunks', columnType: 'int' })
  failedChunks!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
