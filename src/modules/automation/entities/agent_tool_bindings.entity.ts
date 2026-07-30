import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `agent_tool_bindings`.
 */
@Entity({ schema: 'automation', tableName: 'agent_tool_bindings' })
export class AgentToolBindings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a agent version.
   */
  @Property({ fieldName: 'agent_version_id', type: 'uuid' }) // FK → automation.agent_versions
  agentVersionId!: string;

  /**
   * Identificador asociado a agent tool.
   */
  @Property({ fieldName: 'agent_tool_id', type: 'uuid' }) // FK → automation.agent_tools
  agentToolId!: string;

  /**
   * Valor de scope json mantenido por la instancia.
   */
  @Property({
    fieldName: 'scope_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  scopeJson?: unknown;

  /**
   * Valor de max calls per run mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_calls_per_run',
    columnType: 'int',
    nullable: true,
  })
  maxCallsPerRun?: number;

  /**
   * Identificador asociado a permission effect concept.
   */
  @Property({ fieldName: 'permission_effect_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  permissionEffectConceptId!: string;

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
