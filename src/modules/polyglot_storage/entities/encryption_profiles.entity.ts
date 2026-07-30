import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `encryption_profiles`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'encryption_profiles' })
export class EncryptionProfiles {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de algorithm mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  algorithm!: string;

  /**
   * Valor de key management provider mantenido por la instancia.
   */
  @Property({ fieldName: 'key_management_provider', columnType: 'varchar' })
  keyManagementProvider!: string;

  /**
   * Valor de key reference mantenido por la instancia.
   */
  @Property({ fieldName: 'key_reference', columnType: 'varchar' })
  keyReference!: string;

  /**
   * Valor de envelope encryption mantenido por la instancia.
   */
  @Property({ fieldName: 'envelope_encryption', type: 'boolean' })
  envelopeEncryption!: boolean;

  /**
   * Valor de field level encryption mantenido por la instancia.
   */
  @Property({ fieldName: 'field_level_encryption', type: 'boolean' })
  fieldLevelEncryption!: boolean;

  /**
   * Valor de deterministic fields json mantenido por la instancia.
   */
  @Property({
    fieldName: 'deterministic_fields_json',
    type: 'json',
    columnType: 'jsonb',
  })
  deterministicFieldsJson!: unknown;

  /**
   * Identificador asociado a rotation policy.
   */
  @Property({ fieldName: 'rotation_policy_id', type: 'uuid' }) // FK → polyglot_storage.key_rotation_policies
  rotationPolicyId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
