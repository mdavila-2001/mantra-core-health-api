import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'contacts' })
export class Contacts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  @Property({ fieldName: 'first_name', columnType: 'varchar' })
  firstName!: string;

  @Property({ fieldName: 'last_name', columnType: 'varchar', nullable: true })
  lastName?: string;

  @Property({ fieldName: 'contact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contactTypeConceptId!: string;

  @Property({ fieldName: 'job_title', columnType: 'varchar', nullable: true })
  jobTitle?: string;

  @Property({ fieldName: 'linked_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  linkedUserId?: string;

  @Property({
    fieldName: 'linked_profile_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  linkedProfileRefType?: string;

  @Property({
    fieldName: 'linked_profile_ref_id',
    type: 'uuid',
    nullable: true,
  })
  linkedProfileRefId?: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({
    fieldName: 'lifecycle_stage_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lifecycleStageConceptId?: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  @Property({ fieldName: 'do_not_contact', type: 'boolean', nullable: true })
  doNotContact?: boolean;

  @Property({ fieldName: 'marketing_consent_id', type: 'uuid', nullable: true }) // FK → consent.consents
  marketingConsentId?: string;

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
