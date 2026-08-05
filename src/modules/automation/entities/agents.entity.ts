import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `agents`.
 */
@Entity({ schema: 'automation', tableName: 'agents' })
export class Agents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

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
   * Identificador asociado a agent type concept.
   */
  @Property({ fieldName: 'agent_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  agentTypeConceptId!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a default model concept.
   */
  @Property({
    fieldName: 'default_model_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultModelConceptId?: string;

  /**
   * Identificador asociado a system service component.
   */
  @Property({
    fieldName: 'system_service_component_id',
    type: 'uuid',
    nullable: true,
  }) // FK → platform_ops.service_components
  systemServiceComponentId?: string;

  /**
   * Identificador asociado a autonomy level concept.
   */
  @Property({ fieldName: 'autonomy_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  autonomyLevelConceptId!: string;

  /**
   * Identificador asociado a acts as user.
   */
  @Property({ fieldName: 'acts_as_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actsAsUserId?: string;

  /**
   * Valor de current version mantenido por la instancia.
   */
  @Property({ fieldName: 'current_version', columnType: 'int' })
  currentVersion!: number;

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
