import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `partnership_agreements`.
 */
@Entity({ schema: 'crm', tableName: 'partnership_agreements' })
export class PartnershipAgreements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a partnership.
   */
  @Property({ fieldName: 'partnership_id', type: 'uuid' }) // FK → crm.partnerships
  partnershipId!: string;

  /**
   * Identificador asociado a agreement type concept.
   */
  @Property({ fieldName: 'agreement_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  agreementTypeConceptId!: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Valor de terms json mantenido por la instancia.
   */
  @Property({
    fieldName: 'terms_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  termsJson?: unknown;

  /**
   * Valor de commitment amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'commitment_amount',
    columnType: 'numeric',
    nullable: true,
  })
  commitmentAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  /**
   * Identificador asociado a document file.
   */
  @Property({ fieldName: 'document_file_id', type: 'uuid', nullable: true }) // FK → common.files
  documentFileId?: string;

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
