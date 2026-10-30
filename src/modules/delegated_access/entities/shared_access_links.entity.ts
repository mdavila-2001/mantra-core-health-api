import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'delegated_access', tableName: 'shared_access_links' })
export class SharedAccessLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  resourceTypeConceptId!: string;

  @Property({ fieldName: 'resource_id', type: 'uuid' })
  resourceId!: string;

  @Property({ fieldName: 'token_hash', columnType: 'varchar' })
  tokenHash!: string;

  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  scopeConceptId!: string;

  @Property({
    fieldName: 'recipient_kind_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  recipientKindConceptId?: string;

  @Property({
    fieldName: 'recipient_label',
    columnType: 'varchar',
    nullable: true,
  })
  recipientLabel?: string;

  @Property({
    fieldName: 'purpose_of_use_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  purposeOfUseConceptId?: string;

  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  @Property({ fieldName: 'revoked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  revokedByUserId?: string;

  @Property({
    fieldName: 'revoke_reason_text',
    columnType: 'text',
    nullable: true,
  })
  revokeReasonText?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
