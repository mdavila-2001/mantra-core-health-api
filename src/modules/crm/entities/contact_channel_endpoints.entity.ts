import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'contact_channel_endpoints' })
export class ContactChannelEndpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  contactId?: string;

  @Property({ fieldName: 'lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  leadId?: string;

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  @Property({ fieldName: 'endpoint_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  endpointTypeConceptId!: string;

  @Property({ fieldName: 'normalized_value', columnType: 'varchar' })
  normalizedValue!: string;

  @Property({ fieldName: 'masked_display_value', columnType: 'varchar' })
  maskedDisplayValue!: string;

  @Property({ fieldName: 'value_hash', columnType: 'varchar' })
  valueHash!: string;

  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  @Property({ fieldName: 'deliverability_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  deliverabilityStatusConceptId!: string;

  @Property({
    fieldName: 'last_success_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessAt?: Date;

  @Property({
    fieldName: 'last_failure_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastFailureAt?: Date;

  @Property({ fieldName: 'do_not_contact', type: 'boolean' })
  doNotContact!: boolean;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
