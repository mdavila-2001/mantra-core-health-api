import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'accepted_risks' })
export class AcceptedRisks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  title?: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true })
  severityConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  @Property({ fieldName: 'accepted_by_user_id', type: 'uuid', nullable: true })
  acceptedByUserId?: string;

  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

  @Property({
    fieldName: 'review_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewDueAt?: Date;

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
