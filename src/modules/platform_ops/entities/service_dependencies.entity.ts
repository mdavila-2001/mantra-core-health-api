import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'service_dependencies' })
export class ServiceDependencies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'upstream_service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  upstreamServiceComponentId!: string;

  @Property({ fieldName: 'downstream_service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  downstreamServiceComponentId!: string;

  @Property({ fieldName: 'dependency_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dependencyTypeConceptId!: string;

  @Property({
    fieldName: 'criticality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  criticalityConceptId?: string;

  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

  @Property({
    fieldName: 'failure_mode_text',
    columnType: 'text',
    nullable: true,
  })
  failureModeText?: string;

  @Property({
    fieldName: 'fallback_strategy_text',
    columnType: 'text',
    nullable: true,
  })
  fallbackStrategyText?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
