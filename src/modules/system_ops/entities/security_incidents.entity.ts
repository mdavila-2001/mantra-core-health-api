import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'security_incidents' })
export class SecurityIncidents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' })
  severityConceptId!: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid' })
  categoryConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })
  statusConceptId!: string;

  @Property({ fieldName: 'vector_concept_id', type: 'uuid', nullable: true })
  vectorConceptId?: string;

  @Property({
    fieldName: 'detected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  detectedAt?: Date;

  @Property({
    fieldName: 'contained_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  containedAt?: Date;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({
    fieldName: 'affected_records_estimate',
    columnType: 'bigint',
    nullable: true,
  })
  affectedRecordsEstimate?: string;

  @Property({ fieldName: 'is_reportable', type: 'boolean', nullable: true })
  isReportable?: boolean;

  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @Property({
    fieldName: 'data_classification_id',
    type: 'uuid',
    nullable: true,
  })
  dataClassificationId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  summary?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
