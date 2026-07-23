import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'health_checks' })
export class HealthChecks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'check_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checkTypeConceptId!: string;

  @Property({ fieldName: 'target_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetKindConceptId!: string;

  @Property({ fieldName: 'target_ref', columnType: 'text', nullable: true })
  targetRef?: string;

  @Property({
    fieldName: 'expected_result',
    columnType: 'text',
    nullable: true,
  })
  expectedResult?: string;

  @Property({
    fieldName: 'interval_seconds',
    columnType: 'int',
    nullable: true,
  })
  intervalSeconds?: number;

  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

  @Property({
    fieldName: 'healthy_threshold',
    columnType: 'int',
    nullable: true,
  })
  healthyThreshold?: number;

  @Property({
    fieldName: 'unhealthy_threshold',
    columnType: 'int',
    nullable: true,
  })
  unhealthyThreshold?: number;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  severityConceptId?: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

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
