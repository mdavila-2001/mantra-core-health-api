import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Aliado de una campaña preventiva: SPONSOR (importadora o fabricante) o PROVIDER (laboratorio,
 * farmacia o centro). `partnerTenantId` es referencia blanda, sin FK física.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_campaign_partners' })
export class InsuranceCampaignPartners {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance campaign.
   */
  @Property({ fieldName: 'insurance_campaign_id', type: 'uuid' }) // FK → insurance.insurance_campaigns
  insuranceCampaignId!: string;

  /**
   * Identificador asociado a partner role concept.
   */
  @Property({ fieldName: 'partner_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partnerRoleConceptId!: string;

  /**
   * Identificador asociado a partner type concept.
   */
  @Property({ fieldName: 'partner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partnerTypeConceptId!: string;

  /**
   * Valor de partner name mantenido por la instancia.
   */
  @Property({ fieldName: 'partner_name', columnType: 'varchar' })
  partnerName!: string;

  /**
   * Identificador asociado a partner tenant.
   */
  @Property({ fieldName: 'partner_tenant_id', type: 'uuid', nullable: true })
  partnerTenantId?: string;

  /**
   * Identificador asociado a network provider membership.
   */
  @Property({
    fieldName: 'network_provider_membership_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.network_provider_memberships
  networkProviderMembershipId?: string;

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
