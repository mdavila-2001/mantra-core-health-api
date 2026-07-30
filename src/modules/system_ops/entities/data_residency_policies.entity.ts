import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `data_residency_policies`.
 */
@Entity({ schema: 'system_ops', tableName: 'data_residency_policies' })
export class DataResidencyPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({ fieldName: 'jurisdiction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  jurisdictionConceptId!: string;

  /**
   * Identificador asociado a data classification.
   */
  @Property({ fieldName: 'data_classification_id', type: 'uuid' }) // FK → system_ops.data_classifications
  dataClassificationId!: string;

  /**
   * Identificador asociado a allowed storage region value set.
   */
  @Property({ fieldName: 'allowed_storage_region_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  allowedStorageRegionValueSetId!: string;

  /**
   * Identificador asociado a allowed processing region value set.
   */
  @Property({
    fieldName: 'allowed_processing_region_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedProcessingRegionValueSetId?: string;

  /**
   * Identificador asociado a cross border transfer basis concept.
   */
  @Property({
    fieldName: 'cross_border_transfer_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  crossBorderTransferBasisConceptId?: string;

  /**
   * Valor de transfer impact assessment required mantenido por la instancia.
   */
  @Property({
    fieldName: 'transfer_impact_assessment_required',
    type: 'boolean',
    nullable: true,
  })
  transferImpactAssessmentRequired?: boolean;

  /**
   * Valor de encryption key region locked mantenido por la instancia.
   */
  @Property({
    fieldName: 'encryption_key_region_locked',
    type: 'boolean',
    nullable: true,
  })
  encryptionKeyRegionLocked?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
