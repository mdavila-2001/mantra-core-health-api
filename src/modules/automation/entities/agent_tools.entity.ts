import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `agent_tools`.
 */
@Entity({ schema: 'automation', tableName: 'agent_tools' })
export class AgentTools {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a tool type concept.
   */
  @Property({ fieldName: 'tool_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toolTypeConceptId!: string;

  /**
   * Valor de target resource mantenido por la instancia.
   */
  @Property({
    fieldName: 'target_resource',
    columnType: 'varchar',
    nullable: true,
  })
  targetResource?: string;

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
   * Identificador asociado a integration endpoint.
   */
  @Property({
    fieldName: 'integration_endpoint_id',
    type: 'uuid',
    nullable: true,
  }) // FK → integrations.integration_endpoints
  integrationEndpointId?: string;

  /**
   * Valor de is write mantenido por la instancia.
   */
  @Property({ fieldName: 'is_write', type: 'boolean', nullable: true })
  isWrite?: boolean;

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @Property({ fieldName: 'requires_approval', type: 'boolean', nullable: true })
  requiresApproval?: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
