import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `leads`.
 */
@Entity({ schema: 'crm', tableName: 'leads' })
export class Leads {
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
   * Identificador asociado a lead source concept.
   */
  @Property({ fieldName: 'lead_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leadSourceConceptId!: string;

  /**
   * Identificador asociado a contact.
   */
  @Property({ fieldName: 'contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  contactId?: string;

  /**
   * Identificador asociado a crm account.
   */
  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  /**
   * Valor de full name mantenido por la instancia.
   */
  @Property({ fieldName: 'full_name', columnType: 'varchar', nullable: true })
  fullName?: string;

  /**
   * Valor de email mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  email?: string;

  /**
   * Valor de phone mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  phone?: string;

  /**
   * Valor de interest text mantenido por la instancia.
   */
  @Property({
    fieldName: 'interest_text',
    columnType: 'varchar',
    nullable: true,
  })
  interestText?: string;

  /**
   * Valor de lead score mantenido por la instancia.
   */
  @Property({ fieldName: 'lead_score', columnType: 'numeric', nullable: true })
  leadScore?: string;

  /**
   * Identificador asociado a lead status concept.
   */
  @Property({ fieldName: 'lead_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leadStatusConceptId!: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Identificador asociado a campaign ref.
   */
  @Property({ fieldName: 'campaign_ref_id', type: 'uuid', nullable: true })
  campaignRefId?: string;

  /**
   * Identificador asociado a converted opportunity.
   */
  @Property({
    fieldName: 'converted_opportunity_id',
    type: 'uuid',
    nullable: true,
  }) // FK → crm.opportunities
  convertedOpportunityId?: string;

  /**
   * Valor de converted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'converted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  convertedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
