import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'data_residency_policies' })
export class DataResidencyPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'jurisdiction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  jurisdictionConceptId!: string;

  @Property({ fieldName: 'data_classification_id', type: 'uuid' }) // FK → system_ops.data_classifications
  dataClassificationId!: string;

  @Property({ fieldName: 'allowed_storage_region_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  allowedStorageRegionValueSetId!: string;

  @Property({
    fieldName: 'allowed_processing_region_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedProcessingRegionValueSetId?: string;

  @Property({
    fieldName: 'cross_border_transfer_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  crossBorderTransferBasisConceptId?: string;

  @Property({
    fieldName: 'transfer_impact_assessment_required',
    type: 'boolean',
    nullable: true,
  })
  transferImpactAssessmentRequired?: boolean;

  @Property({
    fieldName: 'encryption_key_region_locked',
    type: 'boolean',
    nullable: true,
  })
  encryptionKeyRegionLocked?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
