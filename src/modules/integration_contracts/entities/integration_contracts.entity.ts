import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_contracts`.
 */
@Entity({ schema: 'integration_contracts', tableName: 'integration_contracts' })
export class IntegrationContracts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a external provider.
   */
  @Property({ fieldName: 'external_provider_id', type: 'uuid' }) // FK → integrations.external_providers
  externalProviderId!: string;

  /**
   * Valor de contract code mantenido por la instancia.
   */
  @Property({ fieldName: 'contract_code', columnType: 'varchar' })
  contractCode!: string;

  /**
   * Identificador asociado a capability concept.
   */
  @Property({ fieldName: 'capability_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  capabilityConceptId!: string;

  /**
   * Identificador asociado a data classification concept.
   */
  @Property({
    fieldName: 'data_classification_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataClassificationConceptId?: string;

  /**
   * Identificador asociado a legal basis concept.
   */
  @Property({
    fieldName: 'legal_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  legalBasisConceptId?: string;

  /**
   * Identificador asociado a allowed purpose value set.
   */
  @Property({
    fieldName: 'allowed_purpose_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedPurposeValueSetId?: string;

  /**
   * Identificador asociado a data use agreement.
   */
  @Property({
    fieldName: 'data_use_agreement_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  dataUseAgreementId?: string;

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
