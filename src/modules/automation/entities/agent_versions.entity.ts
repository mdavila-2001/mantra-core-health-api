import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `agent_versions`.
 */
@Entity({ schema: 'automation', tableName: 'agent_versions' })
export class AgentVersions {
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
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  version!: number;

  /**
   * Valor de prompt template mantenido por la instancia.
   */
  @Property({ fieldName: 'prompt_template', columnType: 'text' })
  promptTemplate!: string;

  /**
   * Identificador asociado a model concept.
   */
  @Property({ fieldName: 'model_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modelConceptId?: string;

  /**
   * Valor de model params json mantenido por la instancia.
   */
  @Property({
    fieldName: 'model_params_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  modelParamsJson?: unknown;

  /**
   * Valor de input schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'input_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputSchemaJson?: unknown;

  /**
   * Valor de output schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'output_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  outputSchemaJson?: unknown;

  /**
   * Valor de changelog mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  changelog?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

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
