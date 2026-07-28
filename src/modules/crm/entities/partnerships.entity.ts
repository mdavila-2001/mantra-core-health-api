import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `partnerships`.
 */
@Entity({ schema: 'crm', tableName: 'partnerships' })
export class Partnerships {
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
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a partnership type concept.
   */
  @Property({ fieldName: 'partnership_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partnershipTypeConceptId!: string;

  /**
   * Valor de partner ref type mantenido por la instancia.
   */
  @Property({ fieldName: 'partner_ref_type', columnType: 'varchar' })
  partnerRefType!: string;

  /**
   * Identificador asociado a partner ref.
   */
  @Property({ fieldName: 'partner_ref_id', type: 'uuid' })
  partnerRefId!: string;

  /**
   * Identificador asociado a crm account.
   */
  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  /**
   * Identificador asociado a ad partner.
   */
  @Property({ fieldName: 'ad_partner_id', type: 'uuid', nullable: true }) // FK → ads.ad_partners
  adPartnerId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a tier concept.
   */
  @Property({ fieldName: 'tier_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  tierConceptId?: string;

  /**
   * Valor de revenue share percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'revenue_share_percent',
    columnType: 'numeric',
    nullable: true,
  })
  revenueSharePercent?: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @Property({ fieldName: 'start_date', columnType: 'date', nullable: true })
  startDate?: Date;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

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
