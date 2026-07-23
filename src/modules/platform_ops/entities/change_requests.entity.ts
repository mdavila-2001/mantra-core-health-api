import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'change_requests' })
export class ChangeRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ fieldName: 'deployment_id', type: 'uuid', nullable: true }) // FK → platform_ops.deployments
  deploymentId?: string;

  @Property({ fieldName: 'change_number', columnType: 'varchar' })
  changeNumber!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'change_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  changeTypeConceptId!: string;

  @Property({ fieldName: 'risk_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  riskLevelConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  @Property({
    fieldName: 'planned_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedStartAt?: Date;

  @Property({
    fieldName: 'planned_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedEndAt?: Date;

  @Property({
    fieldName: 'rollback_plan_text',
    columnType: 'text',
    nullable: true,
  })
  rollbackPlanText?: string;

  @Property({
    fieldName: 'validation_plan_text',
    columnType: 'text',
    nullable: true,
  })
  validationPlanText?: string;

  @Property({
    fieldName: 'maintenance_window_id',
    type: 'uuid',
    nullable: true,
  }) // FK → platform_ops.maintenance_windows
  maintenanceWindowId?: string;

  @Property({
    fieldName: 'implemented_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  implementedAt?: Date;

  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

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
