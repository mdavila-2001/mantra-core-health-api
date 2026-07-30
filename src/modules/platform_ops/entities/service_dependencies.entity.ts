import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_dependencies`.
 */
@Entity({ schema: 'platform_ops', tableName: 'service_dependencies' })
export class ServiceDependencies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a upstream service component.
   */
  @Property({ fieldName: 'upstream_service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  upstreamServiceComponentId!: string;

  /**
   * Identificador asociado a downstream service component.
   */
  @Property({ fieldName: 'downstream_service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  downstreamServiceComponentId!: string;

  /**
   * Identificador asociado a dependency type concept.
   */
  @Property({ fieldName: 'dependency_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dependencyTypeConceptId!: string;

  /**
   * Identificador asociado a criticality concept.
   */
  @Property({
    fieldName: 'criticality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  criticalityConceptId?: string;

  /**
   * Valor de timeout ms mantenido por la instancia.
   */
  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

  /**
   * Valor de failure mode text mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_mode_text',
    columnType: 'text',
    nullable: true,
  })
  failureModeText?: string;

  /**
   * Valor de fallback strategy text mantenido por la instancia.
   */
  @Property({
    fieldName: 'fallback_strategy_text',
    columnType: 'text',
    nullable: true,
  })
  fallbackStrategyText?: string;

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
