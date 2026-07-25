import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'encryption_keys' })
export class EncryptionKeys {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'key_alias', columnType: 'varchar' })
  keyAlias!: string;

  @Property({ fieldName: 'key_purpose_concept_id', type: 'uuid' })
  keyPurposeConceptId!: string;

  @Property({ fieldName: 'algorithm_concept_id', type: 'uuid' })
  algorithmConceptId!: string;

  @Property({ fieldName: 'provider_concept_id', type: 'uuid', nullable: true })
  providerConceptId?: string;

  @Property({
    fieldName: 'external_key_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalKeyRef?: string;

  @Property({ fieldName: 'key_version', columnType: 'int', nullable: true })
  keyVersion?: number;

  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  @Property({
    fieldName: 'rotation_period_days',
    columnType: 'int',
    nullable: true,
  })
  rotationPeriodDays?: number;

  @Property({
    fieldName: 'last_rotated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRotatedAt?: Date;

  @Property({
    fieldName: 'next_rotation_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRotationAt?: Date;

  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true })
  retentionPolicyId?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' })
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
