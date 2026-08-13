import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `storage_capabilities`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'storage_capabilities' })
export class StorageCapabilities {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a storage backend.
   */
  @Property({ fieldName: 'storage_backend_id', type: 'uuid' }) // FK → polyglot_storage.storage_backends
  storageBackendId!: string;

  /**
   * Valor de capability code mantenido por la instancia.
   */
  @Property({ fieldName: 'capability_code', columnType: 'varchar' })
  capabilityCode!: string;

  /**
   * Valor de capability version mantenido por la instancia.
   */
  @Property({ fieldName: 'capability_version', columnType: 'varchar' })
  capabilityVersion!: string;

  /**
   * Valor de configuration json mantenido por la instancia.
   */
  @Property({
    fieldName: 'configuration_json',
    type: 'json',
    columnType: 'jsonb',
  })
  configurationJson!: unknown;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @Property({ fieldName: 'verification_status', columnType: 'varchar' })
  verificationStatus!: string;
}
