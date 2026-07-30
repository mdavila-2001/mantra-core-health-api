import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `storage_backend_regions`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'storage_backend_regions' })
export class StorageBackendRegions {
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
   * Valor de region code mantenido por la instancia.
   */
  @Property({ fieldName: 'region_code', columnType: 'varchar' })
  regionCode!: string;

  /**
   * Valor de country code mantenido por la instancia.
   */
  @Property({ fieldName: 'country_code', columnType: 'char(2)' })
  countryCode!: string;

  /**
   * Valor de jurisdiction code mantenido por la instancia.
   */
  @Property({ fieldName: 'jurisdiction_code', columnType: 'varchar' })
  jurisdictionCode!: string;

  /**
   * Valor de endpoint uri mantenido por la instancia.
   */
  @Property({ fieldName: 'endpoint_uri', columnType: 'varchar' })
  endpointUri!: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;

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
