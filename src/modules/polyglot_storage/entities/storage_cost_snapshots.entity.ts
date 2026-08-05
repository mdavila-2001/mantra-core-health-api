import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `storage_cost_snapshots`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'storage_cost_snapshots' })
export class StorageCostSnapshots {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a storage backend region.
   */
  @Property({ fieldName: 'storage_backend_region_id', type: 'uuid' }) // FK → polyglot_storage.storage_backend_regions
  storageBackendRegionId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a dataset definition.
   */
  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  /**
   * Valor de storage bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'storage_bytes', type: 'bigint' })
  storageBytes!: string;

  /**
   * Valor de read units mantenido por la instancia.
   */
  @Property({ fieldName: 'read_units', columnType: 'numeric' })
  readUnits!: string;

  /**
   * Valor de write units mantenido por la instancia.
   */
  @Property({ fieldName: 'write_units', columnType: 'numeric' })
  writeUnits!: string;

  /**
   * Valor de egress bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'egress_bytes', type: 'bigint' })
  egressBytes!: string;

  /**
   * Valor de estimated cost mantenido por la instancia.
   */
  @Property({ fieldName: 'estimated_cost', columnType: 'numeric(18,6)' })
  estimatedCost!: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({ fieldName: 'currency_code', columnType: 'char(3)' })
  currencyCode!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
