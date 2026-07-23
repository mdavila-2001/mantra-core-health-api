import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'lead_submissions' })
export class LeadSubmissions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'lead_form_id', type: 'uuid' }) // FK → ads.lead_forms
  leadFormId!: string;

  @Property({ fieldName: 'ad_id', type: 'uuid', nullable: true }) // FK → ads.ads
  adId?: string;

  @Property({ fieldName: 'ad_set_id', type: 'uuid', nullable: true }) // FK → ads.ad_sets
  adSetId?: string;

  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  @Property({ fieldName: 'external_lead_id', columnType: 'varchar' })
  externalLeadId!: string;

  @Property({ fieldName: 'submitted_at', columnType: 'timestamptz' })
  submittedAt!: Date;

  @Property({ fieldName: 'crm_lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  crmLeadId?: string;

  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  @Property({
    fieldName: 'raw_payload_hash',
    columnType: 'varchar',
    nullable: true,
  })
  rawPayloadHash?: string;

  @Property({
    fieldName: 'source_ip_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourceIpHash?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
