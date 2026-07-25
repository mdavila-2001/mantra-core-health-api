import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'health_data',
  tableName: 'health_deidentification_profiles',
})
export class HealthDeidentificationProfiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'methodology_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodologyConceptId!: string;

  @Property({ columnType: 'varchar' })
  version!: string;

  @Property({
    fieldName: 'direct_identifier_rules_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  directIdentifierRulesJson?: unknown;

  @Property({
    fieldName: 'quasi_identifier_rules_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  quasiIdentifierRulesJson?: unknown;

  @Property({
    fieldName: 'date_shift_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dateShiftPolicyJson?: unknown;

  @Property({
    fieldName: 'free_text_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  freeTextPolicyJson?: unknown;

  @Property({
    fieldName: 'reidentification_key_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.encryption_keys
  reidentificationKeySecretId?: string;

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
