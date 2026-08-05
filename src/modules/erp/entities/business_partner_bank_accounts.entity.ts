import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `business_partner_bank_accounts`.
 */
@Entity({ schema: 'erp', tableName: 'business_partner_bank_accounts' })
export class BusinessPartnerBankAccounts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  businessPartnerId!: string;

  /**
   * Valor de bank name mantenido por la instancia.
   */
  @Property({ fieldName: 'bank_name', columnType: 'varchar' })
  bankName!: string;

  /**
   * Valor de account holder name mantenido por la instancia.
   */
  @Property({
    fieldName: 'account_holder_name',
    columnType: 'varchar',
    nullable: true,
  })
  accountHolderName?: string;

  /**
   * Identificador asociado a account holder tax.
   */
  @Property({
    fieldName: 'account_holder_tax_id',
    columnType: 'varchar',
    nullable: true,
  })
  accountHolderTaxId?: string;

  /**
   * Valor de bank identifier code mantenido por la instancia.
   */
  @Property({
    fieldName: 'bank_identifier_code',
    columnType: 'varchar',
    nullable: true,
  })
  bankIdentifierCode?: string;

  /**
   * Valor de iban masked mantenido por la instancia.
   */
  @Property({ fieldName: 'iban_masked', columnType: 'varchar', nullable: true })
  ibanMasked?: string;

  /**
   * Valor de account number hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'account_number_hash',
    columnType: 'varchar',
    nullable: true,
  })
  accountNumberHash?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({
    fieldName: 'verification_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  verificationStatusConceptId?: string;

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
