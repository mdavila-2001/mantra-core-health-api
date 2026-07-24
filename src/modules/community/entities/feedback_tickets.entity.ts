import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'feedback_tickets' })
export class FeedbackTickets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'ticket_number', columnType: 'varchar' })
  ticketNumber!: string;

  @Property({ fieldName: 'reporter_user_id', type: 'uuid' })
  reporterUserId!: string;

  @Property({
    fieldName: 'reporter_type_concept_id',
    type: 'uuid',
    nullable: true,
  })
  reporterTypeConceptId?: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid' })
  categoryConceptId!: string;

  @Property({ columnType: 'varchar' })
  subject!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true })
  severityConceptId?: string;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true })
  channelConceptId?: string;

  @Property({
    fieldName: 'related_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  relatedRefType?: string;

  @Property({ fieldName: 'related_ref_id', type: 'uuid', nullable: true })
  relatedRefId?: string;

  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @Property({ columnType: 'text', nullable: true })
  resolution?: string;

  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })
  statusConceptId!: string;

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
