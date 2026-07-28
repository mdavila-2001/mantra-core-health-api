import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_namespaces`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_namespaces' })
export class ObjectNamespaces {
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
   * Valor de backend code mantenido por la instancia.
   */
  @Property({ fieldName: 'backend_code', columnType: 'varchar' })
  backendCode!: string;

  /**
   * Valor de region code mantenido por la instancia.
   */
  @Property({ fieldName: 'region_code', columnType: 'varchar' })
  regionCode!: string;

  /**
   * Valor de bucket or container mantenido por la instancia.
   */
  @Property({ fieldName: 'bucket_or_container', columnType: 'varchar' })
  bucketOrContainer!: string;

  /**
   * Valor de object key prefix mantenido por la instancia.
   */
  @Property({ fieldName: 'object_key_prefix', columnType: 'varchar' })
  objectKeyPrefix!: string;

  /**
   * Valor de default storage class mantenido por la instancia.
   */
  @Property({ fieldName: 'default_storage_class', columnType: 'varchar' })
  defaultStorageClass!: string;

  /**
   * Valor de versioning enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'versioning_enabled', type: 'boolean' })
  versioningEnabled!: boolean;

  /**
   * Valor de object lock enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'object_lock_enabled', type: 'boolean' })
  objectLockEnabled!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
