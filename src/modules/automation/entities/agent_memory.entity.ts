import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `agent_memory`.
 */
@Entity({ schema: 'automation', tableName: 'agent_memory' })
export class AgentMemory {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  /**
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  /**
   * Identificador asociado a scope ref.
   */
  @Property({ fieldName: 'scope_ref_id', type: 'uuid', nullable: true })
  scopeRefId?: string;

  /**
   * Identificador asociado a memory type concept.
   */
  @Property({ fieldName: 'memory_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memoryTypeConceptId!: string;

  /**
   * Valor de content text mantenido por la instancia.
   */
  @Property({ fieldName: 'content_text', columnType: 'text' })
  contentText!: string;

  /**
   * Valor de embedding ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'embedding_ref',
    columnType: 'varchar',
    nullable: true,
  })
  embeddingRef?: string;

  /**
   * Valor de importance mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  importance?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
