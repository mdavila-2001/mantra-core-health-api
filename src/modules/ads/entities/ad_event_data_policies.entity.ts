import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_event_data_policies' })
export class AdEventDataPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'jurisdiction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  jurisdictionConceptId!: string;

  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  @Property({ fieldName: 'requires_consent', type: 'boolean', nullable: true })
  requiresConsent?: boolean;

  @Property({
    fieldName: 'consent_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  consentScopeConceptId?: string;

  @Property({ fieldName: 'default_action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  defaultActionConceptId!: string;

  @Property({
    fieldName: 'prohibited_data_classes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  prohibitedDataClassesJson?: unknown;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
