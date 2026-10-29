import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'cleaning_orders' })
export class CleaningOrders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units (inferida)
  clinicalUnitId?: string;

  @Property({ fieldName: 'cleaning_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  cleaningTypeConceptId!: string;

  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  triggerConceptId!: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  @Property({ fieldName: 'previous_order_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  previousOrderId?: string;

  @Property({ fieldName: 'priority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  priorityConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  assignedUserId?: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({ fieldName: 'started_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  startedByUserId?: string;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'finished_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  finishedByUserId?: string;

  @Property({
    fieldName: 'inspected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  inspectedAt?: Date;

  @Property({ fieldName: 'inspected_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  inspectedByUserId?: string;

  @Property({
    fieldName: 'inspection_result_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  inspectionResultConceptId?: string;

  @Property({
    fieldName: 'rejection_reason',
    columnType: 'varchar',
    nullable: true,
  })
  rejectionReason?: string;

  @Property({
    fieldName: 'cancel_reason',
    columnType: 'varchar',
    nullable: true,
  })
  cancelReason?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
