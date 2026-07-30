import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `server_conversion_events`.
 */
@Entity({ schema: 'ads', tableName: 'server_conversion_events' })
export class ServerConversionEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a conversion dataset.
   */
  @Property({ fieldName: 'conversion_dataset_id', type: 'uuid' }) // FK → ads.conversion_datasets
  conversionDatasetId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Identificador asociado a event.
   */
  @Property({ fieldName: 'event_id', columnType: 'varchar' })
  eventId!: string;

  /**
   * Valor de event time mantenido por la instancia.
   */
  @Property({ fieldName: 'event_time', columnType: 'timestamptz' })
  eventTime!: Date;

  /**
   * Identificador asociado a action source concept.
   */
  @Property({ fieldName: 'action_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionSourceConceptId!: string;

  /**
   * Valor de event source url mantenido por la instancia.
   */
  @Property({
    fieldName: 'event_source_url',
    columnType: 'varchar',
    nullable: true,
  })
  eventSourceUrl?: string;

  /**
   * Identificador asociado a external order.
   */
  @Property({
    fieldName: 'external_order_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalOrderId?: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  /**
   * Identificador asociado a crm lead.
   */
  @Property({ fieldName: 'crm_lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  crmLeadId?: string;

  /**
   * Identificador asociado a crm opportunity.
   */
  @Property({ fieldName: 'crm_opportunity_id', type: 'uuid', nullable: true }) // FK → crm.opportunities
  crmOpportunityId?: string;

  /**
   * Identificador asociado a consent directive.
   */
  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

  /**
   * Valor de data processing options json mantenido por la instancia.
   */
  @Property({
    fieldName: 'data_processing_options_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dataProcessingOptionsJson?: unknown;

  /**
   * Valor de test event code used mantenido por la instancia.
   */
  @Property({
    fieldName: 'test_event_code_used',
    type: 'boolean',
    nullable: true,
  })
  testEventCodeUsed?: boolean;

  /**
   * Identificador asociado a processing status concept.
   */
  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  /**
   * Identificador asociado a blocked reason concept.
   */
  @Property({
    fieldName: 'blocked_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  blockedReasonConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
