import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'consent', tableName: 'processing_legal_bases' })
export class ProcessingLegalBases {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'processing_purpose_id', type: 'uuid' }) // FK → consent.processing_purposes
  processingPurposeId!: string;

  @Property({ fieldName: 'jurisdiction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  jurisdictionConceptId!: string;

  @Property({ fieldName: 'general_legal_basis_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  generalLegalBasisConceptId!: string;

  @Property({
    fieldName: 'special_category_condition_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  specialCategoryConditionConceptId?: string;

  @Property({
    fieldName: 'policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  policyVersion?: string;

  @Property({
    fieldName: 'legal_reference_uri',
    columnType: 'text',
    nullable: true,
  })
  legalReferenceUri?: string;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
