import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lead_submissions`.
 */
@Entity({ schema: 'ads', tableName: 'lead_submissions' })
export class LeadSubmissions {
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
   * Identificador asociado a lead form.
   */
  @Property({ fieldName: 'lead_form_id', type: 'uuid' }) // FK → ads.lead_forms
  leadFormId!: string;

  /**
   * Identificador asociado a ad.
   */
  @Property({ fieldName: 'ad_id', type: 'uuid', nullable: true }) // FK → ads.ads
  adId?: string;

  /**
   * Identificador asociado a ad set.
   */
  @Property({ fieldName: 'ad_set_id', type: 'uuid', nullable: true }) // FK → ads.ad_sets
  adSetId?: string;

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  /**
   * Identificador asociado a external lead.
   */
  @Property({ fieldName: 'external_lead_id', columnType: 'varchar' })
  externalLeadId!: string;

  /**
   * Valor de submitted at mantenido por la instancia.
   */
  @Property({ fieldName: 'submitted_at', columnType: 'timestamptz' })
  submittedAt!: Date;

  /**
   * Identificador asociado a crm lead.
   */
  @Property({ fieldName: 'crm_lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  crmLeadId?: string;

  /**
   * Identificador asociado a consent directive.
   */
  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

  /**
   * Identificador asociado a processing status concept.
   */
  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  /**
   * Valor de raw payload hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'raw_payload_hash',
    columnType: 'varchar',
    nullable: true,
  })
  rawPayloadHash?: string;

  /**
   * Valor de source ip hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_ip_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourceIpHash?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
