import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_terms_conditions`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_terms_conditions' })
export class InsuranceTermsConditions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance carrier.
   */
  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers (inferida)
  insuranceCarrierId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a document file.
   */
  @Property({ fieldName: 'document_file_id', type: 'uuid' }) // FK → common.files (inferida)
  documentFileId!: string;

  /**
   * Identificador asociado a insurance product.
   */
  @Property({ fieldName: 'insurance_product_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_products (inferida)
  insuranceProductId?: string;

  /**
   * Identificador asociado a insurance plan.
   */
  @Property({ fieldName: 'insurance_plan_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_plans (inferida)
  insurancePlanId?: string;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  serviceConceptId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts (inferida)
  contractId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a client type concept.
   */
  @Property({
    fieldName: 'client_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  clientTypeConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'date' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
