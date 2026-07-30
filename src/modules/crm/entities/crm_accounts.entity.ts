import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_accounts`.
 */
@Entity({ schema: 'crm', tableName: 'crm_accounts' })
export class CrmAccounts {
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
   * Identificador asociado a account type concept.
   */
  @Property({ fieldName: 'account_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountTypeConceptId!: string;

  /**
   * Identificador asociado a industry concept.
   */
  @Property({ fieldName: 'industry_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  industryConceptId?: string;

  /**
   * Identificador asociado a parent account.
   */
  @Property({ fieldName: 'parent_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  parentAccountId?: string;

  /**
   * Valor de website mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  website?: string;

  /**
   * Identificador asociado a tax.
   */
  @Property({ fieldName: 'tax_id', columnType: 'varchar', nullable: true })
  taxId?: string;

  /**
   * Identificador asociado a linked tenant.
   */
  @Property({ fieldName: 'linked_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  linkedTenantId?: string;

  /**
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  /**
   * Valor de linked org ref type mantenido por la instancia.
   */
  @Property({
    fieldName: 'linked_org_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  linkedOrgRefType?: string;

  /**
   * Identificador asociado a linked org ref.
   */
  @Property({ fieldName: 'linked_org_ref_id', type: 'uuid', nullable: true })
  linkedOrgRefId?: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Valor de annual value mantenido por la instancia.
   */
  @Property({
    fieldName: 'annual_value',
    columnType: 'numeric',
    nullable: true,
  })
  annualValue?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
