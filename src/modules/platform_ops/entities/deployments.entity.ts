import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `deployments`.
 */
@Entity({ schema: 'platform_ops', tableName: 'deployments' })
export class Deployments {
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
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  /**
   * Identificador asociado a artifact.
   */
  @Property({ fieldName: 'artifact_id', type: 'uuid' }) // FK → platform_ops.artifacts
  artifactId!: string;

  /**
   * Identificador asociado a environment concept.
   */
  @Property({ fieldName: 'environment_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  environmentConceptId!: string;

  /**
   * Valor de deployment number mantenido por la instancia.
   */
  @Property({ fieldName: 'deployment_number', columnType: 'varchar' })
  deploymentNumber!: string;

  /**
   * Identificador asociado a strategy concept.
   */
  @Property({ fieldName: 'strategy_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  strategyConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a deployed by user.
   */
  @Property({ fieldName: 'deployed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  deployedByUserId?: string;

  /**
   * Valor de git ref mantenido por la instancia.
   */
  @Property({ fieldName: 'git_ref', columnType: 'varchar', nullable: true })
  gitRef?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Valor de is current mantenido por la instancia.
   */
  @Property({ fieldName: 'is_current', type: 'boolean', nullable: true })
  isCurrent?: boolean;

  /**
   * Identificador asociado a rollback of deployment.
   */
  @Property({
    fieldName: 'rollback_of_deployment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → platform_ops.deployments
  rollbackOfDeploymentId?: string;

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
