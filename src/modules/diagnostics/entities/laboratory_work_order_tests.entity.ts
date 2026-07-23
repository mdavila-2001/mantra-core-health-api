import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'laboratory_work_order_tests' })
export class LaboratoryWorkOrderTests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'laboratory_work_order_id', type: 'uuid' }) // FK → diagnostics.laboratory_work_orders
  laboratoryWorkOrderId!: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid' }) // FK → clinical.service_requests
  serviceRequestId!: string;

  @Property({ fieldName: 'test_code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  testCodeConceptId!: string;

  @Property({ fieldName: 'specimen_id', type: 'uuid', nullable: true }) // FK → diagnostics.specimens
  specimenId?: string;

  @Property({ fieldName: 'method_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  methodConceptId?: string;

  @Property({ fieldName: 'analyzer_device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  analyzerDeviceId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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

  @Property({ fieldName: 'observation_id', type: 'uuid', nullable: true }) // FK → clinical.observations
  observationId?: string;

  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

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
