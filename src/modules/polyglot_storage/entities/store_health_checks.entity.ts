import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'store_health_checks' })
export class StoreHealthChecks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'storage_backend_region_id', type: 'uuid' }) // FK → polyglot_storage.storage_backend_regions
  storageBackendRegionId!: string;

  @Property({ fieldName: 'check_type', columnType: 'varchar' })
  checkType!: string;

  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'latency_ms', columnType: 'int' })
  latencyMs!: number;

  @Property({ fieldName: 'details_json', type: 'json', columnType: 'jsonb' })
  detailsJson!: unknown;
}
