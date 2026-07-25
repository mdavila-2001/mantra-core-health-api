import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'laboratory_work_orders' })
export class LaboratoryWorkOrders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'laboratory_accession_id', type: 'uuid' }) // FK → diagnostics.laboratory_accessions
  laboratoryAccessionId!: string;

  @Property({ fieldName: 'work_order_number', columnType: 'varchar' })
  workOrderNumber!: string;

  @Property({
    fieldName: 'assigned_laboratory_unit_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_units
  assignedLaboratoryUnitId?: string;

  @Property({ fieldName: 'assigned_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  assignedProfileId?: string;

  @Property({ fieldName: 'priority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  priorityConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

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
