import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Aliado de una campaña preventiva: SPONSOR (importadora o fabricante) o PROVIDER (laboratorio,
 * farmacia o centro). `partnerTenantId` es referencia blanda, sin FK física.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_campaign_partners' })
export class InsuranceCampaignPartners {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_campaign_id', type: 'uuid' }) // FK → insurance.insurance_campaigns (inferida)
  insuranceCampaignId!: string;

  @Property({ fieldName: 'partner_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  partnerRoleConceptId!: string;

  @Property({ fieldName: 'partner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  partnerTypeConceptId!: string;

  @Property({ fieldName: 'partner_name', columnType: 'varchar' })
  partnerName!: string;

  @Property({ fieldName: 'partner_tenant_id', type: 'uuid', nullable: true })
  partnerTenantId?: string;

  @Property({
    fieldName: 'network_provider_membership_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.network_provider_memberships (inferida)
  networkProviderMembershipId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
