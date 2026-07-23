import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'lead_forms' })
export class LeadForms {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'ad_identity_asset_id', type: 'uuid', nullable: true }) // FK → ads.ad_identity_assets
  adIdentityAssetId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'external_form_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalFormId?: string;

  @Property({ fieldName: 'form_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  formTypeConceptId!: string;

  @Property({
    fieldName: 'privacy_policy_url',
    columnType: 'varchar',
    nullable: true,
  })
  privacyPolicyUrl?: string;

  @Property({
    fieldName: 'completion_message',
    columnType: 'text',
    nullable: true,
  })
  completionMessage?: string;

  @Property({
    fieldName: 'destination_crm_pipeline_id',
    type: 'uuid',
    nullable: true,
  }) // FK → crm.pipelines
  destinationCrmPipelineId?: string;

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
