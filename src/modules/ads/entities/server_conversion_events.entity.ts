import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'server_conversion_events' })
export class ServerConversionEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'conversion_dataset_id', type: 'uuid' }) // FK → ads.conversion_datasets
  conversionDatasetId!: string;

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({ fieldName: 'event_id', columnType: 'varchar' })
  eventId!: string;

  @Property({ fieldName: 'event_time', columnType: 'timestamptz' })
  eventTime!: Date;

  @Property({ fieldName: 'action_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionSourceConceptId!: string;

  @Property({
    fieldName: 'event_source_url',
    columnType: 'varchar',
    nullable: true,
  })
  eventSourceUrl?: string;

  @Property({
    fieldName: 'external_order_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalOrderId?: string;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  @Property({ fieldName: 'crm_lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  crmLeadId?: string;

  @Property({ fieldName: 'crm_opportunity_id', type: 'uuid', nullable: true }) // FK → crm.opportunities
  crmOpportunityId?: string;

  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

  @Property({
    fieldName: 'data_processing_options_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dataProcessingOptionsJson?: unknown;

  @Property({
    fieldName: 'test_event_code_used',
    type: 'boolean',
    nullable: true,
  })
  testEventCodeUsed?: boolean;

  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  @Property({
    fieldName: 'blocked_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  blockedReasonConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
