import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'encryption_profiles' })
export class EncryptionProfiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  algorithm!: string;

  @Property({ fieldName: 'key_management_provider', columnType: 'varchar' })
  keyManagementProvider!: string;

  @Property({ fieldName: 'key_reference', columnType: 'varchar' })
  keyReference!: string;

  @Property({ fieldName: 'envelope_encryption', type: 'boolean' })
  envelopeEncryption!: boolean;

  @Property({ fieldName: 'field_level_encryption', type: 'boolean' })
  fieldLevelEncryption!: boolean;

  @Property({
    fieldName: 'deterministic_fields_json',
    type: 'json',
    columnType: 'jsonb',
  })
  deterministicFieldsJson!: unknown;

  @Property({ fieldName: 'rotation_policy_id', type: 'uuid' }) // FK → polyglot_storage.key_rotation_policies
  rotationPolicyId!: string;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
