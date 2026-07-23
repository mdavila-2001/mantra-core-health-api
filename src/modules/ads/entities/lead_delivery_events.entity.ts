import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'lead_delivery_events' })
export class LeadDeliveryEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lead_submission_id', type: 'uuid' }) // FK → ads.lead_submissions
  leadSubmissionId!: string;

  @Property({ fieldName: 'destination_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  destinationTypeConceptId!: string;

  @Property({
    fieldName: 'destination_reference',
    columnType: 'varchar',
    nullable: true,
  })
  destinationReference?: string;

  @Property({ fieldName: 'attempted_at', columnType: 'timestamptz' })
  attemptedAt!: Date;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({
    fieldName: 'response_reference',
    columnType: 'varchar',
    nullable: true,
  })
  responseReference?: string;

  @Property({
    fieldName: 'retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retryAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
