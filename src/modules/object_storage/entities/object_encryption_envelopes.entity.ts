import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_encryption_envelopes`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_encryption_envelopes' })
export class ObjectEncryptionEnvelopes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object version.
   */
  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

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
   * Valor de encrypted data key mantenido por la instancia.
   */
  @Property({ fieldName: 'encrypted_data_key', columnType: 'bytea' })
  encryptedDataKey!: string;

  /**
   * Valor de key version mantenido por la instancia.
   */
  @Property({ fieldName: 'key_version', columnType: 'varchar' })
  keyVersion!: string;

  /**
   * Valor de encryption context hash mantenido por la instancia.
   */
  @Property({ fieldName: 'encryption_context_hash', columnType: 'varchar' })
  encryptionContextHash!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
