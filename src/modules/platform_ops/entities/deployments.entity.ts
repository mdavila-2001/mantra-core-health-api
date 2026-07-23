import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'deployments' })
export class Deployments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ fieldName: 'artifact_id', type: 'uuid' }) // FK → platform_ops.artifacts
  artifactId!: string;

  @Property({ fieldName: 'environment_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  environmentConceptId!: string;

  @Property({ fieldName: 'deployment_number', columnType: 'varchar' })
  deploymentNumber!: string;

  @Property({ fieldName: 'strategy_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  strategyConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'deployed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  deployedByUserId?: string;

  @Property({ fieldName: 'git_ref', columnType: 'varchar', nullable: true })
  gitRef?: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'is_current', type: 'boolean', nullable: true })
  isCurrent?: boolean;

  @Property({
    fieldName: 'rollback_of_deployment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → platform_ops.deployments
  rollbackOfDeploymentId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
