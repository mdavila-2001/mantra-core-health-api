import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'workload_assessments' })
export class WorkloadAssessments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'operational_framework_id', type: 'uuid' }) // FK → system_ops.operational_frameworks
  operationalFrameworkId!: string;

  @Property({ fieldName: 'workload_code', columnType: 'varchar' })
  workloadCode!: string;

  @Property({ fieldName: 'workload_name', columnType: 'varchar' })
  workloadName!: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid', nullable: true }) // FK → platform_ops.service_components
  serviceComponentId?: string;

  @Property({ fieldName: 'assessment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assessmentTypeConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'assessment_period_start',
    columnType: 'date',
    nullable: true,
  })
  assessmentPeriodStart?: Date;

  @Property({
    fieldName: 'assessment_period_end',
    columnType: 'date',
    nullable: true,
  })
  assessmentPeriodEnd?: Date;

  @Property({ fieldName: 'facilitator_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  facilitatorUserId?: string;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  @Property({
    fieldName: 'summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  summaryJson?: unknown;

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
