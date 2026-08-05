import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `store_health_checks`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'store_health_checks' })
export class StoreHealthChecks {
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
   * Valor de check type mantenido por la instancia.
   */
  @Property({ fieldName: 'check_type', columnType: 'varchar' })
  checkType!: string;

  /**
   * Valor de checked at mantenido por la instancia.
   */
  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @Property({ fieldName: 'latency_ms', columnType: 'int' })
  latencyMs!: number;

  /**
   * Valor de details json mantenido por la instancia.
   */
  @Property({ fieldName: 'details_json', type: 'json', columnType: 'jsonb' })
  detailsJson!: unknown;
}
