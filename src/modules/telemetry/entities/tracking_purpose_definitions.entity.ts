import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'tracking_purpose_definitions' })
export class TrackingPurposeDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'purpose_code', columnType: 'varchar' })
  purposeCode!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'purpose_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeCategoryConceptId!: string;

  @Property({
    fieldName: 'legal_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  legalBasisConceptId?: string;

  @Property({ fieldName: 'requires_consent', type: 'boolean', nullable: true })
  requiresConsent?: boolean;

  @Property({
    fieldName: 'permits_marketing_use',
    type: 'boolean',
    nullable: true,
  })
  permitsMarketingUse?: boolean;

  @Property({
    fieldName: 'permits_cross_tenant_aggregation',
    type: 'boolean',
    nullable: true,
  })
  permitsCrossTenantAggregation?: boolean;

  @Property({
    fieldName: 'default_retention_days',
    columnType: 'int',
    nullable: true,
  })
  defaultRetentionDays?: number;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
